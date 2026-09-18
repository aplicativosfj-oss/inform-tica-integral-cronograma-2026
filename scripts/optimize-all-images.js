#!/usr/bin/env node

/**
 * Advanced Image Optimization Script
 * Converts all images to WebP, AVIF, and optimized JPEG
 * Generates responsive srcsets and metadata
 *
 * Usage:
 *   npm install -D sharp
 *   npm run optimize-all
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ASSETS_DIR = 'src/assets';
const OPTIMIZED_DIR = 'public/images';
const IMAGES_MANIFEST = 'public/images-manifest.json';

// Quality settings - balance quality vs file size
const QUALITY = {
  webp: { quality: 82 },
  avif: { quality: 75 },
  jpeg: { quality: 85, progressive: true },
};

// Image sizes for responsive images
const SIZES = [480, 768, 1024, 1280, 1920];

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.cyan}${colors.bright}${msg}${colors.reset}\n`),
};

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function getImageDimensions(inputPath) {
  const metadata = await sharp(inputPath).metadata();
  return { width: metadata.width, height: metadata.height };
}

async function optimizeImage(inputPath, baseName) {
  try {
    const stats = await fs.stat(inputPath);
    const sizeKb = (stats.size / 1024).toFixed(2);
    const dims = await getImageDimensions(inputPath);

    log.info(`${baseName} (${sizeKb}KB, ${dims.width}x${dims.height})`);

    const results = {
      name: baseName,
      original: sizeKb,
      dimensions: dims,
      formats: {},
      responsive: {},
    };

    // Convert to WebP
    const webpPath = path.join(OPTIMIZED_DIR, `${baseName}.webp`);
    const webpStats = await sharp(inputPath)
      .webp(QUALITY.webp)
      .toFile(webpPath);

    results.formats.webp = {
      size: (webpStats.size / 1024).toFixed(2),
      reduction: ((1 - webpStats.size / stats.size) * 100).toFixed(1),
    };
    log.success(`  → WebP: ${results.formats.webp.size}KB (-${results.formats.webp.reduction}%)`);

    // Convert to AVIF (best compression)
    const avifPath = path.join(OPTIMIZED_DIR, `${baseName}.avif`);
    const avifStats = await sharp(inputPath)
      .avif(QUALITY.avif)
      .toFile(avifPath);

    results.formats.avif = {
      size: (avifStats.size / 1024).toFixed(2),
      reduction: ((1 - avifStats.size / stats.size) * 100).toFixed(1),
    };
    log.success(`  → AVIF: ${results.formats.avif.size}KB (-${results.formats.avif.reduction}%)`);

    // Optimize JPEG (higher quality for fallback)
    const jpegPath = path.join(OPTIMIZED_DIR, `${baseName}.jpg`);
    const jpegStats = await sharp(inputPath)
      .jpeg(QUALITY.jpeg)
      .toFile(jpegPath);

    results.formats.jpeg = {
      size: (jpegStats.size / 1024).toFixed(2),
      reduction: ((1 - jpegStats.size / stats.size) * 100).toFixed(1),
    };
    log.success(`  → JPEG: ${results.formats.jpeg.size}KB (-${results.formats.jpeg.reduction}%)`);

    // Generate responsive sizes
    for (const size of SIZES) {
      if (size >= dims.width) continue;

      const newHeight = Math.round((size / dims.width) * dims.height);

      const respWebp = await sharp(inputPath)
        .resize(size, newHeight, { fit: 'cover' })
        .webp(QUALITY.webp)
        .toBuffer();

      const respPath = path.join(OPTIMIZED_DIR, `${baseName}-${size}w.webp`);
      await fs.writeFile(respPath, respWebp);

      results.responsive[size] = {
        size: (respWebp.length / 1024).toFixed(2),
        dimensions: { width: size, height: newHeight },
      };
    }

    return results;
  } catch (err) {
    log.warn(`Failed to optimize ${baseName}: ${err.message}`);
    return null;
  }
}

async function generateHtmlTemplate(images) {
  const template = `<!-- Generated: ${new Date().toISOString()} -->
<!-- Auto-generated from optimize-all-images.js -->

<!-- Hero Image Example: -->
<picture>
  <source srcset="/images/image0.avif" type="image/avif">
  <source srcset="/images/image0.webp" type="image/webp">
  <img src="/images/image0.jpg" alt="Professional hero image"
       width="1920" height="1080" loading="eager">
</picture>

<!-- Background Image (CSS): -->
<style>
  .hero {
    background-image: url('/images/image1.webp');
    background-size: cover;
    background-position: center;
  }
  /* Fallback for older browsers */
  @supports not (background-image: url('')) {
    .hero {
      background-image: url('/images/image1.jpg');
    }
  }
</style>

<!-- Responsive Image Example: -->
<picture>
  <source
    srcset="
      /images/image2-480w.webp 480w,
      /images/image2-768w.webp 768w,
      /images/image2-1024w.webp 1024w,
      /images/image2-1280w.webp 1280w
    "
    type="image/webp">
  <img
    src="/images/image2.jpg"
    alt="Responsive image"
    sizes="(max-width: 480px) 100vw,
           (max-width: 768px) 90vw,
           (max-width: 1024px) 80vw,
           70vw"
    loading="lazy">
</picture>
`;

  const templatePath = path.join(OPTIMIZED_DIR, 'USAGE.html');
  await fs.writeFile(templatePath, template);
  return templatePath;
}

async function main() {
  try {
    log.header('🖼️  Advanced Image Optimization');
    log.info(`Input: ${ASSETS_DIR}`);
    log.info(`Output: ${OPTIMIZED_DIR}`);

    await ensureDir(OPTIMIZED_DIR);

    // Get all image files
    const files = await fs.readdir(ASSETS_DIR);
    const imageFiles = files.filter((f) => /\.(jpg|jpeg|png)$/i.test(f));

    if (imageFiles.length === 0) {
      log.warn(`No images found in ${ASSETS_DIR}`);
      return;
    }

    log.info(`Found ${imageFiles.length} image(s)\n`);

    const results = [];
    for (const file of imageFiles) {
      const inputPath = path.join(ASSETS_DIR, file);
      const baseName = path.parse(file).name;
      const result = await optimizeImage(inputPath, baseName);
      if (result) results.push(result);
    }

    // Generate manifest
    const manifest = {
      generated: new Date().toISOString(),
      totalImages: results.length,
      images: results,
      stats: {
        totalOriginal: results
          .reduce((sum, r) => sum + parseFloat(r.original), 0)
          .toFixed(2),
        totalOptimized: results
          .reduce((sum, r) => sum + parseFloat(r.formats.avif.size), 0)
          .toFixed(2),
        avgReduction:
          (
            results.reduce(
              (sum, r) =>
                sum +
                (1 -
                  (parseFloat(r.formats.avif.size) / parseFloat(r.original)) *
                    100) *
                100,
              0
            ) / results.length
          ).toFixed(1) + '%',
      },
    };

    await fs.writeFile(IMAGES_MANIFEST, JSON.stringify(manifest, null, 2));

    // Generate HTML usage guide
    const templatePath = await generateHtmlTemplate(results);

    log.header('✨ Optimization Complete!');

    console.log(`📊 Summary:`);
    console.log(`
  Total Images: ${results.length}
  Original Size: ${manifest.stats.totalOriginal} MB
  Optimized Size (AVIF): ${manifest.stats.totalOptimized} MB
  Average Reduction: ${manifest.stats.avgReduction}
    `);

    log.success(`Manifest saved: ${IMAGES_MANIFEST}`);
    log.success(`HTML guide saved: ${templatePath}`);

    log.info(`\nNext steps:`);
    console.log(`  1. Review optimized images in: ${OPTIMIZED_DIR}`);
    console.log(`  2. Check manifest: ${IMAGES_MANIFEST}`);
    console.log(`  3. Use images in components with <picture> elements`);
    console.log(`  4. Update index.tsx with professional hero image`);
    console.log(`  5. Add background images to sections`);

    console.log(`\n✅ All images optimized and ready for production!`);
  } catch (err) {
    log.warn(`Error: ${err.message}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
