import React, { useState, useEffect, useRef } from 'react';
import SplashScreen from './components/SplashScreen';
import PlayerStats from './components/PlayerStats';
import EnemyInfo from './components/EnemyInfo';
import BattleLog from './components/BattleLog';
import Shop from './components/Shop';
import Achievements from './components/Achievements';
import { ParticleEffect, AnimatedNumber } from './components/Animations';
import { NameInputModal, ConfirmModal, AlertModal } from './components/Modal';
import CharacterSelect from './components/CharacterSelect';
import MainMenu from './components/MainMenu';
import SideScroller from './components/SideScroller';
import VersusScreen from './components/VersusScreen';
import { 
  randomNumber, 
  getInitialPlayerInfo, 
  getInitialEnemyInfo, 
  calculateDamage,
  getHighScore,
  getHighScoreName,
  setHighScore,
  isNewHighScore,
  POWER_UPS,
  ACHIEVEMENTS,
  playSound,
  getCriticalHitChance,
  calculateCriticalDamage
} from './gameUtils';

const GAME_STATES = {
  NAME_INPUT: 'NAME_INPUT',
  BATTLE: 'BATTLE',
  SHOP: 'SHOP',
  GAME_OVER: 'GAME_OVER'
};

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameState, setGameState] = useState(GAME_STATES.NAME_INPUT);
  const [player, setPlayer] = useState(null);
  const [previousPlayerStats, setPreviousPlayerStats] = useState(null);
  const [enemies, setEnemies] = useState([]);
  const [currentEnemyIndex, setCurrentEnemyIndex] = useState(0);
  const [currentEnemy, setCurrentEnemy] = useState(null);
  const [battleLogs, setBattleLogs] = useState([]);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [showSkipConfirm, setShowSkipConfirm] = useState(false);
  const [showShopConfirm, setShowShopConfirm] = useState(false);
  const [showGameOverAlert, setShowGameOverAlert] = useState(false);
  const [showPlayAgainConfirm, setShowPlayAgainConfirm] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [playerPowerUps, setPlayerPowerUps] = useState({});
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [animations, setAnimations] = useState({});
  const [combatRounds, setCombatRounds] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [damageTaken, setDamageTaken] = useState(0);
  const [showCharacterSelect, setShowCharacterSelect] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showMainMenu, setShowMainMenu] = useState(false);
  const [showVersus, setShowVersus] = useState(false);
  const battleAreaRef = useRef(null);

  useEffect(() => {
    // Randomly determine turn order at start of each battle
    if (currentEnemy && gameState === GAME_STATES.BATTLE) {
      setIsPlayerTurn(Math.random() > 0.5);
    }
  }, [currentEnemy, gameState]);

  const addBattleLog = (message, isCritical = false) => {
    setBattleLogs(prev => [...prev, { message, isCritical, timestamp: Date.now() }]);
  };

  const triggerAnimation = (type, duration = 1000) => {
    setAnimations(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, [type]: false }));
    }, duration);
  };

  const unlockAchievement = (achievementKey) => {
    if (!unlockedAchievements.includes(achievementKey)) {
      setUnlockedAchievements(prev => [...prev, achievementKey]);
      addBattleLog(`🏆 Achievement Unlocked: ${ACHIEVEMENTS[achievementKey].name}!`);
    }
  };

  const applyPowerUp = (powerUpKey) => {
    setPlayerPowerUps(prev => ({
      ...prev,
      [powerUpKey]: (prev[powerUpKey] || 0) + 1
    }));
  };

  const consumePowerUp = (powerUpKey) => {
    setPlayerPowerUps(prev => ({
      ...prev,
      [powerUpKey]: Math.max(0, (prev[powerUpKey] || 0) - 1)
    }));
  };

  const startGame = (playerName) => {
    // Use selected character's stats for player
    const char = selectedCharacter || {
      name: 'Custom', health: 100, attack: 10
    };
    const newPlayer = {
      name: playerName,
      health: char.health,
      maxHealth: char.health,
      attack: char.attack,
      money: 10,
      avatar: char.avatar || '🤖',
      characterId: char.id || 'custom',
    };
    const newEnemies = getInitialEnemyInfo();
    
    setPlayer(newPlayer);
    setPreviousPlayerStats(newPlayer);
    setEnemies(newEnemies);
    setCurrentEnemyIndex(0);
    setCurrentEnemy(newEnemies[0]);
    setBattleLogs([]);
    setPlayerPowerUps({});
    setCombatRounds(0);
    setTotalSpent(0);
    setDamageTaken(0);
    setGameState(GAME_STATES.BATTLE);
    
    addBattleLog(`Welcome to Nebula Wars! Round 1`);
    addBattleLog(`${newPlayer.name} vs ${newEnemies[0].name}`);
    addBattleLog(`Enemy Type: ${newEnemies[0].type.toUpperCase()} - ${newEnemies[0].description}`);
  };

  const resetGame = () => {
    setPlayer(null);
    setEnemies([]);
    setCurrentEnemyIndex(0);
    setCurrentEnemy(null);
    setBattleLogs([]);
    setIsPlayerTurn(true);
    setGameState(GAME_STATES.NAME_INPUT);
    setShowSkipConfirm(false);
    setShowShopConfirm(false);
    setShowGameOverAlert(false);
    setShowPlayAgainConfirm(false);
    setShowCharacterSelect(true); // Show character selection screen
    setSelectedCharacter(null); // Reset selected character
    setShowVersus(false); // Reset versus screen
  };

  const handlePlayAgain = (playAgain) => {
    setShowPlayAgainConfirm(false);
    if (playAgain) {
      resetGame();
    } else {
      setShowCharacterSelect(true); // Show character selection screen
      setSelectedCharacter(null); // Reset selected character
      setShowVersus(false); // Reset versus screen
      setGameState(GAME_STATES.NAME_INPUT);
    }
  };

  const handleAttack = () => {
    if (!isPlayerTurn || !currentEnemy || !player) return;

    setCombatRounds(prev => prev + 1);
    playSound('attack');
    triggerAnimation('attack');
    
    let damage = calculateDamage(player.attack);
    let isCritical = false;
    
    // Check for critical hit
    if (Math.random() < getCriticalHitChance(player)) {
      damage = calculateCriticalDamage(damage);
      isCritical = true;
      triggerAnimation('critical');
      playSound('critical');
    }
    
    // Apply critical strike power-up
    if (playerPowerUps.CRITICAL > 0) {
      damage *= 2;
      consumePowerUp('CRITICAL');
      addBattleLog(`${player.name} used Critical Strike power-up!`, true);
    }
    
    const newEnemyHealth = Math.max(0, currentEnemy.health - damage);
    
    setCurrentEnemy(prev => ({ ...prev, health: newEnemyHealth }));
    addBattleLog(
      `${player.name} attacked ${currentEnemy.name} for ${damage} damage!${isCritical ? ' CRITICAL HIT!' : ''}`, 
      isCritical
    );
    
    if (newEnemyHealth <= 0) {
      addBattleLog(`${currentEnemy.name} has been defeated!`);
      const reward = currentEnemy.reward || 20;
      setPlayer(prev => ({ ...prev, money: prev.money + reward }));
      addBattleLog(`${player.name} earned $${reward}!`);
      
      // Check for first win achievement
      if (currentEnemyIndex === 0 && !unlockedAchievements.includes('FIRST_WIN')) {
        unlockAchievement('FIRST_WIN');
      }
      
      playSound('victory');
      triggerAnimation('victory');
      
      setTimeout(() => {
        if (currentEnemyIndex < enemies.length - 1) {
          setShowShopConfirm(true);
        } else {
          endGame(true);
        }
      }, 1000);
    } else {
      addBattleLog(`${currentEnemy.name} has ${newEnemyHealth} health remaining.`);
      setIsPlayerTurn(false);
      
      // Enemy attacks after a delay
      setTimeout(() => {
        enemyAttack();
      }, 1500);
    }
  };

  const enemyAttack = () => {
    if (!currentEnemy || !player || currentEnemy.health <= 0) return;

    let damage = calculateDamage(currentEnemy.attack);
    
    // Apply shield power-up
    if (playerPowerUps.SHIELD > 0) {
      damage = Math.floor(damage * 0.5);
      consumePowerUp('SHIELD');
      addBattleLog(`${player.name}'s Energy Shield absorbed 50% of the damage!`);
    }
    
    const newPlayerHealth = Math.max(0, player.health - damage);
    setDamageTaken(prev => prev + damage);
    
    setPreviousPlayerStats(player);
    setPlayer(prev => ({ ...prev, health: newPlayerHealth }));
    addBattleLog(`${currentEnemy.name} attacked ${player.name} for ${damage} damage!`);
    
    if (newPlayerHealth <= 0) {
      addBattleLog(`${player.name} has been defeated!`);
      setTimeout(() => {
        endGame(false);
      }, 1000);
    } else {
      addBattleLog(`${player.name} has ${newPlayerHealth} health remaining.`);
      
      // Apply regeneration power-up
      if (playerPowerUps.REGENERATION > 0) {
        const healAmount = 5;
        setPlayer(prev => ({ 
          ...prev, 
          health: Math.min(prev.maxHealth, prev.health + healAmount)
        }));
        addBattleLog(`${player.name} regenerated ${healAmount} health!`);
      }
      
      setIsPlayerTurn(true);
    }
  };

  const handleSkip = () => {
    setShowSkipConfirm(true);
  };

  const confirmSkip = () => {
    setPlayer(prev => ({ ...prev, money: Math.max(0, prev.money - 10) }));
    addBattleLog(`${player.name} decided to skip this battle and lost $10.`);
    setShowSkipConfirm(false);
    
    if (currentEnemyIndex < enemies.length - 1) {
      nextRound();
    } else {
      endGame(false);
    }
  };

  const nextRound = () => {
    const nextIndex = currentEnemyIndex + 1;
    if (nextIndex < enemies.length) {
      setCurrentEnemyIndex(nextIndex);
      setCurrentEnemy(enemies[nextIndex]);
      setBattleLogs([]);
      addBattleLog(`Round ${nextIndex + 1}`);
      addBattleLog(`${player.name} vs ${enemies[nextIndex].name}`);
      addBattleLog(`Enemy Type: ${enemies[nextIndex].type.toUpperCase()} - ${enemies[nextIndex].description}`);
      setGameState(GAME_STATES.BATTLE);
    }
  };

  const handleShopConfirm = (visitShop) => {
    setShowShopConfirm(false);
    if (visitShop) {
      setGameState(GAME_STATES.SHOP);
    } else {
      nextRound();
    }
  };

  const handleShopPurchase = (item, powerUpKey) => {
    if (item === 'refill' && player.money >= 7 && player.health < player.maxHealth) {
      setPreviousPlayerStats(player);
      setPlayer(prev => ({
        ...prev,
        health: Math.min(prev.maxHealth, prev.health + 20),
        money: prev.money - 7
      }));
      setTotalSpent(prev => prev + 7);
      addBattleLog(`${player.name} refilled health by 20 for $7.`);
      playSound('purchase');
    } else if (item === 'upgrade' && player.money >= 7) {
      setPreviousPlayerStats(player);
      setPlayer(prev => ({
        ...prev,
        attack: prev.attack + 6,
        money: prev.money - 7
      }));
      setTotalSpent(prev => prev + 7);
      addBattleLog(`${player.name} upgraded attack by 6 for $7.`);
      playSound('purchase');
    } else if (item === 'powerup' && powerUpKey) {
      const powerUp = POWER_UPS[powerUpKey];
      if (player.money >= powerUp.cost) {
        setPreviousPlayerStats(player);
        setPlayer(prev => ({
          ...prev,
          money: prev.money - powerUp.cost
        }));
        setTotalSpent(prev => prev + powerUp.cost);
        applyPowerUp(powerUpKey);
        addBattleLog(`${player.name} purchased ${powerUp.name}!`);
        playSound('purchase');
      }
    }
    
    // Check spending achievement
    if (totalSpent >= 50 && !unlockedAchievements.includes('SHOPPING_SPREE')) {
      unlockAchievement('SHOPPING_SPREE');
    }
  };

  const handleShopLeave = () => {
    setGameState(GAME_STATES.BATTLE);
    nextRound();
  };

  const endGame = (playerWon) => {
    const highScore = getHighScore();
    const highScoreName = getHighScoreName();
    
    // Check achievements
    if (playerWon && damageTaken === 0) {
      unlockAchievement('PERFECT_GAME');
    }
    if (combatRounds <= 10) {
      unlockAchievement('SPEED_RUNNER');
    }
    
    let message = playerWon 
      ? `🎉 Congratulations! You've conquered the nebula!` 
      : `💀 Game Over! Your robot was destroyed in battle.`;
    
    message += `\n\nFinal Score: $${player.money}`;
    message += `\nCombat Rounds: ${combatRounds}`;
    message += `\nDamage Taken: ${damageTaken}`;
    message += `\nAchievements Unlocked: ${unlockedAchievements.length}/${Object.keys(ACHIEVEMENTS).length}`;
    
    if (isNewHighScore(player.money)) {
      setHighScore(player.money, player.name);
      message += `\n\n� NEW HIGH SCORE! �\nYou beat the previous record of $${highScore}!`;
    } else {
      message += `\n\nHigh Score: $${highScore} by ${highScoreName}`;
    }
    
    setGameOverMessage(message);
    setShowGameOverAlert(true);
  };

  const handleGameOverClose = () => {
    setShowGameOverAlert(false);
    setShowPlayAgainConfirm(true);
  };

  const renderGameContent = () => {
    if (gameState === GAME_STATES.BATTLE && player && currentEnemy) {
      return (
        <>
          <PlayerStats player={player} previousStats={previousPlayerStats} />
          <EnemyInfo 
            enemy={currentEnemy} 
            round={currentEnemyIndex + 1} 
            className={currentEnemy.type === 'boss' ? 'boss-enemy' : ''}
          />
          
          {/* Show active power-ups */}
          {Object.keys(playerPowerUps).length > 0 && (
            <div className="status-effects">
              {Object.entries(playerPowerUps).map(([key, count]) => 
                count > 0 && (
                  <div key={key} className={`status-effect status-${key.toLowerCase()}`}>
                    {POWER_UPS[key].name} x{count}
                  </div>
                )
              )}
            </div>
          )}
          
          <div 
            ref={battleAreaRef}
            className={`battle-area ${animations.attack ? 'attack-animation' : ''} ${
              animations.critical ? 'critical-animation' : ''
            } ${animations.victory ? 'victory-animation' : ''}`}
          >
            <BattleLog logs={battleLogs} />
            <div className="controls">
              <button 
                className="btn btn-success" 
                onClick={handleAttack}
                disabled={!isPlayerTurn || currentEnemy.health <= 0 || player.health <= 0}
              >
                Attack
              </button>
              <button 
                className="btn btn-danger" 
                onClick={handleSkip}
                disabled={!isPlayerTurn || currentEnemy.health <= 0 || player.health <= 0}
              >
                Skip Battle
              </button>
              <button
                className="btn btn-warning"
                style={{ marginLeft: '1rem' }}
                onClick={() => {
                  setPlayer(prev => prev ? { ...prev, health: 0, money: 0 } : prev);
                  setShowCharacterSelect(true);
                  setSelectedCharacter(null);
                  setGameState(GAME_STATES.NAME_INPUT);
                }}
              >
                Forfeit
              </button>
            </div>
            
            {/* Particle Effects */}
            <ParticleEffect type="attack" trigger={animations.attack} />
            <ParticleEffect type="critical" trigger={animations.critical} />
            <ParticleEffect type="victory" trigger={animations.victory} />
          </div>
        </>
      );
    }

    if (gameState === GAME_STATES.SHOP && player) {
      return (
        <>
          <PlayerStats player={player} previousStats={previousPlayerStats} />
          <div className="battle-area">
            <h2>Nebula Station Shop</h2>
            <p>Purchase upgrades before your next battle!</p>
            
            {/* Show active power-ups */}
            {Object.keys(playerPowerUps).length > 0 && (
              <div className="status-effects">
                {Object.entries(playerPowerUps).map(([key, count]) => 
                  count > 0 && (
                    <div key={key} className={`status-effect status-${key.toLowerCase()}`}>
                      {POWER_UPS[key].name} x{count}
                    </div>
                  )
                )}
              </div>
            )}
            
            <Shop 
              player={player}
              onPurchase={handleShopPurchase}
              onLeave={handleShopLeave}
              powerUps={POWER_UPS}
            />
            
            <Achievements 
              achievements={ACHIEVEMENTS}
              unlockedAchievements={unlockedAchievements}
            />
          </div>
        </>
      );
    }

    if (gameState === GAME_STATES.GAME_OVER) {
      return (
        <div className="battle-area">
          <h2>Thanks for Playing Nebula Wars!</h2>
          <p>Your adventure in the nebula has ended.</p>
          <div className="controls">
            <button className="btn" onClick={resetGame}>
              Play Again
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <>
      {/* Render VersusScreen outside of game-container to avoid styling conflicts */}
      {showVersus && (
        <VersusScreen 
          character={selectedCharacter} 
          onContinue={() => {
            setShowVersus(false);
          }} 
        />
      )}
      
      <div className="game-container">
        <h1 className="title">Nebula Wars</h1>
        {showSplash ? (
          <SplashScreen onContinue={() => {
            setShowSplash(false);
            setShowMainMenu(true);
          }} />
        ) : showMainMenu ? (
          <MainMenu onContinue={() => {
            setShowMainMenu(false);
            setShowCharacterSelect(true);
          }} />
        ) : showCharacterSelect ? (
          <CharacterSelect onSelect={selection => {
            setSelectedCharacter(selection);
            setShowCharacterSelect(false);
            setShowVersus(true);
          }} />
        ) : selectedCharacter ? (
          <SideScroller character={selectedCharacter} />
        ) : (
          <>
            {renderGameContent()}
            <NameInputModal
              isOpen={gameState === GAME_STATES.NAME_INPUT}
              onSubmit={name => startGame(name)}
              onClose={() => {}}
            />
            <ConfirmModal
              isOpen={showSkipConfirm}
              title="Skip Battle?"
              message="Are you sure you want to skip this battle? You'll lose $10."
              onConfirm={confirmSkip}
              onCancel={() => setShowSkipConfirm(false)}
            />
            <ConfirmModal
              isOpen={showShopConfirm}
              title="Visit Shop?"
              message="The battle is over! Would you like to visit the Nebula Station shop before the next round?"
              onConfirm={() => handleShopConfirm(true)}
              onCancel={() => handleShopConfirm(false)}
            />
            <AlertModal
              isOpen={showGameOverAlert}
              title="Game Complete!"
              message={gameOverMessage}
              onClose={handleGameOverClose}
            />
            <ConfirmModal
              isOpen={showPlayAgainConfirm}
              title="Play Again?"
              message="Would you like to start a new adventure in the nebula?"
              onConfirm={() => handlePlayAgain(true)}
              onCancel={() => handlePlayAgain(false)}
            />
          </>
        )}
      </div>
    </>
  );
}

export default App;