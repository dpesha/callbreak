exports.card = function(rank, suit) {

	this.rank = rank;
	this.suit = suit;

	var rank, suit, value;
	var rankc, suitc;

	switch (this.rank) {
	case "A":
		rank = "Ace";
		rankc = "a";
		value = 14;
		break;
	case "2":
		rank = "Two";
		rankc = "2";
		value = 2;
		break;
	case "3":
		rank = "Three";
		rankc = "3";
		value = 3;
		break;
	case "4":
		rank = "Four";
		rankc = "4";
		value = 4;
		break;
	case "5":
		rank = "Five";
		rankc = "5";
		value = 5;
		break;
	case "6":
		rank = "Six";
		rankc = "6";
		value = 6;
		break;
	case "7":
		rank = "Seven";
		rankc = "7";
		value = 7;
		break;
	case "8":
		rank = "Eight";
		rankc = "8";
		value = 8;
		break;
	case "9":
		rank = "Nine";
		rankc = "9";
		value = 9;
		break;
	case "10":
		rank = "Ten";
		rankc = "10";
		value = 10;
		break;
	case "J":
		rank = "Jack";
		rankc = "j";
		value = 11;
		break;
	case "Q":
		rank = "Queen";
		rankc = "q";
		value = 12;
		break;
	case "K":
		rank = "King";
		rankc = "k";
		value = 13;
		break;
	default:
		rank = null;
		rankc = null;
		value = 0;
		break;
	}

	switch (this.suit) {		
	case "C":
		suit = "Clubs";
		suitc = "clubs";		
		break;
	case "D":
		suit = "Diamonds"
		suitc = "diams";
		break;
	case "H":
		suit = "Hearts"
		suits = "hearts";
		break;
	case "S":
		suit = "Spades"
		suitc = "spades";
		break;
	default:
		suit = null;
		suitc = null;
		break;
	}

	this.toString = function() {
		if (rank == null || suit == null) return "";

		return rank + " of " + suit;
	}

	this.toCSSString = function() {
		if (rankc == null || suitc == null) return "";

		return 'rank-' + rankc + ' ' + suitc;
	}


	this.getRank = function() {
		return this.rank;
	};

	this.getSuit=function(){
		return this.suit;
	}

	this.getValue = function() {
		return value;
	}

}

exports.deck = function() {

	var ranks = new Array("A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K");
	var suits = new Array("C", "D", "H", "S");

	var m = ranks.length * suits.length;
	this.cards = null;

	

	this.init = function(n) {
		
			this.sets = n;
			this.cards = new Array(n * m);

			for (i = 0; i < n; i++)
			for (j = 0; j < suits.length; j++)
			for (k = 0; k < ranks.length; k++)
			this.cards[i * m + j * ranks.length + k] = new exports.card(ranks[k], suits[j]);
		
	};


	this.shuffle = function() {
		
			var tmp, current, top = this.cards.length;

			if (top) while (--top) {
				current = Math.floor(Math.random() * (top + 1));
				tmp = this.cards[current];
				this.cards[current] = this.cards[top];
				this.cards[top] = tmp;
			}
		

	};

	this.deal = function(n) {
		
			var dealtCards = [];
			var dealRound = this.cards.length / n;

			for (var i = 0; i < n; i++)
			for (var j = 0; j < dealRound; j++)
			dealtCards.push(this.cards[i + (j * dealRound)]);

			return dealtCards;
		
	};

	this.drawRandomCard =function(){
	
			var a=Math.floor(Math.random() * (this.cards.length + 1));		
			var rtn=this.cards[a];			
			this.cards.splice(a,1);		
			return rtn;
	

	}
}