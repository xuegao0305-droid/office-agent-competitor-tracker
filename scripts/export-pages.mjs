import { cp, mkdir, rm, writeFile } from "node:fs/promises";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/office-agent-competitor-tracker";
const siteUrl = `https://xuegao0305-droid.github.io${basePath}/`;
const workerUrl = new URL(`../dist/server/index.js?pages=${Date.now()}`, import.meta.url);
const { default: worker } = await import(workerUrl.href);

const response = await worker.fetch(
  new Request(siteUrl, { headers: { accept: "text/html" } }),
  {
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  },
  {
    waitUntil() {},
    passThroughOnException() {},
  },
);

if (!response.ok) {
  throw new Error(`Static render failed with status ${response.status}`);
}

const html = await response.text();
if (!html.includes("办公 Agent 竞争追踪台")) {
  throw new Error("Static render did not contain the expected page content");
}

await writeFile(new URL("../dist/client/index.html", import.meta.url), html, "utf8");
await writeFile(new URL("../dist/client/404.html", import.meta.url), html, "utf8");
await rm(new URL("../out", import.meta.url), { recursive: true, force: true });
await mkdir(new URL("../out", import.meta.url), { recursive: true });
await cp(new URL("../dist/client", import.meta.url), new URL("../out", import.meta.url), {
  recursive: true,
});

console.log(`GitHub Pages export created for ${siteUrl}`);
