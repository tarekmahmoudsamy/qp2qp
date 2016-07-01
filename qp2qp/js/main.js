const REV = 6,
       BRUSHES = ["sketchy","sketchy_thin","simple","foundation","fur","eraser"],
       USER_AGENT = navigator.userAgent.toLowerCase();

var SCREEN_WIDTH = window.innerWidth*2,
    SCREEN_HEIGHT = window.innerHeight*2,
    BRUSH_SIZE = 1,
    BRUSH_PRESSURE = 1,
    COLOR = [0, 0, 0],
    BACKGROUND_COLOR = [250, 250, 250],
    STORAGE = window.localStorage,
    brush,
    saveTimeOut,
    wacom,
    i,
    mouseX = 0,
    mouseY = 0,
    container,
    foregroundColorSelector,
    backgroundColorSelector,
    menu,
    about,
    canvas,
    flattenCanvas,
    context,
    isFgColorSelectorVisible = false,
    isBgColorSelectorVisible = false,
    isAboutVisible = false,
    isMenuMouseOver = false,
    shiftKeyIsDown = false,
    altKeyIsDown = false,
    brushSizeTouchStart = 1,
    brushSizeTouchReference = 0.0;

init();

	    canvas.style.width = SCREEN_WIDTH*2;
        canvas.style.height = SCREEN_HEIGHT*1.955; //problem with the drawing point  canvas.style.height = SCREEN_HEIGHT*1.955 to fix it but not a solution //tarek

window.confirm("use one finger to move and two fingers to draw      استخدم اصبع للتحريك و اصبعين للرسم");
window.confirm("+/- to zoom in/out      +/- للتكبير و التصغير ");
window.confirm("take screenshots to save your drawings     خذ سكرين شوت لرسمتك ");

function init()
{
    var hash, palette, embed, localStorageImage;

    if (USER_AGENT.search("android") > -1 || USER_AGENT.search("iphone") > -1)
        BRUSH_SIZE = 2;

    if (USER_AGENT.search("safari") > -1 && USER_AGENT.search("chrome") == -1) // Safari
        STORAGE = false;

    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundPosition = 'center center';

    container = document.createElement('div');
    document.body.appendChild(container);


    /*
     * TODO: In some browsers a naste "Plugin Missing" window appears and people is getting confused.
     * Disabling it until a better way to handle it appears.
     *
     * embed = document.createElement('embed');
     * embed.id = 'wacom-plugin';
     * embed.type = 'application/x-wacom-tablet';
     * document.body.appendChild(embed);
     *
     * wacom = document.embeds["wacom-plugin"];
     */

    canvas = document.createElement("canvas");
    canvas.width = SCREEN_WIDTH;
//  canvas.height = SCREEN_HEIGHT;
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);


    flattenCanvas = document.createElement("canvas");
    flattenCanvas.width = SCREEN_WIDTH;
    flattenCanvas.height = SCREEN_HEIGHT;

    palette = new Palette();

    foregroundColorSelector = new ColorSelector(palette);
    foregroundColorSelector.addEventListener('change', onForegroundColorSelectorChange, false);
    container.appendChild(foregroundColorSelector.container);

    backgroundColorSelector = new ColorSelector(palette);
    backgroundColorSelector.addEventListener('change', onBackgroundColorSelectorChange, false);
    container.appendChild(backgroundColorSelector.container);

    function noScroll(event) {
       event.preventDefault();//tarek//////////////////////
		//return true;
    };

    menu = new Menu();
    menu.container.addEventListener('touchmove', noScroll, false);
    menu.foregroundColor.addEventListener('click', onMenuForegroundColor, false);
    menu.backgroundColor.addEventListener('click', onMenuBackgroundColor, false);
    menu.selector.addEventListener('change', onMenuSelectorChange, false);
    menu.save.addEventListener('click', onMenuSave, false);
    menu.exportImage.addEventListener('click', onMenuExportImage, false);
    menu.resetBrush.addEventListener('click', onMenuResetBrush, false);
    menu.clear.addEventListener('click', onMenuClear, false);
    menu.about.addEventListener('click', onMenuAbout, false);
    menu.container.addEventListener('mouseover', onMenuMouseOver, false);
    menu.container.addEventListener('mouseout', onMenuMouseOut, false);

    // Touch handlers -- unused.
    // menu.container.addEventListener('touchstart', noScroll, false);
    // menu.container.addEventListener('touchend', noScroll, false);
    // menu.foregroundColor.addEventListener('touchend', onMenuForegroundColor, false);
    // menu.backgroundColor.addEventListener('touchend', onMenuBackgroundColor, false);
    // menu.save.addEventListener('touchend', onMenuSave, false);
    // menu.exportImage.addEventListener('touchend', onMenuExportImage, false);
    // menu.clear.addEventListener('touchend', onMenuClear, false);
    // menu.about.addEventListener('touchend', onMenuAbout, false);

    container.appendChild(menu.container);

    flattenCanvas.height = canvas.height = SCREEN_HEIGHT - menu.container.offsetHeight;
    canvas.style.position = 'absolute';
    ////tarek screen move code edit 1 /////
	 canvas.style.top = -window.innerHeight/2+'px';//to centre the canvas
	 canvas.style.left = -window.innerWidth/2+'px';//to centre the canvas
	////tarek screen move code edit 1 /////
    context = canvas.getContext("2d");

    if (STORAGE)
    {
        if (localStorage.canvas)
        {
            localStorageImage = new Image();

            localStorageImage.addEventListener("load", function(event)
            {
                localStorageImage.removeEventListener(event.type, arguments.callee, false);
                context.drawImage(localStorageImage,0,0);
            }, false);

            localStorageImage.src = localStorage.canvas;
        }

        if (localStorage.brush_color_red)
        {
            COLOR[0] = localStorage.brush_color_red;
            COLOR[1] = localStorage.brush_color_green;
            COLOR[2] = localStorage.brush_color_blue;
        }

        if (localStorage.background_color_red)
        {
            BACKGROUND_COLOR[0] = localStorage.background_color_red;
            BACKGROUND_COLOR[1] = localStorage.background_color_green;
            BACKGROUND_COLOR[2] = localStorage.background_color_blue;
        }
    }

    foregroundColorSelector.setColor( COLOR );
    backgroundColorSelector.setColor( BACKGROUND_COLOR );

    if (window.location.hash)
    {
        hash = window.location.hash.substr(1,window.location.hash.length);

        for (i = 0; i < BRUSHES.length; i++)
        {
            if (hash == BRUSHES[i])
            {
                brush = eval("new " + BRUSHES[i] + "(context)");
                menu.selector.selectedIndex = i;
                break;
            }
        }
    }

    if (!brush)
    {
        brush = eval("new " + BRUSHES[0] + "(context)");
    }

    about = new About();
    container.appendChild(about.container);

    window.addEventListener('mousemove', onWindowMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onWindowKeyDown, false);
    window.addEventListener('keyup', onWindowKeyUp, false);
    window.addEventListener('blur', onWindowBlur, false);

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseout', onDocumentMouseOut, false);

    document.addEventListener("dragenter", onDocumentDragEnter, false);
    document.addEventListener("dragover", onDocumentDragOver, false);
    document.addEventListener("drop", onDocumentDrop, false);

    canvas.addEventListener('mousedown', onCanvasMouseDown, false);
    canvas.addEventListener('touchstart', onCanvasTouchStart, false);

    onWindowResize(null);
	

}


// WINDOW

function onWindowMouseMove( event )
{
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onWindowResize()
{
    SCREEN_WIDTH = window.innerWidth;
    SCREEN_HEIGHT = window.innerHeight;

    menu.container.style.left='0px';
    menu.container.style.width=SCREEN_WIDTH+'px';

    about.container.style.left = ((SCREEN_WIDTH - about.container.offsetWidth) / 2) + 'px';
    about.container.style.top = ((SCREEN_HEIGHT - about.container.offsetHeight) / 2) + 'px';
}

function onWindowKeyDown( event )
{
    if (shiftKeyIsDown)
        return;

    switch(event.keyCode)
    {
        case 16: // Shift
            shiftKeyIsDown = true;
            foregroundColorSelector.container.style.left = mouseX - 125 + 'px';
            foregroundColorSelector.container.style.top = mouseY - 125 + 'px';
            foregroundColorSelector.container.style.visibility = 'visible';
            break;

        case 18: // Alt
            altKeyIsDown = true;
            break;

        case 68: // d
            if(BRUSH_SIZE > 1) BRUSH_SIZE --;
            break;

        case 70: // f
            BRUSH_SIZE ++;
            break;
    }
}

function onWindowKeyUp( event )
{
    switch(event.keyCode)
    {
        case 16: // Shift
            shiftKeyIsDown = false;
            foregroundColorSelector.container.style.visibility = 'hidden';
            break;

        case 18: // Alt
            altKeyIsDown = false;
            break;

        case 82: // r
            brush.destroy();
            brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");
            break;
        case 66: // b
            document.body.style.backgroundImage = null;
            break;
    }

    context.lineCap = BRUSH_SIZE == 1 ? 'butt' : 'round';
}

function onWindowBlur( event )
{
    shiftKeyIsDown = false;
    altKeyIsDown = false;
}


// DOCUMENT

function isEventInColorSelector(cx, cy) {
    if (!isFgColorSelectorVisible && !isBgColorSelectorVisible) {
        return false;
    }

    var xLoc = 0,
        yLoc = 0;

    if (isFgColorSelectorVisible) {
        xLoc = foregroundColorSelector.container.offsetLeft + 250;
        yLoc = foregroundColorSelector.container.offsetTop;
    } else {
        xLoc = backgroundColorSelector.container.offsetLeft + 250;
        yLoc = backgroundColorSelector.container.offsetTop;
    }

    xLoc = cx - xLoc;
    yLoc = cy - yLoc;

    return (xLoc >= 0 && xLoc <= 150 &&
            yLoc >= 0 && yLoc <= 250);
}

function onDocumentMouseDown( event )
{
    if (!isMenuMouseOver && !isEventInColorSelector(event.clientX, event.clientY))
        event.preventDefault();
}

function onDocumentMouseOut( event )
{
    onCanvasMouseUp();
}

function onDocumentDragEnter( event )
{
    event.stopPropagation();
    event.preventDefault();
}

function onDocumentDragOver( event )
{
    event.stopPropagation();
    event.preventDefault();
}

function onDocumentDrop( event )
{
    event.stopPropagation();
    event.preventDefault();

    var file = event.dataTransfer.files[0];

    if (file.type.match(/image.*/))
    {
        /*
         * TODO: This seems to work on Chromium. But not on Firefox.
         * Better wait for proper FileAPI?
         */

        var fileString = event.dataTransfer.getData('text').split("\n");
        document.body.style.backgroundImage = 'url(' + fileString[0] + ')';
    }
}


// COLOR SELECTORS

function onForegroundColorSelectorChange( event )
{
    COLOR = foregroundColorSelector.getColor();

    menu.setForegroundColor( COLOR );

    if (STORAGE)
    {
        localStorage.brush_color_red = COLOR[0];
        localStorage.brush_color_green = COLOR[1];
        localStorage.brush_color_blue = COLOR[2];
    }
	
	////////////////////////tarek////////////////////////////////////////tarek//////////////////////
	{
         brush.destroy();
         brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");
         }
		 
		 //////////////////////////////////////////////
}

function onBackgroundColorSelectorChange( event )
{
    BACKGROUND_COLOR = backgroundColorSelector.getColor();

    menu.setBackgroundColor( BACKGROUND_COLOR );

    document.body.style.backgroundColor = 'rgb(' + BACKGROUND_COLOR[0] + ', ' + BACKGROUND_COLOR[1] + ', ' + BACKGROUND_COLOR[2] + ')';

    if (STORAGE)
    {
        localStorage.background_color_red = BACKGROUND_COLOR[0];
        localStorage.background_color_green = BACKGROUND_COLOR[1];
        localStorage.background_color_blue = BACKGROUND_COLOR[2];
    }
	
	
	////////////////////////tarek////////////////////////////////////////tarek//////////////////////
	{
         brush.destroy();
         brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");
         }
		 
		 //////////////////////////////////////////////
}


// MENU

function onMenuForegroundColor()
{
    cleanPopUps();

    foregroundColorSelector.show();
    foregroundColorSelector.container.style.left = ((SCREEN_WIDTH - foregroundColorSelector.container.offsetWidth) / 2) + 'px';
    foregroundColorSelector.container.style.top = ((SCREEN_HEIGHT - foregroundColorSelector.container.offsetHeight) / 2) + 'px';

    isFgColorSelectorVisible = true;
}

function onMenuBackgroundColor()
{
    cleanPopUps();

    backgroundColorSelector.show();
    backgroundColorSelector.container.style.left = ((SCREEN_WIDTH - backgroundColorSelector.container.offsetWidth) / 2) + 'px';
    backgroundColorSelector.container.style.top = ((SCREEN_HEIGHT - backgroundColorSelector.container.offsetHeight) / 2) + 'px';

    isBgColorSelectorVisible = true;
}

function onMenuSelectorChange()
{
    if (BRUSHES[menu.selector.selectedIndex] == "")
        return;

    brush.destroy();
    brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");

    window.location.hash = BRUSHES[menu.selector.selectedIndex];
}

function onMenuMouseOver()
{
    isMenuMouseOver = true;
}

function onMenuMouseOut()
{
    isMenuMouseOver = false;
}

function onMenuSave()
{
    saveToLocalStorage();
	///////////////tarek//////////////////////

		//////////////////////////////////////////
}

var zoomflag = false;
var largee = true;
function onMenuExportImage()
{

   //  window.open(canvas.toDataURL('image/png'),'mywindow');
  //  flatten();

   // it was for exporting the image now it zoom out
 if(zoomflag== false){  
	    canvas.style.width = SCREEN_WIDTH;
        canvas.style.height = SCREEN_HEIGHT;
		
	 canvas.style.top = 0+'px';
	 canvas.style.left = 0+'px';
	 largee = false;
	 
	 zoomflag = true;
	 }
	 else  if(zoomflag== true){  
	    canvas.style.width = SCREEN_WIDTH*2;
        canvas.style.height = SCREEN_HEIGHT*1.9552;
		
	 canvas.style.top = 0+'px';
	 canvas.style.left = 0+'px';
	  zoomflag = false;
	  largee = true;
	 }
		
	// for phonegap

////phonegap	
		
}

function onCanvasTouchMove( event )
{
// this function i for two fingers drawing.
// var largee is to fix the position in case of full screen of case 2


    if(event.touches.length == 2)
    {
	///////////////////tarek draw two fingers //////////////////////
        event.preventDefault();
//brush.strokeStart( (event.touches[0].pageX+event.touches[1].pageX)/2 - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)/2 - canvas.offsetTop ); 

		if(largee == true)//case 1
		{
        brush.stroke( (event.touches[0].pageX+event.touches[1].pageX)/2 - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)/2 - canvas.offsetTop ); 
        }else if(largee == false)//case 2
		{
        brush.stroke( (event.touches[0].pageX+event.touches[1].pageX) - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)*.9775 - canvas.offsetTop ); 
        }
	////////////////////////////////////////////////////////////////
	
	
	
	
    }
}



function onMenuResetBrush()
{
    rebuildBrush();
}

function onMenuClear()
{
    if (!confirm("Are you sure?"))
        return;

    context.clearRect(0, 0, SCREEN_WIDTH*2, SCREEN_HEIGHT*2);

    saveToLocalStorage();


    brush.destroy();
    brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");
	
			///////////////////tarek//////////////////////
	    context.textBaseline = "top";                // start with drawing text from top
    context.font = "14px sans-serif";            // set a font and size
    context.fillStyle = "gray";                   // set a color for the text
    context.fillText("qp2qp.com", 0, 0);       // draw the text at some position (x, y)
	////////////////////////////////////////////////////////////
	
}

function onMenuAbout()
{
   // cleanPopUps();

   // isAboutVisible = true;
   // about.show();
	
	location.reload();
}


// CANVAS

function onCanvasMouseDown( event )
{
    var data, position;

    clearTimeout(saveTimeOut);
    cleanPopUps();

    if (altKeyIsDown)
    {
        flatten();

        data = flattenCanvas.getContext("2d").getImageData(0, 0, flattenCanvas.width, flattenCanvas.height).data;
        position = (event.clientX + (event.clientY * canvas.width)) * 4;

        foregroundColorSelector.setColor( [ data[position], data[position + 1], data[position + 2] ] );

        return;
    }

    BRUSH_PRESSURE = wacom && wacom.isWacom ? wacom.pressure : 1;

    brush.strokeStart( event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop );

    window.addEventListener('mousemove', onCanvasMouseMove, false);
    window.addEventListener('mouseup', onCanvasMouseUp, false);
}

//tarek delete///
//function onCanvasMouseMove( event )
//{
//    BRUSH_PRESSURE = wacom && wacom.isWacom ? wacom.pressure : 1;

//    brush.stroke( event.clientX - canvas.offsetLeft, event.clientY - canvas.offsetTop );
//}

//tarek delete /////
//function onCanvasMouseUp()
//{
//    brush.strokeEnd();

//    window.removeEventListener('mousemove', onCanvasMouseMove, false);
//    window.removeEventListener('mouseup', onCanvasMouseUp, false);

//    if (STORAGE)
//    {
//        clearTimeout(saveTimeOut);
//        saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
 //   }
//}


//

function showFGColorPickerAtLocation(loc) {
    foregroundColorSelector.show();
    foregroundColorSelector.container.style.left = (loc[0] - (foregroundColorSelector.container.offsetWidth / 2)) + 'px';
    foregroundColorSelector.container.style.top = (loc[1] - (foregroundColorSelector.container.offsetHeight / 2)) + 'px';

    isFgColorSelectorVisible = true;
	
	
}

function averageTouchPositions(touches) {
    var touchLength = touches.length;
    var average = [0,0];

    for (var i = 0; i < event.touches.length; ++i) {
        var touch = event.touches[i];
        average[0] += touch.pageX;
        average[1] += touch.pageY;
    }
    average[0] = average[0] / touches.length;
    average[1] = average[1] / touches.length;

    return average;
}

function distance(a, b) {
    var dx=a.pageX-b.pageX;
    var dy=a.pageY-b.pageY;
    return Math.sqrt(dx*dx + dy*dy);
}

function onCanvasTouchStart( event )
{
    clearTimeout(saveTimeOut);
    cleanPopUps();

    if(event.touches.length == 2)
    {
        // draw
        event.preventDefault();
		
//brush.strokeStart( (event.touches[0].pageX+event.touches[1].pageX)/2 - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)/2 - canvas.offsetTop ); 
/////////////////////////////////////////////////////	
// var largee to fix position large or small screen	
if (largee == true)
{
        brush.strokeStart( (event.touches[0].pageX+event.touches[1].pageX)/2 - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)/2 - canvas.offsetTop ); 
}
else if (largee == false)
{
        brush.strokeStart( (event.touches[0].pageX+event.touches[1].pageX) - canvas.offsetLeft, (event.touches[0].pageY+event.touches[1].pageY)*.9775 - canvas.offsetTop ); 
}
////////////////////////////////////////////////////////////////////////////////////
        window.addEventListener('touchmove', onCanvasTouchMove, false);
        window.addEventListener('touchend', onCanvasTouchEnd, false);
		//// tarek
		//     canvas.style.width = SCREEN_WIDTH*2;
       // canvas.style.height = SCREEN_HEIGHT*2;
		////// after touch with two finger it zoom in again

		
    }
    else if (event.touches.length == 1)
    {
        // brush size
        event.preventDefault();

        brushSizeTouchReference = distance(event.touches[0], event.touches[0]);
        brushSizeTouchStart = BRUSH_SIZE;

        window.addEventListener('touchmove', onBrushSizeTouchMove, false);
        window.addEventListener('touchend', onBrushSizeTouchEnd, false);
		
				        ////tarek screen move code edit 2 /////
				window.addEventListener('touchmove', onCanvasTouchscroll, false);
				event.preventDefault();
				////tarek screen move code edit 2 /////
			

		//// tarek
		  //   canvas.style.width = SCREEN_WIDTH*2;
      //  canvas.style.height = SCREEN_HEIGHT*2;
		////// after touch with two finger it zoom in again			
				
    }
    else if (event.touches.length == 4)
    {
        // foreground color
        event.preventDefault();

        var loc = averageTouchPositions(event.touches);
        showFGColorPickerAtLocation(loc);

        window.addEventListener('touchmove', onFGColorPickerTouchMove, false);
        window.addEventListener('touchend', onFGColorPickerTouchEnd, false);
		
		
		
	
		
		
    }
    else if (event.touches.length == 4)
    {
        // reset brush
        event.preventDefault();
        window.addEventListener('touchend', onResetBrushTouchEnd, false);
    }
	
	 else if (event.touches.length == 3)
    {
	window.addEventListener('touchmove', onCanvasTouchzoom, false);
	}
}


////tarek screen move code edit 2 /////
var targetStartX, targetStartY, touchStartX, touchStartY;

function onCanvasTouchscroll( event )
{

    if(event.touches.length == 1 && canvas.offsetLeft<=0&& canvas.offsetTop<=0  && (canvas.offsetWidth+canvas.offsetLeft)>=canvas.offsetWidth/2&& (canvas.offsetHeight+canvas.offsetTop)>=canvas.offsetHeight/2 && largee==true) // originally it was if(event.touches.length == 1) the rest of the line is to prevent scrolling beyond borders..largee will disable moving in the zoom out mode
    {
    targetStartX = parseInt(event.target.style.left);
    targetStartY = parseInt(event.target.style.top);
    touchStartX  = event.touches[0].pageX;
    touchStartY  = event.touches[0].pageY;

    var touchOffsetX = (event.touches[0].pageX - touchStartX)/10,
    touchOffsetY = (event.touches[0].pageY - touchStartY)/10; 

      setTimeout(function(){    
         var touchOffsetX = (-event.touches[0].pageX + touchStartX)/10,
         touchOffsetY = (-event.touches[0].pageY + touchStartY)/10;

         canvas.style.top = targetStartY + touchOffsetY + 'px';
         canvas.style.left = targetStartX + touchOffsetX + 'px'; 
      }, 200);
   }
 
  
}




var touchStartzoomX, touchStartzoomY,touchStartzoom,touchEndzoom;
function onCanvasTouchzoom( event )
{

/*
if(event.touches.length == 3)
    {
	
	
	
	
              touchStartzoomX  = ((event.touches[0].pageX)-(event.touches[1].pageX))*((event.touches[0].pageX)-(event.touches[1].pageX));
              touchStartzoomY  = ((event.touches[0].pageY)-(event.touches[1].pageY))*((event.touches[0].pageY)-(event.touches[1].pageY));
			  touchStartzoom = Math.sqrt( touchStartzoomX + touchStartzoomY);

   //  var zoomOffsetX = SCREEN_WIDTH*2*(touchStartzoomX/touchEndzoomX),
   //   zoomOffsetY = SCREEN_HEIGHT*2*(touchStartzoomY/touchEndzoomY); // Calculate touch
   var zoomOffsetX = SCREEN_WIDTH*2*(touchStartzoom/touchEndzoom);
   var zoomOffsetY = SCREEN_HEIGHT*2*(touchStartzoom/touchEndzoom);
	
	if(touchStartzoom>1.1*touchEndzoom){
	    canvas.style.width = SCREEN_WIDTH*2;
        canvas.style.height = SCREEN_HEIGHT*1.9552;
		
			 canvas.style.top = -window.innerHeight/2+'px';//to centre the canvas
	 canvas.style.left = -window.innerWidth/2+'px';//to centre the canvas

		}
		else if(touchStartzoom<0.9*touchEndzoom){
	    canvas.style.width = SCREEN_WIDTH/1.2;
        canvas.style.height = SCREEN_HEIGHT/1.2;
		
	 canvas.style.top = SCREEN_HEIGHT/10+'px';//to centre the canvas
	 canvas.style.left = SCREEN_WIDTH/10+'px';//to centre the canvas
	 
		}

		
		setTimeout(function(){ 	
		
              touchEndzoomX  = ((event.touches[0].pageX)-(event.touches[1].pageX))*((event.touches[0].pageX)-(event.touches[1].pageX));
              touchEndzoomY  = ((event.touches[0].pageY)-(event.touches[1].pageY))*((event.touches[0].pageY)-(event.touches[1].pageY));
		      touchEndzoom = Math.sqrt( touchEndzoomX + touchEndzoomY);

		 
		  
		  }, 500);

	}else if(event.touches.length == 2){	    
	canvas.style.width = SCREEN_WIDTH*2; /////need edit tarek
        canvas.style.height = SCREEN_HEIGHT*1.9552;/////need edit tarek
		}
}
*/
/*
if(event.touches.length == 3)
    {
	
     canvas.style.width = SCREEN_WIDTH;
        canvas.style.height = SCREEN_HEIGHT;
		
					 canvas.style.top = 0+'px';//to centre the canvas
	 canvas.style.left = 0+'px';//to centre the canvas

	}else if(event.touches.length == 2){	    
	canvas.style.width = SCREEN_WIDTH*2; /////need edit tarek
        canvas.style.height = SCREEN_HEIGHT*1.9552;/////need edit tarek
					 canvas.style.top = -window.innerHeight/2+'px';//to centre the canvas
	 canvas.style.left = -window.innerWidth/2+'px';//to centre the canvas
		}
		//else if(event.touches.length == 1){	    
	//canvas.style.width = SCREEN_WIDTH*2; /////need edit tarek
     //   canvas.style.height = SCREEN_HEIGHT*1.9552;/////need edit tarek

		//}
		else if(event.touches.length == 0){	    
	canvas.style.width = SCREEN_WIDTH*2; /////need edit tarek
        canvas.style.height = SCREEN_HEIGHT*1.9552;/////need edit tarek
					 canvas.style.top = -window.innerHeight/2+'px';//to centre the canvas
	 canvas.style.left = -window.innerWidth/2+'px';//to centre the canvas
		}*/
}





//////////////////////////////////////////////////////



function onCanvasTouchEnd( event )
{
    if(event.touches.length == 0)
    {
        event.preventDefault();

        brush.strokeEnd();

        window.removeEventListener('touchmove', onCanvasTouchMove, false);
        window.removeEventListener('touchend', onCanvasTouchEnd, false);
		
		
				        ////tarek screen move code edit 2 /////
				 window.removeEventListener('touchmove', onCanvasTouchscroll, false);
				////tarek screen move code edit 2 /////
		
		
		////////////////////tarek////////////////////////////
		
//////////////////////////////////////////////////

        if (STORAGE)
        {
            clearTimeout(saveTimeOut);
            saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
        }
    }
	
	
}

function rebuildBrush()
{
    brush.destroy();
    brush = eval("new " + BRUSHES[menu.selector.selectedIndex] + "(context)");
}

function onResetBrushTouchEnd( event )
{
    if (event.touches.length == 0)
    {
        event.preventDefault();
        rebuildBrush();
        window.removeEventListener('touchend', onResetBrushTouchEnd, false);

        if (STORAGE)
        {
            clearTimeout(saveTimeOut);
            saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
        }
    }
}

function onFGColorPickerTouchMove( event )
{
    if (event.touches.length == 4)
    {
        event.preventDefault();
        var loc = averageTouchPositions(event.touches);
        foregroundColorSelector.container.style.left = (loc[0] - (foregroundColorSelector.container.offsetWidth / 2)) + 'px';
        foregroundColorSelector.container.style.top = (loc[1] - (foregroundColorSelector.container.offsetHeight / 2)) + 'px';
		
		
    }
}

function onFGColorPickerTouchEnd( event )
{
    if (event.touches.length == 0)
    {
        event.preventDefault();

        window.removeEventListener('touchmove', onFGColorPickerTouchMove, false);
        window.removeEventListener('touchend', onFGColorPickerTouchEnd, false);

        if (STORAGE)
        {
            clearTimeout(saveTimeOut);
            saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
        }
    }
}

function onBrushSizeTouchMove( event )
{
    if (event.touches.length == 1)
    {
        event.preventDefault();

        var size = brushSizeTouchStart + (distance(event.touches[0], event.touches[0]) - brushSizeTouchReference) / 4;
        BRUSH_SIZE = Math.max(Math.min(Math.floor(size), 320), 1);
    }
}

function onBrushSizeTouchEnd( event )
{
    if (event.touches.length == 0)
    {
        event.preventDefault();

        window.removeEventListener('touchmove', onBrushSizeTouchMove, false);
        window.removeEventListener('touchend', onBrushSizeTouchEnd, false);

        if (STORAGE)
        {
            clearTimeout(saveTimeOut);
            saveTimeOut = setTimeout(saveToLocalStorage, 2000, true);
        }
    }
}

//

function saveToLocalStorage()
{
    localStorage.canvas = canvas.toDataURL('image/png');
}

function flatten()
{
    var context = flattenCanvas.getContext("2d");

    context.fillStyle = 'rgb(' + BACKGROUND_COLOR[0] + ', ' + BACKGROUND_COLOR[1] + ', ' + BACKGROUND_COLOR[2] + ')';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(canvas, 0, 0);
}

function cleanPopUps()
{
    if (isFgColorSelectorVisible)
    {
        foregroundColorSelector.hide();
        isFgColorSelectorVisible = false;
    }

    if (isBgColorSelectorVisible)
    {
        backgroundColorSelector.hide();
        isBgColorSelectorVisible = false;
    }

    if (isAboutVisible)
    {
        about.hide();
        isAboutVisible = false;
    }
}



////////////////////////tarek////////////////////////////
function onDeviceReady()
{
    window.canvas2ImagePlugin.saveImageDataToLibrary(
        function(msg){
            console.log(msg);
        },
        function(err){
            console.log(err);
        },
        document.getElementById('myCanvas')
    );
}
/////////////////////////////////////////////////////////////////background tarek////////////////

/*
$(switchBackground);
    var oFReader = new FileReader(),
        rFilter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;

    oFReader.onload = function(oFREvent) {
        localStorage.setItem('b', oFREvent.target.result);
        switchBackground();
		
    };

    function switchBackground() {
	
      $('body').css('background-image', "url(" + localStorage.getItem('b') + ')');
	  
	  var delay=60000; //1 minute

setTimeout(function () {
   document.body.style.backgroundImage = 'none';
   localStorage.clear();

////sound///
//var audio = new Audio('Pucker_Up.mp3');
//audio.play();
//////

   

}, delay);

    }

    function loadImageFile(testEl) {
      if (! testEl.files.length) { return; }
      var oFile = testEl.files[0];
      if (!rFilter.test(oFile.type)) { alert("You must select a valid image file!"); return; }
      oFReader.readAsDataURL(oFile);
	  window.confirm("background image remain for 1 minute  صورة الخلفية تبقى لدقيقة واحدة");
	  localStorage.clear();
    }
	
	function emptyBg() {
   // document.body.style.backgroundImage = 'none';
	   localStorage.clear();
	 return false;
}
*/

