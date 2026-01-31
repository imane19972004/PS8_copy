/**
 * Mode Local 1v1 via l'API du backend 
 */

import { GameApiClient } from '../../api/gameApi.js';
import { BoardRenderer } from '../../gameUI/BoardRenderer.js';
import { UIManager } from '../../gameUI/UIManager.js';

let gameApi = null;
let renderer = null;
let uiManager = null;
let currentGameId = null;

async function initLocalGame() {
    console.log('Initializing LOCAL 1v1 game ...');

    try {
        // Créer le client API pour communiquer avec le backend
        gameApi = new GameApiClient();

        // Créer une partie en mode "local"
        console.log('🔹 Creating new LOCAL game on backend...');
        const gameData = await gameApi.createGame('local');
        currentGameId = gameData.gameId;

        console.log('✅ Game created:', currentGameId);

        // Créer le renderer
        renderer = new BoardRenderer('gameBoard');

        // Créer le gestionnaire UI
        uiManager = new UIManager(renderer, gameApi);
        uiManager.syncFromState(gameData);

        // Afficher l'état initial
        await uiManager.updateDisplay();

        // Setup événements
        setupGameEvents();

        console.log('✅ Local game ready (backend-powered)');

    } catch (error) {
        console.error('❌ Initialization error:', error);
        document.getElementById('actionHint').textContent =
            `Error: ${error.message}`;
    }
}

function setupGameEvents() {
    const resetBtn = document.getElementById('resetGameBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', async () => {
            if (confirm('Reset game?')) {
                // Recréer une partie côté backend
                await initLocalGame();
            }
        });
    }
}

function gameLoop() {
    if (renderer && uiManager && uiManager.gameState) {
        renderer.render(uiManager.gameState);
    }
    requestAnimationFrame(gameLoop);
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM loaded - starting LOCAL game (backend mode)');
    initLocalGame();
    gameLoop();
});

// Debug
window.gameDebug = {
    gameApi,
    renderer,
    uiManager,
    currentGameId,
    getState: async () => {
        if (gameApi) {
            return await gameApi.getGameState();
        }
    }
};