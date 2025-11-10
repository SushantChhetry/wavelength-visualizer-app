/**
 * Trail Buffer: Ring buffer for storing line trail points
 * Maintains history of positions for each band instance
 */

export class TrailBuffer {
  private buffer: Float32Array;
  private bufferSize: number; // Number of points per trail
  private numInstances: number; // Total number of instances (bands * instances per band)
  private writeIndex: number[]; // Current write index for each instance

  constructor(numInstances: number, bufferSize: number = 64) {
    this.numInstances = numInstances;
    this.bufferSize = bufferSize;
    
    // Buffer: [instance0_point0_x, instance0_point0_y, instance0_point0_z, instance0_point1_x, ...]
    this.buffer = new Float32Array(numInstances * bufferSize * 3);
    this.writeIndex = new Array(numInstances).fill(0);
  }

  /**
   * Add a new point to a trail (ring buffer)
   */
  addPoint(instanceIndex: number, position: [number, number, number]): void {
    if (instanceIndex < 0 || instanceIndex >= this.numInstances) {
      return;
    }

    const baseIndex = instanceIndex * this.bufferSize * 3;
    const writeIdx = this.writeIndex[instanceIndex];
    const pointIndex = baseIndex + writeIdx * 3;

    this.buffer[pointIndex] = position[0];
    this.buffer[pointIndex + 1] = position[1];
    this.buffer[pointIndex + 2] = position[2];

      // Advance write index (ring buffer)
      this.writeIndex[instanceIndex] = (this.writeIndex[instanceIndex] + 1) % this.bufferSize;
  }

  /**
   * Get trail points for an instance (ordered from oldest to newest)
   */
  getTrail(instanceIndex: number): Float32Array {
    if (instanceIndex < 0 || instanceIndex >= this.numInstances) {
      return new Float32Array(0);
    }

    const baseIndex = instanceIndex * this.bufferSize * 3;
    const writeIdx = this.writeIndex[instanceIndex];
    const trail = new Float32Array(this.bufferSize * 3);

    // Reorder points: from writeIndex to end, then from start to writeIndex
    let trailPos = 0;
    
    // From writeIndex to end (newer points)
    for (let i = writeIdx; i < this.bufferSize; i++) {
      const srcIndex = baseIndex + i * 3;
      trail[trailPos++] = this.buffer[srcIndex];
      trail[trailPos++] = this.buffer[srcIndex + 1];
      trail[trailPos++] = this.buffer[srcIndex + 2];
    }
    
    // From start to writeIndex (older points)
    for (let i = 0; i < writeIdx; i++) {
      const srcIndex = baseIndex + i * 3;
      trail[trailPos++] = this.buffer[srcIndex];
      trail[trailPos++] = this.buffer[srcIndex + 1];
      trail[trailPos++] = this.buffer[srcIndex + 2];
    }

    return trail;
  }

  /**
   * Get all buffer data (for GPU upload)
   */
  getBuffer(): Float32Array {
    return this.buffer;
  }

  /**
   * Get buffer size (points per trail)
   */
  getBufferSize(): number {
    return this.bufferSize;
  }

  /**
   * Get number of instances
   */
  getNumInstances(): number {
    return this.numInstances;
  }

  /**
   * Reset trail for an instance
   */
  resetInstance(instanceIndex: number): void {
    if (instanceIndex >= 0 && instanceIndex < this.numInstances) {
      this.writeIndex[instanceIndex] = 0;
      const baseIndex = instanceIndex * this.bufferSize * 3;
      this.buffer.fill(0, baseIndex, baseIndex + this.bufferSize * 3);
    }
  }

  /**
   * Reset all trails
   */
  reset(): void {
    this.buffer.fill(0);
    this.writeIndex.fill(0);
  }
}

