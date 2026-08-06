import fs from 'node:fs/promises';
import path from 'node:path';
import { Workbook, SpreadsheetFile } from '@oai/artifact-tool';

const [inputPath, outputPath, previewPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  throw new Error('Usage: node build_expert_ledger.mjs <input.json> <output.xlsx> [preview.png]');
}

const resolvedPaths = [inputPath, outputPath, previewPath]
  .filter(Boolean)
  .map((filePath) => path.resolve(filePath));

async function canonicalPath(filePath) {
  try {
    return await fs.realpath(filePath);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    try {
      const realParent = await fs.realpath(path.dirname(filePath));
      return path.join(realParent, path.basename(filePath));
    } catch (parentError) {
      if (parentError?.code !== 'ENOENT') throw parentError;
      return filePath;
    }
  }
}

const canonicalPaths = await Promise.all(resolvedPaths.map(canonicalPath));
const existingFileIds = (await Promise.all(resolvedPaths.map(async (filePath) => {
  try {
    const stat = await fs.stat(filePath);
    return `${stat.dev}:${stat.ino}`;
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
    return null;
  }
}))).filter(Boolean);

if (
  new Set(canonicalPaths).size !== canonicalPaths.length
  || new Set(existingFileIds).size !== existingFileIds.length
) {
  throw new Error('Input JSON, output XLSX, and preview PNG paths must be different');
}

const input = JSON.parse(await fs.readFile(inputPath, 'utf8'));
const recordKeys = [
  'source',
  'company',
  'roleTenure',
  'responsibilities',
  'capabilityLimits',
  'quote',
  'availability',
  'dedupNote',
];

if (!input || typeof input !== 'object' || Array.isArray(input)) {
  throw new Error('input must be a JSON object');
}
if (!Array.isArray(input.records) || input.records.length === 0) {
  throw new Error('input.records must be a non-empty array');
}

for (const [index, record] of input.records.entries()) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    throw new Error(`records[${index}] must be an object`);
  }
  for (const key of recordKeys) {
    if (typeof record[key] !== 'string' || !record[key].trim()) {
      throw new Error(`records[${index}].${key} must be a non-empty string`);
    }
  }
}

const duplicateChecks = input.duplicateChecks === undefined ? [] : input.duplicateChecks;
if (!Array.isArray(duplicateChecks)) {
  throw new Error('input.duplicateChecks must be an array when provided');
}

for (const [index, check] of duplicateChecks.entries()) {
  if (!check || typeof check !== 'object' || Array.isArray(check)) {
    throw new Error(`duplicateChecks[${index}] must be an object`);
  }
  for (const key of ['candidates', 'sharedEvidence', 'handling']) {
    if (typeof check[key] !== 'string' || !check[key].trim()) {
      throw new Error(`duplicateChecks[${index}].${key} must be a non-empty string`);
    }
  }
  if (!['high', 'insufficient'].includes(check.level)) {
    throw new Error(`duplicateChecks[${index}].level must be high or insufficient`);
  }
}

for (const key of ['title', 'note']) {
  if (input[key] !== undefined && (typeof input[key] !== 'string' || !input[key].trim())) {
    throw new Error(`input.${key} must be a non-empty string when provided`);
  }
}

const title = typeof input.title === 'string' && input.title.trim()
  ? input.title
  : '专家台账与去重';
const note = typeof input.note === 'string' && input.note.trim()
  ? input.note
  : '全部中介原始推荐均逐条保留；去重仅作文本相似提示，不直接合并。';

const workbook = Workbook.create();
const sheet = workbook.worksheets.add('专家台账与去重');
sheet.showGridLines = false;

const colors = {
  navy: '#153B5B',
  blue: '#2D6A96',
  paleBlue: '#EAF3F8',
  paleAmber: '#FFF7E6',
  paleRed: '#FDECEC',
  paleGreen: '#EDF7F0',
  gray: '#667085',
  border: '#D0D5DD',
  white: '#FFFFFF',
};

function rowHeight(address, value) {
  sheet.getRange(address).format.rowHeight = value;
}

function estimatedLineCount(value, charactersPerLine) {
  return String(value).split('\n').reduce(
    (total, line) => total + Math.max(1, Math.ceil(line.length / charactersPerLine)),
    0,
  );
}

function asExcelLiteral(value) {
  return value.startsWith('=') ? `'${value}` : value;
}

function section(address, text, fill = colors.paleBlue) {
  sheet.mergeCells(address);
  const range = sheet.getRange(address);
  range.values = [[text]];
  range.format = {
    fill,
    font: { bold: true, color: colors.navy },
    verticalAlignment: 'center',
    borders: { preset: 'outside', style: 'thin', color: colors.border },
  };
}

function formatHeader(range) {
  range.format = {
    fill: colors.blue,
    font: { bold: true, color: colors.white },
    horizontalAlignment: 'center',
    verticalAlignment: 'center',
    wrapText: true,
    borders: { preset: 'all', style: 'thin', color: '#B6C6D3' },
  };
}

function formatBody(range) {
  range.format = {
    verticalAlignment: 'top',
    wrapText: true,
    borders: { preset: 'all', style: 'thin', color: colors.border },
  };
}

sheet.mergeCells('A1:H1');
sheet.getRange('A1').values = [[asExcelLiteral(title)]];
sheet.getRange('A1:H1').format = {
  fill: colors.navy,
  font: { bold: true, color: colors.white, size: 16 },
  horizontalAlignment: 'left',
  verticalAlignment: 'center',
};

sheet.mergeCells('A2:H2');
sheet.getRange('A2').values = [[asExcelLiteral(note)]];
sheet.getRange('A2:H2').format = {
  fill: colors.paleBlue,
  font: { color: colors.gray },
  verticalAlignment: 'center',
  wrapText: true,
};
rowHeight('A1:H1', 28);
rowHeight('A2:H2', 32);

section('A4:H4', '专家台账（按中介原始推荐逐条保留）');
const headers = [
  '来源 / 编号',
  '友商',
  '职位 / 任职时间',
  '主要职责（原始摘要）',
  '中介确认的可提供信息 / 限制',
  '报价（原文）',
  '可约时间',
  '去重提示（仅基于文本）',
];
sheet.getRange('A5:H5').values = [headers];
formatHeader(sheet.getRange('A5:H5'));

const recordStartRow = 6;
const recordEndRow = recordStartRow + input.records.length - 1;
const recordRows = input.records.map((record) => recordKeys.map((key) => asExcelLiteral(record[key])));
sheet.getRange(`A${recordStartRow}:H${recordEndRow}`).values = recordRows;
formatBody(sheet.getRange(`A${recordStartRow}:H${recordEndRow}`));
sheet.getRange(`A${recordStartRow}:C${recordEndRow}`).format.horizontalAlignment = 'center';
sheet.getRange(`F${recordStartRow}:G${recordEndRow}`).format.horizontalAlignment = 'center';
sheet.getRange(`H${recordStartRow}:H${recordEndRow}`).conditionalFormats.add('containsText', {
  text: '高度相似；',
  format: { fill: colors.paleRed, font: { bold: true, color: '#B42318' } },
});
sheet.getRange(`H${recordStartRow}:H${recordEndRow}`).conditionalFormats.add('containsText', {
  text: '暂不合并',
  format: { fill: colors.paleAmber, font: { color: '#9A6700' } },
});
sheet.tables.add(`A5:H${recordEndRow}`, true, 'ExpertLedger');
rowHeight('A5:H5', 36);
const recordCharactersPerLine = [12, 9, 18, 24, 24, 16, 14, 28];
for (let index = 0; index < recordRows.length; index += 1) {
  const lines = Math.max(...recordRows[index].map((value, column) => (
    estimatedLineCount(value, recordCharactersPerLine[column])
  )));
  const row = recordStartRow + index;
  rowHeight(`A${row}:H${row}`, Math.min(200, Math.max(58, lines * 20 + 12)));
}

const duplicateSectionRow = recordEndRow + 2;
const duplicateHeaderRow = duplicateSectionRow + 1;
const duplicateStartRow = duplicateHeaderRow + 1;
const duplicateRows = duplicateChecks.length > 0
  ? duplicateChecks
  : [{
      candidates: '无明确疑似重复组合',
      sharedEvidence: '现有材料不足以形成需要单列的同人线索。',
      handling: '逐条保留，不合并。',
      level: 'insufficient',
    }];
const duplicateEndRow = duplicateStartRow + duplicateRows.length - 1;

section(
  `A${duplicateSectionRow}:H${duplicateSectionRow}`,
  '去重判断（仅列出文本上需要注意的关系）',
  colors.paleAmber,
);
sheet.getRange(`A${duplicateHeaderRow}:H${duplicateHeaderRow}`).values = [[
  '涉及候选', null, null,
  '文本层面的共同点', null, null,
  '保守处理', null,
]];
sheet.mergeCells(`A${duplicateHeaderRow}:C${duplicateHeaderRow}`);
sheet.mergeCells(`D${duplicateHeaderRow}:F${duplicateHeaderRow}`);
sheet.mergeCells(`G${duplicateHeaderRow}:H${duplicateHeaderRow}`);
formatHeader(sheet.getRange(`A${duplicateHeaderRow}:H${duplicateHeaderRow}`));

for (let index = 0; index < duplicateRows.length; index += 1) {
  const row = duplicateStartRow + index;
  const check = duplicateRows[index];
  sheet.getRange(`A${row}:H${row}`).values = [[
    asExcelLiteral(check.candidates), null, null,
    asExcelLiteral(check.sharedEvidence), null, null,
    asExcelLiteral(check.handling), null,
  ]];
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.mergeCells(`D${row}:F${row}`);
  sheet.mergeCells(`G${row}:H${row}`);
  formatBody(sheet.getRange(`A${row}:H${row}`));

  if (check.level === 'high') {
    sheet.getRange(`G${row}:H${row}`).format = {
      fill: colors.paleRed,
      font: { bold: true, color: '#B42318' },
      verticalAlignment: 'top',
      wrapText: true,
      borders: { preset: 'all', style: 'thin', color: colors.border },
    };
  } else {
    sheet.getRange(`G${row}:H${row}`).format = {
      fill: colors.paleAmber,
      font: { color: '#9A6700' },
      verticalAlignment: 'top',
      wrapText: true,
      borders: { preset: 'all', style: 'thin', color: colors.border },
    };
  }
}
rowHeight(`A${duplicateHeaderRow}:H${duplicateHeaderRow}`, 34);
for (let index = 0; index < duplicateRows.length; index += 1) {
  const check = duplicateRows[index];
  const lines = Math.max(
    estimatedLineCount(check.candidates, 36),
    estimatedLineCount(check.sharedEvidence, 70),
    estimatedLineCount(check.handling, 40),
  );
  const row = duplicateStartRow + index;
  rowHeight(`A${row}:H${row}`, Math.min(160, Math.max(52, lines * 20 + 12)));
}

const finalNoteRow = duplicateEndRow + 2;
sheet.mergeCells(`A${finalNoteRow}:H${finalNoteRow}`);
sheet.getRange(`A${finalNoteRow}`).values = [[
  '其余同公司、相近岗位的候选，现有材料不足以判断是否同一人，表内不作合并。',
]];
sheet.getRange(`A${finalNoteRow}:H${finalNoteRow}`).format = {
  fill: colors.paleGreen,
  font: { color: '#2F855A' },
  verticalAlignment: 'center',
  wrapText: true,
  borders: { preset: 'outside', style: 'thin', color: '#B7D8C1' },
};
rowHeight(`A${finalNoteRow}:H${finalNoteRow}`, 28);

for (const [column, value] of Object.entries({
  A: 19, B: 13, C: 26, D: 39, E: 39, F: 24, G: 22, H: 42,
})) {
  sheet.getRange(`${column}1:${column}1`).format.columnWidth = value;
}
sheet.freezePanes.freezeRows(5);
sheet.freezePanes.freezeColumns(2);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);

if (previewPath) {
  await fs.mkdir(path.dirname(previewPath), { recursive: true });
  const preview = await workbook.render({
    sheetName: '专家台账与去重',
    autoCrop: 'all',
    scale: 1.1,
    format: 'png',
  });
  await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));
}

console.log(`SAVED ${outputPath}`);
