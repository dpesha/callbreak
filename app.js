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
app.get('/play/:id', routes.play);
app.get('/error', routes.error);

var port = process.env.PORT || 3000;
var sessions =[];
var usersList=[];

/* implementing websocket with socket.io*/
var io = require('socket.io').listen(app);

/***** capture session information *****/
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
                
              /*** check player quota (max 4 players on one session)**/
              // TODO: Redirect to other page when player quota is over
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
  console.log("New Session");
  console.log("Session Identifier: " + sessionId);
    
  var user ={
    userid:'',    
    sessionid:sessionId,
    ws:socket
  } 
  
  socket.on('newuser',function(username){
    user.userid=username;
    sessions.push(user);    
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',user.userid + ' just joined in.'));
    SessionManager.sendMessage(sessionId,Message.createMessage('newuser',user.userid));
  }); 
    
  socket.on('message', function (message) {
    console.log('received: %s', message);
    SessionManager.sendMessage(sessionId,message);    	
  });  
  
  socket.on('disconnect', function () {
    console.log("session has been disconnected!");
    for (var i = 0; i < sessions.length; i++) {
      if(sessions[i].ws==socket){
              sessions.splice(i,1);
      }
    }
    SessionManager.sendMessage(sessionId,Message.createMessage('chat',user.userid + ' left the room'));
    SessionManager.sendMessage(sessionId,Message.createMessage('userleave',user.userid));
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

  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
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