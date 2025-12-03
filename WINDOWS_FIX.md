# Fix Windows 64-bit Compatibility Issue

## Problem

The `apkeep.exe` binary in `src-tauri/binaries/` is 32-bit, causing "Unsupported 16-Bit Application" error on 64-bit Windows.

## Solution

### Method 1: Replace with 64-bit apkeep binary

1. Download 64-bit apkeep for Windows:
    - Go to: https://github.com/EFForg/apkeep/releases/latest
    - Download: `apkeep-x86_64-pc-windows-msvc.zip`

2. Replace the binary:

    ```bash
    # Extract the downloaded zip
    # Copy apkeep.exe to src-tauri/binaries/apkeep.exe
    ```

3. Rebuild the application:
    ```bash
    pnpm tauri build
    ```

### Method 2: Build apkeep from source (Alternative)

If pre-built binary is not available:

```bash
# Clone apkeep repository
git clone https://github.com/EFForg/apkeep.git
cd apkeep

# Build for Windows 64-bit
cargo build --release --target x86_64-pc-windows-msvc

# Copy the built binary to your project
cp target/x86_64-pc-windows-msvc/release/apkeep.exe \
   /path/to/King-God-Castle-Toolkit/src-tauri/binaries/
```

## Verification

After replacing the binary, verify it's 64-bit:

### On Linux (before building):

```bash
file src-tauri/binaries/apkeep.exe
# Should show: PE32+ executable (console) x86-64
```

### On Windows:

```powershell
# The app should run without the "Unsupported 16-Bit Application" error
```

## Important Notes

1. **Git LFS**: If using Git LFS for binaries, update the tracking:

    ```bash
    git lfs track "src-tauri/binaries/apkeep.exe"
    ```

2. **File Size**: 64-bit binary will be larger (~5-10 MB vs ~2-3 MB for 32-bit)

3. **Cross-compilation**: When building on Linux for Windows, ensure you have the Windows 64-bit binary in place.

## Testing

After replacement, test the download functionality:

1. Open the app
2. Go to "Download Game" section
3. Select a version and download
4. Verify no compatibility errors appear
