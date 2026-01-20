export default class LaserSimulator {
  simulate(board, player) {
    const events = [];
    const sphinx = board.getPieces().find(p => p.type === 'sphinx' && p.player === player);

    if (!sphinx) return events;

    let x = sphinx.x;
    let y = sphinx.y;
    let dir = sphinx.getLaserDirection();

    // Add sphinx as starting point
    events.push({ piece: sphinx, type: 'START', x, y });

    const piecesToDestroy = []; // Liste des pièces à détruire

    while (true) {
      x += dir.dx;
      y += dir.dy;

      if (!board.isValidPosition(x, y)) break;

      const target = board.getPieceAt(x, y);
      if (!target) {
        events.push({ type: 'PATH', x, y });
        continue;
      }

      const interaction = target.interactWithLaser(dir);
      events.push({ piece: target, ...interaction, x, y });

      // Si la pièce est détruite, on la marque mais le laser CONTINUE
      if (interaction.type === 'DESTROY') {
        piecesToDestroy.push(target);
        // Le laser CONTINUE comme si la pièce n'existait pas
        continue;
      }

      // Si le laser est bloqué ou stoppé
      if (interaction.stop) break;
      
      // Si le laser est réfléchi
      if (interaction.newDirection) dir = interaction.newDirection;
    }

    // Marquer toutes les pièces à détruire dans les events
    piecesToDestroy.forEach(piece => {
      const event = events.find(e => e.piece === piece);
      if (event) event.willBeDestroyed = true;
    });

    return events;
  }
}