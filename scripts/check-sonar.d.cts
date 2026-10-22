export type SonarReport = Readonly<{
  task: { status: string; warnings: readonly string[]; warningCount?: number };
  issues: readonly {
    component: string;
    line?: number;
    rule: string;
    message: string;
  }[];
  qualityGate: { status: string };
  scannerWarnings?: readonly string[];
}>;
export function warningsFor(report: SonarReport): string[];
