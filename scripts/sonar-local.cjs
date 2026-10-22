const { Buffer } = require('node:buffer');
const { spawnSync } = require('node:child_process');
const {
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
} = require('node:fs');
const { randomBytes } = require('node:crypto');
const { join } = require('node:path');

const host = 'http://127.0.0.1:9000';
const directory = join(process.cwd(), 'reports/sonar');
const credentials = join(directory, 'credentials.json');
const container = 'dramaflash-sonarqube';
const serverImage =
  'sonarqube@sha256:0b3408443fb6a311253de27941b10977c9b977fd53be2265947bfe14161308b8';
const scannerImage =
  'sonarsource/sonar-scanner-cli@sha256:a3f4215076706c95a17a68c19322ee916e40a3acd081a8c1a1e839e0194afa57';

function docker(args, options = {}) {
  const result = spawnSync('docker', args, { encoding: 'utf8', ...options });
  if (result.error || result.status !== 0) {
    throw new Error(
      result.stderr ||
        `Docker ${args[0]} failed (exit ${result.status}). Start Docker and retry.`,
    );
  }
  return `${result.stdout}${result.stderr}`;
}
async function request(path, authorization, values) {
  const response = await fetch(`${host}${path}`, {
    ...(authorization ? { headers: { Authorization: authorization } } : {}),
    ...(values ? { method: 'POST', body: new URLSearchParams(values) } : {}),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok)
    throw new Error(`SonarQube ${path}: HTTP ${response.status}`);
  const body = await response.text();
  return body ? JSON.parse(body) : undefined;
}
async function prepareLocalSonar() {
  mkdirSync(directory, { recursive: true });
  docker(['info', '--format', '{{.ServerVersion}}']);
  const present = docker([
    'ps',
    '-a',
    '--filter',
    `name=^/${container}$`,
    '--format',
    '{{.Names}}',
  ]).trim();
  if (present) docker(['start', container]);
  else
    docker([
      'run',
      '-d',
      '--name',
      container,
      '-e',
      'SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true',
      '-p',
      '127.0.0.1:9000:9000',
      serverImage,
    ]);
  let ready = false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    try {
      ready = (await request('/api/system/status')).status === 'UP';
    } catch {
      ready = false;
    }
    if (ready) break;
    if (attempt % 10 === 0)
      process.stdout.write('Waiting for local SonarQube…\n');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (!ready)
    throw new Error(
      'Local SonarQube did not become ready. Inspect docker logs dramaflash-sonarqube.',
    );
  if (existsSync(credentials))
    return JSON.parse(readFileSync(credentials, 'utf8')).token;
  const password = randomBytes(32).toString('base64url');
  const basic = (value) =>
    `Basic ${Buffer.from(`admin:${value}`).toString('base64')}`;
  await request('/api/users/change_password', basic('admin'), {
    login: 'admin',
    previousPassword: 'admin',
    password,
  });
  const authorization = basic(password);
  await request('/api/projects/create', authorization, {
    project: 'dramaflash',
    name: 'DramaFlash',
  });
  const { token } = await request('/api/user_tokens/generate', authorization, {
    name: 'dramaflash-local-qa',
    type: 'USER_TOKEN',
  });
  writeFileSync(credentials, JSON.stringify({ token }), { mode: 0o600 });
  return token;
}
function scan(token) {
  const output = docker(
    [
      'run',
      '--rm',
      '--user',
      `${process.getuid?.() ?? 1000}:${process.getgid?.() ?? 1000}`,
      '--platform',
      'linux/amd64',
      '-e',
      'SONAR_TOKEN',
      '-e',
      'SONAR_HOST_URL=http://host.docker.internal:9000',
      '-e',
      'SCANNER_WORKDIR_PATH=/usr/src/reports/sonar/scanner',
      '-e',
      'SONAR_USER_HOME=/usr/src/reports/sonar/cache',
      '-v',
      `${process.cwd()}:/usr/src`,
      scannerImage,
    ],
    {
      env: { ...process.env, SONAR_TOKEN: token },
      maxBuffer: 5 * 1024 * 1024,
    },
  );
  writeFileSync(join(directory, 'scanner.log'), output);
  process.stdout.write(output);
  return output
    .split(/\r?\n/u)
    .filter((line) => /\bWARN(?:ING)?(?:\s|:)/u.test(line));
}
module.exports = { prepareLocalSonar, request, scan, directory, host };
