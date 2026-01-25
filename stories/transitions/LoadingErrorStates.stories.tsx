/**
 * Loading and Error Transition States Storybook Stories
 *
 * Visual documentation and testing for loading/error transition states.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  loadingTransition,
  skeletonAnimation,
  errorTransition,
  errorIconEntrance,
  loadingErrorTransition,
  loadingIndicator,
} from '../../packages/frontend/src/lib/animations/pageTransitions';

const meta: Meta = {
  title: 'Transitions/Loading and Error States',
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#0a0a0a' },
        { name: 'light', value: '#ffffff' },
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;

type Story = StoryObj;

/**
 * Loading Transition State
 *
 * Demonstrates the loading → loaded transition with shimmer effect.
 */
export const LoadingToLoaded: Story = {
  render: () => {
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => setIsLoaded(true), 2000);
      return () => clearTimeout(timer);
    }, []);

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={() => setIsLoaded(!isLoaded)}
          className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400"
        >
          Toggle: {isLoaded ? 'Loaded' : 'Loading'}
        </button>

        <motion.div
          variants={loadingTransition}
          initial="loading"
          animate={isLoaded ? 'loaded' : 'loading'}
          className="w-96 p-6 bg-[#16162a] rounded-xl border border-[#2d2d4a]"
        >
          <h3 className="text-xl font-bold text-white mb-4">
            {isLoaded ? 'Content Loaded!' : 'Loading content...'}
          </h3>
          <p className="text-gray-400">
            {isLoaded
              ? 'This content smoothly transitioned from loading to loaded state.'
              : 'Content is being fetched. Notice the subtle dimming effect.'}
          </p>
        </motion.div>
      </div>
    );
  },
};

/**
 * Skeleton Animation
 *
 * Pulsing shimmer effect for loading placeholders.
 */
export const SkeletonPulse: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-4 p-8">
        <h3 className="text-white text-lg mb-2">Skeleton Loading (Infinite Pulse)</h3>

        <div className="space-y-3 w-96">
          {/* Title skeleton */}
          <motion.div
            variants={skeletonAnimation}
            animate="pulse"
            className="h-8 bg-gray-700 rounded"
          />

          {/* Text skeletons */}
          <motion.div
            variants={skeletonAnimation}
            animate="pulse"
            className="h-4 bg-gray-700 rounded w-3/4"
            style={{ animationDelay: '0.1s' }}
          />
          <motion.div
            variants={skeletonAnimation}
            animate="pulse"
            className="h-4 bg-gray-700 rounded"
            style={{ animationDelay: '0.2s' }}
          />
          <motion.div
            variants={skeletonAnimation}
            animate="pulse"
            className="h-4 bg-gray-700 rounded w-5/6"
            style={{ animationDelay: '0.3s' }}
          />

          {/* Button skeleton */}
          <motion.div
            variants={skeletonAnimation}
            animate="pulse"
            className="h-10 bg-gray-700 rounded w-32 mt-4"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      </div>
    );
  },
};

/**
 * Error Transition
 *
 * Shake animation to draw attention to errors.
 */
export const ErrorShake: Story = {
  render: () => {
    const [hasError, setHasError] = useState(false);
    const [triggerCount, setTriggerCount] = useState(0);

    const handleTrigger = () => {
      setHasError(true);
      setTriggerCount((c) => c + 1);
      setTimeout(() => setHasError(false), 600);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={handleTrigger}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
        >
          Trigger Error Shake
        </button>

        <motion.div
          key={triggerCount}
          variants={errorTransition}
          initial="loading"
          animate={hasError ? 'error' : 'loaded'}
          className="w-96 p-6 bg-[#16162a] rounded-xl border-2 border-red-500"
        >
          <h3 className="text-xl font-bold text-red-400 mb-2">
            {hasError ? 'Error!' : 'Ready'}
          </h3>
          <p className="text-gray-400">
            {hasError
              ? 'Notice the shake animation and brightness increase!'
              : 'Click the button above to see the error shake effect.'}
          </p>
        </motion.div>
      </div>
    );
  },
};

/**
 * Error Icon Entrance
 *
 * Dramatic pop-in animation for error icons.
 */
export const ErrorIconAnimation: Story = {
  render: () => {
    const [showIcon, setShowIcon] = useState(false);

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={() => setShowIcon(!showIcon)}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
        >
          Toggle Error Icon
        </button>

        <div className="relative w-32 h-32 flex items-center justify-center">
          {showIcon && (
            <motion.div
              variants={errorIconEntrance}
              initial="hidden"
              animate="visible"
              className="text-8xl"
            >
              ❌
            </motion.div>
          )}
        </div>

        <p className="text-gray-400 text-sm text-center max-w-xs">
          Error icon pops in with rotation and spring physics
        </p>
      </div>
    );
  },
};

/**
 * Loading Error Transition
 *
 * Complete flow: loading → loaded or loading → error
 */
export const LoadingErrorFlow: Story = {
  render: () => {
    const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');

    useEffect(() => {
      setState('loading');
      const timer = setTimeout(() => {
        // Randomly succeed or fail
        setState(Math.random() > 0.5 ? 'loaded' : 'error');
      }, 2000);
      return () => clearTimeout(timer);
    }, []);

    const handleRetry = () => {
      setState('loading');
      setTimeout(() => {
        setState(Math.random() > 0.5 ? 'loaded' : 'error');
      }, 2000);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <div className="flex gap-2">
          <button
            onClick={() => setState('loading')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
          >
            Loading
          </button>
          <button
            onClick={() => setState('loaded')}
            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-400"
          >
            Success
          </button>
          <button
            onClick={() => setState('error')}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
          >
            Error
          </button>
        </div>

        <motion.div
          variants={loadingErrorTransition}
          animate={state}
          className={`w-96 p-6 rounded-xl border-2 ${
            state === 'error'
              ? 'bg-red-950 border-red-500'
              : state === 'loaded'
                ? 'bg-green-950 border-green-500'
                : 'bg-[#16162a] border-[#2d2d4a]'
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {state === 'loading' && (
              <motion.div
                variants={loadingIndicator}
                animate="spinning"
                className="text-2xl"
              >
                ⭕
              </motion.div>
            )}
            {state === 'error' && (
              <motion.div
                variants={errorIconEntrance}
                initial="hidden"
                animate="visible"
                className="text-2xl"
              >
                ❌
              </motion.div>
            )}
            {state === 'loaded' && <div className="text-2xl">✅</div>}

            <h3 className="text-xl font-bold text-white">
              {state === 'loading' && 'Loading...'}
              {state === 'loaded' && 'Success!'}
              {state === 'error' && 'Error Occurred'}
            </h3>
          </div>

          <p className="text-gray-400 mb-4">
            {state === 'loading' && 'Fetching data from the server...'}
            {state === 'loaded' && 'Data loaded successfully!'}
            {state === 'error' && 'Failed to load data. Please try again.'}
          </p>

          {state === 'error' && (
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
            >
              Retry
            </button>
          )}
        </motion.div>
      </div>
    );
  },
};

/**
 * Loading Indicators
 *
 * Spinning and pulsing loading animations.
 */
export const LoadingIndicators: Story = {
  render: () => {
    return (
      <div className="flex flex-col gap-8 p-8">
        <div className="flex flex-col items-center gap-4">
          <h3 className="text-white text-lg">Spinning Indicator</h3>
          <motion.div
            variants={loadingIndicator}
            animate="spinning"
            className="text-6xl"
          >
            ⭕
          </motion.div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <h3 className="text-white text-lg">Pulsing Indicator</h3>
          <motion.div
            variants={loadingIndicator}
            animate="pulsing"
            className="w-16 h-16 rounded-full bg-cyan-500"
          />
        </div>

        <div className="flex flex-col items-center gap-4">
          <h3 className="text-white text-lg">Multiple Pulsing Dots</h3>
          <div className="flex gap-2">
            {[0, 0.2, 0.4].map((delay, i) => (
              <motion.div
                key={i}
                variants={loadingIndicator}
                animate="pulsing"
                style={{ animationDelay: `${delay}s` }}
                className="w-4 h-4 rounded-full bg-cyan-500"
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
};

/**
 * All States Comparison
 *
 * Side-by-side comparison of all loading/error states.
 */
export const AllStatesComparison: Story = {
  render: () => {
    return (
      <div className="grid grid-cols-2 gap-6 p-8 max-w-4xl">
        {/* Loading State */}
        <motion.div
          variants={loadingTransition}
          animate="loading"
          className="p-6 bg-[#16162a] rounded-xl border border-[#2d2d4a]"
        >
          <h4 className="text-white font-bold mb-2">Loading State</h4>
          <p className="text-gray-400 text-sm">Opacity: 0.6, Brightness: 0.9</p>
        </motion.div>

        {/* Loaded State */}
        <motion.div
          variants={loadingTransition}
          animate="loaded"
          className="p-6 bg-[#16162a] rounded-xl border border-[#2d2d4a]"
        >
          <h4 className="text-white font-bold mb-2">Loaded State</h4>
          <p className="text-gray-400 text-sm">Opacity: 1, Brightness: 1</p>
        </motion.div>

        {/* Skeleton */}
        <motion.div
          variants={skeletonAnimation}
          animate="pulse"
          className="p-6 bg-gray-700 rounded-xl"
        >
          <div className="h-4 bg-gray-600 rounded mb-2" />
          <div className="h-4 bg-gray-600 rounded w-3/4" />
        </motion.div>

        {/* Error State */}
        <motion.div
          variants={errorTransition}
          animate="error"
          className="p-6 bg-red-950 rounded-xl border-2 border-red-500"
        >
          <h4 className="text-red-400 font-bold mb-2">Error State</h4>
          <p className="text-gray-400 text-sm">Shake + Brightness: 1.1</p>
        </motion.div>
      </div>
    );
  },
};

/**
 * Real-World Example: Content Card
 *
 * Practical example of using loading/error states in a content card.
 */
export const RealWorldContentCard: Story = {
  render: () => {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const fetchData = () => {
      setStatus('loading');
      setTimeout(() => {
        setStatus(Math.random() > 0.3 ? 'success' : 'error');
      }, 2000);
    };

    return (
      <div className="flex flex-col items-center gap-4 p-8">
        <button
          onClick={fetchData}
          disabled={status === 'loading'}
          className="px-6 py-3 bg-cyan-500 text-white rounded-lg hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === 'loading' ? 'Loading...' : 'Fetch User Data'}
        </button>

        <motion.div
          variants={loadingErrorTransition}
          animate={
            status === 'loading' ? 'loading' : status === 'error' ? 'error' : 'loaded'
          }
          className={`w-96 p-6 rounded-xl border-2 ${
            status === 'error'
              ? 'bg-red-950/50 border-red-500'
              : 'bg-[#16162a] border-[#2d2d4a]'
          }`}
        >
          {status === 'loading' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div variants={loadingIndicator} animate="spinning" className="text-xl">
                  ⭕
                </motion.div>
                <h3 className="text-white font-bold">Loading user data...</h3>
              </div>
              <motion.div variants={skeletonAnimation} animate="pulse" className="h-4 bg-gray-700 rounded" />
              <motion.div variants={skeletonAnimation} animate="pulse" className="h-4 bg-gray-700 rounded w-3/4" />
            </div>
          )}

          {status === 'success' && (
            <div>
              <h3 className="text-white font-bold mb-2">John Doe</h3>
              <p className="text-gray-400 text-sm mb-1">Email: john@example.com</p>
              <p className="text-gray-400 text-sm">Role: Developer</p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <motion.div
                  variants={errorIconEntrance}
                  initial="hidden"
                  animate="visible"
                  className="text-2xl"
                >
                  ❌
                </motion.div>
                <h3 className="text-red-400 font-bold">Failed to load user</h3>
              </div>
              <p className="text-gray-400 text-sm">
                Unable to fetch user data. Please check your connection and try again.
              </p>
              <button
                onClick={fetchData}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-400"
              >
                Retry
              </button>
            </div>
          )}

          {status === 'idle' && (
            <div>
              <h3 className="text-white font-bold mb-2">User Profile</h3>
              <p className="text-gray-400 text-sm">Click the button above to load user data</p>
            </div>
          )}
        </motion.div>
      </div>
    );
  },
};
