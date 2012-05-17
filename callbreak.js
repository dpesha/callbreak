var deckManager = require('./card');
exports.games = [];


exports.Player = function(name) {
	this.id = name;
	name = name;
	this.cards = [];
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
			exports.gameManager.shuffleCards(this.gameId);
		}
	}

	this.deal = function() {
		if(this.canDeal){
			exports.gameManager.dealCards(this.gameId);
		}
	}

	this.bidPoint = function(point) {
		if(this.canBid){
			exports.gameManager.bidPoint(point,this);
			this.canBid=false;
			console.log(exports.round.bids.length);
		}
		
	}

	this.throwCard = function(rank, suit) {	
		if(this.canThrowCard){

		}	
	}

};



/* Model representing Single Game */
exports.Game = function() {

	this.gameId = '';
	this.player = [];
	this.draw = [];
	this.rounds = [];
	this.playOrder = null;

	exports.Game.SET_OF_CARDS = 1;
	exports.Game.PLAYER_QUOTA = 4;


	/* Game State Constants*/
	exports.Game.WAITING_FOR_PLAYERS_TO_JOIN = 0;
	exports.Game.PLAYER_QUOTA_REACHED = 1;
	exports.Game.WAITING_FOR_PLAYERS_TO_DRAW_CARD = 2;
	exports.Game.CAN_DEAL_CARD = 3;
	exports.Game.WAITING_FOR_PLAYER_TO_BID = 4;

	this.state = exports.Game.WAITING_FOR_PLAYERS_TO_JOIN;
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

		if (exports.gameManager.getPlayerCount(gameId) < exports.Game.PLAYER_QUOTA) {
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
		var game = new exports.Game();
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
		if (game.player.length == exports.Game.PLAYER_QUOTA) {
			exports.gameManager.updateGameStatus(gameId, exports.Game.PLAYER_QUOTA_REACHED);
		} else {
			exports.gameManager.updateGameStatus(gameId, exports.Game.WAITING_FOR_PLAYERS_TO_JOIN);

		}
	},


	/* update various status*/
	updateGameStatus: function(gameId, status) {

		var game = exports.gameManager.getGame(gameId);
		game.state = status;
		switch (status) {
		case exports.Game.WAITING_FOR_PLAYERS_TO_JOIN:
			game.deck.init(exports.Game.SET_OF_CARDS);
			game.deck.shuffle();
			break;
		case exports.Game.PLAYER_QUOTA_REACHED:
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
		game.draw.push(player_card);


	},

	/* card forge decide player's position */
	decideGameCourse: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		var players = game.player;
		var draw = game.draw;
		if (draw.length < exports.Game.PLAYER_QUOTA) {
			return;
		} else {

			var temp = [];
			for (x in draw) {

				temp.push([draw[x].player, draw[x].card.getValue(), draw[x].card.getSuit()]);

				// after all player has drawn card; push card back into the deck;
				game.deck.cards.push(draw[x].card);

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

	shuffleCards:function(gameId){
		var game = exports.gameManager.getGame(gameId);
		game.deck.shuffle();

	},

	dealCards:function(gameId){
		var game = exports.gameManager.getGame(gameId);
		var cards= game.deck.deal(exports.Game.PLAYER_QUOTA);
		var players=game.player;
		var n = cards.length / exports.Game.PLAYER_QUOTA;

		// distribute cards among players;
		for(var i = 0; i <exports.Game.PLAYER_QUOTA;i++){
			for(var j = 0; j < n; j++) {
				for(x in players) {
					if(players[x].position === i) {
						players[x].cards.push(cards[j+(i*n)]);
						if(i===1){
							players[x].canBid=true;
						} else {
							players[x].canBid=false;
						}
					}
				}				
			}
		}

	},

	bidPoint:function(point,player){
		var game=exports.gameManager.getGame(player.gameId);
		var players=game.player;
		exports.round.bids.push({'player':player.id,'bid':point});
		

		for(x in players){
			if(players[x].position == player.position){
								
				// allow next player to bid
				if((x+1) < exports.Game.PLAYER_QUOTA ){
					players[x+1].canBid=true;
				} else {
					players[0].canBid=true;
				}
			}
		}
	},

	freezeBidding:function(gameId){
		var game=exports.gameManager.getGame(player.gameId);
		var players=game.player;
		for(x in players){
			players[x].canBid=false;
			if(players[x].position === 1) {
				players[x].canThrowCard=true
			} else {
				players[x].canThrowCard=false;
			}
		}
	}



};


exports.turn = {
	cards: []
};

exports.round = {
	bids:[],
	turns:[]	
};