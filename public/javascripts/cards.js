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
            case 'userupdate':
                var tableHeader=$('#pointtable > table > tbody> tr > th');
                var usersList=parsed.message.slice(0);
                
                /* Rotate table*/
                for(var i=0 ;i<parsed.message.length;i++){
                    if(parsed.message[i]==User.getUserid()){
                        usersList.rotate(i);
                        break;
                    }
                }
                
                for (var j=0; j< tableHeader.size(); j++) {
                    for (var i = 0; i < parsed.message.length; i++) {
                        tableHeader.eq(i).text(parsed.message[i]);
                        $('#player'+(i+1)).text(usersList[i]);
                    }
                }
                break;
            case 'carddistribute':
                for(var i=0;i<13;i++){
                    var cardCss=parsed.message[i].split(' ');
                    var rank=cardCss[0].split('-')[1].toUpperCase()
                    var suit='&'+cardCss[1]+';'
                    $('#right > ul.hand,#top > ul.hand,#left > ul.hand ').append('<li><div class="card back">*</div></li>');
                    $('#bottom > ul.hand').append('<li><a class="card '+parsed.message[i]+'" href="#"><span class="rank">'+rank+'</span><span class="suit">'+suit+'</span></a></li>');
                }
                $('#right,#left').css('padding-top','12%');
                $('#mid > #round > #roundtable').remove();
                $('#mid > #round').append('<div id="roundtable"><div class="player3"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
                                       <div><div class="player4"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
                                       <div class="player2"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>\
                                       <div class="player1"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>');
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
    
    /* Rotate Array */
    Array.prototype.rotate = function( n ) {
      this.unshift.apply( this, this.splice( n, this.length ) )
      return this;
    }
    
    var server=Server.connect();  
    // shuffle cards
    $('#shuffle').bind('click',function(){
       server.emit('shuffle','shuffle the cards');        
    });
    
    // distribute cards
    $('#distribute').bind('click',function(){
       server.emit('distribute','distribute the cards');        
    });
    
    $('a.card').bind('click',function(){
        
    });
    
    $('#messageText').keypress(function(event) {
       if ( event.which == 13 ) {
        var message = $('#messageText').val();                    
        server.send(Message.createMessage('chat',User.getUserid() + ':' + message));
        $('#messageText').val('');    
       }                    
    });
});