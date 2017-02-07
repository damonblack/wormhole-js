import React, { Component } from 'react';
import logo from './logo.png';
import './App.css';

require('pixi.js');

class App extends Component {

  componentDidMount() {
    /* eslint-disable no-undef */
    const renderer = PIXI.autoDetectRenderer(500, 500);
    /* eslint-enable no-undef */
    let bob = document.getElementById('game');
    console.log(bob);
    bob.appendChild(renderer.view);
  }

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
        <div id="game" />
      </div>
    );
  }
}

export default App;
