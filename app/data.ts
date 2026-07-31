import companyCasesRaw from "./company-cases.json";

const assetBase = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export type ProductId = "dumate" | "workbuddy" | "qwenwork" | "traework";

export type CaseRevenueStatus =
  | "明确采购"
  | "较强部署"
  | "使用未披露采购"
  | "生态活动"
  | "待核线索";

export type CaseMappingLevel = "当前产品" | "前身能力" | "同厂商账户";

export type CompanyCase = {
  id: string;
  product: ProductId;
  publicProduct: string;
  mapping: string;
  mappingLevel: CaseMappingLevel;
  partner: string;
  partnerSummary: string;
  industry: string;
  cooperationType: string;
  action: string;
  result: string;
  revenueProof: string;
  revenueStatus: CaseRevenueStatus;
  businessMeaning: string;
  date: string;
  sourceType: string;
  sourceUrl: string;
};

export type EvidenceState =
  | "当前主方向"
  | "已产品化"
  | "持续补齐"
  | "新近进入"
  | "待验证"
  | "公开证据少";

export type ResearchUpdate = {
  id: string;
  date: string;
  product: ProductId;
  category: string;
  title: string;
  detail: string;
  implication: string;
  boundary: string;
  sourceLabel: string;
  sourceUrl: string;
  evidence: "A" | "B" | "C";
};

export const reportMeta = {
  title: "办公 Agent 竞争追踪台",
  snapshotDate: "2026-07-31",
  nextReviewDate: "2026-08-06",
  sourceWorkbook:
    "办公Agent友商调研_趋势研判版_DuMate_WorkBuddy_千问办公_TRAEWork_20260730.xlsx",
  caseWorkbook: "办公Agent企业合作表_mapping补全_20260731.xlsx",
  method:
    "先记录事实，再判断方向。近期新增、连续投入、商业化包装和客户验证至少有两类相互支持，才形成方向结论。",
};

export const companyCases = companyCasesRaw as CompanyCase[];

export const caseInsights = [
  {
    product: "dumate" as ProductId,
    headline: "渠道动作已经出现，直接客户证据仍少",
    finding:
      "华硕联合方案证明 DuMate 正在走 AI PC 和硬件渠道。OPC 社区用于获客。当前仍缺少具名企业采购和持续使用数据。",
    lesson: "先补一个可公开的生产部署案例，再证明从单部门向第二部门扩张。",
  },
  {
    product: "workbuddy" as ProductId,
    headline: "直接产品案例最多，生意已从席位扩到交付服务",
    finding:
      "东阳光公开采购 100 余个账号。政务、医疗、文创和内容企业出现正式部署，渠道侧又出现代理、培训、系统集成和垂类 Skill。",
    lesson: "可借鉴知识底座切入、行业伙伴补能力、服务商完成实施，再推动集团扩张的组合路径。",
  },
  {
    product: "qwenwork" as ProductId,
    headline: "企业账户基础强，但多数案例不能算千问办公直接成交",
    finding:
      "易仓和前程无忧已经把 QoderWork 扩到非技术岗位。海信、亚信等大规模案例主要属于 Qoder 企业账户池。",
    lesson: "最值得观察的是研发工具切入、统一额度池、培训激活，再向营销、运营和客服扩张。",
  },
  {
    product: "traework" as ProductId,
    headline: "企业部署能力有基础，Work 专属商业证据仍弱",
    finding:
      "汇付天下证明 TRAE 企业版可以完成试点和规模推广。CubeOne 与脉脉更接近产品使用和品牌获客，不能算 TRAE Work 企业成交。",
    lesson: "需要追踪非研发部门的独立采购、企业价格、治理能力和可复制场景。",
  },
];

export const products = [
  {
    id: "dumate" as ProductId,
    name: "DuMate",
    short: "企业流程执行",
    color: "#3478f6",
    role: "低门槛的企业流程执行工具",
    strongest: "管理员统一分发 Skill、跨端发起任务，并快速交付文档、表格、演示或网页成果。",
    target: "希望从一个部门或一个流程开始，不想先做重型集成的企业。",
    difference:
      "比 WorkBuddy 更轻，比千问办公更少依赖专业数据与组织入口，比 TRAE Work 更接近标准办公和部门治理。",
    route:
      "把通用桌面执行包装成企业更容易统一管理、跨端发起和直接交付成果的部门级工具。",
    latest:
      "企业版上线后，继续补移动遥控、跨端同步、插件套件、执行环境和网页公开发布。",
    selling:
      "标准企业席位和共享资源点。重点是低门槛部署、管理员统一分发和部门内扩张。",
    boundary:
      "公开资料还不能证明记忆自进化、运行期评测和命名客户已经形成完整闭环。",
    next:
      "企业 Skill 使用审计、记忆治理、专业数据合作、VPC 边界和客户持续使用。",
    pricing: "个人 Pro 59 元每月，企业 189 元每席每月",
    evidence: "持续补齐" as EvidenceState,
    tags: ["本地安全", "企业版", "跨端", "网页发布", "Skill 分发"],
  },
  {
    id: "workbuddy" as ProductId,
    name: "WorkBuddy",
    short: "企业 Agent 运行",
    color: "#14a981",
    role: "腾讯生态中的办公与企业 Agent 运行平台",
    strongest: "把个人办公、项目协作、企业智能体、托管 Runtime、评测和私有化放在一条产品线上。",
    target: "已经使用腾讯云、腾讯文档、企业微信、乐享、会议或 TAPD 的中大型组织。",
    difference:
      "四家中企业运行治理和部署层次最完整，优势来自腾讯办公生态和 Agent 运行能力，不只是单个办公功能。",
    route:
      "从办公工作台与腾讯生态入口，继续延伸到企业 Agent 的托管运行、下发、评测和生命周期管理。",
    latest:
      "新增企业智能体、腾讯文档深度集成、本地长期记忆编辑，以及云端 Runtime、凭据、Session 和评测。",
    selling:
      "个人会员、企业套件、VPC、私有化和托管 Runtime。商业模式已经从席位扩到 Agent 生产运行。",
    boundary:
      "WMA 的价格、付费客户和 WorkBuddy 席位内的实际使用仍未公开。",
    next:
      "WMA 定价、企业 Agent 使用频次、评测结果、实际席位采用和第二部门扩张。",
    pricing: "个人标准版 99 元每月，企业 SaaS 198 元每席每月",
    evidence: "当前主方向" as EvidenceState,
    tags: ["腾讯生态", "项目协作", "长期记忆", "Runtime", "企业评测"],
  },
  {
    id: "qwenwork" as ProductId,
    name: "千问办公",
    alias: "前身能力包含 QoderWork",
    short: "专业数据和岗位工作流",
    color: "#e67e22",
    role: "专业数据和钉钉组织入口驱动的岗位工作流",
    strongest: "把专业数据、可编辑 Office、岗位套件和钉钉组织触达组合成直接可用的工作流。",
    target: "使用钉钉或阿里云，并依赖工商、运营、销售、跨境电商等外部数据的团队。",
    difference:
      "差异不在基础 Agent 能力，而在数据默认可用、岗位模板和钉钉分发。当前品牌的直接客户证据仍少。",
    route:
      "把专业数据和钉钉组织入口包装成网页、桌面和企业即时通信多入口的岗位工作流。",
    latest:
      "官网已提供在线使用，并公开企业即时通信能力、可编辑 Office、企查查数据和岗位技能套件。",
    selling:
      "个人订阅、企业席位、专业数据和 VPC 咨询。钉钉和阿里云采购链路负责组织触达。",
    boundary:
      "品牌上线时间短。专业数据的授权、字段、更新时间、引用和成本需要逐项实测。",
    next:
      "网页使用量、钉钉组织激活、专业数据付费转化、岗位套件复用率和企业续费。",
    pricing: "个人最低月均约 69 元，企业 198 元每席每月",
    evidence: "当前主方向" as EvidenceState,
    tags: ["专业数据", "钉钉", "可编辑 Office", "岗位套件", "企业连接器"],
  },
  {
    id: "traework" as ProductId,
    name: "TRAE Work",
    short: "工程交付向通用工作扩张",
    color: "#8b5cf6",
    role: "从工程交付扩展到通用工作的成果生产工具",
    strongest: "把 Work、Code 和 Design 放在同一环境，擅长交互网页、设计转代码和多媒体成果。",
    target: "开发、设计、数据、内容和数字化团队，以及需要交付可运行成果的小团队。",
    difference:
      "四家中工程和网页交付底座最强，但传统办公部门的企业治理、采购和规模采用证据最弱。",
    route:
      "以代码和网页交付为底座，继续进入专业数据、多媒体和通用知识工作。",
    latest:
      "新增插件市场、工作知识库、交互式网页、北大法宝 MCP，以及图像和视频生成能力。",
    selling:
      "个人端按积分、并发和优先响应收费。Work 独立企业成交模式仍不清晰。",
    boundary:
      "单一法律数据源不能证明已经形成专业数据矩阵。TRAE 编码客户也不能直接算作 Work 客户。",
    next:
      "法律、营销和数据场景能否形成可复制客户，以及 Work 专属企业价格和治理能力。",
    pricing: "个人 Lite 49 元每月，Work 独立企业价格未公开",
    evidence: "新近进入" as EvidenceState,
    tags: ["Work", "Code", "Design", "交互网页", "多媒体"],
  },
];

export const comparisonRows = [
  {
    topic: "核心角色",
    values: {
      dumate: "企业流程执行工具",
      workbuddy: "办公与企业 Agent 运行平台",
      qwenwork: "数据驱动的岗位工作流",
      traework: "工程型成果生产工具",
    },
  },
  {
    topic: "主要切入点",
    values: {
      dumate: "单部门、单流程、快速 SaaS 部署",
      workbuddy: "腾讯办公生态、项目协作和企业 Agent",
      qwenwork: "专业数据、钉钉和岗位套件",
      traework: "开发、设计、网页和多媒体交付",
    },
  },
  {
    topic: "最强环节",
    values: {
      dumate: "低门槛治理和流程执行",
      workbuddy: "运行治理、部署层次和生态连接",
      qwenwork: "数据默认可用和组织分发",
      traework: "可运行成果和工程闭环",
    },
  },
  {
    topic: "企业生意",
    values: {
      dumate: "标准席位、共享资源点、硬件联合方案",
      workbuddy: "席位、套件、VPC、私有化、托管运行和实施服务",
      qwenwork: "席位、专业数据、钉钉渠道和 VPC 咨询",
      traework: "个人积分与并发、企业 SaaS 或 VPC 方案",
    },
  },
  {
    topic: "当前证据缺口",
    values: {
      dumate: "具名企业采购、持续使用和部门扩张",
      workbuddy: "外部付费规模、WMA 价格和实际使用频次",
      qwenwork: "当前品牌的直接客户、活跃和续费",
      traework: "Work 专属企业价格、非研发客户和治理采用",
    },
  },
];

export const scaleSignals = [
  {
    product: "dumate" as ProductId,
    value: "3,000",
    metric: "Chrome 扩展用户",
    meaning: "可观察的渠道触点下限",
    boundary: "不是 DuMate 总用户、活跃用户或付费用户。",
    sourceUrl:
      "https://chromewebstore.google.com/detail/dumate-browser-extension/fklcaighdkipgkilgibijfpgjobajiab",
  },
  {
    product: "workbuddy" as ProductId,
    value: "1.2 万+",
    metric: "腾讯内部常态化使用人数",
    meaning: "目前最清楚的产品级使用下限",
    boundary: "属于腾讯内部使用，不能外推外部活跃或付费用户。",
    sourceUrl:
      "https://www.codebuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Product-Guide",
  },
  {
    product: "qwenwork" as ProductId,
    value: "1,500",
    metric: "易仓 Qoder 与 QoderWork 席位月",
    meaning: "前身能力的企业化验证",
    boundary: "不能当作当前千问办公累计席位或活跃用户。",
    sourceUrl: "https://qoder.com/zh/blog/qoder-case-eccang",
  },
  {
    product: "traework" as ProductId,
    value: "未公开",
    metric: "TRAE Work 产品级用户规模",
    meaning: "现阶段只能观察同品牌企业版部署",
    boundary: "TRAE 编码企业客户和 TRAE Work 办公客户需要分开。",
    sourceUrl: "https://www.trae.cn/enterprise",
  },
];

export const trends = [
  {
    title: "从通用 Agent 转向岗位工作流",
    evidence: "领域专家、岗位套件、官方 Skill 和法律数据入口同时增加。",
    leaders: "WorkBuddy 和千问办公",
    action: "DuMate 应先把通用能力封装成可直接销售和复用的场景包。",
  },
  {
    title: "从生成文件转向可编辑和可发布成果",
    evidence: "Office 编辑、网页公开发布、交互式 HTML 和一键分享逐步成为共同能力。",
    leaders: "千问办公和 TRAE Work",
    action: "实测需要记录编辑成本、发布成功率和人工接手时间。",
  },
  {
    title: "从连接器数量转向数据默认可用性",
    evidence: "同一数据服务可以接入多款产品，但默认范围和配置成本不同。",
    leaders: "千问办公当前包装最清楚",
    action: "比较授权步骤、字段深度、更新时间、引用、额度和写回能力。",
  },
  {
    title: "从桌面工具转向云端持续运行",
    evidence: "跨端同步、远程下发、云任务、托管 Runtime 和 Session 逐步成为标配。",
    leaders: "WorkBuddy WMA",
    action: "DuMate 需要补运行期治理、中断恢复和结果追踪。",
  },
  {
    title: "从功能覆盖转向企业采用证据",
    evidence: "四家能力重叠扩大，但命名客户、持续使用、评测和扩张证据仍少。",
    leaders: "WorkBuddy 的公开企业能力相对完整",
    action: "优先获得案例授权和第二部门扩张证据。",
  },
];

export const matrix = [
  {
    topic: "企业 Agent 运行治理",
    note: "比较运行、下发、评测、审计和生命周期管理。",
    values: {
      dumate: { state: "持续补齐" as EvidenceState, text: "企业版和 Skill 分发已上线，运行期评测仍需补证。" },
      workbuddy: { state: "当前主方向" as EvidenceState, text: "Runtime、Session、凭据、Trace 和评测已经形成公开组合。" },
      qwenwork: { state: "已产品化" as EvidenceState, text: "组织入口和权限清楚，运行治理深度仍需售前核验。" },
      traework: { state: "公开证据少" as EvidenceState, text: "Work 层面的企业治理不能用编码企业版替代。" },
    },
  },
  {
    topic: "专业数据",
    note: "比较默认范围、授权成本、字段深度和业务流程。",
    values: {
      dumate: { state: "公开证据少" as EvidenceState, text: "以可信网页搜索和通用数据处理为主。" },
      workbuddy: { state: "持续补齐" as EvidenceState, text: "可接企查查，但默认连接范围有限。" },
      qwenwork: { state: "当前主方向" as EvidenceState, text: "命名数据源和岗位套件的组合最清楚。" },
      traework: { state: "新近进入" as EvidenceState, text: "北大法宝 MCP 是清晰的专业数据单点。" },
    },
  },
  {
    topic: "记忆和自进化",
    note: "记忆、反思、流程更新和组织治理需要分开验证。",
    values: {
      dumate: { state: "待验证" as EvidenceState, text: "当前更新未确认记忆自进化已经上线。" },
      workbuddy: { state: "持续补齐" as EvidenceState, text: "长期记忆可编辑，但不等于组织自动学习。" },
      qwenwork: { state: "已产品化" as EvidenceState, text: "公开记忆和反思能力，组织治理仍需核验。" },
      traework: { state: "持续补齐" as EvidenceState, text: "项目上下文可用，企业自进化证据不足。" },
    },
  },
  {
    topic: "岗位和行业工作流",
    note: "比较是否可以直接选择、复用和由管理员分发。",
    values: {
      dumate: { state: "持续补齐" as EvidenceState, text: "官方 Skill 适合进一步做标准场景包。" },
      workbuddy: { state: "当前主方向" as EvidenceState, text: "专家、自定义专家和企业 Agent 配置较完整。" },
      qwenwork: { state: "当前主方向" as EvidenceState, text: "岗位套件直接面向专业用户。" },
      traework: { state: "新近进入" as EvidenceState, text: "插件、知识库和法律数据开始形成垂直场景。" },
    },
  },
  {
    topic: "成果交付",
    note: "比较可编辑性、发布、业务数据连接和返工成本。",
    values: {
      dumate: { state: "已产品化" as EvidenceState, text: "支持 Office、HTML 和网页发布，保真度需要实测。" },
      workbuddy: { state: "已产品化" as EvidenceState, text: "覆盖文档、表格、演示、媒体和网页。" },
      qwenwork: { state: "当前主方向" as EvidenceState, text: "突出可编辑 Office 和交互网页的一站交付。" },
      traework: { state: "当前主方向" as EvidenceState, text: "交互网页、设计转代码和多媒体更突出。" },
    },
  },
  {
    topic: "企业客户验证",
    note: "比较命名客户、持续使用、续费和扩张。",
    values: {
      dumate: { state: "公开证据少" as EvidenceState, text: "命名客户和量化结果仍是公开证据缺口。" },
      workbuddy: { state: "持续补齐" as EvidenceState, text: "企业能力证据较多，WMA 采用仍需单独验证。" },
      qwenwork: { state: "公开证据少" as EvidenceState, text: "当前品牌的直接客户和采用规模有限。" },
      traework: { state: "公开证据少" as EvidenceState, text: "Work 的命名企业办公客户有限。" },
    },
  },
];

export const updates: ResearchUpdate[] = [
  {
    id: "u-dumate-enterprise",
    date: "2026-06-30",
    product: "dumate",
    category: "企业治理",
    title: "企业版上线",
    detail: "企业版开始提供成员、席位、资源点和 Skill 统一分发能力。",
    implication: "DuMate 从个人工具进入部门级部署和管理员治理。",
    boundary: "大客户部署边界和使用结果仍需客户证据。",
    sourceLabel: "DuMate 企业版更新动态",
    sourceUrl: "https://cloud.baidu.com/doc/Dumate/s/amqz7imhf",
    evidence: "A",
  },
  {
    id: "u-dumate-cross-device",
    date: "2026-07-11",
    product: "dumate",
    category: "跨端执行",
    title: "补齐移动遥控、跨端同步和执行环境",
    detail: "用户可以从多个入口发起任务，并在不同设备间继续处理。",
    implication: "产品路线从单一桌面执行转向连续任务和多入口使用。",
    boundary: "跨端便利是否能提高企业持续使用仍需实测。",
    sourceLabel: "DuMate 个人版更新动态",
    sourceUrl: "https://cloud.baidu.com/doc/Dumate/s/cmmu7shvw",
    evidence: "A",
  },
  {
    id: "u-dumate-publish",
    date: "2026-07-18",
    product: "dumate",
    category: "成果交付",
    title: "网页公开发布",
    detail: "生成结果可以通过网页形式公开查看和分享。",
    implication: "交付目标从本地文件继续扩展到可直接传播的成果。",
    boundary: "网页交互能力和后续编辑成本需要任务实测。",
    sourceLabel: "DuMate 个人版更新动态",
    sourceUrl: "https://cloud.baidu.com/doc/Dumate/s/cmmu7shvw",
    evidence: "A",
  },
  {
    id: "u-workbuddy-enterprise",
    date: "2026-07-21",
    product: "workbuddy",
    category: "企业治理",
    title: "企业智能体和长期记忆编辑",
    detail: "新增企业智能体、腾讯文档深度集成和本地长期记忆编辑。",
    implication: "产品开始把个人办公和企业 Agent 配置放在同一条产品路径中。",
    boundary: "长期记忆不等于组织知识可以自动更新。",
    sourceLabel: "WorkBuddy 更新日志",
    sourceUrl: "https://www.workbuddy.cn/docs/workbuddy/Changelog",
    evidence: "A",
  },
  {
    id: "u-workbuddy-runtime",
    date: "2026-07-30",
    product: "workbuddy",
    category: "云端运行",
    title: "WMA 补齐托管 Runtime 和评测",
    detail: "公开文档覆盖 Runtime、Session、凭据、Trace、下发和评测管理。",
    implication: "WorkBuddy 正在进入企业 Agent 的生产运行和生命周期管理。",
    boundary: "价格、客户和实际使用频次未公开。",
    sourceLabel: "WorkBuddy Managed Agents",
    sourceUrl: "https://cloud.tencent.com.cn/product/workbuddy-managed-agents",
    evidence: "A",
  },
  {
    id: "u-qwenwork-web",
    date: "2026-07-30",
    product: "qwenwork",
    category: "产品入口",
    title: "千问办公提供网页使用入口",
    detail: "产品已经覆盖网页、桌面和企业即时通信入口。",
    implication: "原有 QoderWork 等能力开始在统一品牌下收敛。",
    boundary: "品牌上线时间短，产品级活跃和续费仍需观察。",
    sourceLabel: "千问办公官网",
    sourceUrl: "https://qwenwork.cn/",
    evidence: "A",
  },
  {
    id: "u-qwenwork-data",
    date: "2026-07-30",
    product: "qwenwork",
    category: "专业数据",
    title: "企查查连接器和岗位套件",
    detail: "官网和直接合作方文档显示专业数据、可编辑 Office 和岗位技能套件已经组合出现。",
    implication: "专业数据不再只是连接器，而是岗位工作流的一部分。",
    boundary: "授权、字段、时效、引用和成本需要逐项测试。",
    sourceLabel: "企查查智能体数据平台接入指南",
    sourceUrl: "https://agent.qcc.com/guide?platform=qwenwork",
    evidence: "B",
  },
  {
    id: "u-trae-market",
    date: "2026-07-21",
    product: "traework",
    category: "能力扩展",
    title: "插件市场和工作知识库",
    detail: "插件和工作知识库加强了可扩展能力和长期工作上下文。",
    implication: "TRAE Work 开始覆盖更多通用知识工作。",
    boundary: "插件数量不能替代稳定性和企业采用证据。",
    sourceLabel: "TRAE 中国站更新日志",
    sourceUrl: "https://www.trae.cn/changelog",
    evidence: "A",
  },
  {
    id: "u-trae-web",
    date: "2026-07-23",
    product: "traework",
    category: "成果交付",
    title: "交互式网页能力升级",
    detail: "网页成果继续加强交互、设计和工程交付。",
    implication: "TRAE Work 在可发布成果和工程型交付上保持清晰优势。",
    boundary: "传统办公部门是否愿意采用仍需客户案例。",
    sourceLabel: "TRAE 官方动态",
    sourceUrl: "https://www.sina.cn/media/7782325948",
    evidence: "A",
  },
  {
    id: "u-trae-data-media",
    date: "2026-07-24",
    product: "traework",
    category: "专业数据",
    title: "北大法宝 MCP 和多媒体生成",
    detail: "法律数据入口、图像生成和视频生成在同一阶段集中出现。",
    implication: "产品方向已经从代码和界面扩展到专业数据和内容工作。",
    boundary: "北大法宝是单点，不代表已经形成广泛专业数据矩阵。",
    sourceLabel: "TRAE 官方动态",
    sourceUrl: "https://www.sina.cn/media/7782325948",
    evidence: "A",
  },
];

export const screenshots = [
  {
    id: "s01",
    product: "dumate" as ProductId,
    src: `${assetBase}/screenshots/dumate-home.png`,
    title: "DuMate 首页",
    note: "首页把任务输入放在中心，入口比 WorkBuddy 更轻。它强调快速开始，而不是先进入项目、数据或工程模式。",
  },
  {
    id: "s02",
    product: "dumate" as ProductId,
    src: `${assetBase}/screenshots/dumate-skills.png`,
    title: "DuMate 专业 Skills",
    note: "官方 Skill 集中在企业流程和专业任务，说明 DuMate 更适合把流程模板交给管理员统一分发。",
  },
  {
    id: "s03",
    product: "workbuddy" as ProductId,
    src: `${assetBase}/screenshots/workbuddy-home.png`,
    title: "WorkBuddy 首页",
    note: "同一工作台放入助理、项目和多类办公能力。与 DuMate 相比，它更像完整的办公平台。",
  },
  {
    id: "s04",
    product: "workbuddy" as ProductId,
    src: `${assetBase}/screenshots/workbuddy-gamification.png`,
    title: "WorkBuddy 成长和激励",
    note: "成长任务和激励机制说明 WorkBuddy 同时重视个人激活，这为后续把个人使用带入团队提供入口。",
  },
  {
    id: "s05",
    product: "workbuddy" as ProductId,
    src: `${assetBase}/screenshots/workbuddy-knowledge.png`,
    title: "WorkBuddy 知识来源",
    note: "知识来源和连接器直接进入工作台。它的差异是借腾讯文档和企业数据形成团队上下文。",
  },
  {
    id: "s06",
    product: "workbuddy" as ProductId,
    src: `${assetBase}/screenshots/workbuddy-projects.png`,
    title: "WorkBuddy 项目协作",
    note: "项目、成员、任务和资产被放在同一结构中，说明 WorkBuddy 已从个人助手进入组织协作。",
  },
  {
    id: "s07",
    product: "qwenwork" as ProductId,
    src: `${assetBase}/screenshots/qoderwork-home.png`,
    title: "QoderWork 首页",
    note: "这是千问办公前身 QoderWork 的界面。它已经把文档、数据和浏览器任务放在统一工作流中。",
  },
  {
    id: "s08",
    product: "qwenwork" as ProductId,
    src: `${assetBase}/screenshots/qoderwork-workbench.png`,
    title: "QoderWork 工作台和模型切换",
    note: "工作台强调模型选择和任务执行。与 WorkBuddy 相比，它更靠近数据与工具编排，而不是项目协作。",
  },
  {
    id: "s09",
    product: "qwenwork" as ProductId,
    src: `${assetBase}/screenshots/qoderwork-im.png`,
    title: "QoderWork 通信入口",
    note: "通信入口展示钉钉等组织渠道。千问办公的关键差异是借现有企业账号和消息入口完成分发。",
  },
  {
    id: "s10",
    product: "traework" as ProductId,
    src: `${assetBase}/screenshots/trae-work-home.png`,
    title: "TRAE Work 首页",
    note: "首页突出直接交付结果和跨端继续任务。它不像传统办公套件，更接近自主执行环境。",
  },
  {
    id: "s11",
    product: "traework" as ProductId,
    src: `${assetBase}/screenshots/trae-work-modes.png`,
    title: "TRAE Work 三种工作模式",
    note: "Work、Code 和 Design 并列，是四家中工程和设计来源最明显的产品结构，也是它区别于其他三家的核心。",
  },
];

export const actions = [
  {
    priority: "P0",
    title: "统一销售叙事",
    action:
      "把 DuMate 定义为企业可治理的通用生产力 Agent。核心是场景包、管理员控制和快速落地。",
    success: "客户可以在五分钟内说清 DuMate 和个人工具的差别。",
  },
  {
    priority: "P0",
    title: "建立可重复实测",
    action:
      "围绕数据研究、办公成果、跨系统执行和企业 Skill 治理，记录成功率、人工接管、用时和返工。",
    success: "至少三家目标客户认同同一组成功门槛。",
  },
  {
    priority: "P1",
    title: "补齐证据缺口",
    action:
      "优先补专业数据合作、记忆治理、部署边界和命名客户案例。",
    success: "每个关键判断至少有产品证据和客户证据。",
  },
  {
    priority: "P1",
    title: "设计部门扩张",
    action:
      "从一个高频流程切入，沉淀 Skill、连接器和管理模板，再复制到相邻部门。",
    success: "试点后八周出现第二部门或增购信号。",
  },
];

export const categories = [
  "全部",
  "企业治理",
  "跨端执行",
  "云端运行",
  "成果交付",
  "专业数据",
  "能力扩展",
  "产品入口",
];
