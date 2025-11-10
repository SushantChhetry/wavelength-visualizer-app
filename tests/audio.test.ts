import { describe, it, expect, beforeEach } from 'vitest';
import { AudioProcessor } from '../src/audio/AudioProcessor';

describe('AudioProcessor', () => {
  let audioProcessor: AudioProcessor;

  beforeEach(() => {
    audioProcessor = new AudioProcessor();
  });

  describe('initialization', () => {
    it('should create an instance', () => {
      expect(audioProcessor).toBeInstanceOf(AudioProcessor);
    });
  });

  describe('getCQTData', () => {
    it('should return Float32Array', () => {
      const cqtData = audioProcessor.getCQTData();
      expect(cqtData).toBeInstanceOf(Float32Array);
    });

    it('should return 32 frequency bins', () => {
      const cqtData = audioProcessor.getCQTData();
      expect(cqtData.length).toBe(32);
    });

    it('should return valid dB values', () => {
      const cqtData = audioProcessor.getCQTData();
      // dB values should be negative (silence to 0 dB)
      cqtData.forEach(value => {
        expect(value).toBeLessThanOrEqual(0);
        expect(Number.isFinite(value)).toBe(true);
      });
    });
  });

  describe('getWaveletData', () => {
    it('should return 2D array', () => {
      const waveletData = audioProcessor.getWaveletData();
      expect(Array.isArray(waveletData)).toBe(true);
      expect(waveletData.length).toBeGreaterThan(0);
      expect(Array.isArray(waveletData[0])).toBe(true);
    });

    it('should return 8 scales', () => {
      const waveletData = audioProcessor.getWaveletData();
      expect(waveletData.length).toBe(8);
    });

    it('should have decreasing length for higher scales', () => {
      const waveletData = audioProcessor.getWaveletData();
      for (let i = 1; i < waveletData.length; i++) {
        expect(waveletData[i].length).toBeLessThanOrEqual(waveletData[i - 1].length);
      }
    });
  });

  describe('getFrequencyData', () => {
    it('should return Float32Array or null', () => {
      const freqData = audioProcessor.getFrequencyData();
      if (freqData !== null) {
        expect(freqData).toBeInstanceOf(Float32Array);
      }
    });
  });
});
