import { GAME_CONFIG } from '../utils/Constants.js';

export default class TurnManager {
  constructor(board) {
    this.board = board;
    this.currentPlayer = 1;
    this.turnCount = 0;
    this.reserves = { 
      1: GAME_CONFIG.INITIAL_PYRAMIDS, 
      2: GAME_CONFIG.INITIAL_PYRAMIDS 
    };
    // Pyramides en attente (délai de 1 tour)
    this.pendingPyramids = { 1: 0, 2: 0 };
  }

  initPlayers() {
    this.currentPlayer = 1;
    this.turnCount = 0;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  getReserve(player) {
    return this.reserves[player] || 0;
  }

  decrementReserve(player) {
    if (this.reserves[player] > 0) {
      this.reserves[player]--;
    }
  }

  addPendingPyramid(player) {
    this.pendingPyramids[player]++;
  }

  endTurn() {
    const currentPlayer = this.currentPlayer;
    const nextPlayer = currentPlayer === 1 ? 2 : 1;

    // 1. Décrémenter cooldowns des Scarabs du joueur actuel
    this.board.getPieces()
      .filter(p => p.type === 'scarab' && p.player === currentPlayer)
      .forEach(scarab => {
        if (scarab.swapCooldowns.sphinx > 0) {
          scarab.swapCooldowns.sphinx--;
        }
        if (scarab.swapCooldowns.pharaoh > 0) {
          scarab.swapCooldowns.pharaoh--;
        }
      });

    // 2. Ajouter pyramides en attente au prochain joueur
    if (this.pendingPyramids[nextPlayer] > 0) {
      this.reserves[nextPlayer] += this.pendingPyramids[nextPlayer];
      console.log(`+${this.pendingPyramids[nextPlayer]} pyramid(s) added to Player ${nextPlayer}'s reserve`);
      this.pendingPyramids[nextPlayer] = 0;
    }

    // 3. Changer de joueur
    this.currentPlayer = nextPlayer;
    this.turnCount++;
  }

  recordAction(action) {
    // Pour historique/replay futur
    // TODO: implémenter si nécessaire
  }
}