/**
 * TEST : IA vs IA Battle
 * Compare les performances de 2 IA en simulant plusieurs parties
 */

const GameEngine = require('./core/GameEngine.js');
const ServerLogger = require('./utils/ServerLogger.js');

// CHARGER LES 2 IA
const AI_Sphinx = require('./ai/sphinx.js');
const AI_SphinxMain = require('./ai/sphinx-main.js');

class AIBattle {
    constructor(ai1, ai2, games = 10) {
        this.ai1 = ai1;
        this.ai2 = ai2;
        this.totalGames = games;
        this.results = {
            ai1Wins: 0,
            ai2Wins: 0,
            draws: 0,
            ai1AvgTime: [],
            ai2AvgTime: []
        };
    }

    async runBattle() {
        console.log('\n╔════════════════════════════════════════╗');
        console.log('║       🎮 IA vs IA BATTLE TEST 🎮       ║');
        console.log('╠════════════════════════════════════════╣');
        console.log(`║   Games: ${this.totalGames}                           ║`);
        console.log('╚════════════════════════════════════════╝\n');

        for (let i = 0; i < this.totalGames; i++) {
            console.log(`\n🎲 GAME ${i + 1}/${this.totalGames}`);
            console.log('─────────────────────────────');
            
            await this.playGame(i);
        }

        this.displayResults();
    }

    async playGame(gameNum) {
        const logger = new ServerLogger();
        const engine = new GameEngine(logger);
        
        engine.init();

        const initialPos = engine.getInitialPiecePositions(engine.board);

        // Setup des 2 IA
        await this.ai1.setup(initialPos, true);  // P1
        await this.ai2.setup(initialPos, false); // P2

        let turnCount = 0;
        const maxTurns = 100;

        while (!engine.gameOver && turnCount < maxTurns) {
            const currentPlayer = engine.turnManager.getCurrentPlayer();
            
            let action;
            let startTime = Date.now();

            if (currentPlayer === 1) {
                action = await this.ai1.nextMove(null);
                this.results.ai1AvgTime.push(Date.now() - startTime);
            } else {
                action = await this.ai2.nextMove(null);
                this.results.ai2AvgTime.push(Date.now() - startTime);
            }

            // Adapter l'action
            const { aiActionToGameAction } = require('./utils/ActionAdapter.js');
            const gameAction = aiActionToGameAction(action, engine.getGameState());

            const result = engine.executeAction(gameAction);

            if (!result.success) {
                console.error(`❌ Invalid move by P${currentPlayer}:`, result.error);
                break;
            }

            turnCount++;

            // Timeout check
            if (turnCount >= maxTurns) {
                console.log('⏱️ Max turns reached - DRAW');
                this.results.draws++;
                return;
            }
        }

        // Enregistrer le résultat
        if (engine.winner === 1) {
            console.log('🏆 AI1 (Sphinx) WINS!');
            this.results.ai1Wins++;
        } else if (engine.winner === 2) {
            console.log('🏆 AI2 (SphinxMain) WINS!');
            this.results.ai2Wins++;
        } else {
            console.log('🤝 DRAW');
            this.results.draws++;
        }

        console.log(`   Turns: ${turnCount}`);
    }

    displayResults() {
        console.log('\n');
        console.log('╔════════════════════════════════════════╗');
        console.log('║          📊 FINAL RESULTS 📊           ║');
        console.log('╠════════════════════════════════════════╣');
        console.log(`║  Games Played: ${this.totalGames}                      ║`);
        console.log('╠════════════════════════════════════════╣');
        console.log(`║  AI1 (Sphinx) Wins:     ${this.results.ai1Wins}          ║`);
        console.log(`║  AI2 (SphinxMain) Wins: ${this.results.ai2Wins}          ║`);
        console.log(`║  Draws:                 ${this.results.draws}          ║`);
        console.log('╠════════════════════════════════════════╣');
        
        const ai1AvgTime = this.results.ai1AvgTime.reduce((a, b) => a + b, 0) / this.results.ai1AvgTime.length;
        const ai2AvgTime = this.results.ai2AvgTime.reduce((a, b) => a + b, 0) / this.results.ai2AvgTime.length;

        console.log(`║  AI1 Avg Time: ${ai1AvgTime.toFixed(2)}ms           ║`);
        console.log(`║  AI2 Avg Time: ${ai2AvgTime.toFixed(2)}ms          ║`);
        console.log('╚════════════════════════════════════════╝\n');

        const winRate1 = ((this.results.ai1Wins / this.totalGames) * 100).toFixed(1);
        const winRate2 = ((this.results.ai2Wins / this.totalGames) * 100).toFixed(1);

        console.log(`🎯 AI1 Win Rate: ${winRate1}%`);
        console.log(`🎯 AI2 Win Rate: ${winRate2}%\n`);
    }
}

// LANCER LE TEST
(async () => {
    const battle = new AIBattle(AI_Sphinx, AI_SphinxMain, 5); // 5 parties
    await battle.runBattle();
})();