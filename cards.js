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

$(document).ready(function() {
    
    Deck.shuffle();
    // bind the shuffle click
    $('#shuffle').bind('click',function(){
       Deck.shuffle();        
    });
    
    $('a.card').bind('click',function(){
        Deck.turn($(this));        
    });
});