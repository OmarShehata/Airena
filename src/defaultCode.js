function doStep(player,enemyArray,saved){
	if(saved.counter == undefined) saved.counter = 0;
	if(saved.direction == undefined) saved.direction = "right";

	saved.counter ++;
	if(saved.counter > 60){
		if(saved.direction == "right") saved.direction = "left"; else saved.direction = "right";
	}

	var keys = {right:false,left:false,up:false,space:false};
	keys[saved.direction] = true;

	return [keys,saved]
}