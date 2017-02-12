import React, { Component } from 'react';
import { observable, autorun, action, computed } from 'mobx';
import { observer } from 'mobx-react';
import { Graphics, Container, autoDetectRenderer } from 'pixi.js';
import './Game.css';
import bindAll from 'lodash.bindall';

@observer
class Game extends Component {
  @observable hexRadiusRaw = 20;

  @computed
  get hexRadius() {
    return Math.floor(this.hexRadiusRaw);
  }

  @computed
  get mapOffsetX() {
    return this.hexWidth;
  }

  @computed
  get mapOffsetXOddRow() {
    return this.hexWidth / 2;
  }

  @computed
  get mapOffsetY() {
    return this.hexRadius;
  }

  @computed
  get lineWidth() {
    return Math.ceil(this.hexRadius / 40);
  }

  @computed
  get hexRowHeight() {
    return 3 / 2 * this.hexRadius;
  }

  @computed
  get hexWidth() {
    return Math.sqrt(3) * this.hexRadius;
  }

  @computed
  get hexColumnWidth() {
    return this.hexWidth;
  }

  constructor(props) {
    super(props);

    this.mapWidth = 25;
    this.mapHeight = 25;
    bindAll(this, ['zoomIn', 'zoomOut', 'onWheel', 'onClick', 'zoom', 'drawHexes', 'drawHex', 'pixelToHex']);
  }

  drawHexes() {
    this.map.clear();
    this.map.lineStyle(this.lineWidth, 0x666666, 1);

    for (let j = 0; j < this.mapWidth; j++) {
      for (let i = 0; i < this.mapHeight; i++) {
        const offsetX = j % 2 ? this.mapOffsetXOddRow : this.mapOffsetX;
        const x = i * this.hexColumnWidth + offsetX;
        const y = j * this.hexRowHeight + this.mapOffsetY;
        this.drawHex({x, y});
      }
    }
    this.renderer.render(this.stage);
  }

  drawHex({x, y}) {
    this.map.drawPolygon([
      x, y - this.hexRadius,
      x - (this.hexWidth / 2), y - (this.hexRadius / 2),
      x - (this.hexWidth / 2), y + (this.hexRadius / 2),
      x, y + this.hexRadius,
      x + (this.hexWidth / 2), y + (this.hexRadius / 2),
      x + (this.hexWidth / 2), y - (this.hexRadius / 2),
      x, y - this.hexRadius
    ]);
  }

  fillHex(point, color, alpha = 1) {
    this.map.beginFill(color, alpha);
    this.drawHex(point);
    this.map.endFill();
  }

  componentDidMount() {
    this.renderer = autoDetectRenderer(900, 600);
    this.stage = new Container();
    this.map = new Graphics();

    this.renderer.clearBeforeRender = true;
    this.stage.addChild(this.map);

    this.renderer.view.addEventListener('click', this.onClick);
    this.renderer.view.addEventListener('wheel', this.onWheel, false);
    this.gameDiv.appendChild(this.renderer.view);
    autorun(this.drawHexes);
  }

  @action
  zoomIn() {
    this.zoom(1);
    //
    //
    // this.map.lineWidth = 0;
    // for (let y = 0; y < 900; y += 1) {
    //   console.log(`rendering row ${y}`);
    //   for (let x = 0; x < 600; x += 1) {
    //     const hex = this.pixelToHex(x, y);
    //
    //     if (hex.r == 0 && hex.q % 2) {
    //       this.map.beginFill(0x93493A)
    //       this.map.drawRect(x, y, 1, 1);
    //       console.log('bing');
    //       this.map.endFill();
    //     }
    //   }
    // }
  }

  @action
  zoomOut() {
    this.zoom(-1);
    // this.map.lineWidth = 0;
    // for (let y = 0; y < this.mapWidth ; y += 3) {
    //   for (let x = 0; x < 600; x += 3) {
    //     const hex = this.pixelToHex(x, y);
    //
    //     if (hex.r == 0 && hex.q % 2) {
    //       this.map.beginFill(0x93493A);
    //       this.map.drawRect(x, y, 3, 3);
    //       this.map.endFill();
    //     }
    //   }
    // }
  }

  @action
  zoom(delta) {
    this.hexRadiusRaw += delta;
    if (this.hexRadius < 5) this.hexRadiusRaw = 5;
    if (this.hexRadius > 500) this.hexRadiusRaw = 500;
  }

  onWheel(e) {
    e.stopPropagation();
    e.preventDefault();
    this.zoom(e.deltaY / 20);
  }

  onClick(e) {
    console.log(e);
    console.log(e.offsetX);
    console.log(e.offsetY);
    console.log(this.hexRadius);
    console.log(`hex width ${this.hexWidth}`);
    const hex = this.pixelToHex(e.offsetX, e.offsetY);
    console.log(hex);
    this.fillHex(this.hexToPixel(hex), 0x232233, .75);
    this.renderer.render(this.stage);
  }

  hexToPixel(hex) {
    const x = this.hexWidth * (hex.q + hex.r/2) + this.mapOffsetX;
    const y = this.hexRadius * 3/2 * hex.r + this.mapOffsetY;
    return { x, y };
  }

  pixelToHex(xValue, yValue) {
    const x = xValue - this.mapOffsetX;
    const y = yValue - this.mapOffsetY;
    const q = ((x * Math.sqrt(3) / 3) - (y / 3)) / this.hexRadius;
    const r = y * 2 / 3 / this.hexRadius;
    return this.hexRound({q, r});
  }

  cubeRound(h) {
    let rx = Math.round(h.x);
    let ry = Math.round(h.y);
    let rz = Math.round(h.z);

    const x_diff = Math.abs(rx - h.x);
    const y_diff = Math.abs(ry - h.y);
    const z_diff = Math.abs(rz - h.z);

    if (x_diff > y_diff && x_diff > z_diff)
      rx = -ry - rz;
    else if (y_diff > z_diff)
      ry = -rx - rz;
    else
      rz = -rx - ry;

    return { x: rx, y: ry, z: rz };
  }

  hexRound(h) {
    return this.cubeToHex(this.cubeRound(this.hexToCube(h)));
  }

  cubeToHex(h) {
    const q = h.x;
    const r = h.z;
    return { q, r };
  }

  hexToCube(h) {
    const x = h.q;
    const z = h.r;
    const y = -x - z;
    return { x, y, z };
  }

  render() {
    return (
      <div>
        <div className="controls">
          <button onClick={this.zoomIn}>+</button>
          <button onClick={this.zoomOut}>-</button>
        </div>
        <div ref={el => this.gameDiv = el} className="game-canvas"/>
      </div>
    );
  }
}

export default Game;
