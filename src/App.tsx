import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

export function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'mood' | 'diary' | 'community' | 'meditation'>('home');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'evening' | 'night'>('day');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 20) setTimeOfDay('evening');
    else setTimeOfDay('night');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const bgClasses = {
    day: 'bg-gradient-to-b from-sky-50 via-purple-50 to-pink-50 text-slate-800',
    evening: 'bg-gradient-to-b from-orange-50 via-purple-100 to-indigo-200 text-slate-800',
    night: 'bg-gradient-to-b from-slate-900 via-purple-950 to-indigo-950 text-slate-100 dark'
  };

  return (
    <div className={`min-h-screen ${bgClasses[timeOfDay]} transition-colors duration-1000 p-4 pb-24 relative overflow-x-hidden font-sans`}>
      <header className="max-w-md mx-auto flex justify-between items-center mb-6 pt-2">
        <h1 className="text-xl font-bold tracking-wider text-purple-900 dark:text-purple-200">こころの処方箋</h1>
        <div className="text-xs bg-white/60 dark:bg-slate-800/60 backdrop-blur px-3 py-1.5 rounded-full shadow-sm">
          {user ? `ログイン中` : 'ゲストモード'}
        </div>
      </header>

      <main className="max-w-md mx-auto">
        {currentTab === 'home' && (
          <div>
            <div className="flex flex-col items-center justify-center my-6">
              <div className="relative w-48 h-36 bg-gradient-to-tr from-purple-200 to-indigo-100 dark:from-purple-950 dark:to-slate-900 rounded-full shadow-lg flex items-center justify-center">
                <div className="absolute -top-3 right-8 text-xs text-purple-400 animate-pulse">zzz...</div>
                <div className="text-center">
                  <div className="text-4xl select-none">(-ω-)zZZ</div>
                  <div className="text-xs text-purple-600 dark:text-purple-300 mt-2 font-medium">
                    ／ ろきはここで休んでるよ… ＼
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-purple-100 dark:border-purple-900 mb-6 text-center">
              <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-1">🎁 今日のログインボーナス</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">連続ログイン 3日目 ✨ えらいね！</p>
            </div>
          </div>
        )}

        {currentTab === 'mood' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-purple-100 mb-6">
            <h2 className="text-base font-bold text-purple-900 dark:text-purple-200 mb-3">今日の気分と服薬記録</h2>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {['😊', '😌', '😐', '😢', '😭', '😴', '😡', '💪'].map(m => (
                <button key={m} className="p-3 text-2xl bg-purple-50 dark:bg-slate-700 rounded-xl hover:bg-purple-100">{m}</button>
              ))}
            </div>
          </div>
        )}

        {currentTab === 'meditation' && (
          <div className="p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl shadow-sm text-center border border-purple-100">
            <h2 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4">🧘 瞑想ルーム</h2>
            <p className="text-xs text-slate-500">深呼吸をして、ゆっくり心を落ち着かせましょう。</p>
          </div>
        )}

        {currentTab === 'diary' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-purple-100">
            <h2 className="text-base font-bold text-purple-900 dark:text-purple-200 mb-3">📖 毎日の日記</h2>
            <p className="text-xs text-slate-500">画像を添付したり、タグで振り返ることができます。</p>
          </div>
        )}

        {currentTab === 'community' && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-purple-100">
            <h2 className="text-base font-bold text-purple-900 dark:text-purple-200 mb-3">🌸 こころ広場（みんなの居場所）</h2>
            <p className="text-xs text-slate-500">安心安全な空間で、今日の気持ちをシェアしましょう。</p>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-t border-purple-100 dark:border-purple-900 py-2 px-4 max-w-md mx-auto flex justify-around items-center z-40">
        {[
          { id: 'home', label: 'ホーム', icon: '🏠' },
          { id: 'mood', label: 'きぶん', icon: '📝' },
          { id: 'meditation', label: '瞑想', icon: '🧘' },
          { id: 'diary', label: '日記', icon: '📖' },
          { id: 'community', label: '広場', icon: '🌸' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setCurrentTab(tab.id as any)}
            className={`flex flex-col items-center text-xs transition-all ${currentTab === tab.id ? 'text-purple-600 dark:text-purple-400 font-bold scale-105' : 'text-slate-400'}`}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default App;
