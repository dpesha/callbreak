
/*
 * GET home page.
 */

exports.index = function(req, res){
	var label="";
	if(req.params.message=='quotaover'){
		label='Ohh..Looks like we have reached Player Quota! Please click [Play Now!] below to play Callbreak with other friends.'
	}
  res.render('index', { title: 'Call Break Online',label:label});
};

exports.play = function(req, res){
  
  // express session Store can be accessed here! 
  // check player quota here at http level (max 4 player at single resource)
  // var getSessionCount=function(sessionId){
	 //  var count=0;
	 //  if(req.sessionStore.currentSessions != undefined){	  		
	 //  	for (var i = 0; i < req.sessionStore.currentSessions.length; i++) {
	 //      if(req.sessionStore.currentSessions[i]==sessionId){
	 //           count++; 
	 //        }
	 //    }
	 //  }
	 //  return count;
  //  }

  // console.log('Session count for [' + req.params.id + '] is:' + getSessionCount(req.params.id));
  // if(getSessionCount(req.params.id)==4) {
  // 		res.send('Ohh..Looks like we have reached player quota. Please play a new Game with your friends from <a href="/">here</a>', 404);
  // } else {
	  	req.session.sessionid = req.params.id;
	  	res.render('board', { title: 'Play Callbreak' });
	// }
};

exports.error = function(req, res){
  res.render('error', { title: 'Ooops!', message:'Sorry this particular game is full now!' });
};