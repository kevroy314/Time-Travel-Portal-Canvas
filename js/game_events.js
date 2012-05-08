//Set up events
window.onkeydown = KeyDownEvent; //When we press a key down, call the KeyDownEvent function (sets keyStates flags)
window.onkeyup = KeyUpEvent; //When we release a key, call the KeyUpEvent function (resets keyStates flags)
window.onresize = WindowResizeEvent; //When we resize the window, call the WindowResizeEvent function (auto-center if not manually moved)
window.onfocus = OnFocusEvent; //When the window is focused, reset the game timers to avoid "Catch-Up" effect (disable to create "Catch-Up" effect

//This function handles the key being pressed down. It modifies the keyStates array and watches for continuous
//time travel requests (this is performed via a "dead man's switch" which must be held to continue travelling
//back in time). It blocks the keyboard events from being passed along to the browser.
function KeyDownEvent(e){
	if(e.keyCode==192) //	`/~ Key
		timeIsForward = false;
	keyStates[e.keyCode] = true;
	if(e.keyCode==17||e.keyCode==82) return true;
	return false;
}

//This function handles the key being released. It modifies the keyStates array and watches for the release
//of the continuous time travel request. It blocks the keyboard events from being passed along to the browser.
function KeyUpEvent(e){
	if(e.keyCode==192) //	`/~ Key
		timeIsForward = true;
	keyStates[e.keyCode] = false;
	return false;
}

//This function handles key events which trigger while a key is depressed.
function HandleKeyEvents(){
	if(keyStates[37]){ //Left Key
		var dx = -pc.SuggestedXVel; //enforce suggested speed
		if(pc.X+dx<0) dx=0; //enforce boundry
		var dy = 0;
		pc.move(dx,dy);
		pc.inputStack.push([InputStackEventType.PlayerMovementEvent,currentTime,dx,dy]);
		printInputStack(InputStackEventType.PlayerMovementEvent,currentTime,dx,dy);
	}
	if(keyStates[38]){ //Up Key
		var dx = 0;
		var dy = -pc.SuggestedYVel; //enforce suggested speed
		if(pc.Y+dy<0) dy=0; //enforce boundry
		pc.move(dx,dy);
		pc.inputStack.push([InputStackEventType.PlayerMovementEvent,currentTime,dx,dy]);
		printInputStack(InputStackEventType.PlayerMovementEvent,currentTime,dx,dy);
	}
	if(keyStates[39]){ //Right Key
		var dx = pc.SuggestedXVel; //enforce suggested speed
		if(pc.X+dx+pc.width>canvas.width) dx=0; //enforce boundry
		var dy = 0;
		pc.move(dx,dy);
		pc.inputStack.push([InputStackEventType.PlayerMovementEvent,currentTime,dx,dy]);
		printInputStack(InputStackEventType.PlayerMovementEvent,currentTime,dx,dy);
	}
	if(keyStates[40]){ //Down Key
		var dx = 0;
		var dy = pc.SuggestedYVel; //enforce suggested speed
		if(pc.Y+dy+pc.height>canvas.height) dy=0; //enforce boundry
		pc.move(dx,dy);
		pc.inputStack.push([InputStackEventType.PlayerMovementEvent,currentTime,dx,dy]);
		printInputStack(InputStackEventType.PlayerMovementEvent,currentTime,dx,dy);
	}
	if(keyStates[49]){ //1 key
		var gs0 = new GameState(currentTime,updateCount,pc!=null?pc.clone():null,testObjs!=null?testObjs.clone():null); //Record the current game state
		var gs = gs0.clone(); //Generate a game state for the portal
		
		gs.pc.createOutPortal(gs0);
		
		pc.createInPortal(gs);
		
		pc.inputStack.push([InputStackEventType.PlayerActionEvent,currentTime,gs0,gs]);
		printInputStack(InputStackEventType.PlayerActionEvent,currentTime,'portal','in');
	}
	if(keyStates[50]){ //2 key
		var gs0 = new GameState(currentTime,updateCount,pc.clone(),testObjs.clone());
		
		var gs = gs0.clone();
		
		gs.pc.createOutPortal();
		pc.createOutPortal();
		
		pc.inputStack.push([InputStackEventType.PlayerActionEvent,currentTime,gs0,gs]);
		printInputStack(InputStackEventType.PlayerActionEvent,currentTime,'portal','out');
	}
}

//This function centeres the canvas if it has not been dragged (triggered when the window resizes)
function WindowResizeEvent(){
	Initialize();
}

//This function makes sure the simulation time is not interrupted by losing focus on the window.
//Without this function, the game would play catchup every time you left the tab and came back (very annoying).
function OnFocusEvent(){
	nextRenderTime = getTimeTravelAdjustedTime();
}