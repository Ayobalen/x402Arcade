/**
 * Collision Detection Tests
 *
 * Tests for AABB collision, circle collision, line collision,
 * and collision response calculations.
 */

import { describe, it, expect } from 'vitest';
import type { AABB } from '../collision';
import {
  aabbIntersects,
  aabbOverlap,
  aabbMTV,
  aabbCollisionNormal,
  aabbContactPoint,
  pointInAABB,
  expandAABB,
  circleIntersects,
  circlePenetrationDepth,
  circleCollisionNormal,
  circleMTV,
  circleAABBIntersects,
  pointInCircle,
  boundsToAABB,
  createAABBFromCenter,
  getAABBCenter,
  aabbContains,
  mergeAABB,
  aabbArea,
  aabbPerimeter,
} from '../collision';
import type { CircleBounds, Vector2D, Bounds } from '../types';

describe('Collision Detection', () => {
  describe('AABB Collision', () => {
    it('should detect intersecting AABBs', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 25, width: 50, height: 50 };

      expect(aabbIntersects(box1, box2)).toBe(true);
    });

    it('should detect non-intersecting AABBs', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 100, y: 100, width: 50, height: 50 };

      expect(aabbIntersects(box1, box2)).toBe(false);
    });

    it('should detect edge-touching AABBs as not intersecting', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 50, y: 0, width: 50, height: 50 };

      expect(aabbIntersects(box1, box2)).toBe(false);
    });

    it('should calculate AABB overlap correctly', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 25, width: 50, height: 50 };

      const overlap = aabbOverlap(box1, box2);

      expect(overlap.x).toBe(25);
      expect(overlap.y).toBe(25);
    });

    it('should return zero overlap for non-intersecting AABBs', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 100, y: 100, width: 50, height: 50 };

      const overlap = aabbOverlap(box1, box2);

      expect(overlap.x).toBe(0);
      expect(overlap.y).toBe(0);
    });

    it('should calculate MTV (Minimum Translation Vector)', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 40, width: 50, height: 50 };

      const mtv = aabbMTV(box1, box2);

      expect(mtv).not.toBeNull();
      // MTV should be on the axis with least penetration
      if (mtv) {
        expect(Math.abs(mtv.x) + Math.abs(mtv.y)).toBeGreaterThan(0);
      }
    });

    it('should return null MTV for non-intersecting AABBs', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 100, y: 100, width: 50, height: 50 };

      const mtv = aabbMTV(box1, box2);

      expect(mtv).toBeNull();
    });

    it('should calculate collision normal', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 40, width: 50, height: 50 };

      const normal = aabbCollisionNormal(box1, box2);

      // Normal should be normalized (length = 1)
      const length = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
      expect(length).toBeCloseTo(1, 5);
    });

    it('should calculate contact point', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 25, width: 50, height: 50 };

      const contact = aabbContactPoint(box1, box2);

      // Contact point should be within overlap area
      expect(contact.x).toBeGreaterThanOrEqual(25);
      expect(contact.x).toBeLessThanOrEqual(50);
      expect(contact.y).toBeGreaterThanOrEqual(25);
      expect(contact.y).toBeLessThanOrEqual(50);
    });

    it('should detect point inside AABB', () => {
      const box: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const point: Vector2D = { x: 25, y: 25 };

      expect(pointInAABB(point, box)).toBe(true);
    });

    it('should detect point outside AABB', () => {
      const box: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const point: Vector2D = { x: 100, y: 100 };

      expect(pointInAABB(point, box)).toBe(false);
    });

    it('should expand AABB correctly', () => {
      const box: AABB = { x: 10, y: 10, width: 50, height: 50 };
      const expanded = expandAABB(box, 10);

      expect(expanded.x).toBe(0);
      expect(expanded.y).toBe(0);
      expect(expanded.width).toBe(70);
      expect(expanded.height).toBe(70);
    });

    it('should detect when AABB contains another AABB', () => {
      const container: AABB = { x: 0, y: 0, width: 100, height: 100 };
      const contained: AABB = { x: 10, y: 10, width: 50, height: 50 };

      expect(aabbContains(container, contained)).toBe(true);
    });

    it('should detect when AABB does not contain another AABB', () => {
      const container: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const contained: AABB = { x: 10, y: 10, width: 100, height: 100 };

      expect(aabbContains(container, contained)).toBe(false);
    });

    it('should merge two AABBs correctly', () => {
      const box1: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const box2: AABB = { x: 25, y: 25, width: 50, height: 50 };

      const merged = mergeAABB(box1, box2);

      expect(merged.x).toBe(0);
      expect(merged.y).toBe(0);
      expect(merged.width).toBe(75);
      expect(merged.height).toBe(75);
    });

    it('should calculate AABB area correctly', () => {
      const box: AABB = { x: 0, y: 0, width: 50, height: 40 };

      expect(aabbArea(box)).toBe(2000);
    });

    it('should calculate AABB perimeter correctly', () => {
      const box: AABB = { x: 0, y: 0, width: 50, height: 40 };

      expect(aabbPerimeter(box)).toBe(180);
    });

    it('should get AABB center correctly', () => {
      const box: AABB = { x: 0, y: 0, width: 50, height: 50 };
      const center = getAABBCenter(box);

      expect(center.x).toBe(25);
      expect(center.y).toBe(25);
    });

    it('should create AABB from center', () => {
      const center: Vector2D = { x: 50, y: 50 };
      const box = createAABBFromCenter(center, 40, 30);

      expect(box.x).toBe(30);
      expect(box.y).toBe(35);
      expect(box.width).toBe(40);
      expect(box.height).toBe(30);
    });
  });

  describe('Circle Collision', () => {
    it('should detect intersecting circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 30, y: 0, radius: 25 };

      expect(circleIntersects(circle1, circle2)).toBe(true);
    });

    it('should detect non-intersecting circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 100, y: 100, radius: 25 };

      expect(circleIntersects(circle1, circle2)).toBe(false);
    });

    it('should detect edge-touching circles as intersecting', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 50, y: 0, radius: 25 };

      expect(circleIntersects(circle1, circle2)).toBe(true);
    });

    it('should calculate penetration depth correctly', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 30, y: 0, radius: 25 };

      const depth = circlePenetrationDepth(circle1, circle2);

      expect(depth).toBeCloseTo(20, 1);
    });

    it('should return 0 penetration for non-intersecting circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 100, y: 0, radius: 25 };

      const depth = circlePenetrationDepth(circle1, circle2);

      expect(depth).toBe(0);
    });

    it('should calculate collision normal for circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 30, y: 0, radius: 25 };

      const normal = circleCollisionNormal(circle1, circle2);

      // Normal should point from circle1 to circle2
      expect(normal.x).toBeCloseTo(1, 1);
      expect(normal.y).toBeCloseTo(0, 1);
    });

    it('should calculate MTV for circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 30, y: 0, radius: 25 };

      const mtv = circleMTV(circle1, circle2);

      expect(mtv).not.toBeNull();
      if (mtv) {
        // MTV should push circles apart
        expect(Math.abs(mtv.x)).toBeGreaterThan(0);
      }
    });

    it('should return null MTV for non-intersecting circles', () => {
      const circle1: CircleBounds = { x: 0, y: 0, radius: 25 };
      const circle2: CircleBounds = { x: 100, y: 100, radius: 25 };

      const mtv = circleMTV(circle1, circle2);

      expect(mtv).toBeNull();
    });

    it('should detect circle-AABB intersection', () => {
      const circle: CircleBounds = { x: 25, y: 25, radius: 15 };
      const box: AABB = { x: 0, y: 0, width: 50, height: 50 };

      expect(circleAABBIntersects(circle, box)).toBe(true);
    });

    it('should detect non-intersecting circle and AABB', () => {
      const circle: CircleBounds = { x: 100, y: 100, radius: 15 };
      const box: AABB = { x: 0, y: 0, width: 50, height: 50 };

      expect(circleAABBIntersects(circle, box)).toBe(false);
    });

    it('should detect point inside circle', () => {
      const circle: CircleBounds = { x: 50, y: 50, radius: 25 };
      const point: Vector2D = { x: 55, y: 55 };

      expect(pointInCircle(point, circle)).toBe(true);
    });

    it('should detect point outside circle', () => {
      const circle: CircleBounds = { x: 50, y: 50, radius: 25 };
      const point: Vector2D = { x: 100, y: 100 };

      expect(pointInCircle(point, circle)).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    it('should convert Bounds to AABB', () => {
      const bounds: Bounds = { left: 0, top: 0, right: 50, bottom: 50 };
      const aabb = boundsToAABB(bounds);

      expect(aabb.x).toBe(0);
      expect(aabb.y).toBe(0);
      expect(aabb.width).toBe(50);
      expect(aabb.height).toBe(50);
    });
  });
});
