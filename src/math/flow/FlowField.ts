/**
 * Flow field abstraction
 * Combines curl noise with other vector field components
 */

import { CurlNoiseField } from './CurlNoiseField';

export class FlowField {
  private curlNoise: CurlNoiseField;
  private intensity: number = 1.0;

  constructor() {
    this.curlNoise = new CurlNoiseField();
  }

  /**
   * Update flow field parameters
   */
  update(
    time: number,
    flowFrequency: number,
    tempoStrength: number,
    intensity: number
  ): void {
    this.intensity = intensity;
    this.curlNoise.update(time, flowFrequency, tempoStrength);
  }

  /**
   * Evaluate flow field at position
   */
  evaluate(x: number, y: number, z: number): [number, number, number] {
    const flow = this.curlNoise.evaluate(x, y, z);
    return [
      flow[0] * this.intensity,
      flow[1] * this.intensity,
      flow[2] * this.intensity
    ];
  }

  /**
   * Evaluate with anisotropy for band-specific stretching
   */
  evaluateWithAnisotropy(
    x: number,
    y: number,
    z: number,
    anisotropy: [number, number, number]
  ): [number, number, number] {
    const flow = this.curlNoise.evaluateWithAnisotropy(x, y, z, anisotropy);
    return [
      flow[0] * this.intensity,
      flow[1] * this.intensity,
      flow[2] * this.intensity
    ];
  }
}

