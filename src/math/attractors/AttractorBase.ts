/**
 * Base class for chaotic attractors
 * Provides common interface for different attractor types
 */

export interface AttractorState {
  x: number;
  y: number;
  z: number;
}

export abstract class AttractorBase {
  protected state: AttractorState;
  protected dt: number;

  constructor(initialState: AttractorState = { x: 0, y: 0, z: 0 }, dt: number = 0.01) {
    this.state = { ...initialState };
    this.dt = dt;
  }

  /**
   * Step the attractor forward one time step
   * Returns the new state
   */
  abstract step(params: Record<string, number>): AttractorState;

  /**
   * Get current state
   */
  getState(): AttractorState {
    return { ...this.state };
  }

  /**
   * Set state
   */
  setState(state: AttractorState): void {
    this.state = { ...state };
  }

  /**
   * Get drift vector (dx/dt, dy/dt, dz/dt)
   * Used for mixing with other engines
   */
  abstract getDrift(params: Record<string, number>): [number, number, number];

  /**
   * Set time step
   */
  setDt(dt: number): void {
    this.dt = dt;
  }
}

