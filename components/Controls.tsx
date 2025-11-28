
import React from 'react';
import { SimulationConfig } from '../types';

interface ControlsProps {
  config: SimulationConfig;
  onChange: (newConfig: SimulationConfig) => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const Controls: React.FC<ControlsProps> = ({ config, onChange, onUpload, onAnalyze, isAnalyzing }) => {
  const handleChange = (key: keyof SimulationConfig, value: number) => {
    onChange({ ...config, [key]: value });
  };

  return (
    <div className="absolute top-6 right-6 w-72 bg-black/60 backdrop-blur-xl border border-white/10 p-6 text-[10px] font-mono text-neutral-400 z-10 shadow-2xl rounded-sm">
      <div className="mb-8 border-b border-white/10 pb-2 flex justify-between items-end">
        <h2 className="uppercase tracking-[0.2em] text-white font-bold">Parameters</h2>
        <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-emerald-500">ACTIVE</span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Base Amplitude */}
        <div className="group">
          <label className="flex justify-between mb-2 text-neutral-500 group-hover:text-white transition-colors uppercase tracking-wider">
            <span>Base State (Rest)</span>
            <span>{config.amplitude.toFixed(0)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.amplitude}
            onChange={(e) => handleChange('amplitude', Number(e.target.value))}
            className="w-full h-px bg-neutral-800 appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-colors"
          />
        </div>

        {/* Hover Amplitude (Reveal) */}
        <div className="group">
          <label className="flex justify-between mb-2 text-neutral-500 group-hover:text-white transition-colors uppercase tracking-wider">
            <span>Reveal State (Active)</span>
            <span>{config.hoverAmplitude || 150}</span>
          </label>
          <input
            type="range"
            min="50"
            max="400"
            value={config.hoverAmplitude || 150}
            onChange={(e) => handleChange('hoverAmplitude', Number(e.target.value))}
            className="w-full h-px bg-neutral-800 appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-colors"
          />
        </div>

        {/* Resolution */}
        <div className="group">
          <label className="flex justify-between mb-2 text-neutral-500 group-hover:text-white transition-colors uppercase tracking-wider">
            <span>Grid Density</span>
            <span>{config.resolution}</span>
          </label>
          <input
            type="range"
            min="40"
            max="200"
            step="10"
            value={config.resolution}
            onChange={(e) => handleChange('resolution', Number(e.target.value))}
            className="w-full h-px bg-neutral-800 appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-colors"
          />
        </div>

        {/* Magnetic Field */}
        <div className="group">
          <label className="flex justify-between mb-2 text-neutral-500 group-hover:text-white transition-colors uppercase tracking-wider">
            <span>Magnetism</span>
            <span>{config.mouseStrength.toFixed(0)}</span>
          </label>
          <input
            type="range"
            min="-100"
            max="100"
            value={config.mouseStrength}
            onChange={(e) => handleChange('mouseStrength', Number(e.target.value))}
            className="w-full h-px bg-neutral-800 appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-colors"
          />
        </div>

        {/* Rainbow Intensity */}
        <div className="group">
          <label className="flex justify-between mb-2 text-neutral-500 group-hover:text-white transition-colors uppercase tracking-wider">
            <span>Spectral Intensity</span>
            <span>{config.rainbowIntensity ?? 85}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={config.rainbowIntensity ?? 85}
            onChange={(e) => handleChange('rainbowIntensity', Number(e.target.value))}
            className="w-full h-px bg-neutral-800 appearance-none cursor-pointer accent-white hover:accent-emerald-400 transition-colors"
          />
        </div>

        <div className="pt-6 border-t border-white/10 space-y-3">
            <div className="relative group">
                 <input 
                    type="file" 
                    id="file-upload" 
                    className="hidden" 
                    accept="image/*"
                    onChange={onUpload}
                />
                <label 
                    htmlFor="file-upload"
                    className="flex items-center justify-center w-full py-3 border border-neutral-800 hover:border-white hover:bg-white/5 transition-all cursor-pointer text-neutral-500 group-hover:text-white uppercase tracking-widest text-[9px]"
                >
                    Load Topology Source
                </label>
            </div>

            <button
                onClick={onAnalyze}
                disabled={isAnalyzing}
                className="block w-full text-center py-3 bg-white text-black hover:bg-neutral-200 transition-all uppercase tracking-widest text-[9px] disabled:opacity-50"
            >
                {isAnalyzing ? "Processing..." : "Generate Critique"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default Controls;
