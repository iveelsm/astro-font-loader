import { FontInfo } from "./fontInfo";

export function getAvailableFonts(fontsDir: string): FontInfo[] {
	const srcDir = join(fontsDir, "src");
	if (!existsSync(srcDir)) {
		return [];
	}

	const fonts: FontInfo[] = [];
	const entries = readdirSync(srcDir, { withFileTypes: true });

	for (const entry of entries) {
		if (entry.isDirectory()) {
			// Scan subdirectories for font files
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
			// Font file directly in src
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
 * Get a list of available font filenames from the @iveelsm/fonts package.
 */
export function getAvailableFontNames(): string[] {
	const fontsInfo = getFontsPackageInfo();
	if (!fontsInfo) {
		return [];
	}
	return getAvailableFonts(fontsInfo.fontsDir).map((f) => f.filename);
}
