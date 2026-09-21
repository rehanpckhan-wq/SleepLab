import React from 'react';
import { EyeOff, Eye } from 'lucide-react';

interface SliderFieldProps {
  label: string;
  sublabel?: string;
  value: number;
  onChange: (val: number) => void;
  minLabel?: string;
  maxLabel?: string;
  min?: number;
  max?: number;
  isMuted?: boolean;
  onToggleMute?: () => void;
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
  isMuted = false,
  onToggleMute,
}) => {
  return (
    <div
      className={`p-4 rounded-lg border transition-all duration-200 space-y-2 ${
        isMuted
          ? 'bg-[var(--surface-raised)] border-[var(--border-default)] opacity-60'
          : 'bg-[var(--surface)] border-[var(--border-default)]'
      }`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <label
              className={`text-xs font-sans font-medium uppercase tracking-wider ${
                isMuted ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'
              }`}
            >
              {label}
            </label>

            {onToggleMute && (
              <button
                type="button"
                onClick={onToggleMute}
                title={isMuted ? 'Unmute metric' : 'Mute metric for today'}
                className={`p-1 rounded-md text-xs font-sans transition-colors flex items-center gap-1 ${
                  isMuted
                    ? 'bg-[var(--surface)] text-[var(--accent)] border border-[var(--border-default)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)]'
                }`}
              >
                {isMuted ? (
                  <>
                    <Eye className="w-3 h-3" />
                    <span className="text-[10px]">Unmute</span>
                  </>
                ) : (
                  <>
                    <EyeOff className="w-3 h-3" />
                    <span className="text-[10px] hidden group-hover:inline">Off</span>
                  </>
                )}
              </button>
            )}
          </div>
          {sublabel && (
            <p className={`text-xs mt-0.5 ${isMuted ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}`}>
              {sublabel}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-1 font-sans shrink-0">
          {isMuted ? (
            <span className="text-xs font-medium text-[var(--text-tertiary)] italic bg-[var(--surface)] px-2 py-0.5 rounded border border-[var(--border-default)]">
              Muted
            </span>
          ) : (
            <>
              <span className="text-lg font-semibold text-[var(--accent)]">{value}</span>
              <span className="text-xs text-[var(--text-tertiary)]">/ {max}</span>
            </>
          )}
        </div>
      </div>

      {!isMuted && (
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
      )}
    </div>
  );
};

