"use client";

import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import {
  businessModels,
  caseInsights,
  CaseMappingLevel,
  CaseRevenueStatus,
  categories,
  companyCases,
  EvidenceState,
  latestDirections,
  products,
  ProductId,
  reportMeta,
  scaleSignals,
  screenshots,
  updates,
} from "./data";

type ViewId = ProductId | "compare" | "library" | "tracker";
type LibraryMode = "updates" | "cases" | "scale";
type ProductFilter = "all" | ProductId;

type LocalResearchNote = {
  id: string;
  date: string;
  product: ProductId;
  category: string;
  title: string;
  detail: string;
  status: "已确认" | "待验证" | "仅记录";
  source: string;
  createdAt: string;
};

const productMap = Object.fromEntries(products.map((product) => [product.id, product]));
const validViews: ViewId[] = ["dumate", "workbuddy", "qwenwork", "traework", "compare", "library", "tracker"];

const stateClass: Record<EvidenceState, string> = {
  当前主方向: "state-primary",
  已产品化: "state-ready",
  持续补齐: "state-building",
  新近进入: "state-new",
  待验证: "state-watch",
  公开证据少: "state-low",
};

const caseStatusClass: Record<CaseRevenueStatus, string> = {
  明确采购: "case-status-purchase",
  较强部署: "case-status-strong",
  使用未披露采购: "case-status-usage",
  生态活动: "case-status-ecosystem",
  待核线索: "case-status-lead",
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${year}.${month}.${day}`;
}

function productStyle(id: ProductId) {
  return { "--product-color": productMap[id].color } as CSSProperties;
}

function StateBadge({ state }: { state: EvidenceState }) {
  return <span className={`state-badge ${stateClass[state]}`}>{state}</span>;
}

function ProductFilterBar({
  value,
  onChange,
}: {
  value: ProductFilter;
  onChange: (value: ProductFilter) => void;
}) {
  return (
    <div className="product-filter" aria-label="按产品筛选">
      <button className={value === "all" ? "filter-chip active" : "filter-chip"} type="button" onClick={() => onChange("all")}>
        全部
      </button>
      {products.map((product) => (
        <button
          className={value === product.id ? "filter-chip active" : "filter-chip"}
          key={product.id}
          style={productStyle(product.id)}
          type="button"
          onClick={() => onChange(product.id)}
        >
          <span className="product-dot" />
          {product.name}
        </button>
      ))}
    </div>
  );
}

export default function Home() {
  const [view, setView] = useState<ViewId>("dumate");
  const [libraryMode, setLibraryMode] = useState<LibraryMode>("updates");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [caseQuery, setCaseQuery] = useState("");
  const [caseMapping, setCaseMapping] = useState<"全部" | CaseMappingLevel>("全部");
  const [caseRevenue, setCaseRevenue] = useState<"全部" | CaseRevenueStatus>("全部");
  const [caseIndustry, setCaseIndustry] = useState("全部");
  const [activeScreenshot, setActiveScreenshot] = useState<(typeof screenshots)[number] | null>(null);
  const [localNotes, setLocalNotes] = useState<LocalResearchNote[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("office-agent-local-notes");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setLocalNotes(parsed);
      } catch {
        setNotice("本地记录读取失败。你可以重新导入之前导出的 JSON 文件。");
      }
    }

    const hash = window.location.hash.slice(1);
    if (hash.startsWith("library-")) {
      const mode = hash.replace("library-", "") as LibraryMode;
      if (["updates", "cases", "scale"].includes(mode)) setLibraryMode(mode);
      setView("library");
    } else if (validViews.includes(hash as ViewId)) {
      setView(hash as ViewId);
    }
  }, []);

  useEffect(() => {
    if (!activeScreenshot) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveScreenshot(null);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [activeScreenshot]);

  useEffect(() => {
    setCaseIndustry("全部");
  }, [productFilter]);

  const selectedProduct = products.find((product) => product.id === view);
  const selectedDirection = selectedProduct
    ? latestDirections.find((item) => item.product === selectedProduct.id)
    : undefined;
  const selectedBusiness = selectedProduct ? businessModels[selectedProduct.id] : undefined;
  const selectedScale = selectedProduct
    ? scaleSignals.find((item) => item.product === selectedProduct.id)
    : undefined;
  const selectedCaseInsight = selectedProduct
    ? caseInsights.find((item) => item.product === selectedProduct.id)
    : undefined;
  const selectedScreenshots = selectedProduct
    ? screenshots.filter((item) => item.product === selectedProduct.id)
    : [];
  const selectedUpdates = selectedProduct
    ? updates.filter((item) => item.product === selectedProduct.id).slice(0, 4)
    : [];
  const selectedCases = useMemo(() => {
    if (!selectedProduct) return [];
    const revenueOrder: Record<CaseRevenueStatus, number> = {
      明确采购: 0,
      较强部署: 1,
      使用未披露采购: 2,
      生态活动: 3,
      待核线索: 4,
    };
    return companyCases
      .filter((item) => item.product === selectedProduct.id)
      .sort((a, b) => revenueOrder[a.revenueStatus] - revenueOrder[b.revenueStatus])
      .slice(0, 3);
  }, [selectedProduct]);

  const filteredUpdates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return updates.filter((item) => {
      if (productFilter !== "all" && item.product !== productFilter) return false;
      if (category !== "全部" && item.category !== category) return false;
      if (!normalized) return true;
      return [item.title, item.detail, item.implication, item.boundary, productMap[item.product].name]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [category, productFilter, query]);

  const caseIndustries = useMemo(
    () => [
      "全部",
      ...Array.from(
        new Set(
          companyCases
            .filter((item) => productFilter === "all" || item.product === productFilter)
            .map((item) => item.industry),
        ),
      ).sort((a, b) => a.localeCompare(b, "zh-CN")),
    ],
    [productFilter],
  );

  const filteredCases = useMemo(() => {
    const normalized = caseQuery.trim().toLowerCase();
    return companyCases.filter((item) => {
      if (productFilter !== "all" && item.product !== productFilter) return false;
      if (caseMapping !== "全部" && item.mappingLevel !== caseMapping) return false;
      if (caseRevenue !== "全部" && item.revenueStatus !== caseRevenue) return false;
      if (caseIndustry !== "全部" && item.industry !== caseIndustry) return false;
      if (!normalized) return true;
      return [item.partner, item.publicProduct, item.industry, item.action, item.result, item.businessMeaning]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [caseIndustry, caseMapping, caseQuery, caseRevenue, productFilter]);

  const visibleScaleSignals = productFilter === "all"
    ? scaleSignals
    : scaleSignals.filter((item) => item.product === productFilter);

  function switchView(nextView: ViewId) {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLibrary(mode: LibraryMode, product: ProductFilter = "all") {
    setLibraryMode(mode);
    setProductFilter(product);
    setView("library");
    window.history.replaceState(null, "", `#library-${mode}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function saveLocalNotes(nextNotes: LocalResearchNote[]) {
    setLocalNotes(nextNotes);
    window.localStorage.setItem("office-agent-local-notes", JSON.stringify(nextNotes));
  }

  function handleAddNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const note: LocalResearchNote = {
      id: crypto.randomUUID(),
      date: String(form.get("date")),
      product: String(form.get("product")) as ProductId,
      category: String(form.get("category")),
      title: String(form.get("title")).trim(),
      detail: String(form.get("detail")).trim(),
      status: String(form.get("status")) as LocalResearchNote["status"],
      source: String(form.get("source")).trim(),
      createdAt: new Date().toISOString(),
    };
    if (!note.title || !note.detail) {
      setNotice("请填写标题和事实记录。");
      return;
    }
    saveLocalNotes([note, ...localNotes]);
    event.currentTarget.reset();
    setNotice("记录已保存在当前设备。请导出 JSON，避免更换设备后丢失。");
  }

  function handleDeleteNote(id: string) {
    saveLocalNotes(localNotes.filter((note) => note.id !== id));
    setNotice("这条本地记录已经删除。");
  }

  function handleExport() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), snapshotDate: reportMeta.snapshotDate, notes: localNotes }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `office-agent-tracking-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setNotice("追踪记录已经导出。");
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const notes = Array.isArray(parsed) ? parsed : parsed.notes;
      if (!Array.isArray(notes)) throw new Error("Invalid data");
      saveLocalNotes(notes);
      setNotice(`已导入 ${notes.length} 条追踪记录。`);
    } catch {
      setNotice("导入失败。请选择由本页面导出的 JSON 文件。");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <main>
      <header className="site-header">
        <button className="brand" type="button" onClick={() => switchView("dumate")} aria-label="返回 DuMate 页面">
          <span className="brand-mark">OA</span>
          <span>办公 Agent<small>友商调研</small></span>
        </button>
        <div className="header-meta">
          <span>数据快照 {reportMeta.snapshotDate}</span>
          <button type="button" onClick={() => switchView("tracker")}>记录新信息</button>
        </div>
      </header>

      <nav className="side-nav" aria-label="调研页面">
        <div className="side-nav-heading">
          <span>逐家查看</span>
          <strong>每次只看一家</strong>
        </div>
        <div className="side-nav-group product-pages">
          {products.map((product, index) => (
            <button
              aria-current={view === product.id ? "page" : undefined}
              className={view === product.id ? "side-nav-item active" : "side-nav-item"}
              key={product.id}
              style={productStyle(product.id)}
              type="button"
              onClick={() => switchView(product.id)}
            >
              <span className="nav-index">0{index + 1}</span>
              <span><strong>{product.name}</strong><small>{product.short}</small></span>
            </button>
          ))}
        </div>
        <div className="side-nav-group utility-pages">
          <span className="side-nav-label">综合与资料</span>
          <button className={view === "compare" ? "side-nav-item active" : "side-nav-item"} type="button" onClick={() => switchView("compare")}>
            <span><strong>四家对比</strong><small>只保留关键差异</small></span>
          </button>
          <button className={view === "library" ? "side-nav-item active" : "side-nav-item"} type="button" onClick={() => openLibrary("updates")}>
            <span><strong>证据台账</strong><small>更新、客户与体量</small></span>
          </button>
          <button className={view === "tracker" ? "side-nav-item active" : "side-nav-item"} type="button" onClick={() => switchView("tracker")}>
            <span><strong>追踪录入</strong><small>为下一轮补充事实</small></span>
          </button>
        </div>
        <div className="side-nav-meta">
          <span>下次建议复核</span>
          <strong>{reportMeta.nextReviewDate}</strong>
        </div>
      </nav>

      {selectedProduct && selectedDirection && selectedBusiness && (
        <article className="company-page" style={productStyle(selectedProduct.id)}>
          <section className="company-hero" id="top">
            <div className="company-kicker">
              <span>{selectedProduct.name}</span>
              <StateBadge state={selectedProduct.evidence} />
              <small>最新能力更新至 {selectedDirection.latestDate}</small>
            </div>
            <h1>{selectedProduct.role}</h1>
            <p>{selectedDirection.direction}</p>
          </section>

          <section className="company-summary-grid" aria-label={`${selectedProduct.name} 核心信息`}>
            <article>
              <span>核心优势</span>
              <p>{selectedProduct.strongest}</p>
            </article>
            <article>
              <span>与其他三家的区别</span>
              <p>{selectedProduct.difference}</p>
            </article>
            <article>
              <span>更适合谁</span>
              <p>{selectedProduct.target}</p>
            </article>
          </section>

          <section className="content-section business-section">
            <div className="simple-heading">
              <div><span>01 / 商业模式</span><h2>它怎么做生意</h2></div>
              <p>价格只是起点，更重要的是卖什么、怎么成交和如何扩张。</p>
            </div>
            <div className="business-judgement">
              <span>商业模式结论</span>
              <h3>{selectedBusiness.currentJudgment}</h3>
              <p>{selectedBusiness.summary}</p>
            </div>
            <div className="commercial-flow">
              {[
                ["个人／免费入口", selectedBusiness.personalEntry],
                ["企业价值单位", selectedBusiness.enterpriseValue],
                ["主要成交方式", selectedBusiness.dealMode],
                ["高客单触发器", selectedBusiness.highTicketTrigger],
              ].map(([label, value], index) => (
                <article key={label}>
                  <small>0{index + 1}</small><span>{label}</span><strong>{value}</strong>
                </article>
              ))}
            </div>
            <div className="business-details">
              <article><span>公开价格</span><p>{selectedBusiness.publicPricing}</p></article>
              <article><span>主要客户</span><p>{selectedBusiness.customer}</p></article>
              <article className="expansion-card"><span>扩张路径</span><p>{selectedBusiness.expansionPath}</p></article>
            </div>
            <div className="boundary-note"><strong>还不能证明</strong><p>{selectedBusiness.validation}</p></div>
          </section>

          <section className="content-section latest-section">
            <div className="simple-heading">
              <div><span>02 / 最新能力</span><h2>它最近在补什么</h2></div>
              <p>{selectedDirection.reason}</p>
            </div>
            <div className="direction-callout">
              <span>一句话方向</span>
              <h3>{selectedDirection.direction}</h3>
            </div>
            <div className="capability-list">
              {selectedDirection.capabilities.map((capability, index) => (
                <article key={capability}><span>0{index + 1}</span><p>{capability}</p></article>
              ))}
            </div>
            <details className="compact-details">
              <summary>查看近期具体更新</summary>
              <div className="compact-update-list">
                {selectedUpdates.map((item) => (
                  <article key={item.id}>
                    <time>{formatDate(item.date)}</time>
                    <div><span>{item.category}</span><h4>{item.title}</h4><p>{item.implication}</p></div>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">来源</a>
                  </article>
                ))}
              </div>
            </details>
          </section>

          <section className="content-section customer-section">
            <div className="simple-heading">
              <div><span>03 / 客户与体量</span><h2>商业进展有多少证据</h2></div>
              <p>先区分当前产品、前身能力和同厂商账户，再判断是否真能证明收入。</p>
            </div>
            {selectedCaseInsight && (
              <div className="case-conclusion">
                <div><span>当前判断</span><h3>{selectedCaseInsight.headline}</h3><p>{selectedCaseInsight.finding}</p></div>
                <div><span>可借鉴的地方</span><p>{selectedCaseInsight.lesson}</p></div>
              </div>
            )}
            <div className="customer-evidence-grid">
              {selectedCases.map((item) => (
                <article key={item.id}>
                  <div><span className={`case-status ${caseStatusClass[item.revenueStatus]}`}>{item.revenueStatus}</span><small>{item.mappingLevel}</small></div>
                  <h3>{item.partner}</h3>
                  <p>{item.result}</p>
                  <small>{item.businessMeaning}</small>
                </article>
              ))}
            </div>
            <div className="company-scale-row">
              {selectedScale && (
                <div><span>公开体量</span><strong>{selectedScale.value}</strong><p>{selectedScale.metric}。{selectedScale.boundary}</p></div>
              )}
              <button type="button" onClick={() => openLibrary("cases", selectedProduct.id)}>查看这家的完整客户台账</button>
            </div>
          </section>

          <details className="content-section evidence-drawer">
            <summary>
              <span>04 / 产品证据</span>
              <strong>查看能力来源和 {selectedScreenshots.length} 张原始截图</strong>
              <small>默认收起，需要核对时再展开</small>
            </summary>
            <div className="lineage-note"><span>能力从哪里来</span><p>{selectedBusiness.lineage}</p></div>
            <div className="screenshot-grid">
              {selectedScreenshots.map((item) => (
                <button key={item.id} type="button" onClick={() => setActiveScreenshot(item)}>
                  <img src={item.src} alt={item.title} />
                  <div><strong>{item.title}</strong><p>{item.note}</p><span>查看原图</span></div>
                </button>
              ))}
            </div>
          </details>

          <section className="company-gap">
            <div><span>当前证据边界</span><p>{selectedProduct.boundary}</p></div>
            <div><span>下一次重点追踪</span><p>{selectedProduct.next}</p></div>
          </section>
        </article>
      )}

      {view === "compare" && (
        <section className="standalone-page compare-page">
          <div className="page-intro"><span>四家对比</span><h1>只看产品路线和生意差异</h1><p>不再把功能数量做成一张庞大表格。需要细节时，再进证据台账。</p></div>
          <div className="comparison-card-grid">
            {products.map((product) => {
              const direction = latestDirections.find((item) => item.product === product.id)!;
              return (
                <article key={product.id} style={productStyle(product.id)}>
                  <span className="product-name"><span className="product-dot" />{product.name}</span>
                  <h2>{product.role}</h2>
                  <p>{direction.direction}</p>
                  <div><span>生意判断</span><p>{businessModels[product.id].currentJudgment}</p></div>
                  <button type="button" onClick={() => switchView(product.id)}>单独看这家</button>
                </article>
              );
            })}
          </div>
          <div className="comparison-table-wrap">
            <table className="comparison-table">
              <thead><tr><th>关键问题</th>{products.map((product) => <th key={product.id}>{product.name}</th>)}</tr></thead>
              <tbody>
                {[
                  ["最强的部分", (id: ProductId) => productMap[id].strongest],
                  ["企业价值单位", (id: ProductId) => businessModels[id].enterpriseValue],
                  ["成交方式", (id: ProductId) => businessModels[id].dealMode],
                  ["扩张路径", (id: ProductId) => businessModels[id].expansionPath],
                  ["最需要验证", (id: ProductId) => businessModels[id].validation],
                ].map(([topic, getter]) => (
                  <tr key={topic as string}>
                    <th>{topic as string}</th>
                    {products.map((product) => <td key={product.id}>{(getter as (id: ProductId) => string)(product.id)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {view === "library" && (
        <section className="standalone-page library-page">
          <div className="page-intro"><span>证据台账</span><h1>只在需要核对时查看</h1><p>主页负责说清一家企业，这里保留完整更新、客户和体量证据。</p></div>
          <div className="library-tabs">
            {([["updates", "能力更新"], ["cases", "客户与合作"], ["scale", "公开体量"]] as [LibraryMode, string][]).map(([id, label]) => (
              <button key={id} className={libraryMode === id ? "active" : ""} type="button" onClick={() => openLibrary(id, productFilter)}>{label}</button>
            ))}
          </div>
          <ProductFilterBar value={productFilter} onChange={setProductFilter} />

          {libraryMode === "updates" && (
            <>
              <div className="ledger-controls">
                <label><span>搜索更新</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="功能、影响或边界" /></label>
                <div className="category-filter">{categories.map((item) => <button key={item} className={category === item ? "active" : ""} type="button" onClick={() => setCategory(item)}>{item}</button>)}</div>
              </div>
              <div className="ledger-count">共 {filteredUpdates.length} 条</div>
              <div className="update-ledger-list">
                {filteredUpdates.map((item) => (
                  <article key={item.id} style={productStyle(item.product)}>
                    <div><time>{formatDate(item.date)}</time><span className="product-name"><span className="product-dot" />{productMap[item.product].name}</span><small>{item.category} · 证据 {item.evidence}</small></div>
                    <h2>{item.title}</h2><p>{item.detail}</p>
                    <dl><div><dt>改变了什么</dt><dd>{item.implication}</dd></div><div><dt>不能过度推断</dt><dd>{item.boundary}</dd></div></dl>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">查看来源</a>
                  </article>
                ))}
              </div>
            </>
          )}

          {libraryMode === "cases" && (
            <>
              <div className="case-warning"><strong>合作不等于成交</strong><p>接入、授权、活动和免费资源投放不能直接证明产品收入。</p></div>
              <div className="case-controls">
                <label className="wide"><span>搜索名单</span><input type="search" value={caseQuery} onChange={(event) => setCaseQuery(event.target.value)} placeholder="企业、行业、场景或结果" /></label>
                <label><span>产品映射</span><select value={caseMapping} onChange={(event) => setCaseMapping(event.target.value as "全部" | CaseMappingLevel)}><option>全部</option><option>当前产品</option><option>前身能力</option><option>同厂商账户</option></select></label>
                <label><span>商业证据</span><select value={caseRevenue} onChange={(event) => setCaseRevenue(event.target.value as "全部" | CaseRevenueStatus)}><option>全部</option><option>明确采购</option><option>较强部署</option><option>使用未披露采购</option><option>生态活动</option><option>待核线索</option></select></label>
                <label><span>行业</span><select value={caseIndustry} onChange={(event) => setCaseIndustry(event.target.value)}>{caseIndustries.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <div className="ledger-count">显示 {filteredCases.length} 条，总共 {companyCases.length} 条</div>
              <div className="case-ledger-list">
                {filteredCases.map((item) => (
                  <article key={item.id} style={productStyle(item.product)}>
                    <div className="case-card-top"><span className="product-name"><span className="product-dot" />{productMap[item.product].name}</span><span className={`case-status ${caseStatusClass[item.revenueStatus]}`}>{item.revenueStatus}</span></div>
                    <h2>{item.partner}</h2><p>{item.result}</p>
                    <div className="case-card-meta"><span>{item.mappingLevel}</span><span>{item.industry}</span><span>{item.date}</span></div>
                    <details><summary>查看商业判断与来源</summary><p>{item.revenueProof}</p><p>{item.businessMeaning}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">原始来源</a></details>
                  </article>
                ))}
              </div>
            </>
          )}

          {libraryMode === "scale" && (
            <>
              <div className="case-warning"><strong>口径原则</strong><p>产品用户、内部使用、前身席位和渠道组织数不能直接横比。</p></div>
              <div className="scale-card-grid">
                {visibleScaleSignals.map((item) => (
                  <article key={item.product} style={productStyle(item.product)}><span className="product-name"><span className="product-dot" />{productMap[item.product].name}</span><strong>{item.value}</strong><h2>{item.metric}</h2><p>{item.meaning}</p><small>{item.boundary}</small><a href={item.sourceUrl} target="_blank" rel="noreferrer">来源</a></article>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {view === "tracker" && (
        <section className="standalone-page tracker-page">
          <div className="page-intro"><span>追踪录入</span><h1>把新发现先记成事实</h1><p>本地记录仅保存在当前设备。定期导出 JSON，再进入下一轮分析。</p></div>
          <div className="tracker-layout">
            <form className="tracker-form" onSubmit={handleAddNote}>
              <div className="form-heading"><div><span>新追踪</span><h2>添加一条事实记录</h2></div><small>本地草稿</small></div>
              <div className="form-grid">
                <label><span>日期</span><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
                <label><span>产品</span><select name="product" defaultValue="dumate">{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
                <label><span>类别</span><select name="category" defaultValue="新增功能"><option>新增功能</option><option>价格变化</option><option>企业能力</option><option>客户案例</option><option>来源补充</option><option>实测结果</option></select></label>
                <label><span>事实状态</span><select name="status" defaultValue="待验证"><option>已确认</option><option>待验证</option><option>仅记录</option></select></label>
              </div>
              <label><span>标题</span><input name="title" placeholder="一句话说明发现了什么" /></label>
              <label><span>事实记录</span><textarea name="detail" rows={5} placeholder="写清公开资料实际说了什么。先不写因果判断。" /></label>
              <label><span>来源链接或文件</span><input name="source" placeholder="https:// 或文件名称" /></label>
              <button className="primary-button" type="submit">保存到当前设备</button>
            </form>
            <aside className="maintenance-panel">
              <h2>每周维护顺序</h2>
              <ol><li><span>01</span><p>先补来源、日期和事实状态。</p></li><li><span>02</span><p>判断是新能力、价格变化还是客户证据。</p></li><li><span>03</span><p>检查是否改变产品方向或商业模式。</p></li><li><span>04</span><p>最后更新单家页面的结论和证据边界。</p></li></ol>
              <div><button type="button" onClick={handleExport} disabled={localNotes.length === 0}>导出追踪 JSON</button><label className="import-button">导入追踪 JSON<input type="file" accept=".json,application/json" onChange={handleImport} /></label></div>
            </aside>
          </div>
          {notice && <div className="notice" role="status">{notice}</div>}
          <div className="local-records"><div className="records-heading"><h2>当前设备的追踪记录</h2><span>{localNotes.length} 条</span></div>{localNotes.length === 0 ? <div className="empty-state"><strong>还没有本地记录</strong><p>新增记录后，可以导出并带入下一轮分析。</p></div> : <div className="record-list">{localNotes.map((note) => <article key={note.id} style={productStyle(note.product)}><div><span className="product-name"><span className="product-dot" />{productMap[note.product].name}</span><span>{note.date}</span><span>{note.status}</span></div><h3>{note.title}</h3><p>{note.detail}</p>{note.source && <small>来源：{note.source}</small>}<button type="button" onClick={() => handleDeleteNote(note.id)}>删除本地记录</button></article>)}</div>}</div>
        </section>
      )}

      <footer><div><strong>{reportMeta.title}</strong><p>数据源：{reportMeta.sourceWorkbook}</p><p>{reportMeta.caseWorkbook}</p></div><div><span>数据快照 {reportMeta.snapshotDate}</span><span>先更新单家结论，再补证据台账</span></div></footer>

      {activeScreenshot && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label={activeScreenshot.title} onClick={() => setActiveScreenshot(null)}>
          <div className="lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="lightbox-close" onClick={() => setActiveScreenshot(null)}>关闭</button>
            <img src={activeScreenshot.src} alt={activeScreenshot.title} />
            <div><span>{productMap[activeScreenshot.product].name}</span><h2>{activeScreenshot.title}</h2><p>{activeScreenshot.note}</p></div>
          </div>
        </div>
      )}
    </main>
  );
}
