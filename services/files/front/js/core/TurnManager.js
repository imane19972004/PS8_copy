import { GAME_CONFIG } from '../utils/Constants.js';

export default class TurnManager {
  constructor(board) {
    this.board = board;
    this.currentPlayer = 1;
    this.turnCount = 0;
    this.reserves = { 1: GAME_CONFIG.INITIAL_PYRAMIDS, 2: GAME_CONFIG.INITIAL_PYRAMIDS };
    this.pendingPyramids = { 1: [], 2: [] }; // Pyramides avec délai de 1 tour
  }

  initPlayers() {
    this.currentPlayer = 1;
    this.turnCount = 0;
  }

  recordAction(action) {
    // Réservé pour replay / historique
  }

  validateAction(action) {
    return action.player === this.currentPlayer;
  }

  getCurrentPlayer() {
    return this.currentPlayer;
  }

  endTurn() {
    // Décrémentation des cooldowns des Scarabs du joueur actuel
    this.board.getPieces()
      .filter(p => p.type === 'scarab' && p.player === this.currentPlayer)
      .forEach(scarab => {
        if (scarab.swapCooldowns.sphinx > 0) scarab.swapCooldowns.sphinx--;
        if (scarab.swapCooldowns.pharaoh > 0) scarab.swapCooldowns.pharaoh--;
      });

    // Traiter les pyramides en attente (délai de 1 tour)
    const nextPlayer = this.currentPlayer === 1 ? 2 : 1;
    if (this.pendingPyramids[nextPlayer].length > 0) {
      this.reserves[nextPlayer] += this.pendingPyramids[nextPlayer].length;
      this.pendingPyramids[nextPlayer] = [];
    }

    this.turnCount++;
    this.currentPlayer = nextPlayer;
  }

  getReserve(player) {
    return this.reserves[player];
  }

  decrementReserve(player) {
    this.reserves[player]--;
  }

  addPendingPyramid(player) {
    // Ajoute une pyramide qui sera disponible après 1 tour
    this.pendingPyramids[player].push(1);
  }
}