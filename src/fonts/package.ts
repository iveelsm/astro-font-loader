import { createRequire } from "module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { FontsPackageInfo } from "./fontInfo.ts";

/**
 * Retrieves font package information for a given package name.
 *
 * Resolves the path to the package.json of the specified font package, then constructs the directory and CSS file path.
 * Returns null if the package cannot be resolved.
 *
 * @param {string} fontsPackage - The name of the font package to resolve.
 * @param {URL | string} [root] - Optional root directory to resolve packages from. Can be a URL or file path.
 * @returns {FontsPackageInfo | null} An object containing the fonts directory and CSS file path, or null if not found.
 */
export function getFontsPackageInfo(
	fontsPackage: string,
	root?: URL | string,
): FontsPackageInfo | null {
	try {
		let requireBase: string;
		if (root) {
			const rootPath = root instanceof URL ? fileURLToPath(root) : root;
			requireBase = join(rootPath, "package.json");
		} else {
			requireBase = import.meta.url;
		}

		const require = createRequire(requireBase);
		const fontsPackagePath = require.resolve(`${fontsPackage}/package.json`);
		const fontsDir = dirname(fontsPackagePath);
		const cssPath = join(fontsDir, "src", "index.css");
		return { fontsDir, cssPath };
	} catch {
		return null;
	}
}
