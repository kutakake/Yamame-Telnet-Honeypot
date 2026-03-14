# Yamame Telnet Honeypot

Ubuntu 20.04.4 LTS を模した Telnet honeypot。認証情報を何でも受け入れ、実行されたコマンドを記録します。

## 機能

- 偽の Ubuntu ログインプロンプトを表示
- 任意の認証情報でログイン可能
- コマンド入力を JSON ファイルに構造化して保存
- IP アドレスごとにセッションを分離

## インストール

```bash
npm install
```

## 実行方法

### 1. ポート転送の設定 (root 権限が必要)

標準 Telnet ポート (23) から honeypot ポート (2323) への転送を設定:

```bash
sudo iptables -t nat -A PREROUTING -p tcp --dport 23 -j REDIRECT --to-port 2323
```

永続化するには:
```bash
sudo apt install iptables-persistent
sudo netfilter-persistent save
```

### 2. Honeypot の起動 (一時的)

```bash
node yamame.js
```

## PM2 で常時実行

PM2 を使用して honeypot をバックグラウンドで管理:

### インストール

```bash
npm install -g pm2
```

### 起動

```bash
pm2 start yamame.js --name yamame
```

### OS 起動時に自動開始

```bash
pm2 startup
# 出力されるコマンドを実行:
pm2 save
```

### 管理コマンド

```bash
pm2 status         # ステータス確認
pm2 logs yamame    # ログ表示
pm2 restart yamame # リスタート
pm2 stop yamame    # 停止
pm2 delete yamame  # 削除
```

### PM2 Web モニタリング (オプション)

```bash
npm install -g pm2-logger
pm2 monit
```

## ログ出力

- `honeypot.log`: テキスト形式の接続ログ
- `commands.json`: IP アドレスごとのコマンド実行記録 (JSON)

`commands.json` の形式:
```json
{
  "192.168.1.100": [
    {
      "timestamp": "2024-01-01T12:34:56.789Z",
      "command": "ls -la"
    }
  ]
}
```

## データ保存

- RAM 上でデータを編集
- 10 秒ごとに自動保存
- プロセス終了時にも保存 (SIGINT)

## ポート変更

`yamame.js` の `PORT` 変数を編集:
```javascript
const PORT = 2323; // 任意のポートに変更可能
```

## セキュリティ注意

これは honeypot であり、実際のセキュリティ対策ではありません。攻撃者の行動を監視・記録するためのツールです。
