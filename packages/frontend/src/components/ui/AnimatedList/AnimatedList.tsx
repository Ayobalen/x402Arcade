/**
 * AnimatedList Component
 *
 * A wrapper component that applies stagger animations to list items.
 * Uses framer-motion to create smooth, sequential entrance animations.
 *
 * @example
 * ```tsx
 * <AnimatedList>
 *   {items.map((item) => (
 *     <AnimatedList.Item key={item.id}>
 *       {item.content}
 *     </AnimatedList.Item>
 *   ))}
 * </AnimatedList>
 * ```
 */

import { motion } from 'framer-motion';
import React from 'react';
import { staggerContainer, staggerChild, getStaggerPreset } from '../../../lib/animations/stagger';
import type { AnimatedListProps, AnimatedListItemProps } from './AnimatedList.types';

/**
 * AnimatedList - Container component for staggered list animations
 */
export const AnimatedList: React.FC<AnimatedListProps> & {
  Item: React.FC<AnimatedListItemProps>;
} = ({
  children,
  className,
  preset = 'normal',
  staggerDelay,
  delayChildren,
  as: Component = 'ul',
  ...rest
}) => {
  // Use preset if provided, otherwise create custom stagger config
  const variants = preset
    ? getStaggerPreset(preset).container
    : staggerContainer({
        staggerChildren: staggerDelay,
        delayChildren,
      });

  const MotionComponent = motion[Component as keyof typeof motion] as typeof motion.ul;

  return (
    <MotionComponent
      className={className}
      variants={variants}
      initial="hidden"
      animate="visible"
      exit="exit"
      {...rest}
    >
      {children}
    </MotionComponent>
  );
};

/**
 * AnimatedList.Item - Individual list item with stagger animation
 */
const AnimatedListItem: React.FC<AnimatedListItemProps> = ({
  children,
  className,
  preset = 'normal',
  customAnimation,
  as: Component = 'li',
  ...rest
}) => {
  // Use custom animation if provided, otherwise use preset
  const variants = customAnimation || (preset ? getStaggerPreset(preset).child : staggerChild());

  const MotionComponent = motion[Component as keyof typeof motion] as typeof motion.li;

  return (
    <MotionComponent className={className} variants={variants} {...rest}>
      {children}
    </MotionComponent>
  );
};

AnimatedList.Item = AnimatedListItem;

export default AnimatedList;
