/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — PeerJS P2P (Simplified & Fixed)
   ═══════════════════════════════════════════════════════════════════════════ */

const PeerManager = (() => {
  let peer = null;
  let conn = null;
  let isHost = false;
  let roomCode = null;
  let onDataCb = null;
  let onConnectCb = null;
  let onDisconnectCb = null;
  
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  function createRoom() {
    return new Promise((resolve, reject) => {
      isHost = true;
      roomCode = generateCode();
      
      if (peer) peer.destroy();
      
      peer = new Peer('mtow-' + roomCode);
      
      peer.on('open', (id) => {
        console.log('[PEER] Host ready:', id);
        resolve({ roomCode });
      });
      
      peer.on('connection', (c) => {
        conn = c;
        setupConn();
        if (onConnectCb) onConnectCb();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER]', err);
        reject(err);
      });
      
      peer.on('disconnected', () => {
        if (onDisconnectCb) onDisconnectCb();
      });
    });
  }
  
  function joinRoom(code) {
    return new Promise((resolve, reject) => {
      isHost = false;
      roomCode = code;
      
      if (peer) peer.destroy();
      
      peer = new Peer();
      
      peer.on('open', () => {
        conn = peer.connect('mtow-' + code, { reliable: true });
        
        conn.on('open', () => {
          setupConn();
          resolve({ roomCode: code });
          if (onConnectCb) onConnectCb();
        });
        
        conn.on('error', reject);
      });
      
      peer.on('error', reject);
    });
  }
  
  function setupConn() {
    conn.on('data', (d) => { if (onDataCb) onDataCb(d); });
    conn.on('close', () => { if (onDisconnectCb) onDisconnectCb(); });
  }
  
  function send(data) {
    if (conn && conn.open) { conn.send(data); return true; }
    return false;
  }
  
  function disconnect() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    conn = null; peer = null;
  }
  
  return {
    createRoom, joinRoom, send, disconnect,
    onData: (cb) => { onDataCb = cb; },
    onConnected: (cb) => { onConnectCb = cb; },
    onDisconnected: (cb) => { onDisconnectCb = cb; },
    get isHost() { return isHost; },
    get roomCode() { return roomCode; },
  };
})();
