/**
 * Main application entry point
 * Wavelength Visualizer - Real-time audio visualization with curl noise and SDE flow
 */

import './style.css';
import { AudioProcessor } from './audio';
import { Renderer } from './render';
import { UIController } from './ui';

class WavelengthVisualizerApp {
  private audioProcessor: AudioProcessor;
  private renderer: Renderer;
  private uiController: UIController;
  private animationFrameId: number | null = null;

  constructor() {
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    
    this.audioProcessor = new AudioProcessor();
    this.renderer = new Renderer(canvas);
    this.uiController = new UIController();

    this.initializeUI();
    this.startRenderLoop();
  }

  private initializeUI(): void {
    this.uiController.setOnAudioFileChange(async (file) => {
      try {
        await this.audioProcessor.loadAudioFile(file);
        console.log('Audio file loaded successfully');
      } catch (error) {
        console.error('Failed to load audio file:', error);
      }
    });

    this.uiController.setOnPlayPause((playing) => {
      if (playing) {
        this.audioProcessor.play();
      } else {
        this.audioProcessor.pause();
      }
    });

    this.uiController.setOnReset(() => {
      this.audioProcessor.pause();
      // Renderer will reset on next frame
    });

    this.uiController.setOnFlowIntensityChange((intensity) => {
      this.renderer.setFlowIntensity(intensity);
    });

    // Initialize flow intensity
    this.renderer.setFlowIntensity(this.uiController.getFlowIntensity());
  }

  private startRenderLoop(): void {
    const animate = () => {
      // Get audio data
      const cqtData = this.audioProcessor.getCQTData();
      
      // Calculate audio intensity (average of frequency bins)
      let intensity = 0;
      for (let i = 0; i < cqtData.length; i++) {
        // Convert dB to linear scale
        intensity += Math.pow(10, cqtData[i] / 20);
      }
      intensity = intensity / cqtData.length;
      
      // Normalize and set audio intensity
      const normalizedIntensity = Math.min(1, intensity * 2);
      this.renderer.setAudioIntensity(normalizedIntensity);

      // Render frame
      this.renderer.render();

      this.animationFrameId = requestAnimationFrame(animate);
    };

    animate();
  }

  dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.audioProcessor.dispose();
    this.renderer.dispose();
  }
}

// Initialize application
const app = new WavelengthVisualizerApp();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.dispose();
});

// Export for debugging
(window as any).app = app;
