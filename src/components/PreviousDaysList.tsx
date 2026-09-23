import React, { useState, useMemo, useRef, useEffect } from 'react';
import { DailyEntry, StudyConfig, StudyProtocol } from '@/types/sleeplab';
import { deleteEntryAsync, seedSampleData, generateReportId } from '@/lib/storage';
import {
  Calendar,
  Clock,
  Award,
  Edit3,
  Trash2,
  Database,
  AlertTriangle,
  FileText,
  Printer,
  ArrowRightLeft,
  ArrowUpDown,
  Filter,
  Search,
  Check,
  X,
  FlaskConical,
  ChevronDown,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface PreviousDaysListProps {
  entries: DailyEntry[];
  allStudies?: StudyProtocol[];
  activeStudyId?: string;
  userId?: string | null;
  studyConfig?: StudyConfig;
  onSelectEntry: (entry: DailyEntry, isMaximized?: boolean) => void;
  onViewReport: (entry: DailyEntry, isMaximized?: boolean) => void;
  onReassignEntryStudy?: (entryId: string, targetStudyId: string) => void;
  onEntriesChanged: () => void;
  onNewLogClick: () => void;
  onOpenExportDialog?: () => void;
}

type SortOption = 'newest' | 'oldest' | 'highest_recovery' | 'lowest_recovery' | 'longest_sleep';
type ConfounderFilter = 'all' | 'with_confounders' | 'clean';
type DayTypeFilter = 'all' | 'weekdays' | 'weekends';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest → Oldest',
  oldest: 'Oldest → Newest',
  highest_recovery: 'Highest Recovery Index',
  lowest_recovery: 'Lowest Recovery Index',
  longest_sleep: 'Longest Sleep Duration',
};

const CONFOUNDER_LABELS: Record<ConfounderFilter, string> = {
  all: 'Confounders: All',
  with_confounders: 'With Confounders',
  clean: 'Clean Days (No Confounders)',
};

const DAY_TYPE_LABELS: Record<DayTypeFilter, string> = {
  all: 'All Days',
  weekdays: 'Weekdays Only (Mon–Fri)',
  weekends: 'Weekends Only (Sat–Sun)',
};

export const PreviousDaysList: React.FC<PreviousDaysListProps> = ({
  entries,
  allStudies = [],
  activeStudyId,
  userId,
  studyConfig,
  onSelectEntry,
  onViewReport,
  onReassignEntryStudy,
  onEntriesChanged,
  onNewLogClick,
  onOpenExportDialog,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [movingEntryId, setMovingEntryId] = useState<string | null>(null);

  // Sorting & Filtering States
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [confounderFilter, setConfounderFilter] = useState<ConfounderFilter>('all');
  const [dayTypeFilter, setDayTypeFilter] = useState<DayTypeFilter>('all');
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Dropdown Popover States
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isConfounderOpen, setIsConfounderOpen] = useState(false);
  const [isDayTypeOpen, setIsDayTypeOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const confounderRef = useRef<HTMLDivElement>(null);
  const dayTypeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
      if (confounderRef.current && !confounderRef.current.contains(e.target as Node)) setIsConfounderOpen(false);
      if (dayTypeRef.current && !dayTypeRef.current.contains(e.target as Node)) setIsDayTypeOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteEntryAsync(id, userId);
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
    setDeleteConfirmId(null);
    onEntriesChanged();
  };

  const handleSeedData = () => {
    seedSampleData();
    onEntriesChanged();
  };

  const formatDateLabel = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const dateObj = new Date(year, month - 1, day);
      return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Filter & Sort Processed Entries
  const processedEntries = useMemo(() => {
    let result = [...entries];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const digitsOnly = q.replace(/\D/g, '');

      result = result.filter((e) => {
        // 1. Raw date (YYYY-MM-DD) & Formatted date (e.g., "Sep 20, 2026", "September")
        const rawDate = e.date.toLowerCase();
        const formattedDate = formatDateLabel(e.date).toLowerCase();

        // 2. Report ID (e.g. "SL-2026-005" or "005")
        const reportId = (e.reportId || generateReportId(e.date, e.dayNumber)).toLowerCase();

        // 3. Day number variations ("day 1", "day1", "d1", "1")
        const dayStr = e.dayNumber.toString();
        const matchesDayNumber =
          dayStr === q ||
          `day ${dayStr}` === q ||
          `day${dayStr}` === q ||
          `d${dayStr}` === q ||
          (digitsOnly !== '' && dayStr === digitsOnly && (q.startsWith('day') || q.startsWith('d')));

        // 4. Notes excerpt
        const notes = (e.evening.notes || '').toLowerCase();

        // 5. Confounders list
        const confoundersStr = e.confounders.join(' ').toLowerCase();

        // 6. Custom metrics names & values
        const customMetricsStr = Object.entries(e.additionalMetrics || {})
          .map(([k, v]) => `${k} ${v}`)
          .join(' ')
          .toLowerCase();

        return (
          rawDate.includes(q) ||
          formattedDate.includes(q) ||
          reportId.includes(q) ||
          matchesDayNumber ||
          notes.includes(q) ||
          confoundersStr.includes(q) ||
          customMetricsStr.includes(q)
        );
      });
    }

    // Confounder filter
    if (confounderFilter === 'with_confounders') {
      result = result.filter((e) => e.confounders && e.confounders.length > 0);
    } else if (confounderFilter === 'clean') {
      result = result.filter((e) => !e.confounders || e.confounders.length === 0);
    }

    // Day-type filter (Weekdays vs Weekends)
    if (dayTypeFilter !== 'all') {
      result = result.filter((e) => {
        try {
          const [year, month, day] = e.date.split('-').map(Number);
          const dayOfWeek = new Date(year, month - 1, day).getDay(); // 0 = Sun, 6 = Sat
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          return dayTypeFilter === 'weekends' ? isWeekend : !isWeekend;
        } catch {
          return true;
        }
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') return b.date.localeCompare(a.date);
      if (sortBy === 'oldest') return a.date.localeCompare(b.date);
      if (sortBy === 'highest_recovery')
        return (b.calculatedMetrics?.recoveryIndexScore || 0) - (a.calculatedMetrics?.recoveryIndexScore || 0);
      if (sortBy === 'lowest_recovery')
        return (a.calculatedMetrics?.recoveryIndexScore || 0) - (b.calculatedMetrics?.recoveryIndexScore || 0);
      if (sortBy === 'longest_sleep')
        return (b.calculatedMetrics?.totalSleepMinutes || 0) - (a.calculatedMetrics?.totalSleepMinutes || 0);
      return 0;
    });

    return result;
  }, [entries, searchQuery, confounderFilter, dayTypeFilter, sortBy]);

  if (entries.length === 0) {
    return (
      <div className="bg-[var(--surface)] rounded-lg border border-[var(--border-default)] p-8 text-center space-y-4 my-6 shadow-sm font-sans">
        <div className="w-12 h-12 bg-[var(--surface-raised)] rounded-full flex items-center justify-center mx-auto text-[var(--text-tertiary)]">
          <Calendar className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-serif font-normal text-[var(--text-primary)]">No Experiment Entries for This Study</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md mx-auto">
            You haven&apos;t logged any daily observations under <strong className="text-[var(--text-primary)]">&quot;{studyConfig?.title || 'Active Study'}&quot;</strong> yet.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onNewLogClick}
            className="px-5 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-md hover:bg-[var(--accent-hover)] transition-colors shadow-sm"
          >
            Log Day 1 Observations
          </button>
          <button
            onClick={handleSeedData}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--surface-raised)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs rounded-md hover:bg-[var(--border-default)] transition-colors"
          >
            <Database className="w-3.5 h-3.5 text-[var(--text-tertiary)]" /> Load Demo Data
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={
      isMaximized
        ? "fixed inset-0 z-50 bg-[var(--surface)] p-6 md:p-8 overflow-y-auto font-sans text-[var(--text-primary)] transition-all duration-200"
        : "space-y-4 my-6 font-sans"
    }>
      {/* HEADER STRIP */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[var(--border-default)] pb-4 gap-3">
        <div>
          <h2 className="text-xl font-serif font-normal text-[var(--text-primary)]">Logged Experiment Days</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Observations for protocol: <strong className="text-[var(--text-primary)]">&quot;{studyConfig?.title}&quot;</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenExportDialog && (
            <button
              onClick={onOpenExportDialog}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--accent)]" /> Export Combined PDF
            </button>
          )}
          <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface-raised)] px-2.5 py-1.5 rounded-full border border-[var(--border-default)]">
            {entries.length} of {studyConfig?.durationDays || 30} Days Logged
          </span>
          <button
            type="button"
            onClick={() => setIsMaximized((prev) => !prev)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] border border-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md transition-colors shadow-xs"
            title={isMaximized ? 'Restore Page View' : 'Maximize Fullscreen View'}
          >
            {isMaximized ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Restore View
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-[var(--accent)]" /> Maximize View
              </>
            )}
          </button>
        </div>
      </div>

      {/* SEARCH, SORT & FILTER CONTROL BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[var(--surface-raised)] p-3 rounded-lg border border-[var(--border-default)]">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[var(--text-tertiary)] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, dates (e.g. Sep 20), report ID (e.g. 005), day (e.g. day 1), or confounders..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border-default)] rounded-md focus:ring-1 focus:ring-[var(--accent)] outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Custom Styled Filter & Sort Popover Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Custom Sort Popover */}
          <div className="relative" ref={sortRef}>
            <button
              onClick={() => {
                setIsSortOpen(!isSortOpen);
                setIsConfounderOpen(false);
                setIsDayTypeOpen(false);
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
                isSortOpen || sortBy !== 'newest'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-medium'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{SORT_LABELS[sortBy]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>

            {isSortOpen && (
              <div className="absolute right-0 sm:left-0 mt-2 w-56 rounded-xl bg-[var(--surface)] border border-[var(--border-default)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] text-xs">
                <div className="p-2 bg-[var(--surface-raised)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Sort Entries By
                </div>
                <div className="p-1 space-y-0.5">
                  {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setSortBy(opt);
                        setIsSortOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                        sortBy === opt
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                          : 'hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{SORT_LABELS[opt]}</span>
                      {sortBy === opt && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Day-Type Filter Popover (Weekdays vs Weekends) */}
          <div className="relative" ref={dayTypeRef}>
            <button
              onClick={() => {
                setIsDayTypeOpen(!isDayTypeOpen);
                setIsSortOpen(false);
                setIsConfounderOpen(false);
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
                isDayTypeOpen || dayTypeFilter !== 'all'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-medium'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{DAY_TYPE_LABELS[dayTypeFilter]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>

            {isDayTypeOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[var(--surface)] border border-[var(--border-default)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] text-xs">
                <div className="p-2 bg-[var(--surface-raised)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Filter Day Type
                </div>
                <div className="p-1 space-y-0.5">
                  {(Object.keys(DAY_TYPE_LABELS) as DayTypeFilter[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setDayTypeFilter(opt);
                        setIsDayTypeOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                        dayTypeFilter === opt
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                          : 'hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{DAY_TYPE_LABELS[opt]}</span>
                      {dayTypeFilter === opt && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Custom Confounder Filter Popover */}
          <div className="relative" ref={confounderRef}>
            <button
              onClick={() => {
                setIsConfounderOpen(!isConfounderOpen);
                setIsSortOpen(false);
                setIsDayTypeOpen(false);
              }}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border transition-colors shrink-0 ${
                isConfounderOpen || confounderFilter !== 'all'
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]/30 font-medium'
                  : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--border-default)] hover:bg-[var(--surface-raised)]'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>{CONFOUNDER_LABELS[confounderFilter]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
            </button>

            {isConfounderOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[var(--surface)] border border-[var(--border-default)] shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] text-xs">
                <div className="p-2 bg-[var(--surface-raised)] text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Filter Confounders
                </div>
                <div className="p-1 space-y-0.5">
                  {(Object.keys(CONFOUNDER_LABELS) as ConfounderFilter[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => {
                        setConfounderFilter(opt);
                        setIsConfounderOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center justify-between ${
                        confounderFilter === opt
                          ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                          : 'hover:bg-[var(--surface-raised)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{CONFOUNDER_LABELS[opt]}</span>
                      {confounderFilter === opt && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* FILTER RESULTS FEEDBACK */}
      {processedEntries.length === 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg p-6 text-center text-xs text-[var(--text-secondary)] space-y-1">
          <p className="font-medium text-[var(--text-primary)]">No matching experiment entries found.</p>
          <p className="text-[var(--text-tertiary)]">Try resetting your search query or filter settings.</p>
        </div>
      )}

      {/* LEDGER JOURNAL ROW LAYOUT */}
      <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-lg divide-y divide-[var(--border-default)] overflow-hidden shadow-sm">
        {processedEntries.map((entry) => {
          const isDeletingThis = deleteConfirmId === entry.id;
          const isMovingThis = movingEntryId === entry.id;

          return (
            <div
              key={entry.id}
              onClick={() => onViewReport(entry)}
              className="p-4 hover:bg-[var(--surface-raised)] transition-colors cursor-pointer group relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-xs font-medium px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
                      Day {entry.dayNumber}
                    </span>
                    <span className="font-medium text-xs text-[var(--text-primary)]">
                      {formatDateLabel(entry.date)}
                    </span>
                    <span className="font-mono text-[11px] text-[var(--text-tertiary)]">
                      ID: {entry.reportId || generateReportId(entry.date, entry.dayNumber)}
                    </span>
                  </div>

                  {/* Notes / Narrative excerpt */}
                  {entry.evening.notes ? (
                    <p className="font-serif text-xs text-[var(--text-secondary)] line-clamp-1 italic pt-0.5">
                      &quot;{entry.evening.notes}&quot;
                    </p>
                  ) : null}

                  {/* Details row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-secondary)] pt-1">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                      <span>{entry.calculatedMetrics.totalSleepFormatted} sleep</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span>
                        Recovery Index: <strong className="text-[var(--text-primary)] font-medium">{entry.calculatedMetrics.recoveryIndexScore}/50</strong> ({entry.calculatedMetrics.recoveryIndexPercentage}%)
                      </span>
                    </div>

                    {entry.confounders.length > 0 && (
                      <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                        <span>Confounders: {entry.confounders.slice(0, 2).join(', ')}{entry.confounders.length > 2 && ` +${entry.confounders.length - 2}`}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTON GROUP */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 justify-end">
                  {isDeletingThis ? (
                    <div className="flex items-center gap-2 bg-[var(--danger-soft)] p-1.5 rounded-md border border-[var(--danger)]/30">
                      <span className="text-xs text-[var(--danger)] flex items-center gap-1 font-medium">
                        <AlertTriangle className="w-3 h-3" /> Delete?
                      </span>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="px-2.5 py-0.5 bg-[var(--danger)] text-white text-xs rounded-md hover:bg-[var(--danger)]/90"
                      >
                        Yes
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(null);
                        }}
                        className="px-2.5 py-0.5 bg-[var(--surface)] text-[var(--text-primary)] text-xs rounded-md border border-[var(--border-default)]"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Move to Study Button & Styled Popover */}
                      {onReassignEntryStudy && allStudies.length > 1 && (
                        <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setMovingEntryId(isMovingThis ? null : entry.id)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                              isMovingThis
                                ? 'bg-[var(--accent)] text-white border-transparent'
                                : 'bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-default)]'
                            }`}
                            title="Reassign to another study protocol"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Move</span>
                          </button>

                          {/* Styled Claude-Inspired Study Picker Popover */}
                          {isMovingThis && (
                            <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] text-xs">
                              <div className="p-3 bg-[var(--surface-raised)] flex items-center justify-between">
                                <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
                                  <FlaskConical className="w-3.5 h-3.5 text-[var(--accent)]" /> Move Entry to Study:
                                </span>
                                <button
                                  onClick={() => setMovingEntryId(null)}
                                  className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] p-0.5"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="max-h-56 overflow-y-auto divide-y divide-[var(--border-default)]">
                                {allStudies.map((targetStudy) => {
                                  const isCurrentStudy = targetStudy.id === (entry.studyId || activeStudyId);
                                  return (
                                    <button
                                      key={targetStudy.id}
                                      disabled={isCurrentStudy}
                                      onClick={() => {
                                        onReassignEntryStudy(entry.id, targetStudy.id);
                                        setMovingEntryId(null);
                                      }}
                                      className={`w-full p-3 text-left transition-colors flex items-center justify-between gap-2 ${
                                        isCurrentStudy
                                          ? 'bg-[var(--surface-raised)] opacity-60 cursor-default'
                                          : 'hover:bg-[var(--accent-soft)] hover:text-[var(--accent)]'
                                      }`}
                                    >
                                      <div>
                                        <p className="font-semibold text-[var(--text-primary)] line-clamp-1">
                                          {targetStudy.title}
                                        </p>
                                        <p className="text-[11px] text-[var(--text-tertiary)]">
                                          Starts {targetStudy.startDate} ({targetStudy.durationDays}d)
                                        </p>
                                      </div>
                                      {isCurrentStudy && (
                                        <span className="text-[10px] text-[var(--text-tertiary)] font-medium px-2 py-0.5 rounded bg-[var(--surface-raised)] border border-[var(--border-default)] shrink-0">
                                          Current
                                        </span>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewReport(entry, isMaximized);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-primary)] text-xs font-medium rounded-md border border-[var(--border-default)] transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-[var(--accent)]" /> View Report
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEntry(entry, isMaximized);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-[var(--surface-raised)] hover:bg-[var(--border-default)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs rounded-md border border-[var(--border-default)] transition-colors"
                        title="Edit raw entry"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmId(entry.id);
                        }}
                        className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] hover:bg-[var(--danger-soft)] rounded-md transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};


