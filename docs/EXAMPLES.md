# Example Package Uses

## FontLoader Component

The `FontLoader` component is the recommended way to load fonts. It handles both `@font-face` CSS injection and preload link generation in a single component.

### Basic Usage

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
---
<html>
  <head>
    <FontLoader packages={['@company/design-system-fonts']} />
  </head>
  <body><slot /></body>
</html>
```

### With Filtering

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';

const fontFilter = (filename: string) => {
  const name = filename.toLowerCase();
  return name.includes("hatton") || name.includes("berkeleymono");
};
---
<FontLoader
  packages={['@company/design-system-fonts']}
  filter={fontFilter}
/>
```

### Selective Preloading with Media Queries

Preload only critical fonts, and use media queries to defer non-essential fonts on smaller screens:

```astro
---
import FontLoader from 'astro-font-loader/FontLoader.astro';
import type { PreloadConfig } from 'astro-font-loader';

const fontFilter = (filename: string) =>
  filename.toLowerCase().includes("hatton") ||
  filename.toLowerCase().includes("berkeleymono");

const preloadConfig: PreloadConfig[] = [
  {
    // Always preload the primary body and mono fonts
    filter: (f) => f.includes('hatton-medium') || f.includes('berkeleymono-regular'),
  },
  {
    // Only preload bold weight on desktop
    filter: (f) => f.includes('hatton-bold'),
    media: '(min-width: 641px)',
  },
];
---
<FontLoader
  packages={['@company/design-system-fonts']}
  filter={fontFilter}
  preload={preloadConfig}
/>
```

### Disabling Preloading

If you want only the `@font-face` CSS without any preload links:

```astro
<FontLoader
  packages={['@company/design-system-fonts']}
  preload={false}
/>
```

---

## Advanced: Manual Function Usage

For cases where the `FontLoader` component doesn't fit (e.g., dynamic per-page font loading or custom rendering logic), you can use the underlying functions directly.

### Inline Font CSS in Astro Component

```astro
---
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
---

{fontsCss && <style is:inline set:html={fontsCss} />}
```

### Preload Critical Fonts

```astro
---
import { getFontsPackageInfo, getAvailableFonts } from "astro-font-loader";

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const preloadFonts = packageInfo
  ? getAvailableFonts(packageInfo.fontsDir).filter((font) =>
      [
        "hatton-medium.woff2",
        "berkeleymono-regular.woff2",
        "berkeleymono-italic.woff2",
      ].some((name) => font.filename.toLowerCase().includes(name))
    )
  : [];
---

{
  preloadFonts.map((font) => (
    <link
      rel="preload"
      href={`/fonts/${font.filename}`}
      as="font"
      type="font/woff2"
      crossorigin
    />
  ))
}
```

### Dynamic Font Loading with Multiple Filters

Load different fonts based on page context:

```astro
---
import { getFontsCss, getFontsPackageInfo } from "astro-font-loader";

const { fontSet = "default" } = Astro.props;

const filters = {
  default: (filename: string) =>
    filename.toLowerCase().includes("hatton-medium"),

  headings: (filename: string) => {
    const name = filename.toLowerCase();
    return name.includes("hatton-bold") || name.includes("hatton-medium");
  },

  code: (filename: string) =>
    filename.toLowerCase().includes("berkeleymono"),
};

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const fontsCss = getFontsCss(
  { filter: filters[fontSet] || filters.default },
  packageInfo,
);
---

{fontsCss && <style is:inline set:html={fontsCss} />}
```

### Combining Integration with Manual Control

Use the integration for build-time copying and manual functions for runtime optimization:

**In `astro.config.ts`:**

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  integrations: [
    fontsIntegration({
      packages: ["@company/design-system-fonts"],
    }),
  ],
});
```

**In your layout component:**

```astro
---
import { getFontsPackageInfo, getAvailableFonts } from "astro-font-loader";

const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const criticalFonts = packageInfo
  ? getAvailableFonts(packageInfo.fontsDir)
      .filter(font => font.filename.includes("hatton-medium"))
      .slice(0, 2)
  : [];
---

<html>
  <head>
    {criticalFonts.map((font) => (
      <link
        rel="preload"
        href={`/fonts/${font.filename}`}
        as="font"
        type="font/woff2"
        crossorigin
      />
    ))}
  </head>
  <body>
    <slot />
  </body>
</html>
```
