class Player {
  constructor(scene) {
    this.sprite = scene.physics.add.sprite(200, 200, 'player1');
    this.scene = scene;
    this.turnTimer = 3000;
  }

  static preload(scene) {
    // player animations
    scene.load.atlas('player0', 'assets/octosprite-purple.png', 'assets/player.json');
    scene.load.atlas('player1', 'assets/octosprite-olive.png', 'assets/player.json');

  }

  static createAnims(scene){
    // player walk animation
    var i = 0
    for (i = 0; i < 2; i++)
    {
        scene.anims.create({
            key: `walk${i}`,
            frames: scene.anims.generateFrameNames(`player${i}`, {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
            frameRate: 10,
            repeat: -1
        });
        // idle with only one frame, so repeat is not neaded
        scene.anims.create({
            key: `idle${i}`,
            frames: [{key: `player${i}`, frame: 'p1_stand'}],
            frameRate: 10,
        });
    }
  }

  create(groundLayer, coinLayer, fireLayer, playerIndex, playerTexts) {
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
    // when the player overlaps with a tile with index 18, dieInAFire
    // will be called
    this.scene.physics.add.collider(this.sprite, fireLayer);

    // this text will show the score
    const text = this.scene.add.text(40 * playerIndex, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);
    playerTexts.push(text);

    this.jumpSound = this.scene.sound.add('jump',{loop: false});

  }

  update(cursor) {
    if (!this.hasControl && this.sprite.body.onFloor()) {
        this.sprite.body.setVelocityX(0);
        return;
    }
    if (cursor.left.isDown)
    {
        this.sprite.body.setVelocityX(-200);
        this.sprite.anims.play(`walk${this.playerIndex}`, true); // walk left
        this.sprite.flipX = true; // flip the sprite to the left
    }
    else if (cursor.right.isDown)
    {
        this.sprite.body.setVelocityX(200);
        this.sprite.anims.play(`walk${this.playerIndex}`, true);
        this.sprite.flipX = false; // use the original sprite looking to the right
    } else {
        this.sprite.body.setVelocityX(0);
        this.sprite.anims.play(`idle${this.playerIndex}`, true);
    }
    // jump
    if (cursor.up.isDown && this.sprite.body.onFloor())
    {
        this.jumpSound.play();;
        this.sprite.body.setVelocityY(-500);
    }
  }
}
