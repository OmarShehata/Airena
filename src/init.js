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

	var player = new PlayerObject(stage)
	player.shape.x = 300;
	player.shape.y = 100;

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



	
	



	var tint = new ScreenTint(stage)

	var keys = {};
	this.document.onkeydown = keydown;
    this.document.onkeyup = keyup;
    function keydown(event) {
    	//Disable keyboard when code editor is open
    	if($('#code_editor').css("display") == "none") keys[event.keyCode] = true;
	}

	function keyup(event) {
	    delete keys[event.keyCode];
	}


	function GameUpdate(){
		if(player.id == undefined) return;//Don't run anything until we're connected
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
		//console.log(codeMirror.getValue())

		for(var p in playerArray) playerArray[p].update()
		//Send player position
		socket.emit('update-position',{x:player.shape.x,y:player.shape.y,rot:player.shape.rotation,player_id:player.id})
	}
	//Simulate key press
	socket.on('key-press',function(msg){
		var pl = player;
		//console.log(msg)
		if(msg.id != player.id) pl = playerArray[msg.id];
		if(msg.keyMap['right']) pl.rotateRight();
		if(msg.keyMap['left']) pl.rotateLeft();
		if(msg.keyMap['up']) pl.thrust();
	})	

	//Update other player's positions
	socket.on('update-position',function(msg){
		var pl = player;
		if(msg.player_id != player.id) pl = playerArray[msg.player_id];
		if(pl == undefined){
			//console.log("UNDEFINED!",msg.player_id);
			return;
		}
		pl.shape.x = msg.x;
		pl.shape.y = msg.y;
		pl.shape.rotation = msg.rot;
	})

	var options = {}
		//options['lineWrapping'] = true;
		options['lineNumbers'] = true;

	var codeMirror = CodeMirror(document.getElementById('code_editor'),options);
	var defaultCode = ""

	//Load code from local storage
	if(localStorage.savedCode != undefined){
		codeMirror.setValue(localStorage.savedCode)
	}


	$.ajax({
            url : "src/defaultCode.js",
            dataType: "text",
            success : function (data) {
                defaultCode = data;
            }
        });

	$('#code_editor').css("display","none");
	//Set up code button 
	$('#code_button').click(function(evt){
		$('#code_button').css("display","none");
		$('#close_button').css("display","block");
		$('#reload_button').css("display","block");
		$('#code_editor').css("display","block");
		//Load default if nothing is saved
		if(localStorage.savedCode == undefined){
			codeMirror.setValue(defaultCode)
		}
	})
	$('#close_button').click(function(evt){
		$('#code_button').css("display","block");
		$('#close_button').css("display","none");
		$('#reload_button').css("display","none");
		$('#code_editor').css("display","none");
	})
	$('#reload_button').click(function(evt){
		console.log(defaultCode)
		codeMirror.setValue(defaultCode)
	})
	codeMirror.on("change",function(evt){
		localStorage.savedCode = codeMirror.getValue();
		socket.emit("code-change",{savedCode:codeMirror.getValue(),id:player.id})
		//Hide error bar
		$('#error_banner').css("display","none")
	})

	//Catch and display syntax errors
	socket.on("syntax-error",function(msg){
		$('#error_banner').css("display","block")
		$('#error_text').html(msg.errorText)
	})
	
}
