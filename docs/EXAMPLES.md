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
            { name: "Roboto-Regular", weight: 400, styles: ["normal"] },
            { name: "Roboto-Bold", weight: 700, styles: ["normal"] },
          ],
        },
      ],
    }),
  ],
});
```

---

## FontLoader Component

### Loading a Single Font

Each `<FontLoader>` handles one font variant — it resolves the package, filters the matching file, generates the `@font-face` CSS, and emits a preload link.

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<html>
  <head>
    <FontLoader
      variant={{ name: "Roboto-Regular", weight: 400, styles: ["normal"] }}
      source={{ type: "package", package: "@fontsource/roboto" }}
      family="Roboto"
      outputDirectory="fonts"
    />
  </head>
  <body><slot /></body>
</html>
```

### Multiple Fonts with Shared Source

When loading multiple fonts from the same package, extract the source to avoid repetition:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
<html>
  <head>
    <FontLoader
      variant={{ name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] }}
      source={source}
      family="Berkeley Mono"
      outputDirectory="fonts"
    />
    <FontLoader
      variant={{ name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] }}
      source={source}
      family="EB Garamond"
      outputDirectory="fonts"
    />
    <FontLoader
      variant={{ name: "EBGaramond-Bold", weight: 700, styles: ["normal"] }}
      source={source}
      family="EB Garamond"
      outputDirectory="fonts"
    />
  </head>
  <body><slot /></body>
</html>
```

### Responsive Font Loading with Media Queries

Use `mode` and `media` to preload fonts conditionally. For example, preload a bold weight only on desktop while always loading its CSS:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---
<head>
  <!-- Preload: always load the primary fonts -->
  <FontLoader
    variant={{ name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] }}
    source={source}
    family="Berkeley Mono"
    outputDirectory="fonts"
    mode="preload"
  />
  <FontLoader
    variant={{ name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] }}
    source={source}
    family="EB Garamond"
    outputDirectory="fonts"
    mode="preload"
  />

  <!-- Preload: bold weight only on desktop -->
  <FontLoader
    variant={{ name: "EBGaramond-Bold", weight: 700, styles: ["normal"] }}
    source={source}
    family="EB Garamond"
    outputDirectory="fonts"
    mode="preload"
    media="(min-width: 641px)"
  />

  <!-- CSS for all variants -->
  <FontLoader
    variant={{ name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] }}
    source={source}
    family="Berkeley Mono"
    outputDirectory="fonts"
    mode="css"
  />
  <FontLoader
    variant={{ name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] }}
    source={source}
    family="EB Garamond"
    outputDirectory="fonts"
    mode="css"
  />
  <FontLoader
    variant={{ name: "EBGaramond-Bold", weight: 700, styles: ["normal"] }}
    source={source}
    family="EB Garamond"
    outputDirectory="fonts"
    mode="css"
  />
</head>
```

### Composing Font Components

For cleaner layouts, wrap your font loading in dedicated components:

**`src/components/fonts/fonts.astro`** — CSS only:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---

<FontLoader
  variant={{ name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] }}
  source={source}
  family="Berkeley Mono"
  outputDirectory="fonts"
  mode="css"
/>
<FontLoader
  variant={{ name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] }}
  source={source}
  family="EB Garamond"
  outputDirectory="fonts"
  mode="css"
/>
<FontLoader
  variant={{ name: "EBGaramond-Bold", weight: 700, styles: ["normal"] }}
  source={source}
  family="EB Garamond"
  outputDirectory="fonts"
  mode="css"
/>
```

**`src/components/fonts/preloadFonts.astro`** — Preload links with media queries:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const source = { type: "package" as const, package: "@company/design-system-fonts" };
---

<FontLoader
  variant={{ name: "BerkeleyMonoV2-Variable", weight: [100, 900], styles: ["normal"] }}
  source={source}
  family="Berkeley Mono"
  outputDirectory="fonts"
  mode="preload"
/>
<FontLoader
  variant={{ name: "EBGaramond-SemiBold", weight: 600, styles: ["normal"] }}
  source={source}
  family="EB Garamond"
  outputDirectory="fonts"
  mode="preload"
/>
<FontLoader
  variant={{ name: "EBGaramond-Bold", weight: 700, styles: ["normal"] }}
  source={source}
  family="EB Garamond"
  outputDirectory="fonts"
  mode="preload"
  media="(min-width: 641px)"
/>
```

**`src/layouts/Layout.astro`** — Compose them:

```astro
---
import { PreloadFonts, Fonts } from '../components/fonts';
---
<html>
  <head>
    <PreloadFonts />
    <Fonts />
  </head>
  <body><slot /></body>
</html>
```

---

## Variable Fonts

Use a weight range for variable fonts:

```typescript
{
  family: "Berkeley Mono",
  source: { type: "package", package: "@company/fonts" },
  variants: [
    {
      name: "BerkeleyMonoV2-Variable",
      weight: [100, 900],        // variable font weight range
      styles: ["normal", "oblique"],
    },
  ],
}
```

## Multiple Formats

By default only `.woff2` files are matched. To include additional formats:

```typescript
{
  family: "Legacy Font",
  source: { type: "package", package: "@company/fonts" },
  variants: [
    {
      name: "LegacyFont-Regular",
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
    { name: "CustomFont-Regular", weight: 400, styles: ["normal"] },
  ],
}
```
