import assert from "node:assert";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { transformNetworkCss } from "../../src/css/transformNetwork";
import type { FontInfo } from "../../src/fonts/fontInfo";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");
const loadFixture = (name: string) =>
	readFileSync(join(fixturesDir, name), "utf-8").trim();

describe("transformNetworkCss", () => {
	it("should replace absolute font URLs with local paths", () => {
		const css = `@font-face { src: url("https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2"); }`;
		const fonts: FontInfo[] = [
			{
				filename: "Roboto-Regular.woff2",
				sourcePath: "/cache/Roboto-Regular.woff2",
				relativePath: "Roboto-Regular.woff2",
				sourceUrl:
					"https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2",
			},
		];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes('url("/fonts/Roboto-Regular.woff2")'));
		assert.ok(!result.includes("https://"));
	});

	it("should handle multiple fonts", () => {
		const css = loadFixture("network-fonts.css");
		const fonts: FontInfo[] = [
			{
				filename: "Roboto-Regular.woff2",
				sourcePath: "/cache/Roboto-Regular.woff2",
				relativePath: "Roboto-Regular.woff2",
				sourceUrl:
					"https://fonts.gstatic.com/s/roboto/v30/Roboto-Regular.woff2",
			},
			{
				filename: "Roboto-Bold.woff2",
				sourcePath: "/cache/Roboto-Bold.woff2",
				relativePath: "Roboto-Bold.woff2",
				sourceUrl:
					"https://fonts.gstatic.com/s/roboto/v30/Roboto-Bold.woff2",
			},
			{
				filename: "OpenSans-Regular.woff2",
				sourcePath: "/cache/OpenSans-Regular.woff2",
				relativePath: "OpenSans-Regular.woff2",
				sourceUrl:
					"https://fonts.gstatic.com/s/opensans/v40/OpenSans-Regular.woff2",
			},
		];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes('url("/fonts/Roboto-Regular.woff2")'));
		assert.ok(result.includes('url("/fonts/Roboto-Bold.woff2")'));
		assert.ok(result.includes('url("/fonts/OpenSans-Regular.woff2")'));
		assert.ok(!result.includes("https://"));
	});

	it("should use custom output directory", () => {
		const css = `@font-face { src: url("https://example.com/Font.woff2"); }`;
		const fonts: FontInfo[] = [
			{
				filename: "Font.woff2",
				sourcePath: "/cache/Font.woff2",
				relativePath: "Font.woff2",
				sourceUrl: "https://example.com/Font.woff2",
			},
		];

		const result = transformNetworkCss(css, "assets/fonts", fonts);
		assert.ok(result.includes('url("/assets/fonts/Font.woff2")'));
	});

	it("should not modify URLs for fonts not in the downloaded list", () => {
		const css = `@font-face { src: url("https://example.com/NotDownloaded.woff2"); }`;
		const fonts: FontInfo[] = [];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes("https://example.com/NotDownloaded.woff2"));
	});

	it("should skip fonts without sourceUrl", () => {
		const css = `@font-face { src: url("https://example.com/Font.woff2"); }`;
		const fonts: FontInfo[] = [
			{
				filename: "Font.woff2",
				sourcePath: "/cache/Font.woff2",
				relativePath: "Font.woff2",
			},
		];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes("https://example.com/Font.woff2"));
	});

	it("should handle CSS with no URLs", () => {
		const css = `body { font-family: sans-serif; }`;
		const result = transformNetworkCss(css, "fonts", []);
		assert.strictEqual(result, css);
	});

	it("should handle unquoted URLs", () => {
		const css = `@font-face { src: url(https://example.com/Font.woff2); }`;
		const fonts: FontInfo[] = [
			{
				filename: "Font.woff2",
				sourcePath: "/cache/Font.woff2",
				relativePath: "Font.woff2",
				sourceUrl: "https://example.com/Font.woff2",
			},
		];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes('url("/fonts/Font.woff2")'));
	});

	it("should handle single-quoted URLs", () => {
		const css = `@font-face { src: url('https://example.com/Font.woff2'); }`;
		const fonts: FontInfo[] = [
			{
				filename: "Font.woff2",
				sourcePath: "/cache/Font.woff2",
				relativePath: "Font.woff2",
				sourceUrl: "https://example.com/Font.woff2",
			},
		];

		const result = transformNetworkCss(css, "fonts", fonts);
		assert.ok(result.includes('url("/fonts/Font.woff2")'));
	});
});
