var game = new Phaser.Game(600, 600, Phaser.AUTO, '', { preload: preload, create: create, update: update });

var map_size = 5;

var b_tiles;
var f_tiles;

var paletteIndex = 0;

var palettes = [
	new Palette (0xC8C8A9, 0x83AE9B, 0xF9CDAE, 0xF69A9A, 0xEF4566),
	new Palette (0x6C5B7B, 0x355C7D, 0xC06C84, 0xF67280, 0xF8B195),
	new Palette (0xE84A5F, 0x2A363B, 0xFF847C, 0xFECEA8, 0x99B898),
	new Palette (0xF7A7A6, 0xF48B94, 0xFDD2B5, 0xDBEBC2, 0xACDBC9),
	new Palette (0x474747, 0x363636, 0xE8175D, 0xCC527A, 0xA8A7A8),
	new Palette (0xF7D969, 0x2F9395, 0xF16A43, 0xEC1C4B, 0xA6206A),
	new Palette (0xF6903D, 0xF05053, 0xF9D423, 0xECE473, 0xE1F5C4),
	new Palette (0x547A82, 0x5A5050, 0x3EACA8, 0xA2D4AB, 0xE5EEC1)
]

function Palette(bg, tile, alert_1, alert_2, danger){
	this.bg = bg;
	this.tile = tile;
	this.alert_1 = alert_1;
	this.alert_2 = alert_2;
	this.danger = danger;
}

//========================================PRELOAD
//========================================PRELOAD
//========================================PRELOAD

function preload() {
	game.load.image('tile', 'assets/tile.png');
	game.load.image('tile_bad', 'assets/tile-bad.png');
	game.load.image('player', 'assets/player.png');
}

//The player
var player_group;
var f_player;
var b_player;

//Input
var upKey;
var downKey;
var leftKey;
var rightKey;

var eKey;

//========================================CREATE
//========================================CREATE
//========================================CREATE
function create() {

	//Binding input keys
	upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
  downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
  leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
  rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
  eKey = game.input.keyboard.addKey(Phaser.Keyboard.E);

	//Caching the current palette, it will always be palettes[0]
	//in the create function
	var currentPalette = palettes[paletteIndex];
	game.stage.backgroundColor = currentPalette.bg;

	//Creating the tile map
	b_tiles = game.add.group();
	f_tiles = game.add.group();
	for (var i = 0; i < map_size; i++){
		for (var j = 0; j < map_size; j++){
			var b_tile = b_tiles.create(120 * i + 60, 120 * j + 60, 'tile');
			b_tile.anchor.set(.5);
			b_tile.scale.set(.99);
			b_tile.tint = currentPalette.tile;
			var f_tile = f_tiles.create(120 * i + 60, 120 * j + 60, 'tile_bad');
			f_tile.alpha = 0;
			f_tile.anchor.set(.5);
			f_tile.scale.set(.3);
			f_tile.tint = currentPalette.alert_1;
				}
	}

	//Creating the player
	player_group = game.add.group();
  player_group.x = 120 * 3 + 60;
  player_group.y = 120 * 2 + 60;
	b_player = player_group.create(0, 0, 'player');
	b_player.anchor.set(.5);
	b_player.tint = currentPalette.danger;
  b_player.scale.set(.8);
	f_player = player_group.create(0, 0, 'player');
	f_player.anchor.set(.5);
	f_player.scale.set(.7);
	f_player.tint = currentPalette.bg;

	specTiles = getNewTiles();
}

var finished = false;
var redSpeed = 0.05;
var redTime = 0;
var scaleTime = 0;

var framesBetweenPalettes = 5;
var currentFramesBetweenPalettes = 0;


var pressedKeys = {
  up: false,
  down: false,
  left: false,
  right: false,
  e:false
};
var direction = {
  up: 0,
  down: 1,
  left: 2,
  right: 3,
  none: 4
};
var nextDirection = direction.none;
var acceptInput = true;

var changedPalette = false;
var player_speed = 5;
var nextPos;

var warning_speed = 0.02;


//========================================UPDATE
//========================================UPDATE
//========================================UPDATE

function update() {
	var currentPalette = palettes[paletteIndex];
  getPlayerInput();
  movePlayer();

	if(scaleTime <= 1){
		scaleTime+=patternSpeed;
	}
	else{
		redTime += redSpeed;
	}
	for (var i = 0; i < specTiles.length; ++i){
		if(scaleTime >= 1){
			if(redTime <= 1){
				specTiles[i].tint = currentPalette.danger;
				specTiles[i].alpha -= redSpeed;
        checkForDeaths();
				if(!changedPalette){
					changedPalette = true;
					changePalette();
				}
			}
			else{
				redTime  = 0;
				scaleTime = 0;
				specTiles[i].scale.set(.3);
				specTiles[i].alpha = 0;
				specTiles = getNewTiles();
				changedPalette = false;
			}
		}
		else{
			specTiles[i].scale.set(scaleTime);
			specTiles[i].tint = Phaser.Color.interpolateColor(currentPalette.alert_1, currentPalette.alert_2, 100, 100*scaleTime);
			specTiles[i].alpha = 1;
		}
	}
}

function checkForDeaths(){
  for(var i = 0; i< specTiles.length; ++i){
    if(player_group.x == specTiles[i].x &&
      player_group.y == specTiles[i].y){
        f_player.kill();
        b_player.kill();
        console.log("rekt");
      }
  }
}

function movePlayer(){
  if(nextDirection == direction.up)
  {
    if(player_group.y - player_speed <= nextPos){
      player_group.y = nextPos;
      resumeInput();
    }
    else
      player_group.y -= player_speed;
  }
  else if(nextDirection == direction.down)
  {
    if(player_group.y + player_speed >= nextPos)
    {
      player_group.y = nextPos;
      resumeInput();
    }
    else
      player_group.y += player_speed;
  }
  else if(nextDirection == direction.right)
  {
    if(player_group.x + player_speed >= nextPos)
    {
      player_group.x = nextPos;
      resumeInput();
    }
    else
      player_group.x += player_speed;
  }
  else if(nextDirection == direction.left)
  {
    if(player_group.x - player_speed <= nextPos){
      player_group.x = nextPos;
      resumeInput();
    }
    else
      player_group.x -= player_speed;
  }
}

function resumeInput(){
  nextDirection = direction.none;
  acceptInput = true;
}

function getPlayerInput(){
  if(eKey.isDown && !pressedKeys.e){
    pressedKeys.e = true;
    changePlayerCol();
  }
  if(eKey.isUp)
    pressedKeys.e = false;
  if(upKey.isDown && acceptInput){
    nextDirection = direction.up;
    nextPos = player_group.y - 120;
  }
  else if (downKey.isDown && acceptInput){
    nextDirection = direction.down;
    nextPos = player_group.y + 120;
  }
  else if (rightKey.isDown && acceptInput){
    nextDirection = direction.right;
    nextPos = player_group.x + 120;
  }
  else if (leftKey.isDown && acceptInput){
    nextDirection = direction.left;
    nextPos = player_group.x - 120;
  }

  if(nextDirection != direction.none)
    acceptInput = false;
}

function changePlayerCol(){
  var currentPalette = palettes[paletteIndex];
  if(f_player.tint == currentPalette.bg)
    f_player.tint = currentPalette.tile;
  else if(f_player.tint == currentPalette.tile)
    f_player.tint = currentPalette.alert_1;
  else if(f_player.tint == currentPalette.alert_1)
    f_player.tint = currentPalette.alert_2;
  else if(f_player.tint == currentPalette.alert_2)
    f_player.tint = currentPalette.danger;
  else if(f_player.tint == currentPalette.danger)
    f_player.tint = currentPalette.bg;
}

function changePalette(){
	++currentFramesBetweenPalettes;
	if(currentFramesBetweenPalettes >= framesBetweenPalettes){
		++paletteIndex;
		//framesBetweenPalettes = 3 + Math.floor(Math.random()*3);
    framesBetweenPalettes = 1;
		currentFramesBetweenPalettes = 0;
		if(paletteIndex >= palettes.length){
			paletteIndex = 0;
		}
		f_player.tint = palettes[paletteIndex].bg;
		b_player.tint = palettes[paletteIndex].danger;
		for (var i = 0; i < map_size; i++){
			for (var j = 0; j < map_size; j++){
				var pos = new Coord(i, j);
				b_tiles.getAt(getIndex(pos)).tint = palettes[paletteIndex].tile;
			}
		}
	}
}

function getIndex(coord){
	var maxCoord = 5;
	return coord.x + coord.y * maxCoord;
}

var specTiles;



var patternIndex = 0;
var frameIndex = 0;
var patternSpeed;

function Pattern(content, length, speed){
	this.content = content;
	this.length = length;
	this.speed = speed;
}

function Coord(x, y){
	this.x = x;
	this.y = y;
}

var pat1 = new Pattern(
	[
		[
			new Coord(0,0), new Coord(4,0),
			new Coord(0,4), new Coord(4,4)
		],
		[
			new Coord(1,1), new Coord(3,1),
			new Coord(1,3), new Coord(3,3)
		],
		[
			new Coord(2,2)
		]
	],
	3
);

var pat3 = new Pattern(
	[
		[
			new Coord(4,0), new Coord(3,1), new Coord (2,2), new Coord(1,3), new Coord(0,4)
		],
		[
			new Coord(0,0), new Coord(1,1), new Coord (2,2), new Coord(3,3), new Coord(4,4)
		]
	],
	2
);

var patterns =
[
	pat3, pat1
];

var patterns_till_random = 3;
var current_patterns_till_random = 0;
var randomChance = .3;


function getNewTiles(){
	var ret_tiles = [];
  if(current_patterns_till_random >= patterns_till_random){
    for (var i = 0; i < map_size; i++){
      for (var j = 0; j < map_size; j++){
        if(Math.random() < randomChance){
          ret_tiles.push(f_tiles.getAt(getIndex(new Coord(i, j))));
        }
      }
    }
    current_patterns_till_random = 0;
  }
  else
  {
    //We retrieve the current pattern being used
    var pattern = patterns[patternIndex];
    patternSpeed = warning_speed;
    //We get its contents current frame
    var frame = getRow(pattern.content, frameIndex);

    for (var i = 0; i < frame.length; i++){
    	var tileToAdd = f_tiles.getAt(getIndex(frame[i]));
    	ret_tiles.push(tileToAdd);
    }


  	++frameIndex;
  	console.log(frameIndex);
  	if(frameIndex >= pattern.length){
  		frameIndex = 0;
  		//Content's over...
  		++patternIndex;
      ++current_patterns_till_random;
  		if(patternIndex >= patterns.length){
  			patternIndex = 0;
  		}
  	}
  }

	return ret_tiles;
}

function getRow(matrix, row){
	 var column = [];
	 for(var i=0; i<matrix[row].length; i++){
			column.push(matrix[row][i]);
	 }
	 return column;
}
