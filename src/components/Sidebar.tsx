'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  ListFilter,
  FileText,
  SquarePen,
  Download,
  User,
  Cloud,
  Settings,
  Sliders,
  Moon,
  Sun,
  LogOut,
  ChevronUp,
  FlaskConical,
  PanelLeftClose,
  AlertTriangle,
  X,
} from 'lucide-react';
import { InstallPWA } from './InstallPWA';

export type ViewMode = 'home' | 'log' | 'history' | 'reports' | 'edit' | 'export' | 'report-detail' | 'edit-form';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isOpen: boolean;
  onCloseSidebar: () => void;
  onMouseEnterSidebar: () => void;
  userEmail?: string | null;
  activeStudyTitle: string;
  totalEntriesCount: number;
  onOpenAuthModal: () => void;
  onOpenStudySettings: () => void;
  onOpenSchemaEditor: () => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onCloseSidebar,
  onMouseEnterSidebar,
  userEmail,
  activeStudyTitle,
  totalEntriesCount,
  onOpenAuthModal,
  onOpenStudySettings,
  onOpenSchemaEditor,
  onSignOut,
  theme,
  onToggleTheme,
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  const displayUsername = userEmail ? userEmail.split('@')[0] : 'Guest User';
  const initial = displayUsername.charAt(0).toUpperCase();

  const handleProfileMouseEnter = () => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current);
      profileCloseTimerRef.current = null;
    }
    setIsProfileMenuOpen(true);
  };

  const handleProfileMouseLeave = () => {
    if (profileCloseTimerRef.current) {
      clearTimeout(profileCloseTimerRef.current);
    }
    profileCloseTimerRef.current = setTimeout(() => {
      setIsProfileMenuOpen(false);
    }, 500); // 0.5 sec buffer window
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (profileCloseTimerRef.current) {
        clearTimeout(profileCloseTimerRef.current);
      }
    };
  }, []);

  const navItems: { view: ViewMode; label: string; icon: React.ReactNode; badge?: string | number }[] = [
    { view: 'home', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'history', label: 'Logs & Trends', icon: <ListFilter className="w-4 h-4" />, badge: totalEntriesCount },
    { view: 'reports', label: 'Reports Catalog', icon: <FileText className="w-4 h-4" /> },
    { view: 'edit', label: 'Edit Records', icon: <SquarePen className="w-4 h-4" /> },
    { view: 'export', label: 'Export Center', icon: <Download className="w-4 h-4" /> },
  ];

  return (
    <>
      {/* Backdrop overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-2xs z-40 transition-opacity"
          onClick={onCloseSidebar}
        />
      )}

      {/* Floating Overlay Sidebar Drawer */}
      <aside
        onMouseEnter={onMouseEnterSidebar}
        onMouseLeave={onCloseSidebar}
        className={`fixed top-0 left-0 bottom-0 h-screen w-72 bg-[var(--surface-raised)] border-r border-[var(--border-default)] shadow-2xl z-50 flex flex-col font-sans transition-transform duration-250 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Header / Brand */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-default)] shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-soft)] flex items-center justify-center shrink-0 border border-[var(--accent)]/20">
              <FlaskConical className="w-4 h-4 text-[var(--accent)]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-[var(--text-primary)] truncate">SleepLab</span>
              <span className="text-[10px] text-[var(--text-tertiary)] truncate">{activeStudyTitle}</span>
            </div>
          </div>

          <button
            onClick={onCloseSidebar}
            className="p-1.5 rounded-md text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)] transition-colors cursor-pointer"
            title="Close Sidebar"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Action Button ("+ Log Today") */}
        <div className="p-3 shrink-0">
          <button
            onClick={() => {
              onNavigate('log');
              onCloseSidebar();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all shadow-xs cursor-pointer ${
              currentView === 'log'
                ? 'bg-[var(--accent)] text-white shadow-md'
                : 'bg-[var(--surface)] hover:bg-[var(--border-default)] text-[var(--text-primary)] border border-[var(--border-default)]'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>+ Log Today</span>
          </button>
        </div>

        {/* Navigation Items - Scrollable Middle Body */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = currentView === item.view || (item.view === 'reports' && currentView === 'report-detail');
            return (
              <button
                key={item.view}
                onClick={() => {
                  onNavigate(item.view);
                  onCloseSidebar();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="shrink-0">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--surface)] text-[var(--text-tertiary)] font-mono border border-[var(--border-default)]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Pinned Bottom Profile & Settings Section */}
        <div
          onMouseEnter={handleProfileMouseEnter}
          onMouseLeave={handleProfileMouseLeave}
          className="p-3 border-t border-[var(--border-default)] bg-[var(--surface-raised)] shrink-0 relative mt-auto"
          ref={menuRef}
        >
          {/* Profile Menu Popover */}
          {isProfileMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-[var(--border-default)] animate-in fade-in slide-in-from-bottom-2 duration-150 font-sans">
              <div className="p-3 bg-[var(--surface-raised)]">
                <p className="text-xs font-semibold text-[var(--text-primary)]">{displayUsername}</p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate">
                  {userEmail ? userEmail : 'Offline / Local Persistence'}
                </p>
              </div>

              <div className="p-1 space-y-0.5 text-xs">
                {userEmail ? (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setShowSignOutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-[var(--danger)] hover:bg-[var(--danger)]/10 rounded-md transition-colors font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" /> Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      onOpenAuthModal();
                      onCloseSidebar();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-[var(--accent)] hover:bg-[var(--accent-soft)] rounded-md transition-colors font-medium cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" /> Sign In / Sync Account
                  </button>
                )}

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenStudySettings();
                    onCloseSidebar();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-md transition-colors cursor-pointer"
                >
                  <Settings className="w-3.5 h-3.5" /> Study Settings
                </button>

                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    onOpenSchemaEditor();
                    onCloseSidebar();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-md transition-colors cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" /> Customize Schema
                </button>

                <button
                  onClick={onToggleTheme}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-raised)] rounded-md transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    {theme === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5 text-[var(--warning)]" />}
                    <span>Theme</span>
                  </div>
                  <span className="text-[10px] capitalize text-[var(--text-tertiary)]">{theme}</span>
                </button>
              </div>

              <div className="p-2 bg-[var(--surface-raised)]">
                <InstallPWA />
              </div>
            </div>
          )}

          {/* Profile Bar Button */}
          <button
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-[var(--surface)] text-left transition-colors border border-transparent hover:border-[var(--border-default)] cursor-pointer"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-[var(--accent)] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                {initial}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-[var(--text-primary)] truncate">{displayUsername}</span>
                <span className="text-[10px] text-[var(--text-tertiary)] flex items-center gap-1">
                  <Cloud className="w-2.5 h-2.5 text-[var(--success)]" />
                  {userEmail ? 'Synced' : 'Local'}
                </span>
              </div>
            </div>
            <ChevronUp className="w-3.5 h-3.5 text-[var(--text-tertiary)] shrink-0" />
          </button>
        </div>
      </aside>

      {/* Sign Out Warning Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 font-sans animate-in fade-in">
          <div className="bg-[var(--surface)] border border-[var(--border-default)] rounded-xl shadow-xl max-w-md w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[var(--danger)]" />
                <h3 className="text-lg font-serif font-normal text-[var(--text-primary)]">Sign Out of SleepLab?</h3>
              </div>
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="p-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Are you sure you want to sign out of <strong className="text-[var(--text-primary)]">@{displayUsername}</strong>?
              Your study observations are safely saved to your account. You can log back in anytime.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 border border-[var(--border-default)] rounded-md text-xs font-sans font-medium text-[var(--text-primary)] hover:bg-[var(--surface-raised)] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSignOutConfirm(false);
                  onSignOut();
                  onCloseSidebar();
                }}
                className="px-4 py-2 bg-[var(--danger)] hover:bg-[var(--danger)]/90 text-white text-xs font-sans font-medium rounded-md transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
