import React, { Component } from 'react';
import { observable, autorun, action, computed } from 'mobx';
import { observer } from 'mobx-react';
import { Graphics, Container, autoDetectRenderer } from 'pixi.js';
import './Game.css';
import bindAll from 'lodash.bindall';

@observer
class Game extends Component {
  @observable hexRadiusRaw = 20;
  @observable origin = { x: Math.floor(Math.sqrt(3) * 20), y: 20 };
  @observable selectedHexes = [];

  @computed
  get hexRadius() {
    return Math.floor(this.hexRadiusRaw);
  }

  @computed
  get mapOffsetXOddRow() {
    return this.hexWidth / 2;
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
  };

  constructor(props) {
    super(props);
    bindAll(this, [
      'zoomIn', 'zoomOut', 'onWheel', 'onClick', 'onMouseDown', 'onMouseMove', 'onMouseUp', 'zoom', 'drawHexes', 'drawHex', 'pixelToHex']);
  }

  fillSelectedHexes() {
    this.selectedHexes.forEach((hex) => this.fillHex(this.hexToPixel(hex), 0x777777));
  }

  drawHexes() {
    let row = 0;
    this.map.clear();
    this.map.lineStyle(this.lineWidth, 0x666666, 1);

    const hexWidth = this.hexWidth;
    const hexRowHeight = this.hexRowHeight;

    for (let j = (this.origin.y % hexRowHeight); j < this.renderer.height; j += hexRowHeight) {
      const offsetX = (j - this.origin.y) % (2 * hexRowHeight) === 0 ? 0 : -this.mapOffsetXOddRow;
      for (let i = this.origin.x % hexWidth; i < this.renderer.width + this.mapOffsetXOddRow; i += hexWidth) {
        const x = i + offsetX;
        const y = j;
        this.drawHex({ x, y });
      }
    }

    this.map.lineStyle(this.lineWidth * 3, 0x990022, 1);
    this.drawHex(this.origin);
    this.map.lineStyle(this.lineWidth, 0x666666, 1);
    this.fillSelectedHexes();
    this.renderer.render(this.stage);
  }

  drawHex({ x, y }) {
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
    this.renderer = autoDetectRenderer(1200, 900);
    this.stage = new Container();
    this.map = new Graphics();

    this.renderer.clearBeforeRender = true;
    this.stage.addChild(this.map);

    this.renderer.view.addEventListener('click', this.onClick);
    this.renderer.view.addEventListener('wheel', this.onWheel, false);
    this.renderer.view.addEventListener('mousedown', this.onMouseDown, false);
    this.renderer.view.addEventListener('mousemove', this.onMouseMove, false);
    this.renderer.view.addEventListener('mouseup', this.onMouseUp, false);
    this.gameDiv.appendChild(this.renderer.view);
    autorun(this.drawHexes);
  }

  onMouseDown(e) {
    if (e.buttons === 1) {
      //How far are we from the current origin?
      this.dragOffset = { x: e.x - this.origin.x, y: e.y - this.origin.y };
    }
  }

  onMouseMove({ x, y }) {
    if (this.dragOffset) {
      this.origin.x = x - this.dragOffset.x;
      this.origin.y = y - this.dragOffset.y;
    }
  }

  onMouseUp(e) {
    if (this.dragOffset) {
      this.dragOffset = null;
    }
  }

  @action
  zoomIn() {
    this.zoom(1);
  }

  @action
  zoomOut() {
    this.zoom(-1);
  }

  @action
  zoom(delta, hexX, hexY, offsetX, offsetY) {
    this.hexRadiusRaw += delta;
    if (this.hexRadius < 10) this.hexRadiusRaw = 10;
    if (this.hexRadius > 500) this.hexRadiusRaw = 500;
    this.origin.x = Math.floor(offsetX - hexX * this.hexWidth);
    this.origin.y = Math.floor(offsetY - hexY * this.hexRowHeight);
  }

  onWheel(e) {
    e.stopPropagation();
    e.preventDefault();
    const hexDistanceToOriginX = (e.offsetX - this.origin.x) / this.hexWidth;
    const hexDistanceToOriginY = (e.offsetY - this.origin.y) / this.hexRowHeight;
    const zoomAmount = e.deltaY / 20;

    this.zoom(zoomAmount, hexDistanceToOriginX, hexDistanceToOriginY, e.offsetX, e.offsetY);
  }

  onClick(e) {
    if (this.dragOffset) return;
    const hex = this.pixelToHex(e.offsetX, e.offsetY);
    let selectedHex = this.selectedHexes.find(aHex => aHex.q == hex.q && aHex.r == hex.r);

    if (selectedHex) {
      this.selectedHexes.remove(selectedHex);
    } else {
      this.selectedHexes.push(hex);
    }
  }

  hexToPixel(hex) {
    const x = this.hexWidth * (hex.q + hex.r / 2) + this.origin.x;
    const y = this.hexRadius * 3 / 2 * hex.r + this.origin.y;
    return { x, y };
  }

  pixelToHex(xValue, yValue) {
    const x = xValue - this.origin.x;
    const y = yValue - this.origin.y;
    const q = ((x * Math.sqrt(3) / 3) - (y / 3)) / this.hexRadius;
    const r = y * 2 / 3 / this.hexRadius;
    return this.hexRound({ q, r });
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
