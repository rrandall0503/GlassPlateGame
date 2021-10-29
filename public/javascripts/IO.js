//TODOs
//to be able to drag the tiles of the connection palete to cards to attempt to add connection
//  add drag properties to palete tiles
//  add listener (or whatever works) to cards to find the tile being dropped on it
//  move palete tile back to its spot
//  check if move is valid
//  if is, make the move
//to be able to click the dice and attempt to turn them to another side (ie make a challenge, permit, ect)
//  pop up menu near die of actions to make with the die
//  select items on the dropdown
//  attempt to make the action
//  set the card.dieState to correct value




let type = "WebGL";
if (!PIXI.utils.isWebGLSupported()) {
    type = "canvas";
}

PIXI.utils.sayHello(type);


//layout variables
let layout = {
    cardSize: 600,
    tileSize: 60,
    boardHeight: 2000,
    boardWidth: 3000,
    //boardSize: 1500
}



const PIXIapp = new PIXI.Application({
    width: layout.boardWidth,
    height: layout.boardHeight,
    //resizeTo: document.getElementById("divBoard"),
    antialias: true,
    transparent: false,
    resolution: 1
});



let ticker = PIXI.Ticker.shared;
ticker.autoStart = false;
ticker.stop();

//card representated by
//{
//  name:string, (must be exactly as in the card's image)
//  connections: [redbool,greenbool,bluebool,yellowbool],
//  dieState: string ("blank", okay", "permit", or "challenge")
//  cardFlipped: bool,
//}

let colors = {
    red: 0xff0000,
    green: 0x00ff00,
    blue: 0x0000ff,
    yellow: 0xffff00
}

//to be pulled from gamestate code
let cards;
let scale = 1;
let zoomIncrement = 0.01;

function pixiStart(boardState){

  cards = boardState;

  cards.forEach(load);
  PIXI.Loader.shared.load(setup);
  document.getElementById("divBoard").appendChild(PIXIapp.view);
};

//load all textures here, then setup is called
function load(item){
  if(PIXI.Loader.shared.resources["../images/4x4x150cards/" + item.name + ".png"] === undefined){
    PIXI.Loader.shared.add("../images/4x4x150cards/" + item.name + ".png");
    PIXI.Loader.shared.add("../images/4x4x150cards/" + item.name + "_text.png");
  }
}

function sendState(){

  let board = []

  cards.forEach((item) => {
    board.push(
      {
          name: item.name,
          connections: item.connections,
          dieState: item.dieState,
          cardFlipped: item.cardFlipped,
      }
    )
  });

  const gameDataOut = {
    "method": "play",
    "playerId": playerId,
    "gameId": gameId,
    "boardState": board
  }

  ws.send(JSON.stringify(gameDataOut));
}




//interface for adding connections
let connectPalate = null;

//interface for zooming in and out
let zoomControl = null;

function setup() { //sets all cards up with their default states

    cards.forEach(cardSetup);



    ticker.add(function (time) {
      //Update tiles and die state
      for (let i = 0; i < cards.length; i++){
        switch (cards[i].dieState) {
          case "blank":
            cards[i].container.getChildAt(6).text = "";
            break;
          case "okay":
            cards[i].container.getChildAt(6).text = "O";
            break;
          case "permit":
            cards[i].container.getChildAt(6).text = "P";
            break;
          case "challenge":
            cards[i].container.getChildAt(6).text = "C";
            break;
          default:
            console.log("Die state not recognied");
        }
        cards[i].container.getChildAt(1).visible = cards[i].connections[0];
        cards[i].container.getChildAt(2).visible = cards[i].connections[1];
        cards[i].container.getChildAt(3).visible = cards[i].connections[2];
        cards[i].container.getChildAt(4).visible = cards[i].connections[3];
        cards[i].container.getChildAt(0).getChildAt(0).visible = cards[i].cardFlipped;
      }

      //Update card position and scale
      let rowWidth = Math.floor(layout.boardWidth / (layout.cardSize * scale * 1.5));

      cards.forEach((item, i) => {
        item.container.scale.set(scale);

        item.container.position.set((layout.boardWidth/(rowWidth+1)) * ( (i%rowWidth) + 1),
                                    (layout.cardSize * scale * 1.2) * ((i-(i%rowWidth))/rowWidth) + (layout.cardSize * scale * 0.6));
      });

      connectPalate.scale.set(scale);

    }); //card state update from internal, every frame


    setupPalate();
    setupZoom();

    ticker.start();


}

function setupZoom(){
  zoomControl = new PIXI.Container();
  zoomControl.height = 2*layout.tileSize;
  zoomControl.width = layout.tileSize;
  zoomControl.zindex = 3;
  zoomControl.pivot.set(layout.tileSize, 0);
  zoomControl.position.set(layout.boardWidth,0);

  zoomControl.addChild(
    new PIXI.Graphics().lineStyle(10,0x000000).beginFill(0xd2b48c).drawRect(0,0,layout.tileSize,layout.tileSize).endFill().drawRect(0,0,layout.tileSize,layout.tileSize),
    new PIXI.Graphics().lineStyle(10,0x000000).beginFill(0xd2b48c).drawRect(0,layout.tileSize,layout.tileSize,layout.tileSize).endFill().drawRect(0,0,layout.tileSize,layout.tileSize)
  )
  zoomControl.getChildAt(0).addChild(new PIXI.Text("+"));
  zoomControl.getChildAt(0).getChildAt(0).height = 0.8 * layout.tileSize;
  zoomControl.getChildAt(0).getChildAt(0).anchor.set(0.5,0.5);
  zoomControl.getChildAt(0).getChildAt(0).position.set(layout.tileSize/2,layout.tileSize/2);
  zoomControl.getChildAt(0).on("click", plusZoom);
  zoomControl.getChildAt(0).interactive = true;

  zoomControl.getChildAt(1).addChild(new PIXI.Text("-"));
  zoomControl.getChildAt(1).getChildAt(0).height = 0.8 * layout.tileSize;
  zoomControl.getChildAt(1).getChildAt(0).anchor.set(0.5,0.5);
  zoomControl.getChildAt(1).getChildAt(0).position.set(layout.tileSize/2,layout.tileSize*3/2);
  zoomControl.getChildAt(1).on("click", minusZoom);
  zoomControl.getChildAt(1).interactive = true;

  PIXIapp.stage.addChild(zoomControl);
}

function plusZoom(){
  scale += zoomIncrement;
}

function minusZoom(){
  scale -= zoomIncrement;
}


function setupPalate(){
    connectPalate = new PIXI.Container();
    connectPalate.height = layout.tileSize * 4;
    connectPalate.width = layout.tileSize;
    connectPalate.zIndex = 3;
    connectPalate.pivot.set(layout.tileSize, layout.tileSize*2);
    connectPalate.position.set(layout.boardWidth, layout.boardHeight / 2);
    connectPalate.addChild(
        new PIXI.Graphics().beginFill(0xff0000).drawRect(0,0,layout.tileSize,layout.tileSize).endFill(),
        new PIXI.Graphics().beginFill(0x00ff00).drawRect(0,0,layout.tileSize,layout.tileSize).endFill(),
        new PIXI.Graphics().beginFill(0x0000ff).drawRect(0,0,layout.tileSize,layout.tileSize).endFill(),
        new PIXI.Graphics().beginFill(0xffff00).drawRect(0,0,layout.tileSize,layout.tileSize).endFill()
    );

    connectPalate.getChildAt(0).interactive = true;
    connectPalate.getChildAt(0).buttonMode = true;
    connectPalate.getChildAt(0).zIndex = 5;
    connectPalate.getChildAt(0).color = colors.red;
    connectPalate.getChildAt(0).on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    connectPalate.getChildAt(1).interactive = true;
    connectPalate.getChildAt(1).buttonMode = true;
    connectPalate.getChildAt(1).zIndex = 5;
    connectPalate.getChildAt(1).color = colors.green;
    connectPalate.getChildAt(1).on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    connectPalate.getChildAt(2).interactive = true;
    connectPalate.getChildAt(2).buttonMode = true;
    connectPalate.getChildAt(2).zIndex = 5;
    connectPalate.getChildAt(2).color = colors.blue;
    connectPalate.getChildAt(2).on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    connectPalate.getChildAt(3).interactive = true;
    connectPalate.getChildAt(3).buttonMode = true;
    connectPalate.getChildAt(3).zIndex = 5;
    connectPalate.getChildAt(3).color = colors.yellow;
    connectPalate.getChildAt(3).on('pointerdown', onDragStart)
        .on('pointerup', onDragEnd)
        .on('pointerupoutside', onDragEnd)
        .on('pointermove', onDragMove);

    connectPalate.getChildAt(0).position.set(0,0);
    connectPalate.getChildAt(0).home_x = connectPalate.getChildAt(0).x;
    connectPalate.getChildAt(0).home_y = connectPalate.getChildAt(0).y;

    connectPalate.getChildAt(1).position.set(0,layout.tileSize * 1);
    connectPalate.getChildAt(1).home_x = connectPalate.getChildAt(1).x;
    connectPalate.getChildAt(1).home_y = connectPalate.getChildAt(1).y;

    connectPalate.getChildAt(2).position.set(0,layout.tileSize * 2);
    connectPalate.getChildAt(2).home_x = connectPalate.getChildAt(2).x;
    connectPalate.getChildAt(2).home_y = connectPalate.getChildAt(2).y;

    connectPalate.getChildAt(3).position.set(0,layout.tileSize * 3);
    connectPalate.getChildAt(3).home_x = connectPalate.getChildAt(3).x;
    connectPalate.getChildAt(3).home_y = connectPalate.getChildAt(3).y;



    PIXIapp.stage.addChild(connectPalate);
}


function cardSetup(item){
    item.container = new PIXI.Container();
    item.container.height = 600;
    item.container.width = 600;
    item.container.pivot.set(layout.cardSize/2,layout.cardSize/2);
    item.container.addChild(new PIXI.Sprite(PIXI.Loader.shared.resources["../images/4x4x150cards/" + item.name + ".png"].texture),
                            new PIXI.Graphics().beginFill(0xff0000).drawRect(layout.tileSize/-2,layout.tileSize/-2,layout.tileSize,layout.tileSize).endFill(),
                            new PIXI.Graphics().beginFill(0x00ff00).drawRect(layout.tileSize/-2,layout.tileSize/-2,layout.tileSize,layout.tileSize).endFill(),
                            new PIXI.Graphics().beginFill(0x0000ff).drawRect(layout.tileSize/-2,layout.tileSize/-2,layout.tileSize,layout.tileSize).endFill(),
                            new PIXI.Graphics().beginFill(0xffff00).drawRect(layout.tileSize/-2,layout.tileSize/-2,layout.tileSize,layout.tileSize).endFill(),
                            new PIXI.Graphics().beginFill(0xd2b48c).drawRect(layout.tileSize/-2,layout.tileSize/-2,layout.tileSize,layout.tileSize).endFill(),
                            new PIXI.Text('', {"textBaseline": "alpahbetic"})
                           );

    //reference to card object in cards array
    item.container.cardParent = item;

    item.container.getChildAt(0).x = 0;
    item.container.getChildAt(0).y = 0;
    item.container.getChildAt(0).zIndex = 0;
    item.container.getChildAt(0).interactive = true;
    item.container.getChildAt(0).showingName = false;
    item.container.getChildAt(0).on('mouseover', showName)
        .on('mouseout', hideName)
        .on('pointerdown',showText)
        .on('pointerup', hideText);

    cardText = new PIXI.Container();
    cardText.height = 600;
    cardText.width = 600;
    cardText.zIndex = 1;
    cardText.addChild(new PIXI.Sprite(PIXI.Loader.shared.resources["../images/4x4x150cards/" + item.name + "_text.png"].texture));
    cardText.visible = false;
    item.container.getChildAt(0).addChild(cardText);

    item.container.getChildAt(1).x = layout.tileSize/2;
    item.container.getChildAt(1).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(1).zIndex = 1;
    item.container.getChildAt(1).alpha = 0.75;
    item.container.getChildAt(1).interactive = true;
    item.container.getChildAt(1).buttonMode = item.container.getChildAt(1).visible;
    item.container.getChildAt(1).on("pointerdown", hideRedConnect);

    item.container.getChildAt(2).x = layout.tileSize/2 + layout.tileSize;
    item.container.getChildAt(2).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(2).zIndex = 1;
    item.container.getChildAt(2).alpha = 0.75;
    item.container.getChildAt(2).interactive = true;
    item.container.getChildAt(2).buttonMode = item.container.getChildAt(2).visible
    item.container.getChildAt(2).on("pointerdown", hideGreenConnect);

    item.container.getChildAt(3).x = layout.tileSize/2 + layout.tileSize * 2;
    item.container.getChildAt(3).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(3).zIndex = 1;
    item.container.getChildAt(3).alpha = 0.75;
    item.container.getChildAt(3).interactive = true;
    item.container.getChildAt(3).buttonMode = item.container.getChildAt(3).visible
    item.container.getChildAt(3).on("pointerdown", hideBlueConnect);

    item.container.getChildAt(4).x = layout.tileSize/2 + layout.tileSize * 3;
    item.container.getChildAt(4).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(4).zIndex = 1;
    item.container.getChildAt(4).alpha = 0.75;
    item.container.getChildAt(4).interactive = true;
    item.container.getChildAt(4).buttonMode = item.container.getChildAt(4).visible
    item.container.getChildAt(4).on("pointerdown", hideYellowConnect);

    item.container.getChildAt(5).x = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(5).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(5).zIndex = 1;
    item.container.getChildAt(5).interactive = true;
    item.container.getChildAt(5).buttonMode = true;
    item.container.getChildAt(5).menuExist = false;
    item.container.getChildAt(5).on("pointerdown", popup);

    item.container.getChildAt(6).height = layout.tileSize/2;
    item.container.getChildAt(6).zIndex = 2;
    item.container.getChildAt(6).anchor.set(0.5);
    item.container.getChildAt(6).x = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(6).y = layout.cardSize - layout.tileSize/2;
    item.container.getChildAt(6).text = "";

    PIXIapp.stage.addChild(item.container);
}



//onDragStart, onDragEnd, and onDragMove inspired from https://pixijs.io/examples/index.html?s=demos&f=dragging.js&title=Dragging#/interaction/dragging.js
//allows for drag and drop functionality
function onDragStart(event) {
    this.data = event.data;
    this.alpha = 0.5;
    this.dragging = true;
}

function onDragEnd() {
    this.alpha = 1;
    this.dragging = false;
    this.data = null;

    for (let i = 0; i < cards.length; i++) {
        if(cards[i].container.getBounds().contains(this.getBounds().x, this.getBounds().y)){
            if(this.color == colors.red)
            {
                cards[i].connections[0] = true;
                sendState()
            }
            else if(this.color === colors.green)
            {
                cards[i].connections[1] = true;
                sendState()
            }
            else if(this.color === colors.blue)
            {
                cards[i].connections[2] = true;
                sendState()
            }
            else if(this.color === colors.yellow)
            {
                cards[i].connections[3] = true;
                sendState()
            }
            //break;
        }

    }
    this.x = this.home_x;
    this.y = this.home_y;

}

function onDragMove() {
    if (this.dragging) {
        const newPosition = this.data.getLocalPosition(this.parent);
        this.x = newPosition.x;
        this.y = newPosition.y;
    }
}

function popup(){
    if(this.menuExist === false){
        menu = new PIXI.Container();
        menu.interactive = true;
        menu.height = layout.tileSize * 4;
        menu.width = layout.tileSize * 4;
        menu.zIndex = 10;
        menu.addChild(
            new PIXI.Graphics().beginFill(0xff0000).drawRect(0,0,layout.tileSize * 4,layout.tileSize).endFill(),
            new PIXI.Graphics().beginFill(0x00ff00).drawRect(0,0,layout.tileSize * 4,layout.tileSize).endFill(),
            new PIXI.Graphics().beginFill(0x0000ff).drawRect(0,0,layout.tileSize * 4,layout.tileSize).endFill(),
            new PIXI.Graphics().beginFill(0xffff00).drawRect(0,0,layout.tileSize * 4,layout.tileSize).endFill()
        );

        menu.getChildAt(0).position.set(0,0);
        menu.getChildAt(0).interactive = true;
        menu.getChildAt(0).on("pointerdown", setBlank);
        menu.getChildAt(0).zIndex = 10;
        blank = new PIXI.Text('blank', {"textBaseline": "alpahbetic"});
        menu.getChildAt(0).addChild(blank);
        blank.x = layout.tileSize;
        blank.y = layout.tileSize/4;

        menu.getChildAt(1).position.set(0,layout.tileSize * 1);
        menu.getChildAt(1).interactive = true;
        menu.getChildAt(1).on("pointerdown", setOkay);
        menu.getChildAt(1).zIndex = 10;
        okay = new PIXI.Text('okay', {"textBaseline": "alpahbetic"});
        menu.getChildAt(1).addChild(okay);
        okay.x = layout.tileSize;
        okay.y = layout.tileSize/4;

        menu.getChildAt(2).position.set(0,layout.tileSize * 2);
        menu.getChildAt(2).interactive = true;
        menu.getChildAt(2).on("pointerdown", setPermit);
        menu.getChildAt(2).zIndex = 10;
        permit = new PIXI.Text('permit', {"textBaseline": "alpahbetic"});
        menu.getChildAt(2).addChild(permit);
        permit.x = layout.tileSize;
        permit.y = layout.tileSize/4;

        menu.getChildAt(3).position.set(0,layout.tileSize * 3);
        menu.getChildAt(3).interactive = true;
        menu.getChildAt(3).on("pointerdown", setChallenge);
        menu.getChildAt(3).zIndex = 10;
        challenge = new PIXI.Text('challenge', {"textBaseline": "alpahbetic"});
        menu.getChildAt(3).addChild(challenge);
        challenge.x = layout.tileSize;
        challenge.y = layout.tileSize/4;

        menu.on("pointerdown", removePopup);

        this.addChild(menu);

        menu.x = -(layout.tileSize * 4) + (layout.tileSize / 2)
        menu.y = -(layout.tileSize * 4) - (layout.tileSize / 2)
    }
    this.menuExist = true;

}

//the following 4 set functions set the die state to the chosen state
function setBlank(){
    this.parent.parent.parent.cardParent.dieState = 'blank';
    sendState()
}

function setOkay(){
    this.parent.parent.parent.cardParent.dieState = 'okay';
    sendState()
}

function setPermit(){
    this.parent.parent.parent.cardParent.dieState = 'permit';
    sendState()
}

function setChallenge(){
    this.parent.parent.parent.cardParent.dieState = 'challenge';
    sendState()
}

//removes the popup menu
function removePopup(){
    this.parent.menuExist = false;
    this.destroy()
}

//the following 4 functions hides the connection tile on the card when the tile is clicked on
function hideRedConnect(){
    this.parent.cardParent.connections[0] = false;
    sendState()
}

function hideGreenConnect(){
    this.parent.cardParent.connections[1] = false;
    sendState()
}

function hideBlueConnect(){
    this.parent.cardParent.connections[2] = false;
    sendState()
}

function hideYellowConnect(){
    this.parent.cardParent.connections[3] = false;
    sendState()
}

//shows the cards name when event occurs
function showName(){
    if(this.showingName === false) {
        nameDisplay = new PIXI.Graphics().beginFill(0xD3D3D3).drawRect(0,0,layout.tileSize * 4,layout.tileSize).endFill();
        nameDisplay.interactive = true;
        nameDisplay.height = layout.tileSize ;
        nameDisplay.width = layout.tileSize * 4;
        nameDisplay.zIndex = 10;

        nameDisplay.addChild(new PIXI.Text(this.parent.cardParent.name, {"textBaseline": "alpahbetic"}))

        this.addChild(nameDisplay);

        nameDisplay.position.set(0,0);
        this.showingName = true;
    }
}

//hides the cards name when even occurs
function hideName() {
    if(this.showingName === true){
        this.getChildAt(1).destroy();
        this.showingName = false;
    }
}

function showText(){
    this.parent.cardParent.cardFlipped = true;
    sendState();
}

function hideText(){
    this.parent.cardParent.cardFlipped = false;
    sendState();
}
