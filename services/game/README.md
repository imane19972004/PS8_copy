# Game Service

Microservice gérant les parties de Khet (Player vs AI et Player vs Player).

## Structure

- `index.js` - Serveur Socket.io principal
- `GameManager.js` - Gestionnaire de parties en mémoire
- `ai/` - Intelligence artificielle
- `utils/` - Fonctions utilitaires

## Ports

- **8002** - Game Service (Socket.io)

## Démarrage
```bash
node services/game/index.js
```

## Events Socket.io

### Client → Server
- `create-game` - Créer une nouvelle partie
- `player-action` - Envoyer une action de jeu

### Server → Client
- `game-created` - Partie créée avec succès
- `game-updated` - État du jeu mis à jour
- `ai-action` - Action de l'IA
- `game-over` - Partie terminée