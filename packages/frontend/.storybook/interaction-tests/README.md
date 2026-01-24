# Storybook Interaction Tests

This directory contains interaction test templates and utilities for testing component behavior in Storybook.

## Overview

Storybook interaction tests use the `play` function to simulate user interactions and verify component behavior. Tests run in the browser environment with real DOM interactions.

## Structure

```
interaction-tests/
├── README.md              # This file
├── templates/             # Reusable test templates
│   └── interaction.template.tsx
├── utils/                 # Test utilities
│   └── interactions.ts    # Helper functions for common interactions
└── examples/              # Example interaction tests
    └── button-interactions.stories.tsx
```

## Quick Start

### 1. Basic Interaction Test

```typescript
import { Meta, StoryObj } from '@storybook/react';
import { within, userEvent, expect, fn } from '@storybook/test';

const meta: Meta<typeof Component> = {
  title: 'Category/Component',
  component: Component,
};
export default meta;

type Story = StoryObj<typeof Component>;

export const InteractionTest: Story = {
  args: {
    onClick: fn(), // Mock function for callbacks
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Find elements
    const button = canvas.getByRole('button', { name: /click me/i });

    // Interact
    await userEvent.click(button);

    // Assert
    expect(args.onClick).toHaveBeenCalledTimes(1);
  },
};
```

### 2. Running Tests

```bash
# Run interaction tests in Storybook
pnpm storybook:test

# Run with coverage
pnpm storybook:test --coverage

# Run specific story
pnpm storybook:test --story "UI/Button--Click Interaction"
```

### 3. CI Integration

Interaction tests run automatically in CI via GitHub Actions:
- Tests run against a built Storybook
- Results are reported as annotations
- Screenshots are captured on failure

## Available Utilities

### `@storybook/test` exports:
- `within(element)` - Query scoped to element
- `userEvent` - User interaction simulation
- `expect(value)` - Jest-compatible assertions
- `fn()` - Mock function factory
- `waitFor(callback)` - Wait for async conditions

### Custom Utilities (`./utils/interactions.ts`):
- `expectElementVisible(canvas, text)` - Assert element is visible
- `expectButtonEnabled(canvas, text)` - Assert button is clickable
- `clickAndWait(canvas, text, options)` - Click and wait for result
- `typeInInput(canvas, label, text)` - Type in labeled input
- `selectOption(canvas, label, value)` - Select dropdown option

## Best Practices

1. **Use accessible queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
2. **Mock callbacks**: Use `fn()` to verify function calls
3. **Wait for async**: Use `waitFor` for async state changes
4. **Test user flows**: Focus on user journeys, not implementation details
5. **Keep tests fast**: Each interaction test should complete in <2 seconds
