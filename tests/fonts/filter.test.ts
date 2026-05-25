import assert from "node:assert";
import { describe, it } from "node:test";

import { createVariantFilter } from "../../src/fonts/filter";
import type { FontConfig } from "../../src/types";

const makeConfig = (variants: FontConfig["variants"]): FontConfig => ({
	family: "Test",
	source: { type: "package", package: "test-pkg" },
	variants,
});

describe("createVariantFilter", () => {
	it("should match filename containing variant name (case-insensitive)", () => {
		const filter = createVariantFilter(
			makeConfig([
				{ name: "Roboto-Bold", weight: 700, styles: ["normal"] },
			]),
		);

		assert.strictEqual(filter("roboto-bold.woff2"), true);
		assert.strictEqual(filter("Roboto-Bold.woff2"), true);
		assert.strictEqual(filter("ROBOTO-BOLD.woff2"), true);
	});

	it("should not match filenames that don't contain variant name", () => {
		const filter = createVariantFilter(
			makeConfig([
				{ name: "Roboto-Bold", weight: 700, styles: ["normal"] },
			]),
		);

		assert.strictEqual(filter("roboto-regular.woff2"), false);
		assert.strictEqual(filter("opensans-bold.woff2"), false);
	});

	it("should only match formats specified in variant (default woff2)", () => {
		const filter = createVariantFilter(
			makeConfig([
				{ name: "Roboto-Bold", weight: 700, styles: ["normal"] },
			]),
		);

		assert.strictEqual(filter("roboto-bold.woff2"), true);
		assert.strictEqual(filter("roboto-bold.woff"), false);
		assert.strictEqual(filter("roboto-bold.ttf"), false);
	});

	it("should match multiple formats when specified", () => {
		const filter = createVariantFilter(
			makeConfig([
				{
					name: "Roboto-Bold",
					weight: 700,
					styles: ["normal"],
					formats: ["woff2", "woff"],
				},
			]),
		);

		assert.strictEqual(filter("roboto-bold.woff2"), true);
		assert.strictEqual(filter("roboto-bold.woff"), true);
		assert.strictEqual(filter("roboto-bold.ttf"), false);
	});

	it("should match any variant in the list", () => {
		const filter = createVariantFilter(
			makeConfig([
				{ name: "Roboto-Bold", weight: 700, styles: ["normal"] },
				{ name: "Roboto-Regular", weight: 400, styles: ["normal"] },
			]),
		);

		assert.strictEqual(filter("roboto-bold.woff2"), true);
		assert.strictEqual(filter("roboto-regular.woff2"), true);
		assert.strictEqual(filter("roboto-italic.woff2"), false);
	});

	it("should handle variable font names", () => {
		const filter = createVariantFilter(
			makeConfig([
				{
					name: "BerkeleyMonoV2-Variable",
					weight: [100, 900],
					styles: ["normal"],
				},
			]),
		);

		assert.strictEqual(filter("berkeleymonov2-variable.woff2"), true);
		assert.strictEqual(filter("BerkeleyMonoV2-Variable.woff2"), true);
		assert.strictEqual(filter("berkeleymonov2-regular.woff2"), false);
	});
});
