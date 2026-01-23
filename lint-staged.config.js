/**
 * lint-staged configuration for x402Arcade monorepo
 *
 * Runs ESLint and Prettier on staged files before commit.
 * @see https://github.com/okonet/lint-staged
 */

export default {
  // TypeScript/JavaScript files - lint and format
  '*.{ts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],

  '*.{js,jsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],

  // JSON files - format only
  '*.json': ['prettier --write'],

  // Markdown files - format only
  '*.md': ['prettier --write'],

  // CSS/SCSS files - format only
  '*.{css,scss}': ['prettier --write'],

  // YAML files - format only
  '*.{yaml,yml}': ['prettier --write'],
};
