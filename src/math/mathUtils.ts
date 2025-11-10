/**
 * Mathematical utilities for signal processing and transformations
 */

import { HashSeededRNG } from './HashSeededRNG';

/**
 * Generate 3D curl noise using gradient of potential function
 */
export function curlNoise3D(x: number, y: number, z: number, time: number): [number, number, number] {
  const epsilon = 0.001;
  
  // Compute potential function gradients
  const dx = (potential(x + epsilon, y, z, time) - potential(x - epsilon, y, z, time)) / (2 * epsilon);
  const dy = (potential(x, y + epsilon, z, time) - potential(x, y - epsilon, z, time)) / (2 * epsilon);
  const dz = (potential(x, y, z + epsilon, time) - potential(x, y, z - epsilon, time)) / (2 * epsilon);
  
  // Curl: ∇ × F
  return [
    dy - dz,
    dz - dx,
    dx - dy
  ];
}

/**
 * Potential function for curl noise
 */
function potential(x: number, y: number, z: number, time: number): number {
  return Math.sin(x * 2 + time * 0.5) * Math.cos(y * 2 + time * 0.3) * Math.sin(z * 2 + time * 0.4);
}

/**
 * Stochastic Differential Equation (SDE) integration
 * dx = μ(x,t)dt + σ(x,t)dW where dW is Brownian motion
 * Enhanced with hash-seeded RNG for reproducible randomness
 */
export class SDEIntegrator {
  private rng: HashSeededRNG;

  constructor(seed: number = 0) {
    this.rng = new HashSeededRNG(seed);
  }

  /**
   * Set seed for reproducible randomness
   */
  setSeed(seed: number): void {
    this.rng.setSeed(seed);
  }

  /**
   * Euler-Maruyama method for SDE integration
   * @param position - Current position [x, y, z]
   * @param drift - Drift vector μ(x,t)
   * @param volatility - Diffusion coefficient σ(x,t) - can be audio-modulated
   * @param dt - Time step
   * @param seed - Optional seed override for this step
   */
  step(
    position: [number, number, number],
    drift: [number, number, number],
    volatility: number,
    dt: number,
    seed?: number
  ): [number, number, number] {
    // Use provided seed or current seed
    if (seed !== undefined) {
      this.rng.setSeed(seed);
    }

    // Generate Brownian increments using hash-seeded Gaussian
    const dW = this.rng.nextGaussian3D([0, 0, 0], 1);
    
    // Scale by sqrt(dt) for proper Brownian motion scaling
    const sqrtDt = Math.sqrt(dt);
    const scaledNoise: [number, number, number] = [
      dW[0] * sqrtDt,
      dW[1] * sqrtDt,
      dW[2] * sqrtDt
    ];

    // Euler-Maruyama: X_{n+1} = X_n + μ(X_n, t_n)Δt + σ(X_n, t_n)ΔW_n
    return [
      position[0] + drift[0] * dt + volatility * scaledNoise[0],
      position[1] + drift[1] * dt + volatility * scaledNoise[1],
      position[2] + drift[2] * dt + volatility * scaledNoise[2]
    ];
  }
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Map value from one range to another
 */
export function map(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  return outMin + (outMax - outMin) * ((value - inMin) / (inMax - inMin));
}

/**
 * Smoothstep interpolation
 */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * 2D rotation matrix
 */
export function rotate2D(x: number, y: number, angle: number): [number, number] {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return [
    x * cos - y * sin,
    x * sin + y * cos
  ];
}

/**
 * Perlin-like noise function (simplified)
 */
export function noise(x: number, y: number = 0, z: number = 0): number {
  // Simple pseudo-random noise based on position
  const seed = Math.sin(x * 12.9898 + y * 78.233 + z * 37.719) * 43758.5453;
  return seed - Math.floor(seed);
}
