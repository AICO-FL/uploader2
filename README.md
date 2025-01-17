# ファイルアップローダー

シンプルで安全なファイル共有アプリケーション。ユーザー管理と共有機能を備えています。

## 機能

- ドラッグ＆ドロップでのファイルアップロード
- ユーザー認証（ログイン/ゲストアップロード）
- フォルダ管理
- ファイル共有（URLとパスワード保護）
- 管理者ダッシュボード
- レスポンシブデザイン

## 制限事項

ゲストユーザー:
- 1回のアップロードで最大5ファイルまで
- ファイルサイズ上限: 100MB
- ファイルの有効期限は7日間

登録ユーザー:
- 1回のアップロードで最大10ファイルまで
- ファイルサイズ上限: 4GB
- カスタム有効期限設定（7日、14日、30日、120日）
- フォルダ管理機能

## セットアップ

1. 依存関係のインストール:
```bash
npm install
```

2. `.env`ファイルを作成し、以下の内容を設定:
```env
# アプリケーション
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=本番環境では必ず変更してください

# アップロード設定
MAX_UPLOAD_SIZE=4294967296
UPLOAD_DIR=uploads

# データベース
DATABASE_PATH=./data/data.db
```

3. アプリケーションのビルドと起動:
```bash
# 初期セットアップ、ビルド、起動を一括実行
npm run prod
```

デフォルトの管理者アカウント:
- メールアドレス: admin@example.com
- パスワード: admin123

## データ保存場所

- アップロードファイル: `./uploads`ディレクトリ
- データベース: `./data/data.db` (SQLite)

## バックアップ

以下のディレクトリを定期的にバックアップすることを推奨:
```bash
mkdir -p "$BACKUP_DIR/$DATE"
cp -r uploads data "$BACKUP_DIR/$DATE/"
```

## 自動メンテナンス

期限切れファイルの自動削除:
```bash
# cronタブの例（毎日深夜0時に実行）
0 0 * * * curl http://localhost:3000/api/cron/cleanup
```

## トラブルシューティング

1. アップロードエラー:
   - `uploads`ディレクトリの権限を確認
   - ディスク容量を確認
   - `MAX_UPLOAD_SIZE`環境変数の設定を確認

2. データベースエラー:
   - `data`ディレクトリの権限を確認
   - SQLiteデータベースファイルの存在を確認

3. 認証エラー:
   - `JWT_SECRET`環境変数が正しく設定されているか確認
   - Cookieが有効になっているか確認

## セキュリティ注意事項

1. 本番環境では必ず`JWT_SECRET`を変更してください
2. アップロードディレクトリに適切なパーミッションを設定してください
3. 定期的にバックアップを実施してください
4. システム管理者パスワードは初期設定後に変更することを推奨します

## ライセンス

MIT