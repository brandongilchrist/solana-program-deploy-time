"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFirstTransactionTimestamp = getFirstTransactionTimestamp;
const web3_js_1 = require("@solana/web3.js");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const p_limit_1 = __importDefault(require("p-limit"));
// Create a limit function with a concurrency of 1 to control the number of parallel connections
const limit = (0, p_limit_1.default)(1);
// Function to delay execution
const delay = (ms) => new Promise(res => setTimeout(res, ms));
// Function to get the first transaction timestamp of a Solana program
async function getFirstTransactionTimestamp(programId, verbose = false) {
    try {
        // Connect to the Solana network (mainnet-beta)
        const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('mainnet-beta'), 'confirmed');
        const requestInterval = 8000; // 8 seconds per request to avoid rate limiting
        if (verbose) {
            console.log(`Connected to Solana mainnet-beta with endpoint: ${connection.rpcEndpoint}`);
            console.log(`Request interval set to: ${requestInterval}ms`);
        }
        // Convert the program ID to a PublicKey object
        const publicKey = new web3_js_1.PublicKey(programId);
        if (verbose)
            console.log(`Converted program ID to PublicKey: ${publicKey.toString()}`);
        let before = undefined;
        let earliestSignature = undefined;
        let totalSignaturesFetched = 0;
        let retries = 0;
        const maxRetries = 5;
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
                    console.log(`Fetched ${signatures.length} signatures, total so far: ${totalSignaturesFetched}`);
                }
                // Reset retries on successful fetch
                retries = 0;
                // Stop if the batch contains fewer than 1000 transactions
                if (signatures.length < 1000) {
                    break;
                }
                // Respect the rate limit by waiting before the next batch
                await delay(requestInterval);
            }
            catch (error) {
                if (error instanceof Error && error.message.includes('429')) {
                    // Too many requests, apply exponential backoff
                    if (retries < maxRetries) {
                        const delayTime = Math.pow(2, retries) * requestInterval; // Exponential backoff
                        console.error(`Server responded with 429 Too Many Requests. Retrying after ${delayTime}ms delay...`);
                        await delay(delayTime);
                        retries += 1;
                    }
                    else {
                        throw new Error('Exceeded maximum retries due to 429 Too Many Requests.');
                    }
                }
                else {
                    throw error; // Re-throw other errors
                }
            }
        }
        if (verbose)
            console.log(`Earliest transaction signature: ${earliestSignature}`);
        // Retrieve the details of the earliest transaction with rate limiting
        const transactionDetails = await limit(() => connection.getTransaction(earliestSignature, { maxSupportedTransactionVersion: 0 }));
        if (!transactionDetails) {
            throw new Error('Unable to fetch transaction details.');
        }
        if (verbose)
            console.log(`Fetched transaction details: ${JSON.stringify(transactionDetails)}`);
        const blockTime = transactionDetails.blockTime;
        if (blockTime === null || blockTime === undefined) {
            throw new Error('Block time is unavailable.');
        }
        const timestamp = new Date(blockTime * 1000).toISOString();
        if (verbose) {
            console.log(`Program ID: ${programId}`);
            console.log(`First Deployment Timestamp: ${timestamp}`);
        }
        else {
            console.log(timestamp);
        }
    }
    catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        if (verbose && error instanceof Error && error.stack) {
            console.error(error.stack);
        }
    }
}
// Define the command-line interface using yargs
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('get-timestamp <programId>', 'Get the first deployment timestamp of a Solana program', (yargs) => {
    yargs.positional('programId', {
        describe: 'The public key of the program',
        type: 'string',
    });
}, (argv) => {
    getFirstTransactionTimestamp(argv.programId, argv.verbose);
})
    .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
})
    .demandCommand(1)
    .help()
    .argv;
