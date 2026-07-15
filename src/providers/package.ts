import { getFontsCss } from "../css/get.ts";
import { getAvailableFonts } from "../fonts/available.ts";
import { getFontsPackageInfo } from "../fonts/package.ts";
import type { FontVariant, PackageProvider } from "../types.ts";
import type { FontProvider } from "./index.ts";

/**
 * Creates a font provider that resolves fonts from an installed npm package.
 *
 * Returns null if the package cannot be found.
 */
export function createPackageProvider(source: PackageProvider, root?: URL | string): FontProvider | null {
	const packageInfo = getFontsPackageInfo(source.package, root, source.styleFile);
	if (!packageInfo) {
		return null;
	}

	const allFonts = getAvailableFonts(packageInfo.fontsDir);

	return {
		resolveVariant(variant: FontVariant, outputDirectory: string) {
			const result = getFontsCss({ name: variant.name, variants: [variant], outputDirectory }, packageInfo);
			const matchedFonts = allFonts.filter((f) => result.filenames.includes(f.filename));
			return { css: result.css, fonts: matchedFonts };
		},
	};
}
