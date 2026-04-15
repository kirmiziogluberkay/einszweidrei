/**
 * Test script: checks if the GitHub token and data repo are working correctly.
 * Run with: node scripts/test-github-token.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually read .env.local
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = Object.fromEntries(
  envContent
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .map(l => {
      const [key, ...val] = l.split('=');
      return [key.trim(), val.join('=').trim().replace(/^"|"$/g, '')];
    })
);

const TOKEN     = env.GITHUB_TOKEN;
const DATA_REPO = env.GITHUB_DATA_REPO;

console.log('=== GitHub DB Test ===');
console.log(`DATA_REPO : ${DATA_REPO}`);
console.log(`TOKEN     : ${TOKEN ? TOKEN.slice(0, 20) + '...' : '(missing)'}`);
console.log('');

// ── Test 1: token validity ──
console.log('[1] Testing token validity...');
const meRes = await fetch('https://api.github.com/user', {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});
if (meRes.ok) {
  const me = await meRes.json();
  console.log(`   ✅ Token valid — logged in as: ${me.login}`);
} else {
  console.log(`   ❌ Token invalid! Status: ${meRes.status} ${meRes.statusText}`);
  const body = await meRes.text();
  console.log(`   Response: ${body}`);
  process.exit(1);
}

// ── Test 2: repo access ──
console.log(`[2] Testing repo access: ${DATA_REPO}...`);
const repoRes = await fetch(`https://api.github.com/repos/${DATA_REPO}`, {
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
});
if (repoRes.ok) {
  const repo = await repoRes.json();
  console.log(`   ✅ Repo accessible — visibility: ${repo.private ? 'private' : 'public'}`);
} else {
  console.log(`   ❌ Cannot access repo! Status: ${repoRes.status}`);
  const body = await repoRes.text();
  console.log(`   Response: ${body}`);
  process.exit(1);
}

// ── Test 3: data/profiles.json ──
console.log(`[3] Checking data/profiles.json inside ${DATA_REPO}...`);
const fileRes = await fetch(
  `https://api.github.com/repos/${DATA_REPO}/contents/data/profiles.json?ref=main`,
  {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  }
);

if (fileRes.status === 200) {
  const fileData = await fileRes.json();
  const content  = Buffer.from(fileData.content, 'base64').toString('utf-8');
  const profiles = JSON.parse(content);
  console.log(`   ✅ profiles.json exists — ${profiles.length} profile(s) found`);
} else if (fileRes.status === 404) {
  console.log('   ⚠️  data/profiles.json does not exist yet — it will be created on first registration.');
} else {
  console.log(`   ❌ Error reading profiles.json: ${fileRes.status}`);
  const body = await fileRes.text();
  console.log(`   Response: ${body}`);
}

console.log('\n=== Test Complete ===');
