window.alert("This is an alert! JavaScript is running!");

var playerName = window.prompt("What is your robot's name?");
var playerHealth = 100;
var playerAttack = 10;
var playerMoney = 10;

// You can also log multiple values at once like this
console.log(playerName, playerAttack, playerHealth);

var enemyNames = ["Nebula", "Breaker-back", "Robo-Rumble", "blaster"];
var enemyHealth = 50;
var enemyAttack = 12;
console.log(enemyNames);
    console.log(enemyNames[0]);
    console.log(enemyNames[1]);
    console.log(enemyNames[2]);
    console.log(enemyNames[3]);
    console.log(enemyNames.length);
    // For loop statement
    for(var i = 0; i < enemyNames.length; i++) {
        console.log(enemyNames[i]);
        console.log(i);
        console.log(enemyNames[i] + " is at " + i + " index");
      }
    //for(var i = 0; i < 3; i++) {
        //console.log("apple", i);
      //}

var fight = function(enemyName) {
    //repeat and execute as long as the enemy-robot is alive
    while(enemyHealth > 0) {
    // place fight function code block here
    //for(var i = 0; i < enemyName.length; i++) {
        //fight(enemyName[i]);
    //}

// Alert players that they are starting the round
window.alert("Welcome to Robot Gladiators!");
var promptFight = window.prompt("Would you like to FIGHT or SKIP this battle? Enter 'FIGHT' or 'SKIP' to choose.");
};

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
    window.alert(playerName + " has died!");
  } else {
    window.alert(playerName + " still has " + playerHealth + " health left.");
  }

  // if player choses to skip
} else if (promptFight === "skip" || promptFight === "SKIP") {
  //confirm player wants to skip
  var confirmSkip = window.confirm("Are you sure you'd like to quit?");
  
  window.alert(playerName + " has chosen to skip the fight!");
} else {
  window.alert("You need to choose a valid option. Try again!");
}
    // if yes (true), leave fight
    if (confirmSkip) {
      window.alert(playerName + " has decided to skip this fight. Goodbye!");
      // subtract money from playerMoney for skipping
      playerMoney = playerMoney - 2;
    }
    // if no (false), ask question again by running fight() again
    else {
      fight();
    }
  }
  
for (var i = 0; i < enemyNames.length; i++) {
    //debugger;
    // call fight function with enemy-robot
    fight(enemyNames[i])
}

    // remove enemy's health by subtracting the amount set in the playerAttack variable
    enemyHealth = enemyHealth - playerAttack;
    console.log(
      playerName + " attacked " + enemyNames + ". " + enemyNames + " now has " + enemyHealth + " health remaining."
    );
  
    // check enemy's health
    if (enemyHealth <= 0) {
      window.alert(enemyNames + " has died!");
    } else {
      window.alert(enemyNames + " still has " + enemyHealth + " health left.");
    }
  
    // remove player's health by subtracting the amount set in the enemyAttack variable
    playerHealth = playerHealth - enemyAttack;
    console.log(
      enemyNames + " attacked " + playerName + ". " + playerName + " now has " + playerHealth + " health remaining."
    );
  
    // check player's health
    if (playerHealth <= 0) {
      window.alert(playerName + " has died!");
    } else {
      window.alert(playerName + " still has " + playerHealth + " health left.");
    }
  
  
//Subtract the value of `playerAttack` from the value of `enemyHealth` and use that result to update the value in the `enemyHealth` variable
enemyHealth = enemyHealth - playerAttack;
// Log a resulting message to the console so we know that it worked.
    console.log(
        playerName + " attacked " + enemyNames + ". " + enemyNames + " health remaining."
);

    //check enemy's health
    if (enemyHealth <= 0) {
    window.alert(enemyNames + " has died!");
}
else {
    window.alert(enemyNames + " still has " + enemyHealth + " health left.")
}
// Subtract the value of `enemyAttack` from the value of `playerHealth` and use that result to update the value in the `playerHealth` variable.
playerHealth = playerHealth - enemyAttack;
// Log a resulting message to the console so we know that it worked.
    console.log(
        enemyNames + " attacked " + playerName + ". " +  playerName + " now has " + playerHealth + " health remaining."
    
);
        //check player's health
    if (playerHealth <= 0) {
        window.alert(playerName + " has died!");
}
else {
    window.alert(playerName + " still has " + playerHealth + " health left.");
}

var playerHealth = 100;


// check to see if the value of the playerHealth variable is greater than 0


// The FIGHT Function
//var fight = function(enemyName) {
    //repeat and execute as long as the enemy-robot is alive
    //while(enemyHealth > 0) {
    // place fight function code block here
    //for(var i = 0; i < enemyName.length; i++) {
        //fight(enemyName[i]);
    //} 

//for(var i = 0; i < enemyNames.length; i++) {
    //fight(enemyNames[i]);
//}

//};
// window.alert("This is an alert! JavaScript is running!"); 