function doStep(player,enemyArray,saved){
  if(saved.counter == undefined) saved.counter = 0;
  if(saved.direction == undefined) saved.direction = "right";

  saved.counter ++;
  if(saved.counter > 60){
    if(saved.direction == "right") saved.direction = "left"; else saved.direction = "right";
  }

  var keys = {right:false,left:false,up:false,space:false};
  
    //Get the closest enemy
    if(enemyArray.length > 0){
    var closest = enemyArray[0];
    function getDist(a,b){
      var distX = a.x-b.x;
      var distY = a.y - b.y;
      var distance = Math.sqrt(distX*distX+distY*distY);
      return distance;
    }
    for(var i=0;i<enemyArray.length;i++){
        if(getDist(player,enemyArray[i]) < getDist(player,closest)){
          closest = enemyArray[i];
        }
    }
    //Point towards closest
    var distX = closest.x - player.x;
    var distY = closest.y - player.y;
    var angle = Math.atan2(distY,distX) * (180/Math.PI);
    if((player.rotation % 360) > angle) keys['left'] = true;
    else keys['right'] = true;
    }
  
  
  return [keys,saved]
}