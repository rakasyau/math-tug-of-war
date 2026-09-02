const PeerManager = (() => {
  let peer = null;
  let conn = null;
  let isHost = false;
  let roomCode = null;
  let onDataCb = null;
  let onConnectCb = null;
  let onDisconnectCb = null;
  let connected = false;
  
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Create room - returns immediately, connects in background
  function createRoom() {
    isHost = true;
    roomCode = generateCode();
    
    if (peer) peer.destroy();
    
    return new Promise((resolve) => {
      // Resolve immediately with room code
      setTimeout(() => resolve({ roomCode }), 500);
      
      // Create peer in background
      peer = new Peer('mtow-' + roomCode);
      
      peer.on('open', (id) => {
        console.log('[PEER] Host ready, id:', id);
      });
      
      peer.on('connection', (c) => {
        console.log('[PEER] Guest connected!');
        conn = c;
        setupConn();
        connected = true;
        if (onConnectCb) onConnectCb();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Host error:', err);
      });
      
      peer.on('disconnected', () => {
        console.log('[PEER] Host disconnected');
        connected = false;
        if (onDisconnectCb) onDisconnectCb();
      });
    });
  }
  
  // Join room - returns immediately, connects in background
  function joinRoom(code) {
    isHost = false;
    roomCode = code;
    
    if (peer) peer.destroy();
    
    return new Promise((resolve) => {
      // Resolve immediately with room code
      setTimeout(() => resolve({ roomCode: code }), 500);
      
      // Create peer and connect in background
      peer = new Peer();
      
      peer.on('open', () => {
        console.log('[PEER] Guest ready, connecting to host...');
        conn = peer.connect('mtow-' + code, { reliable: true });
        
        conn.on('open', () => {
          console.log('[PEER] Connected to host!');
          setupConn();
          connected = true;
          if (onConnectCb) onConnectCb();
        });
        
        conn.on('error', (err) => {
          console.error('[PEER] Connection error:', err);
        });
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Guest error:', err);
      });
    });
  }
  
  function setupConn() {
    conn.on('data', (d) => {
      console.log('[PEER] Data:', d.type);
      if (onDataCb) onDataCb(d);
    });
    conn.on('close', () => {
      connected = false;
      if (onDisconnectCb) onDisconnectCb();
    });
    conn.on('error', (err) => {
      console.error('[PEER] Conn error:', err);
    });
  }
  
  function send(data) {
    if (conn && conn.open) {
      conn.send(data);
      return true;
    }
    return false;
  }
  
  function disconnect() {
    if (conn) conn.close();
    if (peer) peer.destroy();
    conn = null;
    peer = null;
    connected = false;
  }
  
  return {
    createRoom, joinRoom, send, disconnect,
    onData: (cb) => { onDataCb = cb; },
    onConnected: (cb) => { onConnectCb = cb; },
    onDisconnected: (cb) => { onDisconnectCb = cb; },
    get isHost() { return isHost; },
    get roomCode() { return roomCode; },
    get isConnected() { return connected; }
  };
})();
