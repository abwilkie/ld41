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
var groundLayer, coinLayer, fireLayer;
var turnTimerText;
var turnLabelText;
var lastTurnStartTime;

function preload() {
    // 'this' === Scene object
    // debugger;
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map.json');
    // tiles in spritesheet
    this.load.spritesheet('tiles', 'assets/replacementtiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', 'assets/coin.png');
    // simple fire images
    this.load.image('fire', 'assets/fire.png');
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

    // fire image used as tileset
    var fireTiles = map.addTilesetImage('fire');
    // add coins as tiles
    fireLayer = map.createDynamicLayer('Hazards', fireTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;
    /** end mapcreate.js */

    // create the player sprite
    players.push(new Player(this));
    players.push(new Player(this));
    players.forEach((player, index) => {
        player.create(groundLayer, coinLayer, fireLayer, index, playerTexts)
    });

    // @TODO Add this to the above forEach loop when needing 3+ players.
    this.physics.add.collider(players[0].sprite, players[1].sprite);
    players[0].hasControl = true;

    coinLayer.setTileIndexCallback(17, collectCoin, this);
    fireLayer.setTileIndexCallback(19, dieInAFire, this);

    Player.createAnims(this)

    playerCursors.push(this.input.keyboard.createCursorKeys());
    playerCursors.push(this.input.keyboard.addKeys({
        up: Phaser.Input.Keyboard.KeyCodes.W,
        down: Phaser.Input.Keyboard.KeyCodes.S,
        left: Phaser.Input.Keyboard.KeyCodes.A,
        right: Phaser.Input.Keyboard.KeyCodes.D,
    }));

    /**  */
    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(players[0].sprite);

    // set background color, so the sky is not black
    this.cameras.main.setBackgroundColor('#ccccff');

    this.time.addEvent({
        delay: 0,
        callbackScope: this,
        callback: swapPlayers
    });

    turnTimerText = this.add.text(680, 20, '3000', {
        fontSize: '40px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    turnTimerText.setScrollFactor(0);

    turnLabelText = this.add.text(400, 300, 'Player 1', {
        fontSize: '40px',
        fill: '#ffffff'
    });
    turnLabelText.setScrollFactor(0);
    turnLabelText.visible = false;
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
    this.cameras.main.startFollow(players[nextPlayerIndex].sprite);

    // Label the next turn and start a countdown
    turnLabelText.setText(`Player ${nextPlayerIndex + 1}`)
    turnLabelText.visible = true;
    lastTurnStartTime = this.time.now;

    this.time.addEvent({
        delay: 1000,
        callbackScope: this,
        callback: () => {
            // Turn the background back to normal
            this.cameras.main.setBackgroundColor('#ccccff');

            // Swap player activity
            players[nextPlayerIndex].hasControl = true;

            // Swap the timers out
            turnLabelText.visible = false;
            lastTurnStartTime = this.time.now;


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
    const playerIndex = players.findIndex(player => player.sprite === sprite);
    players[playerIndex].score++;
    playerTexts[playerIndex].setText(players[playerIndex].score); // set the text to show the current score
    return false;
}

// this function will be called when the player touches a fire
function dieInAFire(sprite, tile) {
    const playerIndex = players.findIndex(player => player.sprite === sprite);
    sprite.x = 200;
    sprite.y = 200;
    this.cameras.main.setBackgroundColor('#AA0000');
    return false;
}

function update(time, delta) {
    players.forEach((player, index) => {
      player.update(playerCursors[index]);
    });

    // Update counter to show turn time remaining.
    let msRemaining;
    if (players.every(player => !player.hasControl)) {
        msRemaining = 1000 - (time - lastTurnStartTime);
    } else {
        msRemaining = 3000 - (time - lastTurnStartTime);
    }
    const seconds = Math.floor(msRemaining / 1000).toFixed(0);
    let ms = (msRemaining % 1000).toFixed(0);
    if (ms.length < 3) {
        ms = [0];
    }
    const timeDiffString = `${seconds}.${ms[0]}`;
    turnTimerText.setText(timeDiffString);
}
