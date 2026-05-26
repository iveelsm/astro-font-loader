import assert from "node:assert";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { transformCss } from "../../src/css/transform";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "fixtures");
const loadFixture = (name: string) => readFileSync(join(fixturesDir, name), "utf-8").trim();

describe("transformCss", () => {
	const sampleCss = loadFixture("mixed-quotes.css");

	it("should transform relative URLs to absolute paths with output directory", () => {
		const result = transformCss(sampleCss, "fonts");

		assert.ok(result.includes('url("/fonts/Roboto-Regular.woff2")'));
		assert.ok(result.includes('url("/fonts/OpenSans-Bold.woff2")'));
	});

	it("should use custom output directory", () => {
		const result = transformCss(sampleCss, "assets/fonts");

		assert.ok(result.includes('url("/assets/fonts/Roboto-Regular.woff2")'));
		assert.ok(result.includes('url("/assets/fonts/OpenSans-Bold.woff2")'));
	});

	it("should transform all URLs", () => {
		const result = transformCss(sampleCss, "fonts");

		assert.ok(!result.includes("./Roboto/"));
		assert.ok(!result.includes("./OpenSans/"));
	});

	it("should handle CSS with no URLs", () => {
		const css = loadFixture("no-font-face.css");
		const result = transformCss(css, "fonts");

		assert.strictEqual(result, css);
	});

	it("should handle empty CSS", () => {
		const emptyCss = loadFixture("empty.css");
		const result = transformCss(emptyCss, "fonts");
		assert.strictEqual(result, emptyCss);
	});

	it("should handle URLs without quotes", () => {
		const css = loadFixture("unquoted-url.css");
		const result = transformCss(css, "fonts");

		assert.ok(result.includes('url("/fonts/Font.woff2")'));
	});
});
