import React from 'react';
import { CustomMetricDefinition } from '@/types/sleeplab';
import { SliderField } from './SliderField';

interface CustomMetricInputProps {
  definition: CustomMetricDefinition;
  value: any;
  onChange: (newValue: any) => void;
}

export const CustomMetricInput: React.FC<CustomMetricInputProps> = ({
  definition,
  value,
  onChange,
}) => {
  const { name, type, description, config } = definition;

  switch (type) {
    case 'checkbox': {
      const isChecked = value === true;
      return (
        <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] flex items-center justify-between">
          <div>
            <label className="text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{name}</label>
            {description && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded text-[var(--accent)] focus:ring-0 accent-[var(--accent)]"
            />
            <span className="text-[var(--text-primary)]">{isChecked ? 'Yes' : 'No'}</span>
          </label>
        </div>
      );
    }

    case 'slider': {
      const min = config?.min ?? 1;
      const max = config?.max ?? 10;
      const currentValue = typeof value === 'number' ? value : Math.round((min + max) / 2);

      return (
        <SliderField
          label={name + (config?.unit ? ` (${config.unit})` : '')}
          sublabel={description}
          value={currentValue}
          min={min}
          max={max}
          minLabel={`Min (${min})`}
          maxLabel={`Max (${max})`}
          onChange={(val) => onChange(val)}
        />
      );
    }

    case 'number': {
      return (
        <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{name}</label>
            {config?.unit && (
              <span className="text-xs font-sans text-[var(--text-tertiary)]">{config.unit}</span>
            )}
          </div>
          {description && <p className="text-xs text-[var(--text-secondary)] mb-1">{description}</p>}
          <div className="flex items-center gap-2">
            <input
              type="number"
              step={config?.step || 'any'}
              min={config?.min}
              max={config?.max}
              value={value !== undefined && value !== null ? value : ''}
              onChange={(e) => {
                const valStr = e.target.value;
                onChange(valStr === '' ? undefined : parseFloat(valStr));
              }}
              placeholder={`Enter value ${config?.unit ? `in ${config.unit}` : ''}...`}
              className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            />
            {config?.unit && (
              <span className="text-xs font-sans font-medium text-[var(--text-primary)]">{config.unit}</span>
            )}
          </div>
        </div>
      );
    }

    case 'time': {
      return (
        <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] space-y-1.5">
          <label className="block text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{name}</label>
          {description && <p className="text-xs text-[var(--text-secondary)] mb-1">{description}</p>}
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full sm:w-48 border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
      );
    }

    case 'duration': {
      return (
        <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{name}</label>
            <span className="text-xs font-sans text-[var(--text-tertiary)]">Format: HH:mm or mm:ss</span>
          </div>
          {description && <p className="text-xs text-[var(--text-secondary)] mb-1">{description}</p>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="e.g. 05:00 or 15 mins"
            className="w-full border border-[var(--border-default)] rounded-md px-3 py-2 text-xs font-sans bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
      );
    }

    case 'text': {
      return (
        <div className="bg-[var(--surface)] p-4 rounded-lg border border-[var(--border-default)] space-y-1.5">
          <label className="block text-xs font-sans font-medium text-[var(--text-primary)] uppercase tracking-wider">{name}</label>
          {description && <p className="text-xs text-[var(--text-secondary)] mb-1">{description}</p>}
          <textarea
            rows={2}
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="Qualitative details..."
            className="w-full border border-[var(--border-default)] rounded-md p-3 text-xs font-serif bg-[var(--surface-raised)] text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent-soft)]"
          />
        </div>
      );
    }

    default:
      return null;
  }
};
