const SphinxAI = require('./ai/sphinx');

/**
 * GameManager - Gère toutes les parties de Khet en mémoire
 * 
 * Responsabilités:
 * - Créer de nouvelles parties
 * - Stocker l'état de chaque partie
 * - Gérer les actions des joueurs
 * - Détecter la fin de partie
 * - Gérer les déconnexions
 */
class GameManager {
    constructor() {
        // TASK-008: Map<gameId, game>
        this.games = new Map();
        this.gameCounter = 0;
    }

    /**
     * TASK-009: Créer une nouvelle partie
     * @param {Object} options - {vsAI: boolean, player1Name: string, player2Name?: string}
     * @returns {Object} - {gameId, gameState}
     */
    createGame(options = {}) {
        const gameId = `game_${++this.gameCounter}_${Date.now()}`;
        
        const game = {
            id: gameId,
            vsAI: options.vsAI || false,
            ai: options.vsAI ? new SphinxAI() : null,  // ✨ Nouvelle ligne
            players: {
                player1: {
                    name: options.player1Name || 'Player 1',
                    socketId: null,
                    isConnected: false
                },
                player2: {
                    name: options.vsAI ? 'AI' : (options.player2Name || 'Player 2'),
                    socketId: null,
                    isConnected: options.vsAI // AI is always "connected"
                }
            },
            // TASK-010: État du moteur de jeu
            gameState: {
                board: this.initializeBoard(),
                currentPlayer: 1, // Player 1 starts
                turnNumber: 0,
                phase: 'setup', // 'setup' | 'playing' | 'finished'
                winner: null,
                history: []
            },
            createdAt: new Date(),
            lastActivity: new Date()
        };

        this.games.set(gameId, game);
        console.log(`[GameManager] ✅ Game created: ${gameId} (vsAI: ${game.vsAI})`);
        
        // ✨ Initialise l'IA si nécessaire
        if (game.ai) {
            try {
                game.ai.setup(game.gameState.board, false); // L'IA est toujours Player 2
                console.log(`[GameManager] 🤖 AI initialized for ${gameId}`);
            } catch(error) {
                console.error(`[GameManager] ❌ AI setup failed:`, error);
            }
        }
        
        return {
            gameId,
            gameState: game.gameState,
            players: game.players
        };
    }

    /**
     * TASK-010: Initialise le plateau de jeu
     * @returns {Array} - Plateau 8x10 avec positions initiales
     */
    initializeBoard() {
        // Plateau 8x10 (80 cases)
        const board = Array(80).fill(null);
        
        // TODO: Définir les positions initiales des pièces selon les règles Khet
        // Pour l'instant, plateau vide (sera rempli par le frontend)
        
        return board;
    }

    /**
     * Récupère une partie par son ID
     * @param {string} gameId
     * @returns {Object|null}
     */
    getGame(gameId) {
        return this.games.get(gameId) || null;
    }

    /**
     * TASK-011: Vérifie si la partie est terminée
     * @param {string} gameId
     * @returns {boolean}
     */
    isGameOver(gameId) {
        const game = this.getGame(gameId);
        if (!game) return true;

        // Une partie est terminée si :
        // 1. Un Pharaon est éliminé (touché par un laser)
        // 2. Un joueur abandonne
        // 3. Limite de tours atteinte (optionnel)
        
        return game.gameState.phase === 'finished';
    }

    /**
     * Applique une action au jeu
     * @param {string} gameId
     * @param {Object} action - {type: 'move'|'rotate'|'place'|'swap', ...}
     * @returns {Object} - Nouvel état du jeu
     */
    applyAction(gameId, action) {
        const game = this.getGame(gameId);
        if (!game) {
            throw new Error('Game not found');
        }

        if (this.isGameOver(gameId)) {
            throw new Error('Game is already finished');
        }

        // Valide et applique l'action
        // TODO: Intégrer avec GameEngine du frontend
        
        // Ajoute à l'historique
        game.gameState.history.push({
            turnNumber: game.gameState.turnNumber,
            player: game.gameState.currentPlayer,
            action: action,
            timestamp: new Date()
        });

        // Change de joueur
        game.gameState.currentPlayer = game.gameState.currentPlayer === 1 ? 2 : 1;
        game.gameState.turnNumber++;
        game.lastActivity = new Date();

        console.log(`[GameManager] Action applied in ${gameId}: ${action.action || action.type}`);
        
        return game.gameState;
    }

    /**
     * TASK-012: Gère la déconnexion d'un joueur
     * @param {string} socketId
     */
    handleDisconnect(socketId) {
        for (let [gameId, game] of this.games) {
            // Trouve si ce socket est dans une partie
            if (game.players.player1.socketId === socketId) {
                game.players.player1.isConnected = false;
                console.log(`[GameManager] ⚠️ Player 1 disconnected from ${gameId}`);
            }
            if (game.players.player2.socketId === socketId) {
                game.players.player2.isConnected = false;
                console.log(`[GameManager] ⚠️ Player 2 disconnected from ${gameId}`);
            }

            // Si partie PvP et un joueur déconnecté, termine la partie
            if (!game.vsAI && (!game.players.player1.isConnected || !game.players.player2.isConnected)) {
                this.endGame(gameId, 'disconnection');
            }
        }
    }

    /**
     * TASK-011: Termine une partie
     * @param {string} gameId
     * @param {string} reason - 'pharaoh_eliminated' | 'disconnection' | 'surrender'
     */
    endGame(gameId, reason = 'pharaoh_eliminated') {
        const game = this.getGame(gameId);
        if (!game) return;

        game.gameState.phase = 'finished';
        game.gameState.endReason = reason;
        game.gameState.endedAt = new Date();

        console.log(`[GameManager] 🏁 Game ended: ${gameId} (${reason})`);
    }

    /**
     * Nettoie les parties terminées (appelé périodiquement)
     */
    cleanupOldGames() {
        const now = Date.now();
        const MAX_AGE = 1000 * 60 * 60; // 1 heure

        for (let [gameId, game] of this.games) {
            const age = now - game.lastActivity.getTime();
            
            if (game.gameState.phase === 'finished' && age > MAX_AGE) {
                this.games.delete(gameId);
                console.log(`[GameManager] 🗑️ Cleaned up old game: ${gameId}`);
            }
        }
    }

    /**
     * Statistiques
     */
    getStats() {
        return {
            totalGames: this.games.size,
            activeGames: Array.from(this.games.values()).filter(g => g.gameState.phase === 'playing').length,
            finishedGames: Array.from(this.games.values()).filter(g => g.gameState.phase === 'finished').length
        };
    }
}

module.exports = GameManager;