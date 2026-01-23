# E2E Tests

End-to-end tests using Playwright for the x402 Arcade application.

## Directory Structure

```
e2e/
├── tests/      # Test specification files (.spec.ts)
├── fixtures/   # Reusable test fixtures and setup
├── pages/      # Page Object Model classes
├── utils/      # Helper functions and utilities
├── data/       # Test data (JSON, mock responses)
└── README.md   # This file
```

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/home.spec.ts
```

## Writing Tests

### Page Object Model

Create page objects in `pages/` to encapsulate page interactions:

```typescript
// pages/home.page.ts
import { Page, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly connectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.connectButton = page.getByRole('button', { name: 'Connect Wallet' });
  }

  async goto() {
    await this.page.goto('/');
  }
}
```

### Test Fixtures

Use fixtures in `fixtures/` for reusable test setup:

```typescript
// fixtures/wallet.fixture.ts
import { test as base } from '@playwright/test';

export const test = base.extend({
  connectedWallet: async ({ page }, use) => {
    // Setup connected wallet state
    await use(page);
    // Cleanup
  },
});
```

### Test Specifications

Write tests in `tests/` using descriptive names:

```typescript
// tests/home.spec.ts
import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/home.page';

test.describe('Home Page', () => {
  test('should display connect wallet button', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.connectButton).toBeVisible();
  });
});
```

## Best Practices

1. **Use Page Objects** - Encapsulate page interactions for maintainability
2. **Descriptive Test Names** - Use clear, behavior-driven test names
3. **Avoid Hardcoded Waits** - Use Playwright's auto-waiting mechanisms
4. **Isolate Tests** - Each test should be independent and idempotent
5. **Test Data** - Store test data in `data/` for easy maintenance
