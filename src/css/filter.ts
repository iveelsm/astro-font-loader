export function filterCssFontFaces(
	css: string,
	filter?: (filename: string) => boolean,
): string {
	if (!filter) {
		return css;
	}

	// Remove @font-face blocks that reference filtered-out fonts
	// Match entire @font-face blocks including multi-line content
	return css.replace(
		/@font-face\s*\{[^}]*\}/gs,
		(match) => {
			// Extract all font filenames from this @font-face block
			const urlMatches = match.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g);
			for (const urlMatch of urlMatches) {
				const relativePath = urlMatch[1];
				const filename = basename(relativePath);
				if (filter(filename)) {
					return match; // Keep this @font-face block
				}
			}
			return ""; // Remove this @font-face block
		},
	);
}
