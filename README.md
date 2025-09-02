# King-God-Castle-Toolkit

## Overview

King-God-Castle-Toolkit is a powerful and versatile toolkit designed to enhance your experience with the King God Castle game. This project provides various tools and utilities to help players optimize their gameplay, manage resources, and explore game data efficiently.

## Features

- **Game Data Analysis**: Tools to analyze and extract game data.
- **Resource Management**: Utilities to manage in-game resources effectively.
- **Cross-Platform Support**: Compatible with Linux, Windows, and macOS.
- **Customizable Components**: Modular design for easy customization and extension.

## Project Structure

```
King-God-Castle-Toolkit/
├── src/                # Source code for the application
├── src-tauri/          # Tauri integration for building desktop apps
├── components/         # Reusable UI components
├── public/             # Static assets
├── styles/             # Global styles
├── package.json        # Project dependencies and scripts
├── .gitattributes      # Git LFS and file tracking configuration
├── .github/            # GitHub workflows and Dependabot configuration
```

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

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a detailed description of your changes.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.

## Acknowledgments

- Thanks to the King God Castle community for their support and feedback.
- Built with [Tauri](https://tauri.app/) and [Next.js](https://nextjs.org/).

---

Feel free to open an issue if you encounter any problems or have suggestions for new features!
