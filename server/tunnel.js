const localtunnel = require('localtunnel');
const fs = require('fs');

(async () => {
  try {
    const tunnel = await localtunnel({ port: 3000 });
    const url = tunnel.url;
    fs.writeFileSync(__dirname + '/tunnel-url.txt', url);
    console.log('');
    console.log('═══════════════════════════════════════');
    console.log('  🌐  Public URL: ' + url);
    console.log('  📋  Menu:       ' + url + '/menu/index.html');
    console.log('  📋  Admin:      ' + url + '/login.html');
    console.log('═══════════════════════════════════════');
    console.log('');

    tunnel.on('close', () => {
      try { fs.unlinkSync(__dirname + '/tunnel-url.txt'); } catch(e) {}
    });
  } catch(e) {
    console.log('Tunnel error: ' + e.message);
    console.log('The tunnel service might be blocked on this network.');
    console.log('Try connecting directly via http://10.0.0.33:3000 from your phone.');
  }
})();
