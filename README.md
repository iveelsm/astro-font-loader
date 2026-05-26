# Astro Font Loader

![typescript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![astro](https://img.shields.io/badge/astro-%232C2052.svg?style=for-the-badge&logo=astro&logoColor=white)

`astro-font-loader` hooks into the astro build process to copy selected fonts from installed font packages into the local build artifacts.

> [!NOTE]
> **Why use this instead of the built-in Astro Fonts API?** <br><br>
> `astro-font-loader` was originally designed as a package based font solution, but continues due to two limitations.
>
> The first is that there are *no controls over output file paths.* Astro's built-in font handling places font files in hashed, opaque paths. This makes it difficult to configure [Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link) (`103` responses) or `Link` headers since you can't predict the final font URLs ahead of time. You end up writing a custom build script anyways to create predictable paths in this case.
>
> The second is that there is *no media query support for font loading.* There is no way to conditionally load fonts based on viewport size (e.g., `min-width` media queries). This means all font weights and variants are downloaded on every device, even if they're only used on larger screens.

## Installation

```bash
# Using npm
npm i astro-font-loader

# Using yarn
yarn add astro-font-loader

# Using pnpm
pnpm add astro-font-loader
```

## How It Works

1. **Setup Phase**: During Astro's config setup, the integration:
   - Locates the specified font packages in your `node_modules`
   - Matches `@font-face` rules from the package CSS by `font-family`, `font-weight`, and `font-style`
   - Prepares the list of font files to be copied

2. **Build Phase**: After Astro completes the build:
   - Copies the matched font files to the output directory
   - Ensures fonts are available in your production build

## Usage

### Basic Setup

Add the integration to your `astro.config.mjs` or `astro.config.ts` file. The variant `name` should match the `font-family` value in the package's CSS `@font-face` rules:

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  integrations: [
    fontsIntegration({
      outputDirectory: "fonts",
      fonts: [
        {
          family: "Roboto",
          source: { type: "package", package: "@company/design-system-fonts" },
          variants: [
            { name: "Roboto", weight: 400, styles: ["normal"] },
            { name: "Roboto", weight: 700, styles: ["normal"] },
          ],
        },
      ],
    }),
  ],
});
```

### Multiple Font Families

A single package can provide multiple font families. Each family gets its own entry in the `fonts` array:

```typescript
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
    {
      family: "EB Garamond",
      source: { type: "package", package: "@company/design-system-fonts" },
      variants: [
        { name: "EB Garamond", weight: 600, styles: ["normal"] },
        { name: "EB Garamond", weight: 700, styles: ["normal"] },
      ],
    },
  ],
})
```

### Custom Style File

By default, the integration looks for CSS at `src/index.css` within the package. You can override this with `styleFile`:

```typescript
{
  family: "Custom Font",
  source: {
    type: "package",
    package: "@company/fonts",
    styleFile: "dist/fonts.css",
  },
  variants: [
    { name: "Custom Font", weight: 400, styles: ["normal"] },
  ],
}
```

### FontLoader Component

The `FontLoader` component generates `<link rel="preload">` tags and inline `@font-face` CSS. Use it alongside the integration — the integration copies font files to the build output, while the component injects the HTML needed to load them.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
<html>
  <head>
    <FontLoader
      fonts={[
        {
          family: "Berkeley Mono",
          source,
          variants: [
            { name: "Berkeley Mono v2 Variable", weight: [100, 900], styles: ["normal", "oblique"] },
          ],
        },
        {
          family: "EB Garamond",
          source,
          variants: [
            { name: "EB Garamond", weight: 600, styles: ["normal"] },
            { name: "EB Garamond", weight: 700, styles: ["normal"] },
          ],
        },
      ]}
      outputDirectory="fonts"
      preload={[
        { variant: "Berkeley Mono v2 Variable" },
        { variant: "EB Garamond", weight: 600 },
        { variant: "EB Garamond", weight: 700, media: "(min-width: 641px)" },
      ]}
    />
  </head>
  <body><slot /></body>
</html>
```

#### Selective Preloading with Media Queries

The `preload` prop accepts an array of entries that match variants by their CSS `font-family` name, and optionally by `weight` and `styles` for per-variant granularity. Each entry can include an optional `media` query to conditionally preload fonts based on viewport size:

```typescript
preload={[
  { variant: "Berkeley Mono v2 Variable" },                    // always preload
  { variant: "EB Garamond", weight: 600 },                     // always preload semibold
  { variant: "EB Garamond", weight: 700, media: "(min-width: 641px)" },  // bold on desktop only
]}
```

Fonts matched by an entry in `preload` get a `<link rel="preload">` tag. Fonts not listed in `preload` still get their `@font-face` CSS injected — they load normally without being preloaded.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `fonts` | `FontConfig[]` | (required) | Font configurations to load |
| `outputDirectory` | `string` | (required) | Output directory name in generated URLs |
| `preload` | `PreloadEntry[]` | `[]` | Variants to preload, with optional weight/style narrowing |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

**`PreloadEntry`**

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `variant` | `string` | Yes | CSS font-family name to match for preloading |
| `weight` | `number \| [number, number]` | No | Narrow to a specific weight. Omit to match all weights |
| `styles` | `string[]` | No | Narrow to specific styles. Omit to match all styles |
| `media` | `string` | No | Media query for the preload link |

## Additional Documentation

* [API Reference](./docs/API.md)
* [Examples](./docs/EXAMPLES.md)
