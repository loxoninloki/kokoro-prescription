import React, { useRef, useState } from 'react';
import { Icon } from './Icon';

const PUBLIC_APP_URL = 'https://kokoro-prescription-preview.pages.dev/';

export default function AppInvite() {
  const [shareMessage, setShareMessage] = useState('');
  const shareInput = useRef<HTMLInputElement>(null);
  const shareUrl = PUBLIC_APP_URL;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMessage('紹介リンクをコピーしました。');
    } catch {
      shareInput.current?.focus();
      shareInput.current?.select();
      setShareMessage('表示されたURLを長押ししてコピーしてください。');
    }
  };

  const shareApp = async () => {
    setShareMessage('');
    try {
      await navigator.share({
        title: 'こころの処方箋',
        text: '気分や日記を記録できる「こころの処方箋」です。リンクを開いて使ってみてください。',
        url: shareUrl,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        setShareMessage('共有メニューを開けませんでした。「リンクをコピー」をお使いください。');
      }
    }
  };

  return <section className="menu-panel" aria-labelledby="app-invite-title">
      <h1 id="app-invite-title"><Icon name="invite" /> こころの処方箋を紹介する</h1>
      <p>相手はリンクを開くだけで、自分の記録を始められます。</p>
      <input ref={shareInput} aria-label="紹介リンク" value={shareUrl} readOnly
        onFocus={event => event.currentTarget.select()} style={{ width: '100%' }} />
      <div className="wardrobe-options">
        {typeof navigator.share === 'function' && <button type="button" onClick={shareApp}>アプリを紹介する</button>}
        <button type="button" onClick={copyLink}>リンクをコピー</button>
      </div>
      <details style={{ marginTop: 12 }}>
        <summary>QRコードで紹介する</summary>
        <p>相手のスマホのカメラで読み取ってもらってください。</p>
        <img src={`${process.env.PUBLIC_URL}/app-invite-qr.svg`} alt="こころの処方箋を開くQRコード"
          width="216" height="216" loading="lazy" style={{ display: 'block', maxWidth: '100%', height: 'auto' }} />
      </details>
      <p role="status" style={{ fontSize: 13 }}>{shareMessage}</p>
  </section>;
}
