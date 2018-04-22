class Player {
  constructor(scene) {
    this.sprite = scene.physics.add.sprite(200, 200, 'player');
    this.scene = scene;
  }

  static preload(scene) {
    // player animations
    scene.load.atlas('player', 'assets/octosprite.png', 'assets/player.json');
  }

  create(groundLayer, coinLayer, playerIndex, playerTexts) {
    this.playerIndex = playerIndex;
    this.score = 0;
    this.sprite.setBounce(0.2); // our player will bounce from items
    this.sprite.setCollideWorldBounds(true); // don't go out of the map
    // small fix to our player images, we resize the physics body object slightly
    this.sprite.body.setSize(this.sprite.width-30, this.sprite.height-30);
    // player will collide with the level tiles
    this.scene.physics.add.collider(groundLayer, this.sprite);
    // when the player overlaps with a tile with index 17, collectCoin
    // will be called
    this.scene.physics.add.overlap(this.sprite, coinLayer);

    // this text will show the score
    const text = this.scene.add.text(20 * playerIndex, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);
    playerTexts.push(text);
  }

  update() {

  }
}
