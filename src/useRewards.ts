import { useEffect, useState } from 'react';
import { creditXp, EMPTY_REWARDS, REWARD_KEY, readRewards, registerLogin, tokyoDay, updateRewards } from './rewardLedger';

export default function useRewards(readXp: () => Record<string, number>, xpEvents: Readonly<Record<string, number>>) {
  const [wallet, setWallet] = useState(EMPTY_REWARDS);
  const [walletError, setWalletError] = useState(false);

  useEffect(() => {
    let active = true;
    let syncedDay: string | undefined;
    const sync = () => {
      if (document.hidden) return;
      const day = tokyoDay();
      if (day === syncedDay) return;
      void updateRewards(current => registerLogin(creditXp(current, readXp()), day)).then(next => {
        syncedDay = day;
        if (active) {
          setWallet(next);
          setWalletError(false);
        }
      }).catch(() => { if (active) setWalletError(true); });
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key !== REWARD_KEY) return;
      try { setWallet(readRewards()); } catch { setWalletError(true); }
    };
    sync();
    const interval = window.setInterval(sync, 60_000);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('storage', onStorage);
    return () => {
      active = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', onStorage);
    };
  }, [readXp, xpEvents]);

  return { wallet, walletError };
}
