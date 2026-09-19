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
        <div className="bg-white p-4 rounded border border-paper-200 shadow-sm flex items-center justify-between">
          <div>
            <label className="text-sm font-semibold text-paper-900">{name}</label>
            {description && <p className="text-xs text-academic-muted mt-0.5">{description}</p>}
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs font-semibold">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onChange(e.target.checked)}
              className="w-4 h-4 rounded text-academic-navy focus:ring-0 accent-academic-navy"
            />
            <span>{isChecked ? 'Yes' : 'No'}</span>
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
        <div className="bg-white p-4 rounded border border-paper-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-semibold text-paper-900">{name}</label>
            {config?.unit && (
              <span className="text-xs font-mono text-academic-muted">{config.unit}</span>
            )}
          </div>
          {description && <p className="text-xs text-academic-muted mb-1">{description}</p>}
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
              placeholder={`Enter numeric value ${config?.unit ? `in ${config.unit}` : ''}...`}
              className="w-full border border-paper-300 rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-academic-accent bg-paper-50"
            />
            {config?.unit && (
              <span className="text-xs font-mono font-semibold text-paper-900">{config.unit}</span>
            )}
          </div>
        </div>
      );
    }

    case 'time': {
      return (
        <div className="bg-white p-4 rounded border border-paper-200 shadow-sm space-y-1.5">
          <label className="block text-sm font-semibold text-paper-900">{name}</label>
          {description && <p className="text-xs text-academic-muted mb-1">{description}</p>}
          <input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className="w-full sm:w-48 border border-paper-300 rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-academic-accent bg-paper-50"
          />
        </div>
      );
    }

    case 'duration': {
      return (
        <div className="bg-white p-4 rounded border border-paper-200 shadow-sm space-y-1.5">
          <div className="flex justify-between items-baseline">
            <label className="text-sm font-semibold text-paper-900">{name}</label>
            <span className="text-xs font-mono text-academic-muted">Format: HH:mm or mm:ss</span>
          </div>
          {description && <p className="text-xs text-academic-muted mb-1">{description}</p>}
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="e.g. 05:00 or 15 mins"
            className="w-full border border-paper-300 rounded px-3 py-2 text-sm font-mono focus:ring-1 focus:ring-academic-accent bg-paper-50"
          />
        </div>
      );
    }

    case 'text': {
      return (
        <div className="bg-white p-4 rounded border border-paper-200 shadow-sm space-y-1.5">
          <label className="block text-sm font-semibold text-paper-900">{name}</label>
          {description && <p className="text-xs text-academic-muted mb-1">{description}</p>}
          <textarea
            rows={2}
            value={value || ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            placeholder="Qualitative details..."
            className="w-full border border-paper-300 rounded p-3 text-sm font-sans focus:ring-1 focus:ring-academic-accent bg-paper-50"
          />
        </div>
      );
    }

    default:
      return null;
  }
};
