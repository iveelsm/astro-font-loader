# Examples

## Basic Integration Setup

```typescript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  integrations: [
    fontsIntegration({
      outputDirectory: "fonts",
      fonts: [
        {
          family: "Roboto",
          source: { type: "package", package: "@fontsource/roboto" },
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

---

## FontLoader Component

### Basic Usage

A single `<FontLoader>` handles all your fonts — it matches `@font-face` rules from the package CSS by `font-family`, `font-weight`, and `font-style`, inlines the CSS, and emits preload links.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<html>
  <head>
    <FontLoader
      fonts={[
        {
          family: "Roboto",
          source: { type: "package", package: "@fontsource/roboto" },
          variants: [
            { name: "Roboto", weight: 400, styles: ["normal"] },
            { name: "Roboto", weight: 700, styles: ["normal"] },
          ],
        },
      ]}
      outputDirectory="fonts"
      preload={[{ variant: "Roboto" }]}
    />
  </head>
  <body><slot /></body>
</html>
```

### Multiple Families with Shared Source

When loading multiple font families from the same package, extract the source to avoid repetition:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
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
    { variant: "EB Garamond" },
  ]}
/>
```

### Responsive Font Loading with Media Queries

Use `preload` entries with `media` to conditionally preload fonts based on viewport size. Fonts not listed in `preload` still get their `@font-face` CSS — they just won't be preloaded:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
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
    { variant: "EB Garamond", media: "(min-width: 641px)" },
  ]}
/>
```

This outputs:
- A preload link for the Berkeley Mono variable font (always)
- A preload link for EB Garamond fonts (desktop only, via media query)
- Inline `@font-face` CSS for all matched variants

### Wrapping in a Component

For cleaner layouts, wrap your font loading in a dedicated component:

**`src/components/fonts/fonts.astro`**:

```astro
---
import FontLoader from "astro-font-loader/FontLoader.astro";

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---

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
    { variant: "EB Garamond", media: "(min-width: 641px)" },
  ]}
/>
```

**`src/layouts/Layout.astro`**:

```astro
---
import Fonts from '../components/fonts/fonts.astro';
---
<html>
  <head>
    <Fonts />
  </head>
  <body><slot /></body>
</html>
```

---

## Variable Fonts

Variable fonts often serve multiple styles from a single file. Use a weight range and list all styles. Duplicate font files are automatically deduplicated in the output:

```typescript
{
  family: "Berkeley Mono",
  source: { type: "package", package: "@company/fonts" },
  variants: [
    {
      name: "Berkeley Mono v2 Variable",
      weight: [100, 900],
      styles: ["normal", "oblique"],
    },
  ],
}
```

## Multiple Formats

By default only `.woff2` files are included from matched `@font-face` rules. To include additional formats:

```typescript
{
  family: "Legacy Font",
  source: { type: "package", package: "@company/fonts" },
  variants: [
    {
      name: "Legacy Font",
      weight: 400,
      styles: ["normal"],
      formats: ["woff2", "woff", "ttf"],
    },
  ],
}
```

## Custom Style File

If your font package uses a non-standard CSS path:

```typescript
{
  family: "Custom Font",
  source: {
    type: "package",
    package: "@company/fonts",
    styleFile: "dist/fonts.css",  // instead of the default "src/index.css"
  },
  variants: [
    { name: "Custom Font", weight: 400, styles: ["normal"] },
  ],
}
```
