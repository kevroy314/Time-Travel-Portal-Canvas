var reportCanvas;
var reportContext;

function InitiatlizeReportCanvas(){
	reportCanvas = document.getElementById("reportCanvas");
	reportContext = reportCanvas.getContext("2d");
	reportCanvas.style.position = "fixed";
	reportCanvas.style.top = (window.innerHeight-reportCanvas.height);
	reportCanvas.style.left = (window.innerWidth-reportCanvas.width);
}

function ReportCanvasLoop(){
	reportContext.fillStyle = "#000000";
	reportContext.strokeStyle = "#FFFFFF";
	reportContext.fillRect(0,0,reportCanvas.width,reportCanvas.height);
	reportContext.strokeRect(0,0,reportCanvas.width,reportCanvas.height);
	reportContext.fillStyle = "#FFFFFF";
	reportContext.fillText("Current Time: "+ currentTime,4,10);
	reportContext.fillText("Time Travel Offset: " + timeTravelOffset + ", Updates Count: " + updateCount,4,20);
	reportContext.fillText("Time Travel Event Start Time: " + timeTravelEventStartTime,4,30);
	reportContext.fillText("Total Render Skips Count: " + totalRenderSkipsCount,4,40);
	var yPos = 50;
	for(var i = 0; i < testObjs.length||yPos+10<reportCanvas.height;i++){
		reportContext.fillText("X: " + testObjs[i].X + ",Y: " + testObjs[i].Y + ",XVel: " + testObjs[i].XVel + ",YVel: " + testObjs[i].YVel,4,yPos);
		yPos+=10;
	}
	setTimeout(ReportCanvasLoop,30);
}