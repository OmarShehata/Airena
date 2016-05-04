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

	var quakePower = 0;
	var giantLaser = new createjs.Shape();
	giantLaser.graphics.beginFill("#FF6E6E").drawRect(0, 0, 120, 800);
	stage.addChild(giantLaser)
	giantLaser.regX = 60;
	giantLaser.regY = 0;
	giantLaser.alpha = 0;



	//Create background grid
	var worldWidth = 1024*5;
	var worldHeight = 1024*5;
	var cellSize = 256;
	var gridObj = new createjs.Shape();
	gridObj.graphics.setStrokeStyle(1).beginStroke("#FF0000")
	gridObj.alpha = 0.5;
	for(var i=0;i<worldWidth/cellSize;i++){
		gridObj.graphics.mt(i*cellSize-worldWidth/2,-worldHeight/2)
		gridObj.graphics.lt(i*cellSize-worldWidth/2,worldHeight/2)
	}
	for(var j=0;j<worldHeight/cellSize;j++){
		gridObj.graphics.mt(-worldWidth/2,j*cellSize-worldHeight/2)
		gridObj.graphics.lt(worldWidth/2,j*cellSize-worldHeight/2)
	}
	gridObj.graphics.endStroke()
	//Add thick lines at the end
	gridObj.graphics.setStrokeStyle(10).beginStroke("#FF0000")
	//Right boundary
	gridObj.graphics.mt(worldWidth/2,-worldHeight/2);
	gridObj.graphics.lt(worldWidth/2,worldHeight/2);
	//left boundary
	gridObj.graphics.mt(-worldWidth/2,-worldHeight/2);
	gridObj.graphics.lt(-worldWidth/2,worldHeight/2);
	//up boundary
	gridObj.graphics.mt(-worldWidth/2,-worldHeight/2);
	gridObj.graphics.lt(worldWidth/2,-worldHeight/2);
	//down boundary
	gridObj.graphics.mt(-worldWidth/2,worldHeight/2);
	gridObj.graphics.lt(worldWidth/2,worldHeight/2);
	gridObj.graphics.endStroke()
	stage.addChild(gridObj)

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

	var gameid = window.location.pathname.split("/")[1]; // this only looks at the first dir in path
	var socket = io();
	socket.emit('join-game', { gameid: gameid });
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

	function shootLaser(){
		giantLaser.x = player.shape.x + Math.cos((player.shape.rotation-90)*(Math.PI/180)) * 40;
		giantLaser.y = player.shape.y + Math.sin((player.shape.rotation-90)*(Math.PI/180)) * 40;
		giantLaser.rotation = player.shape.rotation+180;
		giantLaser.alpha = 1;
		giantLaser.other = false;
		quake(50)
		player.freeze(60)
		socket.emit("shoot",{id:player.id})
	}
	function shootOther(pl){
		giantLaser.other = true;
		giantLaser.x = pl.shape.x + Math.cos((pl.shape.rotation-90)*(Math.PI/180)) * 40;
		giantLaser.y = pl.shape.y + Math.sin((pl.shape.rotation-90)*(Math.PI/180)) * 40;
		giantLaser.rotation = pl.shape.rotation+180;
		giantLaser.alpha = 1;
		quake(20)
	}

	function GameUpdate(){
		if(player.id == undefined) return;//Don't run anything until we're connected
		if(keys[37]) player.rotateLeft()
		if(keys[39]) {
			player.rotateRight()
			//
		}
		if(keys[38]) player.thrust()
		player.update()

		if(keys[32]) {
			shootLaser()
		}


		stage.x += ((-player.shape.x+stage.canvas.width/2) - stage.x) * 0.3 + Math.random() * quakePower;
		stage.y += ((-player.shape.y+stage.canvas.height/2) - stage.y )* 0.3 + Math.random() * quakePower;
		quakePower *= 0.9;
		tint.update()
		//console.log(codeMirror.getValue())



		for(var p in playerArray) {
			playerArray[p].update()
			//Check if laser hit someone

			if(giantLaser.alpha > 0 && !giantLaser.other){
				//Check if point is inside rectangle
				var corners = []
				var angle = (giantLaser.rotation-180) * (Math.PI/180);
				//Get corners
				corners[0] = {x:60,y:0}
				corners[0].x = 60 * Math.cos(angle) - Math.sin(angle) * 0+giantLaser.x;
				corners[0].y = 60 * Math.sin(angle) + Math.cos(angle) * 0+giantLaser.y;
				corners[1] = {x:-60,y:0}
				corners[1].x = -60 * Math.cos(angle) - Math.sin(angle) * 0+giantLaser.x;
				corners[1].y = -60 * Math.sin(angle) + Math.cos(angle) * 0+giantLaser.y;
				corners[3] = {x:60,y:-800}
				corners[3].x = 60 * Math.cos(angle) - Math.sin(angle) * -800+giantLaser.x;
				corners[3].y = 60 * Math.sin(angle) + Math.cos(angle) * -800+giantLaser.y;
				corners[2] = {x:-60,y:-800}
				corners[2].x = -60 * Math.cos(angle) - Math.sin(angle) * -800+giantLaser.x;
				corners[2].y = -60 * Math.sin(angle) + Math.cos(angle) * -800+giantLaser.y;
				//Check which side the point is on from each line - d=(x−x1)(y2−y1)−(y−y1)(x2−x1)
				var line1 = {x1:corners[0].x,y1:corners[0].y,x2:corners[1].x,y2:corners[1].y}
				var line2 = {x1:corners[1].x,y1:corners[1].y,x2:corners[2].x,y2:corners[2].y}
				var line3 = {x1:corners[2].x,y1:corners[2].y,x2:corners[3].x,y2:corners[3].y}
				var line4 = {x1:corners[3].x,y1:corners[3].y,x2:corners[0].x,y2:corners[0].y}
				function CheckSide(x,y,line){
					return (x-line.x1)*(line.y2-line.y1)-(y-line.y1)*(line.x2-line.x1)
				}

					var X = playerArray[p].shape.x;
					var Y = playerArray[p].shape.y;
					var d1 = CheckSide(X,Y,line1);
					var d2 = CheckSide(X,Y,line2);
					var d3 = CheckSide(X,Y,line3);
					var d4 = CheckSide(X,Y,line4);

					d1 = Math.abs(d1)/d1;
					d2 = Math.abs(d2)/d2;
					d3 = Math.abs(d3)/d3;
					d4 = Math.abs(d4)/d4;


					if(d1 == d3 && d2 == d4){
						playerArray[p].setHealth(0)
						socket.emit("update-health",{health:playerArray[p].health,id:p})

					}



			}
		}

		if(giantLaser.alpha > 0) giantLaser.alpha -=0.02;
		if(Math.abs(giantLaser.alpha) < 0.001) giantLaser.alpha = 0;

		function hitPlayer(){
			tint.flash(10)
			quake(20)
			player.setHealth(player.health-0.2)
			if(player.health <= 0.001) $('#game_over').css("display","block")
			//Update health
			socket.emit("update-health",{health:player.health,id:player.id})
		}

		//Wall hurtful boundaries
		if(player.shape.x < -worldWidth/2){
			player.shape.x = -worldWidth/2;
			player.bump(50,0)
			hitPlayer();
		}
		if(player.shape.x > worldWidth/2){
			player.shape.x = worldWidth/2;
			player.bump(-50,0)
			hitPlayer();
		}
		if(player.shape.y < -worldHeight/2){
			player.shape.y = -worldHeight/2;
			player.bump(0,50)
			hitPlayer();
		}
		if(player.shape.y > worldHeight/2){
			player.shape.y = worldHeight/2;
			player.bump(0,-50)
			hitPlayer();
		}

		//Send player position
		socket.emit('update-position',{x:player.shape.x,y:player.shape.y,rot:player.shape.rotation,player_id:player.id})

		if($('#game_over').css("display") == "block"){
			$('#game_over').click(function(){
				//respawn
				player.setHealth(1)
				socket.emit("update-health",{health:1,id:player.id})
				player.shape.x = Math.random() * 500;
				player.shape.y = Math.random() * 500;
				$('#game_over').css("display","none")
			})
		}
	}
	//Simulate key press
	socket.on('key-press',function(msg){
		var pl = player;
		if(msg.id != player.id) {
      pl = playerArray[msg.id];
    }
		if(typeof(pl) === "undefined"){
			console.error("Undefined player...");
			return;
		}
		if(msg.keyMap['right']) pl.rotateRight();
		if(msg.keyMap['left']) pl.rotateLeft();
		if(msg.keyMap['up']) pl.thrust();
		if(msg.keyMap['space']) shootLaser();
	})

	//Someone is shooting!!
	socket.on('shoot',function(msg){
		var pl = playerArray[msg.id]
		shootOther(pl)
	})
	//Update health
	socket.on('update-health',function(msg){
		var pl = player;
		if(msg.id != player.id) pl = playerArray[msg.id];
		pl.setHealth(msg.health)
		if(msg.id == player.id && pl.health <= 0.001) $('#game_over').css("display","block")
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

	function quake(mag){
		quakePower = mag;
	}
}
