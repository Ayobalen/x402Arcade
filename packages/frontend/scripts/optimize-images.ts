#!/usr/bin/env tsx
/* eslint-disable no-console */
/**
 * Image Optimization Script
 *
 * Optimizes images in the project by:
 * 1. Compressing PNG/JPEG/WebP with sharp
 * 2. Generating WebP versions of raster images
 * 3. Optimizing SVGs with SVGO
 * 4. Reporting file size savings
 *
 * Usage:
 *   pnpm run optimize:images [options]
 *
 * Options:
 *   --dir <path>     Target directory (default: src/assets/images)
 *   --webp           Generate WebP versions (default: true)
 *   --avif           Generate AVIF versions (default: false)
 *   --quality <n>    JPEG/WebP quality 1-100 (default: 80)
 *   --dry-run        Show what would be done without changes
 *
 * Requirements:
 *   pnpm add -D sharp svgo
 */

import { promises as fs } from 'fs';
import path from 'path';

// Dynamic imports for optional dependencies
let sharp: typeof import('sharp') | null = null;
let svgo: typeof import('svgo') | null = null;

/**
 * Try to import sharp for image processing
 */
async function loadSharp(): Promise<typeof import('sharp') | null> {
  try {
    const module = await import('sharp');
    return module.default || module;
  } catch {
    return null;
  }
}

/**
 * Try to import svgo for SVG optimization
 */
async function loadSvgo(): Promise<typeof import('svgo') | null> {
  try {
    return await import('svgo');
  } catch {
    return null;
  }
}

// Configuration
interface Config {
  targetDir: string;
  generateWebP: boolean;
  generateAvif: boolean;
  quality: number;
  dryRun: boolean;
}

// Statistics
interface Stats {
  processed: number;
  skipped: number;
  webpGenerated: number;
  avifGenerated: number;
  originalSize: number;
  finalSize: number;
}

// Supported image formats
const RASTER_FORMATS = ['.png', '.jpg', '.jpeg', '.gif'];
const SVG_FORMAT = '.svg';
const ALL_FORMATS = [...RASTER_FORMATS, SVG_FORMAT];

/**
 * Parse command line arguments
 */
function parseArgs(): Config {
  const args = process.argv.slice(2);
  const config: Config = {
    targetDir: 'src/assets/images',
    generateWebP: true,
    generateAvif: false,
    quality: 80,
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--dir':
        config.targetDir = args[++i];
        break;
      case '--webp':
        config.generateWebP = args[++i] !== 'false';
        break;
      case '--avif':
        config.generateAvif = args[++i] !== 'false';
        break;
      case '--quality':
        config.quality = parseInt(args[++i], 10);
        break;
      case '--dry-run':
        config.dryRun = true;
        break;
      case '--help':
        printHelp();
        process.exit(0);
    }
  }

  return config;
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
Image Optimization Script

Usage:
  pnpm run optimize:images [options]

Options:
  --dir <path>     Target directory (default: src/assets/images)
  --webp           Generate WebP versions (default: true)
  --avif           Generate AVIF versions (default: false)
  --quality <n>    JPEG/WebP quality 1-100 (default: 80)
  --dry-run        Show what would be done without changes
  --help           Show this help message

Examples:
  pnpm run optimize:images
  pnpm run optimize:images --dir src/assets/sprites --quality 90
  pnpm run optimize:images --avif true --webp true
  pnpm run optimize:images --dry-run
`);
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Get all image files in directory recursively
 */
async function getImageFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        const subFiles = await getImageFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ALL_FORMATS.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return files;
}

/**
 * Optimize a raster image (PNG, JPEG, GIF)
 */
async function optimizeRaster(filePath: string, config: Config, stats: Stats): Promise<void> {
  if (!sharp) {
    console.log(`  [SKIP] sharp not available: ${filePath}`);
    stats.skipped++;
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const originalBuffer = await fs.readFile(filePath);
  const originalSize = originalBuffer.length;
  stats.originalSize += originalSize;

  const image = sharp(originalBuffer);
  // Get metadata for potential future use (dimensions, format, etc.)
  const _metadata = await image.metadata();

  // Process based on format
  let optimizedBuffer: Buffer;

  switch (ext) {
    case '.png':
      optimizedBuffer = await image
        .png({
          quality: config.quality,
          compressionLevel: 9,
          palette: true,
        })
        .toBuffer();
      break;

    case '.jpg':
    case '.jpeg':
      optimizedBuffer = await image
        .jpeg({
          quality: config.quality,
          mozjpeg: true,
        })
        .toBuffer();
      break;

    case '.gif':
      // GIFs can't be optimized with sharp, just track size
      optimizedBuffer = originalBuffer;
      break;

    default:
      optimizedBuffer = originalBuffer;
  }

  // Calculate savings
  const newSize = optimizedBuffer.length;
  stats.finalSize += newSize;
  const savings = originalSize - newSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

  if (savings > 0) {
    if (!config.dryRun) {
      await fs.writeFile(filePath, optimizedBuffer);
    }
    console.log(
      `  [OK] ${path.basename(filePath)}: ${formatBytes(originalSize)} -> ${formatBytes(newSize)} (-${savingsPercent}%)${config.dryRun ? ' (dry run)' : ''}`
    );
  } else {
    console.log(`  [SKIP] ${path.basename(filePath)}: already optimized`);
    stats.skipped++;
  }

  stats.processed++;

  // Generate WebP version
  if (config.generateWebP && ext !== '.gif') {
    const webpPath = filePath.replace(/\.(png|jpe?g)$/i, '.webp');

    // Check if WebP already exists and is newer
    try {
      const webpStat = await fs.stat(webpPath);
      const originalStat = await fs.stat(filePath);
      if (webpStat.mtimeMs > originalStat.mtimeMs) {
        console.log(`  [SKIP] ${path.basename(webpPath)}: already up to date`);
        return;
      }
    } catch {
      // WebP doesn't exist, create it
    }

    const webpBuffer = await sharp(originalBuffer)
      .webp({
        quality: config.quality,
        effort: 6,
      })
      .toBuffer();

    if (!config.dryRun) {
      await fs.writeFile(webpPath, webpBuffer);
    }
    console.log(
      `  [WEBP] ${path.basename(webpPath)}: ${formatBytes(webpBuffer.length)}${config.dryRun ? ' (dry run)' : ''}`
    );
    stats.webpGenerated++;
  }

  // Generate AVIF version
  if (config.generateAvif && ext !== '.gif') {
    const avifPath = filePath.replace(/\.(png|jpe?g)$/i, '.avif');

    // Check if AVIF already exists and is newer
    try {
      const avifStat = await fs.stat(avifPath);
      const originalStat = await fs.stat(filePath);
      if (avifStat.mtimeMs > originalStat.mtimeMs) {
        console.log(`  [SKIP] ${path.basename(avifPath)}: already up to date`);
        return;
      }
    } catch {
      // AVIF doesn't exist, create it
    }

    const avifBuffer = await sharp(originalBuffer)
      .avif({
        quality: config.quality,
        effort: 9,
      })
      .toBuffer();

    if (!config.dryRun) {
      await fs.writeFile(avifPath, avifBuffer);
    }
    console.log(
      `  [AVIF] ${path.basename(avifPath)}: ${formatBytes(avifBuffer.length)}${config.dryRun ? ' (dry run)' : ''}`
    );
    stats.avifGenerated++;
  }
}

/**
 * Optimize an SVG file
 */
async function optimizeSvg(filePath: string, config: Config, stats: Stats): Promise<void> {
  if (!svgo) {
    console.log(`  [SKIP] svgo not available: ${filePath}`);
    stats.skipped++;
    return;
  }

  const originalContent = await fs.readFile(filePath, 'utf8');
  const originalSize = Buffer.byteLength(originalContent);
  stats.originalSize += originalSize;

  const result = svgo.optimize(originalContent, {
    path: filePath,
    multipass: true,
    plugins: [
      {
        name: 'preset-default',
        params: {
          overrides: {
            // Don't remove viewBox
            removeViewBox: false,
            // Keep accessibility attributes
            removeUnknownsAndDefaults: {
              keepAriaAttrs: true,
            },
          },
        },
      },
      // Remove comments and metadata
      'removeComments',
      'removeMetadata',
      // Clean up IDs
      'cleanupIds',
    ],
  });

  const newSize = Buffer.byteLength(result.data);
  stats.finalSize += newSize;
  const savings = originalSize - newSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

  if (savings > 10) {
    // Only save if there's meaningful savings
    if (!config.dryRun) {
      await fs.writeFile(filePath, result.data);
    }
    console.log(
      `  [OK] ${path.basename(filePath)}: ${formatBytes(originalSize)} -> ${formatBytes(newSize)} (-${savingsPercent}%)${config.dryRun ? ' (dry run)' : ''}`
    );
  } else {
    console.log(`  [SKIP] ${path.basename(filePath)}: already optimized`);
    stats.skipped++;
  }

  stats.processed++;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  console.log('\n=== Image Optimization Script ===\n');

  const config = parseArgs();

  // Load dependencies
  console.log('Loading dependencies...');
  sharp = await loadSharp();
  svgo = await loadSvgo();

  if (!sharp) {
    console.warn('  Warning: sharp not installed. Run: pnpm add -D sharp');
  }
  if (!svgo) {
    console.warn('  Warning: svgo not installed. Run: pnpm add -D svgo');
  }

  if (!sharp && !svgo) {
    console.error('\nError: No image processing libraries available.');
    console.error('Install at least one: pnpm add -D sharp svgo');
    process.exit(1);
  }

  console.log();
  console.log('Configuration:');
  console.log(`  Target: ${config.targetDir}`);
  console.log(`  Quality: ${config.quality}`);
  console.log(`  WebP: ${config.generateWebP}`);
  console.log(`  AVIF: ${config.generateAvif}`);
  console.log(`  Dry run: ${config.dryRun}`);
  console.log();

  // Find images
  const targetPath = path.resolve(config.targetDir);
  console.log(`Scanning ${targetPath}...`);
  const files = await getImageFiles(targetPath);

  if (files.length === 0) {
    console.log('No images found.');
    return;
  }

  console.log(`Found ${files.length} images.\n`);

  // Process images
  const stats: Stats = {
    processed: 0,
    skipped: 0,
    webpGenerated: 0,
    avifGenerated: 0,
    originalSize: 0,
    finalSize: 0,
  };

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();

    if (ext === SVG_FORMAT) {
      await optimizeSvg(file, config, stats);
    } else if (RASTER_FORMATS.includes(ext)) {
      await optimizeRaster(file, config, stats);
    }
  }

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`  Processed: ${stats.processed}`);
  console.log(`  Skipped: ${stats.skipped}`);
  console.log(`  WebP generated: ${stats.webpGenerated}`);
  console.log(`  AVIF generated: ${stats.avifGenerated}`);
  console.log(`  Original size: ${formatBytes(stats.originalSize)}`);
  console.log(`  Final size: ${formatBytes(stats.finalSize)}`);
  console.log(
    `  Savings: ${formatBytes(stats.originalSize - stats.finalSize)} (${(((stats.originalSize - stats.finalSize) / stats.originalSize) * 100).toFixed(1)}%)`
  );

  if (config.dryRun) {
    console.log('\n  (This was a dry run - no files were modified)');
  }

  console.log();
}

// Run
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
