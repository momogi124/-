import React, { useState, useCallback, useRef } from 'react';
import FluxSculpture from './components/FluxSculpture';
import Controls from './components/Controls';
import { DEFAULT_CONFIG, DEFAULT_IMAGE_URL } from './constants';
import { SimulationConfig, ArtCritique } from './types';
import { generateArtisticCritique } from './services/geminiService';

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [imageSrc, setImageSrc] = useState<string>(DEFAULT_IMAGE_URL);
  const [critique, setCritique] = useState<ArtCritique | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleConfigChange = (newConfig: SimulationConfig) => {
    setConfig(newConfig);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImageSrc(event.target.result as string);
          setCritique(null); // Reset critique on new image
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCanvasReady = useCallback((canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  }, []);

  const handleAnalyze = async () => {
    if (!canvasRef.current) return;
    
    setIsAnalyzing(true);
    try {
        const currentFrame = canvasRef.current.toDataURL("image/png").split(',')[1];
        const result = await generateArtisticCritique(currentFrame);
        setCritique(result);
    } catch (error) {
        console.error("Analysis failed", error);
    } finally {
        setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden selection:bg-white selection:text-black">
      {/* Background/Base Layout */}
      <div className="absolute inset-0 z-0">
        <FluxSculpture 
            imageSrc={imageSrc} 
            config={config} 
            onCanvasReady={handleCanvasReady}
        />
      </div>

      {/* Overlay UI */}
      <div className="absolute top-0 left-0 p-10 z-10 pointer-events-none mix-blend-difference">
        <h1 className="text-5xl font-light text-white tracking-[-0.05em] mb-4">
          FLUX<span className="font-bold">.SYS</span>
        </h1>
        <div className="flex flex-col gap-1 text-[10px] text-neutral-400 font-mono uppercase tracking-widest border-l border-neutral-800 pl-4">
          <p>Topological Data Visualization</p>
          <p>Magnetic Field Interpolation</p>
          <p>Dynamic Form: {config.resolution}x Vectors</p>
        </div>
      </div>

      {/* Critique Overlay (Bottom Left) */}
      {critique && (
        <div className="absolute bottom-12 left-10 max-w-sm z-10 font-mono pointer-events-auto animate-in fade-in slide-in-from-bottom-10 duration-1000">
           <div className="border border-white/20 bg-black/80 backdrop-blur-md p-6">
              <div className="flex justify-between items-start mb-4">
                 <h3 className="text-white text-sm font-bold uppercase tracking-[0.2em]">{critique.title}</h3>
                 <span className="text-[9px] text-neutral-500">AI_CRITIC_V2</span>
              </div>
              <p className="text-neutral-400 text-xs leading-relaxed mb-6 font-light">{critique.description}</p>
              <div className="flex flex-wrap gap-2 text-[9px] text-white uppercase tracking-wider">
                  {critique.mood.split('.').map((m, i) => (
                      m.trim() && <span key={i} className="border border-neutral-700 px-2 py-1 hover:bg-white hover:text-black transition-colors cursor-default">{m.trim()}</span>
                  ))}
              </div>
           </div>
        </div>
      )}

      {/* Controls (Top Right) */}
      <Controls 
        config={config} 
        onChange={handleConfigChange} 
        onUpload={handleFileUpload}
        onAnalyze={handleAnalyze}
        isAnalyzing={isAnalyzing}
      />

      {/* Footer Decoration */}
      <div className="absolute bottom-10 right-10 text-[9px] text-neutral-800 font-mono z-0 flex flex-col items-end gap-1">
        <span>RENDER_ENGINE: CANVAS_2D</span>
        <span>FRAME_TIME: 16.6ms</span>
      </div>
    </div>
  );
};

export default App;