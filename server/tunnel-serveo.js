const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const URL_FILE = path.join(__dirname, 'tunnel-url.txt');

const ssh = spawn('C:\\Windows\\System32\\OpenSSH\\ssh.exe', [
    '-o', 'StrictHostKeyChecking=no',
    '-o', 'ServerAliveInterval=30',
    '-R', '80:localhost:3000',
    'serveo.net'
], { stdio: ['ignore', 'pipe', 'pipe'] });

let url = '';

ssh.stdout.on('data', data => {
    const text = data.toString();
    console.log(text.trim());
    const match = text.match(/https:\/\/[a-z0-9-]+\.serveousercontent\.com/);
    if (match && !url) {
        url = match[0];
        fs.writeFileSync(URL_FILE, url);
        console.log('\n===========================================');
        console.log(`🌐  Public URL: ${url}`);
        console.log(`📋  Menu:       ${url}/menu/index.html`);
        console.log(`🔐  Admin:      ${url}/login.html`);
        console.log('===========================================\n');
    }
});

ssh.stderr.on('data', data => {
    const text = data.toString();
    if (text.includes('Forwarding')) {
        const match = text.match(/https:\/\/[a-z0-9-]+\.serveousercontent\.com/);
        if (match && !url) {
            url = match[0];
            fs.writeFileSync(URL_FILE, url);
            console.log('\n===========================================');
            console.log(`🌐  Public URL: ${url}`);
            console.log(`📋  Menu:       ${url}/menu/index.html`);
            console.log(`🔐  Admin:      ${url}/login.html`);
            console.log('===========================================\n');
        }
    }
});

ssh.on('close', code => {
    console.log(`🔴 Tunnel closed (exit code: ${code})`);
    try { fs.unlinkSync(URL_FILE); } catch(e) {}
    process.exit();
});

process.on('SIGINT', () => {
    ssh.kill();
    process.exit();
});

console.log('⏳ Connecting to serveo.net tunnel...');
