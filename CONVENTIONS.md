# Project Conventions

> This file is automatically maintained by the Coordinator Agent.
> All worker agents MUST read this before implementing each feature.
> Last updated: 2026-01-23T08:49:40.192013

## Naming Conventions

### React Hooks
- Pattern: `use{Domain}{Action}` (e.g., `useGameState`, `useWalletConnection`)
- Location: `src/hooks/` or co-located with feature

### Components
- Pattern: PascalCase, descriptive (e.g., `GameCanvas`, `WalletConnectButton`)
- Props interface: `{ComponentName}Props`

### Files
- Components: `ComponentName.tsx`
- Hooks: `use-hook-name.ts` (kebab-case)
- Utils: `util-name.ts` (kebab-case)
- Types: `types.ts` or `{domain}.types.ts`

## Import Patterns

### Path Aliases
```typescript
import { Component } from '@/components/Component'
import { useHook } from '@/hooks/use-hook'
import { util } from '@/lib/utils'
import type { Type } from '@/types'
```

### Import Order
1. React/Next.js
2. External packages
3. Internal aliases (@/)
4. Relative imports
5. Types (with `type` keyword)

## Code Patterns

### Error Handling
```typescript
// Use AppError for consistent error handling
import { AppError } from '@/lib/errors'

throw new AppError('MESSAGE', { code: 'ERROR_CODE', status: 400 })
```

### Component Structure
```typescript
interface ComponentProps {
  // props
}

export function Component({ prop }: ComponentProps) {
  // hooks first
  // derived state
  // handlers
  // effects
  // render
}
```

### State Management
- Local state: `useState`
- Complex local: `useReducer`
- Shared state: Context or Zustand store
- Server state: React Query

## Styling

### Tailwind Classes
- Use `cn()` helper for conditional classes
- Follow design system tokens
- Mobile-first responsive

```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  condition && "conditional-classes"
)} />
```

## Testing

### Test Files
- Location: `__tests__/` directory or `.test.ts` suffix
- Naming: `{feature}.test.ts`

### Test Structure
```typescript
describe('Feature', () => {
  it('should do expected behavior', () => {
    // arrange, act, assert
  })
})
```

---

## Discovered Patterns (Auto-Updated)

<!-- DISCOVERED_PATTERNS_START -->
<!-- Patterns discovered by agents will be inserted here -->
<!-- DISCOVERED_PATTERNS_END -->
