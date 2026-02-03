export function transformCss(
	rawCss: string,
	outputDir: string,
	filter?: (filename: string) => boolean,
): string {
	return rawCss.replace(
		/url\(["']?\.\/([^"')]+)["']?\)/g,
		(match, relativePath) => {
			const filename = basename(relativePath);
			// If filter is provided and returns false, keep original (will be removed later)
			if (filter && !filter(filename)) {
				return match;
			}
			return `url("/${outputDir}/${filename}")`;
		},
	);
}
