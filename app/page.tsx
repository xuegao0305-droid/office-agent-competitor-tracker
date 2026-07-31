"use client";

import { ChangeEvent, CSSProperties, FormEvent, useEffect, useMemo, useState } from "react";
import {
  actions,
  caseInsights,
  CaseMappingLevel,
  CaseRevenueStatus,
  categories,
  companyCases,
  comparisonRows,
  directionConclusions,
  EvidenceState,
  matrix,
  latestDirections,
  products,
  ProductId,
  reportMeta,
  scaleSignals,
  screenshots,
  updates,
} from "./data";

type ViewId = "latest" | "profiles" | "matrix" | "updates" | "cases" | "scale" | "tracker";
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

const viewLabels: Array<{ id: ViewId; label: string; description: string; group: "核心分析" | "证据与维护" }> = [
  { id: "latest", label: "最新能力", description: "一句话看清发展方向", group: "核心分析" },
  { id: "profiles", label: "四家产品", description: "结合界面逐家拆解", group: "核心分析" },
  { id: "matrix", label: "差异对比", description: "按同一问题横向比较", group: "核心分析" },
  { id: "updates", label: "更新明细", description: "查看完整能力台账", group: "核心分析" },
  { id: "cases", label: "客户与合作", description: "判断商业进展", group: "证据与维护" },
  { id: "scale", label: "公开体量", description: "核对数据口径", group: "证据与维护" },
  { id: "tracker", label: "追踪录入", description: "添加和导出新记录", group: "证据与维护" },
];

const productMap = Object.fromEntries(products.map((product) => [product.id, product]));

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

function ProductFilterBar({
  value,
  onChange,
}: {
  value: ProductFilter;
  onChange: (value: ProductFilter) => void;
}) {
  return (
    <div className="product-filter" aria-label="按产品筛选">
      <button
        className={value === "all" ? "filter-chip active" : "filter-chip"}
        type="button"
        onClick={() => onChange("all")}
      >
        全部产品
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

function StateBadge({ state }: { state: EvidenceState }) {
  return <span className={`state-badge ${stateClass[state]}`}>{state}</span>;
}

export default function Home() {
  const [view, setView] = useState<ViewId>("latest");
  const [productFilter, setProductFilter] = useState<ProductFilter>("all");
  const [category, setCategory] = useState("全部");
  const [query, setQuery] = useState("");
  const [caseQuery, setCaseQuery] = useState("");
  const [caseMapping, setCaseMapping] = useState<"全部" | CaseMappingLevel>("全部");
  const [caseRevenue, setCaseRevenue] = useState<"全部" | CaseRevenueStatus>("全部");
  const [caseIndustry, setCaseIndustry] = useState("全部");
  const [activeScreenshot, setActiveScreenshot] = useState<(typeof screenshots)[number] | null>(
    null,
  );
  const [localNotes, setLocalNotes] = useState<LocalResearchNote[]>([]);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem("office-agent-local-notes");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setLocalNotes(parsed);
    } catch {
      setNotice("本地记录读取失败。你可以重新导入之前导出的 JSON 文件。");
    }
  }, []);

  useEffect(() => {
    const requestedView = window.location.hash.slice(1) as ViewId;
    if (viewLabels.some((item) => item.id === requestedView)) setView(requestedView);
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

  const filteredProducts = useMemo(
    () =>
      productFilter === "all"
        ? products
        : products.filter((product) => product.id === productFilter),
    [productFilter],
  );

  const filteredLatestDirections = useMemo(
    () =>
      productFilter === "all"
        ? latestDirections
        : latestDirections.filter((item) => item.product === productFilter),
    [productFilter],
  );

  const filteredUpdates = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return updates.filter((item) => {
      if (productFilter !== "all" && item.product !== productFilter) return false;
      if (category !== "全部" && item.category !== category) return false;
      if (!normalized) return true;
      const text = [
        item.title,
        item.detail,
        item.implication,
        item.boundary,
        productMap[item.product].name,
      ]
        .join(" ")
        .toLowerCase();
      return text.includes(normalized);
    });
  }, [category, productFilter, query]);

  const caseIndustries = useMemo(
    () =>
      [
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
      return [
        item.partner,
        item.partnerSummary,
        item.publicProduct,
        item.industry,
        item.cooperationType,
        item.action,
        item.result,
        item.businessMeaning,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [caseIndustry, caseMapping, caseQuery, caseRevenue, productFilter]);

  const visibleScaleSignals = useMemo(
    () =>
      productFilter === "all"
        ? scaleSignals
        : scaleSignals.filter((item) => item.product === productFilter),
    [productFilter],
  );

  const visibleCaseInsights = useMemo(
    () =>
      productFilter === "all"
        ? caseInsights
        : caseInsights.filter((item) => item.product === productFilter),
    [productFilter],
  );

  function switchView(nextView: ViewId) {
    setView(nextView);
    window.history.replaceState(null, "", `#${nextView}`);
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
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        snapshotDate: reportMeta.snapshotDate,
        notes: localNotes,
      },
      null,
      2,
    );
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
        <a className="brand" href="#top" aria-label="返回顶部">
          <span className="brand-mark">OA</span>
          <span>
            办公 Agent
            <small>竞争追踪台</small>
          </span>
        </a>
        <div className="header-meta">
          <span>数据快照 {reportMeta.snapshotDate}</span>
          <button className="header-action" type="button" onClick={() => switchView("tracker")}>
            录入新追踪
          </button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">PRODUCT RESEARCH SYSTEM</p>
          <h1>{reportMeta.title}</h1>
          <p className="hero-lead">
            先看最近新增了什么，再判断厂商往哪里发展。功能台账只保留在明细层，首页直接给出四家的方向结论和证据边界。
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => switchView("profiles")}>
              逐家查看产品差异
            </button>
            <button className="secondary-button" type="button" onClick={() => switchView("matrix")}>
              查看横向对比
            </button>
            <button
              className="secondary-button"
              type="button"
              onClick={() => switchView("cases")}
            >
              查看客户与合作
            </button>
          </div>
        </div>
        <aside className="signal-board" aria-label="当前信号">
          <div className="signal-heading">
            <span>当前信号</span>
            <span className="live-dot">已核验</span>
          </div>
          <div className="signal-main">
            <strong>四条产品路线</strong>
            <span>差异来自切入点和企业生意</span>
          </div>
          <div className="signal-grid">
            <div>
              <span>产品</span>
              <strong>4</strong>
            </div>
            <div>
              <span>关键更新</span>
              <strong>{updates.length}</strong>
            </div>
            <div>
              <span>界面截图</span>
              <strong>{screenshots.length}</strong>
            </div>
            <div>
              <span>企业合作</span>
              <strong>{companyCases.length}</strong>
            </div>
          </div>
          <p>下次建议复核 {reportMeta.nextReviewDate}</p>
        </aside>
      </section>

      <nav className="view-tabs" aria-label="报告视图">
        <div className="side-nav-heading">
          <span>研究目录</span>
          <strong>办公 Agent 友商分析</strong>
        </div>
        {(["核心分析", "证据与维护"] as const).map((group) => (
          <div className="side-nav-group" key={group}>
            <span className="side-nav-label">{group}</span>
            {viewLabels.filter((item) => item.group === group).map((item) => (
              <button
                aria-current={view === item.id ? "page" : undefined}
                className={view === item.id ? "view-tab active" : "view-tab"}
                key={item.id}
                type="button"
                onClick={() => switchView(item.id)}
              >
                <span>{item.label}</span>
                <small>{item.description}</small>
              </button>
            ))}
          </div>
        ))}
        <div className="side-nav-meta">
          <span>数据快照</span>
          <strong>{reportMeta.snapshotDate}</strong>
          <small>下次复核 {reportMeta.nextReviewDate}</small>
        </div>
      </nav>

      <div className="toolbar">
        <ProductFilterBar value={productFilter} onChange={setProductFilter} />
        <p className="method-note">{reportMeta.method}</p>
      </div>

      {view === "latest" && (
        <>
          <section className="section latest-section">
            <div className="section-heading">
              <div>
                <p className="section-index">最重要的结论</p>
                <h2>最近新增能力正在把四家带向哪里</h2>
              </div>
              <p>先把同一阶段新增的能力连起来，再判断发展方向。单个功能不会单独形成结论。</p>
            </div>
            <div className="latest-direction-grid">
              {filteredLatestDirections.map((item) => (
                <article className="latest-direction-card" key={item.product} style={productStyle(item.product)}>
                  <div className="latest-card-topline">
                    <span className="product-name">
                      <span className="product-dot" />
                      {productMap[item.product].name}
                    </span>
                    <span>更新至 {item.latestDate}</span>
                  </div>
                  <div className="direction-answer">
                    <span>一句话方向</span>
                    <h3>{item.direction}</h3>
                  </div>
                  <div className="latest-capabilities">
                    <span>最近新增能力</span>
                    <ul>
                      {item.capabilities.map((capability) => (
                        <li key={capability}>{capability}</li>
                      ))}
                    </ul>
                  </div>
                  <dl className="direction-reasoning">
                    <div>
                      <dt>为什么这样判断</dt>
                      <dd>{item.reason}</dd>
                    </div>
                    <div>
                      <dt>目前不能下的结论</dt>
                      <dd>{item.boundary}</dd>
                    </div>
                  </dl>
                  <button
                    type="button"
                    onClick={() => {
                      setProductFilter(item.product);
                      switchView("updates");
                    }}
                  >
                    查看这家厂商的完整更新
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="section conclusion-section">
            <div className="section-heading">
              <div>
                <p className="section-index">穿透结论</p>
                <h2>从能力更新穿透到竞争判断</h2>
              </div>
              <p>这些结论回答竞争位置和企业生意，不重复功能列表。</p>
            </div>
            <div className="direction-conclusion-list">
              {directionConclusions.map((item, index) => (
                <article key={item.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.conclusion}</p>
                    <small>判断依据：{item.evidence}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="section latest-implication-section">
            <div className="section-heading">
              <div>
                <p className="section-index">对 DuMate 的即时含义</p>
                <h2>先把已有能力变成可验证的企业场景</h2>
              </div>
              <p>竞争重点已经从能否生成文件，进入组织采用、运行治理和行业工作流。</p>
            </div>
            <div className="action-list">
              {actions.slice(0, 3).map((item) => (
                <article className="action-row" key={item.title}>
                  <span className={`priority ${item.priority.toLowerCase()}`}>{item.priority}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.action}</p>
                  </div>
                  <div className="success">
                    <span>成功标准</span>
                    <p>{item.success}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {view === "profiles" && (
        <section className="section profiles-section">
          <div className="section-heading">
            <div>
              <p className="section-index">四家产品拆解</p>
              <h2>从界面看四家产品结构</h2>
            </div>
            <p>每个产品都按定位、核心优势、适合客户、界面结构、最近方向、企业生意和公开边界展开。</p>
          </div>

          <div className="profile-list">
            {filteredProducts.map((product) => {
              const productScreenshots = screenshots.filter((item) => item.product === product.id);
              const productCases = companyCases.filter((item) => item.product === product.id).slice(0, 3);
              const scale = scaleSignals.find((item) => item.product === product.id);
              return (
                <article className="profile-block" key={product.id} style={productStyle(product.id)}>
                  <header className="profile-header">
                    <div>
                      <span className="product-name">
                        <span className="product-dot" />
                        {product.name}
                      </span>
                      <h2>{product.role}</h2>
                      <p>{product.route}</p>
                    </div>
                    <StateBadge state={product.evidence} />
                  </header>

                  <div className="profile-facts">
                    <div>
                      <span>核心优势</span>
                      <p>{product.strongest}</p>
                    </div>
                    <div>
                      <span>更适合谁</span>
                      <p>{product.target}</p>
                    </div>
                    <div>
                      <span>与其他三家的区别</span>
                      <p>{product.difference}</p>
                    </div>
                    <div>
                      <span>最近新增方向</span>
                      <p>{product.latest}</p>
                    </div>
                    <div>
                      <span>企业生意</span>
                      <p>{product.selling}</p>
                    </div>
                    <div>
                      <span>价格和体量</span>
                      <p>{product.pricing}</p>
                      {scale && <small>{scale.value}，{scale.metric}。{scale.boundary}</small>}
                    </div>
                  </div>

                  <div className="profile-subsection">
                    <div className="profile-subheading">
                      <div>
                        <span>界面如何体现差异</span>
                        <h3>{productScreenshots.length} 张截图对应产品结构</h3>
                      </div>
                      <p>点击可以查看原图。说明文字直接指出它与其他产品不同的地方。</p>
                    </div>
                    <div className="profile-shot-grid">
                      {productScreenshots.map((item) => (
                        <button
                          className="profile-shot-card"
                          key={item.id}
                          type="button"
                          onClick={() => setActiveScreenshot(item)}
                        >
                          <img src={item.src} alt={item.title} />
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.note}</p>
                            <span>查看原图</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="profile-subsection profile-business">
                    <div className="profile-subheading">
                      <div>
                        <span>客户信号</span>
                        <h3>哪些公开案例支持这个判断</h3>
                      </div>
                      <p>{product.boundary}</p>
                    </div>
                    <div className="profile-case-grid">
                      {productCases.map((item) => (
                        <div key={item.id}>
                          <span>{item.mappingLevel} · {item.revenueStatus}</span>
                          <h4>{item.partner}</h4>
                          <p>{item.result}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === "matrix" && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-index">差异对比</p>
              <h2>同一问题下，四家给出的答案不同</h2>
            </div>
            <p>先比较产品角色和生意，再比较具体能力。这样不会把功能数量误当成产品差异。</p>
          </div>
          <div className="matrix-wrap positioning-matrix-wrap">
            <table className="comparison-matrix positioning-matrix">
              <thead>
                <tr>
                  <th>分析问题</th>
                  {filteredProducts.map((product) => (
                    <th key={product.id} style={productStyle(product.id)}>
                      <span className="product-dot" />
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.topic}>
                    <th><strong>{row.topic}</strong></th>
                    {filteredProducts.map((product) => (
                      <td key={product.id}><p>{row.values[product.id]}</p></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="evidence-matrix-heading">
            <h3>能力证据对比</h3>
            <p>下面的状态只说明当前投入和公开证据，不代表绝对能力排名。</p>
          </div>
          <div className="legend-row">
            {(Object.keys(stateClass) as EvidenceState[]).map((state) => (
              <StateBadge state={state} key={state} />
            ))}
          </div>
          <div className="matrix-wrap">
            <table className="comparison-matrix">
              <thead>
                <tr>
                  <th>比较主题</th>
                  {filteredProducts.map((product) => (
                    <th key={product.id} style={productStyle(product.id)}>
                      <span className="product-dot" />
                      {product.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.topic}>
                    <th>
                      <strong>{row.topic}</strong>
                      <small>{row.note}</small>
                    </th>
                    {filteredProducts.map((product) => {
                      const cell = row.values[product.id];
                      return (
                        <td key={product.id}>
                          <StateBadge state={cell.state} />
                          <p>{cell.text}</p>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <aside className="matrix-conclusion">
            <span>综合判断</span>
            <p>
              WorkBuddy 的企业运行治理最完整。千问办公在专业数据和岗位套件上的包装最清楚。TRAE
              Work 在网页和多媒体成果上更突出。DuMate 的机会是把企业流程、管理员控制和快速部署做成可验证的场景包。
            </p>
          </aside>
        </section>
      )}

      {view === "cases" && (
        <section className="section company-cases-section">
          <div className="section-heading">
            <div>
              <p className="section-index">企业合作</p>
              <h2>先看产品映射，再看商业深度</h2>
            </div>
            <p>完整保留合作方、动作、公开结果、收入边界和来源，便于下一轮继续补充。</p>
          </div>

          <div className="case-insight-grid case-page-insights">
            {visibleCaseInsights.map((item) => (
              <article className="case-insight-card" key={item.product} style={productStyle(item.product)}>
                <span className="product-name">
                  <span className="product-dot" />
                  {productMap[item.product].name}
                </span>
                <h3>{item.headline}</h3>
                <p>{item.finding}</p>
                <div>
                  <span>穿透结论</span>
                  <p>{item.lesson}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="case-warning">
            <strong>合作不等于成交</strong>
            <p>
              接入、授权、活动和免费资源投放不能直接证明产品收入。同厂商其他产品的客户只能作为可跨售账户，不能算当前办公产品客户。
            </p>
          </div>

          <div className="case-controls">
            <label className="search-box case-search">
              <span>搜索名单</span>
              <input
                type="search"
                value={caseQuery}
                onChange={(event) => setCaseQuery(event.target.value)}
                placeholder="合作方、行业、场景或结果"
              />
            </label>
            <label>
              产品映射
              <select value={caseMapping} onChange={(event) => setCaseMapping(event.target.value as "全部" | CaseMappingLevel)}>
                <option>全部</option>
                <option>当前产品</option>
                <option>前身能力</option>
                <option>同厂商账户</option>
              </select>
            </label>
            <label>
              商业证据
              <select value={caseRevenue} onChange={(event) => setCaseRevenue(event.target.value as "全部" | CaseRevenueStatus)}>
                <option>全部</option>
                <option>明确采购</option>
                <option>较强部署</option>
                <option>使用未披露采购</option>
                <option>生态活动</option>
                <option>待核线索</option>
              </select>
            </label>
            <label>
              行业
              <select value={caseIndustry} onChange={(event) => setCaseIndustry(event.target.value)}>
                {caseIndustries.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="case-result-row">
            <span>显示 {filteredCases.length} 条，共 {companyCases.length} 条</span>
            <button
              type="button"
              onClick={() => {
                setCaseQuery("");
                setCaseMapping("全部");
                setCaseRevenue("全部");
                setCaseIndustry("全部");
                setProductFilter("all");
              }}
            >
              清除筛选
            </button>
          </div>

          <div className="company-case-list">
            {filteredCases.map((item) => (
              <article className="company-case-card" key={item.id} style={productStyle(item.product)}>
                <div className="company-case-topline">
                  <span className="product-name">
                    <span className="product-dot" />
                    {productMap[item.product].name}
                  </span>
                  <span className={`case-status ${caseStatusClass[item.revenueStatus]}`}>
                    {item.revenueStatus}
                  </span>
                </div>
                <div className="company-case-heading">
                  <div>
                    <h3>{item.partner}</h3>
                    <p>{item.partnerSummary}</p>
                  </div>
                  <span className="mapping-badge">{item.mappingLevel}</span>
                </div>
                <dl className="case-facts">
                  <div>
                    <dt>公开产品</dt>
                    <dd>{item.publicProduct}</dd>
                  </div>
                  <div>
                    <dt>行业</dt>
                    <dd>{item.industry}</dd>
                  </div>
                  <div>
                    <dt>合作类型</dt>
                    <dd>{item.cooperationType}</dd>
                  </div>
                  <div>
                    <dt>公开日期</dt>
                    <dd>{item.date}</dd>
                  </div>
                </dl>
                <div className="case-body-grid">
                  <div>
                    <span>公开合作动作</span>
                    <p>{item.action}</p>
                  </div>
                  <div>
                    <span>公开规模或结果</span>
                    <p>{item.result}</p>
                  </div>
                </div>
                <details className="case-evidence-details">
                  <summary>查看商业判断和证据口径</summary>
                  <dl>
                    <div>
                      <dt>产品映射</dt>
                      <dd>{item.mapping}</dd>
                    </div>
                    <div>
                      <dt>能否证明收入</dt>
                      <dd>{item.revenueProof}</dd>
                    </div>
                    <div>
                      <dt>销售与竞争含义</dt>
                      <dd>{item.businessMeaning}</dd>
                    </div>
                    <div>
                      <dt>来源类型</dt>
                      <dd>{item.sourceType}</dd>
                    </div>
                  </dl>
                  <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                    查看原始来源
                  </a>
                </details>
              </article>
            ))}
          </div>

          {filteredCases.length === 0 && (
            <div className="empty-state">
              <strong>没有匹配的企业合作记录</strong>
              <p>请清除搜索词或调整产品、映射、商业证据和行业筛选。</p>
            </div>
          )}
        </section>
      )}

      {view === "updates" && (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="section-index">更新追踪</p>
              <h2>先看方向结论，再看更新明细</h2>
            </div>
            <p>顶部把多条新增能力合成一句话方向。下方台账保留日期、影响、边界和来源。</p>
          </div>
          <div className="update-direction-summary">
            {filteredLatestDirections.map((item) => (
              <article key={item.product} style={productStyle(item.product)}>
                <div>
                  <span className="product-name">
                    <span className="product-dot" />
                    {productMap[item.product].name}
                  </span>
                  <small>更新至 {item.latestDate}</small>
                </div>
                <h3>{item.direction}</h3>
                <p>{item.reason}</p>
              </article>
            ))}
          </div>
          <div className="update-controls">
            <label className="search-box">
              <span>搜索</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索功能、判断或产品"
              />
            </label>
            <div className="category-filter" aria-label="按类别筛选">
              {categories.map((item) => (
                <button
                  className={category === item ? "category-chip active" : "category-chip"}
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="result-count">显示 {filteredUpdates.length} 条关键更新</div>
          <div className="timeline">
            {filteredUpdates.map((item) => {
              const product = productMap[item.product];
              return (
                <article className="timeline-item" key={item.id} style={productStyle(item.product)}>
                  <div className="timeline-date">{formatDate(item.date)}</div>
                  <div className="timeline-line">
                    <span />
                  </div>
                  <div className="timeline-card">
                    <div className="timeline-meta">
                      <span className="product-name">
                        <span className="product-dot" />
                        {product.name}
                      </span>
                      <span>{item.category}</span>
                      <span className={`evidence-grade grade-${item.evidence.toLowerCase()}`}>
                        证据 {item.evidence}
                      </span>
                    </div>
                    <h3>{item.title}</h3>
                    <p>{item.detail}</p>
                    <div className="impact-grid">
                      <div>
                        <span>改变了什么</span>
                        <p>{item.implication}</p>
                      </div>
                      <div>
                        <span>不能过度推断</span>
                        <p>{item.boundary}</p>
                      </div>
                    </div>
                    <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                      查看来源：{item.sourceLabel}
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
          {filteredUpdates.length === 0 && (
            <div className="empty-state">
              <strong>没有匹配的更新</strong>
              <p>请清除搜索词或切换产品和类别。</p>
            </div>
          )}
        </section>
      )}

      {view === "scale" && (
        <section className="section scale-section">
          <div className="section-heading">
            <div>
              <p className="section-index">公开体量</p>
              <h2>不把渠道规模当成产品用户</h2>
            </div>
            <p>四家公开的数字口径不同。这里先写清数字可以说明什么，再写清不能说明什么。</p>
          </div>
          <div className="case-warning">
            <strong>口径原则</strong>
            <p>
              产品用户、腾讯内部使用、QoderWork 前身席位和钉钉组织规模不能放在同一张排名图里。没有产品级数据时，直接写未公开。
            </p>
          </div>
          <div className="scale-card-grid detailed">
            {visibleScaleSignals.map((item) => (
              <article className="scale-card" key={item.product} style={productStyle(item.product)}>
                <span className="product-name">
                  <span className="product-dot" />
                  {productMap[item.product].name}
                </span>
                <strong>{item.value}</strong>
                <h3>{item.metric}</h3>
                <p>{item.meaning}</p>
                <small>{item.boundary}</small>
                <a href={item.sourceUrl} target="_blank" rel="noreferrer">查看来源</a>
              </article>
            ))}
          </div>
          <div className="scale-boundary-grid">
            <article>
              <h3>WorkBuddy 的相对位置更清楚</h3>
              <p>公开资料还给出 2026 年第二季度办公类 Agent 活跃规模第一、4 月到 6 月增幅 115.3%。但没有公开绝对外部活跃人数。</p>
            </article>
            <article>
              <h3>千问办公的渠道池很大</h3>
              <p>钉钉公开服务 2,600 万以上企业组织，但这是潜在分发池，不能算千问办公用户、客户或付费组织。</p>
            </article>
          </div>
        </section>
      )}

      {view === "tracker" && (
        <section className="section tracker-section">
          <div className="section-heading">
            <div>
              <p className="section-index">持续维护</p>
              <h2>把新发现先记成事实，再更新结论</h2>
            </div>
            <p>本地记录只保存在当前设备。导出 JSON 后可以进入 GitHub 数据更新流程。</p>
          </div>
          <div className="tracker-layout">
            <form className="tracker-form" onSubmit={handleAddNote}>
              <div className="form-heading">
                <div>
                  <span>新追踪</span>
                  <h3>添加一条事实记录</h3>
                </div>
                <span className="local-label">本地草稿</span>
              </div>
              <div className="form-grid">
                <label>
                  日期
                  <input name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
                </label>
                <label>
                  产品
                  <select name="product" defaultValue="dumate">
                    {products.map((product) => (
                      <option value={product.id} key={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  类别
                  <select name="category" defaultValue="新增功能">
                    <option>新增功能</option>
                    <option>价格变化</option>
                    <option>企业能力</option>
                    <option>客户案例</option>
                    <option>来源补充</option>
                    <option>实测结果</option>
                  </select>
                </label>
                <label>
                  事实状态
                  <select name="status" defaultValue="待验证">
                    <option>已确认</option>
                    <option>待验证</option>
                    <option>仅记录</option>
                  </select>
                </label>
              </div>
              <label>
                标题
                <input name="title" placeholder="一句话说明发现了什么" />
              </label>
              <label>
                事实记录
                <textarea
                  name="detail"
                  rows={5}
                  placeholder="写清公开资料实际说了什么。先不要写因果判断。"
                />
              </label>
              <label>
                来源链接或文件
                <input name="source" placeholder="https:// 或文件名称" />
              </label>
              <button className="primary-button form-submit" type="submit">
                保存到当前设备
              </button>
            </form>

            <aside className="maintenance-panel">
              <h3>每周维护顺序</h3>
              <ol>
                <li>
                  <span>01</span>
                  <p>先补来源、日期和事实状态。</p>
                </li>
                <li>
                  <span>02</span>
                  <p>把修复、促销和新增能力分开。</p>
                </li>
                <li>
                  <span>03</span>
                  <p>检查方向是否连续，以及是否已经进入套餐和企业后台。</p>
                </li>
                <li>
                  <span>04</span>
                  <p>最后更新产品判断、边界和 DuMate 动作。</p>
                </li>
              </ol>
              <div className="maintenance-actions">
                <button type="button" onClick={handleExport} disabled={localNotes.length === 0}>
                  导出追踪 JSON
                </button>
                <label className="import-button">
                  导入追踪 JSON
                  <input type="file" accept=".json,application/json" onChange={handleImport} />
                </label>
              </div>
              <p className="maintenance-help">
                导出的文件可以随新 Excel 一起提交。更新项目数据后，网页会保留统一的比较结构。
              </p>
            </aside>
          </div>

          {notice && <div className="notice" role="status">{notice}</div>}

          <div className="local-records">
            <div className="records-heading">
              <h3>当前设备的追踪记录</h3>
              <span>{localNotes.length} 条</span>
            </div>
            {localNotes.length === 0 ? (
              <div className="empty-state compact">
                <strong>还没有本地记录</strong>
                <p>新增记录后，可以筛选、导出并交给下一轮分析。</p>
              </div>
            ) : (
              <div className="record-list">
                {localNotes.map((note) => (
                  <article className="record-card" key={note.id} style={productStyle(note.product)}>
                    <div className="record-meta">
                      <span className="product-name">
                        <span className="product-dot" />
                        {productMap[note.product].name}
                      </span>
                      <span>{note.date}</span>
                      <span>{note.status}</span>
                    </div>
                    <h4>{note.title}</h4>
                    <p>{note.detail}</p>
                    {note.source && <small>来源：{note.source}</small>}
                    <button type="button" onClick={() => handleDeleteNote(note.id)}>
                      删除本地记录
                    </button>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <footer>
        <div>
          <strong>{reportMeta.title}</strong>
          <p>源表：{reportMeta.sourceWorkbook}</p>
          <p>企业合作表：{reportMeta.caseWorkbook}</p>
        </div>
        <div>
          <span>数据快照 {reportMeta.snapshotDate}</span>
          <span>建议每周补来源，每月更新方向判断</span>
        </div>
      </footer>

      {activeScreenshot && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={activeScreenshot.title}
          onClick={() => setActiveScreenshot(null)}
        >
          <div className="lightbox-panel" onClick={(event) => event.stopPropagation()}>
            <button
              className="lightbox-close"
              type="button"
              onClick={() => setActiveScreenshot(null)}
              aria-label="关闭原图"
            >
              关闭
            </button>
            <img src={activeScreenshot.src} alt={activeScreenshot.title} />
            <div>
              <span>{productMap[activeScreenshot.product].name}</span>
              <h3>{activeScreenshot.title}</h3>
              <p>{activeScreenshot.note}</p>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
