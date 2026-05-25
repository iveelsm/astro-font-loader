import { basename } from "node:path";

/**
 * Transforms font-face URLs in a CSS string to point to a specified output directory.
 *
 * Replaces relative font URLs with absolute URLs based on the output directory.
 */
export function transformCss(rawCss: string, outputDir: string): string {
	return rawCss.replace(
		/url\(["']?\.\/([^"')]+)["']?\)/g,
		(_match, relativePath) => {
			const filename = basename(relativePath);
			return `url("/${outputDir}/${filename}")`;
		},
	);
}
