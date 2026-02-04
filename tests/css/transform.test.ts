import { describe, it } from "node:test";
import assert from "node:assert";
import { transformCss } from "../../src/css/transform";

describe("transformCss", () => {
	const sampleCss = `
@font-face {
	font-family: "Roboto";
	src: url("./Roboto/Roboto-Regular.woff2") format("woff2");
	font-weight: 400;
}
@font-face {
	font-family: "OpenSans";
	src: url('./OpenSans/OpenSans-Bold.woff2') format("woff2");
	font-weight: 700;
}
`.trim();

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

	it("should not transform URLs when filter excludes them", () => {
		const filter = (filename: string) => filename.includes("Roboto");
		const result = transformCss(sampleCss, "fonts", filter);

		assert.ok(result.includes('url("/fonts/Roboto-Regular.woff2")'));
		assert.ok(result.includes("./OpenSans/OpenSans-Bold.woff2"));
	});

	it("should transform all URLs when no filter is provided", () => {
		const result = transformCss(sampleCss, "fonts");

		assert.ok(!result.includes("./Roboto/"));
		assert.ok(!result.includes("./OpenSans/"));
	});

	it("should handle CSS with no URLs", () => {
		const css = "body { font-family: sans-serif; }";
		const result = transformCss(css, "fonts");

		assert.strictEqual(result, css);
	});

	it("should handle empty CSS", () => {
		const result = transformCss("", "fonts");
		assert.strictEqual(result, "");
	});

	it("should handle URLs without quotes", () => {
		const css = '@font-face { src: url(./test/Font.woff2); }';
		const result = transformCss(css, "fonts");

		assert.ok(result.includes('url("/fonts/Font.woff2")'));
	});
});
