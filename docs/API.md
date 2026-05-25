# API Reference

## Integration

### `fontsIntegration(config)`

Creates an Astro integration for automatic font loading during the build process.

#### Parameters

- **`config`**: `FontLoaderConfig`
  - **`outputDirectory`** (required): `string` - Output directory name within the build folder for copied font files.
  - **`fonts`** (required): `FontConfig[]` - Array of font family configurations to load.

#### Returns

`AstroIntegration` - An Astro integration object that hooks into the build process.

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
            { name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] },
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

An Astro component that generates `<link rel="preload">` tags and inline `@font-face` CSS for a single font variant. Use alongside the integration — the integration copies fonts at build time, while the component injects the HTML to load them.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<FontLoader
  variant={{ name: "Roboto-Regular", weight: 400, styles: ["normal"] }}
  source={{ type: "package", package: "@company/design-system-fonts" }}
  family="Roboto"
  outputDirectory="fonts"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `FontVariant` | (required) | The font variant to load |
| `source` | `FontSource` | (required) | The source provider for this font |
| `family` | `string` | (required) | Font family name |
| `outputDirectory` | `string` | (required) | Output directory name in generated URLs |
| `mode` | `"all" \| "css" \| "preload"` | `"all"` | Controls what is rendered: `"all"` emits both preload links and CSS, `"css"` emits only the `<style>` tag, `"preload"` emits only `<link>` tags |
| `media` | `string` | `undefined` | Media query applied to preload links (only used when mode is `"all"` or `"preload"`) |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

---

## Types

### `FontLoaderConfig`

Top-level configuration for the integration.

```typescript
import type { FontLoaderConfig } from 'astro-font-loader';

type FontLoaderConfig = {
  outputDirectory: string;
  fonts: FontConfig[];
};
```

### `FontConfig`

Configuration for a single font family.

```typescript
import type { FontConfig } from 'astro-font-loader';

type FontConfig = {
  family: string;
  source: FontSource;
  variants: FontVariant[];
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

A specific font variant to load. The `name` is matched case-insensitively against font filenames in the package.

```typescript
import type { FontVariant } from 'astro-font-loader';

type FontVariant = {
  name: string;
  weight: number | [number, number];
  styles: string[];
  formats?: string[]; // Defaults to ["woff2"]
};
```

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Name used to match font filenames (case-insensitive) |
| `weight` | `number \| [number, number]` | Yes | Font weight as a single value or `[min, max]` range for variable fonts |
| `styles` | `string[]` | Yes | Font styles (e.g., `["normal"]`, `["normal", "italic"]`) |
| `formats` | `string[]` | No | File formats to include. Defaults to `["woff2"]` |
