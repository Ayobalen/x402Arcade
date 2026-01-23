/**
 * JSDOM Environment Verification Tests
 *
 * These tests verify that the jsdom environment is properly configured
 * and all browser API mocks are working correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('jsdom Environment Configuration', () => {
  describe('Document APIs', () => {
    it('document is defined', () => {
      expect(document).toBeDefined();
    });

    it('can create DOM elements', () => {
      const div = document.createElement('div');
      div.textContent = 'Test content';
      expect(div.tagName).toBe('DIV');
      expect(div.textContent).toBe('Test content');
    });

    it('can query DOM elements', () => {
      const div = document.createElement('div');
      div.id = 'test-element';
      div.className = 'test-class';
      document.body.appendChild(div);

      expect(document.getElementById('test-element')).toBe(div);
      expect(document.querySelector('.test-class')).toBe(div);
      expect(document.querySelectorAll('.test-class')).toHaveLength(1);

      document.body.removeChild(div);
    });

    it('can handle element attributes', () => {
      const input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('data-testid', 'test-input');

      expect(input.getAttribute('type')).toBe('text');
      expect(input.dataset.testid).toBe('test-input');
    });

    it('can handle class manipulation', () => {
      const div = document.createElement('div');
      div.classList.add('class-a', 'class-b');

      expect(div.classList.contains('class-a')).toBe(true);
      expect(div.classList.contains('class-b')).toBe(true);

      div.classList.remove('class-a');
      expect(div.classList.contains('class-a')).toBe(false);

      div.classList.toggle('class-c');
      expect(div.classList.contains('class-c')).toBe(true);
    });
  });

  describe('Window APIs', () => {
    it('window is defined', () => {
      expect(window).toBeDefined();
    });

    it('window.location is available', () => {
      expect(window.location).toBeDefined();
      expect(typeof window.location.href).toBe('string');
    });

    it('window.history is available', () => {
      expect(window.history).toBeDefined();
      expect(typeof window.history.pushState).toBe('function');
    });

    it('window.navigator is available', () => {
      expect(window.navigator).toBeDefined();
      expect(window.navigator.userAgent).toBeDefined();
    });
  });

  describe('matchMedia Mock', () => {
    it('window.matchMedia is mocked', () => {
      expect(window.matchMedia).toBeDefined();
      expect(typeof window.matchMedia).toBe('function');
    });

    it('matchMedia returns a MediaQueryList-like object', () => {
      const result = window.matchMedia('(min-width: 768px)');

      expect(result.matches).toBeDefined();
      expect(result.media).toBe('(min-width: 768px)');
      expect(typeof result.addEventListener).toBe('function');
      expect(typeof result.removeEventListener).toBe('function');
    });

    it('matchMedia can be called multiple times', () => {
      const mobile = window.matchMedia('(max-width: 767px)');
      const tablet = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
      const desktop = window.matchMedia('(min-width: 1024px)');

      expect(mobile.media).toBe('(max-width: 767px)');
      expect(tablet.media).toBe('(min-width: 768px) and (max-width: 1023px)');
      expect(desktop.media).toBe('(min-width: 1024px)');
    });
  });

  describe('ResizeObserver Mock', () => {
    it('ResizeObserver is mocked', () => {
      expect(ResizeObserver).toBeDefined();
    });

    it('ResizeObserver can be instantiated', () => {
      const callback = vi.fn();
      const observer = new ResizeObserver(callback);

      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.unobserve).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('ResizeObserver methods can be called', () => {
      const callback = vi.fn();
      const observer = new ResizeObserver(callback);
      const element = document.createElement('div');

      // Should not throw
      expect(() => observer.observe(element)).not.toThrow();
      expect(() => observer.unobserve(element)).not.toThrow();
      expect(() => observer.disconnect()).not.toThrow();
    });
  });

  describe('IntersectionObserver Mock', () => {
    it('IntersectionObserver is mocked', () => {
      expect(IntersectionObserver).toBeDefined();
    });

    it('IntersectionObserver can be instantiated', () => {
      const callback = vi.fn();
      const observer = new IntersectionObserver(callback);

      expect(observer).toBeDefined();
      expect(typeof observer.observe).toBe('function');
      expect(typeof observer.unobserve).toBe('function');
      expect(typeof observer.disconnect).toBe('function');
    });

    it('IntersectionObserver methods can be called', () => {
      const callback = vi.fn();
      const observer = new IntersectionObserver(callback);
      const element = document.createElement('div');

      // Should not throw
      expect(() => observer.observe(element)).not.toThrow();
      expect(() => observer.unobserve(element)).not.toThrow();
      expect(() => observer.disconnect()).not.toThrow();
    });
  });

  describe('localStorage Mock', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('localStorage is available', () => {
      expect(localStorage).toBeDefined();
    });

    it('can set and get items', () => {
      localStorage.setItem('testKey', 'testValue');
      expect(localStorage.getItem('testKey')).toBe('testValue');
    });

    it('returns null for non-existent keys', () => {
      expect(localStorage.getItem('nonexistent')).toBeNull();
    });

    it('can remove items', () => {
      localStorage.setItem('toRemove', 'value');
      localStorage.removeItem('toRemove');
      expect(localStorage.getItem('toRemove')).toBeNull();
    });

    it('can clear all items', () => {
      localStorage.setItem('key1', 'value1');
      localStorage.setItem('key2', 'value2');
      localStorage.clear();
      expect(localStorage.getItem('key1')).toBeNull();
      expect(localStorage.getItem('key2')).toBeNull();
    });

    it('tracks length correctly', () => {
      expect(localStorage.length).toBe(0);
      localStorage.setItem('key1', 'value1');
      expect(localStorage.length).toBe(1);
      localStorage.setItem('key2', 'value2');
      expect(localStorage.length).toBe(2);
    });

    it('key() method works', () => {
      localStorage.setItem('alpha', 'a');
      localStorage.setItem('beta', 'b');
      // Order may vary, just check both keys are accessible
      const keys = [localStorage.key(0), localStorage.key(1)];
      expect(keys).toContain('alpha');
      expect(keys).toContain('beta');
    });
  });

  describe('sessionStorage Mock', () => {
    beforeEach(() => {
      sessionStorage.clear();
    });

    it('sessionStorage is available', () => {
      expect(sessionStorage).toBeDefined();
    });

    it('can set and get items', () => {
      sessionStorage.setItem('sessionKey', 'sessionValue');
      expect(sessionStorage.getItem('sessionKey')).toBe('sessionValue');
    });

    it('sessionStorage is separate from localStorage', () => {
      localStorage.setItem('shared', 'local');
      sessionStorage.setItem('shared', 'session');

      expect(localStorage.getItem('shared')).toBe('local');
      expect(sessionStorage.getItem('shared')).toBe('session');
    });
  });

  describe('requestAnimationFrame Mock', () => {
    it('requestAnimationFrame is mocked', () => {
      expect(requestAnimationFrame).toBeDefined();
      expect(typeof requestAnimationFrame).toBe('function');
    });

    it('requestAnimationFrame calls callback', async () => {
      const callback = vi.fn();
      requestAnimationFrame(callback);

      // Wait for the setTimeout(callback, 0) to complete
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalled();
    });

    it('cancelAnimationFrame is mocked', () => {
      expect(cancelAnimationFrame).toBeDefined();
      expect(typeof cancelAnimationFrame).toBe('function');
    });
  });

  describe('scrollTo Mock', () => {
    it('window.scrollTo is mocked', () => {
      expect(window.scrollTo).toBeDefined();
      expect(typeof window.scrollTo).toBe('function');
    });

    it('scrollTo can be called without throwing', () => {
      expect(() => window.scrollTo(0, 0)).not.toThrow();
      expect(() => window.scrollTo({ top: 100, left: 0, behavior: 'smooth' })).not.toThrow();
    });
  });

  describe('Event Handling', () => {
    it('can dispatch and listen to events', () => {
      const handler = vi.fn();
      const element = document.createElement('button');

      element.addEventListener('click', handler);
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(handler).toHaveBeenCalled();
    });

    it('can handle custom events', () => {
      const handler = vi.fn();
      const element = document.createElement('div');

      element.addEventListener('custom-event', handler);
      element.dispatchEvent(new CustomEvent('custom-event', { detail: { data: 'test' } }));

      expect(handler).toHaveBeenCalled();
    });
  });
});
