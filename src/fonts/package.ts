import { dirname, join } from "node:path";

import { FontsPackageInfo } from "./fontInfo";

/**
 * Retrieves font package information for a given package name.
 *
 * Resolves the path to the package.json of the specified font package, then constructs the directory and CSS file path.
 * Returns null if the package cannot be resolved.
 *
 * @param {string} fontsPackage - The name of the font package to resolve.
 * @returns {FontsPackageInfo | null} An object containing the fonts directory and CSS file path, or null if not found.
 */
export function getFontsPackageInfo(
	fontsPackage: string,
): FontsPackageInfo | null {
	try {
		const fontsPackagePath = require.resolve(
			`${fontsPackage}/package.json`,
		);
		const fontsDir = dirname(fontsPackagePath);
		const cssPath = join(fontsDir, "src", "index.css");
		return { fontsDir, cssPath };
	} catch {
		return null;
	}
}
