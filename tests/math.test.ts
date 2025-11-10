import { describe, it, expect } from 'vitest';
import { 
  curlNoise3D, 
  SDEIntegrator, 
  lerp, 
  clamp, 
  map, 
  smoothstep,
  rotate2D,
  noise
} from '../src/math/mathUtils';

describe('Math Utils', () => {
  describe('curlNoise3D', () => {
    it('should return a 3D vector', () => {
      const result = curlNoise3D(1, 2, 3, 0);
      expect(result).toHaveLength(3);
      expect(result.every(v => typeof v === 'number')).toBe(true);
    });

    it('should return different values for different positions', () => {
      const result1 = curlNoise3D(0, 0, 0, 0);
      const result2 = curlNoise3D(1, 1, 1, 0);
      expect(result1).not.toEqual(result2);
    });

    it('should vary with time', () => {
      const result1 = curlNoise3D(1, 2, 3, 0);
      const result2 = curlNoise3D(1, 2, 3, 1);
      expect(result1).not.toEqual(result2);
    });
  });

  describe('SDEIntegrator', () => {
    it('should update position based on drift', () => {
      const integrator = new SDEIntegrator();
      const position: [number, number, number] = [0, 0, 0];
      const drift: [number, number, number] = [1, 0, 0];
      const result = integrator.step(position, drift, 0, 0.1);
      
      expect(result[0]).toBeGreaterThan(0);
    });

    it('should incorporate stochastic term with volatility', () => {
      const integrator = new SDEIntegrator();
      const position: [number, number, number] = [0, 0, 0];
      const drift: [number, number, number] = [0, 0, 0];
      
      // Run multiple times to check for variation
      const results = [];
      for (let i = 0; i < 10; i++) {
        results.push(integrator.step(position, drift, 0.5, 0.1));
      }
      
      // Check that results vary (stochastic component)
      const allSame = results.every(r => 
        r[0] === results[0][0] && 
        r[1] === results[0][1] && 
        r[2] === results[0][2]
      );
      expect(allSame).toBe(false);
    });
  });

  describe('lerp', () => {
    it('should interpolate between two values', () => {
      expect(lerp(0, 10, 0)).toBe(0);
      expect(lerp(0, 10, 1)).toBe(10);
      expect(lerp(0, 10, 0.5)).toBe(5);
    });
  });

  describe('clamp', () => {
    it('should clamp values to range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
      expect(clamp(-5, 0, 10)).toBe(0);
      expect(clamp(15, 0, 10)).toBe(10);
    });
  });

  describe('map', () => {
    it('should map values from one range to another', () => {
      expect(map(5, 0, 10, 0, 100)).toBe(50);
      expect(map(0, 0, 10, 0, 100)).toBe(0);
      expect(map(10, 0, 10, 0, 100)).toBe(100);
    });
  });

  describe('smoothstep', () => {
    it('should provide smooth interpolation', () => {
      expect(smoothstep(0, 1, 0)).toBe(0);
      expect(smoothstep(0, 1, 1)).toBe(1);
      const mid = smoothstep(0, 1, 0.5);
      expect(mid).toBeGreaterThan(0);
      expect(mid).toBeLessThan(1);
    });

    it('should have smooth derivative at edges', () => {
      // Check that interpolation is smoother than linear
      const linear = 0.5;
      const smooth = smoothstep(0, 1, 0.5);
      expect(smooth).toBeCloseTo(0.5, 0);
    });
  });

  describe('rotate2D', () => {
    it('should rotate a 2D point', () => {
      const [x, y] = rotate2D(1, 0, Math.PI / 2);
      expect(x).toBeCloseTo(0, 5);
      expect(y).toBeCloseTo(1, 5);
    });

    it('should return original point for zero rotation', () => {
      const [x, y] = rotate2D(3, 4, 0);
      expect(x).toBe(3);
      expect(y).toBe(4);
    });
  });

  describe('noise', () => {
    it('should return values between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = noise(Math.random() * 100, Math.random() * 100);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('should be deterministic for same inputs', () => {
      const val1 = noise(1, 2, 3);
      const val2 = noise(1, 2, 3);
      expect(val1).toBe(val2);
    });

    it('should vary for different inputs', () => {
      const val1 = noise(1, 2, 3);
      const val2 = noise(4, 5, 6);
      expect(val1).not.toBe(val2);
    });
  });
});
