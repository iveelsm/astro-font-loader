import assert from "node:assert";
import { describe, it } from "node:test";

import { filterCssFontFaces } from "../../src/css/filter";

describe("filterCssFontFaces", () => {
	const sampleCss = `
@font-face {
	font-family: "Roboto";
	src: url("./Roboto/Roboto-Regular.woff2") format("woff2");
	font-weight: 400;
}
@font-face {
	font-family: "Roboto";
	src: url("./Roboto/Roboto-Bold.woff2") format("woff2");
	font-weight: 700;
}
@font-face {
	font-family: "OpenSans";
	src: url("./OpenSans/OpenSans-Regular.woff2") format("woff2");
	font-weight: 400;
}
`.trim();

	it("should return original CSS when no filter is provided", () => {
		const result = filterCssFontFaces(sampleCss);
		assert.strictEqual(result, sampleCss);
	});

	it("should return original CSS when filter is undefined", () => {
		const result = filterCssFontFaces(sampleCss, undefined);
		assert.strictEqual(result, sampleCss);
	});

	it("should filter out font-face blocks that don't match the filter", () => {
		const filter = (filename: string) => filename.includes("Roboto");
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(result.includes("Roboto-Regular.woff2"));
		assert.ok(result.includes("Roboto-Bold.woff2"));
		assert.ok(!result.includes("OpenSans"));
	});

	it("should keep only font-face blocks matching the filter", () => {
		const filter = (filename: string) =>
			filename === "OpenSans-Regular.woff2";
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(result.includes("OpenSans-Regular.woff2"));
		assert.ok(!result.includes("Roboto"));
	});

	it("should return empty string when no fonts match the filter", () => {
		const filter = () => false;
		const result = filterCssFontFaces(sampleCss, filter);

		assert.ok(!result.includes("@font-face"));
	});

	it("should handle CSS with no font-face blocks", () => {
		const css = "body { font-family: sans-serif; }";
		const filter = () => true;
		const result = filterCssFontFaces(css, filter);

		assert.strictEqual(result, css);
	});

	it("should handle empty CSS", () => {
		const result = filterCssFontFaces("", () => true);
		assert.strictEqual(result, "");
	});
});
