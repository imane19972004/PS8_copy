/**
 * Game API Client
 * Gère la communication HTTP avec le serveur de jeu
 */

const API_BASE = 'http://localhost:8000'; // Via le gateway

export class GameApiClient {
    constructor() {
        this.gameId = null;
        this.baseUrl = API_BASE;
    }

    /**
     * Créer une nouvelle partie
     */
    async createGame(mode = 'local') {
        try {
            const response = await fetch(`${this.baseUrl}/api/game/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode })
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.gameId = data.gameId;
            
            console.log('[API] Game created:', this.gameId);
            return data;

        } catch (error) {
            console.error('[API] Error creating game:', error);
            throw error;
        }
    }

    /**
     * Récupérer l'état actuel du jeu
     */
    async getGameState() {
        if (!this.gameId) {
            throw new Error('No game ID. Create a game first.');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/api/game/state?gameId=${this.gameId}`
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            return data.state;

        } catch (error) {
            console.error('[API] Error getting game state:', error);
            throw error;
        }
    }

    /**
     * Exécuter une action
     */
    async executeAction(action) {
        if (!this.gameId) {
            throw new Error('No game ID. Create a game first.');
        }

        try {
            const response = await fetch(
                `${this.baseUrl}/api/game/action`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameId: this.gameId,
                        action
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Action failed');
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.result?.error || 'Action failed');
            }

            console.log('[API] Action executed:', action.type);
            return data;

        } catch (error) {
            console.error('[API] Error executing action:', error);
            throw error;
        }
    }

    /**
     * Obtenir les mouvements valides pour une pièce
     */
    async getValidMoves(x, y) {
        if (!this.gameId) throw new Error('No game ID');

        try {
            const response = await fetch(
                `${this.baseUrl}/api/game/moves?gameId=${this.gameId}&x=${x}&y=${y}`
            );

            if (!response.ok) return [];
            
            const data = await response.json();
            return data.moves || [];

        } catch (error) {
            console.error('[API] Error getting valid moves:', error);
            return [];
        }
    }

    /**
     * Obtenir les actions valides pour une pièce
     */
    async getValidActions(x, y) {
        if (!this.gameId) throw new Error('No game ID');

        try {
            const response = await fetch(
                `${this.baseUrl}/api/game/actions?gameId=${this.gameId}&x=${x}&y=${y}`
            );

            if (!response.ok) return [];
            
            const data = await response.json();
            return data.actions || [];

        } catch (error) {
            console.error('[API] Error getting valid actions:', error);
            return [];
        }
    }

    /**
     * Obtenir les emplacements valides pour une pyramide
     */
    async getValidPlacements() {
        if (!this.gameId) throw new Error('No game ID');

        try {
            const response = await fetch(
                `${this.baseUrl}/api/game/placements?gameId=${this.gameId}`
            );

            if (!response.ok) return [];
            
            const data = await response.json();
            return data.placements || [];

        } catch (error) {
            console.error('[API] Error getting valid placements:', error);
            return [];
        }
    }

    /**
     * Setup initial pour le jeu IA
     */
    async setupAIGame(initialPositions, isFirstPlayer) {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/ai/setup`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        initialPositions,
                        isFirstPlayer
                    })
                }
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'AI setup failed');
            }

            console.log('[API] AI game setup completed');
            return data;

        } catch (error) {
            console.error('[API] Error setting up AI game:', error);
            throw error;
        }
    }

    /**
     * Demander le prochain coup de l'IA
     */
    async getAIMove(gameState, opponentAction) {
        try {
            const response = await fetch(
                `${this.baseUrl}/api/ai/move`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        gameState,
                        opponentAction
                    })
                }
            );

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'AI move failed');
            }

            console.log('[API] AI move computed in', data.computationTime, 'ms');
            return data.action;

        } catch (error) {
            console.error('[API] Error getting AI move:', error);
            throw error;
        }
    }
}