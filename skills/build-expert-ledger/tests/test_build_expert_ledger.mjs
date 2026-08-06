import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { FileBlob, SpreadsheetFile } from '@oai/artifact-tool';

const skillDir = path.resolve(import.meta.dirname, '..');
const builder = path.join(skillDir, 'scripts', 'build_expert_ledger.mjs');
const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'expert-ledger-skill-'));

try {
  const inputPath = path.join(tempDir, 'input.json');
  const outputPath = path.join(tempDir, 'ledger.xlsx');
  const previewPath = path.join(tempDir, 'preview.png');

  const fixture = {
    title: '测试｜专家台账',
    note: '全部来源逐条保留；去重仅作文本提示，不直接合并。',
    records: [
      {
        source: '中介A-1',
        company: '甲公司',
        roleTenure: '解决方案负责人\n2021–至今',
        responsibilities: '负责产品与解决方案。',
        capabilityLimits: '已确认可以分享。',
        quote: '¥4,000/h（含税）',
        availability: '待定',
        dedupNote: '与中介B-1描述高度相似；待中介确认，本表不合并。',
      },
      {
        source: '中介B-1',
        company: '甲公司',
        roleTenure: '解决方案负责人\n2021–至今',
        responsibilities: '负责产品与解决方案。',
        capabilityLimits: '已确认可以分享。',
        quote: '¥3,800/h（不含税）',
        availability: '待定',
        dedupNote: '与中介A-1描述高度相似；待中介确认，本表不合并。',
      },
      {
        source: '中介C-1',
        company: '乙公司',
        roleTenure: '高级客户经理\n2020–至今',
        responsibilities: `负责企业客户与生态伙伴协作。${'补充原始职责说明。'.repeat(24)}`,
        capabilityLimits: '可分享省级产业和代表客户，但不便交流详细客户列表。',
        quote: '¥5,250/h（含税）',
        availability: '待定',
        dedupNote: '现有材料无高度相似候选；信息不足，暂不合并。',
      },
      {
        source: '=1+1',
        company: '丙公司',
        roleTenure: '产品负责人\n2022–至今',
        responsibilities: '=SUM(1,1)',
        capabilityLimits: '仅用于验证以等号开头的原文保持为文本。',
        quote: '=HYPERLINK("https://example.com","原文报价")',
        availability: '待定',
        dedupNote: '信息不足，暂不合并。',
      },
    ],
    duplicateChecks: [
      {
        candidates: '中介A-1\n中介B-1',
        sharedEvidence: '公司、职位、任职时间和职责描述一致。',
        handling: '高度相似；约前确认，不合并。',
        level: 'high',
      },
    ],
  };
  await fs.writeFile(inputPath, JSON.stringify(fixture, null, 2));

  const run = spawnSync(process.execPath, [builder, inputPath, outputPath, previewPath], {
    cwd: skillDir,
    encoding: 'utf8',
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);

  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(outputPath));
  const sheets = await workbook.inspect({ kind: 'sheet', include: 'id,name' });
  const sheetLines = sheets.ndjson.trim().split('\n').filter(Boolean);
  assert.equal(sheetLines.length, 1, 'workbook must contain exactly one worksheet');

  const sheet = workbook.worksheets.getItem('专家台账与去重');
  assert.equal(sheet.getRange('A1').values[0][0], fixture.title);
  assert.deepEqual(sheet.getRange('A5:H5').values[0], [
    '来源 / 编号',
    '友商',
    '职位 / 任职时间',
    '主要职责（原始摘要）',
    '中介确认的可提供信息 / 限制',
    '报价（原文）',
    '可约时间',
    '去重提示（仅基于文本）',
  ]);
  const expectedRows = fixture.records.map((record) => [
    record.source,
    record.company,
    record.roleTenure,
    record.responsibilities,
    record.capabilityLimits,
    record.quote,
    record.availability,
    record.dedupNote,
  ]);
  assert.deepEqual(sheet.getRange('A6:H9').values, expectedRows);
  const formulas = sheet.getUsedRange().formulas.flat().filter(Boolean);
  assert.deepEqual(formulas, [], 'all intermediary-provided strings must remain literal text');

  const styleCheck = await workbook.inspect({
    kind: 'computedStyle',
    sheetId: '专家台账与去重',
    range: 'H6:H9',
    maxChars: 6000,
  });
  const styles = styleCheck.ndjson.trim().split('\n').filter(Boolean).map(JSON.parse);
  const fillByCell = Object.fromEntries(styles.map((entry) => [
    entry.for,
    entry.style?.fill?.color?.value?.slice(-6).toUpperCase(),
  ]));
  assert.equal(fillByCell.H6, 'FDECEC', 'affirmative high similarity must render red');
  assert.equal(fillByCell.H7, 'FDECEC', 'affirmative high similarity must render red');
  assert.equal(fillByCell.H8, 'FFF7E6', 'insufficient evidence must render amber, not red');
  assert.equal(fillByCell.H9, 'FFF7E6', 'literal formula-like text must not affect dedup styling');

  const longRowHeight = sheet.getRange('A8:H8').format.rowHeight;
  assert.ok(longRowHeight > 68, 'long source-faithful text must receive a taller row');

  const used = sheet.getUsedRange();
  const usedValues = used.values.flat().filter((value) => value !== null && value !== '');
  assert.ok(usedValues.includes('高度相似；约前确认，不合并。'));
  assert.ok(!usedValues.some((value) => String(value).includes('优先级')));
  assert.ok(!usedValues.some((value) => String(value).includes('访谈问题')));

  const previewStat = await fs.stat(previewPath);
  assert.ok(previewStat.size > 0, 'preview PNG must be created');
  const pngSignature = (await fs.readFile(previewPath)).subarray(0, 8).toString('hex');
  assert.equal(pngSignature, '89504e470d0a1a0a', 'preview must be a real PNG');

  const collisionPath = path.join(tempDir, 'collision.json');
  const collisionSource = JSON.stringify(fixture, null, 2);
  await fs.writeFile(collisionPath, collisionSource);
  const collisionRun = spawnSync(process.execPath, [builder, collisionPath, collisionPath], {
    cwd: skillDir,
    encoding: 'utf8',
  });
  assert.notEqual(collisionRun.status, 0, 'builder must reject identical input and output paths');
  assert.equal(await fs.readFile(collisionPath, 'utf8'), collisionSource, 'source JSON must not be overwritten');

  const aliasSourcePath = path.join(tempDir, 'alias-source.json');
  const aliasOutputPath = path.join(tempDir, 'alias-output.xlsx');
  await fs.writeFile(aliasSourcePath, collisionSource);
  await fs.symlink(aliasSourcePath, aliasOutputPath);
  const aliasRun = spawnSync(process.execPath, [builder, aliasSourcePath, aliasOutputPath], {
    cwd: skillDir,
    encoding: 'utf8',
  });
  assert.notEqual(aliasRun.status, 0, 'builder must reject symlink aliases of the input path');
  assert.equal(await fs.readFile(aliasSourcePath, 'utf8'), collisionSource, 'aliased source JSON must stay intact');

  console.log('PASS build-expert-ledger: one sheet, all records retained, conservative dedup');
} finally {
  await fs.rm(tempDir, { recursive: true, force: true });
}
