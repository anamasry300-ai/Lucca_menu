try {
  const lt = require('localtunnel');
  console.log('localtunnel loaded OK');
} catch(e) {
  console.log('load error: ' + e.message);
}
