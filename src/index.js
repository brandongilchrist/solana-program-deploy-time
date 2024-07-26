"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.delay = void 0;
const web3_js_1 = require("@solana/web3.js");
const yargs_1 = __importDefault(require("yargs"));
const helpers_1 = require("yargs/helpers");
const p_limit_1 = __importDefault(require("p-limit"));
// Constants
const REQUEST_INTERVAL_MS = 8000; // 8 seconds
const MAX_RETRIES = 5;
const BPF_LOADER_PROGRAM_ID = 'BPFLoader1111111111111111111111111111111111';
// Initialize rate limit function
const limit = (0, p_limit_1.default)(1);
// Function to delay execution
const delay = (ms) => new Promise(res => setTimeout(res, ms));
exports.delay = delay;
/**
 * Fetches the earliest deployment timestamp for a given Solana program ID.
 * @param programId - The public key of the Solana program.
 * @param verbose - If true, enables verbose logging.
 */
async function getFirstDeploymentTimestamp(programId, verbose = false) {
    const connection = new web3_js_1.Connection((0, web3_js_1.clusterApiUrl)('mainnet-beta'), 'confirmed');
    logVerbose(`Connected to Solana mainnet-beta with endpoint: ${connection.rpcEndpoint}`, verbose);
    logVerbose(`Request interval set to: ${REQUEST_INTERVAL_MS}ms`, verbose);
    const publicKey = new web3_js_1.PublicKey(programId);
    logVerbose(`Converted program ID to PublicKey: ${publicKey.toString()}`, verbose);
    let before = undefined;
    let earliestDeploymentSignature = undefined;
    let totalSignaturesFetched = 0;
    let retries = 0;
    while (true) {
        try {
            const signatures = await fetchSignatures(connection, publicKey, before);
            if (signatures.length === 0) {
                logVerbose('No more signatures found.', verbose);
                break;
            }
            logVerbose(`Processing ${signatures.length} fetched signatures...`, verbose);
            for (const signature of signatures) {
                logVerbose(`Checking transaction with signature: ${signature.signature}`, verbose);
                const transactionDetails = await fetchTransactionDetails(connection, signature.signature);
                if (transactionDetails && isProgramDeployment(transactionDetails.transaction.message.instructions)) {
                    logVerbose(`Deployment transaction found: ${signature.signature}`, verbose);
                    earliestDeploymentSignature = signature.signature;
                    break;
                }
                else {
                    logVerbose(`Transaction ${signature.signature} is not a deployment transaction.`, verbose);
                }
            }
            if (earliestDeploymentSignature) {
                logVerbose(`Earliest deployment signature found: ${earliestDeploymentSignature}`, verbose);
                break;
            }
            before = signatures[signatures.length - 1].signature;
            totalSignaturesFetched += signatures.length;
            logVerbose(`Fetched ${signatures.length} signatures, total so far: ${totalSignaturesFetched}`, verbose);
            await (0, exports.delay)(REQUEST_INTERVAL_MS);
        }
        catch (error) {
            if (handleRetryableError(error, retries, verbose))
                retries += 1;
            else
                throw error;
        }
    }
    if (!earliestDeploymentSignature) {
        console.error('No deployment transaction found.');
        return;
    }
    await logDeploymentTimestamp(connection, earliestDeploymentSignature, verbose);
}
/**
 * Fetches transaction signatures for a given public key.
 */
async function fetchSignatures(connection, publicKey, before) {
    return await limit(() => connection.getSignaturesForAddress(publicKey, { before, limit: 1000 }));
}
/**
 * Fetches transaction details for a given signature.
 */
async function fetchTransactionDetails(connection, signature) {
    return await limit(() => connection.getTransaction(signature, { maxSupportedTransactionVersion: 0 }));
}
/**
 * Checks if the transaction contains program deployment instructions.
 */
function isProgramDeployment(instructions) {
    for (const instruction of instructions) {
        if (instruction.programId.toString() === BPF_LOADER_PROGRAM_ID) {
            return true;
        }
    }
    return false;
}
/**
 * Handles retryable errors, applying exponential backoff if necessary.
 */
function handleRetryableError(error, retries, verbose) {
    if (error instanceof Error && error.message.includes('429') && retries < MAX_RETRIES) {
        const delayTime = Math.pow(2, retries) * REQUEST_INTERVAL_MS;
        console.error(`Rate limit hit. Retrying after ${delayTime}ms...`);
        logVerbose(`Retry attempt ${retries + 1} after hitting rate limit. Delaying for ${delayTime}ms.`, verbose);
        await (0, exports.delay)(delayTime);
        return true;
    }
    return false;
}
/**
 * Logs the deployment timestamp if available.
 */
async function logDeploymentTimestamp(connection, signature, verbose) {
    const transactionDetails = await fetchTransactionDetails(connection, signature);
    if (transactionDetails?.blockTime === null || transactionDetails?.blockTime === undefined) {
        console.warn('Block time is unavailable for the earliest deployment transaction.');
        return;
    }
    const timestamp = new Date(transactionDetails.blockTime * 1000).toISOString();
    if (verbose) {
        console.log(`Program deployment timestamp: ${timestamp}`);
    }
    else {
        console.log(timestamp);
    }
}
/**
 * Logs a message if verbose mode is enabled.
 */
function logVerbose(message, verbose) {
    if (verbose)
        console.log(message);
}
// Command-line interface setup
(0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
    .command('get-timestamp <programId>', 'Get the first deployment timestamp of a Solana program', (yargs) => {
    yargs.positional('programId', {
        describe: 'The public key of the program',
        type: 'string',
    });
}, (argv) => {
    getFirstDeploymentTimestamp(argv.programId, argv.verbose);
})
    .option('verbose', {
    alias: 'v',
    type: 'boolean',
    description: 'Run with verbose logging',
})
    .demandCommand(1)
    .help()
    .argv;
