// Post-build script to inject the final site domain into robots.txt and sitemap.xml
// Sources in /public use https://example.com as placeholder; this replaces it in /dist.

import { promises as fs, existsSync } from 'node:fs';
import path from 'node:path';

function normalizeUrl(input) {
  if (!input) return null;
  let url = input.trim();
  if (!url) return null;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  // remove trailing slash
  url = url.replace(/\/+$/, '');
  return url;
}

async function replaceRobots(distDir, siteUrl) {
  const robotsPath = path.join(distDir, 'robots.txt');
  try {
    const content = await fs.readFile(robotsPath, 'utf8');
    const updated = content.replace(/Sitemap:\s*.*/i, `Sitemap: ${siteUrl}/sitemap.xml`);
    await fs.writeFile(robotsPath, updated, 'utf8');
    console.log(`[postbuild] Updated robots.txt sitemap to ${siteUrl}/sitemap.xml`);
  } catch (err) {
    console.warn(`[postbuild] robots.txt not found or could not be updated: ${err?.message}`);
  }
}

async function replaceSitemap(distDir, siteUrl) {
  const sitemapPath = path.join(distDir, 'sitemap.xml');
  try {
    const content = await fs.readFile(sitemapPath, 'utf8');
    // Replace placeholder host with final site URL, keep paths intact
    const updated = content.replace(/https?:\/\/example\.com/gi, siteUrl);
    await fs.writeFile(sitemapPath, updated, 'utf8');
    console.log(`[postbuild] Updated sitemap.xml base URL to ${siteUrl}`);
  } catch (err) {
    console.warn(`[postbuild] sitemap.xml not found or could not be updated: ${err?.message}`);
  }
}

async function main() {
  const preferred = process.env.BUILD_OUT_DIR;
  const candidates = [preferred, 'dist', 'out'].filter(Boolean).map(d => path.resolve(process.cwd(), d));
  const distDir = candidates.find(dir => existsSync(dir)) || path.resolve(process.cwd(), 'dist');
  const envCandidates = [
    process.env.SITE_URL,
    process.env.VITE_PUBLIC_SITE_URL,
    process.env.PUBLIC_SITE_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ];
  const raw = envCandidates.find(Boolean);
  const siteUrl = normalizeUrl(raw);

  if (!siteUrl) {
    console.warn('[postbuild] SITE_URL (or VITE_PUBLIC_SITE_URL/PUBLIC_SITE_URL/VERCEL_URL) not set. Skipping domain replacement.');
    return;
  }

  await replaceRobots(distDir, siteUrl);
  await replaceSitemap(distDir, siteUrl);
}

main().catch((err) => {
  console.error('[postbuild] Unexpected error:', err);
  process.exitCode = 1;
});