/**
 * Server-side Logger
 */
export default class ServerLogger {
    constructor() {
        this.logs = [];
        this.maxLogs = 100;
    }

    log(message, level = 'info') {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message
        };

        this.logs.push(logEntry);

        // Limiter la taille
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        console.log(`[${level.toUpperCase()}] ${message}`);
    }

    logAction(player, action, details) {
        this.log(`P${player}: ${action} ${details || ''}`, 'action');
    }

    logLaser(events) {
        events
            .filter(e => e.type !== 'PATH' && e.type !== 'START')
            .forEach(e => {
                if (e.type === 'DESTROY') {
                    this.log(`Laser destroyed ${e.piece.type}`, 'laser');
                } else if (e.type === 'REFLECT') {
                    this.log(`Laser reflected by ${e.piece.type}`, 'laser');
                } else if (e.type === 'BLOCK') {
                    this.log(`Laser blocked by ${e.piece.type}`, 'laser');
                }
            });
    }

    logGameOver(winner) {
        if (winner) {
            this.log(`GAME OVER - Player ${winner} WINS!`, 'win');
        } else {
            this.log('GAME OVER - DRAW!', 'win');
        }
    }

    logError(message) {
        this.log(message, 'error');
    }

    clear() {
        this.logs = [];
        this.log('Game started');
    }

    getLogs() {
        return this.logs;
    }
}