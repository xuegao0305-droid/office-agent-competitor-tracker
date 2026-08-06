# Input JSON schema

The builder accepts one UTF-8 JSON file. Normalize the source material into this schema without adding estimates or invented facts.

## Top-level fields

- `title` (optional string): Workbook title.
- `note` (optional string): Short scope note shown below the title.
- `records` (required non-empty array): One item for every intermediary recommendation. Never remove a record because it may duplicate another.
- `duplicateChecks` (optional array): Only the cross-source relationships worth calling out.

## Record fields

Every record field is required and must be a string. Use `待定` or `未注明` when the source says so; do not leave the meaning ambiguous.

- `source`: Intermediary plus its original identifier, such as `六度-1.2`.
- `company`: Current target company or competitor.
- `roleTenure`: Position and tenure, keeping the source's precision.
- `responsibilities`: Short source-faithful responsibility summary.
- `capabilityLimits`: What the intermediary confirmed the expert can provide, plus stated limits.
- `quote`: Quote exactly as supplied, including tax status and multipliers.
- `availability`: Availability exactly as supplied.
- `dedupNote`: Short text-only comparison note. Even a highly similar record stays in the ledger.

## Duplicate-check fields

- `candidates`: Source IDs separated by a newline.
- `sharedEvidence`: Matching and conflicting anchors visible in the supplied text.
- `handling`: Conservative action, normally confirm before booking and do not merge.
- `level`: `high` or `insufficient`. Use `high` only when multiple independent anchors align, such as company, exact title, tenure, and unusually specific responsibilities. Use `insufficient` for every other relationship retained for caution.

The input JSON, output XLSX, and optional preview PNG paths must be three different paths. The builder rejects collisions before reading or writing files.

## Minimal example

```json
{
  "title": "项目｜专家台账",
  "note": "全部来源逐条保留；去重仅作文本提示，不直接合并。",
  "records": [
    {
      "source": "中介A-1",
      "company": "甲公司",
      "roleTenure": "解决方案负责人\n2021–至今",
      "responsibilities": "负责产品与行业解决方案。",
      "capabilityLimits": "已确认可以分享。",
      "quote": "¥4,000/h（含税）",
      "availability": "待定",
      "dedupNote": "与中介B-1高度相似；待确认，本表不合并。"
    },
    {
      "source": "中介B-1",
      "company": "甲公司",
      "roleTenure": "解决方案负责人\n2021–至今",
      "responsibilities": "负责产品与行业解决方案。",
      "capabilityLimits": "已确认可以分享。",
      "quote": "¥3,800/h（不含税）",
      "availability": "待定",
      "dedupNote": "与中介A-1高度相似；待确认，本表不合并。"
    }
  ],
  "duplicateChecks": [
    {
      "candidates": "中介A-1\n中介B-1",
      "sharedEvidence": "公司、职位、任职时间和职责描述一致。",
      "handling": "高度相似；约前确认，不合并。",
      "level": "high"
    }
  ]
}
```
