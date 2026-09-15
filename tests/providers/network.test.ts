import assert from "node:assert";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { createNetworkProvider } from "../../src/providers/network";

type Route = {
	body: string | Uint8Array;
	status?: number;
	contentType?: string;
};

type TestServer = {
	origin: string;
	requests: { path: string; headers: Record<string, string | string[] | undefined> }[];
	close: () => Promise<void>;
};

/**
 * Serves a fixed set of routes on an ephemeral port so the provider can be
 * exercised over a real HTTP request rather than a stubbed fetch.
 */
async function startServer(routes: Record<string, Route>): Promise<TestServer> {
	const requests: TestServer["requests"] = [];

	const server = createServer((req, res) => {
		const path = req.url ?? "";
		requests.push({ path, headers: req.headers });

		const route = routes[path];
		if (!route) {
			res.writeHead(404, "Not Found");
			res.end("missing");
			return;
		}

		res.writeHead(route.status ?? 200, { "content-type": route.contentType ?? "text/css" });
		res.end(route.body);
	});

	await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
	const { port } = server.address() as AddressInfo;

	return {
		origin: `http://127.0.0.1:${port}`,
		requests,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	};
}

const FONT_BODY = new Uint8Array([0x77, 0x4f, 0x46, 0x32, 0x00, 0x01]);

const fontRoute: Route = { body: FONT_BODY, contentType: "font/woff2" };

const stylesheet = (src: string) => `@font-face {
	font-family: "Test Font";
	src: ${src};
	font-weight: 400;
	font-style: normal;
}`;

describe("createNetworkProvider", () => {
	let cacheDirectory: string;
	let server: TestServer | null;
	let counter = 0;

	beforeEach(() => {
		cacheDirectory = join(tmpdir(), `network-provider-${Date.now()}-${counter++}`);
		server = null;
	});

	afterEach(async () => {
		await server?.close();
		rmSync(cacheDirectory, { recursive: true, force: true });
	});

	it("should return null for a URL that cannot be parsed", () => {
		assert.strictEqual(createNetworkProvider({ type: "network", url: "not a url" }), null);
	});

	it("should return null for a non-http protocol", () => {
		assert.strictEqual(createNetworkProvider({ type: "network", url: "file:///fonts.css" }), null);
		assert.strictEqual(createNetworkProvider({ type: "network", url: "ftp://example.com/fonts.css" }), null);
	});

	it("should download fonts and rewrite the CSS to the output directory", async () => {
		server = await startServer({
			"/fonts.css": { body: stylesheet(`url("./Test-Regular.woff2") format("woff2")`) },
			"/Test-Regular.woff2": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "Test-Regular.woff2");
		assert.ok(result.css.includes(`url("/fonts/Test-Regular.woff2")`));
		assert.ok(!result.css.includes(server.origin));

		assert.ok(existsSync(result.fonts[0].sourcePath));
		assert.deepStrictEqual(new Uint8Array(readFileSync(result.fonts[0].sourcePath)), FONT_BODY);
	});

	it("should cache downloads under the configured cache directory", async () => {
		server = await startServer({
			"/fonts.css": { body: stylesheet(`url("./Test-Regular.woff2") format("woff2")`) },
			"/Test-Regular.woff2": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.ok(result.fonts[0].sourcePath.startsWith(cacheDirectory));
	});

	it("should resolve absolute font URLs from the stylesheet", async () => {
		// Routes are filled in after listening, since the stylesheet has to name
		// the ephemeral port it is served from.
		const routes: Record<string, Route> = { "/static/Test-Regular.woff2": fontRoute };
		server = await startServer(routes);
		routes["/css/fonts.css"] = { body: stylesheet(`url("${server.origin}/static/Test-Regular.woff2") format("woff2")`) };

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/css/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 1);
		assert.ok(result.css.includes(`url("/fonts/Test-Regular.woff2")`));
	});

	it("should resolve font URLs relative to the stylesheet location", async () => {
		server = await startServer({
			"/css/fonts.css": { body: stylesheet(`url("../static/Test-Regular.woff2") format("woff2")`) },
			"/static/Test-Regular.woff2": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/css/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 1);
		assert.ok(server.requests.some((r) => r.path === "/static/Test-Regular.woff2"));
	});

	it("should return an empty result when no variant matches", async () => {
		server = await startServer({
			"/fonts.css": { body: stylesheet(`url("./Test-Regular.woff2") format("woff2")`) },
			"/Test-Regular.woff2": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Other Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.deepStrictEqual(result, { css: "", fonts: [] });
		assert.ok(!server.requests.some((r) => r.path === "/Test-Regular.woff2"));
	});

	it("should only include the requested formats", async () => {
		const src = `url("./Test-Regular.woff2") format("woff2"), url("./Test-Regular.ttf") format("truetype")`;
		server = await startServer({
			"/fonts.css": { body: stylesheet(src) },
			"/Test-Regular.woff2": fontRoute,
			"/Test-Regular.ttf": { body: FONT_BODY, contentType: "font/ttf" },
		});

		const source = { type: "network" as const, url: `${server.origin}/fonts.css`, cacheDirectory };

		const woff2Only = await createNetworkProvider(source)!.resolveVariant(
			{ name: "Test Font", weight: 400, styles: ["normal"] },
			"fonts",
		);
		assert.deepStrictEqual(
			woff2Only.fonts.map((f) => f.filename),
			["Test-Regular.woff2"],
		);

		const both = await createNetworkProvider(source)!.resolveVariant(
			{ name: "Test Font", weight: 400, styles: ["normal"], formats: ["woff2", "ttf"] },
			"fonts",
		);
		assert.deepStrictEqual(both.fonts.map((f) => f.filename).sort(), ["Test-Regular.ttf", "Test-Regular.woff2"]);
	});

	it("should name extensionless fonts from their format hint", async () => {
		server = await startServer({
			"/fonts.css": { body: stylesheet(`url("./regular") format("woff2")`) },
			"/regular": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 1);
		assert.strictEqual(result.fonts[0].filename, "regular.woff2");
		assert.ok(result.css.includes(`url("/fonts/regular.woff2")`));
	});

	it("should disambiguate distinct fonts that share a filename", async () => {
		const css = `@font-face {
	font-family: "Test Font";
	src: url("./latin/Test.woff2") format("woff2");
	font-weight: 400;
	font-style: normal;
}
@font-face {
	font-family: "Test Font";
	src: url("./cyrillic/Test.woff2") format("woff2");
	font-weight: 400;
	font-style: normal;
}`;

		server = await startServer({
			"/fonts.css": { body: css },
			"/latin/Test.woff2": fontRoute,
			"/cyrillic/Test.woff2": fontRoute,
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		const result = await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(result.fonts.length, 2);

		const filenames = result.fonts.map((f) => f.filename);
		assert.strictEqual(new Set(filenames).size, 2, "colliding fonts should get distinct filenames");
		assert.ok(filenames.includes("Test.woff2"));
		assert.ok(filenames.every((f) => f.endsWith("Test.woff2")));

		for (const filename of filenames) {
			assert.ok(result.css.includes(`url("/fonts/${filename}")`));
		}
	});

	it("should fetch the stylesheet once across variants and provider instances", async () => {
		const css = `${stylesheet(`url("./Test-Regular.woff2") format("woff2")`)}
@font-face {
	font-family: "Test Font";
	src: url("./Test-Bold.woff2") format("woff2");
	font-weight: 700;
	font-style: normal;
}`;

		server = await startServer({
			"/fonts.css": { body: css },
			"/Test-Regular.woff2": fontRoute,
			"/Test-Bold.woff2": fontRoute,
		});

		const source = { type: "network" as const, url: `${server.origin}/fonts.css`, cacheDirectory };
		const provider = createNetworkProvider(source)!;

		await provider.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");
		await provider.resolveVariant({ name: "Test Font", weight: 700, styles: ["normal"] }, "fonts");
		await createNetworkProvider(source)!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(server.requests.filter((r) => r.path === "/fonts.css").length, 1);
		assert.strictEqual(server.requests.filter((r) => r.path === "/Test-Regular.woff2").length, 1);
	});

	it("should send a browser User-Agent so hosts negotiate modern formats", async () => {
		server = await startServer({ "/fonts.css": { body: "" } });

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });
		await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.match(String(server.requests[0].headers["user-agent"]), /Mozilla/);
	});

	it("should apply custom headers, overriding the defaults", async () => {
		server = await startServer({ "/fonts.css": { body: "" } });

		const provider = createNetworkProvider({
			type: "network",
			url: `${server.origin}/fonts.css`,
			cacheDirectory,
			headers: { "User-Agent": "custom-agent", Authorization: "Bearer token" },
		});
		await provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts");

		assert.strictEqual(server.requests[0].headers["user-agent"], "custom-agent");
		assert.strictEqual(server.requests[0].headers["authorization"], "Bearer token");
	});

	it("should throw a descriptive error when the stylesheet is missing", async () => {
		server = await startServer({});

		const url = `${server.origin}/missing.css`;
		const provider = createNetworkProvider({ type: "network", url, cacheDirectory });

		await assert.rejects(async () => provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts"), {
			message: `request to ${url} returned 404 Not Found`,
		});
	});

	it("should throw a descriptive error when a font is missing", async () => {
		server = await startServer({
			"/fonts.css": { body: stylesheet(`url("./Test-Regular.woff2") format("woff2")`) },
		});

		const provider = createNetworkProvider({ type: "network", url: `${server.origin}/fonts.css`, cacheDirectory });

		await assert.rejects(
			async () => provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts"),
			/returned 404 Not Found/,
		);
	});

	it("should throw when the host is unreachable", async () => {
		const provider = createNetworkProvider({
			type: "network",
			url: "http://127.0.0.1:1/fonts.css",
			cacheDirectory,
			timeout: 1000,
		});

		await assert.rejects(
			async () => provider!.resolveVariant({ name: "Test Font", weight: 400, styles: ["normal"] }, "fonts"),
			/failed:/,
		);
	});
});
