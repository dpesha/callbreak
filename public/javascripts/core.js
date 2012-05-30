var ws_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\/.*)/, 'ws$2');
var http_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\/.*)/, 'http$2');

/**************************
 * Model
 **************************/
var GameModel = function() {
		this.player = null;
		this.rPlayers = null;
		this.uPlayers = null;
		this.state = 0;
		this.playerCount=0;
		this.socket=null;
		this.playerJoined = new Event(this);
		this.playerCouldnotJoin = new Event(this);
		this.chatMessageReceived=new Event(this);
		this.newGameStarted=new Event(this);
		this.cardDrawn=new Event(this);		
	}

GameModel.prototype = {
	getRotatedPlayersList: function() {
		return this.rPlayers;
	},
	getUnrotatedPlayersList: function() {
		return this.uPlayers;
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
		}
	},
	getStatusMessage:function(){		
		switch(this.state){
			case 0:
				return "Waiting for other " + (4 - this.playerCount) + " player to join.";
			break;
			case 1:
				return "Player Quota reached, Start a Game by clicking start button.";
			break;
			case 2:
				return "Click once on any card to draw random card.";
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
		this.socket.emit('drawcard', index, User.getUserid() + ' drew a card.');
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
					_this.cardDrawn.notify(this);
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

	},
	dealCard:function(){

	},
	bidPoint:function(){

	},
	playTrick:function(){

	},

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