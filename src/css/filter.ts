import { basename } from "node:path";

export function filterCssFontFaces(
	css: string,
	filter?: (filename: string) => boolean,
): string {
	if (!filter) {
		return css;
	}

	return css.replace(
		/@font-face\s*\{[^}]*\}/g,
		(match) => {
			const urlMatches = match.matchAll(/url\(["']?\.\/([^"')]+)["']?\)/g);
			for (const urlMatch of urlMatches) {
				const relativePath = urlMatch[1];
				const filename = basename(relativePath);
				if (filter(filename)) {
					return match;
				}
			}
			return "";
		},
	);
}
