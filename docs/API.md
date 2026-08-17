# API Reference

## Integration

### `fontsIntegration(config)`

Creates an Astro integration for automatic font loading during the build process.

#### Parameters

- **`config`**: `FontLoaderConfig`
  - **`outputDirectory`** (required): `string` - Output directory name within the build folder for copied font files.
  - **`fonts`** (required): `FontConfig[]` - Array of font family configurations to load.

#### Returns

- **`AstroIntegration`**: An Astro integration object that hooks into the build process.

#### Example

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  integrations: [
    fontsIntegration({
      outputDirectory: "fonts",
      fonts: [
        {
          family: "Berkeley Mono",
          source: { type: "package", package: "@company/design-system-fonts" },
          variants: [
            { name: "Berkeley Mono v2 Variable", weight: [100, 900], styles: ["normal", "oblique"] },
          ],
        },
      ],
    }),
  ],
});
```

---

## Components

### `FontLoader`

An Astro component that generates `<link rel="preload">` tags and inline `@font-face` CSS. Use alongside the integration — the integration copies fonts at build time, while the component injects the HTML to load them.

The component matches `@font-face` rules from the package CSS by `font-family`, `font-weight`, and `font-style`, then inlines the matched CSS and optionally emits preload links.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<FontLoader
  fonts={[
    {
      family: "Roboto",
      source: { type: "package", package: "@company/design-system-fonts" },
      variants: [
        { name: "Roboto", weight: 400, styles: ["normal"] },
        { name: "Roboto", weight: 700, styles: ["normal"] },
      ],
    },
  ]}
  outputDirectory="fonts"
  preload={[
    { variant: "Roboto" },
  ]}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fonts` | `FontConfig[]` | (required) | Font configurations to load |
| `outputDirectory` | `string` | (required) | Output directory name in generated URLs |
| `preload` | `PreloadEntry[]` | `[]` | Variants to preload, matched by CSS font-family name |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

#### `PreloadEntry`

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `variant` | `string` | Yes | CSS font-family name to match for preloading |
| `weight` | `number \| [number, number]` | No | Narrow to a specific weight. Omit to match all weights for this variant |
| `styles` | `string[]` | No | Narrow to specific styles. Omit to match all styles for this variant |
| `media` | `string` | No | Media query for the preload link (e.g., `"(min-width: 641px)"`) |

#### Output

The component renders:
1. A `<link rel="preload">` tag for each matched font file whose variant appears in `preload`
2. An inline `<style>` tag containing the matched and transformed `@font-face` CSS

Fonts not listed in `preload` still get their `@font-face` CSS injected — they load normally without being preloaded.

Duplicate font files (e.g., a variable font serving both `normal` and `oblique` styles) are automatically deduplicated in preload output.

---

## Types

### `FontLoaderConfig`

Top-level configuration for the integration.

```typescript
type FontLoaderConfig = {
  outputDirectory: string; // location to output the provider sourced font files
  fonts: FontConfig[];     // font configuration to retrieve
};
```

### `FontConfig`

Configuration for a single font family.

```typescript
type FontConfig = {
  family: string;          // family name, should match font-family in the CSS
  source: FontSource;      // location to derive the font file from
  variants: FontVariant[]; // variants of the font to download
};
```

### `FontSource`

Font source provider. Currently only supports package providers, but will be extended with local and network providers.

```typescript
import type { FontSource, PackageProvider } from 'astro-font-loader';

type FontSource = PackageProvider;

type PackageProvider = {
  type: "package";
  package: string;
  styleFile?: string; // Defaults to "src/index.css"
};
```

### `FontVariant`

A specific font variant to load. The `name` is matched case-insensitively against the `font-family` property in `@font-face` CSS rules. The `weight` and `styles` further narrow which rules match.

```typescript
import type { FontVariant } from 'astro-font-loader';

type FontVariant = {
  name: string;
  weight: number | [number, number];  // single value or range for variable fonts
  styles: string[];                   // font styles to match, e.g. ["normal", "italic"]
  formats?: string[];                 // Defaults to ["woff2"]
};
```
