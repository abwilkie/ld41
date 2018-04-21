var planet = {

    preload: () => {
      game.load.image('planet', 'assets/planet.png');
    },

    create: () => {
      sprite = game.add.sprite(0,game.height/2, 'planet');
    },

    update: () => {

    }
};
