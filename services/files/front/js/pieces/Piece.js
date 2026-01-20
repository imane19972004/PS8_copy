export default class Piece {
  constructor(type, player, x, y, orientation = 0) {
    this.type = type;
    this.player = player;
    this.x = x;
    this.y = y;
    this.orientation = orientation;
    this.alive = true;
  }

  rotate(clockwise = true) {
    this.orientation = (this.orientation + (clockwise ? 90 : -90) + 360) % 360;
  }

  canMove() {
    return false;
  }

  canRotate() {
    return false;
  }

  blocksLaser() {
    return false;
  }

  reflectsLaser() {
    return false;
  }

  interactWithLaser(dir) {
    return {
      type: 'DESTROY',
      stop: true
    };
  }

  getShieldSides() {
    return {
      top: false,
      right: false,
      bottom: false,
      left: false
    };
  }
}