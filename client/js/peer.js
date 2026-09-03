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
  
  const PEER_CONFIG = {
    config: {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
      ]
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
        reject(new Error('Matchmaking already in progress'));
        return;
      }
      
      matchmakingActive = true;
      
      // Clean up any existing connections
      if (peer) { peer.destroy(); peer = null; }
      if (conn) { conn = null; }
      connected = false;
      
      console.log(`[MM] Starting matchmaking for difficulty: ${difficulty}`);
      emitStatus('scanning', 'Mencari lawan...');
      
      // Phase 1: Scan for waiting players
      scanForMatch(difficulty, playerName)
        .then(result => {
          if (!matchmakingActive) {
            reject(new Error('Matchmaking cancelled'));
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
                  reject(new Error('Matchmaking cancelled'));
                  return;
                }
                if (result) {
                  console.log('[MM] Found match as host!');
                  finishMatchmaking(result, resolve);
                } else {
                  matchmakingActive = false;
                  reject(new Error('Tidak ada lawan ditemukan. Coba lagi!'));
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
      // Create a temporary anonymous peer for scanning
      const scanPeer = new Peer(PEER_CONFIG);
      
      await new Promise((res, rej) => {
        scanPeer.on('open', () => res());
        scanPeer.on('error', (err) => {
          console.log('[MM] Scan peer error:', err.type);
          // If peer creation fails, just resolve null (will proceed to waiting)
          res();
        });
        // Timeout for peer creation
        setTimeout(() => res(), 5000);
      });
      
      if (!matchmakingActive || scanPeer.destroyed) {
        if (!scanPeer.destroyed) scanPeer.destroy();
        resolve(null);
        return;
      }
      
      console.log('[MM] Scan peer ready, checking slots...');
      
      // Try each slot sequentially
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
          // Successfully matched! Don't destroy scanPeer — it's now our game peer
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
      
      // No match found in any slot
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
        if (data.type === 'MM_WELCOME' && !resolved) {
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
      
      // Try to register at an available slot
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
        emitStatus('error', 'Antrian penuh, coba lagi...');
        resolve(null);
        return;
      }
      
      // Store reference so cancelMatchmaking can clean up
      matchmakingPeer = waitPeer;
      
      // Wait timeout
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
      
      // Listen for incoming connections
      waitPeer.on('connection', (incomingConn) => {
        console.log('[MM] Incoming connection!');
        
        incomingConn.on('data', (data) => {
          if (data.type === 'MM_HELLO' && !resolved) {
            console.log(`[MM] Received HELLO from ${data.playerName}`);
            
            // Send welcome back
            incomingConn.send({
              type: 'MM_WELCOME',
              playerName: playerName,
              roomCode: code,
            });
            
            resolved = true;
            clearTimeout(waitTimeout);
            matchmakingPeer = null;
            
            // We need to re-create as the game host with proper room ID
            // But first, use this connection for the game
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
      
      // Handle peer disconnect while waiting
      waitPeer.on('disconnected', () => {
        if (!resolved) {
          console.log('[MM] Wait peer disconnected, trying to reconnect...');
          try { waitPeer.reconnect(); } catch(e) {}
        }
      });
      
      waitPeer.on('error', (err) => {
        console.log('[MM] Wait peer error:', err.type);
        if (err.type === 'unavailable-id' || err.type === 'server-error') {
          // Slot became unavailable — someone else took it
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
  
  // Try to register a peer at a specific ID
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
          console.log(`[MM] Slot ${peerId} taken or error: ${err.type}`);
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
    
    // Also clean up main peer if it was created during scanning
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
    
    if (peer) peer.destroy();
    
    return new Promise((resolve) => {
      setTimeout(() => resolve({ roomCode }), 500);
      
      peer = new Peer('mtow-' + roomCode, PEER_CONFIG);
      
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
  
  // ─── Private Room: Join ───────────────────────────────────────────────────
  function joinRoom(code) {
    isHost = false;
    roomCode = code;
    
    if (peer) peer.destroy();
    
    return new Promise((resolve) => {
      setTimeout(() => resolve({ roomCode: code }), 500);
      
      peer = new Peer(PEER_CONFIG);
      
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
  
  // ─── Connection Management ────────────────────────────────────────────────
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
    matchmakingActive = false;
    if (matchmakingPeer && !matchmakingPeer.destroyed) {
      matchmakingPeer.destroy();
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
