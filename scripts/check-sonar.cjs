const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const {
  prepareLocalSonar,
  request,
  scan,
  directory,
  host,
} = require('./sonar-local.cjs');

function warningsFor(report) {
  const warnings = report.issues.map(
    (issue) =>
      `${issue.component}:${issue.line ?? 1} ${issue.rule}: ${issue.message}`,
  );
  warnings.push(
    ...report.task.warnings.map(String),
    ...(report.scannerWarnings ?? []),
  );
  if (report.task.warningCount > report.task.warnings.length)
    warnings.push(
      `${report.task.warningCount} analysis warnings reported by SonarQube`,
    );
  if (report.task.status !== 'SUCCESS')
    warnings.push(`Analysis processing: ${report.task.status}`);
  if (report.qualityGate.status !== 'OK')
    warnings.push(`Quality gate: ${report.qualityGate.status}`);
  return warnings;
}
async function collectReport(authorization, taskId) {
  let task;
  for (let attempt = 0; attempt < 120; attempt += 1) {
    ({ task } = await request(
      `/api/ce/task?id=${encodeURIComponent(taskId)}`,
      authorization,
    ));
    if (!['PENDING', 'IN_PROGRESS'].includes(task.status)) break;
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (task.status !== 'SUCCESS')
    throw new Error(
      `SonarQube analysis ${task.status}: ${task.errorMessage ?? 'processing timed out'}`,
    );
  const issues = [];
  for (let page = 1; ; page += 1) {
    const response = await request(
      `/api/issues/search?components=dramaflash&resolved=false&ps=500&p=${page}`,
      authorization,
    );
    issues.push(...response.issues);
    if (issues.length >= response.paging.total) break;
  }
  const { projectStatus: qualityGate } = await request(
    `/api/qualitygates/project_status?analysisId=${encodeURIComponent(task.analysisId)}`,
    authorization,
  );
  const measures = await request(
    '/api/measures/component?component=dramaflash&metricKeys=coverage,duplicated_lines_density,violations,security_issues,bugs,code_smells,vulnerabilities',
    authorization,
  );
  return {
    generatedAt: new Date().toISOString(),
    server: host,
    task,
    issues,
    qualityGate,
    measures,
  };
}
async function main() {
  const token = await prepareLocalSonar();
  const scannerWarnings = scan(token);
  const metadata = readFileSync(
    join(directory, 'scanner/report-task.txt'),
    'utf8',
  );
  const taskId = metadata.match(/^ceTaskId=(.+)$/m)?.[1];
  if (!taskId) throw new Error('Scanner did not produce a task identifier.');
  const report = {
    ...(await collectReport(`Bearer ${token}`, taskId)),
    scannerWarnings,
  };
  writeFileSync(
    join(directory, 'report.json'),
    JSON.stringify(report, null, 2),
  );
  const warnings = warningsFor(report);
  for (const warning of warnings) process.stderr.write(`warning: ${warning}\n`);
  if (warnings.length)
    throw new Error(
      `SonarQube: ${warnings.length} warnings; maximum allowed is 0.`,
    );
  process.stdout.write(
    `SonarQube passed: 0 open issues, 0 analysis warnings; quality gate OK. Report: reports/sonar/report.json\n`,
  );
}
if (require.main === module)
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
module.exports = { warningsFor, collectReport };
