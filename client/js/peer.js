/* ═══════════════════════════════════════════════════════════════════════════
   MATH TUG OF WAR — PeerJS P2P Connection
   Koneksi langsung antar browser, tidak perlu server WebSocket
   ═══════════════════════════════════════════════════════════════════════════ */

const PeerManager = (() => {
  let peer = null;
  let conn = null;
  let isHost = false;
  let roomCode = null;
  let onDataCallback = null;
  let onConnectedCallback = null;
  let onDisconnectedCallback = null;
  
  // Generate 6-digit room code
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Create a new room (host)
  function createRoom() {
    return new Promise((resolve, reject) => {
      isHost = true;
      roomCode = generateCode();
      
      peer = new Peer('mtow-' + roomCode, {
        debug: 1
      });
      
      peer.on('open', (id) => {
        console.log('[PEER] Host created with ID:', id);
        roomCode = roomCode; // Room code is the suffix
        resolve({ roomCode, peerId: id });
      });
      
      peer.on('connection', (connection) => {
        console.log('[PEER] Incoming connection from:', connection.peer);
        conn = connection;
        setupConnection();
        if (onConnectedCallback) onConnectedCallback();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Error:', err);
        reject(err);
      });
    });
  }
  
  // Join an existing room
  function joinRoom(code) {
    return new Promise((resolve, reject) => {
      isHost = false;
      roomCode = code;
      
      peer = new Peer({
        debug: 1
      });
      
      peer.on('open', (id) => {
        console.log('[PEER] Joined with ID:', id);
        conn = peer.connect('mtow-' + code, { reliable: true });
        setupConnection();
        resolve({ roomCode: code, peerId: id });
        if (onConnectedCallback) onConnectedCallback();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Error:', err);
        reject(err);
      });
    });
  }
  
  function setupConnection() {
    conn.on('open', () => {
      console.log('[PEER] Connection opened');
    });
    
    conn.on('data', (data) => {
      console.log('[PEER] Data received:', data.type);
      if (onDataCallback) onDataCallback(data);
    });
    
    conn.on('close', () => {
      console.log('[PEER] Connection closed');
      if (onDisconnectedCallback) onDisconnectedCallback();
    });
    
    conn.on('error', (err) => {
      console.error('[PEER] Connection error:', err);
    });
  }
  
  function send(data) {
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }
  
  function onData(callback) {
    onDataCallback = callback;
  }
  
  function onConnected(callback) {
    onConnectedCallback = callback;
  }
  
  function onDisconnected(callback) {
    onDisconnectedCallback = callback;
  }
  
  function disconnect() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    conn = null;
    peer = null;
  }
  
  return {
    createRoom,
    joinRoom,
    send,
    onData,
    onConnected,
    onDisconnected,
    disconnect,
    get isHost() { return isHost; },
    get roomCode() { return roomCode; },
    get isConnected() { return conn && conn.open; }
  };
})();
