/**
 * lib/github-db.js
 * ─────────────────────────────────────────────────────
 * GitHub API-backed JSON data store.
 * Each collection is stored as data/{collection}.json
 * in a private GitHub repository.
 *
 * Required env vars:
 *   GITHUB_TOKEN       — Personal Access Token (repo scope)
 *   GITHUB_DATA_REPO   — e.g. "owner/einszweidrei-data"
 * ─────────────────────────────────────────────────────
 */

const GITHUB_API  = 'https://api.github.com';
const TOKEN       = process.env.GITHUB_TOKEN;
const DATA_REPO   = process.env.GITHUB_DATA_REPO;
const BRANCH      = 'main';

const GH_HEADERS  = {
  Authorization:          `Bearer ${TOKEN}`,
  Accept:                 'application/vnd.github+json',
  'Content-Type':         'application/json',
  'X-GitHub-Api-Version': '2022-11-28',
};

/**
 * Reads a JSON collection from GitHub.
 * Returns { data: Array, sha: string|null }
 *
 * @param {string} collection  e.g. 'ads', 'profiles', 'messages'
 */
export async function readData(collection) {
  if (!TOKEN || !DATA_REPO) {
    console.warn('[github-db] GITHUB_TOKEN or GITHUB_DATA_REPO not set');
    return { data: [], sha: null };
  }

  const url = `${GITHUB_API}/repos/${DATA_REPO}/contents/data/${collection}.json?ref=${BRANCH}`;

  const res = await fetch(url, {
    headers: GH_HEADERS,
    cache: 'no-store',
  });

  if (res.status === 404) return { data: [], sha: null };

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[github-db] read ${collection} failed (${res.status}): ${err}`);
  }

  const json    = await res.json();
  const content = Buffer.from(json.content, 'base64').toString('utf-8');
  return { data: JSON.parse(content), sha: json.sha };
}

/**
 * Writes a JSON collection to GitHub (creates or updates the file).
 * Returns the new SHA of the committed file.
 *
 * @param {string}       collection  e.g. 'ads'
 * @param {Array|object} data        The complete dataset to persist
 * @param {string|null}  sha         Current file SHA (null for first write)
 */
export async function writeData(collection, data, sha) {
  if (!TOKEN || !DATA_REPO) {
    throw new Error('[github-db] GITHUB_TOKEN or GITHUB_DATA_REPO not set');
  }

  const url     = `${GITHUB_API}/repos/${DATA_REPO}/contents/data/${collection}.json`;
  const content = Buffer.from(JSON.stringify(data, null, 2)).toString('base64');
  const payload = {
    message: `db: update ${collection}`,
    content,
    branch: BRANCH,
    ...(sha ? { sha } : {}),
  };

  const res = await fetch(url, {
    method:  'PUT',
    headers: GH_HEADERS,
    body:    JSON.stringify(payload),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`[github-db] write ${collection} failed (${res.status}): ${detail}`);
  }

  const result = await res.json();
  return result.content.sha;
}

// ─────────────────────────────────────────────────────
// Convenience CRUD helpers
// ─────────────────────────────────────────────────────

/**
 * Returns all records in the collection.
 */
export async function getAll(collection) {
  const { data } = await readData(collection);
  return data;
}

/**
 * Returns a single record by id field.
 */
export async function getById(collection, id) {
  const { data } = await readData(collection);
  return data.find(r => r.id === id) ?? null;
}

/**
 * Inserts a new record.
 * The record must already have an `id` field.
 */
export async function insert(collection, record) {
  const { data, sha } = await readData(collection);
  data.push(record);
  await writeData(collection, data, sha);
  return record;
}

/**
 * Updates fields of a record matched by id.
 * Returns the updated record, or null if not found.
 */
export async function update(collection, id, fields) {
  const { data, sha } = await readData(collection);
  const idx = data.findIndex(r => r.id === id);
  if (idx === -1) return null;
  data[idx] = { ...data[idx], ...fields };
  await writeData(collection, data, sha);
  return data[idx];
}

/**
 * Deletes a record by id.
 * Returns true if deleted, false if not found.
 */
export async function remove(collection, id) {
  const { data, sha } = await readData(collection);
  const next = data.filter(r => r.id !== id);
  if (next.length === data.length) return false;
  await writeData(collection, next, sha);
  return true;
}

/**
 * Upserts a record (insert or update by id).
 */
export async function upsert(collection, record) {
  const { data, sha } = await readData(collection);
  const idx = data.findIndex(r => r.id === record.id);
  if (idx === -1) {
    data.push(record);
  } else {
    data[idx] = { ...data[idx], ...record };
  }
  await writeData(collection, data, sha);
  return idx === -1 ? record : data.find(r => r.id === record.id);
}

// ─────────────────────────────────────────────────────
// Key-value settings helper
// ─────────────────────────────────────────────────────

/**
 * Reads the settings object (data/settings.json).
 * Returns {} if missing.
 */
export async function getSettings() {
  try {
    const { data } = await readData('settings');
    return Array.isArray(data) ? {} : (data ?? {});
  } catch {
    return {};
  }
}

/**
 * Merges partial settings into the existing settings object.
 */
export async function saveSettings(partial) {
  let sha = null;
  let current = {};

  try {
    const result = await readData('settings');
    sha     = result.sha;
    current = Array.isArray(result.data) ? {} : (result.data ?? {});
  } catch {
    // first write
  }

  const merged = { ...current, ...partial };
  await writeData('settings', merged, sha);
  return merged;
}
