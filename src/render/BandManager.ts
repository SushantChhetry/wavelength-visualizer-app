/**
 * Band Manager: Orchestrates 24-36 independent bands
 * Manages unique seeds, initial conditions, and band personalities
 */

import { SobolSequence } from '../math/attractors/SobolSequence';
import { LorenzAttractor, type AttractorState } from '../math/attractors/LorenzAttractor';
import type { VisualParameters } from '../math/ParameterMapper';

export interface BandState {
  bandIndex: number;
  position: [number, number, number];
  attractor: LorenzAttractor;
  initialPosition: [number, number, number];
  parameters: VisualParameters;
  instancesPerBand: number;
}

export class BandManager {
  private bands: BandState[] = [];
  private numBands: number;
  private instancesPerBand: number;
  private sobol: SobolSequence;

  constructor(numBands: number = 36, instancesPerBand: number = 20) {
    this.numBands = numBands;
    this.instancesPerBand = instancesPerBand;
    this.sobol = new SobolSequence(3);
    this.initializeBands();
  }

  /**
   * Initialize all bands with unique initial conditions
   */
  private initializeBands(): void {
    this.bands = [];

    for (let b = 0; b < this.numBands; b++) {
      // Get unique initial position from Sobol sequence
      const sobolPoint = this.sobol.next();
      const initialPos = this.sobol.mapToCube(sobolPoint, [0, 0, 0], 2);

      // Create Lorenz attractor with initial state
      const initialState: AttractorState = {
        x: initialPos[0],
        y: initialPos[1],
        z: initialPos[2]
      };

      const attractor = new LorenzAttractor(initialState);

      // Band personality: low bands → slower/thicker, high bands → faster/thinner
      const bandPersonality = this.getBandPersonality(b);

      this.bands.push({
        bandIndex: b,
        position: [...initialPos],
        attractor,
        initialPosition: [...initialPos],
        parameters: this.getDefaultParameters(bandPersonality),
        instancesPerBand: this.instancesPerBand
      });
    }
  }

  /**
   * Get band personality based on frequency
   */
  private getBandPersonality(bandIndex: number): {
    driftSpeed: number;
    baseThickness: number;
    anisotropy: [number, number, number];
  } {
    const normalizedIndex = bandIndex / this.numBands;

    // Low bands: slower, thicker, stretch along Z
    // High bands: faster, thinner, more isotropic
    return {
      driftSpeed: 0.3 + normalizedIndex * 0.7, // 0.3 to 1.0
      baseThickness: 0.3 - normalizedIndex * 0.2, // 0.3 to 0.1
      anisotropy: [
        1.0,
        1.0,
        1.5 - normalizedIndex * 0.5 // Z-axis stretching for low bands
      ]
    };
  }

  /**
   * Get default parameters for a band
   */
  private getDefaultParameters(personality: {
    driftSpeed: number;
    baseThickness: number;
    anisotropy: [number, number, number];
  }): VisualParameters {
    return {
      thickness: personality.baseThickness,
      alpha: 0.5,
      colorHue: 0,
      colorChroma: 0.5,
      colorLuminance: 0.7,
      diffusion: 0.01,
      flowFrequency: 1.0,
      flowIntensity: 0.5,
      lorenzSigma: 10,
      lorenzRho: 28,
      lorenzBeta: 8/3,
      driftSpeed: personality.driftSpeed,
      turbulence: 0.5
    };
  }

  /**
   * Get all bands
   */
  getBands(): BandState[] {
    return this.bands;
  }

  /**
   * Get band by index
   */
  getBand(bandIndex: number): BandState | undefined {
    return this.bands[bandIndex];
  }

  /**
   * Update band parameters
   */
  updateBandParameters(bandIndex: number, parameters: VisualParameters): void {
    const band = this.bands[bandIndex];
    if (band) {
      band.parameters = parameters;
      
      // Update attractor parameters
      band.attractor.setParams({
        sigma: parameters.lorenzSigma,
        rho: parameters.lorenzRho,
        beta: parameters.lorenzBeta
      });
    }
  }

  /**
   * Reset all bands
   */
  reset(): void {
    this.sobol.reset();
    this.initializeBands();
  }

  /**
   * Get number of bands
   */
  getNumBands(): number {
    return this.numBands;
  }

  /**
   * Get total number of instances (bands * instances per band)
   */
  getTotalInstances(): number {
    return this.numBands * this.instancesPerBand;
  }
}

