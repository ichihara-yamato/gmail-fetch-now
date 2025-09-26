# gmail-fetch-now (by NewsJapan Inc.)

- 既存のGmailタブを再利用して `設定 > アカウントとインポート` を開く
- なければ新規タブで開く
- 開いたページでは「メールを今すぐ確認する」を自動クリック（content script）

## インストール
1. `chrome://extensions` を開き、右上の「デベロッパーモード」をON
2. 「パッケージ化されていない拡張機能を読み込む」→ このフォルダを選択

## 使い方
- ツールバーの拡張アイコンをクリック、またはショートカットを割り当てる（`chrome://extensions/shortcuts`）

## オプション
- 対象メールアドレス（カンマ区切り、空欄=全件）
- クリック後の待機時間（ms）
- 検出ラベル（UI言語に合わせて追加）

## メモ
- この版は `contextMenus` を使っていません（対応権限が不要）
- エラーは `chrome://extensions` → 当該拡張 → 「サービスワーカーを検査」で確認できます

- Shows a loading overlay with English text (e.g., 'Fetching mail...') while processing.
