/**
 * Rendering system using Three.js
 * Handles WebGL/WebGPU rendering with line-based trail system
 */

import * as THREE from 'three';
import { lineVertexShader, lineFragmentShader } from '../shaders';
import { LineSystem } from './LineSystem';
import { BandManager } from './BandManager';

export class Renderer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private lineSystem: LineSystem;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement, bandManager: BandManager) {
    
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

    // Line system
    this.lineSystem = new LineSystem(bandManager);
    this.lineSystem.initializeGeometry(lineVertexShader, lineFragmentShader);
    
    const mesh = this.lineSystem.getMesh();
    if (mesh) {
      this.scene.add(mesh);
    }

    // Handle window resize
    window.addEventListener('resize', () => this.onResize());
  }

  render(cqtData: Float32Array, tempo: number, beatStrength: number): void {
    this.time += 0.016; // ~60fps

    // Update line system
    this.lineSystem.update(this.time, cqtData, tempo, beatStrength);
    this.lineSystem.updateStyling();
    this.lineSystem.updateUniforms();

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
    this.lineSystem.dispose();
    this.renderer.dispose();
    window.removeEventListener('resize', () => this.onResize());
  }
}
