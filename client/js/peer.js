const PeerManager = (() => {
  let peer = null;
  let conn = null;
  let isHost = false;
  let roomCode = null;
  let onDataCb = null;
  let onConnectCb = null;
  let onDisconnectCb = null;
  let connected = false;
  
  // Matchmaking state
  let matchmakingActive = false;
  let matchmakingPeer = null; // Separate peer for scanning
  let onMatchmakingStatusCb = null;
  
  const QUEUE_SLOTS = 5;
  const SCAN_TIMEOUT_MS = 3500;
  const WAIT_TIMEOUT_MS = 60000;
  
  // Comprehensive ICE Configuration (Google STUN + Metered OpenRelay TURN)
  // TURN relay is essential for NAT traversal across mobile cellular networks (CGNAT/Symmetric NAT)
  const PEER_CONFIG = {
    debug: 1,
    config: {
      iceServers: [
        // Google Public STUN
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Metered OpenRelay STUN + TURN (Public & Free WebRTC Relay)
        { urls: 'stun:openrelay.metered.ca:80' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443?transport=tcp',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10
    }
  };
  
  function generateCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  function queuePeerId(difficulty, slot) {
    return `mtow-q-${difficulty}-${slot}`;
  }
  
  function emitStatus(status, detail = '') {
    if (onMatchmakingStatusCb) onMatchmakingStatusCb(status, detail);
  }
  
  // ─── Matchmaking: Find a Match ────────────────────────────────────────────
  function findMatch(difficulty, playerName) {
    return new Promise((resolve, reject) => {
      if (matchmakingActive) {
        reject(new Error('Pencarian lawan sedang berlangsung'));
        return;
      }
      
      matchmakingActive = true;
      
      // Clean up any existing connections
      disconnect();
      
      console.log(`[MM] Starting matchmaking for difficulty: ${difficulty}`);
      emitStatus('scanning', 'Mencari lawan...');
      
      // Phase 1: Scan for waiting players
      scanForMatch(difficulty, playerName)
        .then(result => {
          if (!matchmakingActive) {
            reject(new Error('Matchmaking dibatalkan'));
            return;
          }
          if (result) {
            // Found a match as guest!
            console.log('[MM] Found match as guest!');
            finishMatchmaking(result, resolve);
          } else {
            // Phase 2: Wait for someone to find us
            console.log('[MM] No match found, waiting as host...');
            emitStatus('waiting', 'Menunggu lawan...');
            waitForMatch(difficulty, playerName)
              .then(result => {
                if (!matchmakingActive) {
                  reject(new Error('Matchmaking dibatalkan'));
                  return;
                }
                if (result) {
                  console.log('[MM] Found match as host!');
                  finishMatchmaking(result, resolve);
                } else {
                  matchmakingActive = false;
                  reject(new Error('Tidak ada lawan ditemukan saat ini. Coba lagi atau ajak teman lewat kode room!'));
                }
              })
              .catch(err => {
                matchmakingActive = false;
                reject(err);
              });
          }
        })
        .catch(err => {
          matchmakingActive = false;
          reject(err);
        });
    });
  }
  
  function finishMatchmaking(result, resolve) {
    matchmakingActive = false;
    isHost = result.role === 'host';
    roomCode = result.roomCode;
    
    // Transfer the matchmaking peer/conn to main peer/conn
    peer = result.peer;
    conn = result.conn;
    connected = true;
    
    // Set up the connection for game data
    setupConn();
    
    // Notify connection callback
    if (onConnectCb) onConnectCb();
    
    resolve(result);
  }
  
  // Phase 1: Try to connect to existing queue slots
  function scanForMatch(difficulty, playerName) {
    return new Promise(async (resolve) => {
      const scanPeer = new Peer(PEER_CONFIG);
      
      await new Promise((res) => {
        scanPeer.on('open', () => res());
        scanPeer.on('error', (err) => {
          console.log('[MM] Scan peer error:', err?.type);
          res();
        });
        setTimeout(() => res(), 4000);
      });
      
      if (!matchmakingActive || scanPeer.destroyed) {
        if (!scanPeer.destroyed) scanPeer.destroy();
        resolve(null);
        return;
      }
      
      console.log('[MM] Scan peer ready, checking slots...');
      
      for (let slot = 0; slot < QUEUE_SLOTS; slot++) {
        if (!matchmakingActive) {
          scanPeer.destroy();
          resolve(null);
          return;
        }
        
        const peerId = queuePeerId(difficulty, slot);
        emitStatus('scanning', `Mencari lawan... (slot ${slot + 1}/${QUEUE_SLOTS})`);
        console.log(`[MM] Trying slot ${slot}: ${peerId}`);
        
        const result = await tryConnectToSlot(scanPeer, peerId, playerName);
        
        if (result) {
          resolve({
            role: 'guest',
            roomCode: result.roomCode,
            opponentName: result.opponentName,
            peer: scanPeer,
            conn: result.conn,
          });
          return;
        }
      }
      
      console.log('[MM] No matches found in any slot');
      scanPeer.destroy();
      resolve(null);
    });
  }
  
  // Try to connect to a single queue slot
  function tryConnectToSlot(scanPeer, peerId, playerName) {
    return new Promise((resolve) => {
      let resolved = false;
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (testConn && !testConn.open) {
            try { testConn.close(); } catch(e) {}
          }
          resolve(null);
        }
      }, SCAN_TIMEOUT_MS);
      
      let testConn;
      try {
        testConn = scanPeer.connect(peerId, { reliable: true });
      } catch (e) {
        clearTimeout(timeout);
        resolve(null);
        return;
      }
      
      testConn.on('open', () => {
        console.log(`[MM] Connected to ${peerId}, sending HELLO...`);
        testConn.send({ type: 'MM_HELLO', playerName });
      });
      
      testConn.on('data', (data) => {
        if (data && data.type === 'MM_WELCOME' && !resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`[MM] Received WELCOME from ${data.playerName}`);
          resolve({
            conn: testConn,
            roomCode: data.roomCode,
            opponentName: data.playerName,
          });
        }
      });
      
      testConn.on('error', () => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });
  }
  
  // Phase 2: Register at a queue slot and wait for someone to find us
  function waitForMatch(difficulty, playerName) {
    return new Promise(async (resolve) => {
      const code = generateCode();
      let resolved = false;
      let waitPeer = null;
      let registeredSlot = -1;
      
      for (let slot = 0; slot < QUEUE_SLOTS; slot++) {
        if (!matchmakingActive) {
          resolve(null);
          return;
        }
        
        const peerId = queuePeerId(difficulty, slot);
        console.log(`[MM] Trying to register at slot ${slot}: ${peerId}`);
        
        const result = await tryRegisterSlot(peerId);
        
        if (result) {
          waitPeer = result;
          registeredSlot = slot;
          console.log(`[MM] Registered at slot ${slot}`);
          emitStatus('waiting', `Menunggu lawan... (slot ${slot + 1})`);
          break;
        }
      }
      
      if (registeredSlot === -1) {
        console.log('[MM] All slots full!');
        emitStatus('error', 'Antrian penuh, coba lagi sebentar...');
        resolve(null);
        return;
      }
      
      matchmakingPeer = waitPeer;
      
      const waitTimeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('[MM] Wait timeout reached');
          emitStatus('timeout', 'Tidak ada lawan ditemukan');
          if (waitPeer && !waitPeer.destroyed) waitPeer.destroy();
          matchmakingPeer = null;
          resolve(null);
        }
      }, WAIT_TIMEOUT_MS);
      
      waitPeer.on('connection', (incomingConn) => {
        console.log('[MM] Incoming connection from seeker!');
        
        incomingConn.on('data', (data) => {
          if (data && data.type === 'MM_HELLO' && !resolved) {
            console.log(`[MM] Received HELLO from ${data.playerName}`);
            
            incomingConn.send({
              type: 'MM_WELCOME',
              playerName: playerName,
              roomCode: code,
            });
            
            resolved = true;
            clearTimeout(waitTimeout);
            matchmakingPeer = null;
            
            resolve({
              role: 'host',
              roomCode: code,
              opponentName: data.playerName,
              peer: waitPeer,
              conn: incomingConn,
            });
          }
        });
        
        incomingConn.on('error', (err) => {
          console.log('[MM] Incoming conn error:', err);
        });
      });
      
      waitPeer.on('disconnected', () => {
        if (!resolved) {
          console.log('[MM] Wait peer disconnected, reconnecting...');
          try { waitPeer.reconnect(); } catch(e) {}
        }
      });
      
      waitPeer.on('error', (err) => {
        console.log('[MM] Wait peer error:', err?.type);
        if (err && (err.type === 'unavailable-id' || err.type === 'server-error')) {
          if (!resolved) {
            resolved = true;
            clearTimeout(waitTimeout);
            matchmakingPeer = null;
            resolve(null);
          }
        }
      });
    });
  }
  
  function tryRegisterSlot(peerId) {
    return new Promise((resolve) => {
      let resolved = false;
      
      const testPeer = new Peer(peerId, PEER_CONFIG);
      
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          if (!testPeer.destroyed) testPeer.destroy();
          resolve(null);
        }
      }, 4000);
      
      testPeer.on('open', (id) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`[MM] Successfully registered as: ${id}`);
          resolve(testPeer);
        }
      });
      
      testPeer.on('error', (err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timeout);
          console.log(`[MM] Slot ${peerId} taken or error: ${err?.type}`);
          if (!testPeer.destroyed) testPeer.destroy();
          resolve(null);
        }
      });
    });
  }
  
  function cancelMatchmaking() {
    console.log('[MM] Cancelling matchmaking');
    matchmakingActive = false;
    
    if (matchmakingPeer && !matchmakingPeer.destroyed) {
      matchmakingPeer.destroy();
      matchmakingPeer = null;
    }
    
    if (peer && !peer.destroyed) {
      peer.destroy();
      peer = null;
    }
    conn = null;
    connected = false;
  }
  
  // ─── Private Room: Create ─────────────────────────────────────────────────
  function createRoom() {
    isHost = true;
    roomCode = generateCode();
    
    disconnect();
    
    return new Promise((resolve, reject) => {
      let isSettled = false;
      
      const timeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          disconnect();
          reject(new Error('Waktu koneksi habis saat membuat room. Periksa koneksi internetmu dan coba lagi.'));
        }
      }, 12000);
      
      peer = new Peer('mtow-' + roomCode, PEER_CONFIG);
      
      peer.on('open', (id) => {
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          console.log('[PEER] Host room registered successfully, id:', id);
          resolve({ roomCode });
        }
      });
      
      peer.on('connection', (c) => {
        console.log('[PEER] Guest incoming connection accepted!');
        conn = c;
        setupConn();
        connected = true;
        if (onConnectCb) onConnectCb();
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Host error:', err);
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          disconnect();
          if (err?.type === 'unavailable-id') {
            // Collision, auto retry with new code
            createRoom().then(resolve).catch(reject);
            return;
          }
          reject(new Error('Gagal membuat room: ' + (err?.message || err?.type || 'Unknown error')));
        }
      });
      
      peer.on('disconnected', () => {
        console.log('[PEER] Host disconnected from broker server, reconnecting...');
        try { peer.reconnect(); } catch(e) {}
      });
    });
  }
  
  // ─── Private Room: Join ───────────────────────────────────────────────────
  function joinRoom(code) {
    isHost = false;
    roomCode = code;
    
    disconnect();
    
    return new Promise((resolve, reject) => {
      let isSettled = false;
      
      const timeout = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          disconnect();
          reject(new Error(`Gagal terhubung ke room "${code}" (timeout). Pastikan pembuat room masih menunggu dan kode sudah benar.`));
        }
      }, 15000);
      
      peer = new Peer(PEER_CONFIG);
      
      peer.on('open', (myId) => {
        console.log('[PEER] Guest peer open with id:', myId, 'connecting to mtow-' + code);
        
        conn = peer.connect('mtow-' + code, {
          reliable: true
        });
        
        conn.on('open', () => {
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeout);
            console.log('[PEER] Data connection established with host!');
            setupConn();
            connected = true;
            if (onConnectCb) onConnectCb();
            resolve({ roomCode: code });
          }
        });
        
        conn.on('error', (err) => {
          console.error('[PEER] Conn error:', err);
          if (!isSettled) {
            isSettled = true;
            clearTimeout(timeout);
            disconnect();
            reject(new Error('Koneksi ke host gagal: ' + (err?.message || err?.type || 'Connection error')));
          }
        });
        
        conn.on('close', () => {
          console.log('[PEER] Connection closed');
          connected = false;
          if (onDisconnectCb) onDisconnectCb();
        });
      });
      
      peer.on('error', (err) => {
        console.error('[PEER] Guest peer error:', err);
        if (!isSettled) {
          isSettled = true;
          clearTimeout(timeout);
          disconnect();
          if (err?.type === 'peer-unavailable') {
            reject(new Error(`Room "${code}" tidak ditemukan! Pastikan temanmu sudah klik "Buat Room" dan masih berada di layar waiting room.`));
          } else {
            reject(new Error('Gagal menghubungkan: ' + (err?.message || err?.type || 'Network error')));
          }
        }
      });
    });
  }
  
  // ─── Connection Management ────────────────────────────────────────────────
  function setupConn() {
    if (!conn) return;
    
    conn.on('data', (d) => {
      console.log('[PEER] Data received:', d?.type);
      if (onDataCb) onDataCb(d);
    });
    
    conn.on('close', () => {
      console.log('[PEER] Connection closed');
      connected = false;
      if (onDisconnectCb) onDisconnectCb();
    });
    
    conn.on('error', (err) => {
      console.error('[PEER] Conn error:', err);
    });
  }
  
  function send(data) {
    if (conn && conn.open) {
      try {
        conn.send(data);
        return true;
      } catch (err) {
        console.error('[PEER] Send error:', err);
        return false;
      }
    }
    console.warn('[PEER] Cannot send, connection is not open');
    return false;
  }
  
  function disconnect() {
    if (conn) {
      try { conn.close(); } catch(e) {}
      conn = null;
    }
    if (peer) {
      try { peer.destroy(); } catch(e) {}
      peer = null;
    }
    connected = false;
    matchmakingActive = false;
    if (matchmakingPeer && !matchmakingPeer.destroyed) {
      try { matchmakingPeer.destroy(); } catch(e) {}
      matchmakingPeer = null;
    }
  }
  
  return {
    createRoom, joinRoom, send, disconnect,
    findMatch, cancelMatchmaking,
    onData: (cb) => { onDataCb = cb; },
    onConnected: (cb) => { onConnectCb = cb; },
    onDisconnected: (cb) => { onDisconnectCb = cb; },
    onMatchmakingStatus: (cb) => { onMatchmakingStatusCb = cb; },
    get isHost() { return isHost; },
    get roomCode() { return roomCode; },
    get isConnected() { return connected; },
    get isMatchmaking() { return matchmakingActive; },
  };
})();
