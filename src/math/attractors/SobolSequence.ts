/**
 * Sobol sequence generator for low-discrepancy sampling
 * Ensures unique initial conditions per band to prevent overlap
 */

export class SobolSequence {
  private dimension: number;
  private maxBits: number = 30;
  private directionNumbers: number[][];
  private currentIndex: number[];

  constructor(dimension: number = 3) {
    this.dimension = dimension;
    this.directionNumbers = [];
    this.currentIndex = new Array(dimension).fill(0);
    this.initDirectionNumbers();
  }

  /**
   * Initialize direction numbers for Sobol sequence
   * Uses primitive polynomials for each dimension
   */
  private initDirectionNumbers(): void {
    // Primitive polynomials for dimensions 1-3
    const polynomials = [
      [1], // x + 1
      [1, 1], // x^2 + x + 1
      [1, 0, 1] // x^3 + x + 1
    ];

    for (let d = 0; d < this.dimension; d++) {
      const poly = polynomials[d] || [1];
      const dirs: number[] = [];
      
      // Initialize first few direction numbers
      for (let i = 0; i < poly.length; i++) {
        dirs.push(1 << (this.maxBits - 1 - i));
      }
      
      // Generate remaining direction numbers
      for (let i = poly.length; i < this.maxBits; i++) {
        let dir = dirs[i - poly.length];
        for (let j = 1; j < poly.length; j++) {
          if (poly[j] === 1) {
            dir ^= dirs[i - poly.length + j] >> j;
          }
        }
        dirs.push(dir);
      }
      
      this.directionNumbers.push(dirs);
    }
  }

  /**
   * Get next Sobol point in [0, 1]^dimension
   */
  next(): number[] {
    const point: number[] = [];
    
    for (let d = 0; d < this.dimension; d++) {
      let value = 0;
      let index = this.currentIndex[d];
      
      // Gray code: find rightmost zero bit
      let gray = index ^ (index >> 1);
      
      // Compute Sobol value
      for (let i = 0; i < this.maxBits; i++) {
        if ((gray >> i) & 1) {
          value ^= this.directionNumbers[d][i];
        }
      }
      
      point.push(value / (1 << this.maxBits));
      this.currentIndex[d]++;
    }
    
    return point;
  }

  /**
   * Get Sobol point at specific index (without advancing)
   */
  get(index: number): number[] {
    const saved = [...this.currentIndex];
    this.currentIndex = new Array(this.dimension).fill(index);
    const point = this.next();
    this.currentIndex = saved;
    return point;
  }

  /**
   * Reset sequence
   */
  reset(): void {
    this.currentIndex.fill(0);
  }

  /**
   * Map Sobol point to 3D space in a cube
   */
  mapToCube(point: number[], center: [number, number, number] = [0, 0, 0], size: number = 2): [number, number, number] {
    return [
      center[0] + (point[0] - 0.5) * size,
      center[1] + (point[1] - 0.5) * size,
      center[2] + (point[2] - 0.5) * size
    ];
  }
}

