/**
 * Lorenz attractor: classic 3D chaotic system
 * dx/dt = σ(y - x)
 * dy/dt = x(ρ - z) - y
 * dz/dt = xy - βz
 */

import { AttractorBase, type AttractorState } from './AttractorBase';

export type { AttractorState };

export interface LorenzParams {
  sigma: number; // σ: typically 10
  rho: number; // ρ: typically 28
  beta: number; // β: typically 8/3
}

export class LorenzAttractor extends AttractorBase {
  private params: LorenzParams;

  constructor(
    initialState: AttractorState = { x: 1, y: 1, z: 1 },
    params: LorenzParams = { sigma: 10, rho: 28, beta: 8/3 },
    dt: number = 0.01
  ) {
    super(initialState, dt);
    this.params = { ...params };
  }

  /**
   * Step the Lorenz system forward
   */
  step(params?: Partial<LorenzParams>): AttractorState {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const { x, y, z } = this.state;
    const { sigma, rho, beta } = this.params;

    // Euler integration
    const dx = sigma * (y - x);
    const dy = x * (rho - z) - y;
    const dz = x * y - beta * z;

    this.state.x += dx * this.dt;
    this.state.y += dy * this.dt;
    this.state.z += dz * this.dt;

    return this.getState();
  }

  /**
   * Get drift vector for mixing with other engines
   */
  getDrift(params?: Partial<LorenzParams>): [number, number, number] {
    if (params) {
      this.params = { ...this.params, ...params };
    }

    const { x, y, z } = this.state;
    const { sigma, rho, beta } = this.params;

    return [
      sigma * (y - x),
      x * (rho - z) - y,
      x * y - beta * z
    ];
  }

  /**
   * Update parameters
   */
  setParams(params: Partial<LorenzParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Get current parameters
   */
  getParams(): LorenzParams {
    return { ...this.params };
  }
}

