# Example Package Uses

## Inline Font CSS in Astro Component

This example shows how to load and inline font CSS directly in an Astro component:

```astro
---
import { getFontsCss, getFontsPackageInfo } from "astro-font-loader";

// Define a filter for specific fonts
const fontFilter = (filename: string) => {
  const name = filename.toLowerCase();
  return name.includes("hatton") || name.includes("berkeleymono");
};

// Get package information and CSS
const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const fontsCss = getFontsCss(
  { filter: fontFilter },
  packageInfo,
);
---

{fontsCss && <style is:inline set:html={fontsCss} />}
```

This approach is useful when:
- You want to inline critical font CSS directly in the HTML
- You need different fonts on different pages
- You want to reduce HTTP requests by embedding CSS

## Preload Critical Fonts

Preload specific font files to improve performance by loading them early in the page lifecycle:

```astro
---
import { getFontsPackageInfo, getAvailableFonts } from "astro-font-loader";

// Get all available fonts from the package
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
  preloadFonts.length > 0
    ? preloadFonts.map((font) => (
        <link
          rel="preload"
          href={`/fonts/${font.filename}`}
          as="font"
          type="font/woff2"
          crossorigin
        />
      ))
    : null
}
```

Benefits of font preloading:
- Reduces perceived page load time
- Prevents flash of unstyled text (FOUT)
- Improves Core Web Vitals scores

## Dynamic Font Loading with Multiple Filters

Load different fonts based on page context:

```astro
---
import { getFontsCss, getFontsPackageInfo } from "astro-font-loader";

const { fontSet = "default" } = Astro.props;

// Define different filters for different use cases
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

# Combining Integration with Manual Control

Use the integration for build-time copying and manual functions for runtime optimization:

**In `astro.config.ts`:**

```typescript
import { defineConfig } from 'astro/config';
import { fontsIntegration } from 'astro-font-loader';

export default defineConfig({
  integrations: [
    fontsIntegration({
      packages: ["@company/design-system-fonts"],
      // No filter - copy all fonts during build
    }),
  ],
});
```

**In your layout component:**

```astro
---
import { getFontsPackageInfo, getAvailableFonts } from "astro-font-loader";

// At runtime, selectively preload only critical fonts
const packageInfo = getFontsPackageInfo("@company/design-system-fonts");
const criticalFonts = packageInfo
  ? getAvailableFonts(packageInfo.fontsDir)
      .filter(font => font.filename.includes("hatton-medium"))
      .slice(0, 2) // Only preload first 2 matches
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
