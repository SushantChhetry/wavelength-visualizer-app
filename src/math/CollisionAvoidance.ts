/**
 * Collision avoidance using soft potential function
 * Prevents exact band overlap: U(r) = k/(r² + ε)
 */

export class CollisionAvoidance {
  private k: number = 0.1; // Potential strength
  private epsilon: number = 0.01; // Smoothing parameter

  /**
   * Compute repulsion force from other positions
   * @param position - Current position [x, y, z]
   * @param otherPositions - Array of other band positions
   * @returns Force vector to add to drift
   */
  computeForce(
    position: [number, number, number],
    otherPositions: [number, number, number][]
  ): [number, number, number] {
    let forceX = 0;
    let forceY = 0;
    let forceZ = 0;

    for (const other of otherPositions) {
      const dx = position[0] - other[0];
      const dy = position[1] - other[1];
      const dz = position[2] - other[2];
      const rSquared = dx * dx + dy * dy + dz * dz;
      const r = Math.sqrt(rSquared + this.epsilon);

      // Potential: U(r) = k/(r² + ε)
      // Force: F = -∇U = 2k * r / (r² + ε)²
      const forceMagnitude = (2 * this.k) / (rSquared + this.epsilon);
      
      forceX += (dx / r) * forceMagnitude;
      forceY += (dy / r) * forceMagnitude;
      forceZ += (dz / r) * forceMagnitude;
    }

    return [forceX, forceY, forceZ];
  }

  /**
   * Set potential strength
   */
  setStrength(k: number): void {
    this.k = Math.max(0, k);
  }

  /**
   * Set smoothing parameter
   */
  setEpsilon(epsilon: number): void {
    this.epsilon = Math.max(0.001, epsilon);
  }
}

