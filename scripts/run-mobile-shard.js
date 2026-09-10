const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const index = Number.parseInt(process.env.MOBILE_SHARD_INDEX || '1', 10);
const count = Number.parseInt(process.env.MOBILE_SHARD_COUNT || '1', 10);
const featureDir = path.resolve('mobile', 'features');
const features = fs.readdirSync(featureDir)
  .filter((file) => file.endsWith('.feature'))
  .sort()
  .map((file) => path.join('mobile', 'features', file));
const shard = features.filter((_, position) => position % count === index - 1);

if (shard.length === 0) {
  throw new Error(`Mobile shard ${index}/${count} has no feature files`);
}

const result = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['cucumber-js', '--profile', 'mobile', ...shard, '--format', `json:reports/mobile-${index}.json`],
  {
    stdio: 'inherit',
    shell: false,
    env: { ...process.env, MOBILE_REPORT_FILE: `mobile-cucumber-report-${index}` },
  },
);

process.exit(result.status ?? 1);
