/**
 * BoardRenderer avec affichage amélioré des boucliers et miroirs
 */

import { BOARD_SIZE, CELL_SIZE, PIECE_TYPES } from '../utils/constants.js';

export class BoardRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id "${canvasId}" not found`);
        }

        this.ctx = this.canvas.getContext('2d');
        this.cellSize = CELL_SIZE;
        this.images = {};
        this.imagesLoaded = 0;
        this.totalImages = 5;

        this.highlightedCells = [];
        this.selectedCell = null;
        this.laserPath = [];
        this.gameState = null;

        this.loadImages();
        this.setCanvasSize();
    }

    setCanvasSize() {
        this.canvas.width = BOARD_SIZE * this.cellSize;
        this.canvas.height = BOARD_SIZE * this.cellSize;
    }

    loadImages() {
        const imageFiles = {
            [PIECE_TYPES.SPHINX]: './media/Sphinx.jpg',
            [PIECE_TYPES.PHARAOH]: './media/Pharaoh.png',
            [PIECE_TYPES.ANUBIS]: './media/Anubis.jpg',
            [PIECE_TYPES.PYRAMID]: './media/Pyramid.png',
            [PIECE_TYPES.SCARAB]: './media/Scarab.jpg',
        };

        Object.keys(imageFiles).forEach(type => {
            const img = new Image();
            img.onload = () => {
                this.imagesLoaded++;
                if (this.imagesLoaded === this.totalImages) {
                    console.log('✅ All piece images loaded');
                }
            };
            img.onerror = () => {
                console.warn(`⚠️ Failed to load image: ${imageFiles[type]}`);
            };
            img.src = imageFiles[type];
            this.images[type] = img;
        });
    }

    render(gameState = null) {
        if (gameState) {
            this.gameState = gameState;
        }

        if (!this.gameState) {
            console.warn('No game state to render');
            return;
        }

        this.clear();
        this.renderBoard();
        this.renderPieces();
        this.renderLaser();
    }

    clear() {
        this.ctx.fillStyle = '#1a0f08';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    renderBoard() {
        const ctx = this.ctx;

        // Damier
        for (let y = 0; y < BOARD_SIZE; y++) {
            for (let x = 0; x < BOARD_SIZE; x++) {
                const isLight = (x + y) % 2 === 0;
                ctx.fillStyle = isLight ? '#0016bb' : '#00122b';
                ctx.fillRect(x * this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);
            }
        }

        // Grille
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        for (let i = 0; i <= BOARD_SIZE; i++) {
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, BOARD_SIZE * this.cellSize);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(BOARD_SIZE * this.cellSize, i * this.cellSize);
            ctx.stroke();
        }

        // Surlignage
        this.highlightedCells.forEach(({ x, y, color }) => {
            ctx.fillStyle = color;
            ctx.fillRect(
                x * this.cellSize + 2,
                y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            );
        });

        // Sélection
        if (this.selectedCell) {
            ctx.strokeStyle = '#37fa15';
            ctx.lineWidth = 4;
            ctx.strokeRect(
                this.selectedCell.x * this.cellSize + 2,
                this.selectedCell.y * this.cellSize + 2,
                this.cellSize - 4,
                this.cellSize - 4
            );
        }
    }

    renderPieces() {
        if (!this.gameState || !this.gameState.gameState.board) {
            return;
        }

        const pieces = this.gameState.gameState.board.pieces || [];

        pieces.forEach(piece => {
            if (piece.alive !== false) {
                this.drawPiece(piece);
            }
        });
    }

    drawPiece(piece) {
        const x = piece.x * this.cellSize;
        const y = piece.y * this.cellSize;
        const ctx = this.ctx;

        ctx.save();

        // Rotation
        ctx.translate(x + this.cellSize / 2, y + this.cellSize / 2);
        ctx.rotate((piece.orientation * Math.PI) / 180);
        ctx.translate(-this.cellSize / 2, -this.cellSize / 2);

        // Image de la pièce
        const img = this.images[piece.type];
        if (img && img.complete && img.naturalWidth > 0) {
            ctx.drawImage(img, 2, 2, this.cellSize - 4, this.cellSize - 4);
        } else {
            // Fallback
            ctx.fillStyle = piece.player === 1 ? '#4A90E2' : '#F5A623';
            ctx.fillRect(5, 5, this.cellSize - 10, this.cellSize - 10);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(piece.type.toUpperCase()[0], this.cellSize / 2, this.cellSize / 2);
        }

        // AFFICHAGE DES BOUCLIERS ET MIROIRS
        this.drawShieldsAndMirrors(piece);

        // Indicateur joueur
        ctx.fillStyle = piece.player === 1 ? '#0077ff' : '#ffa410';
        ctx.beginPath();
        ctx.arc(this.cellSize - 10, 10, 7, 0, Math.PI * 2);
        ctx.fill();

        // Indicateur laser pour Sphinx
        if (piece.type === PIECE_TYPES.SPHINX) {
            this.drawLaserIndicator();
        }

        ctx.restore();
    }

    /**
     * Affichage amélioré des boucliers et miroirs selon le type de pièce
     */
    drawShieldsAndMirrors(piece) {
        const ctx = this.ctx;
        const s = this.cellSize;
        const offset = 6;

        switch (piece.type) {
            case PIECE_TYPES.SPHINX:
                this.drawSphinxShields(s, offset);
                break;

            case PIECE_TYPES.ANUBIS:
                this.drawAnubisShield(s, offset);
                break;

            case PIECE_TYPES.PYRAMID:
                this.drawPyramidMirrors(s, offset);
                break;

            case PIECE_TYPES.SCARAB:
                this.drawScarabMirrors(s, offset);
                break;

            case PIECE_TYPES.PHARAOH:
                // Pas de protection
                break;
        }
    }

    /**
     * SPHINX : Bouclier sur les 4 côtés (indestructible)
     */
    drawSphinxShields(s, offset) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Les 4 côtés
        // Haut
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(s - offset, offset);
        ctx.stroke();

        // Droite
        ctx.beginPath();
        ctx.moveTo(s - offset, offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.stroke();

        // Bas
        ctx.beginPath();
        ctx.moveTo(offset, s - offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.stroke();

        // Gauche
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(offset, s - offset);
        ctx.stroke();
    }

    /**
     * ANUBIS : 1 bouclier sur le côté orienté (face avant)
     */
    drawAnubisShield(s, offset) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(s - offset, offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.stroke();
    }

    /**
     * PYRAMID : Miroir diagonal (2 faces réfléchissantes adjacentes)
     */
    drawPyramidMirrors(s, offset) {
        const ctx = this.ctx;
        
        ctx.strokeStyle = '#ffaa00';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        // Le miroir forme toujours un angle à droite (en coordonnées locales)
        // car l'orientation est gérée par la rotation
        
        // Côté droit
        ctx.beginPath();
        ctx.moveTo(s - offset, offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.stroke();

        // Côté haut
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(s - offset, offset);
        ctx.stroke();

        // Ligne diagonale pour montrer le miroir
        ctx.strokeStyle = '#ffdd00';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(s - offset, offset);
        ctx.lineTo(offset, s - offset);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    /**
     * SCARAB : Miroir double face (indestructible)
     * Les 4 côtés sont réfléchissants
     */
    drawScarabMirrors(s, offset) {
        const ctx = this.ctx;
        
        // Bordure dorée pour indiquer la réflexion totale
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        // Les 4 côtés
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(s - offset, offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.lineTo(offset, s - offset);
        ctx.closePath();
        ctx.stroke();

        // Croix diagonale pour montrer les miroirs
        ctx.strokeStyle = '#ffee88';
        ctx.lineWidth = 2;
        ctx.setLineDash([3, 3]);
        
        ctx.beginPath();
        ctx.moveTo(offset, offset);
        ctx.lineTo(s - offset, s - offset);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(s - offset, offset);
        ctx.lineTo(offset, s - offset);
        ctx.stroke();
        
        ctx.setLineDash([]);
    }

    /**
     * Indicateur de laser pour le Sphinx
     */
    drawLaserIndicator() {
        const ctx = this.ctx;
        const s = this.cellSize;

        // Flèche rouge sur le côté droit (en coordonnées locales)
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 3;

        // Triangle pointant vers la droite
        ctx.beginPath();
        ctx.moveTo(s - 8, s / 2);
        ctx.lineTo(s - 15, s / 2 - 5);
        ctx.lineTo(s - 15, s / 2 + 5);
        ctx.closePath();
        ctx.fill();

        // Ligne du laser
        ctx.beginPath();
        ctx.moveTo(s - 15, s / 2);
        ctx.lineTo(s / 2 + 5, s / 2);
        ctx.stroke();
    }

    renderLaser() {
        if (!this.laserPath || this.laserPath.length === 0) {
            return;
        }

        const ctx = this.ctx;

        const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        gradient.addColorStop(0, '#ff4500');
        gradient.addColorStop(0.5, '#ff8c00');
        gradient.addColorStop(1, '#ffd700');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowColor = '#ff4500';
        ctx.shadowBlur = 15;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();

        this.laserPath.forEach((event, i) => {
            const cx = event.x * this.cellSize + this.cellSize / 2;
            const cy = event.y * this.cellSize + this.cellSize / 2;

            if (i === 0) {
                ctx.moveTo(cx, cy);
            } else {
                ctx.lineTo(cx, cy);
            }
        });

        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    highlightCells(cells, color = 'rgba(34, 197, 94, 0.4)') {
        this.highlightedCells = cells.map(cell => ({
            ...cell,
            color
        }));
    }

    selectCell(x, y) {
        this.selectedCell = { x, y };
    }

    highlightLaserPath(events) {
        this.laserPath = events
            .filter(e => e.type !== 'EXIT' && e.x !== undefined && e.y !== undefined)
            .slice(0, 50);
    }

    clearHighlights() {
        this.highlightedCells = [];
        this.selectedCell = null;
        this.laserPath = [];
    }

    getCoordinatesFromMouse(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = Math.floor((event.clientX - rect.left) / this.cellSize);
        const y = Math.floor((event.clientY - rect.top) / this.cellSize);
        return { x, y };
    }
}