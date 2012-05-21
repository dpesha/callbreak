var deckManager = require('./card');
exports.games = [];


exports.Player = function(name) {
	this.id = name;
	name = name;
	gameId = '';
	this.position = 0;
	this.turn = 0;
	this.cards = [];
	this.playedTricks = [];
	this.wonTricks = 0;

	/* player status flags*/
	this.canStart = false;
	this.canDrawRandomCard = false;
	this.canShuffle = false;
	this.canDeal = false;
	this.canBid = false;
	this.canTrick = false;

	this.joinGame = function(gameId) {
		this.gameId = gameId;
		exports.gameManager.joinGame(gameId, this);

	}

	this.leaveGame = function() {
		exports.gameManager.leaveGame(this);
	}

	this.startNewGame = function() {
		if (this.canStart) {
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

	this.shuffle = function() {
		if (this.canShuffle) {
			exports.gameManager.shuffleCards(this.gameId);
		}
	}

	this.deal = function() {
		if (this.canDeal) {
			exports.gameManager.dealCards(this.gameId);
		}
	}

	this.bidTricks = function(point) {
		if (this.canBid) {
			exports.gameManager.bidTricks(point, this);
			exports.gameManager.freezeBidding(this.gameId);
			this.canBid = false;
		}
	}

	this.playTrick = function(rank, suit) {
		if (this.canTrick) {
			exports.gameManager.playTrick(rank, suit, this);
			this.canTrick = false;
			exports.gameManager.assignTrickPoint(this.gameId);			
		}
	}

};


/* Model representing Single Game */
exports.Game = function() {

	this.gameId = '';
	// players array fist come first server
	this.player = [];	
	this.draw = [];
	this.bids = [];
	this.actualScore = [];	
	this.hand = [];
	this.turn=[];
	this.tricks = 0;
	this.round= 0;



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
			for (var x in game.player) {
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

	startGame: function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		for (var x in game.player) {
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

	/* card forge to decide player's position */
	decideGameCourse: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		var players = game.player;
		var draw = game.draw;
		if (draw.length < exports.Game.PLAYER_QUOTA) {
			return;
		} else {

			var temp = [];
			for (var x in draw) {

				temp.push([draw[x].player, draw[x].card.getValue(), draw[x].card.getSuit()]);

				// after all player has drawn card; push card back into the deck;
				game.deck.cards.push(draw[x].card);

			}

			temp.sort(function(a, b) {

				if (a[1] === b[1]) {
					var x = b[2].toLowerCase(),
						y = a[2].toLowerCase();
					return x < y ? -1 : x > y ? 1 : 0;
				}
				return b[1] - a[1];
			});


			// set player positions
			for (var i = 0; i< temp.length; i++) {
				for (var j = 0; j<players.length; j++) {

					if (players[j].id === temp[i][0]) {																	
						players[j].position = i;
						players[j].turn = i;
						game.turn.push(i);
					}
				};
			};


			// set permissions to shuffle & deal to strongest player			
			for (var x in players) {
				if (players[x].turn === 0) {					
					players[x].canShuffle = true;
					players[x].canDeal = true;
				}
			}
		}

	},

	shuffleCards: function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		game.deck.shuffle();	

	},

	dealCards: function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		var cards = game.deck.deal(exports.Game.PLAYER_QUOTA);
		var players = game.player;
		var n = cards.length / exports.Game.PLAYER_QUOTA;

		// distribute cards among players;
		for (var i = 0; i < exports.Game.PLAYER_QUOTA; i++) {
			for (var j = 0; j < n; j++) {
				for (var x in players) {
					if (players[x].turn === i) {
						players[x].cards.push(cards[j + (i * n)]);
						if (i === 1) {
							players[x].canBid = true;
						} else {
							players[x].canBid = false;
						}
					}
				}
			}
		}

		// initialize 
		for(var x in players) {
			players[x].wonTricks=0;
		}
		// set current tricks to 0;
		game.tricks = 0;

	},

	bidTricks: function(point, player) {

		var game = exports.gameManager.getGame(player.gameId);
		game.bids.push({
			'player': player.id,
			'bid': point
		});
		exports.gameManager.setNextPlayerPermission(player, 'canBid');

	},

	setNextPlayerPermission: function(player, prop) {

		var game = exports.gameManager.getGame(player.gameId);
		var players = game.player;

		// allow next player to bid

		for (var x in players) {
			if ((player.turn + 1) < exports.Game.PLAYER_QUOTA) {
				if (players[x].turn === player.turn + 1) {
					players[x][prop] = true;
				}
			} else {
				if (players[x].turn === 0) {
					players[x][prop] = true;
				}
			}
		}

	},

	freezeBidding: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		

		if (game.bids.length === exports.Game.PLAYER_QUOTA) {
			var players = game.player;
			for (var x in players) {

				players[x].canBid = false;

				if (players[x].turn === 1) {
					players[x].canTrick = true
				} else {
					players[x].canTrick = false;
				}
			}
		}
	},

	playTrick: function(rank, suit, player) {

		var game = exports.gameManager.getGame(player.gameId);
		for (x in player.cards) {
			if (player.cards[x].getRank() === rank && player.cards[x].getSuit() === suit) {
				// TODO Check whether the card thrown is following lead card
				game.hand.push(player.cards[x]);
				player.playedTricks.push(player.cards[x]);
				player.cards.splice(x, 1);
				exports.gameManager.setNextPlayerPermission(player, 'canTrick');
			}
		}

	},

	assignTrickPoint: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		var pq=exports.Game.PLAYER_QUOTA;

		if (game.hand.length === exports.Game.PLAYER_QUOTA) {
			var players = game.player;

			// increase the tricks count;
			game.tricks = game.tricks + 1;

			// decide who won the tricks
			var winner = game.hand[0];
			var winnerPos = 0;
			var x = 1;
			while (x < 4) {

				if (game.hand[x].getSuit() === winner.getSuit()) {
					if (game.hand[x].getValue() > winner.getValue()) {
						winner = game.hand[x];
						winnerPos = x;
					}
				} else {
					if (game.hand[x].getSuit() === 'S') {
						winner = game.hand[x];
						winnerPos = x;
					}
				}
				x++;
			}

			winnerPos = (winnerPos == 3 ? 0 : winnerPos + 1);
			

			for (var x in players) {
				if (players[x].turn === winnerPos) {
					players[x].wonTricks = players[x].wonTricks + 1;
				}
				
			}

			
    		// update turns of players;    		
    		game.turn.unshift.apply(game.turn, game.turn.splice(winnerPos, game.turn.length));  		
    		
    		
    		for(var x in players){
    			for(var y in game.turn){    				
    				if(players[x].turn===game.turn[y]){    					
    					players[x].turn=parseInt(y);
    					break;
    				}
    			}
    		}

    		//update  next player permission to play tricks
			for (var x in players) {				
				
				if (players[x].turn === 1) {					
					players[x].canTrick = true					
				} else {					
					players[x].canTrick = false;					
				}
				
			}  			


			// reset game.hand
			game.hand = [];

			
			// When last tricks
			if (game.tricks === 13) {	
			

				// sum won trickss & assign to actual score
				for (var x in players) {
					if(players[x].position === 0){
						game.actualScore[3] = players[x].wonTricks;	
					} else {
						game.actualScore[players[x].position -1]=players[x].wonTricks;
					}					
				}


				// update players turn 
				for (var x in players){
					if(players[x].position === 0){
						players[x].turn = 3;												
					} else {
						players[x].turn=players[x].position-1;
					}
				}

				// update players position
				for (var x in players){
					players[x].position=players[x].turn;					
				}				

				// update who can shuffle & deal next
				for (var x in players) {
					if (players[x].turn === 0) {					
						players[x].canShuffle = true;
						players[x].canDeal = true;
					} else {
						players[x].canShuffle = false;
						players[x].canDeal = false;
					}
					players[x].canTrick=false;
				}

				// increase the tricks count;
				game.round = game.round + 1;


			}
		}

	}

};

 
 
