# Astro Font Loader

![typescript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![astro](https://img.shields.io/badge/astro-%232C2052.svg?style=for-the-badge&logo=astro&logoColor=white)

`astro-font-loader` hooks into the astro build process to copy selected fonts from installed font packages into the local build artifacts.

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
   - Applies the filter function (if provided) to select fonts
   - Prepares the list of fonts to be copied

2. **Build Phase**: After Astro completes the build:
   - Copies the filtered font files to the output directory
   - Transforms CSS imports to reference the copied fonts
   - Ensures fonts are available in your production build

## Usage

### Basic Setup

Add the integration to your `astro.config.mjs` or `astro.config.ts` file:

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    fontsIntegration({
      packages: ["@company/design-system-fonts"],
    }),
  ],
});
```

### Filtering Fonts

Use the `filter` option to selectively include only specific fonts from your font packages. This is useful when you have a large font library but only need certain fonts for your project:

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

// Define a filter function to select specific fonts
const fontFilter = (filename: string) => {
  const name = filename.toLowerCase();
  return name.includes("hatton") || 
         name.includes("berkeleymono");
};

export default defineConfig({
  site: 'https://example.com',
  integrations: [
    fontsIntegration({
      packages: ["@company/design-system-fonts"],
      filter: fontFilter,
    }),
  ],
});
```

### Custom Output Directory

By default, fonts are copied to a `fonts` directory in your build output. You can customize this:

```typescript
fontsIntegration({
  packages: ["@company/design-system-fonts"],
  filter: fontFilter,
  outputDir: "assets/fonts", // Custom output directory
})
```

### Multiple Font Packages

You can load fonts from multiple packages:

```typescript
fontsIntegration({
  packages: [
    "@company/design-system-fonts",
    "@fontsource/roboto",
    "@custom/typefaces"
  ],
  filter: (filename) => {
    // Only include specific fonts from all packages
    const name = filename.toLowerCase();
    return name.includes("hatton") ||
           name.includes("berkeleymono") ||
           name.includes("roboto-400");
  },
})
```

### FontLoader Component

The library provides a `FontLoader` Astro component that generates `<link rel="preload">` tags and inline `@font-face` CSS for your fonts. Use it alongside the integration — the integration copies font files to the build output, while the component injects the HTML needed to load them.

```astro
---
// src/layouts/Layout.astro
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<html>
  <head>
    <FontLoader packages={['@company/design-system-fonts']} />
  </head>
  <body><slot /></body>
</html>
```

The component accepts the same `filter` and `outputDir` options as the integration:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const fontFilter = (filename: string) =>
  filename.toLowerCase().includes('roboto');
---
<FontLoader
  packages={['@company/design-system-fonts']}
  filter={fontFilter}
  outputDir="assets/fonts"
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `packages` | `string[]` | (required) | Font package names to load |
| `filter` | `(filename: string) => boolean` | `undefined` | Filter function to select font files |
| `outputDir` | `string` | `"fonts"` | Output directory name in generated URLs |
| `preload` | `boolean` | `true` | Whether to generate preload link tags |
| `root` | `string` | `process.cwd()` | Root directory for resolving font packages |

## Additional Documentation

* [API Reference](./docs/API.md)
* [Examples](./docs/EXAMPLES.md)
