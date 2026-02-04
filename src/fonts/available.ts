import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

import type { FontInfo } from "./fontInfo";
import { getFontsPackageInfo } from "./package";

/**
 * Scans the given fonts directory and returns an array of FontInfo objects for all available font files.
 *
 * @param {string} fontsDir - The root directory containing font files (expects a 'src' subdirectory).
 * @returns {FontInfo[]} Array of FontInfo objects for each discovered font file.
 */
export function getAvailableFonts(fontsDir: string): FontInfo[] {
	const srcDir = join(fontsDir, "src");
	if (!existsSync(srcDir)) {
		return [];
	}

	const fonts: FontInfo[] = [];
	const entries = readdirSync(srcDir, { withFileTypes: true });
	for (const entry of entries) {
		if (entry.isDirectory()) {
			const subDirPath = join(srcDir, entry.name);
			const subFiles = readdirSync(subDirPath);
			for (const file of subFiles) {
				if (/\.(woff2?|ttf|otf|eot)$/i.test(file)) {
					fonts.push({
						filename: file,
						sourcePath: join(subDirPath, file),
						relativePath: `${entry.name}/${file}`,
					});
				}
			}
		} else if (/\.(woff2?|ttf|otf|eot)$/i.test(entry.name)) {
			fonts.push({
				filename: entry.name,
				sourcePath: join(srcDir, entry.name),
				relativePath: entry.name,
			});
		}
	}

	return fonts;
}

/**
 * Returns the filenames of all available fonts in the default fonts package.
 *
 * @returns {string[]} Array of font filenames.
 */
export function getAvailableFontNames(): string[] {
	const fontsInfo = getFontsPackageInfo("@iveelsm/fonts");
	if (!fontsInfo) {
		return [];
	}

	return getAvailableFonts(fontsInfo.fontsDir).map((f) => f.filename);
}
