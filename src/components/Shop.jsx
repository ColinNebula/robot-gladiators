import React from 'react';

const PowerUpShop = ({ player, onPurchase, powerUps }) => {
  const handlePowerUpPurchase = (powerUpKey, powerUp) => {
    if (player.money >= powerUp.cost) {
      onPurchase('powerup', powerUpKey);
    }
  };

  return (
    <div className="powerup-shop">
      <h4>Power-Ups</h4>
      <div className="shop-container">
        {Object.entries(powerUps).map(([key, powerUp]) => (
          <div key={key} className="shop-item power-up-item">
            <h5>{powerUp.name}</h5>
            <p>{powerUp.description}</p>
            <p><strong>Cost: ${powerUp.cost}</strong></p>
            <button 
              className={`btn ${player.money >= powerUp.cost ? 'btn-success' : ''}`}
              onClick={() => handlePowerUpPurchase(key, powerUp)}
              disabled={player.money < powerUp.cost}
            >
              {player.money < powerUp.cost ? 'Can\'t Afford' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const Shop = ({ player, onPurchase, onLeave, powerUps }) => {
  const canAffordRefill = player.money >= 7;
  const canAffordUpgrade = player.money >= 7;
  const needsRefill = player.health < player.maxHealth;

  const handleRefill = () => {
    if (canAffordRefill && needsRefill) {
      onPurchase('refill');
    }
  };

  const handleUpgrade = () => {
    if (canAffordUpgrade) {
      onPurchase('upgrade');
    }
  };

  return (
    <div className="shop-main">
      <div className="shop-section">
        <h3>Basic Upgrades</h3>
        <div className="shop-container">
          <div className="shop-item">
            <h4>Health Refill</h4>
            <p>Restore 20 health points</p>
            <p><strong>Cost: $7</strong></p>
            <button 
              className={`btn ${canAffordRefill && needsRefill ? 'btn-success' : ''}`}
              onClick={handleRefill}
              disabled={!canAffordRefill || !needsRefill}
            >
              {!needsRefill ? 'Health Full' : !canAffordRefill ? 'Can\'t Afford' : 'Buy Refill'}
            </button>
          </div>
          
          <div className="shop-item">
            <h4>Attack Upgrade</h4>
            <p>Increase attack power by 6</p>
            <p><strong>Cost: $7</strong></p>
            <button 
              className={`btn ${canAffordUpgrade ? 'btn-success' : ''}`}
              onClick={handleUpgrade}
              disabled={!canAffordUpgrade}
            >
              {!canAffordUpgrade ? 'Can\'t Afford' : 'Buy Upgrade'}
            </button>
          </div>
        </div>
      </div>

      <PowerUpShop 
        player={player} 
        onPurchase={onPurchase} 
        powerUps={powerUps}
      />
      
      <div className="shop-controls">
        <button className="btn btn-danger" onClick={onLeave}>
          Leave Shop
        </button>
      </div>
    </div>
  );
};

export default Shop;