/**
 * Component Animations Showcase
 *
 * Comprehensive demonstration of all component animations in the x402Arcade design system.
 * This story showcases:
 * - Button press and hover animations
 * - Card entrance and hover animations
 * - Modal open/close animations
 * - Toast slide animations
 * - Icon animations (checkmark, error, counter)
 */

import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Toast } from '@/components/ui/Toast';
import { AnimatedCheckmark } from '@/components/ui/AnimatedCheckmark';
import { AnimatedError } from '@/components/ui/AnimatedError';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

const meta = {
  title: 'Animations/Component Animations Showcase',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A comprehensive showcase of all component animations in the x402Arcade design system. Demonstrates framer-motion animations, spring physics, SVG path drawing, and gesture interactions.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Button Animations
 * Demonstrates press (whileTap) and hover (whileHover) animations
 */
export const ButtonAnimations: Story = {
  render: () => (
    <div className="min-h-screen bg-bg-primary p-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-display text-primary mb-2">Button Animations</h2>
          <p className="text-text-secondary mb-6">
            Press animations (scale + translate) and hover glow effects with variant-specific colors
          </p>
        </div>

        <Card className="p-8">
          <h3 className="text-xl font-display text-text-primary mb-4">Press & Hover Animations</h3>
          <p className="text-text-secondary mb-6">
            Click buttons to see press animation (scale: 0.98, y: 1). Hover to see glow effects.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
            <Button variant="success">Success Button</Button>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-display text-text-primary mb-4">Loading Spinner Animation</h3>
          <p className="text-text-secondary mb-6">
            Spinner entrance (scale + opacity) and continuous rotation animation
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" isLoading loadingText="Processing...">
              Submit
            </Button>
            <Button variant="secondary" isLoading loadingText="Connecting...">
              Connect
            </Button>
            <Button variant="outline" isLoading>
              Load More
            </Button>
          </div>
        </Card>

        <Card className="p-8">
          <h3 className="text-xl font-display text-text-primary mb-4">Disabled State</h3>
          <p className="text-text-secondary mb-6">
            Disabled buttons do not animate (no press or hover effects)
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary" isDisabled>
              Disabled Primary
            </Button>
            <Button variant="secondary" isDisabled>
              Disabled Secondary
            </Button>
            <Button variant="outline" isDisabled>
              Disabled Outline
            </Button>
          </div>
        </Card>
      </div>
    </div>
  ),
};

/**
 * Card Animations
 * Demonstrates entrance, hover lift, and selection animations
 */
export const CardAnimations: Story = {
  render: () => {
    const [selectedCard, setSelectedCard] = useState<number | null>(null);

    return (
      <div className="min-h-screen bg-bg-primary p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-display text-primary mb-2">Card Animations</h2>
            <p className="text-text-secondary mb-6">
              Entrance (fade + slide up), hover lift (y: -4, scale: 1.02), and selection animations
            </p>
          </div>

          <div>
            <h3 className="text-xl font-display text-text-primary mb-4">Staggered Entrance</h3>
            <p className="text-text-secondary mb-6">
              Cards animate in with staggered delays (0ms, 100ms, 200ms)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0}
                className="p-6"
              >
                <h4 className="text-lg font-display text-cyan mb-2">Card 1</h4>
                <p className="text-text-secondary">Delay: 0ms</p>
              </Card>
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0.1}
                className="p-6"
              >
                <h4 className="text-lg font-display text-cyan mb-2">Card 2</h4>
                <p className="text-text-secondary">Delay: 100ms</p>
              </Card>
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0.2}
                className="p-6"
              >
                <h4 className="text-lg font-display text-cyan mb-2">Card 3</h4>
                <p className="text-text-secondary">Delay: 200ms</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-display text-text-primary mb-4">Hover Lift Animation</h3>
            <p className="text-text-secondary mb-6">
              Hover over cards to see lift effect with shadow enhancement
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card variant="default" hoverable className="p-6">
                <h4 className="text-lg font-display text-magenta mb-2">Hoverable Card</h4>
                <p className="text-text-secondary">Default variant with hover</p>
              </Card>
              <Card variant="elevated" hoverable className="p-6">
                <h4 className="text-lg font-display text-magenta mb-2">Elevated Card</h4>
                <p className="text-text-secondary">Elevated variant with enhanced shadow</p>
              </Card>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-display text-text-primary mb-4">Selection Animation</h3>
            <p className="text-text-secondary mb-6">
              Click cards to select (purple border + glow + scale: 1.01)
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((id) => (
                <Card
                  key={id}
                  variant="elevated"
                  interactive
                  isSelected={selectedCard === id}
                  onClick={() => setSelectedCard(id)}
                  className="p-6 cursor-pointer"
                >
                  <h4 className="text-lg font-display text-cyan mb-2">Game {id}</h4>
                  <p className="text-text-secondary">Click to select</p>
                  {selectedCard === id && (
                    <span className="text-xs text-primary mt-2 block">✓ Selected</span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Modal Animations
 * Demonstrates modal open/close with backdrop fade
 */
export const ModalAnimations: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="min-h-screen bg-bg-primary p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-display text-primary mb-2">Modal Animations</h2>
            <p className="text-text-secondary mb-6">
              Open: scale (0.9 → 1) + fade with spring physics. Close: scale (→ 0.95) + fade
            </p>
          </div>

          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">Modal Open/Close</h3>
            <p className="text-text-secondary mb-6">
              Click to open modal. Backdrop fades independently. Escape key or click outside to
              close.
            </p>
            <Button onClick={() => setIsOpen(true)} variant="primary">
              Open Modal
            </Button>

            <Modal
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              title="Animated Modal"
              size="md"
            >
              <div className="space-y-4">
                <p className="text-text-secondary">
                  This modal demonstrates framer-motion animations:
                </p>
                <ul className="list-disc list-inside space-y-2 text-text-secondary">
                  <li>Entrance: scale from 0.9 to 1 with spring physics</li>
                  <li>Exit: scale to 0.95 with quick fade (0.15s)</li>
                  <li>Backdrop: independent fade in/out animation</li>
                  <li>Spring config: stiffness 300, damping 25</li>
                </ul>
                <div className="flex gap-3 mt-6">
                  <Button onClick={() => setIsOpen(false)} variant="primary">
                    Close Modal
                  </Button>
                  <Button onClick={() => setIsOpen(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            </Modal>
          </Card>
        </div>
      </div>
    );
  },
};

/**
 * Toast Animations
 * Demonstrates toast slide-in with position-aware directions
 */
export const ToastAnimations: Story = {
  render: () => {
    const [toasts, setToasts] = useState<Array<{ id: number; message: string; variant: string }>>([]);
    const [nextId, setNextId] = useState(1);

    const showToast = (message: string, variant: string) => {
      const id = nextId;
      setToasts((prev) => [...prev, { id, message, variant }]);
      setNextId(id + 1);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    };

    return (
      <div className="min-h-screen bg-bg-primary p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-display text-primary mb-2">Toast Animations</h2>
            <p className="text-text-secondary mb-6">
              Position-aware slide animations (right: x: 100 → 0, spring physics)
            </p>
          </div>

          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">Toast Variants</h3>
            <p className="text-text-secondary mb-6">
              Click buttons to trigger toasts. Each slides in from the side with spring animation.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button onClick={() => showToast('Success! Operation completed.', 'success')} variant="success">
                Show Success
              </Button>
              <Button onClick={() => showToast('Error! Something went wrong.', 'error')} variant="danger">
                Show Error
              </Button>
              <Button onClick={() => showToast('Warning! Please be careful.', 'warning')} variant="secondary">
                Show Warning
              </Button>
              <Button onClick={() => showToast('Info: This is a notification.', 'info')} variant="outline">
                Show Info
              </Button>
            </div>
          </Card>

          {/* Toast container */}
          <div className="fixed top-4 right-4 z-50 space-y-2">
            {toasts.map((toast) => (
              <Toast
                key={toast.id}
                message={toast.message}
                variant={toast.variant as any}
                position="top-right"
                onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Icon Animations
 * Demonstrates AnimatedCheckmark, AnimatedError, and AnimatedCounter
 */
export const IconAnimations: Story = {
  render: () => {
    const [counterValue, setCounterValue] = useState(0);
    const [triggerCheckmark, setTriggerCheckmark] = useState(0);
    const [triggerError, setTriggerError] = useState(0);

    return (
      <div className="min-h-screen bg-bg-primary p-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div>
            <h2 className="text-3xl font-display text-primary mb-2">Icon Animations</h2>
            <p className="text-text-secondary mb-6">
              SVG path drawing (pathLength) and spring-based counter animations
            </p>
          </div>

          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">AnimatedCheckmark</h3>
            <p className="text-text-secondary mb-6">
              Circle scales in (30%), then checkmark draws (70%). Green neon glow.
            </p>
            <div className="flex items-center gap-6">
              <AnimatedCheckmark key={triggerCheckmark} size={80} />
              <Button onClick={() => setTriggerCheckmark((c) => c + 1)} variant="success">
                Replay Animation
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">AnimatedError</h3>
            <p className="text-text-secondary mb-6">
              Circle scales in (25%), cross lines draw (50%), then shake (25%). Red neon glow.
            </p>
            <div className="flex items-center gap-6">
              <AnimatedError key={triggerError} size={80} />
              <Button onClick={() => setTriggerError((c) => c + 1)} variant="danger">
                Replay Animation
              </Button>
            </div>
          </Card>

          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">AnimatedCounter</h3>
            <p className="text-text-secondary mb-6">
              Spring-based number animation with multiple formats (none, currency, percentage,
              compact)
            </p>
            <div className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="text-5xl font-display text-cyan">
                  <AnimatedCounter value={counterValue} />
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => setCounterValue((c) => c + 100)} variant="primary">
                    +100
                  </Button>
                  <Button onClick={() => setCounterValue((c) => c + 1000)} variant="secondary">
                    +1000
                  </Button>
                  <Button onClick={() => setCounterValue(0)} variant="outline">
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-text-muted text-sm mb-1">Currency Format:</div>
                  <div className="text-2xl font-display text-success">
                    <AnimatedCounter value={counterValue / 10} format="currency" decimals={2} />
                  </div>
                </div>
                <div>
                  <div className="text-text-muted text-sm mb-1">Percentage Format:</div>
                  <div className="text-2xl font-display text-secondary">
                    <AnimatedCounter
                      value={Math.min(100, counterValue / 50)}
                      format="percentage"
                      decimals={1}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  },
};

/**
 * All Animations
 * Comprehensive showcase of all animation types together
 */
export const AllAnimations: Story = {
  render: () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [score, setScore] = useState(12500);

    return (
      <div className="min-h-screen bg-bg-primary p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h2 className="text-4xl font-display text-primary mb-2">
              x402Arcade Animation System
            </h2>
            <p className="text-text-secondary mb-6">
              A comprehensive showcase of all component animations: buttons, cards, modals, toasts,
              and icon animations.
            </p>
          </div>

          {/* Hero Section */}
          <Card variant="elevated" className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display text-cyan mb-2">Current Score</h3>
                <div className="text-5xl font-display text-primary">
                  <AnimatedCounter value={score} />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => setScore((s) => s + 100)} variant="success">
                  +100 Points
                </Button>
                <Button onClick={() => setScore((s) => s + 1000)} variant="primary">
                  +1000 Points
                </Button>
              </div>
            </div>
          </Card>

          {/* Game Cards */}
          <div>
            <h3 className="text-xl font-display text-text-primary mb-4">Available Games</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0}
                className="p-6"
              >
                <h4 className="text-lg font-display text-cyan mb-2">Snake</h4>
                <p className="text-text-secondary mb-4">Classic arcade snake game</p>
                <Button variant="primary" size="sm" fullWidth>
                  Play Now
                </Button>
              </Card>
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0.1}
                className="p-6"
              >
                <h4 className="text-lg font-display text-magenta mb-2">Tetris</h4>
                <p className="text-text-secondary mb-4">Stack blocks and clear lines</p>
                <Button variant="secondary" size="sm" fullWidth>
                  Play Now
                </Button>
              </Card>
              <Card
                variant="elevated"
                hoverable
                animateEntrance
                entranceDelay={0.2}
                className="p-6"
              >
                <h4 className="text-lg font-display text-success mb-2">Coming Soon</h4>
                <p className="text-text-secondary mb-4">More games on the way</p>
                <Button variant="outline" size="sm" fullWidth isDisabled>
                  Locked
                </Button>
              </Card>
            </div>
          </div>

          {/* Modal Demo */}
          <Card className="p-8">
            <h3 className="text-xl font-display text-text-primary mb-4">Modal Animation</h3>
            <Button onClick={() => setModalOpen(true)} variant="primary">
              Open Modal
            </Button>
          </Card>

          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Game Over!"
            size="md"
          >
            <div className="text-center space-y-6">
              <AnimatedCheckmark size={80} />
              <div>
                <h4 className="text-2xl font-display text-success mb-2">Congratulations!</h4>
                <p className="text-text-secondary">
                  You've completed the game with a high score!
                </p>
              </div>
              <div className="text-4xl font-display text-primary">
                <AnimatedCounter value={score} />
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={() => setModalOpen(false)} variant="primary">
                  Play Again
                </Button>
                <Button onClick={() => setModalOpen(false)} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        </div>
      </div>
    );
  },
};
