/**
 * Rendering system using Three.js
 * Handles WebGL/WebGPU rendering with particle systems
 */

import * as THREE from 'three';
import { vertexShader, fragmentShader } from '../shaders';
import { curlNoise3D, SDEIntegrator } from '../math';

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points | null = null;
  private particleSystem: ParticleSystem;
  private time: number = 0;
  private flowIntensity: number = 0.5;
  private audioIntensity: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    // Scene setup
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0a);

    // Camera setup
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Renderer setup
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Particle system
    this.particleSystem = new ParticleSystem(10000);
    this.initParticles();

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  private initParticles(): void {
    const geometry = new THREE.BufferGeometry();
    const positions = this.particleSystem.getPositions();
    const velocities = this.particleSystem.getVelocities();
    const phases = this.particleSystem.getPhases();

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 },
        flowIntensity: { value: this.flowIntensity },
        audioIntensity: { value: 0 }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  setFlowIntensity(intensity: number): void {
    this.flowIntensity = intensity;
  }

  setAudioIntensity(intensity: number): void {
    this.audioIntensity = intensity;
  }

  render(): void {
    this.time += 0.016; // ~60fps

    if (this.particles && this.particles.material instanceof THREE.ShaderMaterial) {
      this.particles.material.uniforms.time.value = this.time;
      this.particles.material.uniforms.flowIntensity.value = this.flowIntensity;
      this.particles.material.uniforms.audioIntensity.value = this.audioIntensity;
    }

    // Update particle positions with SDE flow
    this.particleSystem.update(this.time, this.flowIntensity);
    if (this.particles) {
      const positions = this.particleSystem.getPositions();
      const positionAttr = this.particles.geometry.getAttribute('position') as THREE.BufferAttribute;
      positionAttr.set(positions);
      positionAttr.needsUpdate = true;
    }

    // Rotate camera
    this.camera.position.x = Math.sin(this.time * 0.1) * 5;
    this.camera.position.z = Math.cos(this.time * 0.1) * 5;
    this.camera.lookAt(0, 0, 0);

    this.renderer.render(this.scene, this.camera);
  }

  private onResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  dispose(): void {
    if (this.particles) {
      this.particles.geometry.dispose();
      if (this.particles.material instanceof THREE.Material) {
        this.particles.material.dispose();
      }
    }
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onResize());
  }
}

/**
 * Particle system with SDE-based flow
 */
class ParticleSystem {
  private positions: Float32Array;
  private velocities: Float32Array;
  private phases: Float32Array;
  private sdeIntegrator: SDEIntegrator;
  private count: number;

  constructor(count: number) {
    this.count = count;
    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.phases = new Float32Array(count);
    this.sdeIntegrator = new SDEIntegrator();

    this.initializeParticles();
  }

  private initializeParticles(): void {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      // Random positions in a sphere
      const radius = Math.random() * 2;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      
      this.positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      this.positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      this.positions[i3 + 2] = radius * Math.cos(phi);

      // Random velocities
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      // Random phase for color variation
      this.phases[i] = Math.random() * Math.PI * 2;
    }
  }

  update(time: number, flowIntensity: number): void {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3;
      
      const position: [number, number, number] = [
        this.positions[i3],
        this.positions[i3 + 1],
        this.positions[i3 + 2]
      ];

      // Get curl noise drift
      const drift = curlNoise3D(
        position[0],
        position[1],
        position[2],
        time
      );

      // Scale drift by flow intensity
      drift[0] *= flowIntensity;
      drift[1] *= flowIntensity;
      drift[2] *= flowIntensity;

      // Apply SDE integration
      const newPosition = this.sdeIntegrator.step(
        position,
        drift,
        0.02, // volatility
        0.016 // dt
      );

      // Boundary conditions: wrap around sphere
      const dist = Math.sqrt(
        newPosition[0] * newPosition[0] +
        newPosition[1] * newPosition[1] +
        newPosition[2] * newPosition[2]
      );

      if (dist > 3) {
        const scale = 0.5 / dist;
        newPosition[0] *= scale;
        newPosition[1] *= scale;
        newPosition[2] *= scale;
      }

      this.positions[i3] = newPosition[0];
      this.positions[i3 + 1] = newPosition[1];
      this.positions[i3 + 2] = newPosition[2];
    }
  }

  getPositions(): Float32Array {
    return this.positions;
  }

  getVelocities(): Float32Array {
    return this.velocities;
  }

  getPhases(): Float32Array {
    return this.phases;
  }
}
