var Callbreak = Em.Application.create();

/* Player class*/
Callbreak.Player= Em.Object.extend({
  id:'',
  getId: function() {
    return this.get('id');
  }.property('id'),

  setId: function(value) {        
    this.set('id',value);
    return value;
  }
});

Callbreak.playerAtSouth=Callbreak.Player.create({
  id:'Player1'
});

Callbreak.playerAtEast=Callbreak.Player.create({
  id:'Player2'
});

Callbreak.playerAtNorth=Callbreak.Player.create({
  id:'Player3'
});

Callbreak.playerAtWest=Callbreak.Player.create({
  id:'Player4'
});


Callbreak.playerController = Em.ArrayProxy.create({
    content: [Callbreak.playerAtSouth, Callbreak.playerAtEast,Callbreak.playerAtNorth,Callbreak.playerAtWest],
    firstObject: function() {
        return this.objectAt(0);
    }.property('@each'),
    secondObject: function() {
        return this.objectAt(1);
    }.property('@each'),
    thirdObject: function() {
        return this.objectAt(2);
    }.property('@each'),
    fourthObject: function() {
        return this.objectAt(3);
    }.property('@each')

});

Callbreak.playerAtSouthView = Em.View.create({
  idBinding: 'Callbreak.playerController.firstObject.id',
  template:Ember.Handlebars.compile('{{id}}')
});

Callbreak.playerAtSouthView.appendTo('#player1 > .name');

Callbreak.playerAtEastView = Em.View.create({
  idBinding: 'Callbreak.playerController.secondObject.id',
  template:Ember.Handlebars.compile('{{id}}')
});

Callbreak.playerAtEastView.appendTo('#player2 > .name');

Callbreak.playerAtNorthView = Em.View.create({
  idBinding: 'Callbreak.playerController.thirdObject.id',
  template:Ember.Handlebars.compile('{{id}}')
});

Callbreak.playerAtNorthView.appendTo('#player3 > .name');

Callbreak.playerAtWestView = Em.View.create({
  idBinding: 'Callbreak.playerController.fourthObject.id',
  template:Ember.Handlebars.compile('{{id}}')
});

Callbreak.playerAtWestView.appendTo('#player4 > .name,');


/* Status */
Callbreak.Status = Em.Object.create({
  message: '', 

  getMessage: function() {
  	return this.get('message');
  }.property('message'),

  setMessage: function(value) {  	  	
  	this.set('message',value);
  	return value;
  }
  
});


Callbreak.statusView = Em.View.create({
  tagName:'span',
  messageBinding: 'Callbreak.Status.getMessage',
  template:Ember.Handlebars.compile('{{message}}')
});

Callbreak.statusView.appendTo('#statusMessage');

Callbreak.pointTableController = Em.ArrayProxy.create({
    content: [Callbreak.Player.create({id:'Player1'}), Callbreak.Player.create({id:'Player2'}),Callbreak.Player.create({id:'Player3'}),Callbreak.Player.create({id:'Player4'})]    
});

Callbreak.pointTableView = Ember.View.extend({
    tagName: 'th'
});
