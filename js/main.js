var config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 500},
            debug: false
        }
    },
    scene: {
        key: 'main',
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var map;
var players = [];
var playerCursors = [];
var playerTexts = [];
var cursors;
var groundLayer, coinLayer;

function preload() {
    // 'this' === Scene object
    // debugger;
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // tiles in spritesheet
    this.load.spritesheet('tiles', 'assets/replacementtiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', 'assets/coin.png');
    Player.preload(this);
}

function create() {
    /** mapcreate.js */
    // load the map
    map = this.make.tilemap({key: 'map'});

    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // coin image used as tileset
    var coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;
    /** end mapcreate.js */

    /** playercreate.js */
    // create the player sprite
    players.push(this.physics.add.sprite(200, 200, 'player'));
    players.push(this.physics.add.sprite(200, 200, 'player'));
    players.forEach((player, index) => {
        player.score = 0;
        player.setBounce(0.2); // our player will bounce from items
        player.setCollideWorldBounds(true); // don't go out of the map
        // small fix to our player images, we resize the physics body object slightly
        player.body.setSize(player.width-30, player.height-30);
        // player will collide with the level tiles
        this.physics.add.collider(groundLayer, player);
        // when the player overlaps with a tile with index 17, collectCoin
        // will be called
        this.physics.add.overlap(player, coinLayer);

        // this text will show the score
        const text = this.add.text(20 * index, 570, '0', {
            fontSize: '20px',
            fill: '#ffffff'
        });
        // fix the text to the camera
        text.setScrollFactor(0);
        playerTexts.push(text);
    });

    // @TODO Add this to the above forEach loop when needing 3+ players.
    this.physics.add.collider(players[0], players[1]);
    players[0].hasControl = true;

    coinLayer.setTileIndexCallback(17, collectCoin, this);

    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });

    playerCursors.push(this.input.keyboard.createCursorKeys());
    playerCursors.push(this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
    }));
    /** end playercreate.js */

    /**  */
    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(players[0]);

    // set background color, so the sky is not black
    this.cameras.main.setBackgroundColor('#ccccff');

    this.time.addEvent({
        delay: 0,
        callbackScope: this,
        callback: swapPlayers
    });
}

function swapPlayers() {
    // Gray out the background for a second
    this.cameras.main.setBackgroundColor('#777777');

    const playerInControlIndex = players.findIndex(player => player.hasControl);
    players.forEach(player => {
        player.hasControl = false;
    });
    // Enable the next player
    const nextPlayerIndex = (playerInControlIndex + 1) % players.length;
    // players[nextPlayerIndex].hasControl = true;
    // make the camera follow the active player
    this.cameras.main.startFollow(players[nextPlayerIndex]);


    this.time.addEvent({
        delay: 1000,
        callbackScope: this,
        callback: () => {
            // Turn the background back to normal
            this.cameras.main.setBackgroundColor('#ccccff');

            players[nextPlayerIndex].hasControl = true;

            // Swap player activity
            // players[0].hasControl = !players[0].hasControl;
            // players[1].hasControl = !players[1].hasControl;
            // make inactive player gray(???)
            //
            // Create next swapPlayers event
            this.time.addEvent({
                delay: 3000,
                callbackScope: this,
                callback: swapPlayers
            })
        }
    });
}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    sprite.score++; // add 1 point to the score
    const playerIndex = players.findIndex(player => player === sprite);
    playerTexts[playerIndex].setText(sprite.score); // set the text to show the current score
    return false;
}

function update(time, delta) {

    /** playermanager.js */
    players.forEach((player, index) => {
        if (!player.hasControl && player.body.onFloor()) {
            player.body.setVelocityX(0);
            return;
        }
        if (playerCursors[index].left.isDown)
        {
            player.body.setVelocityX(-200);
            player.anims.play('walk', true); // walk left
            player.flipX = true; // flip the sprite to the left
        }
        else if (playerCursors[index].right.isDown)
        {
            player.body.setVelocityX(200);
            player.anims.play('walk', true);
            player.flipX = false; // use the original sprite looking to the right
        } else {
            player.body.setVelocityX(0);
            player.anims.play('idle', true);
        }
        // jump
        if (playerCursors[index].up.isDown && player.body.onFloor())
        {
            player.body.setVelocityY(-500);
        }
    });
    /** end playermanager.js */
}
