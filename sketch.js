canvasWidth = 0;
canvasHeight = 0;
canvasSize = 0;

windows = [];
events = []; // List of all events to be checked every frame, and how often they want to be run (in frames)
fires = [null,null,null,null,null,null,null,null,null,null,null];
frames = 0;

beingSolved = -1;
answerCooldown = 0;
correctAnswer = -1;
question = "";
answer = 0;
answer1 = 0;
answer2 = 0;
answer3 = 0;
showAnswer = 0;

score = 0;
sprinklerCooldown = 0;

splashProgress = -1;
splashTarget = 0;
splashes = [];
sprinklerSplashes = [];
splashTargetX = 0;
splashTargetY = 0;

fireToRemove = -1;

catTimer = 0;
catPos = -1;

doFireTutorial = true;
doSprinklerTutorial = true;
doCatTutorial = true;
doAnswerTutorial = true;

// Preload images
function preload(){
  backgroundImg = loadImage("assets/apartment.jpg")
  fireImg = loadImage("assets/fire.png")
  splashImg = loadImage("assets/droplet.png")
  catImg = loadImage("assets/cat.png")

  song = loadSound("assets/burn.mp3")
  song.setLoop(true);
  song.setVolume(0.3);

  splashSound = loadSound("assets/splash.mp3");
  splashSound.setVolume(0.75);

  incorrectSound = loadSound("assets/incorrect.mp3");
  incorrectSound.setVolume(0.5);

  correctSound = loadSound("assets/correct.mp3");
  correctSound.setVolume(0.5);
}

function setup() {
  // Make canvas as big as possible, without stretching the background image
  if (windowHeight < 1000 || windowWidth < 782){
    if ((windowHeight/1000) < (windowWidth)/782) {
      canvasHeight = (windowHeight/1000)*1000;
      canvasWidth = (windowHeight/1000)*782;
    }else{
      canvasHeight = (windowWidth/782)*1000;
      canvasWidth = (windowWidth/782)*782;
    }

  }else{
    canvasHeight = 1000;
    canvasWidth = 782;
  }

  canvasSize = canvasHeight/1000;

  windows =[[276,390],[366,390],[455,390],[276,539],[366,539],[455,539],[276,707],[366,707],[455,707],[276,887],[366,887]]

  for (i=0;i<11;i++){
    windows[i][0] = windows[i][0]*canvasSize;
    windows[i][1] = windows[i][1]*canvasSize;
  }
  createCanvas(canvasWidth, canvasHeight);

  answer1Collider = createSprite(canvasWidth/4,2*canvasHeight/3,125,50)
  answer2Collider = createSprite(2*canvasWidth/4,2*canvasHeight/3,125,50)
  answer3Collider = createSprite(3*canvasWidth/4,2*canvasHeight/3,125,50)

  answer1Collider.visible = false;
  answer2Collider.visible = false;
  answer3Collider.visible = false;

  cursor = createSprite(0,0,1,1);
  cursor.visible = false;

  sprinklerCollider = createSprite(3+canvasWidth/7,3+canvasHeight/20,canvasWidth/3.5,canvasHeight/10);
  sprinklerCollider.visible = false;

  song.play();

  start = [canvasWidth/2, canvasHeight];
  for (i=0;i<5;i++){
    splash = createSprite(start[0]*(1+0.1*i),start[1]*(1+0.1*i),1,1)
    splash.addImage(splashImg);
    splash.visible = false;
    splash.scale = 0.3;
    splashes.push(splash);
  }

  for (i=0;i<500;i++){
    splash = createSprite(start[0]*(1+0.1*i),start[1]*(1+0.1*i),1,1)
    splash.addImage(splashImg);
    splash.visible = false;
    splash.scale = 0.3;
    sprinklerSplashes.push(splash);
  }

  cat = createSprite(0,0,1,1);
  cat.addImage(catImg);
  cat.visible = false;
  cat.scale = 0.4;

  doTutorialVar = getItem("doTutorial");
  if (doTutorialVar == true || doTutorialVar == null){
    doTutorial = true;
  }else{
    doTutorial = false;
  }
}

function genSplash(x, y){
  start = [canvasWidth/2, canvasHeight];
  splashTargetX = x;
  splashTargetY = y;

  for (i=0;i<splashes.length;i++){
    splashes[i].visible = true;
    splashes[i].velocity.x = 0;
    splashes[i].velocity.y = 0;
    splashes[i].position.x = start[0]-(x-start[0])*(0.01*i)
    splashes[i].position.y = start[1]-(y-start[1])*(0.01*i)
    splashes[i].attractionPoint(5,x,y);
  }
}

function genSprinklerSplash(){
  for (i=0;i<sprinklerSplashes.length;i++){
    sprinklerSplashes[i].visible = true;
    sprinklerSplashes[i].position.x = canvasWidth/4 + Math.random()*canvasWidth/2;
    sprinklerSplashes[i].position.y = 0;
    sprinklerSplashes[i].velocity.y = 5+Math.random()*3;
  }
}

function spawnFire(){
  choice = Math.round(Math.random()*10)
  full = true;
  for (i=0;i<fires.length;i++){
    if (fires[i] == null && i != catPos){
      full = false;
      break;
    }
  }
  while (fires[choice] != null || choice == catPos){
    choice = Math.round(Math.random()*10)
  }

  fireSprite = createSprite(windows[choice][0],windows[choice][1]);
  fireSprite.addImage(fireImg);
  fireSprite.scale = 0.4;
  fires[choice] = fireSprite;
}
events.push([spawnFire,400]); // Register event

function spawnCat(){
  if (catPos != -1){
    return;
  }

  choice = Math.round(Math.random()*10)
  full = true;
  for (i=0;i<fires.length;i++){
    if (fires[i] == null){
      full = false;
      break;
    }
  }

  while (fires[choice] != null){
    choice = Math.round(Math.random()*10)
  }

  catPos = choice
  catTimer = 180;

  cat.position.x = windows[catPos][0];
  cat.position.y = windows[catPos][1];
  cat.visible = true;
}
events.push([spawnCat,1200]);

// Function to iterate through all events, and run them if it's been roughly the number of frames they desire.
function handleEvents(){
  for (i=0;i<events.length;i++){

    // Range can be adjusted to control chance of event occuring. E.g. a
    if (frames%events[i][1] == 0){
      events[i][0]();
    }
  }
}

function mousePressed(event){
  if (sprinklerCollider.overlap(cursor) && sprinklerCooldown == 0){
    beingSolved = -2;
    genQuestion(score*8);
    return;
  }

  if (cat.overlap(cursor) && catPos != -1){
    score++;
    correctSound.play();
    catTimer = 0;
    doCatTutorial = false;
    return;
  }

  // Check if a question is being solved already
  if (beingSolved == -1 && answerCooldown == 0){
    for (i=0;i<fires.length;i++){
      try{
        if (fires[i].overlap(cursor)){
          beingSolved = i;
          answerCooldown = 120;
          genQuestion(score*5);
          return;
        }
      }
      catch{}
    }
  }

  if (beingSolved  != -1){
    doWork = true;
    if (cursor.overlap(answer1Collider)){
      clicked = 1;
    }else if(cursor.overlap(answer2Collider)){
      clicked = 2;
    }else if(cursor.overlap(answer3Collider)){
      clicked = 3;
    }else{
      doWork = false;
    }

    if (doWork){
      if (clicked == correctAnswer){
        score++;
        doAnswerTutorial = false;
        correctSound.play();
        try{
          splashTarget = beingSolved;
          genSplash(windows[beingSolved][0], windows[beingSolved][1]);
          fireToRemove = beingSolved;
          beingSolved = -1;
          showAnswer = 30;
        }
        catch{
          sprinklerCooldown = 30*60
          doSprinklerTutorial = false;
          storeItem("doTutorial",false)
          beingSolved = -1;
          genSprinklerSplash();
          for (i=0;i<fires.length;i++){
            if (fires[i] != null){
              fires[i].remove();
              fires[i] = null;
            }
          }
        }
      }else{
        beingSolved = -1;
        answerCooldown = 120;
        showAnswer = 90;
        incorrectSound.play();
      }
    }
  }
}

function genQuestion(difficulty){
  doFireTutorial = false;
  choice = Math.random().toFixed(2);
  if ((choice < 0.25) && (difficulty > 30)){
    operator = "/"
    difficulty /= 2;
  }else if ((choice < 0.5) && (difficulty > 20)){
    operator = "*"
    difficulty /= 1.5;
  }else if ((choice < 0.75) && (difficulty  > 10)){
    operator = "-"
    difficulty /= 1.25;
  }else{
    operator = "+"
  }

  if (difficulty > 75){
    digits = 4;
  }else if (difficulty > 45){
    digits = 3;
  }else{
    digits = 2;
  }

  switch (operator){
    case "/":
      firstNum = Math.ceil(Math.random()*9);
      question = str(firstNum*Math.ceil(Math.random()*9)) + "/" + firstNum;
      break;

    case "-":
      switch (digits){
        case 2:
          firstNum = Math.ceil(Math.random()*9);
          secondNum = Math.ceil(Math.random()*9);
          break;
        case 3:
          firstNum = Math.ceil(Math.random()*9);
          secondNum = 10 + Math.floor(Math.random()*90);
          break;
        case 4:
          firstNum = 10 + Math.floor(Math.random()*90);
          secondNum = 10 + Math.floor(Math.random()*90);
          break;
      }
      switch (firstNum > secondNum){
        case true:
          question = firstNum + "-" + secondNum;
          break;

        case false:
          question = secondNum + "-" + firstNum;
          break;
      }
      break;


    default:
      switch (digits){
        case 2:
          question = str(Math.ceil(Math.random()*9)) + operator + str(Math.ceil(Math.random()*9));
          break;
        case 3:
          question = str(Math.ceil(Math.random()*9)) + operator + str(10 + Math.floor(Math.random()*90));
          break;
        case 4:
          question = str(10 + Math.floor(Math.random()*90)) + operator + str(10 + Math.floor(Math.random()*90));
          break;
      }
  }

  answer = eval(question);
  question = question.replace("/","÷");
  question = question.replace("*","×")
  choice = Math.ceil(Math.random()*3);
  fog = [];
  for (i=-Math.floor(answer*0.2);i<answer*0.2;i++){
    if (i != 0 && answer+i > -1){
      fog.push(i);
    }
  }
  if (fog.length == 0){
    for (i=-5;i<5;i++){
      if (i!=0 && answer+i > -1){
        fog.push(i);
      }
    }
  }

  switch (choice){
    case 1:
      correctAnswer = 1;
      answer1 = answer;
      answer2 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      answer3 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      break;
    case 2:
      correctAnswer = 2;
      answer1 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      answer2 = answer;
      answer3 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      break;
    case 3:
      correctAnswer = 3;
      answer1 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      answer2 = Math.round(answer) + fog[Math.floor(Math.random()*fog.length)];
      answer3 = answer;
      break;
  }
}

function draw() {
  background(backgroundImg);

  gameOver = true;
  for (i=0;i<fires.length;i++){
    if (fires[i] == null || catPos != i){
      gameOver = false;
    }
  }


  if (gameOver && keyIsDown(32)){
    gameOver = false;
    for (i=0;i<fires.length;i++){
      fires[i].remove();
    }
    fires = [null,null,null,null,null,null,null,null,null,null,null];
    frames = 0;
    beingSolved = -1;
    answerCooldown = 0;
    correctAnswer = -1;
    question = "";
    answer = 0;
    answer1 = 0;
    answer2 = 0;
    answer3 = 0;
    showAnswer = 0;
    score = 0;
    sprinklerCooldown = 0;
    catPos = -1;
  }

  if (gameOver){
    textSize(100*canvasSize);
    textAlign(CENTER,CENTER);
    text("Game Over",canvasWidth/2,canvasHeight/2)
    textSize(50*canvasSize);
    text("Press space to retry",canvasWidth/2,2*canvasHeight/3)
    text("Score: "+score,canvasWidth/2,canvasHeight/20)
    return;
  }

  if (answerCooldown > 0){
    answerCooldown--;
  }

  if (sprinklerCooldown > 0){
    sprinklerCooldown--;
  }

  if (showAnswer > 0){
    showAnswer--;
  }

  if (catTimer > 0){
    catTimer--;
  }

  if (catTimer == 0){
    catPos = -1;
    cat.visible = false;
  }

  if (frames > 120 && doFireTutorial && doTutorial){
    textAlign(CENTER,CENTER);
    textSize(30*canvasSize);
    rectMode(CENTER);
    rect(canvasWidth/2,3.8*canvasHeight/8,canvasWidth/2,canvasHeight/20)
    text("Click the fire to put it out!",canvasWidth/2,3.8*canvasHeight/8);
  }

  if (doTutorial && doAnswerTutorial && !doFireTutorial){
    textAlign(CENTER,CENTER);
    textSize(30*canvasSize);
    rectMode(CENTER);
    rect(canvasWidth/2,3.8*canvasHeight/8,canvasWidth/2,canvasHeight/20)
    text("Click the correct answer!",canvasWidth/2,3.8*canvasHeight/8);
  }

  if (doCatTutorial && doTutorial && catPos != -1 && !doFireTutorial && !doAnswerTutorial){
    catTimer = 300;
    textAlign(CENTER,CENTER);
    textSize(30*canvasSize);
    rectMode(CENTER);
    rect(canvasWidth/2,3.8*canvasHeight/8,4*canvasWidth/5,canvasHeight/20)
    text("Click the cat to save it before it dissapears!",canvasWidth/2,3.8*canvasHeight/8);
  }

  if (!doCatTutorial && doTutorial && doSprinklerTutorial && !doFireTutorial && !doAnswerTutorial){
    catTimer = 300;
    textAlign(CENTER,CENTER);
    textSize(30*canvasSize);
    rectMode(CENTER);
    strokeWeight(5);
    line(100,80,canvasWidth/2,canvasHeight/2);
    strokeWeight(1);
    rect(canvasWidth/2,3.8*canvasHeight/8,6*canvasWidth/7,canvasHeight/20)
    text("Click the sprinkler button to put out all the fires!",canvasWidth/2,3.8*canvasHeight/8);
  }

  cursor.position.x = mouseX;
  cursor.position.y = mouseY;

  handleEvents();

  // Spawn fire at start of game
  if (frames==120){
    spawnFire();
  }

  for (i=0;i<splashes.length;i++){
    splashDeltaX = splashes[i].position.x - splashTargetX;
    splashDeltaY = splashes[i].position.y - splashTargetY;
    if (splashDeltaX < 5 && splashDeltaX > -5){
      if (splashDeltaY < 5 && splashDeltaY > -5){
        splashes[i].visible = false;
        if (fires[fireToRemove] != null){
          fires[fireToRemove].remove();
          fires[fireToRemove] = null;
          splashSound.play();
        }
      }
    }
  }


  drawSprites();

  if (sprinklerCooldown == 0){
    rectMode(CENTER);
    textAlign(CENTER,CENTER);
    textSize(20*canvasSize);

    if (!doCatTutorial && doTutorial && doSprinklerTutorial && !doFireTutorial && !doAnswerTutorial){
      stroke("#00FF00")
      rect(3+canvasWidth/7,3+canvasHeight/20,canvasWidth/3.5,canvasHeight/10);
      stroke(0)
    }else{
      rect(3+canvasWidth/7,3+canvasHeight/20,canvasWidth/3.5,canvasHeight/10);
    }

    text("Activate Sprinkler",3+canvasWidth/7,3+canvasHeight/20)
  }else{
    rectMode(CENTER);
    textAlign(CENTER,CENTER);
    textSize(20*canvasSize);

    rect(3+canvasWidth/7,3+canvasHeight/20,canvasWidth/3.5,canvasHeight/10);
    text(Math.round(sprinklerCooldown/60),3+canvasWidth/7,3+canvasHeight/20);
  }

  if (beingSolved != -1 || showAnswer > 0){
    rectMode(CENTER);
    textAlign(CENTER,CENTER);
    textSize(40*canvasSize);
    rect(canvasWidth/2,canvasHeight/3,400,150)
    text(question,canvasWidth/2,canvasHeight/3);
    textSize(30*canvasSize);
    rect(canvasWidth/4,2*canvasHeight/3,125,50);
    rect(2*canvasWidth/4,2*canvasHeight/3,125,50);
    rect(3*canvasWidth/4,2*canvasHeight/3,125,50);
    if (beingSolved == -1){
      stroke('#00FF00');
      rect(correctAnswer*canvasWidth/4,2*canvasHeight/3,125,50);
    }
    stroke('#000000')
    text(answer1,canvasWidth/4,2*canvasHeight/3);
    text(answer2,2*canvasWidth/4,2*canvasHeight/3);
    text(answer3,3*canvasWidth/4,2*canvasHeight/3)
  }
  textAlign(CENTER,CENTER);
  textSize(40*canvasSize);
  text("Score: "+score,canvasWidth/2,canvasHeight/20)
  frames++;
}
