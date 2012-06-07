var express = require('express'),
  routes = require('./routes');
var Cb=require('./callbreak');
var Card=require('./card');

var app = module.exports = express.createServer();
// session setup
var store = new express.session.MemoryStore;
app.use(express.cookieParser());
app.use(express.session({
  key: "express.sid",
  secret: "keyboard cat",
  store: store
}));

// express Configuration
app.configure(function() {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade'); 
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function() {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
});

app.configure('production', function() {
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/:message', routes.index);
app.get('/play/:id', routes.play);
app.get('/error', routes.error);

var port = process.env['app_port'] || 3000;
var sessions = [];

/* implementing websocket with socket.io*/
var io = require('socket.io').listen(app);
io.set('log level', 1);

/***** extract session information *****/
var parseCookie = require('connect').utils.parseCookie;
io.set('authorization', function(data, accept) {
  if (data.headers.cookie) {
    data.cookie = parseCookie(data.headers.cookie);
    data.sessionID = data.cookie['express.sid'];
    // (literally) get the session data from the session store
    store.get(data.sessionID, function(err, session) {
      if (err || !session) {
        // if we cannot grab a session, turn down the connection
        accept('Error', false);
      } else {
        // save the session data and accept the connection
        data.session = session;

        /*** check player quota at WebSocket session level(max 4 players on one session)**/
        // when quota is reached, reject requested handshake
        if (SessionManager.getSessionCount(data.session.sessionid) == 4) {
          accept('Player Quota Reached!', false);
        }

        accept(null, true);
      }
    });
  } else {
    accept('No cookie transmitted.', false);
  }
});

io.sockets.on('connection', function(socket) {
  var sessionId = socket.handshake.session.sessionid;
  var player=null;
  console.log("New Session Established:" + sessionId);

   var session = {
     userid: '',
     sessionid: sessionId,
     ws: socket
   }

  socket.on('newuser', function(userid) {
    player = new Cb.Player(userid);    
    if(player.joinGame(sessionId)){
      session.userid = userid;
      sessions.push(session);
      SessionManager.sendMessage(sessionId, Message.createMessage('chat', userid + ' just joined in.'));
      SessionManager.sendMessage(sessionId, Message.createMessage('userupdate', SessionManager.getGame(sessionId)));
    } else {      
      socket.send(Message.createMessage('error', userid + 'could not join'));
    }    
  });

  socket.on('newgame', function(message) {
    player.startNewGame();
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message));
    SessionManager.sendMessage(sessionId, Message.createMessage('newgame', SessionManager.getGame(sessionId)));
  });

  socket.on('drawcard', function(index,message) {
    var card = player.drawRandomCard(index);
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message+card));
    SessionManager.sendMessage(sessionId, Message.createMessage('drawcard', SessionManager.getGame(sessionId)));
  });

  socket.on('reposition', function() {    
    player.rePosition();    
    SessionManager.sendMessage(sessionId, Message.createMessage('reposition', SessionManager.getGame(sessionId)));
  });

  socket.on('shuffle', function(message) {
    player.shuffle();
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message));    
  });

  socket.on('deal', function(message) {
    player.deal();
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message));
    SessionManager.sendMessage(sessionId, Message.createMessage('deal', SessionManager.getGame(sessionId)));    
  });

  socket.on('bidtrick', function(data,message) {
    player.bidTricks(data);
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message + data));
    SessionManager.sendMessage(sessionId, Message.createMessage('bidtrick', SessionManager.getGame(sessionId)));
  }); 

  socket.on('playtrick', function(data, message) {
    var cardCss = data.split(' ');   
    var rank = cardCss[1].split('-')[1].toUpperCase()
    var suit = cardCss[2].charAt(0).toUpperCase();    
    player.playTrick(rank,suit);
    var card=new Card.card(rank, suit).toString();
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message + card));
    SessionManager.sendMessage(sessionId, Message.createMessage('playtrick', SessionManager.getGame(sessionId)));

  });

  socket.on('nexthand', function() {
    player.startNextHand();    
    SessionManager.sendMessage(sessionId, Message.createMessage('nexthand', SessionManager.getGame(sessionId)));
  });

  socket.on('nextround', function() {
    player.startNextRound();    
    SessionManager.sendMessage(sessionId, Message.createMessage('nextround', SessionManager.getGame(sessionId)));
  });

  socket.on('redeal', function(message) {
    player.requestRedeal();
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', message));       
    SessionManager.sendMessage(sessionId, Message.createMessage('redeal', SessionManager.getGame(sessionId)));
  });       

  socket.on('message', function(message) {
    console.log('received: %s', message);
    SessionManager.sendMessage(sessionId, message);
  });

  socket.on('disconnect', function() {
    console.log("Session Disconnected:" + sessionId + ',User:' + session.userid);
    player.leaveGame();
    for (var i = 0; i < sessions.length; i++) {
      if (sessions[i].ws == socket) {
        sessions.splice(i, 1);
      }
    }
    SessionManager.sendMessage(sessionId, Message.createMessage('chat', session.userid + ' left the room.'));
    SessionManager.sendMessage(sessionId, Message.createMessage('userupdate', SessionManager.getGame(sessionId)));
  });
});

app.listen(port, function() {
  console.log("Server listening on port %d in %s mode", app.address().port, app.settings.env);
});

/*** Session Manager ***/
var SessionManager = new function() {


    this.sendMessage = function(sessionId, message) {
      for(var i=0;i<sessions.length;i++){
        if(sessions[i].sessionid=sessionId){
          sessions[i].ws.send(message);
        }
      }
     
    }

    this.getSessionCount = function(sessionId) {
      var count = 0;
      for (var i = 0; i < sessions.length; i++) {
        if (sessions[i].sessionid == sessionId) {
          count++;
        }
      }
      return count;
    }   

    this.getGame = function(sessionId) {            
      for (var i = 0; i < Cb.games.length; i++) {
        if (Cb.games[i].gameId == sessionId) {            
            return Cb.games[i];
          }          
      }
    }
  }

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
  }
};