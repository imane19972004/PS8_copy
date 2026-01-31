/**
 * ADAPTATEUR D'ACTIONS ENTRE IA ET GAME ENGINE
 */

const { cellToCoords, coordsToCell, getReserveCellForPlayer } = require('./CellConverter.js');
const { ACTION_TYPES, ROTATION_DIRECTIONS } = require('./Constants.js');

/**
 * Convertit une action IA en action Game Engine
 */
function aiActionToGameAction(aiAction, gameState) {
  if (!aiAction || typeof aiAction !== 'object') {
    throw new Error('Invalid AI action: must be an object');
  }
  
  const { action, cell, result } = aiAction;
  
  const currentPlayer = gameState?.turn || gameState?.gameState?.turn || 2;
  
  if (!action || !ACTION_TYPES[action]) {
    throw new Error(`Invalid action type: ${action}`);
  }
  
  console.log('[ActionAdapter] Converting AI action:', {
    action,
    cell,
    result,
    currentPlayer
  });
  
  switch (action) {
    case ACTION_TYPES.ROTATE: {
      let clockwise = true;
      
      if (result === ROTATION_DIRECTIONS.CLOCKWISE || result === 'CLOCKWISE') {
        clockwise = true;
      } else if (result === ROTATION_DIRECTIONS.ANTICLOCKWISE || result === 'ANTICLOCKWISE') {
        clockwise = false;
      }
      
      const coords = cellToCoords(cell);
      if (!coords) {
        throw new Error(`Invalid cell for rotation: ${cell}`);
      }
      
      return {
        type: 'ROTATE',
        player: currentPlayer,
        params: {
          at: coords,
          clockwise: clockwise
        }
      };
    }
    
    case ACTION_TYPES.MOVE: {
      const fromCoords = cellToCoords(cell);
      const toCoords = cellToCoords(result);
      
      if (!fromCoords || !toCoords) {
        throw new Error(`Invalid cells for move: ${cell} → ${result}`);
      }
      
      return {
        type: 'MOVE',
        player: currentPlayer,
        params: {
          from: fromCoords,
          toX: toCoords.x,
          toY: toCoords.y
        }
      };
    }
    
    case ACTION_TYPES.PLACE: {
      if (!result || typeof result !== 'object') {
        throw new Error('Invalid PLACE result: must be {destination, orientation}');
      }
      
      const { destination, orientation } = result;
      const coords = cellToCoords(destination);
      
      if (!coords) {
        throw new Error(`Invalid destination cell: ${destination}`);
      }
      
      // ✅ FIX: Normaliser l'orientation (0, 9, 90, 99 → 0 ou 90)
      let normalizedOrientation = 0;
      if (orientation === 90 || orientation === 99) {
        normalizedOrientation = 90;
      }
      
      return {
        type: 'PLACE',
        player: currentPlayer,
        params: {
          x: coords.x,
          y: coords.y,
          orientation: normalizedOrientation,
          player: currentPlayer
        }
      };
    }
    
    case ACTION_TYPES.EXCHANGE: {
      const fromCoords = cellToCoords(cell);
      const toCoords = cellToCoords(result);
      
      if (!fromCoords || !toCoords) {
        throw new Error(`Invalid cells for exchange: ${cell} ↔ ${result}`);
      }
      
      return {
        type: 'EXCHANGE',
        player: currentPlayer,
        params: {
          from: fromCoords,
          to: toCoords
        }
      };
    }
    
    default:
      throw new Error(`Unhandled action type: ${action}`);
  }
}

/**
 * Convertit une action Game Engine → action IA
 */
function gameActionToAIAction(gameAction) {
  if (!gameAction || typeof gameAction !== 'object') {
    throw new Error('Invalid game action: must be an object');
  }
  
  const { type, params } = gameAction;
  
  if (!type || !params) {
    throw new Error('Game action must have type and params');
  }
  
  switch (type) {
    case 'ROTATE': {
      const { at, clockwise } = params;
      
      if (!at || at.x === undefined || at.y === undefined) {
        throw new Error('Rotate params must have at: {x, y}');
      }
      
      const cell = coordsToCell(at.x, at.y);
      
      return {
        action: ACTION_TYPES.ROTATE,
        cell: cell,
        result: clockwise ? ROTATION_DIRECTIONS.CLOCKWISE : ROTATION_DIRECTIONS.ANTICLOCKWISE
      };
    }
    
    case 'MOVE': {
      const { from, toX, toY } = params;
      
      if (!from || toX === undefined || toY === undefined) {
        throw new Error('Move params must have from: {x, y}, toX, toY');
      }
      
      const fromCell = coordsToCell(from.x, from.y);
      const toCell = coordsToCell(toX, toY);
      
      return {
        action: ACTION_TYPES.MOVE,
        cell: fromCell,
        result: toCell
      };
    }
    
    case 'PLACE': {
      const { x, y, orientation, player } = params;
      
      if (x === undefined || y === undefined || orientation === undefined) {
        throw new Error('PlacePyramid params must have x, y, orientation');
      }
      
      const destinationCell = coordsToCell(x, y);
      
      return {
        action: ACTION_TYPES.PLACE,
        cell: getReserveCellForPlayer(player),
        result: {
          destination: destinationCell,
          orientation: orientation
        }
      };
    }
    
    case 'EXCHANGE': {
      const { from, to } = params;
      
      if (!from || !to) {
        throw new Error('Exchange params must have from: {x, y}, to: {x, y}');
      }
      
      const fromCell = coordsToCell(from.x, from.y);
      const toCell = coordsToCell(to.x, to.y);
      
      return {
        action: ACTION_TYPES.EXCHANGE,
        cell: fromCell,
        result: toCell
      };
    }
    
    default:
      throw new Error(`Unhandled game action type: ${type}`);
  }
}

function isValidAIAction(aiAction) {
  try {
    if (!aiAction || typeof aiAction !== 'object') return false;
    if (!aiAction.action || !ACTION_TYPES[aiAction.action]) return false;
    if (aiAction.cell === undefined) return false;
    if (aiAction.result === undefined) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function isValidGameAction(gameAction) {
  try {
    if (!gameAction || typeof gameAction !== 'object') return false;
    if (!gameAction.type) return false;
    if (!gameAction.params || typeof gameAction.params !== 'object') return false;
    if (gameAction.player === undefined) return false;
    return true;
  } catch (e) {
    return false;
  }
}

module.exports = {
  aiActionToGameAction,
  gameActionToAIAction,
  isValidAIAction,
  isValidGameAction
};