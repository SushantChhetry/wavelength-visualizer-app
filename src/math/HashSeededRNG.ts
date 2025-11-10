/**
 * Hash-seeded random number generator
 * Provides reproducible, music-dependent randomness
 * seed_{b,t} = hash(CQT_frame_b(t) || tempo || globalSeed)
 */

export class HashSeededRNG {
  private seed: number;

  constructor(seed: number = 0) {
    this.seed = seed;
  }

  /**
   * Simple hash function for combining values
   * Uses FNV-1a hash algorithm
   */
  static hash(...values: (number | string)[]): number {
    let hash = 2166136261; // FNV offset basis
    
    for (const value of values) {
      const str = value.toString();
      for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
    }
    
    return hash >>> 0; // Convert to unsigned 32-bit
  }

  /**
   * Generate seed from audio features
   */
  static generateSeed(
    cqtFrame: Float32Array,
    bandIndex: number,
    tempo: number,
    globalSeed: number = 0
  ): number {
    const bandValue = bandIndex < cqtFrame.length ? cqtFrame[bandIndex] : 0;
    return this.hash(bandValue, bandIndex, tempo, globalSeed);
  }

  /**
   * Set seed
   */
  setSeed(seed: number): void {
    this.seed = seed;
  }

  /**
   * Generate next random number in [0, 1)
   * Uses linear congruential generator
   */
  next(): number {
    // LCG parameters (from Numerical Recipes)
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return (this.seed >>> 0) / 0xFFFFFFFF;
  }

  /**
   * Generate random number in [min, max)
   */
  nextRange(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Generate Gaussian random number using Box-Muller transform
   */
  nextGaussian(mean: number = 0, stdDev: number = 1): number {
    // Box-Muller transform requires two uniform randoms
    const u1 = this.next();
    const u2 = this.next();
    
    // Avoid log(0)
    const z0 = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
    return z0 * stdDev + mean;
  }

  /**
   * Generate 3D Gaussian vector
   */
  nextGaussian3D(mean: [number, number, number] = [0, 0, 0], stdDev: number = 1): [number, number, number] {
    return [
      this.nextGaussian(mean[0], stdDev),
      this.nextGaussian(mean[1], stdDev),
      this.nextGaussian(mean[2], stdDev)
    ];
  }
}

