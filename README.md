# Wavelength Visualizer App

A real-time audio visualization application using WebAudio API, Three.js/WebGPU, and advanced mathematical transformations including Constant-Q Transform (CQT), wavelet analysis, curl noise, and Stochastic Differential Equations (SDE).

## Goal

Create an immersive audio-reactive visualization that transforms sound into flowing, organic particle systems. The application processes audio in real-time using CQT and wavelet transforms, then visualizes the frequency spectrum through a particle system driven by curl noise and SDE-based flow fields.

## Pipeline

```
Audio Input → WebAudio API → CQT/Wavelet Transform → Frequency Data
                                                              ↓
GPU Rendering ← Particle System ← SDE Flow Field ← Curl Noise
       ↓
   Display
```

### Processing Steps

1. **Audio Input**: Load audio file through browser file picker
2. **Signal Processing**: 
   - Extract frequency data using WebAudio AnalyserNode
   - Apply Constant-Q Transform for logarithmic frequency bins
   - Compute wavelet transform for time-frequency representation
3. **Flow Field Generation**:
   - Generate curl noise vector field for divergence-free flow
   - Apply SDE (Stochastic Differential Equation) integration
   - Update particle positions with Euler-Maruyama method
4. **Rendering**:
   - Use Three.js for WebGL rendering
   - Custom GLSL shaders for particle visualization
   - Audio-reactive color and movement

## Mathematical Concepts

### Constant-Q Transform (CQT)

The CQT provides frequency bins with logarithmic spacing, matching human perception of pitch:

```
f_k = f_0 * 2^(k/b)
```

where `f_k` is the center frequency of bin k, `f_0` is the reference frequency, and `b` is the number of bins per octave.

### Wavelet Transform

Decomposes signal into different frequency scales:

```
W(a,b) = ∫ f(t) * ψ*((t-b)/a) dt
```

where `a` is the scale parameter, `b` is the translation parameter, and `ψ` is the mother wavelet.

### Curl Noise

Generates divergence-free vector fields for smooth, flowing motion:

```
curl(F) = ∇ × F = (∂F_z/∂y - ∂F_y/∂z, ∂F_x/∂z - ∂F_z/∂x, ∂F_y/∂x - ∂F_x/∂y)
```

### Stochastic Differential Equations (SDE)

Models particle motion with both deterministic drift and random diffusion:

```
dx = μ(x,t)dt + σ(x,t)dW
```

where `μ` is the drift (curl noise), `σ` is volatility, and `dW` is Brownian motion.

## Features

- 🎵 Real-time audio processing with WebAudio API
- 🌊 Curl noise-based flow field generation
- 🎲 SDE integration for organic particle motion
- 🎨 Audio-reactive color and intensity
- 🖱️ Interactive controls for flow intensity
- 📱 Responsive design for mobile and desktop
- ⚡ High-performance WebGL rendering

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser with WebGL support

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Build

```bash
npm run build
```

### Test

```bash
npm test
```

## Usage

1. Open the application in your browser
2. Click "Upload Audio" and select an audio file (MP3, WAV, etc.)
3. Click "Play" to start audio playback and visualization
4. Adjust "Flow Intensity" slider to control particle movement
5. Click "Reset" to stop and reset the visualization

## Tech Stack

- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and dev server
- **Three.js**: WebGL/WebGPU rendering
- **WebAudio API**: Real-time audio processing
- **GLSL**: Custom shaders for GPU computation

## Project Structure

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT License - See LICENSE file for details