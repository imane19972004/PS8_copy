import GameEngine from './core/GameEngine.js';
import Renderer from './ui/Renderer.js';
import UIController from './ui/UIController.js';
import Logger from './ui/Logger.js';

// Initialisation du jeu
const logger = new Logger();
const game = new GameEngine(logger);
game.init();

const canvas = document.getElementById("gameBoard");
const renderer = new Renderer(canvas, game);
const ui = new UIController(game, renderer);

// Game Loop
function gameLoop() {
    renderer.clear();
    renderer.renderBoard();
    renderer.renderPieces();
    
    if (game.lastLaserEvents) {
        renderer.renderLaser();
    }
    
    requestAnimationFrame(gameLoop);
}

// Démarrage
logger.log('✨ Game initialized! Player 1 starts.');
gameLoop();