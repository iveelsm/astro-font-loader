import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "url";

import type { AstroIntegrationLogger } from "astro";

import type { FontInfo } from "./fonts/fontInfo.ts";

/**
 * Handles the build completion phase for font loading.
 *
 * Copies all available font files to the output directory.
 */
export function astroBuildDone(
	dir: URL,
	logger: AstroIntegrationLogger,
	outputDirectory: string,
	availableFonts: FontInfo[],
): void {
	if (availableFonts.length === 0) {
		return;
	}

	const outputPath = fileURLToPath(new URL(outputDirectory, dir));
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

	logger.info(`Copied ${availableFonts.length} font file(s) to ${outputDirectory}/`);
}
