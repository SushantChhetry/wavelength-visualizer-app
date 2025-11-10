/**
 * 3D Curl noise field
 * v(x,t) = ∇ × N(x,t) where N is a 3D noise field
 * Divergence-free flow field for elegant streamlines
 */

export class CurlNoiseField {
  private time: number = 0;
  private baseFrequency: number = 1.0;
  private timeWarp: number = 0;

  /**
   * Update time and modulation parameters
   */
  update(time: number, flowFrequency: number = 1.0, tempoStrength: number = 0): void {
    this.time = time;
    this.baseFrequency = flowFrequency;
    // Time warp: τ(t) = ∫(1 + c_2 · tempo_strength(s))ds
    // Simplified: accumulate tempo strength
    this.timeWarp += tempoStrength * 0.01;
  }

  /**
   * Compute 3D noise value at position
   * Uses multiple octaves of Perlin-like noise
   */
  private noise3D(x: number, y: number, z: number, time: number): number {
    // Multi-octave noise for richer patterns
    let value = 0;
    let amplitude = 1.0;
    let frequency = this.baseFrequency;
    let maxValue = 0;

    for (let octave = 0; octave < 3; octave++) {
      const nx = x * frequency + time * 0.1;
      const ny = y * frequency + time * 0.15;
      const nz = z * frequency + time * 0.2;

      // Simple 3D noise using sine waves (can be replaced with proper Perlin)
      const n = Math.sin(nx * 12.9898 + ny * 78.233 + nz * 37.719) * 43758.5453;
      const normalized = (n - Math.floor(n)) * 2 - 1; // [-1, 1]

      value += normalized * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value / maxValue;
  }

  /**
   * Compute curl of noise field: v = ∇ × N
   * Returns divergence-free vector field
   */
  evaluate(x: number, y: number, z: number): [number, number, number] {
    const epsilon = 0.001;
    const t = this.time + this.timeWarp;

    // Curl: ∇ × N = (∂N_z/∂y - ∂N_y/∂z, ∂N_x/∂z - ∂N_z/∂x, ∂N_y/∂x - ∂N_x/∂y)
    // For scalar noise, we need vector noise. Use three independent noise fields.
    // Compute curl of vector field (n1, n2, n3)
    const dN1_dy = (this.noise3D(x, y + epsilon, z, t) - this.noise3D(x, y - epsilon, z, t)) / (2 * epsilon);
    const dN1_dz = (this.noise3D(x, y, z + epsilon, t) - this.noise3D(x, y, z - epsilon, t)) / (2 * epsilon);
    
    const dN2_dx = (this.noise3D(x + epsilon, y + 100, z + 100, t) - this.noise3D(x - epsilon, y + 100, z + 100, t)) / (2 * epsilon);
    const dN2_dz = (this.noise3D(x + 100, y + 100, z + epsilon + 100, t) - this.noise3D(x + 100, y + 100, z - epsilon + 100, t)) / (2 * epsilon);
    
    const dN3_dx = (this.noise3D(x + epsilon + 200, y + 200, z + 200, t) - this.noise3D(x - epsilon + 200, y + 200, z + 200, t)) / (2 * epsilon);
    const dN3_dy = (this.noise3D(x + 200, y + epsilon + 200, z + 200, t) - this.noise3D(x + 200, y - epsilon + 200, z + 200, t)) / (2 * epsilon);

    // Curl: (∂N3/∂y - ∂N2/∂z, ∂N1/∂z - ∂N3/∂x, ∂N2/∂x - ∂N1/∂y)
    return [
      dN3_dy - dN2_dz,
      dN1_dz - dN3_dx,
      dN2_dx - dN1_dy
    ];
  }

  /**
   * Apply anisotropy matrix for band-specific stretching
   */
  evaluateWithAnisotropy(
    x: number,
    y: number,
    z: number,
    anisotropy: [number, number, number] = [1, 1, 1]
  ): [number, number, number] {
    // Transform position by anisotropy
    const tx = x * anisotropy[0];
    const ty = y * anisotropy[1];
    const tz = z * anisotropy[2];

    const flow = this.evaluate(tx, ty, tz);

    // Scale back by inverse anisotropy
    return [
      flow[0] / anisotropy[0],
      flow[1] / anisotropy[1],
      flow[2] / anisotropy[2]
    ];
  }
}

