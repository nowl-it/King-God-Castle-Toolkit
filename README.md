# King-God-Castle-Toolkit

## Overview

King-God-Castle-Toolkit is a powerful and versatile toolkit designed to enhance your experience with the King God Castle game. This project provides various tools and utilities to help players optimize their gameplay, manage resources, and explore game data efficiently.

## Features

- **Hero Editor**: Advanced hero management system with skin and avatar support
  - Browse and manage game heroes
  - Multi-color skin system support
  - Real-time avatar preview and switching
  - Professional logging system
- **Game Data Analysis**: Tools to analyze and extract game data
- **Resource Management**: Utilities to manage in-game resources effectively
- **Auto-Updates**: Built-in updater system for seamless app updates
- **Cross-Platform Support**: Compatible with Linux, Windows, and macOS
- **Customizable Components**: Modular design for easy customization and extension

## Project Structure

```text
King-God-Castle-Toolkit/
├── src/                # Source code for the application
│   ├── app/           # Next.js app directory
│   ├── components/    # Reusable UI components
│   ├── hooks/         # Custom React hooks
│   ├── store/         # Zustand state management
│   └── utils/         # Utility functions and logging
├── src-tauri/          # Tauri integration for building desktop apps
├── public/             # Static assets
├── scripts/            # Build and deployment scripts
├── package.json        # Project dependencies and scripts
├── .gitattributes      # Git LFS and file tracking configuration
└── .github/            # GitHub workflows and Dependabot configuration
```

## Technology Stack

- **Frontend**: Next.js 15.5.2 with Turbopack, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Lucide icons
- **State Management**: Zustand with persistence
- **Desktop App**: Tauri v2 with Rust backend
- **Package Manager**: PNPM
- **Deployment**: GitHub Actions with multi-platform builds

## Prerequisites

- **Node.js**: Ensure you have Node.js installed (v16 or higher).
- **pnpm**: Install pnpm for managing dependencies.
- **Rust**: Required for building the Tauri application.

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

### Development

To start the development server:

```bash
pnpm dev
```

### Build

To build the project for production:

```bash
pnpm build
```

### Tauri Desktop App

To build the Tauri desktop application:

```bash
pnpm tauri build
```

## Hero Editor

The hero editor provides comprehensive tools for managing game heroes:

### Key Features

- **Hero Management**: Browse heroes from `Assets/01_Fx/1_Hero/` directory
- **Avatar System**: Automatic avatar loading from combined textures or unit images
- **Skin Support**: Multi-color skin system with automatic discovery
- **Real-time Preview**: Live preview of selected skins and colors
- **Cache System**: Intelligent caching for improved performance
- **Professional Logging**: Structured logging system for debugging

### Supported File Formats

- **Hero Folders**: `Fx_001 (Knight)`, `Fx_002 (Archer)`, etc.
- **Avatar Assets**: `Avatar_*.asset` files in `Assets/02_UI/UI_Avatar/`
- **Skin Images**: `Unit_<heroId>_<skinId>_<colorId>.png` in `Assets/00_Unit/#Image/`
- **Default Skins**: `Unit_<heroId>.png` for base hero appearance

## Auto-Updates

The application includes built-in auto-update functionality:

### Setup for Developers

1. Generate signing keys:

    ```bash
    ./scripts/generate-updater-keys.sh
    ```

2. Add GitHub secrets:
   - `TAURI_SIGNING_PRIVATE_KEY`: Private key content
   - `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Key password (if set)

3. The updater will automatically check for updates on app start

### Update Distribution

Updates are distributed through GitHub Releases with signed artifacts for security.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Thanks to the King God Castle community for their support and feedback
- Built with [Tauri](https://tauri.app/) and [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

---

For detailed documentation, visit our [GitHub repository](https://github.com/nowl-it/King-God-Castle-Toolkit).

Feel free to open an issue if you encounter any problems or have suggestions for new features!
