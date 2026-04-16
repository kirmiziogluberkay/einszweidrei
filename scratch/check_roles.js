/**
 * Check profiles in GitHub DB
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n').filter(l => l && !l.startsWith('#')).map(l => {
    const [key, ...val] = l.split('=');
    return [key.trim(), val.join('=').trim().replace(/^"|"$/g, '')];
  })
);

const TOKEN = env.GITHUB_TOKEN;
const DATA_REPO = env.GITHUB_DATA_REPO;

async function checkProfiles() {
  const url = `https://api.github.com/repos/${DATA_REPO}/contents/data/profiles.json?ref=main`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch profiles: ${res.status}`);
    return;
  }

  const json = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  const profiles = JSON.parse(content);

  console.log('--- PROFILES ---');
  profiles.forEach(p => {
    console.log(`User: ${p.username}, Role: ${p.role}, ID: ${p.id}`);
  });
}

checkProfiles();
