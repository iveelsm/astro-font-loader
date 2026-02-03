function getFontsPackageInfo(): { fontsDir: string; cssPath: string } | null {
	try {
		const fontsPackagePath = require.resolve("@iveelsm/fonts/package.json");
		const fontsDir = dirname(fontsPackagePath);
		const cssPath = join(fontsDir, "src", "index.css");
		return { fontsDir, cssPath };
	} catch {
		return null;
	}
}
