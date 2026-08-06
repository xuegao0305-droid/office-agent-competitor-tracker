---
name: build-expert-ledger
description: Use when consolidating expert-network or intermediary candidate profiles into a concise Excel ledger and comparing possible duplicate identities across sources.
---

# Build Expert Ledger

Turn raw expert recommendations from multiple intermediaries into one compact, readable Excel worksheet. Preserve every source row and treat deduplication as a conservative text-based hint, never an automatic merge.

## Required sub-skill

Use `spreadsheets:Spreadsheets` for spreadsheet authoring, rendering, and final verification. Follow its runtime setup instructions before running the included builder.

## Workflow

1. Extract one record per intermediary recommendation. Keep source IDs, tax wording, multipliers, time precision, availability, and stated limitations exactly as supplied.
2. Shorten responsibilities and capability notes faithfully. Do not infer customer lists, geographic coverage, confidential data access, or facts absent from the source.
3. Compare possible identities only from supplied text. Check company, exact position, tenure, distinctive career history, and unusually specific responsibility wording. Label a pair `高度相似` only when several independent anchors align. Otherwise write `信息不足，暂不合并` or omit the pair from the short duplicate-check section.
4. Keep all records even when a pair is highly similar. The recommended handling is to ask the intermediaries to confirm before booking.
5. Build an input file using [references/input-schema.md](references/input-schema.md).
6. Prepare the spreadsheet runtime in a writable task directory. Copy the included builder into that directory so its `@oai/artifact-tool` import resolves through the loader-provided `node_modules` link. Never modify the loader dependency directory:

   ```bash
   cp "<skill-directory>/scripts/build_expert_ledger.mjs" "<work-directory>/"
   ln -s "<loader-node-modules>" "<work-directory>/node_modules"
   cd "<work-directory>"
   "<loader-node>" build_expert_ledger.mjs input.json output.xlsx preview.png
   ```

7. Reopen the `.xlsx`, confirm that it has exactly one worksheet named `专家台账与去重`, inspect the full used range, scan for formula errors, and visually inspect the preview. Fix clipped text, awkward wrapping, or unintended extra content before delivery.

## Output contract

The workbook must contain exactly one worksheet with these eight ledger columns:

1. 来源 / 编号
2. 友商
3. 职位 / 任职时间
4. 主要职责（原始摘要）
5. 中介确认的可提供信息 / 限制
6. 报价（原文）
7. 可约时间
8. 去重提示（仅基于文本）

Place a short duplicate-check section below the ledger on the same worksheet. Keep the result concise enough to review as one page-like sheet.

## Guardrails

- Do not add rankings, recommendations, selection scores, interview questions, or data-collection templates unless the user explicitly asks.
- Do not normalize tax, calculate comparable prices, or rewrite multipliers. Preserve the quote as source text.
- Keep every intermediary-supplied field as literal text; never allow source strings to execute as spreadsheet formulas.
- Do not merge two experts merely because the company or job family matches.
- Do not delete a repeated recommendation. Flag it and keep both source rows.
- Do not create extra worksheets.
