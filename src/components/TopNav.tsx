'use client';

import React, { useState, useRef, useEffect } from 'react';
import { StudyProtocol, StudyStatus } from '@/types/sleeplab';
import { calculateEndDate, getStudyStatus } from '@/lib/storage';
import {
  PanelLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  PlusCircle,
  Check,
  FlaskConical,
} from 'lucide-react';
import { ViewMode } from './Sidebar';

interface TopNavProps {
  currentView: ViewMode;
  canGoBack: boolean;
  canGoForward: boolean;
  onGoBack: () => void;
  onGoForward: () => void;
  onOpenSidebar: () => void;
  onNavigate: (view: ViewMode) => void;
  activeStudy: StudyProtocol;
  allStudies: StudyProtocol[];
  onSelectStudy: (studyId: string) => void;
  onCreateNewStudy: () => void;
}

const VIEW_LABELS: Record<ViewMode, string> = {
  home: 'Overview',
  log: 'Log Today',
  history: 'Logs & Trends',
  reports: 'Reports Catalog',
  edit: 'Edit Records',
  export: 'Export Center',
  'report-detail': 'Daily Report Detail',
  'edit-form': 'Edit Observation Record',
};

export const TopNav: React.FC<TopNavProps> = ({
  currentView,
  canGoBack,
  canGoForward,
  onGoBack,
  onGoForward,
  onOpenSidebar,
  onNavigate,
  activeStudy,
  allStudies,
  onSelectStudy,
  onCreateNewStudy,
}) => {
  const [isStudyDropdownOpen, setIsStudyDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const status: StudyStatus = getStudyStatus(activeStudy.startDate, activeStudy.durationDays);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStudyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-[var(--canvas)] border-b border-[var(--border-default)] font-sans transition-colors duration-200 min-w-0">
      {/* Left Group: Sidebar Opener Hover Zone & Navigation */}
      <div className="flex items-center gap-1 sm:gap-2 min-w-0 shrink">
        <button
          onMouseEnter={onOpenSidebar}
          onClick={onOpenSidebar}
          className="p-1.5 sm:p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-lg transition-colors cursor-pointer flex items-center justify-center shrink-0"
          title="Hover or Click to Open Sidebar"
        >
          <PanelLeft className="w-4 sm:w-5 h-4 sm:h-5 text-[var(--accent)]" />
        </button>

        <div className="h-4 w-px bg-[var(--border-default)] mx-0.5 sm:mx-1 shrink-0" />

        {/* Back / Forward Navigation Controls */}
        <div className="hidden sm:flex items-center gap-0.5 shrink-0">
          <button
            onClick={onGoBack}
            disabled={!canGoBack}
            className={`p-1.5 rounded-md transition-colors ${
              canGoBack
                ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] cursor-pointer'
                : 'text-[var(--border-default)] cursor-not-allowed'
            }`}
            title="Go Back"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onGoForward}
            disabled={!canGoForward}
            className={`p-1.5 rounded-md transition-colors ${
              canGoForward
                ? 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] cursor-pointer'
                : 'text-[var(--border-default)] cursor-not-allowed'
            }`}
            title="Go Forward"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Breadcrumb Title */}
        <div className="flex items-center gap-1 text-xs font-medium text-[var(--text-secondary)] min-w-0 truncate">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-[var(--text-primary)] transition-colors cursor-pointer hidden md:inline shrink-0"
          >
            SleepLab
          </button>
          <span className="hidden md:inline shrink-0">/</span>
          <span className="text-[var(--text-primary)] font-semibold truncate whitespace-nowrap">
            {VIEW_LABELS[currentView]}
          </span>
        </div>
      </div>

      {/* Right Group: Active Study Selector Dropdown */}
      <div className="relative inline-block text-left shrink-0" ref={dropdownRef}>
        <button
          onClick={() => setIsStudyDropdownOpen(!isStudyDropdownOpen)}
          className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-xs transition-colors cursor-pointer max-w-[150px] xs:max-w-[200px] sm:max-w-xs"
        >
          <FlaskConical className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="font-medium text-[var(--text-primary)] truncate">
            {activeStudy.title}
          </span>
          <span
            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full shrink-0 hidden sm:inline-block ${
              status === 'Active'
                ? 'bg-[var(--success-soft)] text-[var(--success)]'
                : 'bg-[var(--surface)] text-[var(--text-tertiary)]'
            }`}
          >
            {status}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
        </button>

        {/* Multi-Study Switcher Menu */}
        {isStudyDropdownOpen && (
          <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-sm sm:w-96 rounded-xl bg-[var(--surface)] border border-[var(--border-default)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] font-sans">
            <div className="p-3 bg-[var(--surface-raised)] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
                Study Protocols ({allStudies.length})
              </span>
              <button
                onClick={() => {
                  setIsStudyDropdownOpen(false);
                  onCreateNewStudy();
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-md transition-colors shadow-xs cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" /> New Study
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-[var(--border-default)]">
              {allStudies.map((s) => {
                const isCurrent = s.id === activeStudy.id;
                const sStatus = getStudyStatus(s.startDate, s.durationDays);
                const sEnd = calculateEndDate(s.startDate, s.durationDays);

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectStudy(s.id);
                      setIsStudyDropdownOpen(false);
                    }}
                    className={`w-full p-3 text-left transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                      isCurrent ? 'bg-[var(--accent-soft)]' : 'hover:bg-[var(--surface-raised)]'
                    }`}
                  >
                    <div className="space-y-1 pr-2 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate">
                          {s.title}
                        </span>
                        {isCurrent && <Check className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />}
                      </div>

                      <p className="text-[11px] text-[var(--text-secondary)]">
                        {s.startDate} → {sEnd} ({s.durationDays}d)
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${
                        sStatus === 'Active'
                          ? 'bg-[var(--success-soft)] text-[var(--success)]'
                          : 'bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                      }`}
                    >
                      ● {sStatus}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
