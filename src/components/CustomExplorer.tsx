import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { cn } from '../lib/utils';
import {
  Folder,
  File,
  FileArchive,
  ChevronRight,
  Home,
  Download,
  Monitor,
  HardDrive,
  ArrowLeft,
} from 'lucide-react';

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size: number;
}

interface CustomExplorerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (path: string) => void;
  filters?: { name: string; extensions: string[] }[];
  title?: string;
}

const QUICK_ACCESS: { label: string; icon: typeof Home; getPath: () => Promise<string> }[] = [
  { label: 'Home', icon: Home, getPath: () => window.electronAPI.getHomeDir() },
  {
    label: 'Desktop',
    icon: Monitor,
    getPath: async () => {
      const home = await window.electronAPI.getHomeDir();
      return `${home}/Desktop`;
    },
  },
  {
    label: 'Downloads',
    icon: Download,
    getPath: async () => {
      const home = await window.electronAPI.getHomeDir();
      return `${home}/Downloads`;
    },
  },
  {
    label: 'Documents',
    icon: File,
    getPath: async () => {
      const home = await window.electronAPI.getHomeDir();
      return `${home}/Documents`;
    },
  },
];

function formatSize(bytes: number): string {
  if (bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export default function CustomExplorer({
  open,
  onOpenChange,
  onSelect,
  filters,
  title = 'Select File',
}: CustomExplorerProps) {
  const [currentPath, setCurrentPath] = useState('');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const acceptedExtensions = filters?.flatMap((f) => f.extensions) || [];

  const loadDirectory = useCallback(async (dirPath: string) => {
    setLoading(true);
    try {
      const result = await window.electronAPI.listDirectory(dirPath);
      setEntries(result);
    } catch (e) {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = useCallback(
    async (dirPath: string) => {
      setHistory((prev) => [...prev, currentPath].filter(Boolean));
      setCurrentPath(dirPath);
      setSelectedPath(null);
      await loadDirectory(dirPath);
    },
    [currentPath, loadDirectory],
  );

  const navigateBack = useCallback(async () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((prevHistory) => prevHistory.slice(0, -1));
    setCurrentPath(prev);
    setSelectedPath(null);
    await loadDirectory(prev);
  }, [history, loadDirectory]);

  const handleEntryClick = useCallback(
    async (entry: FileEntry) => {
      if (entry.is_dir) {
        await navigateTo(entry.path);
      } else {
        setSelectedPath(entry.path === selectedPath ? null : entry.path);
      }
    },
    [navigateTo, selectedPath],
  );

  const handleEntryDoubleClick = useCallback(
    async (entry: FileEntry) => {
      if (entry.is_dir) {
        await navigateTo(entry.path);
      } else {
        onSelect(entry.path);
        onOpenChange(false);
      }
    },
    [navigateTo, onSelect, onOpenChange],
  );

  const handleQuickAccess = useCallback(
    async (getPath: () => Promise<string>) => {
      try {
        const p = await getPath();
        await navigateTo(p);
      } catch { }
    },
    [navigateTo],
  );

  const handleConfirm = useCallback(() => {
    if (selectedPath) {
      onSelect(selectedPath);
      onOpenChange(false);
    }
  }, [selectedPath, onSelect, onOpenChange]);

  useEffect(() => {
    if (open) {
      window.electronAPI.getHomeDir().then((home) => navigateTo(home));
    }
  }, [open]);

  const isValidFile = (entry: FileEntry) => {
    if (entry.is_dir) return true;
    if (acceptedExtensions.length === 0) return true;
    return acceptedExtensions.includes(getFileExtension(entry.name));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[600px] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-6 pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            disabled={history.length === 0}
            onClick={navigateBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1 flex-1 min-w-0 rounded-lg border border-stroke/60 bg-canvas/60 px-3 py-1.5 text-xs text-muted-foreground truncate">
            <HardDrive className="h-3 w-3 shrink-0 mr-1" />
            <span className="truncate">{currentPath}</span>
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          <div className="w-44 shrink-0 border-r border-stroke/50 p-2 space-y-0.5">
            {QUICK_ACCESS.map((item) => (
              <button
                key={item.label}
                onClick={() => handleQuickAccess(item.getPath)}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <item.icon className="h-3.5 w-3.5 shrink-0" />
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-w-0">
            <ScrollArea className="h-[380px]">
              {loading ? (
                <div className="flex items-center justify-center h-full py-12">
                  <div className="h-5 w-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                </div>
              ) : entries.length === 0 ? (
                <div className="flex items-center justify-center h-full py-12 text-sm text-muted-foreground">
                  This folder is empty
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-1 p-3">
                  {entries
                    .filter((entry) => isValidFile(entry))
                    .map((entry) => {
                      const ext = getFileExtension(entry.name);
                      const isZip = ext === 'zip' || ext === 'luxextension';
                      const isSelected = entry.path === selectedPath;

                      return (
                        <button
                          key={entry.path}
                          onClick={() => handleEntryClick(entry)}
                          onDoubleClick={() => handleEntryDoubleClick(entry)}
                          className={cn(
                            'flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                            isSelected
                              ? 'bg-primary/15 border border-primary/30'
                              : 'border border-transparent hover:bg-accent/40',
                          )}
                        >
                          {entry.is_dir ? (
                            <Folder className="h-8 w-8 shrink-0 text-primary/70" />
                          ) : isZip ? (
                            <FileArchive className="h-8 w-8 shrink-0 text-amber-500/70" />
                          ) : (
                            <File className="h-8 w-8 shrink-0 text-muted-foreground/50" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">
                              {entry.name}
                            </p>
                            {!entry.is_dir && (
                              <p className="text-[11px] text-muted-foreground/60">
                                {formatSize(entry.size)}
                              </p>
                            )}
                          </div>
                          {entry.is_dir && (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                          )}
                        </button>
                      );
                    })}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-stroke/50">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPath}>
            Open
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
