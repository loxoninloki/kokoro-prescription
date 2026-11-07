# 開発版バックアップ・復元手順（2026-11-08）

## 固定した復旧点
- リポジトリ: loxoninloki/kokoro-prescription
- 対象: integration/kokoro-unified-v3
- コミット: a47ea9cb3cb49d0454b2b9e0ec7d39f8d333fda8
- バックアップブランチ: backup/kokoro-dev-pre-ui-redesign-20261108
- バックアップタグ: backup-kokoro-dev-pre-ui-redesign-20261108
- この2参照は同一コミットを指す。移動・削除・開発コミットを行わない。
- タグからソースとpackage-lock.jsonを取得できることを確認。
- 別チェックアウトで npm ci、npx tsc --noEmit、20スイート92テスト、CI=true npm run build が成功。
- 成功したバックアップ処理の補助成果物: kokoro-pre-ui-source-20261108（ソースアーカイブと参照一覧、GitHub Actionsで30日保管）。
- 既存のデータエクスポート・復元テストが成功。Gitのバックアップは利用者端末のデータを保存するものではない。

## 復旧時の手順
まず不具合の内容と上記SHAへの復旧範囲を報告する。バックアップ参照を強制更新しない。mainは変更しない。

1. git fetch origin --tags
2. git rev-parse backup-kokoro-dev-pre-ui-redesign-20261108 を上記SHAと照合。
3. 最新 integration/kokoro-unified-v3 から recovery/kokoro-ui-YYYYMMDD のような新ブランチを作成。
4. 全ソースをバックアップ時点へ戻す場合は、クリーンな復旧ブランチで次を実行。
   git restore --source=backup-kokoro-dev-pre-ui-redesign-20261108 --staged --worktree -- .
5. git diff --cached を確認する。この操作はバックアップ後の他の変更も戻すため、UIだけ戻すか全ソースを戻すかを報告して決める。必要なら今回のPRだけをrevertする。
6. npm ci、npx tsc --noEmit、CI=true npm test -- --watchAll=false --runInBand、CI=true npm run build を実行。
7. 復旧変更を新規コミットし、integration/kokoro-unified-v3 向けPRを作成。CI成功後に統合する。force pushはしない。
8. Cloudflare Pagesの自動デプロイ成功と https://kokoro-prescription-dev.pages.dev/ の配信成果物・表示を確認。

緊急時はCloudflare Pagesの既存デプロイ履歴から、上記コミットに対応する成功版を選ぶ方法もある。実行前に対象を報告し、成功表示と配信内容を照合する。

localStorage、保存キー、バックアップJSONの形式は変更しない。利用者データの初期化、上書きインポートを復旧作業の一部として勝手に実行しない。

補助アーカイブ確認: GitHub Actions run 42386306932、artifact 13579831893、未失効。取得先は当該実行のArtifacts欄。タグ・ブランチの復旧点は並行開発後も移動しない。
