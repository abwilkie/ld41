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
var spawnPoints;
var coinSound;
var dieSound;
var timeSinceGameStarted = 0;
var totalCoins = 62;
var coinsCollected = 0;
var shoveSounds;
var shoveSoundIndex;

function preload() {
    // 'this' === Scene object
    // debugger;
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map2pointoh.json');
    // tiles in spritesheet
    this.load.spritesheet('tiles', 'assets/replacementtiles.png', {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', 'assets/coin.png');
    // simple fire images
    this.load.image('fire', 'assets/fire.png');

    // load sfx
    this.load.audio('jump', ['assets/jump.mp3']);
    this.load.audio('coin', ['assets/coin.mp3']);
    this.load.audio('die', ['assets/die.mp3']);
    this.load.audio('move1', ['assets/move1.mp3']);
    this.load.audio('move2', ['assets/move2.mp3']);
    this.load.audio('shove1', ['assets/shove1.mp3']);
    this.load.audio('shove2', ['assets/shove2.mp3']);
    this.load.audio('splat', ['assets/splat.mp3']);

    Player.preload(this);
}

function create() {
    /** mapcreate.js */
    // load the map
    map = this.make.tilemap({key: 'map'});
    spawnPoints = map.objects.find(objectLayer => objectLayer.name === 'Spawns');

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
    players.push(new Player(this, 1));
    players.push(new Player(this, 2));
    players.forEach((player, index) => {
        player.create(groundLayer, coinLayer, fireLayer, index, playerTexts)
    });

    // @TODO Add this to the above forEach loop when needing 3+ players.
    this.physics.add.collider(players[0].sprite, players[1].sprite, octopusParty);
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

    // Create sounds
    coinSound = this.sound.add('coin',{loop: false});
    dieSound = this.sound.add('die', {loop: false});
    shoveSounds = [
        this.sound.add('shove1', {loop: false}),
        this.sound.add('shove2', {loop: false})
    ];
    shoveSoundIndex = 0;
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
            players[nextPlayerIndex].turnTimer = 3000 + (scoreDeficit(players) * 200);

            // Swap the timers out
            turnLabelText.visible = false;
            lastTurnStartTime = this.time.now;


            // Create next swapPlayers event
            this.time.addEvent({
                delay: currentPlayer().turnTimer,
                callbackScope: this,
                callback: swapPlayers
            })
        }
    });
}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    coinsCollected++;
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    const playerIndex = players.findIndex(player => player.sprite === sprite);
    players[playerIndex].score++;
    playerTexts[playerIndex].setText(players[playerIndex].score); // set the text to show the current score
    coinSound.play();
    return false;
}

// this function will be called when the player touches a fire
function dieInAFire(sprite, tile) {
    const playerIndex = players.findIndex(player => player.sprite === sprite);
    // find nearest spawnpoint
    const selectedSpawn = spawnPoints.objects[Math.floor(Math.random()*spawnPoints.objects.length)];
    sprite.x = selectedSpawn.x;
    sprite.y = selectedSpawn.y;
    this.cameras.main.setBackgroundColor('#AA0000');
    dieSound.play();
    return false;
}

function shoveSoundIsPlaying() {
    return shoveSounds.some(sound => sound.isPlaying)
}

function octopusParty(octo1, octo2) {
  if (Math.abs(octo1.y - octo2.y) > 20 || timeSinceGameStarted < 1000) {
    return false;
  }
  if (!shoveSoundIsPlaying()) {
    shoveSoundIndex++;
    shoveSoundIndex = shoveSoundIndex % shoveSounds.length;
    shoveSounds[shoveSoundIndex].play();
  }
  return false;
}

function scoreDeficit(players) {
    var deficit = 0;
    players.forEach(player => {
        if (player.hasControl) {
            deficit -= player.score;
        } else {
            deficit += player.score;
        }
    });
    return deficit;
}

function update(time, delta) {
    timeSinceGameStarted = time;

    if (coinsCollected === totalCoins) {
      // ???
      console.log('coin');
    }
    else {
      players.forEach((player, index) => {
        player.update(playerCursors[index]);
      });

      // Update counter to show turn time remaining.
      let msRemaining;
      if (players.every(player => !player.hasControl)) {
          msRemaining = 1000 - (time - lastTurnStartTime);
      } else {
          msRemaining = currentPlayer().turnTimer - (time - lastTurnStartTime);
      }
      const seconds = Math.floor(msRemaining / 1000).toFixed(0);
      let ms = (msRemaining % 1000).toFixed(0);
      if (ms.length < 3) {
          ms = [0];
      }
      const timeDiffString = `${seconds}.${ms[0]}`;
      turnTimerText.setText(timeDiffString);
    }
}

function currentPlayer() {
    return players.find((player) => player.hasControl);
}
