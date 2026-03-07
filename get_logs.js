const { execSync } = require('child_process');
const fs = require('fs');

try {
    const logs = execSync('docker logs --tail 5000 ticketz-backend-1', { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    const lines = logs.split('\n');
    const filtered = lines.filter(line => {
        const lower = line.toLowerCase();
        return lower.includes('telegram') || lower.includes('wacloud') || lower.includes('axios') || lower.includes('document') || lower.includes('webhook');
    });
    fs.writeFileSync('filtered_logs.txt', filtered.join('\n'), 'utf-8');
    console.log('Logs filtrados com sucesso! Encontradas ' + filtered.length + ' linhas.');
} catch (e) {
    console.error('Erro:', e.message);
}
