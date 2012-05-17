var deckManager = require('./card');
exports.games = [];


exports.player = function(name) {
	this.id = name;
	name = name;
	cards = [];
	gameId = '';
	this.randomCard = null;
	this.position = 0;

	/* player status flags*/
	this.canStart = false;
	this.canDrawRandomCard = false;
	this.canShuffle=false;
	this.canDeal = false;
	this.canBid = false;
	this.canThrowCard = false;

	this.joinGame = function(gameId) {
		this.gameId = gameId;
		exports.gameManager.joinGame(gameId, this);

	}

	this.leaveGame = function() {
		exports.gameManager.leaveGame(this);
	}

	this.startNewGame = function() {
		if(this.canStart){
			exports.gameManager.startGame(this.gameId);
		}

	}
	this.drawRandomCard = function() {

		if (this.canDrawRandomCard) {
			card: exports.gameManager.drawRandomCard(this);
			this.canDrawRandomCard = false;
			exports.gameManager.decideGameCourse(this.gameId);
		}
	}

	this.shuffle =function(){
		if(this.canShuffle){

		}
	}

	this.deal = function() {
		if(this.canDeal){

		}
	}

	this.bid = function() {
		
	}
	this.throwCard = function(rank, suit) {		
	}

};



/* Model representing Single Game */
exports.game = function() {

	this.gameId = '';
	this.player = [];
	this.turn = [];
	this.round = [];
	this.playOrder = null;

	exports.game.SET_OF_CARDS = 1;
	exports.game.PLAYER_QUOTA = 4;


	/* Game State Constants*/
	exports.game.WAITING_FOR_PLAYERS_TO_JOIN = 0;
	exports.game.PLAYER_QUOTA_REACHED = 1;
	exports.game.WAITING_FOR_PLAYERS_TO_DRAW_CARD = 2;
	exports.game.CAN_DEAL_CARD = 3;
	exports.game.WAITING_FOR_PLAYER_TO_BID = 4;

	this.state = exports.game.WAITING_FOR_PLAYERS_TO_JOIN;
	this.deck = null;

};

exports.gameManager = {

	/* join game*/
	joinGame: function(gameId, player) {

		// create new game if it does not exist
		if (!exports.gameManager.doesgameExist(gameId)) {
			exports.gameManager.createNewGame(gameId);
		}

		var game = exports.gameManager.getGame(gameId);

		if (exports.gameManager.getPlayerCount(gameId) < exports.game.PLAYER_QUOTA) {
			exports.gameManager.getGame(gameId).player.push(player);
			exports.gameManager.updatePlayerCount(gameId);
		}

	},

	/* TODO: make doesgameExist private*/
	doesgameExist: function(gameId) {

		for (var i = 0; i < exports.games.length; i++) {
			if (gameId === exports.games[i].gameId) {
				return true;
			}
		}
		return false;
	},


	// create a new Game with 'gameId'
	createNewGame: function(gameId) {
		var game = new exports.game();
		game.gameId = gameId;
		game.deck = new deckManager.deck();
		exports.games.push(game);
	},


	/* TODO: make getPlayerCount private*/
	getPlayerCount: function(gameId) {

		return exports.gameManager.getGame(gameId).player.length;


	},

	/* get Game */
	getGame: function(gameId) {
		for (var i = 0; i < exports.games.length; i++) {
			if (gameId === exports.games[i].gameId) {
				return exports.games[i];
			}
		}
	},

	/* set the state of Game*/
	updatePlayerCount: function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		if (game.player.length == exports.game.PLAYER_QUOTA) {
			exports.gameManager.updateGameStatus(gameId, exports.game.PLAYER_QUOTA_REACHED);
		} else {
			exports.gameManager.updateGameStatus(gameId, exports.game.WAITING_FOR_PLAYERS_TO_JOIN);

		}
	},


	/* update various status*/
	updateGameStatus: function(gameId, status) {

		var game = exports.gameManager.getGame(gameId);
		game.state = status;
		switch (status) {
		case exports.game.WAITING_FOR_PLAYERS_TO_JOIN:
			game.deck.init(exports.game.SET_OF_CARDS);
			game.deck.shuffle();
			break;
		case exports.game.PLAYER_QUOTA_REACHED:
			for (x in game.player) {
				game.player[x].canStart = true;
			}
			break;
		}

	},


	/* leave game */
	leaveGame: function(player) {
		var players = exports.gameManager.getGame(player.gameId).player;
		for (var i = 0; i < players.length; i++) {
			if (player == players[i]) {
				players.splice(i, 1);
			}
		}
		exports.gameManager.updatePlayerCount(player.gameId); /* TODO: How to destory player object when player leaves the Game*/
		// 
	},

	startGame:function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		for (x in game.player) {
				game.player[x].canDrawRandomCard = true;
			}
		
	},

	/* draw random card (part of cardforge) */
	drawRandomCard: function(player) {

		var game = exports.gameManager.getGame(player.gameId);
		var player_card = {
			player: player.id,
			card: game.deck.drawRandomCard()
		};
		game.turn.push(player_card);


	},

	/* card forge decide player's position */
	decideGameCourse: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		var players = game.player;
		var turn = game.turn;
		if (turn.length < exports.game.PLAYER_QUOTA) {
			return;
		} else {

			var temp = [];
			for (x in turn) {

				temp.push([turn[x].player, turn[x].card.getValue(), turn[x].card.getSuit()]);

				// after all player has drawn card; push card back into the deck;
				game.deck.cards.push(turn[x].card);

			}
			game.playOrder = temp.sort(function(a, b) {

				if (a[1] === b[1]) {
					var x = b[2].toLowerCase(),
						y = a[2].toLowerCase();
					return x < y ? -1 : x > y ? 1 : 0;
				}
				return b[1] - a[1];
			});			


			// set player positions
			for (var i = temp.length - 1; i >= 0; i--) {
				for (var j = players.length - 1; j >= 0; j--) {
					if (players[j].id === temp[i][0]) {
							players[j].position = i;
					}
				};
			};

			// set permissions to shuffle & deal to strong player
			for(x in players){
				if(players[x].position === 0){

					players[x].canShuffle=true;
					players[x].canDeal=true;
				}				
			}
		}

	},

	shuffleCards:function(){

	},

	dealCards:function(){
		
	}


};


exports.table = {
	player: [],
	south: '',
	east: '',
	north: '',
	west: '',
	rotate: function() {

	}
};

exports.turn = {
	cards: []
};

exports.round = {
	current: 0,
	start: function() {

	},
	end: function() {

	}
};