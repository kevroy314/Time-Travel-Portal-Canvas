function randInt(min,max){
	return Math.round((Math.random()*(max-min))+min);
}

//This helper function performs a fill ellipse function
function drawEllipse(ctx, x, y, w, h) {
  var kappa = .5522848;
      ox = (w / 2) * kappa, // control point offset horizontal
      oy = (h / 2) * kappa, // control point offset vertical
      xe = x + w,           // x-end
      ye = y + h,           // y-end
      xm = x + w / 2,       // x-middle
      ym = y + h / 2;       // y-middle

  ctx.beginPath();
  ctx.moveTo(x, ym);
  ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
  ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
  ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
  ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
  ctx.closePath();
  ctx.fill();
}

function doRectanglesOverlap(p1x1,p1y1,p1x2,p1y2,p2x1,p2y1,p2x2,p2y2){
		return (p1x1<p2x2&&p1x2>p2x1&&p1y1<p2y2&&p1y2>p2y1);
}