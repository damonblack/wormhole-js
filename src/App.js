import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to Wormhole</h2>
        </div>
        <p className="App-intro">
          This is my new game. Play my game. Love my game.
        </p>
        <canvas/>
      </div>
    );
  }
}

export default App;
