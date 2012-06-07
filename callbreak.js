var deckManager = require('./card');
exports.games = [];


exports.Player = function(name) {
	this.id = name;
	this.name = name;
	this.gameId = '';
	this.position = 0;
	this.turn = 0;
	this.cards = [];
	this.playedTricks = [];
	this.bid=0;
	this.wonTricks = 0;	

	/* player status flags*/
	this.canStart = false;
	this.canDraw = false;
	this.canShuffle = false;
	this.canDeal = false;
	this.canBid = false;
	this.canTrick = false;	

	this.joinGame = function(gameId) {
		this.gameId = gameId;
		return exports.gameManager.joinGame(gameId, this);

	}

	this.leaveGame = function() {
		exports.gameManager.leaveGame(this);
	}

	this.startNewGame = function() {
		if (this.canStart) {
			exports.gameManager.startGame(this.gameId);
		}

	}
	this.drawRandomCard = function(index) {

		if (this.canDraw) {
			var card = exports.gameManager.drawRandomCard(this,index);
			this.canDraw = false;			
			return card;
		}
	}

	this.rePosition = function(){
		exports.gameManager.rePosition(this.gameId);
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
			this.bid=point;
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

	this.startNextHand =function(){
		exports.gameManager.startNextHand(this.gameId);
	}

	this.startNextRound =function(){
		exports.gameManager.startNextRound(this.gameId);
	}

	this.requestRedeal = function(){
		exports.gameManager.requestRedeal(this.gameId,this);
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
	
 	exports.Game.STATUS0 = 'Waiting for other {x} player to join.';
	exports.Game.STATUS1 = 'Player quota reached, please click start button.';
	exports.Game.STATUS2 = 'Draw a card by clicking on deck to decide position.';
	exports.Game.STATUS3 = 'Waiting for other {x} player to draw card.';	
	exports.Game.STATUS4 = 'Player {x} to shuffle/deal. Click "Proceed" button to rearrange position.';
	exports.Game.STATUS5 = 'Waiting for Player {x} to shuffle/deal.';
	exports.Game.STATUS6 = 'How many hand? Bid turn: player {x}';
	exports.Game.STATUS7 = '{y} turn: player {x}';
	exports.Game.STATUS8 = 'Bidding Completed, Trick turn:player {x}';
	exports.Game.STATUS9 = 	'Player {x} won the trick, Click "Proceed" button for next Hand.';
	exports.Game.STATUS10 = 'Trick turn : player {x}';
	exports.Game.STATUS11 = 'Round Completed. Player {x} to shuffle/deal next round';
	exports.Game.STATUS12 = 'Game Completed.';

	this.status = "";
	this.deck = null;

};

exports.gameManager = {

	/* join game*/
	joinGame: function(gameId, player) {

		// create new game if it does not exist
		if (!exports.gameManager.doesgameExist(gameId)) {
			exports.gameManager.createNewGame(gameId);			
		} else {
			if(exports.gameManager.doesplayerExist(gameId,player)){
				return false;
			}			
		}

		var game = exports.gameManager.getGame(gameId);

		if (exports.gameManager.getPlayerCount(gameId) < exports.Game.PLAYER_QUOTA) {
			exports.gameManager.getGame(gameId).player.push(player);
			exports.gameManager.updatePlayerCount(gameId);
			return true;
		}
		return false;

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

	doesplayerExist:function(gameId,player){
		// for (var i = 0; i < exports.games.length; i++) {
		// 	if (gameId === exports.games[i].gameId) {
		// 		for( var j=0;j<exports.games[i].player.length;j++){
		// 			if(player.id === exports.games[i].player[j].id){						
		// 				return true;
		// 			}
		// 		}
		// 	}
		// }
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

			for (var x in game.player) {
				game.player[x].canStart = true;
			}
			game.status = exports.Game.STATUS1;			
		} else {
			game.deck.init(exports.Game.SET_OF_CARDS);
			game.deck.shuffle();
			game.status = exports.Game.STATUS0.replace('{x}',exports.Game.PLAYER_QUOTA-game.player.length);
			
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
		exports.gameManager.updatePlayerCount(player.gameId); 
		/* TODO: How to destory player object when player leaves the Game*/
		
	},

	startGame: function(gameId) {
		var game = exports.gameManager.getGame(gameId);
		game.draw = [];
		game.bids = [];
		game.actualScore = [];	
		game.hand = [];
		game.turn=[];
		game.tricks = 0;
		game.round= 0;
		game.bids
		for (var x in game.player) {
			game.player[x].canStart = false;
			game.player[x].canDraw = true;
			game.status=exports.Game.STATUS2;
		}
		exports.gameManager.shuffleCards(gameId);

	},

	/* draw random card (part of cardforge) */
	drawRandomCard: function(player,index) {

		var game = exports.gameManager.getGame(player.gameId);			
		var player_card = {
			player: player.id,
			card: game.deck.drawRandomCard(index)
		};
		game.draw.push(player_card);
		// If last card
		if (game.draw.length < exports.Game.PLAYER_QUOTA) {			
			game.status=exports.Game.STATUS3.replace('{x}',exports.Game.PLAYER_QUOTA-game.draw.length);			
		} else {
			exports.gameManager.decideGameCourse(player.gameId);
		}
		return player_card.card.toString();

	},

	rePosition: function(gameId){
		var game = exports.gameManager.getGame(gameId);
		var players=game.player;
		for (var x in players) {
			if (players[x].turn === 0) {									
				game.status=exports.Game.STATUS5.replace('{x}',players[x].id);					
				break;
			}
		}		
	},

	/* card forge to decide player's position */
	decideGameCourse: function(gameId) {

		var game = exports.gameManager.getGame(gameId);
		var players = game.player;
		var draw = game.draw;		

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
				game.status=exports.Game.STATUS4.replace('{x}',players[x].id);					
				break;
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

		// initialize 
		for(var x in players) {
			players[x].wonTricks=0;
			players[x].playedTricks=[];
			players[x].cards=[];
		}
		game.tricks = 0;
		game.actualScore=[];
		game.bids = [];

		// distribute cards among players;
		for (var i = 0; i < exports.Game.PLAYER_QUOTA; i++) {
			for (var j = 0; j < n; j++) {
				for (var x in players) {					
					if (players[x].turn === i) {
						players[x].cards.push(cards[j + (i * n)]);
						if (i === 1) {
							players[x].canBid = true;
							game.status=exports.Game.STATUS6.replace('{x}',players[x].id);
						} else {
							players[x].canBid = false;
						}
					}
				}
			}
		}

		
		// place same suit cards together
		for (var i=0; i<players.length;i++){
			
			players[i].cards.sort(function(a,b) {

				var suita=a.getSuitValue();
				var suitb=b.getSuitValue();			

				if (suita === suitb) {
				 	var x = a.getValue(),
				 		y = b.getValue();
				 	return x < y ? -1 : x > y ? 1 : 0;
				}
				return suita - suitb;				
			});
		}		
		

		// update permission
		for (var x in players) {
			players[x].canShuffle = false;
			players[x].canDeal = false;
		}
		

	},

	bidTricks: function(point, player) {

		var game = exports.gameManager.getGame(player.gameId);		
		game.bids.push({
			'position': player.position,
			'point': point
		});

		exports.gameManager.setNextPlayerPermission(player, 'canBid');

	},

	setNextPlayerPermission: function(player, prop) {

		var game = exports.gameManager.getGame(player.gameId);
		var players = game.player;

		for (var x in players) {
			if ((player.turn + 1) < exports.Game.PLAYER_QUOTA) {
				if (players[x].turn === player.turn + 1) {
					players[x][prop] = true;
					game.status=exports.Game.STATUS7.replace('{x}',players[x].id).replace('{y}',prop.split('can')[1]);
				}
			} else {
				if (players[x].turn === 0) {
					players[x][prop] = true;
					game.status=exports.Game.STATUS7.replace('{x}',players[x].id).replace('{y}',prop.split('can')[1]);
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
					game.status=exports.Game.STATUS8.replace('{x}',players[x].id);
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
				game.hand.push({
					'user': player.id,
					'card': player.cards[x]
				});				
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

				if (game.hand[x].card.getSuit() === winner.card.getSuit()) {
					if (game.hand[x].card.getValue() > winner.card.getValue()) {
						winner = game.hand[x];
						winnerPos = x;
					}
				} else {
					if (game.hand[x].card.getSuit() === 'S') {
						winner = game.hand[x];
						winnerPos = x;
					}
				}
				x++;
			}

			// temporary solution for first hand where position equals turn
			if(game.tricks==1) {			
				winnerPos = (winnerPos == 3 ? 0 : winnerPos + 1);			
			}
			
			for (var x in players) {
				if (players[x].turn === winnerPos) {
					players[x].wonTricks = players[x].wonTricks + 1;					
					game.status=exports.Game.STATUS9.replace('{x}',players[x].id);
					break;
				}
				
			}
			
    		// update turns of players;
    		for(var x in game.turn){    		
    			if(winnerPos===game.turn[x]){
    				game.turn.unshift.apply(game.turn, game.turn.splice(x, game.turn.length)); 
    				break;
    			}
    		} 		
    		    		
    		for(var x in players){
    			for(var y in game.turn){    				
    				if(players[x].turn===game.turn[y]){
    					players[x].turn=parseInt(y);
    					break;
    				}
    			}
    		}

    		//update next player permission to play tricks
			for (var x in players) {				
				// winner of the previous trick will lead
				if (players[x].turn === 0) {										
					players[x].canTrick = true					
				} else {					
					players[x].canTrick = false;					
				}
				
			}  						
			// if last trick
			if (game.tricks === 13) {			

				// sum won tricks & assign to actual score
				for (var x in players) {
					if(players[x].position === 0){
						game.actualScore[3] = players[x].wonTricks;	
					} else {
						game.actualScore[players[x].position -1]=players[x].wonTricks;
					}					
				}						
				
			}
		}

	},
	startNextHand: function(gameId){
		var game = exports.gameManager.getGame(gameId);

		// reset game.hand
		game.hand = [];

		var players=game.player;
		for (var x in players) {
			if (players[x].turn === 0) {									
				game.status=exports.Game.STATUS10.replace('{x}',players[x].id);					
				break;
			}
		}		
	},
	startNextRound: function(gameId){
		var game = exports.gameManager.getGame(gameId);
		var players=game.player;

		// increase round count;
		game.round = game.round + 1;


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
				game.status=exports.Game.STATUS11.replace('{x}',players[x].id);	
				
			} else {
				players[x].canShuffle = false;
				players[x].canDeal = false;
			}
			players[x].canTrick=false;
		}					
	},
	requestRedeal:function(gameId,player){
		var game = exports.gameManager.getGame(gameId);
		var players=game.player;
		game.shownCard={
			cards:player.cards,
			player:player.id
		};

		for (var x in players) {
			if (players[x].turn === 0) {					
				players[x].canShuffle = true;
				players[x].canDeal = true;
				game.status=exports.Game.STATUS5.replace('{x}',players[x].id);					
				break;
			}
		}
	},

};

 
 
