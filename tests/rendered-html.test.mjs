import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
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
}

test("server renders the research tracker", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>办公 Agent 竞争追踪台<\/title>/);
  assert.match(html, /DuMate/);
  assert.match(html, /WorkBuddy/);
  assert.match(html, /千问办公/);
  assert.match(html, /TRAE Work/);
  assert.match(html, /每次只看一家/);
  assert.match(html, /DuMate 正在从单机桌面执行工具/);
  assert.match(html, /它怎么做生意/);
  assert.match(html, /企业价值单位/);
  assert.match(html, /标准 SaaS 自助购买/);
  assert.match(html, /查看能力来源和/);
  assert.match(html, /张原始截图/);
  assert.match(html, /证据台账/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("keeps all source screenshots and tracking data", async () => {
  const data = await readFile(new URL("../app/data.ts", import.meta.url), "utf8");
  const screenshotIds = data.match(/id: "s\d{2}"/g) ?? [];
  assert.equal(screenshotIds.length, 11);

  const screenshotFiles = [
    "dumate-home.png",
    "dumate-skills.png",
    "workbuddy-home.png",
    "workbuddy-gamification.png",
    "workbuddy-knowledge.png",
    "workbuddy-projects.png",
    "qoderwork-home.png",
    "qoderwork-workbench.png",
    "qoderwork-im.png",
    "trae-work-home.png",
    "trae-work-modes.png",
  ];

  for (const file of screenshotFiles) {
    await access(new URL(`../public/screenshots/${file}`, import.meta.url));
  }

  await access(new URL("../public/og.png", import.meta.url));
});

test("keeps the complete enterprise cooperation list and evidence labels", async () => {
  const raw = await readFile(new URL("../app/company-cases.json", import.meta.url), "utf8");
  const companyCases = JSON.parse(raw);

  assert.equal(companyCases.length, 33);
  assert.equal(companyCases.filter((item) => item.revenueStatus === "明确采购").length, 1);
  assert.equal(companyCases.filter((item) => item.mappingLevel === "当前产品").length, 16);
  assert.ok(companyCases.some((item) => item.partner === "东阳光集团"));
  assert.ok(companyCases.some((item) => item.partner === "易仓科技"));
  assert.ok(companyCases.every((item) => item.sourceUrl && item.revenueProof && item.businessMeaning));
});
