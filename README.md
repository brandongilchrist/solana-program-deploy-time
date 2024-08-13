# Solana First Deployment Timestamp Program

This program fetches the timestamp of the first deployment of a Solana program using the program's public key. It is designed to retrieve this information efficiently while minimizing the impact on Solana's network and adhering to rate limits. The program also incorporates a caching mechanism to avoid redundant network requests and improve performance.

## Features

- **Efficient Network Usage:** Adheres to Solana’s rate limits by controlling the concurrency of requests and introducing artificial delays between batches of requests.
- **File-Based Caching:** Stores previously fetched results to avoid redundant network requests and improve performance on subsequent runs.
- **Verbose Output:** Supports multiple levels of verbosity to provide detailed information about the process, including transaction details and progress updates.
- **Human-Readable Output:** Converts timestamps into a human-friendly format for easier interpretation.
- **Error Handling:** Includes robust error handling, particularly for rate-limiting issues, with an exponential backoff strategy.
- **Solscan Integration:** Provides a link to view the earliest transaction on Solscan.

## Installation

To install the dependencies, run:

```bash
npm install
```

## Usage

The program is run via the command line and can be invoked with the following options:

```bash
node src/index.js get-timestamp <programId> [options]
```

### Options

- `<programId>`: The public key of the Solana program.
- `-v, --verbose <level>`: Set the verbosity level (1, 2, or 3).
  - **Level 1**: Basic information (default).
  - **Level 2**: Detailed progress updates.
  - **Level 3**: Full transaction details.
- `-r, --readable`: Display the timestamp in a human-readable format (e.g., "Sun, 11 Aug 2024 18:18:27 GMT").
- `-f, --force-refresh`: Fetch the information from the blockchain even if the cache exists and update the cache if the value is different.
- `-h, --help`: Display help information.

### Example Usage

To fetch the first deployment timestamp for a program with ID `H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF` with a verbose level of 3 and a human-readable timestamp:

```bash
node src/index.js get-timestamp H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF -v 3 -r
```

To force a refresh from the blockchain, bypassing the cache:

```bash
node src/index.js get-timestamp H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF -v 3 -r -f
```

### Sample Output

```bash
❯ node src/index.js get-timestamp H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF -v 3 -r -f

Connected to Solana mainnet-beta at https://api.mainnet-beta.solana.com
Request interval: 6000ms
Converted Program ID: H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF to PublicKey

Fetching transaction signatures...
  - Batch 1: 1000 signatures, total fetched: 1000
  - Batch 2: 1000 signatures, total fetched: 2000
  - Batch 3: 1000 signatures, total fetched: 3000
  - Batch 4: 1000 signatures, total fetched: 4000
  - Batch 5: 1000 signatures, total fetched: 5000
  - Batch 6: 224 signatures, total fetched: 5224

Earliest transaction signature found: 3xnQ2HzuwT9sTdpxUv5rEsp6rA12kYFABZNsjFPiH4PXATtEeFoGB3nVHbMbWLNhevcf35oGFvqbHykD3vfQYmW

Updated cache for program ID: H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF

Program ID: H1AAnXxy712ZKgnhZk8YmRr5GA6VaL2L4R8dnJc4jhGF
First Deployment Timestamp: Sun, 11 Aug 2024 18:18:27 GMT
Solscan link: https://solscan.io/tx/3xnQ2HzuwT9sTdpxUv5rEsp6rA12kYFABZNsjFPiH4PXATtEeFoGB3nVHbMbWLNhevcf35oGFvqbHykD3vfQYmW
```

## Design Decisions

### Concurrency Control with `pLimit`
- **Why**: Solana's RPC nodes impose rate limits to protect the network. By limiting concurrency to a single request at a time, we avoid hitting these limits and ensure the program remains operational.
- **Impact**: This results in slower execution but significantly increases reliability.

### File-Based Caching
- **Why**: Caching allows the program to store previously fetched results, reducing the need for repeated network requests. Given that the first deployment timestamp of a program is immutable, caching is particularly effective.
- **Impact**: The cache reduces network load and improves the program’s responsiveness on subsequent runs.

### Exponential Backoff for Error Handling
- **Why**: When encountering a rate limit error, retrying immediately would likely lead to repeated failures. By using exponential backoff, the program progressively increases the delay between retries, giving the network time to recover.
- **Impact**: This enhances the program's resilience under high network load.

### Modular Design with CLI
- **Why**: Structuring the program as a CLI tool with options for verbosity, human-readable output, and cache management creates a flexible tool that can be used in various scenarios.
- **Impact**: The program is versatile and easy to integrate into different workflows or automated processes.
