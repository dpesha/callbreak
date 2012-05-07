var ws_host = window.location.href.replace(/(http|https)(:\/\/[^\/]*)(\:.*)(\/.*)/, '$1$2:80');

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


/*socket.io implementaiton*/
var Server={       
    connect:function(){      
    var socket = new io.Socket('callbreak.nodester.com', {port: 80, rememberTransport: false}); 
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
                        $('#player'+(i+1)+' > .name').text(usersList[i]);
                    }
                }
                break;
            case 'newgame':
                $('#shuffle').show();
                $('#distribute').hide();
                $('#board').html(Board.reloadOriginal());
                $('td').html(0);
                break;
            case 'cardshuffle':
                $('#distribute').show(); 
                break;
            case 'carddistribute':
                for(var i=0;i<13;i++){
                    var cardCss=parsed.message[i].split(' ');
                    var rank=cardCss[0].split('-')[1].toUpperCase()
                    var suit='&'+cardCss[1]+';'
                    $('#player4 > ul.hand,#player3 > ul.hand,#player2 > ul.hand ').append('<li><div class="card back">*</div></li>');
                    $('#player1 > ul.hand').append('<li><a class="card '+parsed.message[i]+'" href="#"><span class="rank">'+rank+'</span><span class="suit">'+suit+'</span></a></li>');
                }

                // bind card click funtcion
                $('a.card').bind('click',function(){                  
                   var message={
                       user:User.getUserid(),                       
                       card:$(this).prop('class')
                   };
                   socket.emit('myturn',message);
                });


                $('#player2,#player4').css('padding-top','12%');
                $('#mid > #round > #roundtable').remove();
                $('#mid > #round').append('<div id="roundtable"><div class="player3"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
                                       <div><div class="player4"><div class="card"><span class="rank"></span><span class="suit"></span></div></div>\
                                       <div class="player2"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>\
                                       <div class="player1"><div class="card"><span class="rank"></span><span class="suit"></span></div></div></div>');
                
                // bind card click funtcion
                $('#roundtable').bind('click',function(){                  
                   socket.emit('cleartable',User.getUserid()+' cleared table.');
                });

                $('#shuffle').hide();     
                $('#distribute').hide();
                break;

            case 'myturn':

               var user=parsed.message['user'];
               var card=parsed.message['card'];
               var player=$('.name:contains('+user+')').parent().prop('id');               
               var cardOnTable=$('div.'+player).children('div');
               cardOnTable.removeClass();
               cardOnTable.addClass(card);
               var cardCss=card.split(' ');
               cardOnTable.children('span.rank').html(cardCss[1].split('-')[1].toUpperCase());
               cardOnTable.children('span.suit').html('&'+cardCss[2]+';');
                
               // hide selected card
               $('.name:contains('+user+')').parent().children('ul').children('li').children('a.'+card.replace(/ /g,'.')).hide(); 
               $('.name:contains('+user+')').parent().children('ul').children('li').eq(0).children('div').remove();
               break;

           case 'cleartable':
               var target=$('div[class^="player"]').children('div');
               target.removeClass();
               target.addClass('card');
               target.children('span.rank').html('');
               target.children('span.suit').html('');
               break;

           case 'pointtableupdate':
               var col=parsed.message['col'];
               var row=parsed.message['row'];
               var data=parsed.message['data'];
               $('#pointtable  table  tbody  tr:nth-child('+(row+1)+')  td:nth-child('+(col+1)+')').html(data);

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

var Board= new function(){
  this.template='';  
  this.storeOriginal=function(){
    this.template=$('#board').html();
  },
  this.reloadOriginal=function(){
    return this.template;
  }
}


$(document).ready(function() {
    
    /* Rotate Array */
    Array.prototype.rotate = function( n ) {
      this.unshift.apply( this, this.splice( n, this.length ) )
      return this;
    }


    
    var server=Server.connect();  
    Board.storeOriginal();
    
    
    $('#distribute').hide();

    // new game
    $('#newgame').bind('click',function(){
        server.emit('newgame',User.getUserid() + ' stared a new game.');        
    });

    // shuffle cards
    $('#shuffle').bind('click',function(){
       server.emit('shuffle',User.getUserid() + ' shuffled cards.');
    });

    // distribute cards    
    $('#distribute').bind('click',function(){
       server.emit('distribute', User.getUserid() + ' distributed cards.');      
    });
      
    
    $('#messageText').keypress(function(event) {
       if ( event.which == 13 ) {
        var message = $('#messageText').val();                    
        server.send(Message.createMessage('chat',User.getUserid() + ':' + message));
        $('#messageText').val('');    
       }                    
    });

    $('td').attr('contenteditable','true');
    $('td').keydown(function(event){

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
        var message={
            user:User.getUserid(),
            col:$(this).parent().children().index($(this)),
            row:$(this).parent().parent().children().index($(this).parent()),
            data:$(this).html()
        };        
        server.emit('pointtableupdate',message);
        

        el.blur();
        event.preventDefault();
      }
    }
  });
   
});
