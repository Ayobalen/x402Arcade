/**
 * Collision Detection Module
 *
 * This module provides collision detection utilities for 2D games,
 * including AABB (Axis-Aligned Bounding Box) collision detection,
 * circle collision, and collision response calculations.
 *
 * @module games/engine/collision
 */

import type { Vector2D, Bounds, CircleBounds, CollisionResult, Entity } from './types'

// ============================================================================
// AABB (Axis-Aligned Bounding Box) Collision
// ============================================================================

/**
 * AABB (Axis-Aligned Bounding Box) interface
 * Represents a rectangle that is aligned with the coordinate axes
 */
export interface AABB {
  /** Left edge X coordinate */
  x: number
  /** Top edge Y coordinate */
  y: number
  /** Width of the box */
  width: number
  /** Height of the box */
  height: number
}

/**
 * Check if two AABBs intersect
 *
 * Uses the separating axis theorem - if there's no gap between the boxes
 * on both the X and Y axes, they must be overlapping.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns true if the boxes intersect, false otherwise
 *
 * @example
 * ```ts
 * const box1 = { x: 0, y: 0, width: 50, height: 50 }
 * const box2 = { x: 25, y: 25, width: 50, height: 50 }
 * aabbIntersects(box1, box2) // true - boxes overlap
 *
 * const box3 = { x: 100, y: 100, width: 50, height: 50 }
 * aabbIntersects(box1, box3) // false - boxes don't touch
 * ```
 */
export function aabbIntersects(a: AABB, b: AABB): boolean {
  // Check for separation on X-axis
  // If A's right edge is left of B's left edge, or
  // if B's right edge is left of A's left edge, they don't overlap on X
  const xOverlap = a.x < b.x + b.width && a.x + a.width > b.x

  // Check for separation on Y-axis
  // If A's bottom edge is above B's top edge, or
  // if B's bottom edge is above A's top edge, they don't overlap on Y
  const yOverlap = a.y < b.y + b.height && a.y + a.height > b.y

  // Boxes intersect only if they overlap on both axes
  return xOverlap && yOverlap
}

/**
 * Calculate the overlap between two AABBs
 *
 * Returns the penetration depth on each axis. Useful for collision response.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns Object with x and y overlap amounts (0 if no overlap)
 */
export function aabbOverlap(a: AABB, b: AABB): Vector2D {
  // Calculate overlap on X-axis
  const xOverlapLeft = a.x + a.width - b.x
  const xOverlapRight = b.x + b.width - a.x
  const xOverlap = Math.min(xOverlapLeft, xOverlapRight)

  // Calculate overlap on Y-axis
  const yOverlapTop = a.y + a.height - b.y
  const yOverlapBottom = b.y + b.height - a.y
  const yOverlap = Math.min(yOverlapTop, yOverlapBottom)

  // If either overlap is negative, there's no collision
  if (xOverlap <= 0 || yOverlap <= 0) {
    return { x: 0, y: 0 }
  }

  return { x: xOverlap, y: yOverlap }
}

/**
 * Calculate the minimum translation vector (MTV) to separate two colliding AABBs
 *
 * The MTV is the smallest vector that, when applied to box A, will separate it from box B.
 * This is essential for collision response to prevent objects from overlapping.
 *
 * @param a - First bounding box (the one to be moved)
 * @param b - Second bounding box (stationary)
 * @returns The translation vector to apply to A, or null if no collision
 *
 * @example
 * ```ts
 * const player = { x: 45, y: 0, width: 10, height: 10 }
 * const wall = { x: 50, y: 0, width: 10, height: 100 }
 * const mtv = aabbMTV(player, wall)
 * if (mtv) {
 *   player.x += mtv.x // Push player out of wall
 *   player.y += mtv.y
 * }
 * ```
 */
export function aabbMTV(a: AABB, b: AABB): Vector2D | null {
  // Calculate the overlap on each axis
  const aRight = a.x + a.width
  const bRight = b.x + b.width
  const aBottom = a.y + a.height
  const bBottom = b.y + b.height

  // Check for separation (no collision)
  if (aRight <= b.x || a.x >= bRight || aBottom <= b.y || a.y >= bBottom) {
    return null
  }

  // Calculate penetration depth on each axis
  const leftPenetration = aRight - b.x
  const rightPenetration = bRight - a.x
  const topPenetration = aBottom - b.y
  const bottomPenetration = bBottom - a.y

  // Find minimum X penetration
  let xMTV: number
  if (leftPenetration < rightPenetration) {
    xMTV = -leftPenetration
  } else {
    xMTV = rightPenetration
  }

  // Find minimum Y penetration
  let yMTV: number
  if (topPenetration < bottomPenetration) {
    yMTV = -topPenetration
  } else {
    yMTV = bottomPenetration
  }

  // Return the axis with minimum penetration (smallest correction)
  if (Math.abs(xMTV) < Math.abs(yMTV)) {
    return { x: xMTV, y: 0 }
  } else {
    return { x: 0, y: yMTV }
  }
}

/**
 * Get the collision normal between two AABBs
 *
 * The normal points from A towards B, indicating the collision direction.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns Normalized vector pointing from A to B, or zero vector if no collision
 */
export function aabbCollisionNormal(a: AABB, b: AABB): Vector2D {
  const mtv = aabbMTV(a, b)
  if (!mtv) {
    return { x: 0, y: 0 }
  }

  // Normalize the MTV to get the collision normal
  const length = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y)
  if (length === 0) {
    return { x: 0, y: 0 }
  }

  // Invert to get normal pointing from A to B
  return {
    x: -mtv.x / length,
    y: -mtv.y / length,
  }
}

/**
 * Get the contact point between two colliding AABBs
 *
 * Approximates the contact point as the center of the overlap region.
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns The approximate contact point, or center of A if no collision
 */
export function aabbContactPoint(a: AABB, b: AABB): Vector2D {
  if (!aabbIntersects(a, b)) {
    return { x: a.x + a.width / 2, y: a.y + a.height / 2 }
  }

  // Find the overlap rectangle
  const overlapLeft = Math.max(a.x, b.x)
  const overlapRight = Math.min(a.x + a.width, b.x + b.width)
  const overlapTop = Math.max(a.y, b.y)
  const overlapBottom = Math.min(a.y + a.height, b.y + b.height)

  // Return center of overlap region
  return {
    x: (overlapLeft + overlapRight) / 2,
    y: (overlapTop + overlapBottom) / 2,
  }
}

/**
 * Check if a point is inside an AABB
 *
 * @param point - The point to check
 * @param box - The bounding box
 * @returns true if the point is inside the box
 */
export function pointInAABB(point: Vector2D, box: AABB): boolean {
  return (
    point.x >= box.x &&
    point.x <= box.x + box.width &&
    point.y >= box.y &&
    point.y <= box.y + box.height
  )
}

/**
 * Expand an AABB by a given amount in all directions
 *
 * Useful for creating buffer zones or checking near-collisions.
 *
 * @param box - The original bounding box
 * @param amount - Amount to expand (negative values shrink)
 * @returns New expanded AABB
 */
export function expandAABB(box: AABB, amount: number): AABB {
  return {
    x: box.x - amount,
    y: box.y - amount,
    width: box.width + amount * 2,
    height: box.height + amount * 2,
  }
}

// ============================================================================
// Circle Collision
// ============================================================================

/**
 * Check if two circles intersect
 *
 * @param a - First circle
 * @param b - Second circle
 * @returns true if the circles intersect
 */
export function circleIntersects(a: CircleBounds, b: CircleBounds): boolean {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distanceSquared = dx * dx + dy * dy
  const radiusSum = a.radius + b.radius
  return distanceSquared <= radiusSum * radiusSum
}

/**
 * Calculate penetration depth between two circles
 *
 * Returns the overlap distance - how deep one circle has penetrated into the other.
 * Returns 0 if circles don't overlap.
 *
 * @param a - First circle
 * @param b - Second circle
 * @returns Penetration depth (positive if overlapping, 0 otherwise)
 *
 * @example
 * ```ts
 * const ball1 = { x: 0, y: 0, radius: 10 }
 * const ball2 = { x: 15, y: 0, radius: 10 }
 * const depth = circlePenetrationDepth(ball1, ball2) // 5 (sum of radii 20, distance 15)
 * ```
 */
export function circlePenetrationDepth(a: CircleBounds, b: CircleBounds): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  const radiusSum = a.radius + b.radius
  const penetration = radiusSum - distance
  return penetration > 0 ? penetration : 0
}

/**
 * Get the collision normal between two circles
 *
 * Returns a normalized vector pointing from circle A to circle B.
 *
 * @param a - First circle
 * @param b - Second circle
 * @returns Normalized collision normal vector
 */
export function circleCollisionNormal(a: CircleBounds, b: CircleBounds): Vector2D {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // Handle overlapping centers
  if (distance === 0) {
    return { x: 1, y: 0 } // Default direction
  }

  return {
    x: dx / distance,
    y: dy / distance,
  }
}

/**
 * Calculate the minimum translation vector (MTV) to separate two circles
 *
 * @param a - First circle (the one to be moved)
 * @param b - Second circle (stationary)
 * @returns Translation vector to apply to A, or null if no collision
 */
export function circleMTV(a: CircleBounds, b: CircleBounds): Vector2D | null {
  const depth = circlePenetrationDepth(a, b)
  if (depth <= 0) {
    return null
  }

  const normal = circleCollisionNormal(a, b)
  return {
    x: -normal.x * depth,
    y: -normal.y * depth,
  }
}

/**
 * Check if a circle and AABB intersect
 *
 * @param circle - The circle
 * @param box - The bounding box
 * @returns true if they intersect
 */
export function circleAABBIntersects(circle: CircleBounds, box: AABB): boolean {
  // Find the closest point on the AABB to the circle center
  const closestX = Math.max(box.x, Math.min(circle.x, box.x + box.width))
  const closestY = Math.max(box.y, Math.min(circle.y, box.y + box.height))

  // Calculate distance from circle center to closest point
  const dx = circle.x - closestX
  const dy = circle.y - closestY
  const distanceSquared = dx * dx + dy * dy

  return distanceSquared <= circle.radius * circle.radius
}

/**
 * Check if a point is inside a circle
 *
 * @param point - The point to check
 * @param circle - The circle
 * @returns true if the point is inside the circle
 */
export function pointInCircle(point: Vector2D, circle: CircleBounds): boolean {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  const distanceSquared = dx * dx + dy * dy
  return distanceSquared <= circle.radius * circle.radius
}

// ============================================================================
// Line Collision
// ============================================================================

/**
 * Line segment represented by two points
 */
export interface LineSegment {
  /** Start point */
  start: Vector2D
  /** End point */
  end: Vector2D
}

/**
 * Check if two line segments intersect
 *
 * Uses the cross product method to determine intersection.
 *
 * @param line1 - First line segment
 * @param line2 - Second line segment
 * @returns true if the lines intersect
 */
export function lineIntersects(line1: LineSegment, line2: LineSegment): boolean {
  const { start: a, end: b } = line1
  const { start: c, end: d } = line2

  // Calculate direction vectors
  const d1x = b.x - a.x
  const d1y = b.y - a.y
  const d2x = d.x - c.x
  const d2y = d.y - c.y

  // Calculate cross products
  const cross = d1x * d2y - d1y * d2x

  // Lines are parallel if cross product is 0
  if (Math.abs(cross) < 0.0001) {
    return false
  }

  // Calculate parameters
  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / cross
  const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / cross

  // Lines intersect if both parameters are between 0 and 1
  return t >= 0 && t <= 1 && u >= 0 && u <= 1
}

/**
 * Get the intersection point of two line segments
 *
 * @param line1 - First line segment
 * @param line2 - Second line segment
 * @returns Intersection point, or null if lines don't intersect
 */
export function lineIntersectionPoint(
  line1: LineSegment,
  line2: LineSegment
): Vector2D | null {
  const { start: a, end: b } = line1
  const { start: c, end: d } = line2

  const d1x = b.x - a.x
  const d1y = b.y - a.y
  const d2x = d.x - c.x
  const d2y = d.y - c.y

  const cross = d1x * d2y - d1y * d2x

  if (Math.abs(cross) < 0.0001) {
    return null
  }

  const t = ((c.x - a.x) * d2y - (c.y - a.y) * d2x) / cross
  const u = ((c.x - a.x) * d1y - (c.y - a.y) * d1x) / cross

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: a.x + t * d1x,
      y: a.y + t * d1y,
    }
  }

  return null
}

/**
 * Check if a line segment intersects an AABB
 *
 * @param line - The line segment
 * @param box - The bounding box
 * @returns true if the line intersects the box
 */
export function lineAABBIntersects(line: LineSegment, box: AABB): boolean {
  // Check if either endpoint is inside the box
  if (pointInAABB(line.start, box) || pointInAABB(line.end, box)) {
    return true
  }

  // Check intersection with each edge of the box
  const topLeft = { x: box.x, y: box.y }
  const topRight = { x: box.x + box.width, y: box.y }
  const bottomLeft = { x: box.x, y: box.y + box.height }
  const bottomRight = { x: box.x + box.width, y: box.y + box.height }

  const edges: LineSegment[] = [
    { start: topLeft, end: topRight }, // Top
    { start: topRight, end: bottomRight }, // Right
    { start: bottomRight, end: bottomLeft }, // Bottom
    { start: bottomLeft, end: topLeft }, // Left
  ]

  return edges.some((edge) => lineIntersects(line, edge))
}

// ============================================================================
// Collision Response
// ============================================================================

/**
 * Collision response options
 */
export interface CollisionResponseOptions {
  /** Bounciness/restitution (0 = no bounce, 1 = perfect bounce) */
  restitution?: number
  /** Friction coefficient */
  friction?: number
}

/**
 * Calculate velocity after an elastic collision between two objects
 *
 * @param velocityA - Velocity of object A
 * @param velocityB - Velocity of object B
 * @param massA - Mass of object A
 * @param massB - Mass of object B
 * @param normal - Collision normal (from A to B)
 * @param restitution - Coefficient of restitution (0-1)
 * @returns New velocities for both objects
 */
export function calculateCollisionResponse(
  velocityA: Vector2D,
  velocityB: Vector2D,
  massA: number,
  massB: number,
  normal: Vector2D,
  restitution: number = 1
): { velocityA: Vector2D; velocityB: Vector2D } {
  // Calculate relative velocity
  const relativeVelocity = {
    x: velocityB.x - velocityA.x,
    y: velocityB.y - velocityA.y,
  }

  // Calculate relative velocity along the normal
  const velocityAlongNormal =
    relativeVelocity.x * normal.x + relativeVelocity.y * normal.y

  // Don't resolve if velocities are separating
  if (velocityAlongNormal > 0) {
    return { velocityA, velocityB }
  }

  // Calculate impulse scalar
  const impulseMagnitude =
    (-(1 + restitution) * velocityAlongNormal) / (1 / massA + 1 / massB)

  // Apply impulse
  const impulseX = impulseMagnitude * normal.x
  const impulseY = impulseMagnitude * normal.y

  return {
    velocityA: {
      x: velocityA.x - impulseX / massA,
      y: velocityA.y - impulseY / massA,
    },
    velocityB: {
      x: velocityB.x + impulseX / massB,
      y: velocityB.y + impulseY / massB,
    },
  }
}

/**
 * Calculate reflection velocity (for bouncing off walls)
 *
 * @param velocity - Incoming velocity
 * @param normal - Surface normal
 * @param restitution - Bounciness (0-1)
 * @returns Reflected velocity
 */
export function reflectVelocity(
  velocity: Vector2D,
  normal: Vector2D,
  restitution: number = 1
): Vector2D {
  // v' = v - (1 + e) * (v · n) * n
  const dot = velocity.x * normal.x + velocity.y * normal.y
  return {
    x: velocity.x - (1 + restitution) * dot * normal.x,
    y: velocity.y - (1 + restitution) * dot * normal.y,
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert a Bounds type to AABB (they're compatible)
 *
 * @param bounds - A Bounds object
 * @returns AABB representation
 */
export function boundsToAABB(bounds: Bounds): AABB {
  return bounds
}

/**
 * Create an AABB from center point and dimensions
 *
 * @param center - Center point of the box
 * @param width - Width of the box
 * @param height - Height of the box
 * @returns AABB with top-left corner at (center.x - width/2, center.y - height/2)
 */
export function createAABBFromCenter(
  center: Vector2D,
  width: number,
  height: number
): AABB {
  return {
    x: center.x - width / 2,
    y: center.y - height / 2,
    width,
    height,
  }
}

/**
 * Get the center point of an AABB
 *
 * @param box - The bounding box
 * @returns Center point
 */
export function getAABBCenter(box: AABB): Vector2D {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  }
}

/**
 * Check if box A completely contains box B
 *
 * @param container - The container box
 * @param contained - The box to check if contained
 * @returns true if container fully contains contained
 */
export function aabbContains(container: AABB, contained: AABB): boolean {
  return (
    container.x <= contained.x &&
    container.y <= contained.y &&
    container.x + container.width >= contained.x + contained.width &&
    container.y + container.height >= contained.y + contained.height
  )
}

/**
 * Merge two AABBs into a single AABB that contains both
 *
 * @param a - First bounding box
 * @param b - Second bounding box
 * @returns AABB that contains both input boxes
 */
export function mergeAABB(a: AABB, b: AABB): AABB {
  const minX = Math.min(a.x, b.x)
  const minY = Math.min(a.y, b.y)
  const maxX = Math.max(a.x + a.width, b.x + b.width)
  const maxY = Math.max(a.y + a.height, b.y + b.height)

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  }
}

/**
 * Calculate the area of an AABB
 *
 * @param box - The bounding box
 * @returns Area of the box
 */
export function aabbArea(box: AABB): number {
  return box.width * box.height
}

/**
 * Calculate the perimeter of an AABB
 *
 * @param box - The bounding box
 * @returns Perimeter of the box
 */
export function aabbPerimeter(box: AABB): number {
  return 2 * (box.width + box.height)
}

// ============================================================================
// Full Collision Result Builder
// ============================================================================

/**
 * Build a complete CollisionResult from two AABB collisions
 *
 * @param entityA - First entity
 * @param entityB - Second entity
 * @param boundsA - Bounds of entity A
 * @param boundsB - Bounds of entity B
 * @returns Complete collision result or null if no collision
 */
export function buildAABBCollisionResult(
  entityA: Entity,
  entityB: Entity,
  boundsA: AABB,
  boundsB: AABB
): CollisionResult | null {
  if (!aabbIntersects(boundsA, boundsB)) {
    return null
  }

  const mtv = aabbMTV(boundsA, boundsB)
  if (!mtv) {
    return null
  }

  const normal = aabbCollisionNormal(boundsA, boundsB)
  const contactPoint = aabbContactPoint(boundsA, boundsB)
  const depth = Math.sqrt(mtv.x * mtv.x + mtv.y * mtv.y)

  return {
    collided: true,
    entityA,
    entityB,
    normal,
    depth,
    contactPoint,
  }
}
