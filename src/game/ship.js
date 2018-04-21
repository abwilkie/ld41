var ship = {

    preload: () => {
      game.load.image('spaceship', 'assets/spaceship.png');
    },

    create: () => {
      sprite = game.add.sprite(200, game.height/2, 'spaceship');
    },

    update: () => {

    }
};
