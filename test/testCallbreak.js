var xxx=require('../callbreak');

exports['test player join ']=function(test){

	test.equal(xxx.games.length,0);

	var player1=new xxx.player('dipesh1');
	player1.joinGame('abc');
	test.equal(xxx.games.length,1);	
	test.equal(xxx.games[0].player.length,1);

	var player2=new xxx.player('dipesh2');
	player2.joinGame('abc');
	test.equal(xxx.games.length,1);
	test.equal(xxx.games[0].player.length,2);	

	var player3=new xxx.player('dipesh3');
	player3.joinGame('abc');
	test.equal(xxx.games[0].player.length,3);
	
	var player4=new xxx.player('dipesh4');
	player4.joinGame('abc');
	test.equal(xxx.games[0].player.length,4);


	// max player test
	var player5=new xxx.player('dipesh5');
	test.ok(!player5.joinGame('abc'),'should be false here');
	test.equal(xxx.games.length,1);	
	test.equal(xxx.games[0].player.length,4);
	test.equal(xxx.games[0].state,1);

	player4.leaveGame();
	test.equal(xxx.games[0].player.length,3);
	test.equal(xxx.games[0].state,0);

	player5.joinGame('abc');
	test.equal(xxx.games.length,1);
	test.equal(xxx.games[0].player.length,4);
	test.equal(xxx.games[0].state,1);

	player5.startNewGame();

	player1.drawRandomCard();
	test.equal(xxx.games[0].deck.cards.length,51);

	player2.drawRandomCard();
	test.equal(xxx.games[0].deck.cards.length,50);

	player3.drawRandomCard();
	test.equal(xxx.games[0].deck.cards.length,49);

	player5.drawRandomCard();
	test.equal(xxx.games[0].deck.cards.length,52);

	player5.drawRandomCard();
	test.equal(xxx.games[0].deck.cards.length,52);
	

	// another room test
	var player=new xxx.player('prabin');
	player.joinGame('abcd');
	test.equal(xxx.games.length,2);	
	test.done();
}


