var playerName = window.prompt("What is your robot's name?");
var playerHealth = 100;
var playerAttack = 10;
var playerMoney = 10;

// You can also log multiple values at once like this
console.log(playerName, playerAttack, playerHealth);

var enemyNames = [" Roborto", " Army Android", " Robo Rumble "];
var enemyHealth = 50;
var enemyAttack = 12;

//console.log(enemyNames. length);
//console.log(enemyNames[0]);
//console.log(enemyNames[1]);
//console.log(enemyNames[2]);
//for(var i = 0; i < enemyNames.length; i++) {
  //console.log(enemyNames[i]);
  //console.log(i);
 // console.log(enemyNames[i] + " is at " + i + " index");
//}

var enemy1 = " Roborto ";
var enemy2 = " Army Android ";
var enemy3 = " Robo Rumble ";

var fight = function(enemyName) {
  // repeat and execute as long as the enemy-robot is alive 
  while(playerHealth > 0 && enemyHealth > 0) {
   // place fight function code block here . . .

       // Alert players that they are starting the round
  //window.alert("Welcome to Robot Gladiators!");
  window.alert("Get Ready!");
  // ask player if they'd like to fight or run
  var promptFight = window.prompt("Would you like to FIGHT or SKIP this battle? Enter 'FIGHT' or 'SKIP' to choose.");

  // if player picks "skip" confirm and then stop the loop
  if (promptFight === "skip" || promptFight === "SKIP") {
    // confirm player wants to skip
    var confirmSkip = window.confirm("Are you sure you'd like to quit?");
}  

// if yes (true), leave fight
  if (confirmSkip) {
    window.alert(playerName + " has decided to skip this fight. Goodbye!");
    // subtract money from playerMoney for skipping
    playerMoney = playerMoney - 10;
    console.log("playerMoney", playerMoney);
    break;
  }
}

  // if player choses to fight, then fight
  if (promptFight === "fight" || promptFight === "FIGHT") {
  
  // remove enemy's health by subtracting the amount set in the playerAttack variable
  enemyHealth = enemyHealth - playerAttack;
  console.log(
    playerName + " attacked " + enemyName + ". " + enemyName + " now has " + enemyHealth + " health remaining."
  );

  // check enemy's health
  if (enemyHealth <= 0) {
    window.alert(enemyName + " has died!");
    //Award player money for winning
    playerMoney = playerMoney + 20;

    //Leave while() loop since enemy is dead
    break;
  } else {
    window.alert(enemyName + " still has " + enemyHealth + " health left.");
  }

  // remove player's health by subtracting the amount set in the enemyAttack variable
  playerHealth = playerHealth - enemyAttack;
  console.log(
    enemyName + " attacked " + playerName + ". " + playerName + " now has " + playerHealth + " health remaining."
  );

  // check player's health
  if (playerHealth <= 0) {
    // let player know what round they are in, remember that arrays start at 0 so it needs to have 1 added to it  

    else {
    window.alert("You have lost your robot in battle! Game Over!");
    break;
  }

    
    window.alert("Welcome to Robot Gladiators! Round " + (i + 1));

  
  }
    // pick new enemy to fight based on the index of the enemyNames array
    var pickedEnemyName = enemyNames[i];

    // Reset enemyHealth before starting new fight
    enemyHealth = 50;

    // use debugger to pause script from running and check what's going on at that moment in the code
    // debugger;

    // pass the pickedEnemyName variable's value into the fight function, where it will assume the value of the enemyName parameter
    fight(pickedEnemyName);
  }
  
    // Leave while() loop if player is dead
    window.alert(playerName + " has died!");
    break;
  } else {
    window.alert(playerName + " still has " + playerHealth + " health left.");
  }
  

  // if no (false), ask question again by running fight() again {
fight();

for (var i = 0; i < enemyNames.length; i++) {
  var pickedEnemyName = enemyNames[i];
    enemyHealth = 50;
    fight(pickedEnemyName);
}
}
};



// Game States
// "WIN" - Player robot has defeated all enemy-robots
//    * Fight all enemy-robots
//    * Defeat each enemy-robot
// "LOSE" - Player robot's health is zero or less