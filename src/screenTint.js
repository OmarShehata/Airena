//ScreenTint
//For tinting the screen white and such
var ScreenTint = function(stage_ref){
	var stage = stage_ref;
	var counter = 0;
	var countMax = 0;
	var self = {};
	var shapeObj = new createjs.Shape();
	var color = "#FF0000"
	stage.addChild(shapeObj)

	//Create object

	self.flash = function(time,c){
		if(counter == 0) {
			counter = countMax = time;
			color = c || "#FF0000";
		}
	}
	self.destroy = function(){

	}
	self.update = function(){
		shapeObj.x = -stage.x; 
		shapeObj.y = -stage.y;
		if(counter > 0){
			counter --;
			shapeObj.alpha = counter/countMax;
			shapeObj.graphics.clear()
			shapeObj.graphics.beginFill(color).drawRect(0,0,stage.canvas.width,stage.canvas.height)
		} else {
			shapeObj.alpha= 0;
			counter = 0;
		}
	}

	return self;
}