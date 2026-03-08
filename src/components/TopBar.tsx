import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { isFeatureEnabled } from '../config/featureFlags';
import ExtensionSlot from './Extensions/ExtensionSlot';
import PlayerHead from './PlayerHead';
import WindowControls from './WindowControls';
import ActionBar from './ActionBar';
import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from './ui/tooltip';
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup
} from './ui/dropdown-menu';
import {
  Search, ChevronDown, ArrowRightLeft, Newspaper,
  Download, Gamepad2, Square, UserPlus, Trash2, LogOut, Zap
} from 'lucide-react';

function TopBar({
  currentMode,
  onModeSelect,
  userProfile,
  onProfileUpdate,
  isGuest,
  isMaximized,
  onOpenCommandPalette,
  onNavigate,
  runningInstances,
  activeDownloads,
  appSettings,
  isCommandPaletteAvailable
}) {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [liveSkin, setLiveSkin] = useState(null);
  const [actionBarOpen, setActionBarOpen] = useState(false);

  useEffect(() => {
    if (userProfile?.access_token) {
      if (userProfile.skinUrl) {
        setLiveSkin(userProfile.skinUrl);
      } else {
        loadLiveSkin();
      }
    } else {
      setLiveSkin(null);
    }
  }, [userProfile]);

  const loadLiveSkin = async () => {
    if (!userProfile?.access_token) return;
    try {
      const res = await window.electronAPI.getCurrentSkin(userProfile.access_token);
      if (res.success && res.url) {
        setLiveSkin(res.url);
        if (onProfileUpdate) {
          onProfileUpdate({ ...userProfile, skinUrl: res.url });
        }
      }
    } catch (e) { }
  };

  const loadAccounts = async () => {
    const accs = await window.electronAPI.getAccounts();
    setAccounts(accs || []);
  };

  const handleSwitch = async (uuid) => {
    const res = await window.electronAPI.switchAccount(uuid);
    if (res.success) {
      if (window.electronAPI.validateSession) {
        const val = await window.electronAPI.validateSession();
        if (val.success) {
          const profile = await window.electronAPI.getProfile();
          onProfileUpdate(profile);
        } else {
          onProfileUpdate(null);
        }
      } else {
        onProfileUpdate(res.profile);
      }
    }
  };

  const handleAddAccount = async () => {
    const res = await window.electronAPI.login();
    if (res.success) {
      onProfileUpdate(res.profile);
    }
  };

  const handleRemove = async (uuid) => {
    const res = await window.electronAPI.removeAccount(uuid);
    if (res.success) {
      if (res.loggedOut) {
        onProfileUpdate(null);
      } else {
        loadAccounts();
      }
    }
  };

  const runningCount = Object.keys(runningInstances).filter(k => runningInstances[k] === 'running').length;
  const activeDownloadEntries = Object.entries(activeDownloads);
  const activeDownloadCount = activeDownloadEntries.length;
  const isClientPageEnabled = isFeatureEnabled('openClientPage');

  return (
    <div className="h-14 w-full titlebar flex items-center justify-between px-4 border-b border-border bg-background/80 backdrop-blur-md flex-none relative z-[60]">
      <div className="flex items-center gap-2 no-drag">
        <div className="w-8 h-8 bg-primary/15 rounded-lg flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
          M
        </div>

        {appSettings?.showQuickSwitchButton !== false && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs font-semibold text-muted-foreground h-8"
              onClick={() => onModeSelect(currentMode === 'launcher' ? 'server' : 'launcher')}
            >
              <ArrowRightLeft className="h-3.5 w-3.5" />
              {currentMode === 'launcher' ? t('common.switch_to_server') : t('common.switch_to_client')}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-xs font-semibold text-muted-foreground h-8"
              onClick={() => onNavigate('news')}
            >
              <Newspaper className="h-3.5 w-3.5" />
              {t('common.news', 'News')}
            </Button>
          </>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 no-drag">
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs text-muted-foreground h-8 min-w-[200px] justify-start border-border/50 bg-background/50"
          onClick={onOpenCommandPalette}
          disabled={!isCommandPaletteAvailable}
        >
          <Search className="h-3.5 w-3.5" />
          <span>{t('dashboard.search_placeholder', 'Search...')}</span>
          <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            Ctrl+K
          </kbd>
        </Button>
        <ExtensionSlot name="header.center" className="flex items-center gap-2" />
      </div>

      <div className="flex items-center gap-2 no-drag">
        <ExtensionSlot name="header.right" className="flex items-center gap-2" />

        {activeDownloadCount > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 h-8 text-xs">
                <Download className="h-3.5 w-3.5 text-primary animate-pulse" />
                <span className="tabular-nums">
                  {Math.round(activeDownloadEntries.reduce((t, [, d]) => t + ((d as any)?.progress || 0), 0) / activeDownloadCount)}%
                </span>
                {activeDownloadCount > 1 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[10px]">{activeDownloadCount}</Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider">{t('common.downloads')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {activeDownloadEntries.map(([name, data]: [string, any]) => (
                <div key={name} className="px-2 py-1.5 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium truncate pr-2">{name}</span>
                    <span className="text-primary font-mono text-[10px]">{data.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${data.progress}%` }} />
                  </div>
                </div>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {isClientPageEnabled && (
          <Button
            variant={currentMode === 'client' ? 'default' : 'ghost'}
            size="sm"
            className="gap-2 h-8 text-xs"
            onClick={() => onModeSelect('client')}
          >
            <Gamepad2 className="h-3.5 w-3.5" />
            {t('client_page.title', 'Open Client')}
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8 text-xs"
        >
          <div className={cn('w-1.5 h-1.5 rounded-full', runningCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/50')} />
          <span className="text-muted-foreground">
            {runningCount === 0 ? t('common.idle') : `${runningCount} ${t('common.running')}`}
          </span>
        </Button>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setActionBarOpen(true)}
              >
                <Zap className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>{t('action_bar.title')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Separator orientation="vertical" className="h-5" />

        <DropdownMenu onOpenChange={(open) => open && loadAccounts()}>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors">
              {userProfile ? (
                <>
                  <PlayerHead
                    src={liveSkin}
                    uuid={userProfile?.uuid}
                    name={userProfile?.name}
                    size={24}
                    className="rounded-md"
                  />
                  <span className="text-xs font-medium text-foreground hidden sm:inline max-w-[80px] truncate">
                    {userProfile?.name}
                  </span>
                </>
              ) : (
                <div className="w-6 h-6 rounded-md bg-muted flex items-center justify-center">
                  <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {userProfile && (
              <>
                <DropdownMenuLabel>
                  <div className="flex items-center gap-2">
                    <PlayerHead
                      src={liveSkin}
                      uuid={userProfile?.uuid}
                      name={userProfile?.name}
                      size={32}
                      className="rounded-md"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold truncate text-sm">{userProfile?.name}</div>
                      <div className="text-[10px] text-muted-foreground">{userProfile?.type || 'Online'}</div>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('common.accounts', 'Accounts')}
              </DropdownMenuLabel>
              {accounts.filter(a => a.uuid !== userProfile?.uuid).map(acc => (
                <DropdownMenuItem key={acc.uuid} className="flex items-center justify-between group/acc">
                  <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => handleSwitch(acc.uuid)}>
                    <PlayerHead uuid={acc.uuid} name={acc.name} size={20} className="rounded-sm" />
                    <span className="truncate text-xs">{acc.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRemove(acc.uuid); }}
                    className="opacity-0 group-hover/acc:opacity-100 p-0.5 hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem onClick={handleAddAccount} className="text-primary">
                <UserPlus className="h-4 w-4 mr-2" />
                {t('common.add_account', 'Add Account')}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-5" />
        <WindowControls isMaximized={isMaximized} />
      </div>

      <ActionBar open={actionBarOpen} onOpenChange={setActionBarOpen} />
    </div>
  );
}

export default TopBar;
