const { readdirSync, readFileSync } = require('node:fs');
const { join, relative } = require('node:path');

const root = process.cwd();
const ignored = new Set([
  '.git',
  'node_modules',
  '.expo',
  'coverage',
  'dist',
  'test-results',
  'reports',
  '.scannerwork',
]);
const cyrillic = /\p{Script=Cyrillic}/u;
const decoder = new TextDecoder('utf-8', { fatal: true });
let failures = 0;
let checked = 0;

function scan(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (ignored.has(entry.name) || entry.isSymbolicLink()) continue;
    const path = join(directory, entry.name);
    const label = relative(root, path);
    if (cyrillic.test(entry.name)) {
      process.stderr.write(`${label}: Cyrillic file names are not allowed.\n`);
      failures += 1;
    }
    if (entry.isDirectory()) {
      scan(path);
      continue;
    }
    const bytes = readFileSync(path);
    if (bytes.includes(0)) continue;
    let source;
    try {
      source = decoder.decode(bytes);
    } catch {
      continue;
    }
    checked += 1;
    source.split(/\r?\n/u).forEach((line, index) => {
      if (!cyrillic.test(line)) return;
      process.stderr.write(
        `${label}:${index + 1}: Cyrillic text is not allowed.\n`,
      );
      failures += 1;
    });
  }
}

scan(root);
if (failures > 0) {
  process.stderr.write(`English-only check failed: ${failures} violations.\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`English-only check passed: ${checked} text files.\n`);
}
