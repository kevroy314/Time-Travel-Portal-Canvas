window.onload = Initialize; //When we load the window, call the Initialize function

var canvas; //The primary canvas element (the space where things are rendered)
var context; //The primary context element (for drawing)

var keyStates;

var sim;

//This function initializes all the game variables and starts the game loop.
function Initialize(){
	var body = document.getElementsByTagName('body')[0];
	
	canvas = document.createElement('canvas');
	canvas.setAttribute('id','mainCanvas');
	canvas.setAttribute('style','position:absolute;top:0px;left:0px;');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	
	body.appendChild(canvas);
	
	context = canvas.getContext("2d");

	keyStates = new Array();
	
	sim = new Simulation(canvas.width,canvas.height,1,1);
	
	SimpleGameLoop(); //Start the game!
}

function Render(){
	//Draw the background and border
	context.fillStyle = "#000000"; //Magic#
	context.fillRect(0,0,canvas.width,canvas.height);
	
	sim.render(context);
}

//The Update function takes a time step and updates the positions of the objects as well as the player.
function Update(dt){
	sim.update(dt,keyStates);
}

function SimpleGameLoop(){
	if(sim.timeIsForward){
		Update(sim.speed);
		Render();
	}
	else{
		Update(-sim.speed);
		Render();
	}
	setTimeout(SimpleGameLoop,sim.renderInterval);
}