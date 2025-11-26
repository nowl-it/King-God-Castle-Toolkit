# King God Castle Toolkit - Copilot Instructions

## Project Overview

Next.js 15 + Tauri v2 desktop application for King God Castle game asset management. Combines React 19 frontend with Rust backend to parse Unity assets, manage heroes, and convert APK/XAPK files.

## Critical Architecture Patterns

### Tauri Bridge (Frontend ↔ Rust)

**Always use Rust backend for file operations** - never browser File APIs:

```typescript
// ✅ Correct: invoke Rust command
const exists = await invoke<boolean>('check_path_exists', { path });
const files = await invoke<string[]>('read_directory', { path });
const bytes = await invoke<number[]>('read_file_as_bytes', { path });

// ❌ Wrong: browser APIs don't work in Tauri
fetch(filePath); // Will fail
```

**Error handling pattern**:

```typescript
try {
	await invoke<T>('command_name', { params });
} catch (error) {
	log.error('Context message', 'Component', error);
	toast.error('User-friendly message');
}
```

All Rust commands in `src-tauri/src/lib.rs` use the `tauri::command` attribute. TypeScript types in `src/types/tauri.ts` must mirror Rust structs.

### State Management (Zustand with Persistence)

**Cache-first strategy for expensive operations**:

```typescript
// Check cache before processing
const cachedHero = getCachedHero(heroId);
if (cachedHero && isCacheValid(heroId)) {
	return cachedHero;
}
// Process and cache result
await processHero(hero);
cacheHero(heroId, hero, true);
```

**Store synchronization quirk**: Cross-store updates need `setTimeout(() => {}, 0)` to ensure proper ordering (see `src/store/project/store.ts:92-96`).

Cache TTL: 30 minutes for hero data. Store uses `sessionStorage` for persistence.

### Unity Asset Parsing Pipeline

**Hero directory structure**: `Assets/01_Fx/1_Hero/Fx_<id> (<name>)/`

- Example: `Fx_001 (Knight)`, `Fx_10280 (Dragon)`
- ID format: Remove first/last digit for avatar paths (10280 → 028)

**Skin file naming**:

```
Unit_${heroId}.png                        // Default skin
Unit_${heroId}_${skinId}.png              // Single-color skin
Unit_${heroId}_${skinId}_${colorId}.png   // Multi-color skin variants
Unit_${heroId}_99_${colorId}.png          // Default with color options
```

**Avatar cropping workflow**:

1. Parse `Assets/02_UI/UI_Avatar/Avatar_<id>.asset` for crop coordinates
2. Find combined texture: `Assets/Texture2D/sactx-0-2048x1024-Uncompressed-UI_Avatar-*.png`
3. Crop using `crop_image_from_bytes` Rust command with asset rect
4. Fallback to unit image file if crop fails (Assets/00_Unit directory)
5. Store as base64 data URL in hero state

**Prefab hierarchy parsing** (`src-tauri/src/unity/prefab.rs`):

- Parses Unity YAML to extract GameObjects, Transforms, SpriteRenderers, Animators
- Builds tree structure with sprite base64 embedding
- Handles GUID-based asset references via `.meta` file scanning
- Returns `HierarchyNode` with nested children for visualization

## Development Workflows

### Commands

```bash
pnpm dev           # Next.js dev server (localhost:3000)
pnpm tauri dev     # Full Tauri app with hot reload
pnpm build         # Production Next.js build
pnpm tauri build   # Desktop app installer
pnpm test          # Vitest tests
pnpm lint          # Biome + ESLint
pnpm fix           # Auto-fix linting
```

### Logging System (Context-Aware)

**Use structured logging with context**:

```typescript
import { log, logger } from '@/utils/logger';

// Hero-specific logs (auto-formats context)
log.hero.loading(heroId, 'Loading assets', { skinCount: 5 });
log.hero.error(heroId, 'Parse failed', error);
log.hero.skin(heroId, skinId, 'Color changed', { colorId });

// General logs
log.info('Message', 'Component/Feature', data);
```

Logs persist to files in production via `write_log_entry` Rust command. Development logs to console only.

### Editor UI Pattern (Next.js Parallel Routes)

**VSCode-like layout**: `src/app/editor/layout.tsx`

```
┌─────┬──────────────────────────────┐
│ 16px│ Left Panel  │  Right Panel   │
│ Bar │ (15-40%)    │  (flexible)    │
└─────┴──────────────────────────────┘
```

Parallel routes: `@left_panel/`, `@right_panel/` for independent rendering. Use `ResizablePanelGroup` from shadcn/ui for panels.

## Code Conventions

### Component Patterns

**Async Tauri calls in hooks** (see `src/hooks/useHeroes.ts`):

```typescript
const loadResource = async () => {
	setState((prev) => ({ ...prev, loading: true }));
	try {
		const result = await invoke<T>('rust_command', { params });
		setState((prev) => ({ ...prev, data: result, loading: false }));
	} catch (error) {
		setState((prev) => ({ ...prev, error, loading: false }));
	}
};
```

Always handle loading, data, and error states. Use `void` for fire-and-forget effects.

### Styling (Tailwind + shadcn/ui)

- Dark mode default: `<html className='dark'>`
- Custom components: `src/components/ui/` (Radix primitives)
- Activity bar: `bg-sidebar w-16` with `border-r`
- Panel backgrounds: `bg-sidebar/50` (left), `bg-background` (main)

### Asset Processing

**Image optimization pattern**:

1. Load bytes via `read_file_as_bytes`
2. Process with Rust: `crop_image_from_bytes`, `optimize_image_bytes`
3. Convert to base64: `btoa(String.fromCharCode(...bytes))`
4. Store as data URL: `data:image/png;base64,${base64}`

**GUID resolution** (sprites, textures): Scan `.meta` files in `Assets/**/*.meta` for `guid: <value>`, return corresponding asset path.

## Integration Points

### C2U Tool (APK/XAPK Converter)

**Workflow** (`src-tauri/src/c2u.rs`):

1. Extract XAPK → find `base_assets.apk` + `config.*.apk`
2. Merge APKs → unified asset directory
3. Run AssetRipper (bundled binary in `src-tauri/binaries/asset-ripper/`)
4. Output Unity project structure for parsing

**File limit**: Unix systems need `setrlimit(NOFILE, 16384)` before processing.

### File Watcher (Real-time Updates)

**Pattern** (`src-tauri/src/file_watcher.rs`):

```rust
// Start watching with recursive monitoring
start_watching(path) → emits 'fs-changed' events
// Frontend listens for changes
app_handle.listen('fs-changed', handler)
```

State managed in Rust via `Arc<Mutex<Option<Watcher>>>`. Stop watcher before starting new one.

### Auto-Update (GitHub Releases)

Config: `src-tauri/tauri.conf.json`

```json
{
	"plugins": {
		"updater": {
			"pubkey": "...",
			"endpoints": ["https://github.com/.../latest.json"]
		}
	}
}
```

Checks on startup. Updates signed with minisign. Artifacts created via `createUpdaterArtifacts: true`.

## Testing

- **Frontend**: Vitest + jsdom (`vitest.config.mts`)
- **Rust**: Standard test modules with cfg(test) attribute
- **Integration**: Test Tauri commands via `invoke()` in test environment

## Key Files Reference

- `src-tauri/src/lib.rs` - All Tauri command registrations
- `src/store/project/store.ts` - Hero cache, selection state
- `src/hooks/useHeroes.ts` - Hero loading logic with skin discovery
- `src-tauri/src/unity/prefab.rs` - Prefab parsing (1000+ lines)
- `src/utils/logger.ts` - Structured logging system
- `src/app/editor/layout.tsx` - Parallel routes layout

**Critical**: Always use Rust backend for file I/O. Cache expensive operations. Follow context-aware logging patterns.
