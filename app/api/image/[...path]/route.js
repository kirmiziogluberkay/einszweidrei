/**
 * app/api/image/[...path]/route.js
 * ─────────────────────────────────────────────────────
 * Private image proxy. Fetches images from the private
 * GitHub repo using the server-side token and streams
 * them to the browser. The GitHub repo URL and token
 * are never exposed to the client.
 *
 * GET /api/image/images/{userId}/{filename}
 * ─────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO  = process.env.GITHUB_IMAGE_REPO; // "owner/repo"
const BRANCH       = 'main';

export async function GET(request, { params }) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return new NextResponse('Not configured', { status: 500 });
  }

  // Reconstruct the file path from route segments
  const filePath = params.path.join('/');

  // Fetch raw file content from private GitHub repo
  const ghRes = await fetch(
    `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${filePath}`,
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
      },
      // Cache at the edge for 24 hours
      next: { revalidate: 86400 },
    }
  );

  if (!ghRes.ok) {
    return new NextResponse('Image not found', { status: 404 });
  }

  const contentType = ghRes.headers.get('content-type') ?? 'image/jpeg';
  const buffer      = await ghRes.arrayBuffer();

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':  contentType,
      // Cache on Vercel CDN for 1 year — image paths are unique (timestamp-based)
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
