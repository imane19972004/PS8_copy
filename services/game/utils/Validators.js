const { BOARD_SIZE } = require('./Constants.js');

function isWithinBoard(x, y) {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE
}

function isOrthogonalMove(x1, y1, x2, y2) {
  return (x1 === x2 || y1 === y2) &&
         !(x1 === x2 && y1 === y2)
}

function isAdjacent(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2) === 1
}

module.exports = {
  isWithinBoard,
  isOrthogonalMove,
  isAdjacent
};