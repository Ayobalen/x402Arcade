#!/usr/bin/env node
/**
 * Coverage Badge Generator
 *
 * Generates markdown badges for code coverage from coverage-final.json files.
 * Run this after test:coverage to update README badges.
 *
 * Usage: node scripts/generate-coverage-badges.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

/**
 * Get badge color based on coverage percentage
 */
function getBadgeColor(percentage) {
  if (percentage >= 80) return 'brightgreen';
  if (percentage >= 60) return 'yellow';
  if (percentage >= 40) return 'orange';
  return 'red';
}

/**
 * Generate shields.io badge URL
 */
function generateBadgeUrl(label, percentage) {
  const color = getBadgeColor(percentage);
  const encodedLabel = encodeURIComponent(label);
  return `https://img.shields.io/badge/${encodedLabel}-${percentage}%25-${color}`;
}

/**
 * Parse coverage from coverage-final.json
 */
function parseCoverage(coverageJsonPath) {
  if (!existsSync(coverageJsonPath)) {
    return null;
  }

  const content = readFileSync(coverageJsonPath, 'utf-8');
  const coverage = JSON.parse(content);

  let totalStatements = 0;
  let coveredStatements = 0;
  let totalBranches = 0;
  let coveredBranches = 0;
  let totalFunctions = 0;
  let coveredFunctions = 0;
  let totalLines = 0;
  let coveredLines = 0;

  for (const file of Object.values(coverage)) {
    const s = file.s || {};
    const b = file.b || {};
    const f = file.f || {};

    // Statements
    const stmtKeys = Object.keys(s);
    totalStatements += stmtKeys.length;
    coveredStatements += stmtKeys.filter(k => s[k] > 0).length;

    // Branches
    for (const branch of Object.values(b)) {
      if (Array.isArray(branch)) {
        totalBranches += branch.length;
        coveredBranches += branch.filter(c => c > 0).length;
      }
    }

    // Functions
    const funcKeys = Object.keys(f);
    totalFunctions += funcKeys.length;
    coveredFunctions += funcKeys.filter(k => f[k] > 0).length;

    // Lines (from statementMap)
    if (file.statementMap) {
      const lineSet = new Set();
      const coveredLineSet = new Set();
      for (const [key, stmt] of Object.entries(file.statementMap)) {
        if (stmt.start && stmt.start.line) {
          lineSet.add(stmt.start.line);
          if (s[key] > 0) {
            coveredLineSet.add(stmt.start.line);
          }
        }
      }
      totalLines += lineSet.size;
      coveredLines += coveredLineSet.size;
    }
  }

  const calcPercentage = (covered, total) =>
    total === 0 ? 100 : Math.round((covered / total) * 100);

  return {
    statements: calcPercentage(coveredStatements, totalStatements),
    branches: calcPercentage(coveredBranches, totalBranches),
    functions: calcPercentage(coveredFunctions, totalFunctions),
    lines: calcPercentage(coveredLines, totalLines),
  };
}

/**
 * Main function
 */
function main() {
  console.log('Coverage Badge Generator\n');
  console.log('========================\n');

  const packages = [
    { name: 'Frontend', path: 'packages/frontend/coverage/coverage-final.json' },
    { name: 'Backend', path: 'packages/backend/coverage/coverage-final.json' },
  ];

  const results = [];

  for (const pkg of packages) {
    const coveragePath = join(rootDir, pkg.path);
    const coverage = parseCoverage(coveragePath);

    if (!coverage) {
      console.log(`${pkg.name}: No coverage data found at ${pkg.path}`);
      console.log(`  Run: pnpm --dir ${pkg.path.split('/coverage')[0]} test:coverage\n`);
      continue;
    }

    console.log(`${pkg.name} Coverage:`);
    console.log(`  Statements: ${coverage.statements}%`);
    console.log(`  Branches:   ${coverage.branches}%`);
    console.log(`  Functions:  ${coverage.functions}%`);
    console.log(`  Lines:      ${coverage.lines}%`);
    console.log('');

    results.push({ name: pkg.name, coverage });
  }

  if (results.length === 0) {
    console.log('\nNo coverage data found. Run test:coverage first.');
    process.exit(1);
  }

  console.log('\nMarkdown Badges:');
  console.log('----------------\n');

  for (const result of results) {
    const { name, coverage } = result;
    const avg = Math.round(
      (coverage.statements + coverage.branches + coverage.functions + coverage.lines) / 4
    );

    const badgeUrl = generateBadgeUrl(`${name} Coverage`, avg);
    console.log(`![${name} Coverage](${badgeUrl})`);
  }

  console.log('\nDetailed Badges:');
  console.log('----------------\n');

  for (const result of results) {
    const { name, coverage } = result;
    console.log(`### ${name}`);
    console.log(`![Statements](${generateBadgeUrl('Statements', coverage.statements)})`);
    console.log(`![Branches](${generateBadgeUrl('Branches', coverage.branches)})`);
    console.log(`![Functions](${generateBadgeUrl('Functions', coverage.functions)})`);
    console.log(`![Lines](${generateBadgeUrl('Lines', coverage.lines)})`);
    console.log('');
  }
}

main();
