const fs = require('node:fs');
const path = require('node:path');
const IORedis = require('ioredis');

function readEnvValue(envPath, key) {
  if (!fs.existsSync(envPath)) return undefined;
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const k = trimmed.slice(0, idx).trim();
    if (k !== key) continue;
    let v = trimmed.slice(idx + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    return v;
  }
  return undefined;
}

async function main() {
  const envPath = path.resolve(__dirname, '..', '.env');
  const redisUrl = process.env.REDIS_URL || readEnvValue(envPath, 'REDIS_URL');

  if (!redisUrl) {
    console.error('Missing REDIS_URL (set it in backend/.env or env var).');
    process.exit(1);
  }

  const redis = new IORedis(redisUrl, {
    maxRetriesPerRequest: 1,
    enableReadyCheck: true,
    lazyConnect: true,
  });

  try {
    await redis.connect();
    const pong = await redis.ping();
    console.log(pong);
  } finally {
    redis.disconnect();
  }
}

main().catch((err) => {
  console.error(err?.message || err);
  process.exit(1);
});
