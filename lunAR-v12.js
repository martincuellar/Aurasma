// lunAR SXSW '16 version
// 02/2016
// Joao Craveiro

var explosionSound = new Asset("explosionSound");
var meteorSound = new Asset("meteorSound");
var shotSound = new Asset("shotSound");
var shotZone = new Asset("shotZone");
var moon = new Asset ("moon");

var life1 = new Asset ("life1");
var life2 = new Asset ("life2");
var life3 = new Asset ("life3");

var levelupSound = new Asset ("scoreNum1");
var scoreNum2 = new Asset ("scoreNum2");

var gameOver = new Asset ("gameOver");
var levelup = new Asset ("scoreBoard");

var pendingTimeouts = [];

var loadCompleted = false;
var numMeteors = 8;
var loads = numMeteors*2+8;
var meteors = [];
var meteorRotation = 0.2;
var safetyZoneSize = 0.35;

//var moonRadius = 0.115;
var moonRadius = 0.078;
var moonRadiusExtra = 0.024;

var difficulty = 1;
var loader = 1;
var levelTime;
var exploding = false;
var score = 0;

var meteorStartPositionAnchors;

var moonscale = 14;
var meteorscale = 0.7;
var moonspeed = 2;

var spawnDelay = 15;
var spawnRadius = 0.75;

var lives = 3;
var levelingup  = false;
var freeze = false;

//linear animations
var animAnchors;
var laStartTime=-1;
var lastTime;
var anim = false;
var animAsset;

for(var i = 0; i < numMeteors; i++)
{
   var meteor = {
        meteor:  new Asset("meteor"+i),
        hitBox: new Asset("hitBox"+i),
        hit: false,
        //exploding: false,
        speed: 0,
        dx: 0,
        dy: 0,
        spawning: true
    };
        
    meteor.meteor.on('load', loaded);
    meteor.hitBox.on('load', loaded);
    
    meteors[i] = meteor;
}
    
function loaded()
{
    if(--loads === 0)
    {
        aura.showSpinner = false;
        meteorStartPositionAnchors = meteors[0].meteor.anchors;
        moon.layer = 2;
        //scale(moon,moonscale);
        //updateMoonRadius();
        
        meteors.forEach(function(meteor)
        {
            meteor.meteor.layer = 2;
            meteor.hitBox.layer = 0;
            
            setStartPosition(meteor);
       
            meteor.hitBox.on('tap', function()
            {
                shotMeteor(meteor);
            });
            
            meteor.hitBox.on('dbltap', function()
            {
                shotMeteor(meteor);
            });
            
            starter(meteor.meteor);
            meteor.hitBox.start();
            
            meteor.meteor.on('end', function(){
                setStartPosition(meteor);
                restarter(meteor.meteor);
            });
            
        });
        shotZone.layer = 1;
        shotZone.start();
        gameOver.layer = 0;
        move(gameOver,0,0,15);
        loadCompleted = true;
        starter(moon);
        addTimeout('', 20, function(asst){ levelTimeout(); });
    }
}

function levelTimeout(){
    levelingup = true;
    difficulty++;
}

function shotMeteor(meteor)
{
    meteor.hit = true;
    meteor.meteor.start();
    //shotSound.start();
    //meteorSound.start();
    score += 100*difficulty;

    if(levelingup){
        levelupSound.start();
        levelingup = false;
        //levelup.start();
        freeze = true;
        //scale(moon,1.2);
        //updateMoonRadius();
        playAll();
        if(lives<3) lives++;
        addTimeout('', 30+difficulty*difficulty, function(asst){ levelTimeout(); });
        addTimeout('', 1, function(asst){
            freeze = false;
        });
    }
    //rotate(scoreNum2,'z',-37);
    //if(score%10===0)
    //    rotate(scoreNum1,'z',-37);
    //setStartPosition(meteor);
}

function updateMoonRadius(){
    //moonRadius = Math.sqrt(moon.anchors[0].x*moon.anchors[0].x+moon.anchors[0].y*moon.anchors[0].y);
    moonRadius = Math.abs(moon.anchors[0].z*2) + moonRadiusExtra;
}

life3.on('load', loaded);
life3.load();
levelup.on('load', loaded);
levelup.load();

// Moon
moon.on('load', loaded);
moon.load();

// Sound effects
explosionSound.on('load', loaded);
explosionSound.load();
explosionSound.on('end', function(){explosionSound.stop();});

meteorSound.on('load', loaded);
meteorSound.load();
meteorSound.on('end', function(){meteorSound.stop();});

shotSound.on('load', loaded);
shotSound.load();
shotSound.on('end', function(){shotSound.stop();});

levelupSound.on('load', loaded);
levelupSound.load();
levelupSound.on('end', function(){levelupSound.stop();});

shotZone.on('load', loaded);
shotZone.load();
shotZone.on('tap', function(){
    //shotSound.start();
});
shotZone.on('dbltap', function(){
    //shotSound.start();
});


// Meteors
meteors.forEach(function(meteor){
    meteor.meteor.load();
    meteor.hitBox.load();
});


function updateLives()
{
    lives--;
    /*if(lives === 2)
        life3.stop();
    if(lives === 1)
        life2.stop();*/
    if(lives === 0){
        moon.start();
        meteor.meteor.on('end', function(){
        });
        playAll();
        //life1.stop();
        //loadCompleted = false;
        gameOver.start();
        addTimeout('',2,function(asset){
            loadUrl("https://customanalytics.herokuapp.com/register/LunAR%20Scoreboard/score/" + score)
        });
    }
}

function playAll(){
meteors.forEach(function(meteor){
            meteor.meteor.start();
        });
}


aura.on('tick', function()
{
    if(loadCompleted)
    {
        
        // timeouts
        var now = hrtime();
        pendingTimeouts = pendingTimeouts.filter(function(timeout){
			if (timeout.at < now){
				    timeout.cb(timeout.asset);
			}
			else{
				return true;
			}
		});
        
        // animations
        if(anim)
        {
            linearBump(animAsset);
        }
        
        // game objects
       meteors.forEach(function(meteor){
            if(!freeze && !meteor.spawning){
                
                if(!meteor.hit){
                    hitTest(meteor);
                    if(meteor.hit)
                    {
                        meteor.meteor.start();
                        //explosionSound.start();
                        updateLives();
                        triggerLinearBump(moon);
                    }
                //rotate(meteor.meteor,'x',2);
                }
           
                //rotate(meteor.meteor,'x',2);
                //rotate(moon,'y',moonspeed);
                rotate(meteor.hitBox,'x',15);
                move(meteor.meteor, meteor.dx, meteor.dy, 0);
                move(meteor.hitBox, meteor.dx, meteor.dy, 0);
            }
        });
    }
});


// Collisions
function hitTest(meteor)
{
    var anchors = meteor.meteor.anchors;
    var meteorMidPoint = {};
    var moonMidPoint = {};
    meteorMidPoint.x = (anchors[0].x + anchors[1].x) / 2;
	meteorMidPoint.y = (anchors[0].y + anchors[2].y) / 2;
	var meteorRadius = Math.abs(Math.sqrt(meteorMidPoint.x*meteorMidPoint.x+meteorMidPoint.y*meteorMidPoint.y));
    if(meteorRadius<moonRadius)
        {
            meteor.hit = true;
        }
        /* reset if too far away
        if(anchors[2].x>1.5 || anchors[2].y>1.5 || anchors[2].x<-1.5 || anchors[2].y<-1.5)
        {
            setStartPosition(meteor);
        }*/
}



function setStartPosition(meteor)
{
    meteor.meteor.anchors = meteorStartPositionAnchors;
    scale(meteor.meteor,meteorscale);
    fitSize(meteor.meteor, meteor.hitBox);
    scale(meteor.hitBox,4);
    move(meteor.hitBox,0,0,0.01)
    //rotate(meteor.hitBox,'z',45);
    
    meteor.spawning = true;
    addTimeout(meteor, Math.random()*spawnDelay, function(asst){ asst.spawning = false; });
    
    // level conditions
    // speed
   var rdm = Math.random();
    if(rdm<0.1+difficulty/10)
        meteor.speed = 0.003+difficulty/10000;
    else if(rdm<0.35+difficulty/10)
        meteor.speed = 0.0025+difficulty/10000;
    else if(rdm<0.85)
        meteor.speed = 0.002+difficulty/10000;
    else
        meteor.speed = 0.001+difficulty/10000;
        
    if(meteor.speed > 0.004) meteor.speed = 0.004;
    
    //size
    rdm = Math.random();
    if(rdm<0.1+difficulty/10)
        scale(meteor.meteor,1-difficulty/20)
    else if(rdm<0.5)
        scale(meteor.meteor,1+1/difficulty);
        
    // generate along circumference w/ r=2
    var posX = Math.random()*2;
    while(posX===0) posX = Math.random()*2;
    //spawnRadius
    var posY = Math.sqrt((1)-((posX-1)*(posX-1)));
    if(Math.random()>0.5)
        posY*=-1;
    posX-=1;

    // meteor
    var anchors = meteor.meteor.anchors;
	anchors[0].x = anchors[0].x + posX;
	anchors[1].x = anchors[1].x + posX;
	anchors[2].x = anchors[2].x + posX;
	anchors[0].y = anchors[0].y + posY;
	anchors[1].y = anchors[1].y + posY;
	anchors[2].y = anchors[2].y + posY;
	meteor.meteor.anchors = anchors;
	//rotate(meteor.meteor,1,true);
	
	// hitBox
	anchors = meteor.hitBox.anchors;
	anchors[0].x = anchors[0].x + posX;
	anchors[1].x = anchors[1].x + posX;
	anchors[2].x = anchors[2].x + posX;
	anchors[0].y = anchors[0].y + posY;
	anchors[1].y = anchors[1].y + posY;
	anchors[2].y = anchors[2].y + posY;
	meteor.hitBox.anchors = anchors;
    	
    var angle = Math.atan(posY/posX);
	meteor.dx = Math.abs(Math.cos(angle)*meteor.speed);
    meteor.dy = Math.abs(Math.sin(angle)*meteor.speed);
	
    if(anchors[2].x > 0) meteor.dx*=-1;
    if(anchors[2].y > 0) meteor.dy*=-1;
	
    meteor.hit = false;
}




// animations
function triggerLinearBump(asset)
{
    if(!anim)
    {
        anim = true;
        animAsset = moon;
        laStartTime = hrtime();
        animAnchors = asset.anchors;
    }
}

function linearBump(asset)
{
    if(hrtime()-laStartTime <= 0.1)
        move(asset,0.0025,0,0);
    else if(hrtime()-laStartTime <= 0.3)
        move(asset,-0.0025,0,0);
    else if(hrtime()-laStartTime <= 0.4)
        move(asset,0.0025,0,0);
    else if(hrtime()-laStartTime >= 0.5)
    {
        asset.anchors = animAnchors;
        laStartTime === -1;
        anim = false;
    }
}



// AURASMA ASSET FUNCTIONS
// 3D Manipulation
function move(asset,dx,dy,dz)
{
    var anchors = asset.anchors;
    anchors[0].x = anchors[0].x + dx;
    anchors[1].x = anchors[1].x + dx;
    anchors[2].x = anchors[2].x + dx;
    anchors[0].y = anchors[0].y + dy;
    anchors[1].y = anchors[1].y + dy;
    anchors[2].y = anchors[2].y + dy;
    anchors[0].z = anchors[0].z + dz;
    anchors[1].z = anchors[1].z + dz;
    anchors[2].z = anchors[2].z + dz;
    asset.anchors = anchors;
}

function scale(asset, delta)
{
    var anchors = asset.anchors;
    var midPoint = {};
    midPoint.x = (anchors[0].x + anchors[1].x) / 2;
	midPoint.y = (anchors[0].y + anchors[2].y) / 2;
	anchors[0].x = midPoint.x+(anchors[0].x-midPoint.x)*delta;
	anchors[1].x = midPoint.x+(anchors[1].x-midPoint.x)*delta;
	anchors[2].x = midPoint.x+(anchors[2].x-midPoint.x)*delta;
	anchors[0].y = midPoint.y+(anchors[0].y-midPoint.y)*delta;
	anchors[1].y = midPoint.y+(anchors[1].y-midPoint.y)*delta;
	anchors[2].y = midPoint.y+(anchors[2].y-midPoint.y)*delta;
	asset.anchors = anchors;
}

function rotate(asset,axis,theta)
{
    var anchors = asset.anchors;
	var newAnchors = [{},{},{}];
	var midPoint = {};
	midPoint.x = (anchors[1].x + anchors[2].x) / 2;
	midPoint.y = (anchors[1].y + anchors[2].y) / 2;
	midPoint.z = (anchors[1].z + anchors[2].z) / 2;
	var thetaRad = theta * (Math.PI/180);
    var cosTheta = Math.cos(thetaRad);
	var sinTheta = Math.sin(thetaRad);
	var axis1;
	var axis2;
	if(axis=='x') { axis1='y'; axis2='z'; }
	if(axis=='y') { axis1='x'; axis2='z'; }
	if(axis=='z') { axis1='x'; axis2='y'; }
	for(var i=0;i<3;i++)
	{
    	newAnchors[i][axis] = anchors[i][axis];
		newAnchors[i][axis1] = (anchors[i][axis1] - midPoint[axis1]) * cosTheta - (anchors[i][axis2] - midPoint[axis2]) * sinTheta + midPoint[axis1];
		newAnchors[i][axis2] = (anchors[i][axis1] - midPoint[axis1]) * sinTheta + (anchors[i][axis2] - midPoint[axis2]) * cosTheta + midPoint[axis2];
	}
    asset.anchors = newAnchors;
}

function fitSize(asset1, asset2)
{
    var anchors = asset1.anchors;
    /*var anchors2 = asset2.anchors;
	anchors2[0].x = anchors1[0].x;
	anchors2[0].y = anchors1[0].y;
	anchors2[1].x = anchors1[1].x;
	anchors2[1].y = anchors1[1].y;
	anchors2[2].x = anchors1[2].x;
	anchors2[2].y = anchors1[2].y;*/
	asset2.anchors = anchors;
}

function starter(asset){
    asset.start();
    addTimeout(asset,0.8,function(a){ a.pause(); })
}

function restarter(asset){
    asset.stop();
    addTimeout(asset,0.3,function(assetToStart){
        assetToStart.start();
    });
    addTimeout(asset,0.8,function(assetToPause){
        assetToPause.pause();
    });
}

function addTimeout(asst, seconds, callback){
		pendingTimeouts.push({asset: asst, at: hrtime() + seconds, cb: callback });
}