
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SimulationConfig, Point } from '../types';
import { extractBrightnessMap } from '../services/imageProcessor';

interface FluxSculptureProps {
  imageSrc: string;
  config: SimulationConfig;
  className?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

const FluxSculpture: React.FC<FluxSculptureProps> = ({ 
  imageSrc, 
  config, 
  className,
  onCanvasReady 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const pointsRef = useRef<Point[]>([]);
  const mouseRef = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 });
  const timeRef = useRef<number>(0);
  const bgImageRef = useRef<HTMLImageElement | null>(null);
  
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Initialize Canvas Dimensions
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
        
        if (canvasRef.current) {
          canvasRef.current.width = width;
          canvasRef.current.height = height;
        }
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to generate a fallback procedural map if image loading fails
  const generateFallbackData = (cols: number, rows: number) => {
    const map = new Float32Array(cols * rows);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const nx = (c / cols) * 2 - 1;
        const ny = (r / rows) * 2 - 1;
        const d = Math.sqrt(nx*nx + ny*ny);
        map[i] = Math.max(0, 1 - d);
      }
    }
    return map;
  };

  // Load Image Object for Background Reveal
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imageSrc;
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, [imageSrc]);

  // Initialize Points based on Image
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    let isMounted = true;

    const initSystem = async () => {
      setIsReady(false);
      setError(null);
      
      const cols = config.resolution;
      const rows = Math.floor(cols * (dimensions.height / dimensions.width));
      let brightnessData: Float32Array;

      try {
        const result = await extractBrightnessMap(imageSrc, cols, rows);
        brightnessData = result.data;
      } catch (e: any) {
        console.warn("Failed to load flux map, switching to procedural fallback.", e);
        setError(`Source unavailable: ${e.message || "Unknown error"}. Using synthesis.`);
        brightnessData = generateFallbackData(cols, rows);
      }
        
      if (!isMounted) return;

      const newPoints: Point[] = [];
      const gapX = dimensions.width / (cols - 1);
      const gapY = dimensions.height / (rows - 1);

      // Center rendering vertically
      const totalContentHeight = rows * gapY;
      const offsetY = (dimensions.height - totalContentHeight) / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const index = r * cols + c;
          const x = c * gapX;
          const y = r * gapY + offsetY;
          
          newPoints.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            z: brightnessData[index], // 0 to 1
            vx: 0,
            vy: 0
          });
        }
      }

      pointsRef.current = newPoints;
      setIsReady(true);
      if (canvasRef.current && onCanvasReady) {
          onCanvasReady(canvasRef.current);
      }
    };

    initSystem();

    return () => { isMounted = false; };
  }, [imageSrc, dimensions, config.resolution, onCanvasReady]);

  // Simulation Loop
  const animate = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    timeRef.current += 0.01;

    // Clear with semi-transparent black for trail effect (optional, currently solid for clarity)
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    // --- RENDER 1: SOFT IMAGE REVEAL (Backlight) ---
    if (bgImageRef.current && mx > -500) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        
        // Sharper, smaller spotlight for "engraving inspection" feel
        const gradient = ctx.createRadialGradient(mx, my, 0, mx, my, config.mouseRadius * 1.2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.12)'); 
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.02)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mx, my, config.mouseRadius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Subtle background hint of the full texture
        ctx.globalAlpha = 0.03;
        ctx.drawImage(bgImageRef.current, 0, 0, dimensions.width, dimensions.height);

        ctx.restore();
    }

    // --- RENDER 2: TOPOLOGICAL LINES ---
    const points = pointsRef.current;
    const cols = config.resolution;
    const rows = Math.floor(points.length / cols);
    
    const hoverAmp = config.hoverAmplitude ?? 150; 
    const baseAmp = config.amplitude;
    const rainbowSat = config.rainbowIntensity ?? 80;

    // Prepare Gradient for Rainbow Effect
    let activeGradient: CanvasGradient | null = null;
    if (mx > -100 && mx < dimensions.width + 100 && rainbowSat > 5) {
      activeGradient = ctx.createRadialGradient(mx, my, 0, mx, my, config.mouseRadius * 1.5);
      const t = timeRef.current * 40; // Hue cycle speed
      
      // Soft pastel rainbow - Saturation controlled by rainbowSat
      activeGradient.addColorStop(0.0, `hsla(${t % 360}, ${rainbowSat}%, 75%, 1)`);
      activeGradient.addColorStop(0.2, `hsla(${(t + 60) % 360}, ${rainbowSat * 0.9}%, 75%, 0.9)`);
      activeGradient.addColorStop(0.5, `hsla(${(t + 120) % 360}, ${rainbowSat * 0.8}%, 80%, 0.8)`);
      activeGradient.addColorStop(1.0, config.lineColor);
    }

    for (let r = 0; r < rows; r++) {
      ctx.beginPath();
      
      let rowHasActivity = false;
      let avgZ = 0;

      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const p = points[i];
        avgZ += p.z;

        // --- PHYSICS ---
        const dx = mx - p.x;
        const dy = my - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const interaction = Math.max(0, 1 - dist / config.mouseRadius);
        // Smoother cubic ease
        const smoothInteraction = interaction * interaction * (3 - 2 * interaction);

        const currentAmp = baseAmp + (hoverAmp - baseAmp) * smoothInteraction;
        
        // Micro-oscillation for "living texture" feel
        const breathing = Math.sin(timeRef.current * 0.5 + p.originX * 0.02 + p.originY * 0.02) * (p.z * 1.5);
        
        // The Z displacement
        const displacement = (p.z * currentAmp) + breathing;
        const targetY = p.originY - displacement;

        // Magnetic Repulsion (X-axis push)
        let forceX = 0;
        let forceY = 0;
        if (interaction > 0) {
            rowHasActivity = true;
            const angle = Math.atan2(dy, dx);
            // Repel
            const push = -1 * smoothInteraction * config.mouseStrength;
            forceX = Math.cos(angle) * push;
            forceY = Math.sin(angle) * push;
        }

        const ax = (p.originX + forceX - p.x) * config.elasticity;
        const ay = (targetY + forceY - p.y) * config.elasticity;

        p.vx = (p.vx + ax) * config.friction;
        p.vy = (p.vy + ay) * config.friction;

        p.x += p.vx;
        p.y += p.vy;

        // --- DRAWING ---
        if (c === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
           const prevP = points[i - 1];
           
           // Glitch Effect: Use straight lines inside the magnetic field
           // Use smooth curves outside
           if (dist < config.mouseRadius) {
               ctx.lineTo(p.x, p.y);
           } else {
               const xc = (prevP.x + p.x) / 2;
               const yc = (prevP.y + p.y) / 2;
               ctx.quadraticCurveTo(prevP.x, prevP.y, xc, yc);
           }
        }
      }
      
      avgZ /= cols;

      // STYLING: Engraving / Banknote texture style
      
      // If mouse is active and we have a gradient, use it. Otherwise fall back to base color.
      ctx.strokeStyle = (rowHasActivity && activeGradient) ? activeGradient : config.lineColor;
      
      // Variable Line Width:
      // Dark areas = very thin (0.1), Bright areas = thick (2.5)
      // This contrast creates the "texture" illusion.
      const baseWidth = 0.15;
      const zInfluence = Math.pow(avgZ, 1.5) * 2.5; // Exponential curve for sharper contrast
      ctx.lineWidth = baseWidth + zInfluence;
      
      // Variable Opacity:
      // Dark areas fade out to 0.1, bright areas pop to 1.0
      const activeBoost = rowHasActivity ? 0.2 : 0;
      const opacity = Math.max(0.05, Math.min(1, (avgZ * 1.2) + activeBoost));
      ctx.globalAlpha = opacity;
      
      ctx.stroke();
      ctx.globalAlpha = 1.0; 
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [config, dimensions]);

  useEffect(() => {
    if (isReady) {
      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isReady, animate]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const scaleX = canvasRef.current.width / rect.width;
      const scaleY = canvasRef.current.height / rect.height;
      
      mouseRef.current = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseRef.current = { x: -5000, y: -5000 };
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <div ref={containerRef} className={`relative w-full h-full overflow-hidden ${className}`}>
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        className={`block w-full h-full cursor-none ${isReady ? 'opacity-100' : 'opacity-0'} transition-all duration-700 ease-out ${isHovered ? 'scale-[1.02]' : 'scale-100'}`}
      />
      
      {!isReady && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 font-mono text-xs gap-2">
          <div className="w-24 h-px bg-neutral-800 overflow-hidden">
             <div className="w-full h-full bg-neutral-400 animate-progress origin-left"></div>
          </div>
          <span className="animate-pulse">WEAVING_TEXTURE</span>
        </div>
      )}

      {error && (
        <div className="absolute bottom-10 left-0 w-full flex justify-center pointer-events-none">
          <div className="bg-red-900/20 border border-red-900/50 text-red-400 px-4 py-2 text-[10px] font-mono uppercase tracking-widest backdrop-blur-sm max-w-md text-center">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};

export default FluxSculpture;
