/**
 * Jeu avec API serveur - Joueur vs IA
 */

import { GameApiClient } from '../../api/gameApi.js';
import { BoardRenderer as AIBoardRenderer } from '../../gameUI/BoardRenderer.js';
import { UIManager as AIUIManager } from '../../gameUI/UIManager.js';

let gameApi = null;
let aiRenderer = null;
let aiUIManager = null;
let currentGameId = null;

async function initAIGame() {
    console.log('🤖 Initializing AI game...');

    try {
        // Créer le client API
        gameApi = new GameApiClient();

        // Créer le renderer
        aiRenderer = new AIBoardRenderer('gameBoard');

        // Créer une partie IA
        console.log('📝 Creating new AI game...');
        const gameData = await gameApi.createGame('ai');
        currentGameId = gameData.gameId;
        console.log('Game Data:', gameData);
        await gameApi.setupAIGame(gameData.initialPositions, false);

        console.log('✅ Game created:', currentGameId);

        // Créer le gestionnaire UI (avec API cette fois)
        aiUIManager = new AIUIManager(aiRenderer, gameApi);
        aiUIManager.syncFromState(gameData);

        // Afficher l'état initial
        await aiUIManager.updateDisplay();
        const state = await gameApi.getGameState();
        if (state.gameState.turn === 2) {
            aiUIManager.isPlayerTurn = false;
            aiUIManager.handleAITurn();
        }

        // Setup événements
        setupAIGameEvents();

        aiUIManager.showHint('✓ Game created! Your turn (Player 1).');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        document.getElementById('actionHint').textContent =
            `Error: ${error.message}`;
    }
}

function setupAIGameEvents() {
    const newGameBtn = document.getElementById('newGameBtn');
    if (newGameBtn) {
        newGameBtn.addEventListener('click', initAIGame);
    }
}

function aiGameLoop() {
    if (aiRenderer && aiUIManager && aiUIManager.gameState) {
        aiRenderer.render(aiUIManager.gameState);
    }
    requestAnimationFrame(aiGameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded - starting AI game');
    initAIGame();
    aiGameLoop();
});

// Debug
window.gameDebug = {
    gameApi,
    aiRenderer,
    aiUIManager,
    currentGameId,
    getState: async () => {
        if (gameApi) {
            return await gameApi.getGameState();
        }
    }
};