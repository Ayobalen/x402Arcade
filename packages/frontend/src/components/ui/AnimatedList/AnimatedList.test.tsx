/**
 * AnimatedList Component Tests
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AnimatedList } from './AnimatedList';

describe('AnimatedList', () => {
  it('renders list items correctly', () => {
    render(
      <AnimatedList>
        <AnimatedList.Item>Item 1</AnimatedList.Item>
        <AnimatedList.Item>Item 2</AnimatedList.Item>
        <AnimatedList.Item>Item 3</AnimatedList.Item>
      </AnimatedList>
    );

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
    expect(screen.getByText('Item 3')).toBeInTheDocument();
  });

  it('applies custom className to container', () => {
    const { container } = render(
      <AnimatedList className="custom-list">
        <AnimatedList.Item>Item</AnimatedList.Item>
      </AnimatedList>
    );

    const listElement = container.querySelector('.custom-list');
    expect(listElement).toBeInTheDocument();
  });

  it('applies custom className to items', () => {
    const { container } = render(
      <AnimatedList>
        <AnimatedList.Item className="custom-item">Item</AnimatedList.Item>
      </AnimatedList>
    );

    const itemElement = container.querySelector('.custom-item');
    expect(itemElement).toBeInTheDocument();
  });

  it('renders as different HTML elements', () => {
    const { container: ulContainer } = render(
      <AnimatedList as="ul" data-testid="ul-list">
        <AnimatedList.Item as="li">Item</AnimatedList.Item>
      </AnimatedList>
    );

    const { container: divContainer } = render(
      <AnimatedList as="div" data-testid="div-list">
        <AnimatedList.Item as="div">Item</AnimatedList.Item>
      </AnimatedList>
    );

    expect(ulContainer.querySelector('ul')).toBeInTheDocument();
    expect(divContainer.querySelector('div[data-testid="div-list"]')).toBeInTheDocument();
  });

  it('accepts preset prop', () => {
    render(
      <AnimatedList preset="quick">
        <AnimatedList.Item preset="quick">Item</AnimatedList.Item>
      </AnimatedList>
    );

    expect(screen.getByText('Item')).toBeInTheDocument();
  });
});
