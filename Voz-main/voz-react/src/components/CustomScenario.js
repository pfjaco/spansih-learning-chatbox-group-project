// src/components/CustomScenario.js
import React from 'react';
import './CustomScenario.css';

function CustomScenario({ onCustomScenarioClick }) {
  return (
    <div>
      <div className="custom-scenario">Scenarios:</div>
      <hr></hr>
      <button className="scenario-box" onClick={onCustomScenarioClick}>
        Ordering at a restaurant
      </button>

    </div>
  );
}

export default CustomScenario;
