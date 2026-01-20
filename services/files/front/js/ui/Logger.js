export default class Logger {
  constructor() {
    this.logElement = document.getElementById('gameLog');
  }

  log(message, cssClass = 'log-info') {
    const p = document.createElement('p');
    p.className = cssClass;
    p.textContent = message;
    this.logElement.appendChild(p);
    this.logElement.scrollTop = this.logElement.scrollHeight;
  }

  logAction(player, action, details) {
    this.log(`P${player}: ${action} ${details || ''}`, 'log-action');
  }

  logLaser(events) {
    events.filter(e => e.type !== 'PATH' && e.type !== 'START').forEach(e => {
      if (e.type === 'DESTROY') {
        this.log(`💥 Laser destroyed ${e.piece.type}!`, 'log-laser');
      } else if (e.type === 'REFLECT') {
        this.log(`✨ Laser reflected by ${e.piece.type}`, 'log-laser');
      } else if (e.type === 'BLOCK') {
        this.log(`🛡️ Laser blocked by ${e.piece.type}`, 'log-laser');
      }
    });
  }

  logGameOver(winner) {
    if (winner) {
      this.log(`🏆 GAME OVER — Player ${winner} WINS! 🏆`, 'log-win');
    } else {
      this.log(`🤝 GAME OVER — DRAW! 🤝`, 'log-win');
    }
  }

  logError(message) {
    this.log(`❌ ${message}`, 'log-error');
  }

  clear() {
    this.logElement.innerHTML = '<p>Game started. Player 1\'s turn.</p>';
  }
}