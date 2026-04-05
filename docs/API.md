# API Reference

## Core Functions

### `fontsIntegration(options)`

Creates an Astro integration for automatic font loading during the build process.

#### Parameters

- **`options`**: `FontsIntegrationOptions`
  - **`packages`** (required): `string[]` - Array of npm package names containing fonts to load. Each package should export fonts with a standard structure including `src/index.css`.
  - **`filter`** (optional): `(filename: string) => boolean` - Function to filter which font files to include. Receives the font filename and should return `true` to include the font. If not provided, all fonts from the specified packages are copied.
  - **`outputDir`** (optional): `string` - Output directory name within the build folder. Defaults to `"fonts"`.

#### Returns

`AstroIntegration` - An Astro integration object that hooks into the build process.

#### Example

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

const fontFilter = (filename: string) => {
  const name = filename.toLowerCase();
  return name.includes("hatton") || name.includes("berkeleymono");
};

export default defineConfig({
  integrations: [
    fontsIntegration({
      packages: ["@company/design-system-fonts"],
      filter: fontFilter,
      outputDir: "fonts",
    }),
  ],
});
```

---

### `getFontsPackageInfo(packageName, root?)`

Retrieves information about a font package, including its directory and CSS file path.

#### Parameters

- **`packageName`**: `string` - The name of the font package to resolve (e.g., `"@company/design-system-fonts"`).
- **`root`** (optional): `URL | string` - Optional root directory to resolve packages from. Can be a URL or file path.

#### Returns

`FontsPackageInfo | null` - An object containing the fonts directory and CSS file path, or `null` if the package cannot be resolved.

```typescript
type FontsPackageInfo = {
  fontsDir: string;  // Directory containing font files
  cssPath: string;   // Path to the CSS file for the font package
};
```

#### Example

```typescript
import { getFontsPackageInfo } from 'astro-font-loader';

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
if (packageInfo) {
  console.log('Fonts directory:', packageInfo.fontsDir);
  console.log('CSS path:', packageInfo.cssPath);
}
```

---

### `getAvailableFonts(fontsDir)`

Scans a fonts directory and returns an array of all available font files with their metadata.

#### Parameters

- **`fontsDir`**: `string` - The root directory containing font files (expects a `src` subdirectory).

#### Returns

`FontInfo[]` - Array of font information objects.

```typescript
type FontInfo = {
  filename: string;      // Name of the font file (e.g., "hatton-medium.woff2")
  sourcePath: string;    // Absolute path to the font file on disk
  relativePath: string;  // Path relative to the package
};
```

#### Example

```typescript
import { getFontsPackageInfo, getAvailableFonts } from 'astro-font-loader';

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
if (packageInfo) {
  const fonts = getAvailableFonts(packageInfo.fontsDir);
  fonts.forEach(font => {
    console.log(`Found font: ${font.filename}`);
  });
}
```

---

### `getFontsCss(options, fontPackageInfo)`

Loads, filters, and transforms the CSS for `@font-face` rules from a font package.

#### Parameters

- **`options`**: `GetFontsCssOptions` (optional) - Configuration options:
  - **`filter`** (optional): `(filename: string) => boolean` - Filter function to select specific fonts.
  - **`outputDir`** (optional): `string` - Output directory name. Defaults to `"fonts"`.
- **`fontPackageInfo`**: `FontsPackageInfo | null` - Font package information obtained from `getFontsPackageInfo()`.

#### Returns

`string` - The processed CSS string containing `@font-face` declarations, or an empty string if the CSS file is missing or no package info is provided.

#### Example

```typescript
import { getFontsCss, getFontsPackageInfo } from "astro-font-loader";

const fontFilter = (filename: string) => {
  const name = filename.toLowerCase();
  return name.includes("hatton") || name.includes("berkeleymono");
};

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const fontsCss = getFontsCss(
  { filter: fontFilter },
  packageInfo,
);

// Use in Astro component
```

---

## Components

### `FontLoader`

An Astro component that generates `<link rel="preload">` tags and inline `@font-face` CSS. Use alongside the integration — the integration copies fonts at build time, while the component injects the HTML to load them.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<FontLoader packages={['@company/design-system-fonts']} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `packages` | `string[]` | (required) | Font package names to load |
| `filter` | `(filename: string) => boolean` | `undefined` | Filter function to select font files for CSS |
| `outputDir` | `string` | `"fonts"` | Output directory name in generated URLs |
| `preload` | `boolean \| PreloadConfig[]` | `true` | Whether/how to generate preload link tags |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

---

## Types

### `PreloadConfig`

Configuration for selective font preloading with optional media queries.

```typescript
import type { PreloadConfig } from 'astro-font-loader';
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `filter` | `(filename: string) => boolean` | Yes | Filter to select which fonts to preload |
| `media` | `string` | No | Media query for the preload link (e.g., `"(min-width: 641px)"`) |

#### Example

```typescript
import type { PreloadConfig } from 'astro-font-loader';

const preloadConfig: PreloadConfig[] = [
  {
    filter: (f) => f.includes('roboto-regular'),
  },
  {
    filter: (f) => f.includes('roboto-bold'),
    media: '(min-width: 641px)',
  },
];
```
