# こころの処方箋 iPhone版の試作

このブランチは React の画面とアセットを Capacitor で同梱した iOS プロジェクトです。試作用の Bundle ID は `com.loxoninloki.kokoroprescription` です。

## ビルド

Node.js 22 以上と Xcode 26 以上を用意します。

```sh
npm install
npm run ios:sync
npx cap open ios
```

Xcode で App スキームと iPhone シミュレータを選び、実行します。GitHub Actions の「Build iOS prototype」でも、署名不要のシミュレータビルドを実行できます。この成果物を実機に直接インストールすることはできません。

## 実機配信に向けて

- 実機配布には Apple の署名設定が必要です。TestFlight や App Store への送信は、このワークフローには含まれません。
- Web 版とは保存先が異なります。Web 版の記録は既存の JSON バックアップから移行する想定で、ファイルの選択、復元、再起動後の保持は実機で確認します。
- 歩数は手入力できます。HealthKit 連携、画面ロック中の BGM、バックアップの書き出しは実機確認または追加実装が必要です。
