/**
 * Get the transformed CSS for use in components.
 * This should be called after the integration has been initialized.
 */
export function getFontsCss(
	options: FontsIntegrationOptions = {},
): string {
	const { filter, outputDir = "fonts" } = options;
	const fontsInfo = getFontsPackageInfo();

	if (!fontsInfo || !existsSync(fontsInfo.cssPath)) {
		return "";
	}

	let rawCss = readFileSync(fontsInfo.cssPath, "utf-8");
	rawCss = filterCssFontFaces(rawCss, filter);
	return transformCss(rawCss, outputDir, filter);
}
