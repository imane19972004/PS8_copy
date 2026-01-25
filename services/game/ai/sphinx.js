/**
 * Sphinx AI - IA basique pour Khet
 * 
 * Stratégie simple:
 * 1. Protéger son Pharaon
 * 2. Essayer de toucher le Pharaon adverse
 * 3. Jouer des coups aléatoires valides
 */

class SphinxAI {
    constructor() {
        this.isFirstPlayer = null;
        this.board = null;
        this.availablePyramids = 7;
    }

    /**
     * TASK-014: Initialisation de l'IA
     * @param {Array} initialPositions - Positions initiales des pièces
     * @param {boolean} isFirstPlayer - true si l'IA est Player 1
     * @returns {void}
     * 
     * Timeout: 1000ms max
     */
    setup(initialPositions, isFirstPlayer) {
        const startTime = Date.now();
        
        console.log(`[SphinxAI] 🤖 Setup called - Playing as Player ${isFirstPlayer ? 1 : 2}`);
        
        this.isFirstPlayer = isFirstPlayer;
        this.board = initialPositions || Array(80).fill(null);
        
        // Vérifie le timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > 1000) {
            console.warn(`[SphinxAI] ⚠️ Setup took ${elapsed}ms (max 1000ms)`);
        }
        
        console.log(`[SphinxAI] ✅ Setup complete in ${elapsed}ms`);
    }

    /**
     * TASK-015 + TASK-016: Calcule le prochain coup
     * @param {Object|null} opponentAction - Dernière action de l'adversaire
     * @returns {Object} - Action à jouer {action: string, cell: number, ...}
     * 
     * Timeout: 250ms max
     */
    nextMove(opponentAction = null) {
        const startTime = Date.now();
        
        console.log(`[SphinxAI] 🤔 Thinking... Opponent played:`, opponentAction);
        
        // Liste des actions possibles
        const possibleActions = this.generateValidMoves();
        
        if (possibleActions.length === 0) {
            console.error(`[SphinxAI] ❌ No valid moves available!`);
            return { action: 'PASS' }; // Action par défaut si aucun coup possible
        }
        
        // Choisit un coup aléatoire parmi les coups valides
        const randomIndex = Math.floor(Math.random() * possibleActions.length);
        const chosenAction = possibleActions[randomIndex];
        
        // Vérifie le timeout
        const elapsed = Date.now() - startTime;
        if (elapsed > 250) {
            console.warn(`[SphinxAI] ⚠️ nextMove took ${elapsed}ms (max 250ms)`);
        }
        
        console.log(`[SphinxAI] ✅ Decision made in ${elapsed}ms:`, chosenAction);
        
        return chosenAction;
    }

    /**
     * TASK-016: Génère tous les coups valides possibles
     * @returns {Array<Object>} - Liste des actions valides
     */
    generateValidMoves() {
        const validMoves = [];
        
        // Pour chaque case du plateau
        for (let cell = 0; cell < 80; cell++) {
            const piece = this.board[cell];
            
            // Si c'est une pièce de l'IA
            if (piece && this.isPieceOurs(piece)) {
                
                // ROTATE: Toutes les pièces peuvent tourner
                validMoves.push({
                    action: 'ROTATE',
                    cell: cell,
                    clockwise: true
                });
                
                validMoves.push({
                    action: 'ROTATE',
                    cell: cell,
                    clockwise: false
                });
                
                // MOVE: Génère les déplacements possibles
                const possibleMoves = this.getPossibleMoves(cell);
                possibleMoves.forEach(targetCell => {
                    validMoves.push({
                        action: 'MOVE',
                        cell: cell,
                        targetCell: targetCell
                    });
                });
                
                // SWAP: Si c'est un Scarab
                if (piece.type === 'Scarab') {
                    const adjacentCells = this.getAdjacentCells(cell);
                    adjacentCells.forEach(targetCell => {
                        const targetPiece = this.board[targetCell];
                        if (targetPiece && targetPiece.type === 'Scarab') {
                            validMoves.push({
                                action: 'SWAP',
                                cell: cell,
                                targetCell: targetCell
                            });
                        }
                    });
                }
            }
        }
        
        // PLACE PYRAMID: Si on a encore des pyramides en réserve
        if (this.availablePyramids > 0) {
            const emptyReservedCells = this.getEmptyReservedCells();
            emptyReservedCells.forEach(cell => {
                validMoves.push({
                    action: 'PLACE',
                    cell: cell,
                    pieceType: 'Pyramid',
                    rotation: 0 // Nord par défaut
                });
            });
        }
        
        console.log(`[SphinxAI] 📊 Generated ${validMoves.length} valid moves`);
        
        return validMoves;
    }

    /**
     * Vérifie si une pièce appartient à l'IA
     */
    isPieceOurs(piece) {
        if (!piece) return false;
        
        // Player 1 = pièces avec player === 1
        // Player 2 = pièces avec player === 2
        const ourPlayer = this.isFirstPlayer ? 1 : 2;
        
        return piece.player === ourPlayer;
    }

    /**
     * Obtient les déplacements possibles pour une pièce
     */
    getPossibleMoves(cell) {
        const moves = [];
        const row = Math.floor(cell / 10);
        const col = cell % 10;
        
        // Déplacements orthogonaux (haut, bas, gauche, droite)
        const directions = [
            { dr: -1, dc: 0 },  // Haut
            { dr: 1, dc: 0 },   // Bas
            { dr: 0, dc: -1 },  // Gauche
            { dr: 0, dc: 1 }    // Droite
        ];
        
        directions.forEach(dir => {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            
            // Vérifie les limites du plateau (8 lignes x 10 colonnes)
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 10) {
                const targetCell = newRow * 10 + newCol;
                
                // La case cible doit être vide
                if (!this.board[targetCell]) {
                    moves.push(targetCell);
                }
            }
        });
        
        return moves;
    }

    /**
     * Obtient les cases adjacentes
     */
    getAdjacentCells(cell) {
        const row = Math.floor(cell / 10);
        const col = cell % 10;
        const adjacent = [];
        
        const directions = [
            { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
            { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
        ];
        
        directions.forEach(dir => {
            const newRow = row + dir.dr;
            const newCol = col + dir.dc;
            
            if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 10) {
                adjacent.push(newRow * 10 + newCol);
            }
        });
        
        return adjacent;
    }

    /**
     * Obtient les cases réservées vides pour placer des pyramides
     */
    getEmptyReservedCells() {
        // Cases réservées selon les règles Khet
        // TODO: Définir les vraies zones réservées selon les règles
        const reservedCells = [0, 1, 2, 7, 8, 9]; // Exemple simplifié
        
        return reservedCells.filter(cell => !this.board[cell]);
    }
}

module.exports = SphinxAI;