import { warningsFor } from '../../scripts/check-sonar.cjs';
const clean = {
  task: { status: 'SUCCESS', warnings: [] },
  issues: [],
  qualityGate: { status: 'OK' },
};

it('allows a completed local analysis with no findings', () => {
  expect(warningsFor(clean)).toEqual([]);
});
it.each(['INFO', 'MINOR', 'MAJOR', 'CRITICAL', 'BLOCKER'])(
  'rejects every open finding, including severity %s',
  (severity) => {
    const issues = [
      {
        component: 'dramaflash:src/example.ts',
        line: 12,
        rule: 'typescript:S1',
        severity,
        message: 'Review access',
      },
    ];
    expect(warningsFor({ ...clean, issues })).toEqual([
      'dramaflash:src/example.ts:12 typescript:S1: Review access',
    ]);
  },
);
it('rejects processing warnings and failed quality gates', () => {
  expect(
    warningsFor({
      ...clean,
      task: { status: 'FAILED', warnings: ['Analysis incomplete'] },
      qualityGate: { status: 'ERROR' },
    }),
  ).toEqual([
    'Analysis incomplete',
    'Analysis processing: FAILED',
    'Quality gate: ERROR',
  ]);
});

it('rejects scanner warnings and warnings whose details were omitted by the server', () => {
  expect(
    warningsFor({
      ...clean,
      scannerWarnings: ['WARN Coverage file cannot be resolved'],
    }),
  ).toEqual(['WARN Coverage file cannot be resolved']);
  expect(
    warningsFor({
      ...clean,
      task: { status: 'SUCCESS', warnings: [], warningCount: 1 },
    }),
  ).toEqual(['1 analysis warnings reported by SonarQube']);
});
