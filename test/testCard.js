var xxx=require('../card');

exports.testCard=function(test){
	var card=new xxx.card("A","C");
	test.equal(card.toString(),"Ace of Clubs");
	test.equal(card.toCSSString(),"rank-a clubs");
	test.done();
}

exports.testDeck=function(test){
	var deck=new xxx.deck();
	deck.init(1);
	test.equal(deck.cards.length,52);
	test.done();
}
