import React from 'react';

const BattleLog = ({ logs }) => {
  return (
    <div className="battle-log">
      <h4>Battle Log</h4>
      {logs.length === 0 ? (
        <div className="log-entry">Battle hasn't started yet...</div>
      ) : (
        logs.map((log, index) => {
          const message = typeof log === 'string' ? log : log.message;
          const isCritical = typeof log === 'object' && log.isCritical;
          
          return (
            <div key={index} className={`log-entry ${isCritical ? 'critical-hit' : ''}`}>
              {message}
            </div>
          );
        })
      )}
    </div>
  );
};

export default BattleLog;