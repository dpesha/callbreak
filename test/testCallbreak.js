var xxx=require('../callbreak');

 

exports['test player join ']=function(test){

	test.equal(xxx.games.length,0);

	var player1=new xxx.Player('dipesh1');
	player1.joinGame('abc');
	test.equal(xxx.games.length,1);	
	test.equal(xxx.games[0].player.length,1);

	var player2=new xxx.Player('dipesh2');
	player2.joinGame('abc');
	test.equal(xxx.games.length,1);
	test.equal(xxx.games[0].player.length,2);	

	var player3=new xxx.Player('dipesh3');
	player3.joinGame('abc');
	test.equal(xxx.games[0].player.length,3);
	
	var player4=new xxx.Player('dipesh4');
	player4.joinGame('abc');
	test.equal(xxx.games[0].player.length,4);


	// max player test
	var player5=new xxx.Player('dipesh5');
	test.ok(!player5.joinGame('abc'),'should be false here');
	test.equal(xxx.games.length,1);	
	test.equal(xxx.games[0].player.length,4);
	

	player4.leaveGame();
	test.equal(xxx.games[0].player.length,3);
	

	player5.joinGame('abc');
	test.equal(xxx.games.length,1);
	test.equal(xxx.games[0].player.length,4);
	

	player5.startNewGame();

	player1.drawRandomCard(0);
	test.equal(xxx.games[0].deck.cards.length,51);

	player2.drawRandomCard(0);
	test.equal(xxx.games[0].deck.cards.length,50);

	player3.drawRandomCard(0);
	test.equal(xxx.games[0].deck.cards.length,49);

	player5.drawRandomCard(0);
	test.equal(xxx.games[0].deck.cards.length,52);

	player5.drawRandomCard(0);
	test.equal(xxx.games[0].deck.cards.length,52);

	
	if(player1.position==0){
		player1.shuffle();
		player1.deal();
	}
	
	if(player2.position==0){
		player2.shuffle();
		player2.deal();
	}
	if(player3.position==0){
		player3.shuffle();
		player3.deal();
	}
	if(player5.position==0){
		player5.shuffle();
		player5.deal();
	}

	test.equal(player1.cards.length,13);
	test.equal(player2.cards.length,13);
	test.equal(player3.cards.length,13);
	test.equal(player5.cards.length,13);



	var players=xxx.games[0].player;		
	
	for(var x in players){
		if(players[x].turn===1){
			players[x].bidTricks(3);
			test.equal(players[x].canBid,false);
			
		}
	}

	for( var x in players){
		if(players[x].turn===2){
			players[x].bidTricks(3);
			test.equal(players[x].canBid,false);
			
		}
	}

	for( var x in players){
		if(players[x].turn===3){
			players[x].bidTricks(3);
			test.equal(players[x].canBid,false);
			
		}
	}

	for( var x in players){
		if(players[x].turn===0){
			players[x].bidTricks(3);
			test.equal(players[x].canBid,false);			
		}
	}

	
	 for (var i=0;i<13;i++){

	
		for(var x in players) {
			
			if(players[x].canTrick){
				
				var a=players[x].cards.length;
				var b=players[x].playedTricks.length;					
				test.equal(players[x].canTrick,true);							
				players[x].playTrick(players[x].cards[0].getRank(),players[x].cards[0].getSuit());			
				//test.equal(xxx.games[0].hand.length,1);
				test.equal(players[x].cards.length,a-1);
				test.equal(players[x].playedTricks.length,b+1);
				test.equal(players[x].canTrick,false);			
				//test.equal(xxx.games[0].tricks,i);
				break;
			}
		}	

	}
	

	// another room test
	var player=new xxx.Player('prabin');
	player.joinGame('abcd');
	test.equal(xxx.games.length,2);	
	test.done();
}


