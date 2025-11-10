/**
 * UI Controller for user interactions
 */

export class UIController {
  private playPauseBtn: HTMLButtonElement;
  private resetBtn: HTMLButtonElement;
  private audioFileInput: HTMLInputElement;
  private flowIntensitySlider: HTMLInputElement;
  private flowIntensityValue: HTMLSpanElement;
  private isPlaying: boolean = false;

  private onAudioFileChange?: (file: File) => void;
  private onPlayPause?: (playing: boolean) => void;
  private onReset?: () => void;
  private onFlowIntensityChange?: (intensity: number) => void;

  constructor() {
    this.playPauseBtn = document.getElementById('play-pause') as HTMLButtonElement;
    this.resetBtn = document.getElementById('reset') as HTMLButtonElement;
    this.audioFileInput = document.getElementById('audio-file') as HTMLInputElement;
    this.flowIntensitySlider = document.getElementById('flow-intensity') as HTMLInputElement;
    this.flowIntensityValue = document.getElementById('flow-intensity-value') as HTMLSpanElement;

    this.initEventListeners();
  }

  private initEventListeners(): void {
    this.audioFileInput.addEventListener('change', (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        if (this.onAudioFileChange) {
          this.onAudioFileChange(target.files[0]);
        }
      }
    });

    this.playPauseBtn.addEventListener('click', () => {
      this.isPlaying = !this.isPlaying;
      this.playPauseBtn.textContent = this.isPlaying ? 'Pause' : 'Play';
      if (this.onPlayPause) {
        this.onPlayPause(this.isPlaying);
      }
    });

    this.resetBtn.addEventListener('click', () => {
      this.isPlaying = false;
      this.playPauseBtn.textContent = 'Play';
      if (this.onReset) {
        this.onReset();
      }
    });

    this.flowIntensitySlider.addEventListener('input', (e) => {
      const value = parseFloat((e.target as HTMLInputElement).value);
      this.flowIntensityValue.textContent = value.toFixed(2);
      if (this.onFlowIntensityChange) {
        this.onFlowIntensityChange(value);
      }
    });
  }

  setOnAudioFileChange(callback: (file: File) => void): void {
    this.onAudioFileChange = callback;
  }

  setOnPlayPause(callback: (playing: boolean) => void): void {
    this.onPlayPause = callback;
  }

  setOnReset(callback: () => void): void {
    this.onReset = callback;
  }

  setOnFlowIntensityChange(callback: (intensity: number) => void): void {
    this.onFlowIntensityChange = callback;
  }

  getFlowIntensity(): number {
    return parseFloat(this.flowIntensitySlider.value);
  }
}
