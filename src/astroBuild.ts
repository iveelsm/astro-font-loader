import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "url";

import type { AstroIntegrationLogger } from "astro";

import type { FontInfo } from "./fonts/fontInfo";

/**
 * Handles the build completion phase for font loading.
 *
 * Copies all available font files to the output directory.
 *
 * @param {URL} dir - The build output directory URL.
 * @param {AstroIntegrationLogger} logger - The Astro integration logger for outputting messages.
 * @param {string} outputDir - The output directory name for font files.
 * @param {FontInfo[]} availableFonts - Array of font files to copy.
 */
export function astroBuildDone(
	dir: URL,
	logger: AstroIntegrationLogger,
	outputDir: string,
	availableFonts: FontInfo[],
): void {
	if (availableFonts.length === 0) {
		return;
	}

	const outputPath = fileURLToPath(new URL(outputDir, dir));

	if (!existsSync(outputPath)) {
		mkdirSync(outputPath, { recursive: true });
	}

	for (const font of availableFonts) {
		const destPath = join(outputPath, font.filename);
		try {
			copyFileSync(font.sourcePath, destPath);
			logger.info(`Copied ${font.filename}`);
		} catch (error) {
			logger.error(`Failed to copy ${font.filename}: ${error}`);
		}
	}

	logger.info(
		`Copied ${availableFonts.length} font file(s) to ${outputDir}/`,
	);
}
