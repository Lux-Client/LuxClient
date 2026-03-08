import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/featureFlags';
import ExtensionSlot from './Extensions/ExtensionSlot';
import { cn } from '../lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import {
  Home, LayoutGrid, Search, User, Puzzle, Palette, Settings,
  LogOut, Plus, Play, ChevronLeft, ChevronRight, List
} from 'lucide-react';

function AppSidebar({
  currentView,
  setView,
  currentMode,
  onLogout,
  onInstanceClick,
  onCreateInstance,
  isGuest,
  isCollapsed,
  setIsCollapsed
}) {
  const { t } = useTranslation();
  const [recentInstances, setRecentInstances] = useState([]);
  const [settings, setSettings] = useState({ showDisabledFeatures: false });

  useEffect(() => {
    if (currentMode === 'launcher') loadRecentInstances();
    const loadSettings = async () => {
      try {
        const res = await window.electronAPI.getSettings();
        if (res.success) setSettings(res.settings);
      } catch (e) { }
    };
    loadSettings();
    const cleanupSettings = window.electronAPI.onSettingsUpdated?.((s) => setSettings(s));
    const interval = currentMode === 'launcher' ? setInterval(loadRecentInstances, 5000) : null;
    return () => {
      if (interval) clearInterval(interval);
      if (cleanupSettings) cleanupSettings();
    };
  }, [currentMode]);

  const loadRecentInstances = async () => {
    try {
      const list = await window.electronAPI.getInstances();
      if (list) {
        const recent = [...list]
          .filter(inst => inst.lastPlayed || inst.playtime > 0)
          .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
          .slice(0, 3);
        setRecentInstances(recent);
      }
    } catch (e) { }
  };

  const launcherItems: { id: string; label: string; icon: any; disabled?: boolean }[] = [
    { id: 'dashboard', label: t('common.dashboard'), icon: Home },
    { id: 'library', label: t('common.library'), icon: LayoutGrid },
    { id: 'search', label: t('common.search'), icon: Search },
    { id: 'skins', label: t('common.skins'), icon: User, disabled: isGuest },
    { id: 'extensions', label: t('common.extensions'), icon: Puzzle },
    { id: 'styling', label: t('common.styling'), icon: Palette },
  ];

  const serverItems: { id: string; label: string; icon: any; disabled?: boolean }[] = [
    { id: 'server-dashboard', label: t('common.dashboard', 'Dashboard'), icon: LayoutGrid },
    { id: 'search', label: t('common.search', 'Search'), icon: Search },
    { id: 'server-library', label: t('common.library', 'Library'), icon: List },
    { id: 'styling', label: t('common.styling', 'Styling'), icon: Palette },
  ];

  const clientItems: { id: string; label: string; icon: any; disabled?: boolean }[] = [
    { id: 'open-client', label: t('common.client', 'Client'), icon: Play },
    { id: 'skins', label: t('common.skins', 'Skins'), icon: User, disabled: isGuest },
    { id: 'extensions', label: t('common.extensions', 'Extensions'), icon: Puzzle },
    { id: 'styling', label: t('common.styling', 'Styling'), icon: Palette },
    { id: 'mods', label: t('instance_details.content.mods', 'Mods'), icon: List },
  ];

  const getMenuItems = () => {
    if (currentMode === 'server') return serverItems;
    if (currentMode === 'client' && isFeatureEnabled('openClientPage')) return clientItems;
    return launcherItems;
  };

  const getSettingsView = () => {
    if (currentMode === 'server') return 'server-settings';
    return 'settings';
  };

  const menuItems = getMenuItems().filter(item => !item.disabled || settings.showDisabledFeatures);

  const shellTransitionClass = 'sidebar-shell-transition';
  const layoutTransitionClass = 'sidebar-layout-transition';

  const SidebarLabel = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <span
      className={cn(
        'min-w-0 overflow-hidden whitespace-nowrap',
        layoutTransitionClass,
        isCollapsed ? 'ml-0 max-w-0 translate-x-2 opacity-0' : 'ml-3 max-w-[160px] translate-x-0 opacity-100',
        className
      )}
    >
      {children}
    </span>
  );

  const iconShiftClass = cn(
    'flex h-5 w-5 shrink-0 items-center justify-center',
    layoutTransitionClass,
    isCollapsed ? 'translate-x-px' : 'translate-x-0'
  );

  const wrapWithTooltip = (content, label, key?) => {
    return (
      <Tooltip key={key} delayDuration={0}>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        {isCollapsed && (
          <TooltipContent side="right" className="font-medium">
            {label}
          </TooltipContent>
        )}
      </Tooltip>
    );
  };

  const NavItem = ({ item }) => {
    const isActive = currentView === item.id;
    const Icon = item.icon;

    const button = (
      <button
        onClick={() => !item.disabled && setView(item.id)}
        className={cn(
          'group relative flex h-10 w-full items-center overflow-hidden rounded-xl text-sm font-medium outline-none focus:outline-none focus-visible:outline-none',
          layoutTransitionClass,
          isCollapsed ? 'px-2' : 'px-3',
          isActive
            ? 'bg-primary/15 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
          item.disabled && 'opacity-40 cursor-not-allowed pointer-events-none'
        )}
      >
        <div className={iconShiftClass}>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <SidebarLabel className="truncate">{item.label}</SidebarLabel>
      </button>
    );

    return wrapWithTooltip(
      button,
      item.disabled && isGuest ? t('login.guest_restriction', 'Login required') : item.label,
      item.id
    );
  };

  const settingsView = getSettingsView();

  const FooterAction = ({ icon: Icon, label, onClick, destructive = false }) => {
    const button = (
      <button
        onClick={onClick}
        className={cn(
          'group flex h-10 w-full items-center overflow-hidden rounded-xl text-sm font-medium outline-none focus:outline-none focus-visible:outline-none',
          layoutTransitionClass,
          isCollapsed ? 'px-2' : 'px-3',
          destructive
            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
            : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
        )}
      >
        <div className={iconShiftClass}>
          <Icon className="h-4 w-4 shrink-0" />
        </div>
        <SidebarLabel>{label}</SidebarLabel>
      </button>
    );

    return wrapWithTooltip(button, label, label);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'relative z-50 flex h-full flex-col overflow-hidden border-r border-border bg-sidebar',
          shellTransitionClass,
          isCollapsed ? 'w-[var(--sidebar-width)]' : 'w-[var(--sidebar-width-expanded)]'
        )}
      >
        <div className="relative h-14 shrink-0">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              'sidebar-toggle-transition absolute top-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground -translate-y-1/2 outline-none focus:outline-none focus-visible:outline-none',
              isCollapsed ? 'right-3.5' : 'right-3'
            )}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1 px-2 py-2">
            {menuItems.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>

          {currentMode === 'launcher' && recentInstances.length > 0 && (
            <>
              <div className="px-2 py-2">
                <Separator className="opacity-50" />
              </div>
              <div
                className={cn(
                  'overflow-hidden px-4',
                  layoutTransitionClass,
                  isCollapsed ? 'max-h-0 pb-0 opacity-0 -translate-y-1' : 'max-h-8 pb-1 opacity-100 translate-y-0'
                )}
              >
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {t('common.recent', 'Recent')}
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-2">
                {recentInstances.map((inst) => {
                  const button = (
                    <button
                      key={inst.name}
                      onClick={() => onInstanceClick && onInstanceClick(inst)}
                      className={cn(
                        'group flex h-10 w-full items-center overflow-hidden rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground outline-none focus:outline-none focus-visible:outline-none',
                        layoutTransitionClass,
                        isCollapsed ? 'px-2' : 'px-3'
                      )}
                    >
                      <div
                        className={cn(
                          'overflow-hidden rounded-md bg-muted shrink-0',
                          layoutTransitionClass,
                          isCollapsed ? 'h-5 w-5 translate-x-px' : 'h-5 w-5 translate-x-0'
                        )}
                      >
                        {inst.icon && inst.icon.startsWith('data:') ? (
                          <img src={inst.icon} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <LayoutGrid className="h-3 w-3 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <SidebarLabel className="truncate text-xs">{inst.name}</SidebarLabel>
                    </button>
                  );

                  return wrapWithTooltip(button, inst.name, inst.name);
                })}
              </div>
            </>
          )}

          {currentMode === 'launcher' && (
            <div className="px-2 py-1">
              {wrapWithTooltip(
                <button
                  onClick={() => onCreateInstance && onCreateInstance()}
                  className={cn(
                    'group flex h-10 w-full items-center overflow-hidden rounded-xl text-xs font-medium text-muted-foreground hover:text-primary hover:bg-primary/10 outline-none focus:outline-none focus-visible:outline-none',
                    layoutTransitionClass,
                    isCollapsed ? 'px-2' : 'px-3'
                  )}
                >
                  <div className={iconShiftClass}>
                    <Plus className="h-4 w-4 shrink-0" />
                  </div>
                  <SidebarLabel>{t('common.new_instance')}</SidebarLabel>
                </button>,
                t('common.new_instance')
              )}
            </div>
          )}
        </ScrollArea>

        <div className="mt-auto flex flex-col gap-1 border-t border-border px-2 py-2">
          <NavItem item={{ id: settingsView, label: t('common.settings'), icon: Settings }} />
          <FooterAction icon={LogOut} label={t('common.logout')} onClick={onLogout} destructive />
          <ExtensionSlot name="sidebar.bottom" className="flex flex-col gap-1" />
        </div>
      </div>
    </TooltipProvider>
  );
}

export default AppSidebar;
