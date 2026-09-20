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
    <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] space-y-2">
      <div className="flex justify-between items-baseline">
        <div>
          <label className="text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{label}</label>
          {sublabel && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{sublabel}</p>}
        </div>
        <div className="flex items-center space-x-1 font-sans">
          <span className="text-lg font-semibold text-[var(--accent)]">{value}</span>
          <span className="text-xs text-[var(--text-tertiary)]">/ {max}</span>
        </div>
      </div>

      <div className="relative pt-1">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-[var(--surface-raised)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] border border-[var(--border-default)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
        <div className="flex justify-between text-[11px] font-sans text-[var(--text-tertiary)] mt-1.5">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    </div>
  );
};
