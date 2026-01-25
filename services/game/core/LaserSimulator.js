export default class LaserSimulator {
  simulate(board, player) {
    const events = [];
    
    // Trouver le Sphinx du joueur
    const sphinx = board.getPieces().find(
      p => p.type === 'sphinx' && p.player === player
    );

    if (!sphinx) {
      console.warn(`No sphinx found for player ${player}`);
      return events;
    }

    let x = sphinx.x;
    let y = sphinx.y;
    let dir = sphinx.getLaserDirection();

    // Point de départ
    events.push({ 
      piece: sphinx, 
      type: 'START', 
      x, 
      y 
    });

    const maxIterations = 200; // Sécurité anti-boucle infinie
    let iterations = 0;

    while (iterations++ < maxIterations) {
      // Avancer dans la direction actuelle
      x += dir.dx;
      y += dir.dy;

      // Sortie du plateau
      if (!board.isValidPosition(x, y)) {
        events.push({ type: 'EXIT', x, y });
        break;
      }

      const target = board.getPieceAt(x, y);

      // Case vide
      if (!target) {
        events.push({ type: 'PATH', x, y });
        continue;
      }

      const interaction = target.interactWithLaser(dir);
      
      const event = { 
        piece: target, 
        type: interaction.type,
        x, 
        y 
      };

      // Ajouter newDirection seulement si c'est une réflexion
      if (interaction.newDirection) {
        event.newDirection = interaction.newDirection;
      }

      events.push(event);

      if (interaction.type === 'DESTROY') {
        continue;
      }

      if (interaction.stop || interaction.type === 'BLOCK') {
        break;
      }

      if (interaction.type === 'REFLECT' && interaction.newDirection) {
        dir = interaction.newDirection;
      }
    }

    if (iterations >= maxIterations) {
      console.error('Laser simulation: max iterations reached');
    }

    return events;
  }
}