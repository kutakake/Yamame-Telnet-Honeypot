const net = require('net');
const fs = require('fs');

const PORT = 2323;
const LOG_FILE = 'honeypot.log';

// ログ書き込み用のヘルパー関数
const logEvent = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    process.stdout.write(logMessage); // コンソールにも出力
    fs.appendFile(LOG_FILE, logMessage, (err) => {
        if (err) console.error('ログの書き込みに失敗しました:', err);
    });
};

// TCPサーバーの作成
const server = net.createServer((socket) => {
    // 接続元のIPアドレスを取得 (IPv4射影アドレスをクリーンアップ)
    const clientIP = socket.remoteAddress.replace(/^.*:/, '');
    logEvent(`New connection from ${clientIP}`);

    let loginStep = 0;
    let username = '';

    // 接続時に偽のログインプロンプトを送信
    socket.write("Ubuntu 20.04.4 LTS\r\n\r\nlogin: ");

    // クライアントからデータを受信したときのイベント
    socket.on('data', (data) => {
        // 入力されたデータの改行や空白を削除
        const input = data.toString().trim();

        if (loginStep === 0) {
            // ステップ0: ユーザー名の入力
            username = input;
            logEvent(`[${clientIP}] Username tried: ${username}`);
            socket.write("Password: ");
            loginStep++;
        } else if (loginStep === 1) {
            // ステップ1: パスワードの入力
            const password = input;
            logEvent(`[${clientIP}] Password tried: ${password}`);

            // 常に認証失敗として切断
            socket.write("\r\nLogin incorrect\r\n");
            socket.end();
        }
    });

    // エラーハンドリング (攻撃者が強制切断した場合など)
    socket.on('error', (err) => {
        logEvent(`[${clientIP}] Connection error: ${err.message}`);
    });

    // 切断時のイベント
    socket.on('end', () => {
        logEvent(`[${clientIP}] Disconnected`);
    });
});

// サーバーの起動
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Node.js Telnet Honeypot is listening on port ${PORT}...`);
});
