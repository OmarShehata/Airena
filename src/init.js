window.onload=function(){
	//Initialize screen and canvas
	var canvas = document.getElementById("game_canvas");
	var stage = new createjs.Stage(canvas);
	createjs.Ticker.setFPS(60);
	resize();
	//Full screen canvas
	function resize() { 
	    stage.canvas.width = window.innerWidth;
	    stage.canvas.height = window.innerHeight;     
	  }
	//Game loop
	createjs.Ticker.addEventListener("tick", handleTick);
	function handleTick(event) {
	  stage.update()
	  GameUpdate()
	}

	var playerArray = {}
	function CreateEnemyUser(uniqueID){
		var newPlayer = new PlayerObject(stage,"red");
		newPlayer.shape.x = Math.random() * 100;
		newPlayer.shape.y = Math.random() * 100;
		newPlayer.id = uniqueID;
		playerArray[uniqueID] = newPlayer
	}

	var socket = io();
	socket.on('new-user', function(id){
		CreateEnemyUser(id)
	});
	socket.on('remove-user',function(id){
		playerArray[id].destroy();
		delete playerArray[id];
	})
	socket.on('initial-users',function(msg){
		for(var i=0;i<msg.idArray.length;i++) CreateEnemyUser(msg.idArray[i])
		player.id = msg.own_id;
	})



	
	var player = new PlayerObject(stage)
	player.shape.x = 300;
	player.shape.y = 100;

	var tint = new ScreenTint(stage)

	var keys = {};
	this.document.onkeydown = keydown;
    this.document.onkeyup = keyup;
    function keydown(event) {
	    keys[event.keyCode] = true;
	}

	function keyup(event) {
	    delete keys[event.keyCode];
	}


	function GameUpdate(){
		if(keys[37]) player.rotateLeft() 
		if(keys[39]) {
			player.rotateRight()
			//tint.flash(10)
		}
		if(keys[38]) player.thrust()
		player.update()

		stage.x += ((-player.shape.x+stage.canvas.width/2) - stage.x) * 0.3;
		stage.y += ((-player.shape.y+stage.canvas.height/2) - stage.y )* 0.3;
		tint.update()

		for(var p in playerArray) playerArray[p].update()
		//Send player position
		socket.emit('update-position',{x:player.shape.x,y:player.shape.y,rot:player.shape.rotation,player_id:player.id})
	}
	//Update other player's positions
	socket.on('update-position',function(msg){
		playerArray[msg.player_id].shape.x = msg.x;
		playerArray[msg.player_id].shape.y = msg.y;
		playerArray[msg.player_id].shape.rotation = msg.rot;
	})

}
