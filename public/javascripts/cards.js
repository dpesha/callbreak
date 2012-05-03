var ws_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\/.*)/, 'ws$2');

var User = new function(){
    this.userid='';
    this.getUserid=function(){
        return this.userid;
    }
    this.setUserid=function(userid){
        this.userid=userid;
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

var Deck = new function(){  
    
    this.shuffle=function(){
        
        this.cards=[];
        // get the cards on deck
        this.cardElements=$('ul.hand > li');
        this.cardElements.show();
        
        for (var i = 0; i < this.cardElements.size(); i++) {
            this.cards.push(this.cardElements.eq(i).children('a').prop('class'));
        } 
        
        // shuffle the cards logically;
        var tmp, current, top = this.cards.length;
           
        if(top) while(--top) {
            current = Math.floor(Math.random() * (top + 1));
            tmp = this.cards[current];
            this.cards[current] = this.cards[top];
            this.cards[top] = tmp;
        }
        
        // shuffle the cards on UI
        for(var i = 0; i < this.cardElements.size(); i++){
            
           var cardElement=this.cardElements.eq(i).children('a');
           cardElement.removeClass();
           cardElement.addClass(this.cards[i]);
           var cardCSS=this.cards[i].split(' ');
           cardElement.children('span.rank').html(cardCSS[1].split('-')[1].toUpperCase());
           cardElement.children('span.suit').html('&'+cardCSS[2]+';');
           
        }
        
        // clear the board
        var cardOnBoard=$('div.[class^="player"]').children('div');
        cardOnBoard.removeClass();
        cardOnBoard.addClass('card');
        cardOnBoard.children('span.rank').html('');
        cardOnBoard.children('span.suit').html('');
        
    }
    
    this.turn=function(card){
             
       var player=card.parent().parent().prop('id');
       var cardOnBoard=$('div.'+player).children('div');
       cardOnBoard.removeClass();
       cardOnBoard.addClass(card.prop('class'));
       var cardCSS=card.prop('class').split(' ');
       cardOnBoard.children('span.rank').html(cardCSS[1].split('-')[1].toUpperCase());
       cardOnBoard.children('span.suit').html('&'+cardCSS[2]+';');
        
       // hide the card
       card.parent().hide();
       
       
    }
    
};

/*socket.io implementaiton*/
var Server={       
    connect:function(){ 
    var socket = io.connect(ws_host);
    socket.on('connect', function () {
        var name;
        socket.emit('newuser', name=prompt("What's your name?"));
        User.setUserid(name);
    socket.on('message', function (message) {
        var parsed=Message.parseMessage(message);
        switch(parsed.type){            
            case 'chat':
                $('#messages').prepend(parsed.message);
                $('#messages').prepend("<hr>");
                break;
            case 'newuser':
                usersList.push(parsed.message);
                for (var i = 0; i < usersList.length; i++) {
                    $('#pointtable > table > tbody> tr > th').eq(i).text(parsed.message);
                }                
                break;
            case 'leaveuser':
                alert("leave");
                for (var i = 0; i < usersList.length; i++) {
                    if(usersList[i]==parsed.message){
                        usersList.splice(i,1);
                    }
                }                
                break;
        }        
    });
    });
    return socket;
    }};

/*
var Server={       
    connect:function(){     
    var wsc = new WebSocket(ws_host);    
        wsc.onopen= function() {
            wsc.send(Message.createMessage('chat','new player has joined!'));
        };

        wsc.onmessage= function(message) {
            var parsed=Message.parseMessage(message.data);
            if(parsed.type=='chat'){
                $('#messages').prepend(parsed.message);
                $('#messages').prepend("<hr>");                
            }            
        };
        
        wsc.onclose= function() {                    
        };
        return wsc;
    },
    disconnect:function(wsc){
        wsc.close();
    }
   
};
*/

$(document).ready(function() {
    
    var server=Server.connect();
    Deck.shuffle();
    // bind the shuffle click
    $('#shuffle').bind('click',function(){
       Deck.shuffle();        
    });
    
    $('a.card').bind('click',function(){
        Deck.turn($(this));        
    });
    
    $('#messageText').keypress(function(event) {
       if ( event.which == 13 ) {
        var message = $('#messageText').val();                    
        server.send(Message.createMessage('chat',User.getUserid() + ':' + message));
        $('#messageText').val('');    
       }                    
    });
});