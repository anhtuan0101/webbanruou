#!/usr/bin/env node
/**
 * scripts/generate-sitemap.js
 *
 * Simple sitemap generator for the frontend. It pages through the API's /products
 * endpoint and writes `public/sitemap.xml`. Supports splitting into multiple
 * sitemap files if >50k URLs and an optional gzip output (set SITEMAP_GZIP=1).
 *
 * Usage:
 *   node scripts/generate-sitemap.js
 * Environment:
 *   REACT_APP_API_URL - base API url (default http://localhost:5000/api)
 *   SITEMAP_BASE_URL - public site base (default https://oanhtraicay.com)
 *   SITEMAP_GZIP - if '1' will write gzipped sitemap files
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const SITE_BASE = process.env.SITEMAP_BASE_URL || 'https://oanhtraicay.com';
const OUT_DIR = path.join(__dirname, '..', 'public');
const LIMIT = 200; // page size
const MAX_URLS_PER_SITEMAP = 50000;

function slugify(name) {
  if (!name) return 'product';
  return String(name)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/\p{Diacritic}+/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchAllProducts() {
  const products = [];
  let page = 1;
  while (true) {
    const url = `${API_BASE}/products?page=${page}&limit=${LIMIT}`;
    console.log(`Fetching ${url}`);
    try {
      const res = await axios.get(url, { timeout: 20000 });
      const data = res.data;
      let items = [];
      if (Array.isArray(data)) items = data;
      else if (Array.isArray(data.products)) items = data.products;
      else if (Array.isArray(data.data)) items = data.data;

      if (!items || items.length === 0) break;

      products.push(...items);

      // If response has pagination and indicates last page, break
      if (data.pagination && data.pagination.total_pages) {
        if (page >= data.pagination.total_pages) break;
      }

      // If returned fewer than limit, assume last page
      if (items.length < LIMIT) break;

      page += 1;
    } catch (err) {
      console.error('Failed to fetch products from API:', err.message || err);
      // Break and let caller decide fallback
      break;
    }
  }
  return products;
}

function tryLocalFallback() {
  // Look for data/products-sitemap.json in project root
  try {
    const localPath = path.join(__dirname, '..', 'data', 'products-sitemap.json');
    if (fs.existsSync(localPath)) {
      console.log('Using local sitemap data file:', localPath);
      const raw = fs.readFileSync(localPath, 'utf8');
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.debug('Local fallback read failed', e.message || e);
  }
  return null;
}

function buildUrlForProduct(p) {
  const id = p.product_id || p.id || p.productId || '';
  const name = p.name || p.title || p.product_name || '';
  const slug = slugify(name || `product-${id}`);
  return `${SITE_BASE}/products/${slug}-${id}`;
}

function buildSitemapXml(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const footer = `</urlset>`;
  const body = urls.map(u => {
    const lastmod = u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : '';
    return `  <url>\n    <loc>${u.loc}</loc>\n    ${lastmod}\n  </url>`;
  }).join('\n');
  return header + body + '\n' + footer;
}

async function writeFile(filePath, content, gzip) {
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  if (gzip) {
    const gz = zlib.gzipSync(content);
    await fs.promises.writeFile(filePath + '.gz', gz);
    console.log('Wrote', filePath + '.gz');
  } else {
    await fs.promises.writeFile(filePath, content, 'utf8');
    console.log('Wrote', filePath);
  }
}

async function run() {
  console.log('Sitemap generator starting...');
  const gzip = process.env.SITEMAP_GZIP === '1' || process.env.SITEMAP_GZIP === 'true';
  let products = await fetchAllProducts();
  if (!products || products.length === 0) {
    console.warn('No products returned from API. Trying local fallback...');
    const local = tryLocalFallback();
    if (local && local.length > 0) {
      products = local;
      console.log(`Loaded ${products.length} products from local fallback file.`);
    } else {
      console.warn('No local fallback found. Will generate sitemap with homepage only and create a sample data file at data/products-sitemap.json for you to populate.');
      // create sample products file to help user
      try {
        const sampleDir = path.join(__dirname, '..', 'data');
        await fs.promises.mkdir(sampleDir, { recursive: true });
        const samplePath = path.join(sampleDir, 'products-sitemap.json');
        const sample = [
          { "product_id": 123, "name": "Hoa sinh nhật", "updated_at": new Date().toISOString() },
          { "product_id": 124, "name": "Giỏ trái cây cao cấp", "updated_at": new Date().toISOString() }
        ];
        if (!fs.existsSync(samplePath)) {
          await fs.promises.writeFile(samplePath, JSON.stringify(sample, null, 2), 'utf8');
          console.log('Wrote sample product sitemap data to', samplePath);
        }
      } catch (e) {
        console.debug('Could not write sample file:', e.message || e);
      }
    }
  }

  const urls = [];
  // Add homepage
  urls.push({ loc: SITE_BASE, lastmod: new Date().toISOString().slice(0,10) });

  for (const p of products) {
    const loc = buildUrlForProduct(p);
    const lastmod = p.updated_at || p.updatedAt || p.modified || p.modified_at || p.updated || null;
    const lastmodIso = lastmod ? (new Date(lastmod)).toISOString().slice(0,10) : null;
    urls.push({ loc, lastmod: lastmodIso });
  }

  // Split into multiple sitemap files if needed
  if (urls.length <= MAX_URLS_PER_SITEMAP) {
    const xml = buildSitemapXml(urls);
    const out = path.join(OUT_DIR, 'sitemap.xml');
    await writeFile(out, xml, gzip);
  } else {
    console.log('Large sitemap, splitting into multiple files...');
    const parts = [];
    for (let i = 0; i < urls.length; i += MAX_URLS_PER_SITEMAP) {
      parts.push(urls.slice(i, i + MAX_URLS_PER_SITEMAP));
    }
    const sitemapFiles = [];
    for (let i = 0; i < parts.length; i++) {
      const xml = buildSitemapXml(parts[i]);
      const filename = `sitemap-${i+1}.xml`;
      const out = path.join(OUT_DIR, filename);
      await writeFile(out, xml, gzip);
      sitemapFiles.push({ loc: `${SITE_BASE}/${filename}${gzip ? '.gz' : ''}`, lastmod: new Date().toISOString().slice(0,10) });
    }
    // write sitemap index
    const indexHeader = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    const indexFooter = `</sitemapindex>`;
    const indexBody = sitemapFiles.map(s => `  <sitemap>\n    <loc>${s.loc}</loc>\n    <lastmod>${s.lastmod}</lastmod>\n  </sitemap>`).join('\n');
    const indexXml = indexHeader + indexBody + '\n' + indexFooter;
    const indexOut = path.join(OUT_DIR, 'sitemap-index.xml');
    await writeFile(indexOut, indexXml, gzip);
  }

  console.log(`Sitemap generation complete. URLs: ${urls.length}`);
}

run().catch(err => {
  console.error('Sitemap generator failed:', err);
  process.exit(1);
});
