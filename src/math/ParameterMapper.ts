/**
 * Maps audio features to visual parameters
 * Converts band features into parameters for math engines (attractors, SDE, flow fields)
 */

import type { BandFeatures, GlobalFeatures } from '../audio';

export interface VisualParameters {
  // Line styling
  thickness: number; // w_b(t) = w_0 + k · log(1 + A_b(t))
  alpha: number; // Alpha based on onsets and sustain
  colorHue: number; // Hue from chroma (0-1)
  colorChroma: number; // Chroma saturation from flux (0-1)
  colorLuminance: number; // Luminance from loudness (0-1)
  
  // Math engine parameters
  diffusion: number; // σ_b(t) = α_0 + α_1 · A_b(t)
  flowFrequency: number; // ω(t) = ω_0 + c_1 · spectral_centroid(t)
  flowIntensity: number; // Overall flow field strength
  
  // Lorenz attractor parameters
  lorenzSigma: number; // σ_b(t) = 10 + k_σ · centroid_b(t)
  lorenzRho: number; // ρ_b(t) = 28 + k_ρ · loudness(t)
  lorenzBeta: number; // β_b(t) = 8/3 + k_β · flux_b(t)
  
  // Band personality
  driftSpeed: number; // Low bands → slower, high bands → faster
  turbulence: number; // Higher for more complex music (entropy-based)
}

export class ParameterMapper {
  // Mapping coefficients (tunable)
  private kThickness: number = 0.5;
  private w0: number = 0.1; // Base thickness
  private alpha0: number = 0.01; // Base diffusion
  private alpha1: number = 0.05; // Envelope contribution to diffusion
  private kFlowFreq: number = 0.5;
  private omega0: number = 1.0; // Base flow frequency
  private kLorenzSigma: number = 2.0;
  private kLorenzRho: number = 10.0;
  private kLorenzBeta: number = 1.0;
  
  // Easing functions for smooth transitions
  private smoothingAlpha: number = 0.1; // EMA coefficient
  
  // Previous values for smoothing
  private previousParams: Map<number, VisualParameters> = new Map();

  /**
   * Map band features to visual parameters
   */
  mapBandFeatures(
    bandIndex: number,
    bandFeatures: BandFeatures,
    globalFeatures: GlobalFeatures,
    hasOnset: boolean
  ): VisualParameters {
    const prev = this.previousParams.get(bandIndex);
    
    // Thickness: w_b(t) = w_0 + k · log(1 + A_b(t))
    const rawThickness = this.w0 + this.kThickness * Math.log(1 + bandFeatures.envelope);
    const thickness = this.smooth(prev?.thickness ?? rawThickness, rawThickness);
    
    // Alpha: increase during onsets, decay on sustain
    const rawAlpha = hasOnset ? 1.0 : Math.max(0.3, bandFeatures.envelope * 0.7);
    const alpha = this.smooth(prev?.alpha ?? rawAlpha, rawAlpha);
    
    // Color: Hue from chroma (dominant pitch class)
    const dominantChroma = this.getDominantChroma(bandFeatures.chroma);
    const colorHue = dominantChroma / 12.0; // Map to 0-1
    
    // Chroma saturation: proportional to spectral flux
    const rawChroma = Math.min(1, bandFeatures.flux * 2);
    const colorChroma = this.smooth(prev?.colorChroma ?? rawChroma, rawChroma);
    
    // Luminance: inverse loudness compression
    const rawLuminance = 1.0 - Math.min(1, globalFeatures.loudness * 0.5);
    const colorLuminance = this.smooth(prev?.colorLuminance ?? rawLuminance, rawLuminance);
    
    // Diffusion: σ_b(t) = α_0 + α_1 · A_b(t)
    const rawDiffusion = this.alpha0 + this.alpha1 * bandFeatures.envelope;
    const diffusion = this.smooth(prev?.diffusion ?? rawDiffusion, rawDiffusion);
    
    // Flow frequency: ω(t) = ω_0 + c_1 · spectral_centroid(t)
    const rawFlowFreq = this.omega0 + this.kFlowFreq * (bandFeatures.centroid / 36.0);
    const flowFrequency = this.smooth(prev?.flowFrequency ?? rawFlowFreq, rawFlowFreq);
    
    // Flow intensity: based on envelope
    const flowIntensity = bandFeatures.envelope;
    
    // Lorenz parameters
    const lorenzSigma = 10 + this.kLorenzSigma * (bandFeatures.centroid / 36.0);
    const lorenzRho = 28 + this.kLorenzRho * globalFeatures.loudness;
    const lorenzBeta = 8/3 + this.kLorenzBeta * bandFeatures.flux;
    
    // Band personality: low bands → slower, high bands → faster
    const driftSpeed = 0.5 + (bandIndex / 36.0) * 0.5; // 0.5 to 1.0
    
    // Turbulence: based on entropy
    const turbulence = globalFeatures.entropy / 5.0; // Normalize entropy
    
    const params: VisualParameters = {
      thickness,
      alpha,
      colorHue,
      colorChroma,
      colorLuminance,
      diffusion,
      flowFrequency,
      flowIntensity,
      lorenzSigma,
      lorenzRho,
      lorenzBeta,
      driftSpeed,
      turbulence
    };
    
    this.previousParams.set(bandIndex, params);
    return params;
  }

  /**
   * Get dominant chroma (pitch class) from chroma vector
   */
  private getDominantChroma(chroma: Float32Array): number {
    let maxIndex = 0;
    let maxValue = chroma[0];
    
    for (let i = 1; i < chroma.length; i++) {
      if (chroma[i] > maxValue) {
        maxValue = chroma[i];
        maxIndex = i;
      }
    }
    
    return maxIndex;
  }

  /**
   * Smooth value using EMA
   */
  private smooth(previous: number, current: number): number {
    return previous * (1 - this.smoothingAlpha) + current * this.smoothingAlpha;
  }

  /**
   * Reset parameter mapper state
   */
  reset(): void {
    this.previousParams.clear();
  }

  /**
   * Update smoothing coefficient
   */
  setSmoothingAlpha(alpha: number): void {
    this.smoothingAlpha = Math.max(0, Math.min(1, alpha));
  }
}

