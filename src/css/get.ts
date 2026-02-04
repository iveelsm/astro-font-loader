import { existsSync, readFileSync } from "node:fs";
import { FontsIntegrationOptions } from "../integrationOptions";
import { filterCssFontFaces } from "./filter";
import { transformCss } from "./transform";
import { FontsPackageInfo } from "../fonts";

export function getFontsCss(
	options: FontsIntegrationOptions = {},
	fontPackageInformation: FontsPackageInfo | null,
): string {
	const { filter, outputDir = "fonts" } = options;
	if (!fontPackageInformation || !existsSync(fontPackageInformation.cssPath)) {
		return "";
	}

	let rawCss = readFileSync(fontPackageInformation.cssPath, "utf-8");
	rawCss = filterCssFontFaces(rawCss, filter);
	return transformCss(rawCss, outputDir, filter);
}
