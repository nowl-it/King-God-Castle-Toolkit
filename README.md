# King God Castle Toolkit

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20Windows-lightgrey)

## Overview

King-God-Castle-Toolkit is a powerful utility designed to enhance your experience with the King God Castle game. This project provides tools to help players download the game and convert assets for Unity.

## Features

### 🛠️ Game Tools

- **Game Installer**: Download specific versions of King God Castle directly.
- **C2U Converter**: Convert game assets to Unity projects for analysis and modification.

### 🎯 Technical Features

- **Auto-Updates**: Cryptographically signed update system via GitHub Releases
- **Cross-Platform Support**: Native desktop apps for Linux and Windows
- **Modern Architecture**: Next.js 15 + Tauri v2 with TypeScript and Rust

## Project Structure

```text
King-God-Castle-Toolkit/
├── src/                # Source code for the application
│   ├── app/           # Next.js app directory
│   ├── components/    # Reusable UI components and providers
│   ├── hooks/         # Custom React hooks
│   ├── lib/           # Utility libraries and helpers
│   ├── store/         # Zustand state management with persistence
│   ├── styles/        # Global CSS and Tailwind configurations
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utility functions, constants, and logging
├── src-tauri/          # Tauri Rust backend
│   ├── src/           # Rust source code
│   ├── binaries/      # External binaries (AssetRipper, etc.)
│   ├── capabilities/  # Tauri security capabilities
│   └── icons/         # Application icons for all platforms
├── public/             # Static assets and JSON data
├── .github/            # GitHub workflows, Dependabot, and documentation
├── .vscode/            # VS Code workspace configuration
└── package.json        # Project dependencies and scripts
```

## Technology Stack

- **Frontend**: Next.js 15.5.2 with Turbopack, React 19, TypeScript, Tailwind CSS 4.1.11
- **UI Components**: shadcn/ui, Radix UI primitives, Lucide icons
- **State Management**: Zustand with persistence, TanStack React Query
- **Desktop App**: Tauri v2.7.0 with Rust backend
- **Package Manager**: PNPM with workspace configuration
- **Development**: Vitest for testing, Biome + ESLint for linting
- **Deployment**: GitHub Actions with multi-platform builds and auto-updates

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (v18 or higher recommended)
- **pnpm**: Install pnpm for managing dependencies and workspaces
- **Rust**: Required for building the Tauri application and Rust backend
- **Git LFS**: Required for handling large binary assets

## Installation

1. Clone the repository:

    ```bash
    git clone https://github.com/nowl-it/King-God-Castle-Toolkit.git
    ```

2. Navigate to the project directory:

    ```bash
    cd King-God-Castle-Toolkit
    ```

3. Install dependencies:

    ```bash
    pnpm install
    ```

## Usage

### Development Commands

```bash
# Start Next.js development server with Turbopack
pnpm dev

# Start Tauri desktop app in development mode
pnpm tauri dev

# Run tests with Vitest
pnpm test

# Lint code with Biome and ESLint
pnpm lint

# Auto-fix linting issues
pnpm fix
```

### Production Build

```bash
# Build Next.js app for production
pnpm build

# Build Tauri desktop application
pnpm tauri build

# Start production server
pnpm start
```

### Tauri Commands

```bash
# Build desktop app for current platform
pnpm tauri build

# Build for specific platform
pnpm tauri build --target x86_64-pc-windows-msvc

# Generate Tauri icons
pnpm tauri icon path/to/icon.png
```

## Auto-Updates

The application includes built-in auto-update functionality using Tauri's updater plugin:

### Update Features

- **Automatic Update Checking**: Updates are checked on application startup
- **Cryptographic Signing**: All updates are signed for security verification
- **GitHub Releases Integration**: Updates are distributed via GitHub Releases
- **Cross-Platform Support**: Works on both Linux and Windows platforms

### Setup for Developers

1. Generate signing keys (if not already done):

    ```bash
    # Generate new keypair for signing updates
    ./scripts/generate-updater-keys.sh
    ```

2. Configure GitHub repository secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: Private key content for signing releases
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key password (if set during generation)

3. The updater automatically:
   - Checks for updates when the app starts
   - Downloads and verifies update signatures
   - Prompts users to install available updates

### Update Distribution

- Updates are built and published through GitHub Actions workflows
- Each release includes signed binaries for supported platforms
- Update manifests are automatically generated and hosted on GitHub

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Thanks to the King God Castle community for their support and feedback
- Built with [Tauri v2](https://tauri.app/) and [Next.js 15](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/) and [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/) and [Simple Icons](https://simpleicons.org/)
- State management with [Zustand](https://zustand-demo.pmnd.rs/)
- Testing with [Vitest](https://vitest.dev/) and code quality with [Biome](https://biomejs.dev/)

---

For detailed documentation, visit our [GitHub repository](https://github.com/nowl-it/King-God-Castle-Toolkit).

Feel free to open an issue if you encounter any problems or have suggestions for new features!
