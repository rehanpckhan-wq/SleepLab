import React, { useState } from 'react';
import {
  getConfounderDefinitions,
  addConfounderDefinition,
  removeConfounderDefinition,
} from '@/lib/storage';
import { ShieldAlert, Plus, Trash2, X, AlertTriangle } from 'lucide-react';

interface ConfounderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfoundersChanged: (updatedList: string[]) => void;
}

export const ConfounderManagerModal: React.FC<ConfounderManagerModalProps> = ({
  isOpen,
  onClose,
  onConfoundersChanged,
}) => {
  const [list, setList] = useState<string[]>(getConfounderDefinitions());
  const [newFactorName, setNewFactorName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!newFactorName.trim()) {
      setErrorMsg('Factor name cannot be empty.');
      return;
    }
    if (list.includes(newFactorName.trim())) {
      setErrorMsg('This factor already exists.');
      return;
    }

    const updated = addConfounderDefinition(newFactorName.trim());
    setList(updated);
    setNewFactorName('');
    onConfoundersChanged(updated);
  };

  const handleRemove = (item: string) => {
    const updated = removeConfounderDefinition(item);
    setList(updated);
    onConfoundersChanged(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 font-sans">
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-[var(--warning)]" />
            <h2 className="text-lg font-serif font-normal text-[var(--text-primary)]">
              Manage Confounding Factors
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Add custom confounding variables (e.g. <i>Sauna, Cold Plunge, Jetlag</i>) or remove unwanted presets.
        </p>

        {errorMsg && (
          <div className="bg-[var(--danger-soft)] border border-[var(--danger)]/30 text-[var(--danger)] rounded-md p-2.5 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Add New Form */}
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={newFactorName}
            onChange={(e) => setNewFactorName(e.target.value)}
            placeholder="e.g. Infrared Sauna"
            className="flex-1 px-3 py-2 border border-[var(--border-default)] rounded-md text-xs bg-[var(--surface-raised)] text-[var(--text-primary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="px-3.5 py-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-xs font-medium rounded-md transition-colors flex items-center gap-1 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </form>

        {/* Active Confounders List */}
        <div className="max-h-60 overflow-y-auto divide-y divide-[var(--border-default)] border border-[var(--border-default)] rounded-md">
          {list.map((item) => (
            <div key={item} className="p-2.5 flex items-center justify-between text-xs hover:bg-[var(--surface-raised)] transition-colors">
              <span className="font-medium text-[var(--text-primary)]">{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                title={`Remove "${item}"`}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-2 border-t border-[var(--border-default)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] rounded-md text-xs font-medium text-[var(--text-primary)]"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
