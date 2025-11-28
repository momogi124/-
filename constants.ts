
import { SimulationConfig } from './types';

export const DEFAULT_CONFIG: SimulationConfig = {
  resolution: 220, // High density for intricate floral details
  amplitude: 15, // Lower base amplitude for a "printed texture" look
  friction: 0.94, // High friction for stable, crisp movement
  elasticity: 0.1, // Snappy return to form
  mouseRadius: 180, // Focused interaction area
  mouseStrength: 25, // Controlled, precise displacement
  lineColor: 'rgba(240, 240, 240, 0.95)',
  backgroundColor: '#050505',
  rainbowIntensity: 85, // Vibrant by default
};

// A high-contrast architectural rosette/floral relief
export const DEFAULT_IMAGE_URL = "https://images.unsplash.com/photo-1580137189272-c9379f8864fd?q=80&w=2000&auto=format&fit=crop";
