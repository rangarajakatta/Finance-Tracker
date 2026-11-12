import React, { useState } from 'react';
import { Download, Smartphone, X, CheckCircle2, Share2, PlusSquare } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ onOpenGuide?: () => void }> = ({ onOpenGuide }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running inside standalone app, show small verified offline chip
  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-100/80 rounded-full border border-emerald-200">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        id="pwa-install-btn"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition rounded-full shadow-sm"
        title="Install this app onto your home screen"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (no beforeinstallprompt)
  if (isIOS) {
    return (
      <>
        <button
          id="ios-install-btn"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full transition active:scale-95"
          title="Install on iPhone/iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Add to iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Install on iPhone</h3>
                    <p className="text-xs text-slate-500">Add to your Home Screen</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="my-5 space-y-3.5 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-xs text-sky-600 mt-0.5">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Step 1</p>
                    <p className="text-xs text-slate-600">Tap the <strong>Share</strong> button in your Safari bottom navigation toolbar.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-xs text-emerald-600 mt-0.5">
                    <PlusSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Step 2</p>
                    <p className="text-xs text-slate-600">Scroll down and tap <strong>Add to Home Screen</strong>.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                  <div className="p-2 bg-white rounded-lg shadow-xs text-purple-600 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">Step 3</p>
                    <p className="text-xs text-slate-600">Tap <strong>Add</strong> in top right. You can now use it 100% offline like a native app!</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition"
              >
                Got It!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback if browser doesn't support direct install prompt (desktop non-chrome or safari)
  return (
    <button
      id="general-install-btn"
      onClick={onOpenGuide}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-full transition"
    >
      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
      <span>Mobile Guide</span>
    </button>
  );
};
