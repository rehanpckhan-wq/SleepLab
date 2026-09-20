import React, { useState } from 'react';
import { CustomMetricDefinition, CustomMetricType } from '@/types/sleeplab';
import { saveCustomMetricDefinitionAsync } from '@/lib/storage';
import { PlusCircle, Save, X, AlertCircle, Loader2 } from 'lucide-react';

interface CustomMetricBuilderProps {
  initialMetric?: CustomMetricDefinition | null;
  userId?: string | null;
  onSave: (metric: CustomMetricDefinition) => void;
  onCancel: () => void;
}

export const CustomMetricBuilder: React.FC<CustomMetricBuilderProps> = ({
  initialMetric,
  userId,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(initialMetric?.name || '');
  const [type, setType] = useState<CustomMetricType>(initialMetric?.type || 'slider');
  const [description, setDescription] = useState(initialMetric?.description || '');

  // Config options
  const [min, setMin] = useState<number>(initialMetric?.config?.min ?? 1);
  const [max, setMax] = useState<number>(initialMetric?.config?.max ?? 10);
  const [step, setStep] = useState<number>(initialMetric?.config?.step ?? 1);
  const [unit, setUnit] = useState<string>(initialMetric?.config?.unit || '');

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setErrorMsg('Metric Name is required.');
      return;
    }

    if (type === 'slider' || type === 'number') {
      if (min >= max) {
        setErrorMsg('Minimum value must be strictly less than Maximum value.');
        return;
      }
      if (step <= 0) {
        setErrorMsg('Step size must be greater than zero.');
        return;
      }
    }

    setIsSaving(true);
    const metricToSave: CustomMetricDefinition = {
      id: initialMetric?.id || `metric_${Date.now()}`,
      name: name.trim(),
      type,
      description: description.trim() || undefined,
      config:
        type === 'slider' || type === 'number'
          ? {
              min: Number(min),
              max: Number(max),
              step: Number(step),
              unit: unit.trim() || undefined,
            }
          : unit.trim()
          ? { unit: unit.trim() }
          : undefined,
      active: initialMetric?.active ?? true,
      order: initialMetric?.order ?? 99,
      createdAt: initialMetric?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await saveCustomMetricDefinitionAsync(metricToSave, userId);
    setIsSaving(false);
    onSave(metricToSave);
  };

  return (
    <div className="fixed inset-0 z-50 bg-paper-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-paper-300 max-w-lg w-full p-6 space-y-5 shadow-xl font-sans">
        <div className="flex items-center justify-between border-b border-paper-200 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-academic-navy" />
            <h3 className="text-lg font-serif font-bold text-paper-900">
              {initialMetric ? 'Edit Custom Metric' : 'Create Custom Metric'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-academic-muted hover:text-paper-900 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-paper-900 mb-1">
              Metric Name <span className="text-rose-600">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. Cold Shower Duration, Perceived Stress, Creatine Taken..."
              className="w-full border border-paper-300 rounded px-3 py-2 text-sm font-sans focus:ring-1 focus:ring-academic-accent bg-paper-50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-paper-900 mb-1">
              Measurement Input Type <span className="text-rose-600">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CustomMetricType)}
              className="w-full border border-paper-300 rounded px-3 py-2 text-sm font-sans focus:ring-1 focus:ring-academic-accent bg-paper-50"
            >
              <option value="checkbox">Checkbox (Binary Yes / No)</option>
              <option value="slider">Slider (Subjective scale 1–10)</option>
              <option value="number">Number (Numerical value e.g. mg, kg, °C)</option>
              <option value="time">Time (Clock time e.g. 16:30)</option>
              <option value="duration">Duration (Elapsed time e.g. 05:00)</option>
              <option value="text">Text (Multiline qualitative notes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-paper-900 mb-1">
              Description (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Subtle context shown under metric when logging..."
              className="w-full border border-paper-300 rounded px-3 py-2 text-sm font-sans focus:ring-1 focus:ring-academic-accent bg-paper-50"
            />
          </div>

          {/* Type-Specific Configuration */}
          {(type === 'slider' || type === 'number') && (
            <div className="bg-paper-50 border border-paper-200 rounded p-4 space-y-3">
              <span className="block text-xs font-mono font-semibold text-academic-slate uppercase tracking-wider">
                Numeric Configuration
              </span>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-paper-900 mb-1">Minimum</label>
                  <input
                    type="number"
                    value={min}
                    onChange={(e) => setMin(Number(e.target.value))}
                    className="w-full border border-paper-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-paper-900 mb-1">Maximum</label>
                  <input
                    type="number"
                    value={max}
                    onChange={(e) => setMax(Number(e.target.value))}
                    className="w-full border border-paper-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-paper-900 mb-1">Step</label>
                  <input
                    type="number"
                    value={step}
                    onChange={(e) => setStep(Number(e.target.value))}
                    className="w-full border border-paper-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-paper-900 mb-1">
                  Unit Label (Optional, e.g. mg, °C, mins)
                </label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="e.g. mg, kg, °C"
                  className="w-full border border-paper-300 rounded px-2.5 py-1.5 text-xs font-mono bg-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-paper-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-paper-300 rounded text-xs font-sans font-medium text-paper-900 hover:bg-paper-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-academic-navy text-white text-xs font-mono font-semibold rounded hover:bg-academic-slate transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" /> Save Metric
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
