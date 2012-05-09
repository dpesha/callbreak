/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes'); 
 // ,WebSocketServer=require('ws').Server;

 var app = module.exports = express.createServer();
  // session setup
  var store=new express.session.MemoryStore;
  app.use(express.cookieParser());
  app.use(express.session({ key:"express.sid",secret: "keyboard cat", store: store })); 

// express Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));  
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/:message', routes.index);
app.get('/play/:id', routes.play);
app.get('/error', routes.error);

var port = process.env['app_port'] || 3000;
var sessions =[];

/* implementing websocket with socket.io*/
var io = require('socket.io').listen(app);
io.set('log level' ,1);

/***** extract session information *****/
var parseCookie = require('connect').utils.parseCookie;
io.set('authorization', function (data, accept) {
    if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['express.sid'];
        // (literally) get the session data from the session store
        store.get(data.sessionID, function (err, session) {
            if (err || !session) {
                // if we cannot grab a session, turn down the connection
                accept('Error', false);
            } else {
                // save the session data and accept the connection
                data.session = session;
                
              /*** check player quota at WebSocket session level(max 4 players on one session)**/
              // when quota is reached, reject requested handshake
              if(SessionManager.getSessionCount(data.session.sessionid)==4){
                accept('Player Quota Reached!', false);
              }
              
              accept(null, true);                
            }
        });
    } else {
       accept('No cookie transmitted.', false);
    }
});

io.sockets.on('connection', function (socket) {
  var sessionId=socket.handshake.session.sessionid;
  console.log("New Session Established:" + sessionId);        

  var session ={
    userid:'',    
    sessionid:sessionId,
    ws:socket
  } 
  
  socket.on('newuser',function(userid){
    session.userid=userid;
    sessions.push(session);    
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',userid + ' just joined in.'));
    SessionManager.sendMessage(sessionId,Message.createMessage('userupdate',SessionManager.getUsersList(sessionId)));
  });  
  
  socket.on('newgame',function(message){    
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',message));    
    SessionManager.sendMessage(sessionId,Message.createMessage('newgame',message));
  });
  
  socket.on('shuffle',function(message){
    Cards.shuffle();
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',message));    
    SessionManager.sendMessage(sessionId,Message.createMessage('cardshuffle',message));
  });
  
  socket.on('distribute',function(message){
   
   SessionManager.sendMessage(sessionId,Message.createMessage('chat',message));
   var sessionsList=SessionManager.getSessions(sessionId);   
   for(var i=0;i<sessionsList.length;i++){
           sessionsList[i].ws.send(Message.createMessage('carddistribute',Cards.distribute()[i]));
        
   }
 });

  socket.on('myturn',function(message){

    SessionManager.sendMessage(sessionId,Message.createMessage('chat',message.user + ' threw a card.'));
    SessionManager.sendMessage(sessionId,Message.createMessage('myturn',message));      
    
  });

  socket.on('pointtableupdate',function(message){

    SessionManager.sendMessage(sessionId,Message.createMessage('chat',message.user + ' updaed points'));
    SessionManager.sendMessage(sessionId,Message.createMessage('pointtableupdate',message));      
    
  });

  socket.on('cleartable',function(message){

    SessionManager.sendMessage(sessionId,Message.createMessage('chat',message));
    SessionManager.sendMessage(sessionId,Message.createMessage('cleartable',message));      
    
  });
  
  socket.on('message', function (message) {
    console.log('received: %s', message);
    SessionManager.sendMessage(sessionId,message);    	
  });  
  
  socket.on('disconnect', function () {
    console.log("Session Disconnected:" + sessionId + ',User:' + session.userid);
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].ws==socket){
              sessions.splice(i,1);              
      }      
    }
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',session.userid + ' left the room.'));
    SessionManager.sendMessage(sessionId,Message.createMessage('userupdate',SessionManager.getUsersList(sessionId)));
  });
});

app.listen(port, function(){  
  
/*  var wss = new WebSocketServer({server:app,path:'/socket'});
	wss.on('connection', function(ws) {                
                sessions.push(ws);                
		ws.on('message', function(message) {
			console.log('received: %s', message);
			for (var i = 0; i < sessions.length; i++) {			
				sessions[i].send(message);
			}
		});
		ws.on('close',function(){
			console.log("session has been disconnected!");
			for (var i = 0; i < sessions.length; i++) {
				if(sessions[i]==ws){
					sessions.splice(i,1);
				}
			}
		});
		
	});*/  
  console.log("Server listening on port %d in %s mode", app.address().port, app.settings.env);
  Cards.init();
  
});

/*** Session Manager ***/
var SessionManager=new function(){
  
  
  this.sendMessage=function(sessionId,message){    
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].sessionid==sessionId){
           sessions[i].ws.send(message);
      }
    }	
  } 
  
  this.getSessionCount=function(sessionId){
    var count=0;
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].sessionid==sessionId){
           count++; 
        }
    }
    return count;
  }
  
  this.getSessions=function(sessionId){
    var sessionList=[];
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].sessionid==sessionId){
           sessionList.push(sessions[i]); 
        }
    }
    return sessionList;
  }
  
  this.getUsersList=function(sessionId){
    var usersList=['Player1','Player2','Player3','Player4'];
    var match=0;
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].sessionid==sessionId){
        usersList[match]=sessions[i].userid;
        match++;
      }
    }  
        
    return usersList;
  }

  this.getCurrentSessions=function(){
    var sessionsList=[];
    for (var i = 0; i < sessions.length; i++) {      
       sessionsList.push(sessions[i].sessionid);              
    }  
        
    return sessionsList;
  }
}

var Cards = new function(){
  
  this.cards=[];
  this.init=function(){
    // initalize cards
    this.cards.push('rank-a diams');
    this.cards.push('rank-2 diams');
    this.cards.push('rank-3 diams');
    this.cards.push('rank-4 diams');
    this.cards.push('rank-5 diams');
    this.cards.push('rank-6 diams');
    this.cards.push('rank-7 diams');
    this.cards.push('rank-8 diams');
    this.cards.push('rank-9 diams');
    this.cards.push('rank-10 diams');
    this.cards.push('rank-j diams');
    this.cards.push('rank-q diams');
    this.cards.push('rank-k diams');
    this.cards.push('rank-a spades');
    this.cards.push('rank-2 spades');
    this.cards.push('rank-3 spades');
    this.cards.push('rank-4 spades');
    this.cards.push('rank-5 spades');
    this.cards.push('rank-6 spades');
    this.cards.push('rank-7 spades');
    this.cards.push('rank-8 spades');
    this.cards.push('rank-9 spades');
    this.cards.push('rank-10 spades');
    this.cards.push('rank-j spades');
    this.cards.push('rank-q spades');
    this.cards.push('rank-k spades');
    this.cards.push('rank-a clubs');
    this.cards.push('rank-2 clubs');
    this.cards.push('rank-3 clubs');
    this.cards.push('rank-4 clubs');
    this.cards.push('rank-5 clubs');
    this.cards.push('rank-6 clubs');
    this.cards.push('rank-7 clubs');
    this.cards.push('rank-8 clubs');
    this.cards.push('rank-9 clubs');
    this.cards.push('rank-10 clubs');
    this.cards.push('rank-j clubs');
    this.cards.push('rank-q clubs');
    this.cards.push('rank-k clubs');
    this.cards.push('rank-a hearts');
    this.cards.push('rank-2 hearts');
    this.cards.push('rank-3 hearts');
    this.cards.push('rank-4 hearts');
    this.cards.push('rank-5 hearts');
    this.cards.push('rank-6 hearts');
    this.cards.push('rank-7 hearts');
    this.cards.push('rank-8 hearts');
    this.cards.push('rank-9 hearts');
    this.cards.push('rank-10 hearts');
    this.cards.push('rank-j hearts');
    this.cards.push('rank-q hearts');
    this.cards.push('rank-k hearts');
    // shuffle cards
    this.shuffle();   
  }
  
  
  // shuffle the cards logically;
  this.shuffle=function(){
    
    var tmp, current, top = this.cards.length;
       
    if(top) while(--top) {
        current = Math.floor(Math.random() * (top + 1));
        tmp = this.cards[current];
        this.cards[current] = this.cards[top];
        this.cards[top] = tmp;
    }
    //return this.cards;
  }
  
  // distribute the cards logically;
  this.distribute=function(){
    var player1 =[];
    var player2 =[];
    var player3 =[];
    var player4 =[];    
    var distributedCards=[];
    
    for(var i=0;i<52;i=i+4){
      player1.push(this.cards[i]);
      player2.push(this.cards[i+1]);
      player3.push(this.cards[i+2]);
      player4.push(this.cards[i+3]);
    }    
    distributedCards.push(player1);
    distributedCards.push(player2);
    distributedCards.push(player3);
    distributedCards.push(player4);
    return distributedCards;
  }
}

var Message= {
    createMessage:function(type,message){
        var msg={          
          type: type,
          message:message
        };
        return JSON.stringify(msg);
    },
    parseMessage:function(message){
        return JSON.parse(message);
    }
};