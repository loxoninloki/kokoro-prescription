# こころの処方箋 — ブランチ管理台帳

更新日: 2026-11-07（統合調査後）

## 統合後の開発基準

- 推奨: `integration/kokoro-unified-v3`。全9ブランチの履歴を統合し、画像・音声38パスをハッシュ照合して欠落・改変なし。
- 服薬候補と最新UIの分岐を解消。iOS固有設定・ネイティブ共有も継承。
- 10スイート58テスト、TypeScript、production buildは成功。Safari／PWA実機受け入れは残る。
- 元の9ブランチはすべて保持。本番mainとarchiveとfixは未変更。
- 詳細と削除候補の根拠は `docs/branch-integration-report.md`。以下は統合前台帳として保持する。

## 開発の基準

- **現在の統合候補**: `fix/medication-daily-reward-cap-20261107`
  - `feature/persistent-navigation` を基点に、服薬報酬の公平化を追加したもの。
  - **テスト・プレビュー確認前**。本番へのマージは保留。
- **公開用**: `main`
  - 現状の公開設定とデプロイを維持。検証が完了するまで変更しない。
- **保存用**: `archive/kokoro-v2-prototype-20261106`
  - プロトタイプ保全用。変更・削除しない。

## 既存ブランチの分類

| ブランチ | 分類 | 方針 |
| --- | --- | --- |
| `main` | 公開用 | 維持 |
| `fix/medication-daily-reward-cap-20261107` | 統合候補 | 今後の開発基準候補、テスト待ち |
| `feature/persistent-navigation` | 統合候補の親 | 比較・復旧用に保持 |
| `feature/avatar-home-ui` | 旧機能開発 | 差分確認まで保持 |
| `feature/roki-evolution-dressup` | 旧機能開発 | 差分確認まで保持 |
| `feature/macaron-ticket-gacha` | 旧機能開発 | 差分確認まで保持 |
| `rebuild/kokoro-v2` | 旧再構築 | 差分確認まで保持 |
| `prototype/kokoro-ios` | 旧試作 | 差分確認まで保持 |
| `archive/kokoro-v2-prototype-20261106` | 保存用 | 永続保護 |

## 統合・削除の条件

1. 各旧ブランチにしか存在しない機能・画像・設定を差分確認する。
2. 修正ブランチのテストを実行し、iPhone Safari / PWA の動作を検証する。
3. 既存の着せ替えプレビューURLのデプロイ元を特定し、破壊しない。
4. 統合後のプレビューを別環境で確認する。
5. 利用者の承認を得てから本番マージや不要ブランチの削除を行う。

**注意**: この台帳はブランチの整理方針を記録するものであり、マージ・削除・本番公開の完了を意味しません。
