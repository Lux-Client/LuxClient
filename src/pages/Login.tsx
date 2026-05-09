import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, ShieldCheck, Loader2, Sparkles, Gamepad2 } from 'lucide-react';
import WindowControls from '../components/WindowControls';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';

interface LoginProps {
    onLoginSuccess: (profile: unknown) => void;
    onGuestMode: () => void;
}

const ORBS = [
    { color: 'rgba(226, 102, 2, 0.12)', size: 400, left: '15%', top: '20%' },
    { color: 'rgba(255, 140, 0, 0.08)', size: 300, left: '70%', top: '60%' },
    { color: 'rgba(200, 80, 0, 0.06)', size: 350, left: '55%', top: '5%' },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.12, delayChildren: 0.15 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
    },
};

function Login({ onLoginSuccess, onGuestMode }: LoginProps) {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [shakeKey, setShakeKey] = useState(0);

    const handleLogin = useCallback(async () => {
        if (loading) return;
        setLoading(true);
        setError(null);
        try {
            const result = await window.electronAPI.login();
            if (result.success) {
                onLoginSuccess(result.profile);
            } else {
                setError(result.error || t('login.failed'));
                setShakeKey(k => k + 1);
            }
        } catch (e) {
            setError((e as Error).message);
            setShakeKey(k => k + 1);
        } finally {
            setLoading(false);
        }
    }, [loading, onLoginSuccess, t]);

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !loading) handleLogin();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [handleLogin, loading]);

    return (
        <div className="flex h-screen w-screen flex-col bg-canvas">
            <div
                data-tauri-drag-region
                className="titlebar flex h-14 shrink-0 items-center justify-between px-4"
            >
                <div className="flex items-center gap-2.5 no-drag">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                        <Gamepad2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                        Lux
                    </span>
                </div>
                <WindowControls />
            </div>

            <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
                {ORBS.map((orb, i) => (
                    <motion.div
                        key={i}
                        className="pointer-events-none absolute rounded-full"
                        style={{
                            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
                            width: orb.size,
                            height: orb.size,
                            left: orb.left,
                            top: orb.top,
                            transform: 'translate(-50%, -50%)',
                        }}
                        animate={{
                            x: [0, 40, -30, 20, 0],
                            y: [0, -50, 30, -20, 0],
                        }}
                        transition={{
                            duration: 14 + i * 4,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 2.5,
                        }}
                    />
                ))}

                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h40v40H0z' fill='none' stroke='rgba(255,255,255,0.03)' stroke-width='1'/%3E%3C/svg%3E")`,
                    }}
                />

                <motion.div
                    className="relative w-full max-w-md"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <Card className="relative overflow-hidden border-stroke/60 bg-[#0a0a0a]/90 shadow-2xl shadow-black/50 backdrop-blur-2xl">
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

                        <CardContent className="relative p-6 sm:p-8">
                            <motion.div variants={itemVariants} className="mb-10 flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                                            <Sparkles className="h-3.5 w-3.5 text-primary" />
                                        </div>
                                        <p className="text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground">
                                            Lux
                                        </p>
                                    </div>
                                    <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                                        {t('login.title')}
                                    </h2>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                        {t('login.microsoft_sign_in')}
                                    </p>
                                </div>
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-stroke/60 bg-canvas/60">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                </div>
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div
                                        key={shakeKey}
                                        initial={{ opacity: 0, y: -12 }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                            x: [0, -8, 8, -6, 6, -3, 3, 0],
                                        }}
                                        exit={{ opacity: 0, y: -12 }}
                                        transition={{ duration: 0.35, x: { duration: 0.5 } }}
                                        className="mb-6 rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                                        role="alert"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div variants={itemVariants} className="space-y-3">
                                <Button
                                    onClick={handleLogin}
                                    disabled={loading}
                                    size="lg"
                                    className="group relative h-12 w-full justify-between rounded-xl px-4 text-sm font-semibold"
                                >
                                    <span className="flex items-center gap-2">
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                {t('login.logging_in')}
                                            </>
                                        ) : (
                                            t('login.sign_in_button')
                                        )}
                                    </span>
                                    {!loading && (
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    )}
                                </Button>

                                <div className="relative">
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-stroke/50" />
                                    <span className="relative mx-auto flex w-fit px-3 text-xs text-muted-foreground/60 bg-[#0a0a0a]/90">
                                        or
                                    </span>
                                </div>

                                <Button
                                    onClick={onGuestMode}
                                    variant="outline"
                                    size="lg"
                                    className="h-12 w-full rounded-xl border-stroke/60 bg-canvas/40 text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                                >
                                    {t('login.guest_mode')}
                                </Button>
                            </motion.div>

                            <motion.div
                                variants={itemVariants}
                                className="mt-6 flex items-center justify-center gap-2"
                            >
                                <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-stroke/60 bg-canvas/80 px-1.5 text-[10px] font-medium text-muted-foreground/70">
                                    Enter
                                </kbd>
                                <span className="text-[11px] text-muted-foreground/40">
                                    to sign in
                                </span>
                            </motion.div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}

export default Login;
