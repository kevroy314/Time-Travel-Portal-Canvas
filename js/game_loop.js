window.onload = Initialize; //When we load the window, call the Initialize function

var canvas; //The primary canvas element (the space where things are rendered)
var context; //The primary context element (for drawing)
var debugConsole;
var debugStack;
var keyStates;
var sim;

//This function initializes all the game variables and starts the game loop.
function Initialize(){
	var body = document.getElementsByTagName('body')[0];
	
	debugConsole = document.createElement('div');
	debugConsole.setAttribute('id','debugConsole');
	debugConsole.setAttribute('style','overflow:scroll;color:white;font-size:10px;position:absolute;top:0px;left:0px;border:1px solid white;width:'+(window.innerWidth/5-2)+'px;height:'+(window.innerHeight-2)+'px;');
	
	debugStack = document.createElement('ol');
	debugStack.setAttribute('id','debugStack');
	debugConsole.appendChild(debugStack);
	
	body.appendChild(debugConsole);
	
	canvas = document.createElement('canvas');
	canvas.setAttribute('id','mainCanvas');
	canvas.setAttribute('style','position:absolute;top:0px;left:'+(window.innerWidth/5)+'px;');
	canvas.width = window.innerWidth*4/5;
	canvas.height = window.innerHeight;
	
	body.appendChild(canvas);
	
	context = canvas.getContext("2d");

	keyStates = new Array();
	
	sim = new Simulation();
	sim.Initialize(canvas.width,canvas.height,25); //Magic#
	
	GameLoop(); //Start the game!
}

function Draw(){
	//Draw the background and border
	context.fillStyle = "#000000"; //Magic#
	context.fillRect(0,0,canvas.width,canvas.height);
	context.strokeStyle = "#FFFFFF"; //Magic#
	context.strokeRect(0,0,canvas.width,canvas.height);
	
	sim.render(context);
	
	clearInputStack();
	
	printInputStack(sim.pc.inputStack);
}

//The Update function takes a time step and updates the positions of the objects as well as the player.
function Update(dt){
	sim.update(dt,keyStates);
	sim.stateRegistry.removeStatesLaterThan(sim.getTimeTravelAdjustedTime()); //Remove states later than current to clean up
}

//The time forward game loop function
function GameLoop(){
	sim.renderSkipsCount = 0; //Reset the loop counter
	sim.currentTime = sim.getTimeTravelAdjustedTime(); //Set the current time to our relative time
	
	while(sim.currentTime>sim.nextRenderTime&&sim.renderSkipsCount<sim.maxRenderSkips){ //Loop until the next tick or the maximum number of frames
		Update(1); //Update the game state
		sim.nextRenderTime+=sim.renderInterval;
		sim.renderSkipsCount++; //Iterate renderSkipsCount
	}
	sim.currentTime = sim.getTimeTravelAdjustedTime(); //Update the current time to our relative time
	
	Draw(); //Render the scene
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
			Update(-1);
			sim.nextRenderTime-=sim.renderInterval;
			sim.renderSkipsCount++;
		}
	}
	else{ //If we've hit the stop time, copy the stop state and adjust the offset
		sim.timeTravelCumulative+=(-sim.currentTime);
	}
	sim.currentTime = sim.timeTravelEventStartTime-(sim.getTimeTravelAdjustedTime()-sim.timeTravelEventStartTime);
	Draw();
	if(sim.timeIsForward){
		sim.timeTravelCumulative += (sim.timeTravelEventStartTime-sim.currentTime)*2; //This is times two because when you're continuously time travelling backwards, time is still passing forwards
		sim.nextRenderTime = sim.currentTime+1;
		Update(-1);
		setTimeout(GameLoop,sim.renderInterval);
	}
	else if(!sim.timeIsForward){
		setTimeout(ReverseGameLoop,sim.renderInterval);
	}
}

function printInputStack(stack){
	for(var i = 0; i < stack.length;i++){
		var output = "";
		if(stack[i].movementEventType==InputStackEventType.PlayerMovementEvent){
			output+="move(";
			output+=""+stack[i].currentTime;
			output+=","+stack[i].dx;
			output+=","+stack[i].dy;
		}
		else if(stack[i].movementEventType==InputStackEventType.PlayerActionEvent){
			output+="act(";
			output+=""+stack[i].currentTime;
			output+=","+stack[i].stateIndex;
		}
		output+=")"
		var outputElement = document.createElement('li');
		outputElement.setAttribute('class','userStackItem');
		outputElement.innerHTML = output;
		debugStack.appendChild(outputElement);
	}
}
function clearInputStack(){
	$("ol").html('');
}