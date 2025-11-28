
export interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  z: number; // Brightness/Depth (0-1)
  vx: number;
  vy: number;
}

export interface SimulationConfig {
  resolution: number; // Grid density
  amplitude: number; // Base Z-height (dormant)
  hoverAmplitude?: number; // Z-height when hovered (active)
  friction: number; // Physics damping
  elasticity: number; // Return speed
  mouseRadius: number; // Interaction field size
  mouseStrength: number; // Force of interaction
  lineColor: string;
  backgroundColor: string;
  rainbowIntensity?: number; // 0-100 Saturation intensity of the magnetic field
}

export interface ArtCritique {
  title: string;
  description: string;
  mood: string;
}
