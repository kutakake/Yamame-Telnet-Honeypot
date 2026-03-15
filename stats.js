const fs = require('fs');

const JSON_LOG_FILE = 'commands.json';

// JSON ファイルからデータをロード
let commandData = {};
try {
    if (fs.existsSync(JSON_LOG_FILE)) {
        const data = fs.readFileSync(JSON_LOG_FILE, 'utf8');
        commandData = JSON.parse(data);
    } else {
        console.log('commands.json が見つかりません');
        process.exit(1);
    }
} catch (err) {
    console.error('JSON ファイルの読み込みに失敗しました:', err.message);
    process.exit(1);
}

// IP アドレスごとのコマンド数をカウント
const ipStats = Object.entries(commandData).map(([ip, commands]) => ({
    ip: ip,
    count: commands.length
}));

// コマンド数で降順ソート
ipStats.sort((a, b) => b.count - a.count);

// コマンドごとの出現回数をカウント
const commandCounts = {};
Object.values(commandData).forEach(commands => {
    commands.forEach(cmd => {
        const command = cmd.command;
        if (commandCounts[command]) {
            commandCounts[command]++;
        } else {
            commandCounts[command] = 1;
        }
    });
});

// コマンドを出現回数で降順ソート
const sortedCommands = Object.entries(commandCounts)
    .map(([cmd, count]) => ({ command: cmd, count }))
    .sort((a, b) => b.count - a.count);

console.log('=== 入力されたコマンドランキング ===\n');

if (sortedCommands.length === 0) {
    console.log('データがありません\n');
} else {
    sortedCommands.forEach((item, index) => {
        console.log(`${index + 1}. "${item.command}": ${item.count} 回`);
    });
}

console.log('\n=== IP アドレス別コマンド入力数ランキング ===\n');

if (ipStats.length === 0 || ipStats[0].count === 0) {
    console.log('データがありません\n');
} else {
    ipStats.forEach((stat, index) => {
        console.log(`${index + 1}. ${stat.ip}: ${stat.count} コマンド`);
    });
}

console.log('\n=== 攻撃者 IP アドレス一覧 ===\n');

const uniqueIPs = Object.keys(commandData).sort();

if (uniqueIPs.length === 0) {
    console.log('データがありません\n');
} else {
    uniqueIPs.forEach(ip => {
        console.log(ip);
    });
}

console.log(`\n総計: ${uniqueIPs.length} 個の IP アドレス`);
console.log(`総コマンド数: ${ipStats.reduce((sum, stat) => sum + stat.count, 0)} コマンド`);
