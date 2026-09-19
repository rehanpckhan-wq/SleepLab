import React from 'react';

interface SliderFieldProps {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  minLabel?: string;
  maxLabel?: string;
  min?: number;
  max?: number;
}

export const SliderField: React.FC<SliderFieldProps> = ({
  label,
  sublabel,
  value,
  onChange,
  minLabel = 'Low / Poor (1)',
  maxLabel = 'High / Optimal (10)',
  min = 1,
  max = 10,
}) => {
  return (
    <div className="bg-white p-4 rounded border border-paper-200 shadow-sm space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <label className="text-sm font-semibold text-paper-900 tracking-wide">{label}</label>
          {sublabel && <p className="text-xs text-academic-muted mt-0.5">{sublabel}</p>}
        </div>
        <div className="flex items-center space-x-1">
          <span className="font-mono text-lg font-bold text-academic-accent">{value}</span>
          <span className="text-xs text-academic-muted">/ {max}</span>
        </div>
      </div>

      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-paper-100 rounded-lg appearance-none cursor-pointer accent-academic-accent border border-paper-200 focus:outline-none focus:ring-1 focus:ring-academic-accent"
        />
        <div className="flex justify-between text-[11px] font-mono text-academic-muted mt-1.5">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
};
