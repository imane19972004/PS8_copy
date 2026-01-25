/**
 * Socket.io Client - Connecte le frontend au Game Service
 */

class SocketClient {
    constructor() {
        this.socket = null;
        this.gameId = null;
        this.playerNumber = null;
        this.connected = false;
        this.onGameUpdated = null; // Callback quand l'état change
        this.onAIAction = null;     // Callback quand l'IA joue
    }

    /**
     * Connecte au Game Service
     */
    connect() {
        console.log('[Socket] Connecting to Game Service...');
        
        // Connexion au namespace /api/game
        this.socket = io('http://localhost:8002/api/game', {
            transports: ['websocket', 'polling'],
            reconnection: true
        });

        // Événements de connexion
        this.socket.on('connect', () => {
            console.log('[Socket]  Connected! ID:', this.socket.id);
            this.connected = true;
        });

        this.socket.on('connect_error', (err) => {
            console.error('[Socket]  Connection error:', err.message);
            this.connected = false;
        });

        this.socket.on('disconnect', () => {
            console.log('[Socket] Disconnected');
            this.connected = false;
        });

        // Événements de jeu
        this.setupGameEvents();
    }

    /**
     * Configure les événements de jeu
     */
    setupGameEvents() {
        // Partie créée
        this.socket.on('game-created', (data) => {
            console.log('[Socket] 🎮 Game created:', data);
            this.gameId = data.gameId;
            this.playerNumber = data.yourPlayer;
            
           // Ajoute au log HTML directement
            const logDiv = document.getElementById('gameLog');
            if (logDiv) {
                const p1 = document.createElement('p');
                p1.textContent = ` Game created: ${this.gameId}`;
                logDiv.appendChild(p1);
                
                const p2 = document.createElement('p');
                p2.textContent = ` You are Player ${this.playerNumber}`;
                logDiv.appendChild(p2);
            }
        });

        // État du jeu mis à jour
        this.socket.on('game-updated', (data) => {
            console.log('[Socket]  Game updated:', data);
            
            if (this.onGameUpdated) {
                this.onGameUpdated(data);
            }
        });

        // Action de l'IA
        this.socket.on('ai-action', (data) => {
            console.log('[Socket]  AI played:', data);
            
            if (this.onAIAction) {
                this.onAIAction(data);
            }
        });

        // L'IA réfléchit
        this.socket.on('ai-thinking', (data) => {
            console.log('[Socket]  AI is thinking...');
            const logDiv = document.getElementById('gameLog');
            if (logDiv) {
                const p = document.createElement('p');
                p.textContent = ' AI is thinking...';
                logDiv.appendChild(p);
            }
        });

        // Erreur de jeu
        this.socket.on('game-error', (data) => {
            console.error('[Socket]  Game error:', data);
            alert(`Error: ${data.error}\n${data.details || ''}`);
        });
    }

    /**
     * Crée une nouvelle partie
     * @param {boolean} vsAI - Jouer contre l'IA ou un autre joueur
     * @param {string} playerName - Nom du joueur
     */
    createGame(vsAI = true, playerName = 'Player 1') {
        if (!this.connected) {
            console.error('[Socket] Not connected!');
            return;
        }

        console.log('[Socket] Creating game...', { vsAI, playerName });
        
        this.socket.emit('create-game', {
            vsAI: vsAI,
            playerName: playerName
        });
    }

    /**
     * Envoie une action au serveur
     * @param {Object} action - {type: 'move'|'rotate'|'place'|'swap', ...}
     */
    sendAction(action) {
        if (!this.connected || !this.gameId) {
            console.error('[Socket] Cannot send action: not in a game');
            return;
        }

        console.log('[Socket] Sending action:', action);
        
        this.socket.emit('player-action', {
            gameId: this.gameId,
            action: action
        });
    }

    /**
     * Demande les statistiques du serveur
     */
    getStats() {
        if (!this.connected) {
            console.error('[Socket] Not connected!');
            return;
        }

        this.socket.emit('get-stats');
        
        this.socket.once('stats', (data) => {
            console.log('[Socket] 📊 Server stats:', data);
        });
    }
}

// Export global
window.SocketClient = SocketClient;