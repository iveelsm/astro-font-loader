import assert from "node:assert";
import { existsSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";

import type { AstroIntegrationLogger } from "astro";

import { astroBuildDone } from "../../src/astroBuild";
import { astroConfigSetup } from "../../src/astroConfig";
import type { FontConfig } from "../../src/types";

const FONT_BODY = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0x00, 0x01]);

const STYLESHEET = `@font-face {
	font-family: "Test Font";
	src: url("./Test-Regular.woff2") format("woff2");
	font-weight: 400;
	font-style: normal;
}`;

/**
 * Collects log output so tests can assert on what the integration reported.
 */
function createLogger() {
	const messages: string[] = [];
	const record = (level: string) => (message: string) => void messages.push(`${level}: ${message}`);

	const logger = {
		info: record("info"),
		warn: record("warn"),
		error: record("error"),
		debug: record("debug"),
	};

	return { logger: logger as unknown as AstroIntegrationLogger, messages };
}

describe("integration with a network source", () => {
	let cacheDirectory: string;
	let distDir: string;
	let origin: string;
	let close: () => Promise<void>;
	let counter = 0;

	beforeEach(async () => {
		const unique = `${Date.now()}-${counter++}`;
		cacheDirectory = join(tmpdir(), `integration-cache-${unique}`);
		distDir = join(tmpdir(), `integration-dist-${unique}`);

		const server = createServer((req, res) => {
			if (req.url === "/fonts.css") {
				res.writeHead(200, { "content-type": "text/css" });
				res.end(STYLESHEET);
				return;
			}

			if (req.url === "/Test-Regular.woff2") {
				res.writeHead(200, { "content-type": "font/woff2" });
				res.end(FONT_BODY);
				return;
			}

			res.writeHead(404, "Not Found");
			res.end("missing");
		});

		await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
		origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
		close = () => new Promise<void>((resolve) => server.close(() => resolve()));
	});

	afterEach(async () => {
		await close();
		rmSync(cacheDirectory, { recursive: true, force: true });
		rmSync(distDir, { recursive: true, force: true });
	});

	const fontConfig = (url: string): FontConfig => ({
		family: "Test Font",
		source: { type: "network", url, cacheDirectory },
		variants: [{ name: "Test Font", weight: 400, styles: ["normal"] }],
	});

	it("should copy fonts fetched from a URL into the build output", async () => {
		const { logger, messages } = createLogger();

		const { availableFonts } = await astroConfigSetup(logger, [fontConfig(`${origin}/fonts.css`)], "fonts");
		assert.strictEqual(availableFonts.length, 1);

		astroBuildDone(pathToFileURL(`${distDir}/`), logger, "fonts", availableFonts);

		assert.ok(existsSync(join(distDir, "fonts", "Test-Regular.woff2")));
		assert.ok(messages.some((m) => m.startsWith("info: Loaded 1 font file(s) for Test Font")));
	});

	it("should warn and continue when the source URL is not usable", async () => {
		const { logger, messages } = createLogger();

		const { availableFonts } = await astroConfigSetup(logger, [fontConfig("not a url")], "fonts");

		assert.strictEqual(availableFonts.length, 0);
		assert.ok(messages.some((m) => m.startsWith("warn: Could not resolve font source for Test Font")));
	});

	it("should warn and continue when the stylesheet cannot be fetched", async () => {
		const { logger, messages } = createLogger();

		const { availableFonts } = await astroConfigSetup(logger, [fontConfig(`${origin}/missing.css`)], "fonts");

		assert.strictEqual(availableFonts.length, 0);
		assert.ok(messages.some((m) => m.includes("warn: Could not load Test Font (Test Font)") && m.includes("404 Not Found")));
	});
});
