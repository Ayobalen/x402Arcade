/**
 * Run Color Accessibility Audit Script
 *
 * Execute this script to generate a full color accessibility audit report.
 *
 * Usage: npx tsx src/utils/accessibility/runAudit.ts
 */

/* eslint-disable no-console */
import { generateAuditReport, getRecommendations, runColorAudit } from './colorAudit';

async function main() {
  console.log('🎨 Running Color Accessibility Audit...\n');

  const audit = runColorAudit();
  const report = generateAuditReport();
  const recommendations = getRecommendations();

  // Print summary
  console.log('📊 SUMMARY');
  console.log('='.repeat(50));
  console.log(`Total Color Pairs: ${audit.summary.total}`);
  console.log(
    `WCAG AA Compliant: ${audit.summary.aaCompliant} (${Math.round((audit.summary.aaCompliant / audit.summary.total) * 100)}%)`
  );
  console.log(
    `WCAG AAA Compliant: ${audit.summary.aaaCompliant} (${Math.round((audit.summary.aaaCompliant / audit.summary.total) * 100)}%)`
  );
  console.log(
    `Failing: ${audit.summary.failing} (${Math.round((audit.summary.failing / audit.summary.total) * 100)}%)`
  );
  console.log('='.repeat(50));
  console.log('');

  // Print recommendations
  if (recommendations.length > 0) {
    console.log('⚠️  RECOMMENDATIONS');
    console.log('='.repeat(50));
    recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.log('='.repeat(50));
    console.log('');
  } else {
    console.log('✅ All color pairs meet WCAG AA standards!\n');
  }

  // Write full report to file
  const fs = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const reportPath = path.join(__dirname, '../../../docs/accessibility-audit.md');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, report);

  console.log(`📄 Full report written to: ${reportPath}\n`);
}

main();
