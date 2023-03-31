
let ROWS    = 9;
let COLUMNS = 7;

let BACKGROUND = 'black';
let MARKED = 'white';
let font = "Arial";
var fontSize = 27;

var xBorder = 16;
var yBorder = 16;
var XD = 50;  // tile x dimension
var YD = 55;  // tile y dimension
var speed = 500; // ms between each frame, may increase with score?


var ctx;        // scene renderer
var gameClock;  // interval reference to stop game thread
var cols = [];  // stack of tiles in each column

var score = 0;
var scoredWords = [];  // list of words that have been scored

var scoringRow = null;  // set after a tile hits the bottom
var scoringCol = null   // indicates that the step is in scoring phase
var marked = false;

var currentTile = null; // dropping tile 
var nextUp = [];        // list of N next tiles to display 
var letterCache = "";   // buffer of jumbled word letters from server

var touchX = -1;
var windowLeftX = -1;
var windowRightX = -1;

var paused = false;
var gameOver = false;



// TODO : 
//   audio 
//   mobile scaling      
//   buttons for pause, configuration, etc
//   create a useful API server
//   better visuals,  tiles flip or change color when scoring

window.onload = init();


function init()
{
    // call API to async load some letters
    reloadLetterCache();
    
    letterCache = "LETTRIS" // zzzzasdf debug 

    let canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');
    
    // get size of viewing frame and adjust our scale units appropriately
    initScale();

    // resize canvas for the number of rows and columns needed
    ctx.canvas.width  = xBorder + ((COLUMNS + 5) * XD);
    ctx.canvas.height = yBorder + ((ROWS + 3) * YD);
    ctx.fillStyle = BACKGROUND;
    ctx.fillRect(xBorder, yBorder, COLUMNS*XD , ROWS*YD );
    
    // document.body.style.height  =  ctx.canvas.height  + 40;
    
    // initialize stack for each column
    for (let i=0; i < COLUMNS; i++)
       cols.push([]);
    
    // disable mouse scrolling over canvas
    canvas.onwheel = function(evt){ evt.preventDefault(); };
    
    // initialize key listener
    document.addEventListener('keydown', handleKey, true);
    
    // initialize touchscreen listeners
    windowLeftX = (window.innerWidth * 38) / 100;
    windowRightX = (window.innerWidth * 62) / 100;
    // windowBottomY = (window.innerHeight * 78) / 100;
    window.addEventListener("touchstart", processTouch1, true);
    // window.addEventListener('touchmove', processTouch2, true);  //'touchmove'
    
    // document.getElementById("paused").onclick = function(){pause();}
    
    // add some text on the canvas 
    setFont(-3);
    ctx.fillText("Up Next", xBorder + (COLUMNS * XD) + (3*XD/2) , yBorder + 25);
    ctx.fillText("Score", xBorder + (COLUMNS * XD) + (3*XD/2) , yBorder + (YD*5));
    updateScore(0);
    
    
    // start the game interval clock
    gameClock = setInterval(step, speed);
}


// initializes the tile X and Y dimensions as well as a base font size
//  which should hopefully be appropriate for mobile or browser formats
function initScale()
{
    
    XD = Math.floor(window.innerWidth / (COLUMNS+6));
    YD = Math.floor(XD * 1.15 );
     
    if( YD * (ROWS + 3 ) > window.innerHeight)
    {
       YD = Math.floor( (window.innerHeight-75) / (ROWS+3));
       XD = Math.floor(YD / 1.15);
    }
    
    fontSize = Math.floor( XD * .64 );
    xBorder  = Math.floor( XD * .35 );
    yBorder  = Math.floor( YD * .35 );
    
    // clientDebug("re-scaling...;" + window.innerWidth+";"+window.innerHeight+":"+ XD+";"+YD+";"+fontSize); // debug
}


function step()
{
   try
   {
      if (gameOver)
         return;
      
      if (marked)
      {
         // clear the marked words after scoring
         clear();      
         // see if anything new fell into place? 
         scoreRow(scoringRow, scoringCol);
         return;
      }
      
      if (currentTile == null)
      {
         // check for end game condition after each tile finishes scoring
         checkEndGame();       
         currentTile = getNextTile();
         return;
      }

      if (!currentTile.isBottom())
      {
         currentTile.drop();
         return;
      }
       
      cols[currentTile.xPos].push(currentTile);
      scoringRow = currentTile.yPos-1;
      scoringCol = currentTile.xPos;
      currentTile = null;
      scoreRow(scoringRow, scoringCol);
   }
   catch (error)
   {
      console.warn(error);
      debug();
   }
}


function checkEndGame()
{
   for (let i=0; i<COLUMNS; i++)
   {
      if (cols[i].length == ROWS)
      {
         gameOver = true;
         clearInterval(gameClock);
         writeBelow("Game Over!");
         return;
      }
   }
}

function getNextTile()
{   
   while(nextUp.length < 4)
   {
      let t = new Tile();
      if (t.letter == null)
         break;
      nextUp.push(t);
   }
    
   let t = nextUp.shift();
   if (t != null)
      t.start();
    
   for(let i=0;i<nextUp.length;i++)
      nextUp[i].queue(i);
       
   return t;
}

function scoreRow(row, col)
{
   var word = "";
   for (let i=0; i<COLUMNS; i++)
       word += cols[i].length <= row ? "_" : cols[i][row].letter;
   
   var result = validateWord(word);
    
    // console.log("testing " + row + "  " + word + " ||| "  + result );
    if (result == null)
    {
       scoreCol(scoringCol);
       return;
    }
    
    var splt = result.split(";")
    let len = parseInt(splt[0].length);
    col = parseInt(splt[1]);
    marked = true;
    
    for (var n=col; n<(col+len) ; n++)
    {
       //console.log("MARKING : " + (n) + " : " + row);
       cols[n][row].color = MARKED;
       cols[n][row].render();
    }
    
    // TODO : use color matching in scoring?
    updateScore(parseInt(splt[2]));
    updateScoredWords(splt[0]);
}

function scoreCol(col)
{
   var word = "";
   for (let i=cols[col].length-1; i>=0; i--)
      word += cols[col][i].letter;
    
    var result = validateWord(word);
    
    //console.log("testing " + col + "  " + word + " ||| "  + result );
    if (result == null)
       return;
   
   
    var splt = result.split(";")
    let len = parseInt(splt[0].length);
    marked = true;
    
    for (var n=0; n<len ; n++)
    {
       let y = cols[col].length - 1 - n;
       //console.log("MARKING : " + (n) + " : " + row);
       cols[col][y].color = MARKED;
       cols[col][y].render();
    }
    
    // TODO : use color matching in scoring?
    updateScore(parseInt(splt[2]));
    updateScoredWords(splt[0]);
}



function updateScoredWords(word)
{
   scoredWords.unshift(word);
   if (scoredWords.length > 5)
      scoredWords.pop();
       
   //ctx.fillStyle = 'blue'; // debug 
   ctx.clearRect(xBorder + (COLUMNS * XD) + (XD/2) - 2, 
                 yBorder + (YD*7)-2 , 15*fontSize , 8*fontSize);
   setFont(-3);
   ctx.textAlign = 'left';
   
   for (let i=0;i<scoredWords.length;i++)
   {
      ctx.fillText(scoredWords[i], 
              xBorder + (COLUMNS * XD) + (XD/2), 
              yBorder + (YD*7.2) + (i*(fontSize+1)) );
   }
}

function updateScore(points)
{
   score += points;
   
   //ctx.fillStyle = 'blue';  // debug 
   ctx.clearRect(xBorder + (COLUMNS * XD) + (XD/2), yBorder + (YD*5)+YD/3 ,fontSize*5,fontSize*2);
   setFont(-1);
   ctx.textAlign = 'center';
   ctx.fillText(score, xBorder + (COLUMNS * XD) + (3*XD/2), yBorder + (YD*5)+(fontSize*3/2));   
}

function setFont(dx)
{
   if(dx == null)
      dx = 0;
 
   let fnt = (fontSize + dx) + "px " + font;
   
   ctx.fillStyle = 'black';
   ctx.font = fnt;
   ctx.textAlign = 'center';
   ctx.textBaseline = 'middle';
}


function clear()
{
   for (let c=0; c<COLUMNS; c++)
   {
      var m = false;
      for (let r=0; r<cols[c].length; r++)
      {
         if (cols[c][r].color == MARKED )
         {
            m = true;
            // console.log("removing " + c + "  " + r + " " + cols[c][r].letter );
            cols[c][r].clear();  // stop rendering the tile at this row
            cols[c].splice(r,1); // remove the tile from this column
            r--;
         }
      }
      
      if (m == false)
         continue;
         
      for (let r=0; r<cols[c].length; r++)
      {
         cols[c][r].clear();
         cols[c][r].yPos = r+1;
         cols[c][r].render();
      }
   }
   
   marked = false;
}


// Synchronous function so we can resolve the rows before dropping the next tile 
function validateWord(word)
{
   if(word.length < 3)
      return null;
      
   const Http = new XMLHttpRequest();
   Http.open("GET", 'lettris&check='+word, false);
   Http.send();
   if (Http.status == 200)
      return Http.responseText;
   return null;
}


// async load adds to the word buffer in background
function reloadLetterCache()
{
   const Http = new XMLHttpRequest();
   Http.open("GET", 'lettris/loadWords', true );
   Http.send();
   Http.onreadystatechange = (e) => 
   {
       // readyState 0 : unsent
       // readyState 1 : opened
       // readyState 2 : header received
       // readyState 3 : loading
       // readyState 4 : done
       if (Http.readyState == 4)
          letterCache += Http.responseText;
   }
}


// keyboard input handler
function handleKey(event)
{
  //  if (event.keyCode < 100)
  //     event.preventDefault(); // prevent scrolling etc

    if (gameOver)
       return;

    // p|space : pause toggle
    if (event.keyCode == 80 || event.keyCode == 32)
    {
       pause();
       return;
    }
   
    if (paused || currentTile == null ||
         currentTile.yPos > ROWS || currentTile.isBottom())
    {
       return;
    }

    if (event.keyCode == 37) // left arrow
    {
       currentTile.moveLeft();
    }
    else if (event.keyCode == 39) // right arrow
    {
       currentTile.moveRight();
    }
    else if (event.keyCode == 40)  // down arrow
    {
       currentTile.drop();
    }
}


function processTouch2(event)
{
   
   clientDebug(event);
   return ;
   
   if(touchX == null)
      return;
      
   // TODO : zzzasdf init drag coordinate
   let xd = touchX - event.touches[0].clientX;
   clientDebug(xd);

   touchX = null;
   
   
   // don't allow movement if paused
    if (paused || currentTile == null ||
         currentTile.yPos > ROWS || currentTile.isBottom())
    {
       return;
    }

   // prevent dragging zooming etc
   event.preventDefault();
   
   if(xd < 0)
   {
      currentTile.moveLeft();
   }
   else if(xd > 0)
   {
      currentTile.moveRight();
   }
}

function processTouch1(event)
{
   // if tap the bottom portion of screen then toggle paused
   let ty = event.touches[0].clientY;
   
   let tx = event.touches[0].clientX;
   let xt = Math.floor(tx);
   
   if (ty < (yBorder - fontSize + YD*ROWS) && tx > (xBorder + XD*COLUMNS) ) 
   {
      pause();
      return;
   }

   // don't allow movement if paused
    if (paused || currentTile == null ||
         currentTile.yPos > ROWS || currentTile.isBottom())
    {
       return;
    }
    
    touchX = tx;

   // prevent dragging zooming etc
   event.preventDefault();

   // clientDebug("Touch;"+xt+";"+windowMidX);

   if(xt < (windowLeftX))
   {
      currentTile.moveLeft();
   }
   else if(xt > (windowRightX))
   {
      currentTile.moveRight();
   }
   else
   {
      currentTile.drop();
   }
}


// keep state to pause/resume the game clock
function pause()
{
   if (gameOver)
       return;
   
   if(paused)
   {
      let xp = xBorder + (1.5 * XD);
      let yp = yBorder + ((ROWS + .5) * YD);
      //ctx.fillStyle = "blue";  // debug
      //ctx.fillRect(xp,yp, 300,YD);
      ctx.clearRect(xp,yp, 275,YD);
      gameClock = setInterval(step, speed);
      paused = false;
   }
   else
   {
      paused = true;
      clearInterval(gameClock);
      writeBelow("Paused...");
   }
}

function writeBelow(text)
{
   let yp = yBorder + ((ROWS + 1) * YD);
   let xp = xBorder + (3.5 * XD);
   setFont(3);
   ctx.textAlign = 'center';
   ctx.fillText(text, xp, yp);
}


function getNextLetter()
{
   // if cache is getting low then send async req to the API for more letters
   if (letterCache.length < 11)
      reloadLetterCache();
   
   if (letterCache.length > 0)
   {
      var c = letterCache.charAt(0);
      letterCache = letterCache.slice(1);
      return c;
   }
   
   // if the server is too slow just return null and try again on the next step
   // console.warn("Slow Cache Reload!!!");
   return null;
}

function pickColor()
{   
   switch(Math.floor(Math.random()*8)) {
      case 0:
         return '#DA70D6'; // orchid
      case 1:
         return '#DAA520'; // goldenrod
      case 2:
         return '#90EE90'; // light green
      case 3:
         return '#7B68EE'; // slate blue
      case 4:
         return '#FFA500'; // orange
      case 5:
         return '#FF7F50'; // coral.  salmon
      case 6:
         return '#87CEEB'; // sky blue
      default:
         return '#DC143C'; // crimson
      //case X:
      //   return '#DCDCDC'; // greyish
   }
}



// on mobile it can be difficult to see console.log output
//  so this debug sends messages to be written on servers stdout
function clientDebug(msg)
{
   // ok for this to be async... just dumping a message to the server
   const Http = new XMLHttpRequest();
   Http.open("GET", 'lettris&debug='+msg, true);
   Http.send();
}


function debug()
{
   for (let i=ROWS; i>=0; i--)
   {
      var row = "";
      for (let c=0; c<COLUMNS; c++)
      {
         if (cols[c].length > i)
         {
             row += cols[c][i].letter;
         }
          else
          {
               row += " ";
          }
          row += ",";
      }
      console.log(row);
   }
}



class Tile
{
   xPos = null;
   yPos = null;
   letter = null;
   color = null;
   
   constructor()
   {
      this.color = pickColor();
      this.letter = getNextLetter();
   }
   
   render()
   {
      if (this.yPos >  ROWS)
          return;
      
      // calculate position of upper corner x and y
      let xp = xBorder + (this.xPos * XD);
      let yp = yBorder + ((ROWS - this.yPos) * YD);

      let r0 = xp + XD/2;
      let r1 = yp + YD/2;
      let grd = ctx.createRadialGradient(r0, r1, XD/100, r0, r1, XD);
      // render the tiles background color
      if(this.color == MARKED)
      {
         grd.addColorStop(0,"gold");
         grd.addColorStop(1, this.color);
      }
      else
      {
         grd.addColorStop(0,"white");
         grd.addColorStop(1,  this.color);
      }
      
      ctx.fillStyle = grd;
      ctx.fillRect(xp, yp, XD,YD);

      // render the letter
      setFont(4);
      ctx.textAlign = 'center';
      ctx.strokeText(this.letter, xp + XD/2, yp + YD/2);
   }
   
   clear()
   {
      if(this.xPos == null || this.yPos == null || this.yPos > ROWS )
          return;
      let xp = xBorder + (this.xPos * XD);
      let yp = yBorder + ((ROWS - this.yPos) * YD);
      
      if (this.xPos > COLUMNS)
         ctx.fillStyle = 'white';
      else
         ctx.fillStyle = BACKGROUND;
      ctx.fillRect(xp,yp, XD,YD);
   }
   
   isBottom()
   {
      // TODO : zzzz this needs some work... 
      return this.yPos == 0 || this.yPos <= cols[this.xPos].length + 1;
   }
   
   queue(pos)
   {
      this.clear();
      this.xPos = COLUMNS + 1;
      this.yPos =  ROWS - 1 - pos;   
      this.render();
   }
   
   start()
   {
      // move from the queue to the top/middle of the lane
      this.clear();
      this.xPos = Math.floor(COLUMNS/2);
      this.yPos = ROWS+1;
   }
   
   drop()
   {
      this.clear();
      this.yPos--;
      this.render();
   }
   
   moveLeft()
   {
      if (this.xPos <= 0) // not too far left
         return;
      
      // check for collision with neighboring column!
      if (this.yPos <= cols[this.xPos-1].length)
         return;

      this.clear();
      this.xPos--;
      this.render();
   }
   
   moveRight()
   {
      if (this.xPos >= COLUMNS-1) // not too far right
         return;
      
      // check for collision with neighboring column!
      if (this.yPos <= cols[this.xPos+1].length)
         return;

      this.clear();
      this.xPos++;
      this.render();
   }
}


