/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — PeerJS P2P Connection (Fixed & Optimized)
   ═══════════════════════════════════════════════════════════════════════════ */

const PeerManager = (() => {
  let peer = null;
  let conn = null;
  let isHost = false;
  let roomCode = null;
  let onDataCallback = null;
  let onConnectedCallback = null;
  let onDisconnectedCallback = null;
  let connectionTimeout = null;
  
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  function createRoom() {
    return new Promise((resolve, reject) => {
      isHost = true;
      roomCode = generateCode();
      
      // Cleanup existing peer
      if (peer) peer.destroy();
      
      peer = new Peer('mtow-' + roomCode, {
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });
      
      // Timeout after 30 seconds
      connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout - failed to create room'));
      }, 30000);
      
      peer.on('open', (id) => {
        console.log('[PEER] Host created:', id);
        resolve({ roomCode, peerId: id });
      });
      
      peer.on('connection', (connection) => {
        console.log('[PEER] Guest connected');
        conn = connection;
        setupConnection();
        if (onConnectedCallback) onConnectedCallback();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Error:', err);
        clearTimeout(connectionTimeout);
        reject(err);
      });
      
      peer.on('disconnected', () => {
        console.log('[PEER] Disconnected');
        if (onDisconnectedCallback) onDisconnectedCallback();
      });
    });
  }
  
  function joinRoom(code) {
    return new Promise((resolve, reject) => {
      isHost = false;
      roomCode = code;
      
      if (peer) peer.destroy();
      
      peer = new Peer({
        debug: 0,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
          ]
        }
      });
      
      connectionTimeout = setTimeout(() => {
        reject(new Error('Connection timeout - failed to join room'));
      }, 30000);
      
      peer.on('open', (id) => {
        console.log('[PEER] Joined, connecting to host...');
        conn = peer.connect('mtow-' + code, { reliable: true });
        
        conn.on('open', () => {
          console.log('[PEER] Connected to host');
          clearTimeout(connectionTimeout);
          setupConnection();
          resolve({ roomCode: code, peerId: id });
          if (onConnectedCallback) onConnectedCallback();
        });
        
        conn.on('error', (err) => {
          console.error('[PEER] Connection error:', err);
          clearTimeout(connectionTimeout);
          reject(err);
        });
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Error:', err);
        clearTimeout(connectionTimeout);
        reject(err);
      });
      
      peer.on('disconnected', () => {
        console.log('[PEER] Disconnected');
        if (onDisconnectedCallback) onDisconnectedCallback();
      });
    });
  }
  
  function setupConnection() {
    conn.on('data', (data) => {
      console.log('[PEER] Data:', data.type);
      if (onDataCallback) onDataCallback(data);
    });
    
    conn.on('close', () => {
      console.log('[PEER] Connection closed');
      if (onDisconnectedCallback) onDisconnectedCallback();
    });
    
    conn.on('error', (err) => {
      console.error('[PEER] Error:', err);
    });
  }
  
  function send(data) {
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }
  
  function onData(callback) { onDataCallback = callback; }
  function onConnected(callback) { onConnectedCallback = callback; }
  function onDisconnected(callback) { onDisconnectedCallback = callback; }
  
  function disconnect() {
    if (connectionTimeout) clearTimeout(connectionTimeout);
    if (conn) conn.close();
    if (peer) peer.destroy();
    conn = null;
    peer = null;
  }
  
  return {
    createRoom, joinRoom, send,
    onData, onConnected, onDisconnected, disconnect,
    get isHost() { return isHost; },
    get roomCode() { return roomCode; },
    get isConnected() { return conn && conn.open; }
  };
})();
