// Base class for all pieces
class Piece {
    constructor(type, player, x, y, orientation = 0) {
        this.type = type;
        this.player = player; // 1 or 2
        this.x = x;
        this.y = y;
        this.orientation = orientation; // 0, 90, 180, 270 degrees
    }

    canMove() {
        // Sphinx and Pharaoh cannot move
        return this.type !== 'sphinx' && this.type !== 'pharaoh';
    }

    rotate(clockwise = true) {
        if (clockwise) {
            this.orientation = (this.orientation + 90) % 360;
        } else {
            this.orientation = (this.orientation - 90 + 360) % 360;
        }
    }

    getSymbol() {
        const symbols = {
            'sphinx': 'S',
            'pharaoh': 'P',
            'anubis': 'A',
            'pyramid': '△',
            'scarab': '✦'
        };
        return symbols[this.type] || '?';
    }

    getColor() {
        return this.player === 1 ? '#4A90E2' : '#F5A623';
    }
}

class Sphinx extends Piece {
    constructor(player, x, y, orientation) {
        super('sphinx', player, x, y, orientation);
        this.hasLaser = true;
    }

    fireLaser() {
        // Returns array of {x, y} positions the laser travels through
        const laserPath = [];
        let currentX = this.x;
        let currentY = this.y;
        let direction = this.orientation;

        // Add starting position
        laserPath.push({x: currentX, y: currentY, type: 'start'});

        return laserPath;
    }
}

class Pharaoh extends Piece {
    constructor(player, x, y) {
        super('pharaoh', player, x, y, 0);
    }
}

class Anubis extends Piece {
    constructor(player, x, y, orientation) {
        super('anubis', player, x, y, orientation);
        this.hasShield = true;
    }

    isShieldFacing(direction) {
        // Shield is on one face only
        return this.orientation === direction;
    }
}

class Pyramid extends Piece {
    constructor(player, x, y, orientation) {
        super('pyramid', player, x, y, orientation);
        this.isMirror = true;
    }

    reflectLaser(incomingDirection) {
        // Reflects laser based on orientation
        // Returns new direction
        const reflections = {
            // orientation: {incoming: outgoing}
            0: {0: 90, 90: 0, 180: 270, 270: 180},
            90: {0: 270, 90: 180, 180: 90, 270: 0},
            180: {0: 90, 90: 0, 180: 270, 270: 180},
            270: {0: 270, 90: 180, 180: 90, 270: 0}
        };
        return reflections[this.orientation][incomingDirection];
    }
}

class Scarab extends Piece {
    constructor(player, x, y, orientation) {
        super('scarab', player, x, y, orientation);
        this.isMirror = true;
        this.swapCooldowns = {
            sphinx: 0,
            pharaoh: 0
        };
    }

    reflectLaser(incomingDirection) {
        // Reflects on both sides - always reflects
        const oppositeDirection = (incomingDirection + 180) % 360;
        return oppositeDirection;
    }

    canSwapWith(target) {
        return this.swapCooldowns[target] === 0;
    }

    updateCooldowns() {
        if (this.swapCooldowns.sphinx > 0) this.swapCooldowns.sphinx--;
        if (this.swapCooldowns.pharaoh > 0) this.swapCooldowns.pharaoh--;
    }
}