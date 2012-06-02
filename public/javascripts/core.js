var ws_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\/.*)/, 'ws$2');
var http_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\/.*)/, 'http$2');

/**************************
 * Model
 **************************/
var GameModel = function() {
		this.player = null;
		this.rPlayers = null;
		this.uPlayers = null;
		this.pPlayers = null;
		this.state = 0;
		this.round=0;
		this.playerCount=0;
		this.socket=null;			
		this.playerJoined = new Event(this);
		this.playerCouldnotJoin = new Event(this);
		this.chatMessageReceived=new Event(this);
		this.newGameStarted=new Event(this);
		this.cardDrawn=new Event(this);		
		this.positionDecided=new Event(this);
		this.cardsDealt=new Event(this);
		this.bidPointUpdated=new Event(this);
		this.bidComplete=new Event(this);
	}

GameModel.prototype = {
	getPlayer:function(){
		return this.player;
	},
	getRotatedPlayersList: function() {
		return this.rPlayers;
	},
	getUnrotatedPlayersList: function() {
		return this.uPlayers;
	},
	getPositionedPlayersList: function() {
		return this.pPlayers;
	},
	getRound:function(){
		return this.round;
	},
	getPermission:function(permission){		
		switch(permission){
			case 'start':
				return this.player.canStart;
			break;
			case 'shuffle':
				return this.player.canShuffle;
			break;
			case 'deal':
				return this.player.canDeal;
			break;
			case 'draw':
				return this.player.canDraw;
			break;
		}
	},
	getStatusMessage:function(){		
		switch(this.state){
			case 0:
				return 'Waiting for other ' + (4 - this.playerCount) + ' player to join.';
			break;
			case 1:
				return 'Player Quota reached, Start a Game by clicking start button.';
			break;
			case 2:
				return 'Waiting for players to draw card';
			break;
			case 3:
				return 'Player ' + this.uPlayers[0] + ' has strongest card. Waiting for Player ' + this.uPlayers[0] + ' to shuffle /deal card.';
			break;
			case 4:
				return 'Waiting for players to bid';
			break;
			case 5:
				return 'Waiting for players to play trick';
			break;					
		}
	},	
	sendMessage:function(message){
		this.socket.send(Message.createMessage('chat', User.getUserid() + ':' + message));
	},
	startGame:function(){
		this.socket.emit('newgame', User.getUserid() + ' started a new game.');
	},
	drawCard:function(index){
		this.socket.emit('drawcard', index, User.getUserid() + ' drew card: ');
	},
	shuffleCard:function(){
		this.socket.emit('shuffle', User.getUserid() + ' shuffled cards.');
	},
	dealCard:function(){
		this.socket.emit('deal', User.getUserid() + ' dealt cards.');
	},
	updateBid:function(data){
		this.socket.emit('bidtricks', data, User.getUserid() + ' bid: ');
	},
	joinPlayer: function(userid) {
		var _this = this;
		_this.socket = io.connect(ws_host, {
			reconnect: false
		});
		// in case of socket.io error redirect to top page
		_this.socket.on('error', function(reason) {
			console.error('Unable to connect Socket.IO', reason);
			window.location = http_host + '/quotaover';
		});
		_this.socket.on('connect', function() {
			_this.socket.emit('newuser', userid);
			User.setUserid(userid);
			_this.socket.on('message', function(message) {
				var parsed = Message.parseMessage(message);
				
				_this.state=parsed.message.state;
				// Assign Current Player
				if(parsed.message.player!=undefined){
					for (var i = 0; i < parsed.message.player.length; i++) {
						if (parsed.message.player[i].id == User.getUserid()) {
							_this.player=parsed.message.player[i];					
							break;
						}
					}
				}

				switch (parsed.type) {

				case 'userupdate':					
					_this.rPlayers = ['Player1', 'Player2', 'Player3', 'Player4'];
					_this.uPlayers = ['Player1', 'Player2', 'Player3', 'Player4'];
					_this.playerCount=parsed.message.player.length;

					for (var i = 0; i < parsed.message.player.length; i++) {
						_this.rPlayers[i] = parsed.message.player[i].id;
						_this.uPlayers[i] = parsed.message.player[i].id;						
					}

					/* Rotate Players List */
					for (var i = 0; i < parsed.message.player.length; i++) {
						if (parsed.message.player[i].id == User.getUserid()) {							
							_this.rPlayers.rotate(i);
							break;
						}
					}
					_this.playerJoined.notify(this);
					break;
				case 'chat':
					_this.chatMessageReceived.notify(parsed.message);
					break;
				case 'error':
					_this.playerCouldnotJoin.notify("Opps! player already exists;");
					break;
				case 'newgame':
					_this.newGameStarted.notify(this);
					break;
				case 'drawcard':
					_this.cardDrawn.notify(parsed.message.draw);
					if(parsed.message.draw.length==4){

						// re-position players 
						_this.pPlayers=new Array(4);
						for (var x in parsed.message.player){
							_this.pPlayers[parsed.message.player[x].position] = parsed.message.player[x].id;
							_this.uPlayers[parsed.message.player[x].position] = parsed.message.player[x].id;;
						}

						/* rotate players List */
						for (var i = 0; i < _this.pPlayers.length; i++) {
							if (_this.pPlayers[i] == User.getUserid()) {							
								_this.pPlayers.rotate(i);
								break;
							}
						}
						_this.positionDecided.notify(this);
					}
					break;	
				case 'deal':
					_this.round=parsed.message.round;
					_this.cardsDealt.notify(this);
					break;
				case 'bidtricks':					
					_this.bidPointUpdated.notify(parsed.message.bids);
					if(parsed.message.bids.length==4){
						
					}
					break;		
				}
			});
		});		
	}
};

/**************************
 * Event
 **************************/
var Event = function(sender) {
		this.sender = sender;
		this.listeners = [];
	};

Event.prototype = {
	attach: function(listener) {
		this.listeners.push(listener);
	},
	notify: function(args) {
		for (var x in this.listeners) {
			this.listeners[x](this.sender, args);
		}
	}

};
/**************************
 *  Login View
 **************************/
var LoginView = function(model, controller, elements) {
		this.model = model;
		this.controller = controller;
		this.elements = elements;

		var _this = this;
		this.model.playerJoined.attach(function() {
			_this.rebuild();
		});
		this.model.playerCouldnotJoin.attach(function(sender, args) {
			_this.showError(args);
		});

	};

LoginView.prototype = {
	show: function() {
		var e = this.elements;
		var _this = this;
		e.enterElement.keypress(function(event) {
			if (event.which == 13) {
				_this.controller.joinPlayer($(e.enterElement).val());
			}
		});
	},
	rebuild: function() {
		Popup.hide();
	},
	showError: function(message) {
		$(this.elements.errorLabel).html(message);
	}
};

/**************************
 * Login Controller
 **************************/
var LoginController = function(model) {
	this.model = model;
};

LoginController.prototype = {
	joinPlayer: function(userid) {
		if (userid) {
			this.model.joinPlayer(userid);
		}
	},
};

/**************************
 * Player View
 **************************/
var PlayerView = function(model, controller, elements) {
	this.model = model;
	this.controller = controller;
	this.elements = elements;

	var _this = this;
	this.model.playerJoined.attach(function() {
		_this.rebuild();
	});	
};

PlayerView.prototype = {
	rebuild: function() {
		var e = this.elements;
		// update point table header
		var args=this.model.getUnrotatedPlayersList();
		for (var i = 0; i < args.length; i++) {
			e.tableHeader.eq(i).text(args[i]);
		}

		var args=this.model.getRotatedPlayersList();
		// update player name
		e.player1.text(args[0]);
		e.player2.text(args[1]);
		e.player3.text(args[2]);
		e.player4.text(args[3]);			
	},	
};

/**************************
 * Player Controller
 **************************/
var PlayerController = function(model) {
	this.model = model;
};

PlayerController.prototype = {	
	
};

/**************************
 *  Chat View
 **************************/
var ChatView = function(model, controller, elements) {
	this.model = model;
	this.controller = controller;
	this.elements = elements;

	var _this = this;
	this.model.chatMessageReceived.attach(function(sender,args) {
		_this.appendConversation(args);
	});		

};

ChatView.prototype = {
	show: function() {
		var e = this.elements;
		var _this = this;
		e.messageInput.keypress(function(event) {
			if (event.which == 13) {
				_this.controller.sendMessage(e.messageInput.val());
			}
		});
	},	
	appendConversation: function(message) {
		$(this.elements.messageBox).prepend(message);
        $(this.elements.messageBox).prepend("<hr>");
	},
};

/**************************
 * Chat Controller
 **************************/
var ChatController = function(model) {
	this.model = model;
};

ChatController.prototype = {
	sendMessage: function(message) {
		if (message) {
			this.model.sendMessage(message);
		}
	},

};

/**************************
 *  Game View
 **************************/
var GameView = function(model, controller, elements) {
	this.model = model;
	this.controller = controller;
	this.elements = elements;

	var _this = this;
	this.model.playerJoined.attach(function() {
		_this.updatePermissions();
	});
	this.model.newGameStarted.attach(function() {
		_this.updatePermissions();
	});
	this.model.newGameStarted.attach(function() {
		_this.initCards();
	});
	this.model.cardDrawn.attach(function(sender,args){
		_this.showDrawnCard(args);
	});
	
	this.model.positionDecided.attach(function(){
		_this.updatePermissions();
	});
	this.model.positionDecided.attach(function(){
		_this.repositionPlayers();
	});
	this.model.cardsDealt.attach(function(){
		_this.updatePermissions();
	});
	this.model.cardsDealt.attach(function(){
		_this.distributeCards();
	});
	this.model.bidPointUpdated.attach(function(){
		_this.updatePermissions();
	});		

};

GameView.prototype = {
	init: function() {
		var e = this.elements;
		var _this = this;
		e.startButton.click(function() {
			_this.controller.startGame();			
		});
		e.shuffleButton.click(function() {
			_this.controller.shuffleCard();			
		});
		e.dealButton.click(function() {
			_this.controller.dealCard();			
		});
	},
	updatePermissions: function() {
		var e = this.elements;

		// update button permission
		e.startButton.toggle(this.model.getPermission('start'));
		e.shuffleButton.toggle(this.model.getPermission('shuffle'));
		e.dealButton.toggle(this.model.getPermission('deal'));

		//update Status message
		e.statusMessage.html('# ' + this.model.getStatusMessage());	
	},
	initCards:function(){
		var e=this.elements;
		var _this=this;		
		e.deck.children().click(function(){
			_this.controller.drawCard($(this).index());			
		});
	},
	showDrawnCard:function(args){

		var e=this.elements;			
		
		// disable click 
		if(!this.model.getPermission('draw')){
			e.deck.children().unbind('click');			
		}

		// decrease card count by 1
		e.deck.children().eq(0).remove(); 

		// Show Card
		var arg=args[args.length-1];			
		for(var i=0;i<e.players.length;i++){
			if(arg.player === e.playersId[i].html()){
				e.players[i].children('ul.hand').append('<li ><a class="card ' + arg.card.css + '" href="#" ><span class="rank">' + arg.card.rank + '</span><span class="suit">' + arg.card.suitc + '</span></a></li>');				
				break;
			}
		}
		// padding adjustment TODO:move this manual adjustment to CSS
		e.players[1].css('padding-top', '12%');
        e.players[3].css('padding-top', '12%');         

	},
	repositionPlayers:function(){
		var e = this.elements;
		// update point table header
		var args=this.model.getUnrotatedPlayersList();
		for (var i = 0; i < args.length; i++) {
			e.tableHeader.eq(i).text(args[i]);			
		}

		// update player name
		args=this.model.getPositionedPlayersList();
		for (var i = 0; i < args.length; i++) {			
			e.playersId[i].html(args[i]);
		}

		// remove cards
		for(var i=0;i<e.players.length;i++){
			e.players[i].children('ul.hand').children('li').remove();			
		}		
	},
	distributeCards:function(){
		var e=this.elements;
		var _this=this;

		// clear deck
		e.deck.remove();

		// distribute cards
		var player=this.model.getPlayer();
		for(var i=0; i<player.cards.length;i++){
			for(var j=1;j<4;j++){
				e.players[j].children('ul.hand').append('<li><div class="card back">*</div></li>');
			}
			e.players[0].children('ul.hand').append('<li ><a class="card ' + player.cards[i].css + '" href="#" ><span class="rank">' + player.cards[i].rank + '</span><span class="suit">' + player.cards[i].suitc + '</span></a></li>');
        }
                
	    e.round.append('<div id="roundtable"><div class="player3"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
	    <div><div class="player4"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
	    <div class="player2"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>\
	    <div class="player1"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>'); 
	}
};

/**************************
 * Game Controller
 **************************/
var GameController = function(model) {
	this.model = model;
};

GameController.prototype = {
	startGame:function(){
		this.model.startGame();
	},
	drawCard:function(index){
		this.model.drawCard(index);
	},
	shuffleCard:function(){
		this.model.shuffleCard();
	},
	dealCard:function(){
		this.model.dealCard();
	},	
	playTrick:function(){

	},

};

/**************************
 *  PointTable View
 **************************/
var PointTableView = function(model, controller, elements) {
	this.model = model;
	this.controller = controller;
	this.elements = elements;

	var _this = this;
	this.model.cardsDealt.attach(function(){
		_this.enableBidding();
	});
	this.model.bidPointUpdated.attach(function(sender,args){
		_this.updateBidPoint(args);
	});
	this.model.bidPointUpdated.attach(function(sender,args){
		_this.enableBidding();
	});			

};

PointTableView.prototype = {
	enableBidding:function(){
		var e=this.elements;
		var _this=this;
		
		if(_this.model.getPlayer().canBid){
			var td= e.table.children().eq(this.model.getRound()+1).children().eq(this.model.getPlayer().position);
			td.attr('contenteditable', 'true');
			td.keydown(function(event) {
    			var esc = event.which == 27,
      			nl = event.which == 13,
      			el = event.target,
      			data = {};

			    if (el) {
			      if (esc) {
			        // restore state
			        document.execCommand('undo');
			        el.blur();

			      } else if (nl) {
			        // send changed cell data to server
			        var message = {			          
			          col: $(this).parent().children().index($(this)),
			          row: $(this).parent().parent().children().index($(this).parent()),
			          point: $(this).html()
			        };
			        _this.controller.updateBid(message);

			        el.blur();
			        event.preventDefault();
			        td.removeAttr('contenteditable');
			      }
			    }
			  });
		} 
	},
	updateBidPoint:function(args){		
		var e=this.elements;
		var arg=args[args.length-1];
        e.table.children().eq(this.model.getRound()+1).children().eq(arg.position).html(arg.point);
	},
};

/**************************
 * PointTable Controller
 **************************/
var PointTableController = function(model) {
	this.model = model;
};

PointTableController.prototype = {
	updateBid:function(data){
		this.model.updateBid(data);
	}
};

/**************************
 * Utils
 **************************/
var Message = {
	createMessage: function(type, message) {
		var msg = {
			type: type,
			message: message
		};
		return JSON.stringify(msg);
	},
	parseMessage: function(message) {
		return JSON.parse(message);
	},
};

var User = new function() {
		this.userid = '';
		this.getUserid = function() {
			return this.userid;
		}
		this.setUserid = function(userid) {
			this.userid = userid;
		}
};