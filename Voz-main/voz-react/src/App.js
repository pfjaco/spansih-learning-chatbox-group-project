// src/App.js
import React from 'react';
import './App.css';
import CustomScenario from './components/CustomScenario';
import ChatbotPage from './pages/ChatbotPage';
import { Route, Switch, useHistory } from 'react-router-dom';

function App() {
  const history = useHistory();

  const goToChatbotPage = () => {
    history.push('/chatbot');
  };

  return (
    <div className="App">
      <Switch>
        <Route exact path="/">
          <header className="App-header">
            <h2>Voz</h2>
            <h3>AI Language Learning</h3>
          </header>
          <main className="App-main">
            <CustomScenario onCustomScenarioClick={goToChatbotPage} />
          </main>
        </Route>
        <Route path="/chatbot" component={ChatbotPage} />
      </Switch>
    </div>
  );
}

export default App;
