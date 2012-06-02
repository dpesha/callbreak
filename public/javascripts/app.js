$(document).ready(function() {

	//Show popup
	Popup.show();

	var model = new GameModel();

	// initialize login view 
	var lview = new LoginView(model, new LoginController(model), {
		'enterElement': $('#playerInput'),
		'errorLabel': $('#joinError')
		
	});
	lview.show();

	// initialize Player view
	var pview = new PlayerView(model, new PlayerController(model), {
		'tableHeader': $('#pointtable > table > tbody> tr > th'),
		'player1': $('#player1 > .name'),
		'player2': $('#player2 > .name'),
		'player3': $('#player3 > .name'),
		'player4': $('#player4 > .name'),
	});	

	// initialize chat view 
	var cview = new ChatView(model, new ChatController(model), {
		'messageBox': $('#messages'),
		'messageInput': $('#messageText')
		
	});
	cview.show();

	// initialize game View
	var gview = new GameView(model, new GameController(model), {
		'startButton': $('#start'),
		'shuffleButton':$('#shuffle'),
		'dealButton': $('#deal'),
		'statusMessage': $('#statusMessage'),
		'deck': $('#roundtable'),
		'players':[$('#player1'),$('#player2'),$('#player3'),$('#player4')],
		'playersId': [$('#player1 > .name'),$('#player2 > .name'),$('#player3 > .name'),$('#player4 > .name')],
		'tableHeader': $('#pointtable > table > tbody> tr > th'),
		'round': $('#mid > #round'),

	});
	gview.init();

	// initialize table view
	var ptview = new PointTableView(model,new PointTableController(model),{
		'table':$('#pointtable > table > tbody'),
	});	

	 /* Rotate Array */
  	Array.prototype.rotate = function(n) {
    	this.unshift.apply(this, this.splice(n, this.length))
    	return this;
  	}

});


var Popup = {
	
	show: function() {
		this.center();

		$("#backgroundPopup").css({
			"opacity": "0.7"
		});
		$("#backgroundPopup").fadeIn("slow");
		$("#popup").fadeIn("slow");
		$('#playerInput').focus();
	},	
	hide: function() {

		$("#backgroundPopup").fadeOut("slow");
		$("#popup").fadeOut("slow");

	},
	center: function() {
		//request data for centering
		var windowWidth = document.documentElement.clientWidth;
		var windowHeight = document.documentElement.clientHeight;
		var popupHeight = $("#popup").height();
		var popupWidth = $("#popup").width();
		//centering
		$("#popup").css({
			"position": "absolute",
			"top": windowHeight / 2 - popupHeight / 2,
			"left": windowWidth / 2 - popupWidth / 2
		});

		$("#backgroundPopup").css({
			"height": windowHeight
		});
	}
}