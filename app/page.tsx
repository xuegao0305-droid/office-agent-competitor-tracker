"use client";

import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import {
  businessModels,
  caseInsights,
  CaseMappingLevel,
  CaseRevenueStatus,
  categories,
  companyCases,
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
          <button type="button" onClick={() => switchView("tracker")}>更新资料</button>
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
            <span><strong>详细资料</strong><small>产品更新、客户与公开数据</small></span>
          </button>
          <button className={view === "tracker" ? "side-nav-item active" : "side-nav-item"} type="button" onClick={() => switchView("tracker")}>
            <span><strong>资料更新</strong><small>添加新的产品动态</small></span>
          </button>
        </div>
        <div className="side-nav-meta">
          <span>数据快照</span>
          <strong>{reportMeta.snapshotDate}</strong>
        </div>
      </nav>

      {selectedProduct && selectedDirection && selectedBusiness && (
        <article className="company-page" style={productStyle(selectedProduct.id)}>
          <section className="company-hero" id="top">
            <div className="company-kicker">
              <span>{selectedProduct.name}</span>
              <small>最新能力更新至 {selectedDirection.latestDate}</small>
            </div>
            <h1>{selectedProduct.role}</h1>
            <p>{selectedDirection.direction}</p>
          </section>

          <nav className="company-section-nav" aria-label={`${selectedProduct.name} 页面目录`}>
            <a href="#business">商业模式</a>
            <a href="#latest">最新能力</a>
            <a href="#customers">客户与数据</a>
            <a href="#product-view">产品界面</a>
          </nav>

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

          <section className="content-section business-section" id="business">
            <div className="simple-heading">
              <div><span>01 / 商业模式</span><h2>它怎么做生意</h2></div>
              <p>{selectedBusiness.publicPricing}</p>
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
            <div className="boundary-note"><strong>公开信息暂未披露</strong><p>{selectedBusiness.validation}</p></div>
          </section>

          <section className="content-section latest-section" id="latest">
            <div className="simple-heading">
              <div><span>02 / 最新能力</span><h2>它最近在补什么</h2></div>
              <p>{selectedProduct.latest}</p>
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

          <section className="content-section customer-section" id="customers">
            <div className="simple-heading">
              <div><span>03 / 客户与公开数据</span><h2>企业合作与产品体量</h2></div>
              <p>{selectedCaseInsight?.headline}</p>
            </div>
            {selectedCaseInsight && (
              <div className="case-conclusion">
                <div><span>企业合作概况</span><h3>{selectedCaseInsight.headline}</h3><p>{selectedCaseInsight.finding}</p></div>
                <div><span>业务启示</span><p>{selectedCaseInsight.lesson}</p></div>
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

          <details className="content-section evidence-drawer" id="product-view">
            <summary>
              <span>04 / 产品界面</span>
              <strong>查看 {selectedScreenshots.length} 张界面截图与产品演进</strong>
              <small>点击展开</small>
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

        </article>
      )}

      {view === "compare" && (
        <section className="standalone-page compare-page">
          <div className="page-intro"><span>四家对比</span><h1>产品路线与商业模式</h1><p>DuMate 主打部门级快速落地，WorkBuddy 向 Agent 运行治理延伸，千问办公结合专业数据与钉钉，TRAE Work 以工程交付向通用工作扩展。</p></div>
          <div className="comparison-card-grid">
            {products.map((product) => {
              const direction = latestDirections.find((item) => item.product === product.id)!;
              return (
                <article key={product.id} style={productStyle(product.id)}>
                  <span className="product-name"><span className="product-dot" />{product.name}</span>
                  <h2>{product.role}</h2>
                  <p>{direction.direction}</p>
                  <div><span>商业模式</span><p>{businessModels[product.id].currentJudgment}</p></div>
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
                  ["公开信息缺口", (id: ProductId) => businessModels[id].validation],
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
          <div className="page-intro"><span>详细资料</span><h1>产品更新、客户合作与公开数据</h1><p>可按产品、日期、类别、行业和合作进展筛选。</p></div>
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
                    <div><time>{formatDate(item.date)}</time><span className="product-name"><span className="product-dot" />{productMap[item.product].name}</span><small>{item.category}</small></div>
                    <h2>{item.title}</h2><p>{item.detail}</p>
                    <dl><div><dt>产品影响</dt><dd>{item.implication}</dd></div><div><dt>公开信息范围</dt><dd>{item.boundary}</dd></div></dl>
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
                <label><span>合作进展</span><select value={caseRevenue} onChange={(event) => setCaseRevenue(event.target.value as "全部" | CaseRevenueStatus)}><option>全部</option><option>明确采购</option><option>较强部署</option><option>使用未披露采购</option><option>生态活动</option><option>待核线索</option></select></label>
                <label><span>行业</span><select value={caseIndustry} onChange={(event) => setCaseIndustry(event.target.value)}>{caseIndustries.map((item) => <option key={item}>{item}</option>)}</select></label>
              </div>
              <div className="ledger-count">显示 {filteredCases.length} 条，总共 {companyCases.length} 条</div>
              <div className="case-ledger-list">
                {filteredCases.map((item) => (
                  <article key={item.id} style={productStyle(item.product)}>
                    <div className="case-card-top"><span className="product-name"><span className="product-dot" />{productMap[item.product].name}</span><span className={`case-status ${caseStatusClass[item.revenueStatus]}`}>{item.revenueStatus}</span></div>
                    <h2>{item.partner}</h2><p>{item.result}</p>
                    <div className="case-card-meta"><span>{item.mappingLevel}</span><span>{item.industry}</span><span>{item.date}</span></div>
                    <details><summary>查看合作详情与来源</summary><p>{item.revenueProof}</p><p>{item.businessMeaning}</p><a href={item.sourceUrl} target="_blank" rel="noreferrer">原始来源</a></details>
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
          <div className="page-intro"><span>资料更新</span><h1>补充新的产品动态</h1><p>添加功能、价格、企业合作或市场数据，记录保存在当前设备。</p></div>
          <div className="tracker-layout">
            <form className="tracker-form" onSubmit={handleAddNote}>
              <div className="form-heading"><div><span>新资料</span><h2>添加一条产品动态</h2></div><small>本地保存</small></div>
              <div className="form-grid">
                <label><span>日期</span><input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /></label>
                <label><span>产品</span><select name="product" defaultValue="dumate">{products.map((product) => <option value={product.id} key={product.id}>{product.name}</option>)}</select></label>
                <label><span>类别</span><select name="category" defaultValue="新增功能"><option>新增功能</option><option>价格变化</option><option>企业能力</option><option>客户案例</option><option>来源补充</option><option>实测结果</option></select></label>
                <label><span>事实状态</span><select name="status" defaultValue="待验证"><option>已确认</option><option>待验证</option><option>仅记录</option></select></label>
              </div>
              <label><span>标题</span><input name="title" placeholder="一句话说明发现了什么" /></label>
              <label><span>详细内容</span><textarea name="detail" rows={5} placeholder="填写功能、价格、客户或市场动态" /></label>
              <label><span>来源链接或文件</span><input name="source" placeholder="https:// 或文件名称" /></label>
              <button className="primary-button" type="submit">保存到当前设备</button>
            </form>
            <aside className="maintenance-panel">
              <h2>资料管理</h2>
              <ol><li><span>01</span><p>记录保存在当前浏览器。</p></li><li><span>02</span><p>可随时导出 JSON 备份。</p></li><li><span>03</span><p>导入 JSON 可恢复已有记录。</p></li><li><span>04</span><p>每条资料都可保留日期和来源。</p></li></ol>
              <div><button type="button" onClick={handleExport} disabled={localNotes.length === 0}>导出追踪 JSON</button><label className="import-button">导入追踪 JSON<input type="file" accept=".json,application/json" onChange={handleImport} /></label></div>
            </aside>
          </div>
          {notice && <div className="notice" role="status">{notice}</div>}
          <div className="local-records"><div className="records-heading"><h2>当前设备的资料</h2><span>{localNotes.length} 条</span></div>{localNotes.length === 0 ? <div className="empty-state"><strong>尚未添加资料</strong><p>新增记录后，可以在这里查看和导出。</p></div> : <div className="record-list">{localNotes.map((note) => <article key={note.id} style={productStyle(note.product)}><div><span className="product-name"><span className="product-dot" />{productMap[note.product].name}</span><span>{note.date}</span><span>{note.status}</span></div><h3>{note.title}</h3><p>{note.detail}</p>{note.source && <small>来源：{note.source}</small>}<button type="button" onClick={() => handleDeleteNote(note.id)}>删除本地记录</button></article>)}</div>}</div>
        </section>
      )}

      <footer><div><strong>{reportMeta.title}</strong><p>数据源：{reportMeta.sourceWorkbook}</p><p>{reportMeta.caseWorkbook}</p></div><div><span>数据快照 {reportMeta.snapshotDate}</span><span>持续更新产品、价格与企业合作信息</span></div></footer>

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
