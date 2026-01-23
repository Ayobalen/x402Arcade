#!/usr/bin/env python3
"""
Script to add missing UI/UX and Design System features to the x402Arcade features database.
This addresses gaps identified in the audit for UI components, responsive design, arcade theme,
user flows, and missing pages.

Run with: python add_missing_features.py
"""

import sys
sys.path.insert(0, '/Users/mujeeb/autocoder')

from pathlib import Path
from api.database import Feature, create_database
from sqlalchemy import func

PROJECT_DIR = Path('/Users/mujeeb/Projects/x402Arcade')

# Initialize database
engine, SessionLocal = create_database(PROJECT_DIR)
session = SessionLocal()

# Get current max priority
max_priority = session.query(func.max(Feature.priority)).scalar()
print(f"Current max priority: {max_priority}")

# Define all new features to fill the gaps
new_features = [
    # ============================================================================
    # MISSING UI COMPONENTS - Spinner, Avatar, Badge, Tooltip, Dropdown, etc.
    # ============================================================================
    {
        "priority": max_priority + 1,
        "category": "UI Primitives - Extended",
        "name": "Create Spinner component",
        "description": "Create a Spinner component for loading states with arcade-style neon animation. The spinner should have multiple sizes and color variants matching the design system.",
        "steps": [
            "Create packages/frontend/src/components/ui/Spinner/Spinner.tsx",
            "Define SpinnerProps interface with size (sm, md, lg, xl) and variant (primary, secondary, white)",
            "Implement CSS keyframes for rotation animation with neon glow",
            "Add arcade-style concentric ring animation option",
            "Export component from ui/index.ts",
            "Write Spinner.test.tsx unit tests",
            "Create Spinner.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 2,
        "category": "UI Primitives - Extended",
        "name": "Create Avatar component",
        "description": "Create an Avatar component for displaying user/wallet identities. Support for wallet address Jazzicons, custom images, and fallback initials.",
        "steps": [
            "Create packages/frontend/src/components/ui/Avatar/Avatar.tsx",
            "Define AvatarProps with src, alt, size, fallback, walletAddress options",
            "Implement Jazzicon generation for wallet addresses using @metamask/jazzicon",
            "Add size variants: xs, sm, md, lg, xl",
            "Add neon border glow on hover",
            "Implement fallback with initials or default icon",
            "Write Avatar.test.tsx unit tests",
            "Create Avatar.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 3,
        "category": "UI Primitives - Extended",
        "name": "Create Badge component",
        "description": "Create a Badge component for status indicators, labels, and tags. Include variants for success, error, warning, info, and custom colors.",
        "steps": [
            "Create packages/frontend/src/components/ui/Badge/Badge.tsx",
            "Define BadgeProps with variant, size, glow, removable options",
            "Implement color variants: primary, secondary, success, warning, error, info",
            "Add size variants: sm, md, lg",
            "Add optional neon glow effect",
            "Implement dot indicator option for status badges",
            "Write Badge.test.tsx unit tests",
            "Create Badge.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 4,
        "category": "UI Primitives - Extended",
        "name": "Create Tooltip component",
        "description": "Create a Tooltip component for contextual information display. Support multiple placements and trigger modes.",
        "steps": [
            "Create packages/frontend/src/components/ui/Tooltip/Tooltip.tsx",
            "Define TooltipProps with content, placement, trigger, delay options",
            "Implement placement options: top, bottom, left, right with auto-flip",
            "Add trigger modes: hover, click, focus",
            "Style with dark background matching design system",
            "Add subtle entrance/exit animations",
            "Implement arrow pointer",
            "Write Tooltip.test.tsx unit tests",
            "Create Tooltip.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 5,
        "category": "UI Primitives - Extended",
        "name": "Create Dropdown component",
        "description": "Create a Dropdown menu component for action menus and selections. Include keyboard navigation and arcade styling.",
        "steps": [
            "Create packages/frontend/src/components/ui/Dropdown/Dropdown.tsx",
            "Create Dropdown.Trigger, Dropdown.Menu, Dropdown.Item compound components",
            "Define DropdownProps with open, onOpenChange, placement options",
            "Implement keyboard navigation (Arrow keys, Enter, Escape)",
            "Add smooth slide-down animation",
            "Style with card background and neon border on focus",
            "Support icons and descriptions in menu items",
            "Write Dropdown.test.tsx unit tests",
            "Create Dropdown.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 6,
        "category": "UI Primitives - Extended",
        "name": "Create Select component",
        "description": "Create a Select component for form selections. Build on Dropdown with single/multi-select support.",
        "steps": [
            "Create packages/frontend/src/components/ui/Select/Select.tsx",
            "Define SelectProps with options, value, onChange, multiple, searchable",
            "Implement single and multi-select modes",
            "Add searchable option with filter input",
            "Style trigger to match Input component",
            "Add selected value display with chips for multi-select",
            "Implement clear button option",
            "Write Select.test.tsx unit tests",
            "Create Select.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 7,
        "category": "UI Primitives - Extended",
        "name": "Create Checkbox component",
        "description": "Create a Checkbox component for boolean inputs with arcade-style animation.",
        "steps": [
            "Create packages/frontend/src/components/ui/Checkbox/Checkbox.tsx",
            "Define CheckboxProps with checked, onChange, disabled, label options",
            "Implement custom checkbox styling with neon cyan check",
            "Add check mark animation on toggle",
            "Support indeterminate state",
            "Add focus ring with glow effect",
            "Write Checkbox.test.tsx unit tests",
            "Create Checkbox.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 8,
        "category": "UI Primitives - Extended",
        "name": "Create Radio component",
        "description": "Create a Radio component for single-selection option groups with arcade styling.",
        "steps": [
            "Create packages/frontend/src/components/ui/Radio/Radio.tsx",
            "Create RadioGroup wrapper component",
            "Define RadioProps with value, onChange, disabled, label options",
            "Implement custom radio styling with neon fill animation",
            "Add focus ring with glow effect",
            "Support horizontal and vertical layouts",
            "Write Radio.test.tsx unit tests",
            "Create Radio.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 9,
        "category": "UI Primitives - Extended",
        "name": "Create Switch component",
        "description": "Create a Switch toggle component for on/off settings with smooth animation.",
        "steps": [
            "Create packages/frontend/src/components/ui/Switch/Switch.tsx",
            "Define SwitchProps with checked, onChange, disabled, size options",
            "Implement smooth sliding animation on toggle",
            "Add color transition from off to on (cyan glow when on)",
            "Support different sizes: sm, md, lg",
            "Add optional label integration",
            "Write Switch.test.tsx unit tests",
            "Create Switch.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 10,
        "category": "UI Primitives - Extended",
        "name": "Create Slider component",
        "description": "Create a Slider component for range inputs with arcade-style track and thumb.",
        "steps": [
            "Create packages/frontend/src/components/ui/Slider/Slider.tsx",
            "Define SliderProps with min, max, step, value, onChange options",
            "Implement custom track with neon fill for active portion",
            "Create glowing thumb with drag interaction",
            "Add tooltip showing current value on hover/drag",
            "Support marks/ticks at specific values",
            "Write Slider.test.tsx unit tests",
            "Create Slider.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 11,
        "category": "UI Primitives - Extended",
        "name": "Create Progress component",
        "description": "Create a Progress bar component for showing completion status with arcade-style animation.",
        "steps": [
            "Create packages/frontend/src/components/ui/Progress/Progress.tsx",
            "Define ProgressProps with value, max, variant, animated, size options",
            "Implement linear progress bar with neon glow",
            "Add circular/radial progress variant",
            "Include animated stripes option for indeterminate state",
            "Add percentage label option",
            "Write Progress.test.tsx unit tests",
            "Create Progress.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 12,
        "category": "UI Primitives - Extended",
        "name": "Create Tabs component",
        "description": "Create a Tabs component for organizing content with arcade-style active indicator.",
        "steps": [
            "Create packages/frontend/src/components/ui/Tabs/Tabs.tsx",
            "Create Tabs.List, Tabs.Tab, Tabs.Panel compound components",
            "Define TabsProps with defaultValue, onChange, orientation options",
            "Implement sliding neon indicator for active tab",
            "Add keyboard navigation support",
            "Support icons in tab labels",
            "Support disabled tabs",
            "Write Tabs.test.tsx unit tests",
            "Create Tabs.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 13,
        "category": "UI Primitives - Extended",
        "name": "Create Accordion component",
        "description": "Create an Accordion component for expandable content sections.",
        "steps": [
            "Create packages/frontend/src/components/ui/Accordion/Accordion.tsx",
            "Create Accordion.Item, Accordion.Trigger, Accordion.Content components",
            "Define AccordionProps with type (single/multiple), defaultValue options",
            "Implement smooth height animation on expand/collapse",
            "Add rotating chevron indicator",
            "Style with subtle border and hover effects",
            "Write Accordion.test.tsx unit tests",
            "Create Accordion.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 14,
        "category": "UI Primitives - Extended",
        "name": "Create Skeleton component",
        "description": "Create a Skeleton component for loading placeholders with shimmer animation.",
        "steps": [
            "Create packages/frontend/src/components/ui/Skeleton/Skeleton.tsx",
            "Define SkeletonProps with variant (text, circular, rectangular), width, height",
            "Implement animated shimmer effect matching arcade aesthetic",
            "Add preset variants: SkeletonText, SkeletonAvatar, SkeletonCard",
            "Support custom aspect ratios",
            "Write Skeleton.test.tsx unit tests",
            "Create Skeleton.stories.tsx for Storybook"
        ]
    },
    {
        "priority": max_priority + 15,
        "category": "UI Primitives - Extended",
        "name": "Create EmptyState component",
        "description": "Create an EmptyState component for displaying when no data is available.",
        "steps": [
            "Create packages/frontend/src/components/ui/EmptyState/EmptyState.tsx",
            "Define EmptyStateProps with icon, title, description, action options",
            "Implement centered layout with arcade-style illustration",
            "Add optional CTA button",
            "Create preset variants: NoGames, NoScores, NoTransactions",
            "Write EmptyState.test.tsx unit tests",
            "Create EmptyState.stories.tsx for Storybook"
        ]
    },

    # ============================================================================
    # MODAL COMPOUND COMPONENTS
    # ============================================================================
    {
        "priority": max_priority + 16,
        "category": "UI Primitives - Extended",
        "name": "Create Modal compound components (Header, Body, Footer)",
        "description": "Extend Modal with compound components for consistent structure.",
        "steps": [
            "Create Modal.Header component with title and close button",
            "Create Modal.Body component with scrollable content area",
            "Create Modal.Footer component with action buttons alignment",
            "Add proper spacing tokens between sections",
            "Implement default close button in Header",
            "Add divider option between sections",
            "Update Modal.stories.tsx with compound component examples",
            "Write compound component tests"
        ]
    },

    # ============================================================================
    # RESPONSIVE DESIGN FEATURES
    # ============================================================================
    {
        "priority": max_priority + 17,
        "category": "Responsive Design",
        "name": "Define responsive breakpoint system",
        "description": "Create a comprehensive breakpoint system for consistent responsive behavior across all components.",
        "steps": [
            "Define breakpoints in tailwind.config.js: xs(320), sm(480), md(768), lg(1024), xl(1280), 2xl(1536)",
            "Create useBreakpoint hook for programmatic breakpoint detection",
            "Create useMediaQuery hook for custom media queries",
            "Add responsive utility classes for common patterns",
            "Document breakpoint usage guidelines",
            "Write breakpoint hook tests"
        ]
    },
    {
        "priority": max_priority + 18,
        "category": "Responsive Design",
        "name": "Implement mobile-first layout grid",
        "description": "Create responsive grid system optimized for mobile-first development.",
        "steps": [
            "Create Grid and GridItem components",
            "Implement responsive column spanning",
            "Add gap utilities with responsive variants",
            "Support nested grids",
            "Add auto-fit and auto-fill options",
            "Write Grid component tests",
            "Create Grid.stories.tsx"
        ]
    },
    {
        "priority": max_priority + 19,
        "category": "Responsive Design",
        "name": "Create responsive navigation drawer for mobile",
        "description": "Implement slide-out navigation drawer for mobile devices replacing desktop navigation.",
        "steps": [
            "Create MobileDrawer component with slide-in animation",
            "Implement swipe-to-close gesture",
            "Add backdrop overlay with fade animation",
            "Include navigation links matching Header",
            "Add wallet connection section in drawer",
            "Implement body scroll lock when open",
            "Write MobileDrawer tests",
            "Create MobileDrawer.stories.tsx"
        ]
    },
    {
        "priority": max_priority + 20,
        "category": "Responsive Design",
        "name": "Implement responsive game lobby layout",
        "description": "Create responsive layout for game lobby that adapts from mobile to desktop.",
        "steps": [
            "Design mobile layout: single column game cards",
            "Design tablet layout: 2-column grid",
            "Design desktop layout: 3-4 column grid with sidebar",
            "Implement card size adjustments for each breakpoint",
            "Adjust spacing and padding for mobile",
            "Ensure touch-friendly card interactions on mobile",
            "Write responsive layout tests"
        ]
    },
    {
        "priority": max_priority + 21,
        "category": "Responsive Design",
        "name": "Implement responsive leaderboard layout",
        "description": "Create responsive leaderboard that works well on all screen sizes.",
        "steps": [
            "Design mobile layout: simplified row with essential info",
            "Add horizontal scroll for additional columns on mobile",
            "Implement sticky header on scroll",
            "Add touch-friendly rank filtering",
            "Optimize typography sizes for mobile",
            "Write responsive leaderboard tests"
        ]
    },
    {
        "priority": max_priority + 22,
        "category": "Responsive Design",
        "name": "Implement touch-optimized game controls",
        "description": "Create touch controls for games on mobile devices.",
        "steps": [
            "Create TouchController component for game input",
            "Implement virtual D-pad for Snake game",
            "Add swipe gesture support for Snake direction",
            "Implement touch zones for Tetris rotation/movement",
            "Add haptic feedback on touch (vibration API)",
            "Ensure minimum 44x44px touch targets",
            "Write touch control tests"
        ]
    },
    {
        "priority": max_priority + 23,
        "category": "Responsive Design",
        "name": "Optimize 3D cabinet for mobile performance",
        "description": "Create mobile-optimized version of 3D arcade cabinet background.",
        "steps": [
            "Reduce polygon count for mobile models",
            "Implement level-of-detail (LOD) system",
            "Disable or simplify post-processing on mobile",
            "Reduce texture resolution for mobile",
            "Add option to disable 3D background on low-end devices",
            "Implement automatic quality detection",
            "Write mobile 3D performance tests"
        ]
    },
    {
        "priority": max_priority + 24,
        "category": "Responsive Design",
        "name": "Implement responsive modal sizing",
        "description": "Ensure modals adapt properly to different screen sizes.",
        "steps": [
            "Set max-width constraints by breakpoint",
            "Implement full-screen modal option for mobile",
            "Add bottom sheet variant for mobile",
            "Ensure proper keyboard handling on mobile",
            "Handle viewport resize during modal open",
            "Write responsive modal tests"
        ]
    },

    # ============================================================================
    # ARCADE THEME ENHANCEMENTS
    # ============================================================================
    {
        "priority": max_priority + 25,
        "category": "Arcade Theme",
        "name": "Create retro typography display font integration",
        "description": "Integrate retro/arcade display fonts (Orbitron or Press Start 2P) for headings and game UI.",
        "steps": [
            "Install and configure Orbitron font from Google Fonts",
            "Install Press Start 2P as alternative retro font",
            "Define font-display tokens in design system",
            "Create arcade-style heading component",
            "Add text glow effect utility for display text",
            "Document typography usage guidelines"
        ]
    },
    {
        "priority": max_priority + 26,
        "category": "Arcade Theme",
        "name": "Implement arcade sound effects system",
        "description": "Create sound effect system for UI interactions matching arcade aesthetic.",
        "steps": [
            "Create SoundManager singleton class",
            "Source/create 8-bit style sound effects (button click, coin insert, success, error)",
            "Implement sound preloading for performance",
            "Create useSoundEffect hook for components",
            "Add sound effect to Button clicks",
            "Add sound effect to game start",
            "Add sound effect to score increases",
            "Add coin insert sound for payments"
        ]
    },
    {
        "priority": max_priority + 27,
        "category": "Arcade Theme",
        "name": "Create sound toggle control",
        "description": "Implement sound on/off toggle with persistence.",
        "steps": [
            "Create SoundToggle component with speaker icon",
            "Implement sound state in Zustand store",
            "Persist sound preference to localStorage",
            "Add sound toggle to Header",
            "Create muted icon variant",
            "Respect system mute preferences",
            "Write SoundToggle tests"
        ]
    },
    {
        "priority": max_priority + 28,
        "category": "Arcade Theme",
        "name": "Create CRT screen curvature effect",
        "description": "Implement optional CRT screen curve distortion for game canvas.",
        "steps": [
            "Create CRT shader for barrel distortion",
            "Add vignette effect to screen edges",
            "Implement RGB separation effect",
            "Add optional flicker simulation",
            "Create toggle for CRT effects",
            "Optimize for performance",
            "Write CRT effect tests"
        ]
    },
    {
        "priority": max_priority + 29,
        "category": "Arcade Theme",
        "name": "Enhance scanline overlay effect",
        "description": "Improve scanline overlay for more authentic CRT appearance.",
        "steps": [
            "Create adjustable scanline density",
            "Add subtle scanline animation/flicker",
            "Implement interlacing effect option",
            "Ensure scanlines don't impact readability",
            "Add intensity control",
            "Create performance-friendly CSS-only option",
            "Write scanline effect tests"
        ]
    },
    {
        "priority": max_priority + 30,
        "category": "Arcade Theme",
        "name": "Create pixel art assets for UI",
        "description": "Create pixel art icons and decorations for arcade authenticity.",
        "steps": [
            "Create 16x16 pixel art icons for common actions",
            "Design pixel art coin/token icon",
            "Create pixel art trophy/crown for leaderboard",
            "Design pixel art game controller icons",
            "Create pixel art achievement badges",
            "Export as optimized SVGs",
            "Document icon usage"
        ]
    },

    # ============================================================================
    # USER FLOW COMPLETENESS
    # ============================================================================
    {
        "priority": max_priority + 31,
        "category": "User Flows",
        "name": "Create onboarding tutorial flow",
        "description": "Implement first-time user onboarding explaining x402 payment and gameplay.",
        "steps": [
            "Create OnboardingModal component with step-by-step slides",
            "Design welcome slide explaining x402Arcade concept",
            "Create wallet connection guide slide",
            "Create payment explanation slide (how x402 works)",
            "Create gameplay tutorial slide",
            "Implement progress indicators",
            "Store completion state in localStorage",
            "Add 'Show tutorial' option in settings",
            "Write onboarding flow tests"
        ]
    },
    {
        "priority": max_priority + 32,
        "category": "User Flows",
        "name": "Implement wallet connection error states",
        "description": "Create comprehensive error handling UI for wallet connection failures.",
        "steps": [
            "Create WalletErrorModal component",
            "Handle 'No wallet detected' error with install links",
            "Handle 'User rejected connection' error",
            "Handle 'Wrong network' error with switch network button",
            "Handle 'Already connecting' error",
            "Add retry button for recoverable errors",
            "Write wallet error state tests"
        ]
    },
    {
        "priority": max_priority + 33,
        "category": "User Flows",
        "name": "Implement payment error states",
        "description": "Create error handling UI for x402 payment failures.",
        "steps": [
            "Create PaymentErrorModal component",
            "Handle 'Insufficient balance' error with top-up guidance",
            "Handle 'User rejected transaction' error",
            "Handle 'Facilitator timeout' error",
            "Handle 'Transaction failed' error with tx hash link",
            "Add retry payment option",
            "Create payment troubleshooting guide",
            "Write payment error state tests"
        ]
    },
    {
        "priority": max_priority + 34,
        "category": "User Flows",
        "name": "Create game loading states",
        "description": "Implement loading states during game initialization.",
        "steps": [
            "Create GameLoadingOverlay component",
            "Add progress bar for asset loading",
            "Display loading tips/hints during wait",
            "Create arcade-style loading animation",
            "Handle loading timeout with retry option",
            "Add cancel button to return to lobby",
            "Write loading state tests"
        ]
    },
    {
        "priority": max_priority + 35,
        "category": "User Flows",
        "name": "Create victory celebration UI",
        "description": "Implement celebration effects for high scores and wins.",
        "steps": [
            "Create VictoryCelebration component",
            "Implement confetti particle effect",
            "Add animated score counter",
            "Display new high score badge",
            "Show leaderboard position achieved",
            "Add 'Share score' social buttons",
            "Play victory sound effect",
            "Write celebration UI tests"
        ]
    },
    {
        "priority": max_priority + 36,
        "category": "User Flows",
        "name": "Create defeat/game over UI",
        "description": "Implement game over screen with options and stats.",
        "steps": [
            "Create GameOverScreen component",
            "Display final score with animation",
            "Show session statistics (time played, items collected)",
            "Display 'Play Again' button with payment reminder",
            "Show 'View Leaderboard' option",
            "Add 'Return to Lobby' option",
            "Implement subtle failure animation (not discouraging)",
            "Write game over UI tests"
        ]
    },
    {
        "priority": max_priority + 37,
        "category": "User Flows",
        "name": "Create empty states for all data views",
        "description": "Implement empty state components for data-driven views.",
        "steps": [
            "Create EmptyLeaderboard component ('Be the first to play!')",
            "Create EmptyTransactionHistory component ('No transactions yet')",
            "Create EmptyGameHistory component ('No games played')",
            "Create NoPrizePool component for inactive pools",
            "Add CTA buttons to encourage action",
            "Use arcade-themed illustrations",
            "Write empty state tests"
        ]
    },
    {
        "priority": max_priority + 38,
        "category": "User Flows",
        "name": "Implement loading skeletons for all pages",
        "description": "Add skeleton loading states to all data-loading pages.",
        "steps": [
            "Create GameLobbySkeleton component",
            "Create LeaderboardSkeleton component",
            "Create ProfileSkeleton component",
            "Create TransactionHistorySkeleton component",
            "Ensure skeletons match actual content layout",
            "Add shimmer animation to all skeletons",
            "Write skeleton component tests"
        ]
    },

    # ============================================================================
    # MISSING UI FEATURES (Pages/Settings)
    # ============================================================================
    {
        "priority": max_priority + 39,
        "category": "Pages",
        "name": "Create Settings page",
        "description": "Implement user settings and preferences page.",
        "steps": [
            "Create SettingsPage component at /settings route",
            "Add Sound section with sound toggle",
            "Add Visual Effects section (CRT effects toggle, reduced motion)",
            "Add Quality section (3D quality: low/medium/high/auto)",
            "Add Notifications section (if implementing push notifications)",
            "Add About section with version and links",
            "Persist all settings to localStorage",
            "Write Settings page tests"
        ]
    },
    {
        "priority": max_priority + 40,
        "category": "Pages",
        "name": "Create Transaction History page",
        "description": "Implement page showing user's payment and prize history.",
        "steps": [
            "Create TransactionHistoryPage component at /transactions route",
            "Create TransactionList component",
            "Create TransactionItem component with tx details",
            "Display tx type (game payment, prize won)",
            "Display amount, timestamp, game type",
            "Add link to block explorer for each tx",
            "Implement pagination or infinite scroll",
            "Add filters (date range, type)",
            "Create transaction history API endpoint",
            "Write Transaction History page tests"
        ]
    },
    {
        "priority": max_priority + 41,
        "category": "Pages",
        "name": "Create Profile/Stats page",
        "description": "Implement user profile page with statistics and achievements.",
        "steps": [
            "Create ProfilePage component at /profile route",
            "Display wallet address with Avatar",
            "Show total games played statistic",
            "Show total amount spent statistic",
            "Show total prizes won statistic",
            "Display favorite game (most played)",
            "Show best score per game type",
            "Add leaderboard rankings summary",
            "Create profile stats API endpoint",
            "Write Profile page tests"
        ]
    },
    {
        "priority": max_priority + 42,
        "category": "Pages",
        "name": "Create Help/FAQ page",
        "description": "Implement help page with FAQ and support information.",
        "steps": [
            "Create HelpPage component at /help route",
            "Create FAQ section using Accordion component",
            "Add 'What is x402?' FAQ item",
            "Add 'How do payments work?' FAQ item",
            "Add 'How do I get USDC?' FAQ item with faucet link",
            "Add 'How do leaderboards work?' FAQ item",
            "Add 'How do prize pools work?' FAQ item",
            "Add contact/support section",
            "Add link to Cronos Discord",
            "Write Help page tests"
        ]
    },
    {
        "priority": max_priority + 43,
        "category": "Pages",
        "name": "Add navigation to new pages",
        "description": "Update navigation to include new pages (Settings, Profile, Help).",
        "steps": [
            "Add Settings link to Header (gear icon)",
            "Add Profile link to wallet dropdown menu",
            "Add Help link to Footer",
            "Add Transaction History link to Profile page",
            "Update mobile drawer with new links",
            "Update route configuration in App router",
            "Write navigation tests"
        ]
    },

    # ============================================================================
    # QUALITY SETTINGS FOR 3D
    # ============================================================================
    {
        "priority": max_priority + 44,
        "category": "Performance",
        "name": "Implement 3D quality settings system",
        "description": "Create quality presets for 3D rendering performance optimization.",
        "steps": [
            "Define quality presets: low, medium, high, auto",
            "Low: disable post-processing, reduce geometry, no shadows",
            "Medium: basic post-processing, standard geometry",
            "High: full post-processing, high detail geometry, shadows",
            "Auto: detect device capability and choose preset",
            "Create QualityContext for global quality state",
            "Persist quality setting to localStorage",
            "Write quality system tests"
        ]
    },
    {
        "priority": max_priority + 45,
        "category": "Performance",
        "name": "Implement automatic quality detection",
        "description": "Detect device capabilities and recommend quality settings.",
        "steps": [
            "Check GPU info via WebGL renderer info",
            "Check device memory (navigator.deviceMemory)",
            "Check hardware concurrency (navigator.hardwareConcurrency)",
            "Detect mobile vs desktop",
            "Check for battery status (reduce quality on low battery)",
            "Implement FPS monitoring for dynamic adjustment",
            "Create useAutoQuality hook"
        ]
    },

    # ============================================================================
    # DESIGN SYSTEM COMPLETENESS
    # ============================================================================
    {
        "priority": max_priority + 46,
        "category": "Design System Foundation",
        "name": "Add missing z-index scale tokens",
        "description": "Define z-index scale for consistent layering across the application.",
        "steps": [
            "Define z-index tokens: dropdown(10), sticky(20), fixed(30), modal-backdrop(40), modal(50), popover(60), tooltip(70)",
            "Add to CSS custom properties",
            "Add to Tailwind config extend",
            "Document z-index usage",
            "Audit and update all existing z-index usages"
        ]
    },
    {
        "priority": max_priority + 47,
        "category": "Design System Foundation",
        "name": "Add focus ring styles to design system",
        "description": "Define consistent focus ring styles for accessibility.",
        "steps": [
            "Create focus-ring utility with cyan glow",
            "Create focus-ring-inset variant",
            "Add focus-visible styles globally",
            "Ensure sufficient contrast for visibility",
            "Apply to all interactive elements",
            "Test with keyboard navigation"
        ]
    },
    {
        "priority": max_priority + 48,
        "category": "Design System Foundation",
        "name": "Add container width tokens",
        "description": "Define container max-width tokens for consistent page layouts.",
        "steps": [
            "Define container tokens: xs(320), sm(540), md(720), lg(960), xl(1140), 2xl(1320), full",
            "Add to Tailwind container config",
            "Create Container component with size prop",
            "Add responsive container behavior",
            "Document container usage"
        ]
    },
    {
        "priority": max_priority + 49,
        "category": "Design System Foundation",
        "name": "Add aspect ratio tokens",
        "description": "Define aspect ratio tokens for images and video containers.",
        "steps": [
            "Define aspect ratios: square(1/1), video(16/9), photo(4/3), portrait(3/4), game(4/3)",
            "Add to Tailwind aspect-ratio config",
            "Create AspectRatio component",
            "Document usage with images and video"
        ]
    },
    {
        "priority": max_priority + 50,
        "category": "Design System Foundation",
        "name": "Add opacity scale tokens",
        "description": "Define opacity scale for consistent transparency effects.",
        "steps": [
            "Define opacity tokens: 0, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 100",
            "Add hover/disabled opacity standards",
            "Add backdrop opacity tokens",
            "Document opacity usage guidelines"
        ]
    }
]

# Insert all new features
created_count = 0
for feature_data in new_features:
    db_feature = Feature(
        priority=feature_data["priority"],
        category=feature_data["category"],
        name=feature_data["name"],
        description=feature_data["description"],
        steps=feature_data["steps"],
        passes=False,
        in_progress=False
    )
    session.add(db_feature)
    created_count += 1

session.commit()
print(f"\nSuccessfully created {created_count} new features in the database.")

# Show breakdown by category for new features only
print("\n=== NEW FEATURES BY CATEGORY ===")
new_categories = {}
for f in new_features:
    cat = f["category"]
    new_categories[cat] = new_categories.get(cat, 0) + 1
for cat, count in sorted(new_categories.items()):
    print(f"  {cat}: {count}")

# Show all categories now
print("\n=== ALL FEATURES BY CATEGORY ===")
categories = session.query(Feature.category, func.count(Feature.id)).group_by(Feature.category).all()
for cat, count in sorted(categories, key=lambda x: x[0]):
    print(f"  {cat}: {count}")

# Total count
total = session.query(Feature).count()
print(f"\nTotal features in database: {total}")

session.close()
