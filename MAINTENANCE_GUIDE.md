# X Account Redirect Preventer 引き継ぎ・運営資料

本プロジェクトの構成、保守方法、および将来的なリスク管理に関する情報をまとめた資料です。

## 1. プロジェクト概要
X（Twitter）のアカウント切り替え時に発生する `/home` への自動リダイレクトを阻止し、元のURL（通知、リスト、プロフ等）に留まらせる拡張機能です。

### 技術スタック
- **Chrome Extension (Manifest V3)**
- **Redirection Engine**: `declarativeNetRequest` (DNR) セッションルール, `webNavigation`, `webRequest`
- **Injection**: `MAIN` world スクリプトによる API 監視
- **Logging**: `chrome.storage.local` を活用したデバッグログ機能

## 2. 動作の仕組み（3層ガード）
1.  **Network Layer (DNR)**: ブラウザエンジンレベルで `/home` への遷移を即座に元のURLへ書き換えます。
2.  **Navigation Layer**: DNRをすり抜けた場合、ナビゲーションイベントを捕捉して 0.1秒以内に元のページに引き戻します。
3.  **API Monitor Layer**: `switch.json`（アカウント切り替えAPI）を検知した瞬間に、現在地のURLを「戻り先」としてロックします。

## 3. 保守・アップデート手順

### Xの仕様変更への対応
Xの構造が変わった場合、以下の場所を確認してください。
- **APIエンドポイント変更**: `background.js` 内の `multi/switch.json` という文字列を検索。
- **リダイレクト先変更**: `https://x.com/home` が別のURLになった場合、manifestのDNRルールや `background.js` の判定ロジックを修正。

### ストア審査の更新
GitHubにコードをプッシュする際、以下のコマンドでリリース用パッケージを作成できます。
```bash
# extensionフォルダをzip圧縮してアップロード
zip -r release_v1.0.0.zip extension/
```

## 4. 運営上の注意点とリスク管理

### ボット検出（凍結リスク）
- **安全性**: ページの見た目を変える「DOM操作」を一切行わない設計のため、検知リスクは極めて低いです。
- **注意**: Xがボット対策として `x-client-transaction-id` などのヘッダーを強化した場合、`content_main.js` での監視が影響を受ける可能性があります。

### プライバシー
- 本拡張機能は一切のデータを外部送信しません。
- ユーザーから「ログイン情報が盗まれるのでは？」と質問された際は、ストアの説明文および `website/index.html` のポリシーを提示してください。

## 5. 関連リソース
- **GitHub**: `https://github.com/Minashin1120/x-redirect-preventer`
- **Policy Site**: `https://x-redirect-preventer-web.minashin1.pages.dev/`
- **Debug Logs**: 拡張機能のポップアップ内「Download Debug Logs」からいつでも動作履歴を確認可能です。

---
2026年3月16日 作成
Developer: Minashin1120
AI Partner: Antigravity (Google DeepMind)
