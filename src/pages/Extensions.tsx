import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import PageHeader from '../components/layout/PageHeader';
import PageContent from '../components/layout/PageContent';
import EmptyState from '../components/layout/EmptyState';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Switch } from '../components/ui/switch';
import { Skeleton } from '../components/ui/skeleton';
import {
    Search,
    Trash2,
    Check,
    Loader2,
    Package,
    Download,
    Sparkles,
    Star,
    Puzzle,
    Globe,
} from 'lucide-react';

interface OnlineExtension {
    id: number;
    identifier: string;
    name: string;
    summary?: string;
    description?: string;
    developer?: string;
    downloads: number;
    banner_path?: string;
    type?: string;
}

const Extensions = () => {
    const { t } = useTranslation();
    const [installed, setInstalled] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('installed');
    const [onlineExtensions, setOnlineExtensions] = useState<OnlineExtension[]>([]);
    const [loadingOnline, setLoadingOnline] = useState(false);
    const [onlineStatus, setOnlineStatus] = useState<'ok' | 'maintenance' | 'error'>('ok');
    const [installing, setInstalling] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (activeTab === 'online') fetchOnlineExtensions();
    }, [activeTab]);

    const fetchOnlineExtensions = async () => {
        setLoadingOnline(true);
        setOnlineStatus('ok');
        try {
            const res = await fetch('https://lux.pluginhub.de/api/extensions');
            if (res.ok) {
                const data: OnlineExtension[] = await res.json();
                setOnlineExtensions(data.filter(ext => ext.type !== 'theme'));
            } else {
                setOnlineExtensions([]);
                setOnlineStatus(res.status === 503 ? 'maintenance' : 'error');
            }
        } catch {
            setOnlineExtensions([]);
            setOnlineStatus('error');
        } finally {
            setLoadingOnline(false);
        }
    };

    const handleInstallOnline = async (ext: OnlineExtension) => {
        setInstalling(ext.id);
        await new Promise(r => setTimeout(r, 1500));
        setInstalled(prev => [...prev, {
            id: ext.identifier,
            name: ext.name,
            version: '1.0.0',
            description: ext.summary || ext.description || 'No description available.',
            author: ext.developer || 'Unknown',
            enabled: true,
            icon_url: ext.banner_path ? `https://lux.pluginhub.de/uploads/${ext.banner_path}` : null,
        }]);
        setInstalling(null);
    };

    const handleToggle = (id: string) => {
        setInstalled(prev => prev.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e));
    };

    const handleRemove = (id: string) => {
        setInstalled(prev => prev.filter(e => e.id !== id));
    };

    const filteredOnline = onlineExtensions.filter(ext =>
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.developer?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredInstalled = installed.filter(ext =>
        ext.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ext.author.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title={t('extensions.title') || 'Extensions'}
                description={t('extensions.desc') || 'Enhance your launcher with community extensions.'}
            />

            <PageContent>
                <div className="relative mb-5">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                        type="text"
                        placeholder={t('extensions.search') || 'Search extensions...'}
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                    <TabsList className="w-full sm:w-auto">
                        <TabsTrigger value="installed" className="gap-2">
                            <Package className="w-3.5 h-3.5" />
                            {t('extensions.installed_count', { count: installed.length }) || `Installed (${installed.length})`}
                        </TabsTrigger>
                        <TabsTrigger value="online" className="gap-2">
                            <Globe className="w-3.5 h-3.5" />
                            {t('extensions.marketplace') || 'Browse'}
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                {activeTab === 'installed' ? (
                    filteredInstalled.length === 0 ? (
                        <EmptyState
                            icon={installed.length === 0 ? Puzzle : Search}
                            title={
                                installed.length === 0
                                    ? (t('extensions.no_extensions') || 'No extensions installed')
                                    : (t('extensions.no_search_results') || 'No results')
                            }
                            description={
                                installed.length === 0
                                    ? 'Browse the marketplace to discover extensions.'
                                    : 'Try a different search term.'
                            }
                        >
                            {installed.length === 0 && (
                                <Button size="sm" onClick={() => setActiveTab('online')} className="gap-1.5 mt-2">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Browse Marketplace
                                </Button>
                            )}
                        </EmptyState>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredInstalled.map(ext => (
                                <div
                                    key={ext.id}
                                    className={`group relative rounded-xl border border-stroke bg-surface overflow-hidden transition-all duration-200 hover:shadow-md hover:border-stroke/80 ${!ext.enabled ? 'opacity-55' : ''}`}
                                >
                                    <div className="p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 border border-stroke/50 overflow-hidden">
                                                {ext.icon_url ? (
                                                    <img
                                                        src={ext.icon_url}
                                                        alt={ext.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                    />
                                                ) : (
                                                    <span>{ext.name.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-sm font-semibold text-foreground truncate">{ext.name}</span>
                                                    <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 h-4 shrink-0">{ext.version}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ext.description}</p>
                                                <span className="text-[11px] text-muted-foreground/60 mt-1 block">{ext.author}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between px-5 py-3 bg-black/5 border-t border-stroke/50">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={!!ext.enabled}
                                                onCheckedChange={() => handleToggle(ext.id)}
                                                size="sm"
                                            />
                                            <span className="text-xs text-muted-foreground">
                                                {ext.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleRemove(ext.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                ) : (
                    loadingOnline ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="rounded-xl border border-stroke bg-surface p-5">
                                    <div className="flex items-start gap-4">
                                        <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <Skeleton className="h-4 w-28 mb-2" />
                                            <Skeleton className="h-3 w-full mb-1" />
                                            <Skeleton className="h-3 w-3/4" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-full mt-4 rounded-lg" />
                                </div>
                            ))}
                        </div>
                    ) : onlineStatus === 'maintenance' ? (
                        <EmptyState
                            icon={Globe}
                            title="Marketplace is under maintenance"
                            description="Please try again in a few minutes."
                        />
                    ) : onlineExtensions.length === 0 ? (
                        <EmptyState
                            icon={Globe}
                            title="No extensions available"
                            description="The marketplace appears to be empty."
                        />
                    ) : filteredOnline.length === 0 ? (
                        <EmptyState
                            icon={Search}
                            title={t('extensions.no_search_results') || 'No results'}
                            description="Try a different search term."
                        />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredOnline.map(ext => {
                                const isInstalled = installed.some(e => e.id === ext.identifier);
                                const isLoading = installing === ext.id;

                                return (
                                    <div
                                        key={ext.id}
                                        className="group rounded-xl border border-stroke bg-surface overflow-hidden transition-all duration-200 hover:shadow-md hover:border-stroke/80"
                                    >
                                        <div className="p-5">
                                            <div className="flex items-start gap-4 mb-3">
                                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br from-primary/20 to-primary/5 border border-stroke/50">
                                                    {ext.banner_path ? (
                                                        <img
                                                            src={`https://lux.pluginhub.de/uploads/${ext.banner_path}`}
                                                            alt={ext.name}
                                                            className="w-full h-full object-cover rounded-xl"
                                                            onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span>{ext.name.charAt(0).toUpperCase()}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0 pt-0.5">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="text-sm font-semibold text-foreground truncate">{ext.name}</span>
                                                        <Badge variant="secondary" className="text-[10px] gap-1 px-1.5 py-0 h-4 shrink-0">
                                                            <Download className="w-2.5 h-2.5" />
                                                            {ext.downloads}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{ext.summary || ext.description || 'No description available.'}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {ext.developer && (
                                                            <span className="text-[11px] text-muted-foreground/60">{ext.developer}</span>
                                                        )}
                                                        {ext.downloads > 1000 && (
                                                            <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-4 text-amber-600 border-amber-600/30">
                                                                <Star className="w-2.5 h-2.5 fill-amber-600" />
                                                                Popular
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-5 py-3 bg-black/5 border-t border-stroke/50">
                                            {isInstalled ? (
                                                <Badge variant="outline" className="gap-1.5 text-xs px-3 py-1">
                                                    <Check className="w-3 h-3 text-emerald-500" />
                                                    Installed
                                                </Badge>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleInstallOnline(ext)}
                                                    disabled={isLoading}
                                                    className="gap-1.5 flex-1"
                                                >
                                                    {isLoading ? (
                                                        <>
                                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            Installing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="w-3.5 h-3.5" />
                                                            Install
                                                        </>
                                                    )}
                                                </Button>
                                            )}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="gap-1.5 text-xs"
                                                onClick={() => window.open(`https://lux.pluginhub.de/extensions/${ext.identifier}`, '_blank')}
                                            >
                                                Details
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                )}
            </PageContent>
        </div>
    );
};

export default Extensions;
