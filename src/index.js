import { Connection, PublicKey, clusterApiUrl } from '@solana/web3.js';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import pLimit from 'p-limit';
import fs from 'fs';
import path from 'path';

// Constants
const CACHE_FILE = './cache.json';
const REQUEST_INTERVAL_MS = 6000; // 6 seconds

// Create a limit function with a concurrency of 1 to control the number of parallel connections
const limit = pLimit(1);

// Function to delay execution
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Load cache from file
function loadCache() {
    if (fs.existsSync(CACHE_FILE)) {
        return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    }
    return {};
}

// Save cache to file
function saveCache(cache) {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
}

// Get cached data
function getCachedData(key) {
    const cache = loadCache();
    return cache[key] || null;
}

// Set cached data
function setCachedData(key, value) {
    const cache = loadCache();
    cache[key] = value;
    saveCache(cache);
}

async function getFirstTransactionTimestamp(programId, verbose = false, humanReadable = false, forceRefresh = false) {
    try {
        // Convert the program ID to a PublicKey object
        const publicKey = new PublicKey(programId);
        const cacheKey = `timestamp:${programId}`;
        let cacheData = getCachedData(cacheKey);
        let blockTime = cacheData ? cacheData.blockTime : null;
        let earliestSignature = cacheData ? cacheData.earliestSignature : null;

        if (blockTime && !forceRefresh) {
            if (verbose) {
                console.log(`\nUsing cached blockTime for program ID: ${programId}\n`);
            }
        } else {
            // Connect to the Solana network (mainnet-beta)
            const connection = new Connection(clusterApiUrl('mainnet-beta'), 'confirmed');
            if (verbose) {
                console.log(`\nConnected to Solana mainnet-beta at ${connection.rpcEndpoint}`);
                console.log(`Request interval: ${REQUEST_INTERVAL_MS}ms`);
                console.log(`Converted Program ID: ${publicKey.toString()} to PublicKey\n`);
            }

            let before = undefined;
            let totalSignaturesFetched = 0;
            let retries = 0;
            const maxRetries = 5;

            console.log(`Fetching transaction signatures...`);

            // Paginate through all transaction signatures to find the earliest
            while (true) {
                try {
                    const signatures = await limit(() => connection.getSignaturesForAddress(publicKey, { before, limit: 1000 }));
                    if (signatures.length === 0) {
                        if (totalSignaturesFetched === 0) {
                            throw new Error(`No transactions found for the program ID: ${programId}`);
                        }
                        break; // All transactions have been fetched
                    }

                    // Update the before parameter to the signature of the last fetched transaction
                    before = signatures[signatures.length - 1].signature;
                    earliestSignature = signatures[signatures.length - 1].signature;
                    totalSignaturesFetched += signatures.length;

                    if (verbose) {
                        console.log(`  - Batch ${Math.ceil(totalSignaturesFetched / 1000)}: ${signatures.length} signatures, total fetched: ${totalSignaturesFetched}`);
                    }

                    // Reset retries on successful fetch
                    retries = 0;

                    // Stop if the batch contains fewer than 1000 transactions
                    if (signatures.length < 1000) {
                        break;
                    }

                    // Respect the rate limit by waiting before the next batch
                    await delay(REQUEST_INTERVAL_MS);
                } catch (error) {
                    if (error.message.includes('429')) {
                        // Too many requests, apply exponential backoff
                        if (retries < maxRetries) {
                            const delayTime = Math.pow(2, retries) * REQUEST_INTERVAL_MS; // Exponential backoff
                            console.error(`Server responded with 429 Too Many Requests. Retrying after ${delayTime}ms delay...`);
                            await delay(delayTime);
                            retries += 1;
                        } else {
                            throw new Error('Exceeded maximum retries due to 429 Too Many Requests.');
                        }
                    } else {
                        throw error; // Re-throw other errors
                    }
                }
            }

            if (verbose && earliestSignature) {
                console.log(`\nEarliest transaction signature found: ${earliestSignature}\n`);
            }

            // Retrieve the details of the earliest transaction with rate limiting
            if (earliestSignature) {
                const transactionDetails = await limit(() =>
                    connection.getTransaction(earliestSignature, { maxSupportedTransactionVersion: 0 })
                );
                if (!transactionDetails) {
                    throw new Error('Unable to fetch transaction details.');
                }
                blockTime = transactionDetails.blockTime;

                if (blockTime !== getCachedData(cacheKey)?.blockTime) {
                    setCachedData(cacheKey, { blockTime, earliestSignature });
                    if (verbose) {
                        console.log(`\nUpdated cache for program ID: ${programId}\n`);
                    }
                }
            }
        }

        if (blockTime === null || blockTime === undefined) {
            throw new Error('Block time is unavailable.');
        }

        let timestamp = new Date(blockTime * 1000).toISOString();
        if (humanReadable) {
            timestamp = new Date(blockTime * 1000).toUTCString();
        }

        console.log(`Program ID: ${programId}`);
        console.log(`First Deployment Timestamp: ${timestamp}`);
        console.log(`Solscan link: https://solscan.io/tx/${earliestSignature}`);
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        if (verbose && error.stack) {
            console.error(error.stack);
        }
    }
}

// Define the command-line interface using yargs
yargs(hideBin(process.argv))
    .command(
        'get-timestamp <programId>',
        'Get the first deployment timestamp of a Solana program',
        (yargs) => {
            yargs.positional('programId', {
                describe: 'The public key of the program',
                type: 'string',
            });
        },
        (argv) => {
            getFirstTransactionTimestamp(argv.programId, argv.verbose, argv.humanReadable, argv.forceRefresh);
        }
    )
    .option('verbose', {
        alias: 'v',
        type: 'boolean',
        description: 'Run with verbose logging',
    })
    .option('humanReadable', {
        alias: 'r',
        type: 'boolean',
        description: 'Output the timestamp in a human-readable format',
    })
    .option('forceRefresh', {
        alias: 'f',
        type: 'boolean',
        description: 'Force refresh from the blockchain and update the cache if the value is different',
    })
    .demandCommand(1)
    .help()
    .argv;