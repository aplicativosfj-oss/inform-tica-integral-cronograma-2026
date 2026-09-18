#!/usr/bin/env node

/**
 * Image Optimization Script
 * Converts JPEG/PNG images to WebP and AVIF formats
 *
 * Usage:
 *   npm run optimize-images
 *
 * Requirements:
 *   npm install -D sharp
 */

const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

const ASSETS_DIR = 'src/assets';
const OUTPUT_DIR = 'public/optimized';
const WEBP_QUALITY = 80;
const AVIF_QUALITY = 75;

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.bright}✗${colors.reset} ${msg}`),
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function optimizeImage(inputPath, baseName) {
  try {
    // Validate file exists
    const stats = await fs.stat(inputPath);
    const sizeKb = (stats.size / 1024).toFixed(2);

    log.info(`Processing: ${baseName} (${sizeKb} KB)`);

    // Convert to WebP
    const webpPath = path.join(OUTPUT_DIR, `${baseName}.webp`);
    const webpStats = await sharp(inputPath)
      .webp({ quality: WEBP_QUALITY })
      .toFile(webpPath);

    const webpKb = (webpStats.size / 1024).toFixed(2);
    const webpReduction = ((1 - webpStats.size / stats.size) * 100).toFixed(1);
    log.success(`  WebP: ${webpKb} KB (-${webpReduction}%)`);

    // Convert to AVIF
    const avifPath = path.join(OUTPUT_DIR, `${baseName}.avif`);
    const avifStats = await sharp(inputPath)
      .avif({ quality: AVIF_QUALITY })
      .toFile(avifPath);

    const avifKb = (avifStats.size / 1024).toFixed(2);
    const avifReduction = ((1 - avifStats.size / stats.size) * 100).toFixed(1);
    log.success(`  AVIF: ${avifKb} KB (-${avifReduction}%)`);

    return {
      name: baseName,
      original: sizeKb,
      webp: webpKb,
      avif: avifKb,
    };
  } catch (err) {
    log.error(`Failed to optimize ${baseName}: ${err.message}`);
    return null;
  }
}

async function main() {
  try {
    log.info('Starting image optimization...');
    log.info(`Input directory: ${ASSETS_DIR}`);
    log.info(`Output directory: ${OUTPUT_DIR}`);

    // Create output directory
    await ensureDir(OUTPUT_DIR);

    // Get all image files
    const files = await fs.readdir(ASSETS_DIR);
    const imageFiles = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

    if (imageFiles.length === 0) {
      log.warn(`No images found in ${ASSETS_DIR}`);
      return;
    }

    log.info(`Found ${imageFiles.length} image(s) to optimize`);
    console.log('');

    const results = [];
    for (const file of imageFiles) {
      const inputPath = path.join(ASSETS_DIR, file);
      const baseName = path.parse(file).name;
      const result = await optimizeImage(inputPath, baseName);
      if (result) results.push(result);
    }

    console.log('');
    if (results.length > 0) {
      log.success(`Optimized ${results.length} image(s)`);
      console.log('');

      // Summary table
      console.log('📊 Summary:');
      console.log('');
      console.table(results);

      const avgWebpReduction =
        results.reduce(
          (sum, r) => sum + (1 - parseFloat(r.webp) / parseFloat(r.original)) * 100,
          0
        ) / results.length;

      const avgAvifReduction =
        results.reduce(
          (sum, r) => sum + (1 - parseFloat(r.avif) / parseFloat(r.original)) * 100,
          0
        ) / results.length;

      console.log('');
      log.info(`Average WebP reduction: -${avgWebpReduction.toFixed(1)}%`);
      log.info(`Average AVIF reduction: -${avgAvifReduction.toFixed(1)}%`);
      console.log('');

      log.success('Image optimization complete!');
      console.log('');
      log.info('Next steps:');
      console.log('  1. Update import paths to use optimized images');
      console.log('  2. Use <OptimizedImage> component for lazy loading');
      console.log('  3. Test in browser DevTools (Network tab)');
    }
  } catch (err) {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
