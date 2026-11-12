import React, { useState } from 'react';
import {
  X,
  Smartphone,
  ShieldCheck,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  Share2,
  PlusSquare,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'apk' | 'install' | 'offline' | 'nocode'>('apk');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">App & Device Storage Guide</h3>
              <p className="text-xs text-slate-500">Android APK & offline device setup</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('apk')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'apk'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            <span>Android APK Build</span>
          </button>
          <button
            onClick={() => setActiveTab('install')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            <span>PWA Install</span>
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'offline'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Device Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('nocode')}
            className={`pb-2.5 px-3 border-b-2 transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
              activeTab === 'nocode'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>AI Project Info</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm text-slate-700 flex-1">
          {activeTab === 'apk' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5 shrink-0" />
                <div className="text-xs text-emerald-950 space-y-1">
                  <p className="font-bold">Native Capacitor Android Project Configured</p>
                  <p className="text-emerald-900 leading-relaxed">
                    This project is fully initialized with <strong>Capacitor Native Device Storage</strong>. When running as an APK, your transactions are saved inside Android's internal flash storage (<code className="bg-emerald-100/70 px-1 py-0.5 rounded font-mono text-[10px]">/data/data/com.expensetracker.app/</code>). Clearing browser cache will <strong>never</strong> wipe your financial records.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 p-4 space-y-3 bg-white">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  <span>How to generate your downloadable APK:</span>
                </h4>
                <ol className="space-y-2.5 text-xs text-slate-600 list-decimal list-inside pl-1">
                  <li className="leading-relaxed">
                    <strong>Export the project:</strong> In AI Studio, click the project menu / Settings icon in the top corner and click <strong>Export ZIP</strong> or <strong>Export to GitHub</strong>.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Open in Android Studio:</strong> Unzip the project folder on your PC or Mac. Open <strong>Android Studio</strong> and select <em>Open</em>, then choose the <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">android/</code> directory.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Build APK with 1 click:</strong> In Android Studio's top menu, click <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">Build &gt; Build Bundle(s) / APK(s) &gt; Build APK(s)</code>.
                  </li>
                  <li className="leading-relaxed">
                    <strong>Install on your phone:</strong> Android Studio will show a popup with a "locate" link to <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-[11px] text-slate-800">app-debug.apk</code>. Transfer it to your Android device via USB, WhatsApp, or Google Drive and tap to install!
                  </li>
                </ol>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-bold text-slate-800">Terminal One-Liner (if you have Android SDK/Gradle):</p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] select-all overflow-x-auto">
                  cd android &amp;&amp; ./gradlew assembleDebug
                </div>
              </div>
            </div>
          )}

          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                <p className="text-xs text-emerald-900 leading-relaxed">
                  This app is a <strong>Progressive Web App (PWA)</strong>. That means you do not need the App Store or Google Play Store—you install it directly from your mobile browser and it works completely offline!
                </p>
              </div>

              {/* Android Instructions */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">Android</span>
                  <h4 className="font-bold text-slate-900 text-sm">Google Chrome / Samsung Internet</h4>
                </div>
                <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside pl-1">
                  <li>Open this app link in <strong>Chrome</strong> on your phone.</li>
                  <li>Tap the <strong>three dots (⋮)</strong> menu in the top right corner.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>The app icon will appear on your home screen and launches full screen without any address bar!</li>
                </ol>
              </div>

              {/* iOS Instructions */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[11px] font-bold">iPhone / iPad</span>
                  <h4 className="font-bold text-slate-900 text-sm">Apple Safari Browser</h4>
                </div>
                <ol className="space-y-2 text-xs text-slate-600 list-decimal list-inside pl-1">
                  <li>Open this app link in <strong>Safari</strong>.</li>
                  <li>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-sky-600" /> at the bottom.</li>
                  <li>Scroll down and select <strong>"Add to Home Screen"</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-emerald-600" />.</li>
                  <li>Tap <strong>Add</strong> in the top right. It is now installed on your phone.</li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'offline' && (
            <div className="space-y-3.5">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <ShieldCheck className="w-5 h-5" />
                  <span>100% Private & Device-Only</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  All your income, expenses, notes, and budgets are saved directly in your browser's local memory (Local Storage).
                  <strong> No account, login, or cloud connection is required.</strong> Your financial data never leaves your device.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-sky-700 font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                  <span>Easy Excel & CSV Backups</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Want to save your records or view them in Microsoft Excel or Google Sheets?
                  Use the <strong>"Backup & Restore"</strong> button at the top of the app to download a clean CSV file anytime.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Works With No Internet (Airplane Mode)</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Once opened or installed, the application is cached offline with Service Workers. You can log expenses while on a flight, in remote areas, or without mobile data!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'nocode' && (
            <div className="space-y-3.5">
              <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-purple-700 mt-0.5 shrink-0" />
                <p className="text-xs text-purple-900 leading-relaxed">
                  <strong>You don't need any coding knowledge!</strong> Google AI Studio generated this complete, production-ready app from your prompt.
                </p>
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <h4 className="font-bold text-slate-900 text-sm">How you can customize this app further:</h4>
                <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 border border-slate-200">
                  <p className="font-semibold text-slate-800 flex items-center gap-1">
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                    Simply chat with the AI assistant!
                  </p>
                  <p className="text-slate-600">You can prompt things like:</p>
                  <ul className="list-disc list-inside space-y-1 pl-2 text-slate-700 font-mono text-[11px] bg-white p-2 rounded-lg border border-slate-100">
                    <li>"Add a receipt photo upload feature"</li>
                    <li>"Change default currency to Indian Rupee (₹)"</li>
                    <li>"Add a custom category for Pet Expenses"</li>
                    <li>"Add a recurring monthly expense reminder"</li>
                  </ul>
                </div>
                <p className="text-slate-500 pt-1">
                  The AI handles all code, dependencies, compilation, and styling automatically. You just test the app in the preview window!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <p className="text-xs text-slate-500">Ready to track your expenses!</p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
