import { basename } from "node:path";

export function transformCss(
	rawCss: string,
	outputDir: string,
	filter?: (filename: string) => boolean,
): string {
	return rawCss.replace(
		/url\(["']?\.\/([^"')]+)["']?\)/g,
		(match, relativePath) => {
			const filename = basename(relativePath);
			if (filter && !filter(filename)) {
				return match;
			}
			return `url("/${outputDir}/${filename}")`;
		},
	);
}
