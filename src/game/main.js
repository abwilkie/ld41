const WIDTH = window.innerWidth * window.devicePixelRatio
const HEIGHT = window.innerHeight * window.devicePixelRatio
var game = new Phaser.Game(WIDTH, HEIGHT, Phaser.CANVAS, '', { preload: preload, create: create, update: update });

function preload() {
  ship.preload();
  planet.preload();

  game.stage.backgroundColor = '#001';
}

function create() {
  ship.create();
  planet.create();
}

function update() {
  ship.update();
  planet.update();
}
