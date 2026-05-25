# Astro Font Loader

![typescript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![astro](https://img.shields.io/badge/astro-%232C2052.svg?style=for-the-badge&logo=astro&logoColor=white)

`astro-font-loader` hooks into the astro build process to copy selected fonts from installed font packages into the local build artifacts.

## Why Use This Instead of Built-in Astro Fonts?

Astro includes built-in font support, but it has limitations that can impact performance optimization. These are exceptional cases and should not be considered standard.

> [!INFO]
> The first is that there are **no controls over output file paths.** Astro's built-in font handling places font files in hashed, opaque paths. This makes it difficult to configure [Early Hints](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Link) (`103` responses) or `Link` headers since you can't predict the final font URLs ahead of time. You end up writing a custom build script anyways to create predictable paths in this case.
> The second is that there is **no media query support for font loading.** There is no way to conditionally load fonts based on viewport size (e.g., `min-width` media queries). This means all font weights and variants are downloaded on every device, even if they're only used on larger screens.

`astro-font-loader` was originally designed as a package based font solution, but continues due to these two limitations.

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
   - Derives a filter from the declared variants to select matching font files
   - Prepares the list of fonts to be copied

2. **Build Phase**: After Astro completes the build:
   - Copies the matched font files to the output directory
   - Transforms CSS imports to reference the copied fonts
   - Ensures fonts are available in your production build

## Usage

### Basic Setup

Add the integration to your `astro.config.mjs` or `astro.config.ts` file:

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
            { name: "Roboto-Regular", weight: 400, styles: ["normal"] },
            { name: "Roboto-Bold", weight: 700, styles: ["normal"] },
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
        { name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] },
      ],
    },
    {
      family: "EB Garamond",
      source: { type: "package", package: "@company/design-system-fonts" },
      variants: [
        { name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] },
        { name: "EBGaramond-Bold", weight: 700, styles: ["normal"] },
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
    { name: "CustomFont-Regular", weight: 400, styles: ["normal"] },
  ],
}
```

### FontLoader Component

The `FontLoader` component generates `<link rel="preload">` tags and inline `@font-face` CSS for individual font variants. Use it alongside the integration — the integration copies font files to the build output, while the component injects the HTML needed to load them.

Each `<FontLoader>` loads a single font variant:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<html>
  <head>
    <FontLoader
      variant={{ name: "Roboto-Regular", weight: 400, styles: ["normal"] }}
      source={{ type: "package", package: "@company/design-system-fonts" }}
      family="Roboto"
      outputDirectory="fonts"
    />
  </head>
  <body><slot /></body>
</html>
```

#### Separating CSS and Preload

Use the `mode` prop to control what the component renders. This is useful when you want CSS and preload links in different locations, or need different `media` queries per variant:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
<!-- Preload links (in <head>, before CSS) -->
<FontLoader
  variant={{ name: "Roboto-Regular", weight: 400, styles: ["normal"] }}
  source={source}
  family="Roboto"
  outputDirectory="fonts"
  mode="preload"
/>
<FontLoader
  variant={{ name: "Roboto-Bold", weight: 700, styles: ["normal"] }}
  source={source}
  family="Roboto"
  outputDirectory="fonts"
  mode="preload"
  media="(min-width: 641px)"
/>

<!-- CSS (after preload links) -->
<FontLoader
  variant={{ name: "Roboto-Regular", weight: 400, styles: ["normal"] }}
  source={source}
  family="Roboto"
  outputDirectory="fonts"
  mode="css"
/>
<FontLoader
  variant={{ name: "Roboto-Bold", weight: 700, styles: ["normal"] }}
  source={source}
  family="Roboto"
  outputDirectory="fonts"
  mode="css"
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `FontVariant` | (required) | The font variant to load |
| `source` | `FontSource` | (required) | The source provider for this font |
| `family` | `string` | (required) | Font family name |
| `outputDirectory` | `string` | (required) | Output directory name in generated URLs |
| `mode` | `"all" \| "css" \| "preload"` | `"all"` | What to render |
| `media` | `string` | `undefined` | Media query for preload links |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

## Additional Documentation

* [API Reference](./docs/API.md)
* [Examples](./docs/EXAMPLES.md)
