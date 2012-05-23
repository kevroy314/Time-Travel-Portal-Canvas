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
	
	sim = new Simulation(canvas.width,canvas.height,25,1);
	
	GameLoop(); //Start the game!
}

function Render(){
	//Draw the background and border
	context.fillStyle = "#000000"; //Magic#
	context.fillRect(0,0,canvas.width,canvas.height);
	context.strokeStyle = "#FFFFFF"; //Magic#
	context.strokeRect(0,0,canvas.width,canvas.height);
	
	sim.render(context);
}

//The Update function takes a time step and updates the positions of the objects as well as the player.
function Update(dt){
	sim.update(dt,keyStates);
}

//The time forward game loop function
function GameLoop(){
	sim.renderSkipsCount = 0; //Reset the loop counter
	sim.currentTime = sim.getTimeTravelAdjustedTime(); //Set the current time to our relative time
	
	while(sim.currentTime>sim.nextRenderTime&&sim.renderSkipsCount<sim.maxRenderSkips){ //Loop until the next tick or the maximum number of frames
		Update(sim.speed); //Update the game state
		sim.nextRenderTime+=sim.renderInterval;
		sim.renderSkipsCount++; //Iterate renderSkipsCount
	}
	sim.currentTime = sim.getTimeTravelAdjustedTime(); //Update the current time to our relative time
	
	Render(); //Render the scene
	if(sim.timeIsForward) //If we're going forward in time, repeat the GameLoop
		setTimeout(GameLoop,sim.renderInterval); //30ms is approximately 33 fps
	else if(!sim.timeIsForward) //If we're going backward in time
	{
		//Register the time of the time travel event
		sim.timeTravelEventStartTime = sim.getTimeTravelAdjustedTime();
		//Start the ReverseGameLoop
		setTimeout(ReverseGameLoop,sim.renderInterval);
	}
}

//The time backwards game loop function, similar to forward but with a different current time calculation
function ReverseGameLoop(){
	sim.currentTime = sim.timeTravelEventStartTime-(sim.getTimeTravelAdjustedTime()-sim.timeTravelEventStartTime);
	if(sim.updateCount>0){
		sim.renderSkipsCount = 0; //Reset the loop counter
		sim.currentTime = sim.timeTravelEventStartTime-(sim.getTimeTravelAdjustedTime()-sim.timeTravelEventStartTime); //Set the current time
		while(sim.currentTime<sim.nextRenderTime&&sim.renderSkipsCount<sim.maxRenderSkips){
			while(sim.pc.inputStack.length>0&&sim.pc.inputStack[sim.pc.inputStack.length-1].currentTime>sim.nextRenderTime){
				var eventToProcess = sim.pc.inputStack.pop();
				if(eventToProcess.movementEventType == InputStackEventType.PlayerMovementEvent)
					sim.pc.move(-eventToProcess.dx,-eventToProcess.dy);
				else if (eventToProcess.movementEventType == InputStackEventType.PlayerActionEvent)
					sim.pc = sim.stateRegistry.getGameState(eventToProcess.stateIndex).pc.clone();
			}
			Update(-sim.speed);
			sim.nextRenderTime-=sim.renderInterval;
			sim.renderSkipsCount++;
		}
	}
	else{ //If we've hit the stop time, copy the stop state and adjust the offset
		sim.timeTravelCumulative+=(-sim.currentTime);
	}
	sim.currentTime = sim.timeTravelEventStartTime-(sim.getTimeTravelAdjustedTime()-sim.timeTravelEventStartTime);
	Render();
	if(sim.timeIsForward){
		sim.timeTravelCumulative += (sim.timeTravelEventStartTime-sim.currentTime)*2; //This is times two because when you're continuously time travelling backwards, time is still passing forwards
		sim.nextRenderTime = sim.currentTime+1;
		Update(-sim.speed);
		setTimeout(GameLoop,sim.renderInterval);
	}
	else if(!sim.timeIsForward){
		setTimeout(ReverseGameLoop,sim.renderInterval);
	}
}