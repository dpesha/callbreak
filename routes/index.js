
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Call Break Online' })
};

exports.play = function(req, res){
  req.session.sessionid = req.params.id;
  res.render('board', { title: 'Play Callbreak' });
};

exports.error = function(req, res){
  res.render('error', { title: 'Ooops!', message:'Sorry this particular game is full now!' });
};