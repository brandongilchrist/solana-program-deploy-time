# Solana Program Deployment Timestamp Tool

## Overview

The **Solana Program Deployment Timestamp Tool** is a command-line utility designed to fetch the timestamp of the first deployment transaction of a Solana program. It uses the Solana RPC API to gather on-chain data, helping developers and users identify the exact deployment time of any Solana program.

## Features

- **Fetch Deployment Timestamp**: Retrieves the timestamp of the first deployment transaction for a given Solana program.
- **Rate Limiting**: Implements rate limiting to prevent exceeding the request limits imposed by Solana RPC endpoints.
- **Verbose Logging**: Optionally provides detailed output, including connection information, fetched signatures, and transaction details.

## Installation

To install and run the tool, ensure that [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) are installed on your system.

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/brandongilchrist/solana-program-deploy-time.git
   cd solana-program-deploy-time
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

## Usage

Run the tool using the following command:

```bash
npx ts-node src/index.ts get-timestamp <programId> [--verbose]
```

- `<programId>`: The public key of the Solana program for which you want to find the first deployment timestamp.
- `--verbose`: (Optional) Enables verbose logging for detailed output.

### Example

```bash
npx ts-node src/index.ts get-timestamp TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA --verbose
```

This command fetches the first deployment timestamp for the specified Solana program and outputs the result. The `--verbose` flag provides additional information about the process.

## Development

### Prerequisites

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)

### Setup

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/brandongilchrist/solana-program-deploy-time.git
   cd solana-program-deploy-time
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

### Running the Tool

Use the following command during development:

```bash
npx ts-node src/index.ts get-timestamp <programId> [--verbose]
```

### Building for Production

To build the project for production, use:

```bash
npm run build
```

This command compiles the TypeScript code into JavaScript, placing the output in the `dist` directory.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.

### Commit Messages

Use clear and descriptive commit messages. Examples include:
- "Initial implementation: Fetch first deployment timestamp of a Solana program."
- "Add rate limiting and verbose logging for request tracking."

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contact

For questions or issues, please open an issue on the GitHub repository or contact brandongilchrist via GitHub.

---

This README provides a comprehensive guide for users and developers, including installation, usage, development setup, and contribution guidelines. Remember to replace any placeholder information with the actual details specific to your setup.