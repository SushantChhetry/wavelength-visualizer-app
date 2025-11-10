/**
 * Color mapping from audio features to HCL color space
 * Maps chroma (pitch class) to hue, flux to chroma saturation, loudness to luminance
 */

import { hclToRgb } from './ColorSpace';

export interface ColorMapping {
  rgb: [number, number, number];
  hcl: [number, number, number]; // [hue, chroma, luminance]
}

export class ColorMapper {
  /**
   * Map chroma (pitch class) to hue
   * 12-stop color wheel: C, C#, D, D#, E, F, F#, G, G#, A, A#, B
   */
  private chromaToHue(chromaIndex: number): number {
    // Map 12 pitch classes to hue [0, 1]
    // Each pitch class gets 1/12 of the hue circle
    return chromaIndex / 12.0;
  }

  /**
   * Map audio features to color
   * @param hue - From chroma (pitch class), already mapped to [0, 1]
   * @param chroma - From spectral flux, [0, 1]
   * @param luminance - From loudness (inverse), [0, 1]
   */
  mapToColor(
    hue: number,
    chroma: number,
    luminance: number
  ): ColorMapping {
    // Ensure values are in valid ranges
    hue = ((hue % 1) + 1) % 1; // Wrap to [0, 1]
    chroma = Math.max(0, Math.min(1, chroma));
    luminance = Math.max(0, Math.min(1, luminance));

    // Convert HCL to RGB
    const rgb = hclToRgb(hue, chroma, luminance);

    return {
      rgb,
      hcl: [hue, chroma, luminance]
    };
  }

  /**
   * Get color for a band based on its features
   * @param chromaVector - 12-D chroma vector
   * @param flux - Spectral flux
   * @param loudness - Overall loudness
   */
  getBandColor(
    chromaVector: Float32Array,
    flux: number,
    loudness: number
  ): ColorMapping {
    // Find dominant chroma
    let dominantChroma = 0;
    let maxValue = chromaVector[0];
    for (let i = 1; i < chromaVector.length; i++) {
      if (chromaVector[i] > maxValue) {
        maxValue = chromaVector[i];
        dominantChroma = i;
      }
    }

    // Map to hue
    const hue = this.chromaToHue(dominantChroma);

    // Map flux to chroma saturation (with scaling)
    const chroma = Math.min(1, flux * 2);

    // Map loudness to luminance (inverse, to avoid washing out)
    const luminance = 1.0 - Math.min(1, loudness * 0.5);

    return this.mapToColor(hue, chroma, luminance);
  }
}

