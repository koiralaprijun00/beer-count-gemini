import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { FunkyButton } from '../../components/FunkyComponents';

export const ReloadPrompt: React.FC = () => {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            console.log('SW Registered: ' + r);
        },
        onRegisterError(error) {
            console.log('SW registration error', error);
        },
    });

    const close = () => {
        setOfflineReady(false);
        setNeedRefresh(false);
    };

    if (!offlineReady && !needRefresh) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[60] animate-slide-in-right w-full max-w-sm">
            <div className="bg-black text-white p-6 shadow-[8px_8px_0px_0px_rgba(204,255,0,1)] border-2 border-[var(--color-neon-green)] flex flex-col gap-4">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <h3 className="font-bold text-[var(--color-neon-green)] uppercase tracking-wider mb-1">
                            {offlineReady ? 'Ready for Offline' : 'New Content Available'}
                        </h3>
                        <p className="text-sm text-gray-300 font-medium">
                            {offlineReady
                                ? 'App is ready to work offline.'
                                : 'A new version of Count My Beer is available. Update now to get the latest features!'}
                        </p>
                    </div>
                    <button
                        onClick={close}
                        className="text-gray-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {needRefresh && (
                    <FunkyButton
                        onClick={() => updateServiceWorker(true)}
                        className="!py-2 !text-sm"
                        pulseOnClick
                    >
                        Reload & Update
                    </FunkyButton>
                )}
            </div>
        </div>
    );
};
