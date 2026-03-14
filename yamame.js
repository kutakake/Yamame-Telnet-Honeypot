const net = require('net');
const fs = require('fs');

const PORT = 2323;
const LOG_FILE = 'honeypot.log';
const JSON_LOG_FILE = 'commands.json';
const SAVE_INTERVAL = 10000; // 10 秒

// RAM 上のデータストア
let commandData = {};

// JSON ファイルからデータをロード
const loadCommandData = () => {
    try {
        if (fs.existsSync(JSON_LOG_FILE)) {
            const data = fs.readFileSync(JSON_LOG_FILE, 'utf8');
            commandData = JSON.parse(data);
            console.log('既存のコマンドデータを読み込みました');
        }
    } catch (err) {
        console.error('JSON ファイルの読み込みに失敗しました:', err);
        commandData = {};
    }
};

// RAM 上のデータを JSON ファイルに保存
const saveCommandData = () => {
    try {
        fs.writeFileSync(JSON_LOG_FILE, JSON.stringify(commandData, null, 2), 'utf8');
    } catch (err) {
        console.error('JSON ファイルの書き込みに失敗しました:', err);
    }
};

// ログ書き込み用のヘルパー関数
const logEvent = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    process.stdout.write(logMessage); // コンソールにも出力
    fs.appendFile(LOG_FILE, logMessage, (err) => {
        if (err) console.error('ログの書き込みに失敗しました:', err);
    });
};

// コマンドを記録する関数
const recordCommand = (clientIP, command) => {
    const timestamp = new Date().toISOString();
    
    if (!commandData[clientIP]) {
        commandData[clientIP] = [];
    }
    
    commandData[clientIP].push({
        timestamp: timestamp,
        command: command
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
            // ステップ 1: パスワードの入力
            const password = input;
            logEvent(`[${clientIP}] Password tried: ${password}`);

            // 常に認証成功として処理
            socket.write("\r\nWelcome to Ubuntu!\r\n$ ");
            loginStep++;
        } else if (loginStep === 2) {
            // ステップ 2: コマンド入力（認証突破後）
            logEvent(`[${clientIP}] Command executed: ${input}`);
            recordCommand(clientIP, input);

            // ダミーの出力を返す
            socket.write("\r\n-bash: command not found\r\n$ ");
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
const startServer = () => {
    // JSON データをロード
    loadCommandData();

    // 10 秒ごとにデータを保存
    setInterval(saveCommandData, SAVE_INTERVAL);

    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Node.js Telnet Honeypot is listening on port ${PORT}...`);
    });
};

// プロセス終了時にデータを保存
process.on('SIGINT', () => {
    saveCommandData();
    console.log('\nコマンドデータを保存してシャットダウンします');
    process.exit(0);
});

startServer();
