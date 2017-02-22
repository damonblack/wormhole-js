import React, { Component } from 'react';
import { observable, autorunAsync, action, computed } from 'mobx';
import { observer } from 'mobx-react';
import { Graphics, Container, Sprite, Rectangle, autoDetectRenderer } from 'pixi.js';
import { getWormholeSize } from './lib/utils';
import './Game.css';
import wormholeImage from './logo.png';
import bindAll from 'lodash.bindall';

@observer
class Game extends Component {
  @observable hexRadiusRaw = 20;
  @observable origin = { x: this.renderer.view.width/2, y: this.renderer.view.height/2 };
  @observable selectedHexes = [];

  @computed
  get hexRadius() {
    return Math.floor(this.hexRadiusRaw);
  }

  @computed
  get hexStartLocation() {
    const repeatHeight = 2 * this.hexRowHeight;
    const x = this.origin.x % this.hexWidth - this.hexWidth;
    const y = this.origin.y % repeatHeight - repeatHeight;
    return {x, y};
  }

  @computed
  get mapOffsetXOddRow() {
    return this.hexWidth / 2;
  }

  @computed
  get wormholeSize() {
    return getWormholeSize(this.hexRadius);
  }

  @computed
  get lineWidth() {
    return Math.ceil(this.hexRadius / 100);
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
    bindAll(this, ['zoomIn', 'zoomOut', 'onWheel', 'onClick', 'onMouseDown', 'onMouseMove', 'onMouseUp', 'onKeyDown', 'zoom', 'drawHexes', 'drawHex', 'pixelToHex']);
  }

  fillSelectedHexes() {
    this.selectedHexes.forEach((hex) => this.fillHex(this.hexToPixel(hex), 0x777777, 0.4));
  }

  drawHexes() {
    this.map.clear();
    this.map.lineStyle(this.lineWidth, 0x444444, 1);
    // let row = 1;
    // for (let j = this.hexStartLocation.y; j < this.renderer.height + this.hexRowHeight; j += this.hexRowHeight) {
    //   const offsetX = row % 2 ? 0 : -this.mapOffsetXOddRow;
    //   for (let i = this.hexStartLocation.x; i < this.renderer.width + this.mapOffsetXOddRow; i += this.hexWidth) {
    //     this.drawHex({ x: i + offsetX, y: j });
    //   }
    //   row += 1;
    // }

    this.wormholeSprite.x = this.origin.x - this.wormholeSize/2;
    this.wormholeSprite.y = this.origin.y - this.wormholeSize/2;
    this.wormholeSprite.width = this.wormholeSize;
    this.wormholeSprite.height = this.wormholeSize;
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
    this.renderer = autoDetectRenderer(1200, 900); //, {}, true); // uncomment to force canvas
    this.stage = new Container();
    this.map = new Graphics();
    this.map.interactive = true;
    this.map.hitArea = new Rectangle(0, 0, 1200, 900);
    this.wormholeSprite = Sprite.fromImage(wormholeImage);
    this.wormholeSprite.height = 40;
    this.wormholeSprite.width = 40;
    this.wormholeSprite.x = this.origin.x - 20;
    this.wormholeSprite.y = this.origin.y - 20;
    this.mouseDownPoint = { x: 0, y: 0 };
    this.minDistanceConsideredDrag = 4;

    this.renderer.clearBeforeRender = true;
    this.stage.addChild(this.wormholeSprite);
    this.stage.addChild(this.map);

    this.map.on('click', this.onClick);
    this.renderer.view.addEventListener('wheel', this.onWheel, false);
    this.renderer.plugins.interaction.addListener('mousedown', this.onMouseDown);
    this.renderer.plugins.interaction.addListener('mousemove', this.onMouseMove);
    this.renderer.plugins.interaction.addListener('mouseup', this.onMouseUp);
    this.gameDiv.focus();
    this.gameDiv.appendChild(this.renderer.view);
    autorunAsync(this.drawHexes, 1000/60); // This caps the rate of mobx updates
  }

  onMouseDown(interactionEvent) {
    const data = interactionEvent.data;
    if (data.originalEvent.buttons === 1) {
      //How far are we from the current origin?
      this.dragOffset = { x: data.global.x - this.origin.x, y: data.global.y - this.origin.y };
      this.mouseDownPoint = { x: data.global.x, y: data.global.y };
    }
  }

  onMouseMove(interactionEvent) {
    const data = interactionEvent.data;
    if (this.dragOffset) {
      this.origin.x = data.global.x - this.dragOffset.x;
      this.origin.y = data.global.y - this.dragOffset.y;
    }
  }

  onClick(interactionEvent) {
    const data = interactionEvent.data;
    let draggedDistance = Math.sqrt(
      Math.pow((this.mouseDownPoint.x - data.global.x), 2) + Math.pow((this.mouseDownPoint.y - data.global.y), 2)
    );

    //if this was a "drag" rather than a "click", exit.
    console.log(`distance dragged: ${draggedDistance}`);
    if (draggedDistance >= this.minDistanceConsideredDrag) {
      return;
    }

    const hex = this.pixelToHex(data.global.x, data.global.y);
    let selectedHex = this.selectedHexes.find(aHex => aHex.q == hex.q && aHex.r == hex.r);

    if (selectedHex) {
      this.selectedHexes.remove(selectedHex);
    } else {
      this.selectedHexes.push(hex);
    }
  }

  onMouseUp(interactionEvent) {
    if (this.dragOffset) {
      this.dragOffset = null;
    }
  }

  MOVE_MAP= {
    37: () => this.origin.x += 10, // ArrowLeft
    38: () => this.origin.y += 10, // ArrowUp
    39: () => this.origin.x -= 10, // ArrowRight
    40: () => this.origin.y -= 10, // ArrowDown
  };

  onKeyDown(e) {
    e.preventDefault();
    const moveFunc = this.MOVE_MAP[e.keyCode];
    if (moveFunc) moveFunc();
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
  zoom(delta, hexX=0, hexY=0, offsetX=0, offsetY=0) {
    this.hexRadiusRaw += delta;
    if (this.hexRadius < 10) this.hexRadiusRaw = 10;
    if (this.hexRadius > 500) this.hexRadiusRaw = 500;
    this.origin.x = offsetX - hexX * this.hexWidth;
    this.origin.y = offsetY - hexY * this.hexRowHeight;
  }

  onWheel(e) {
    e.stopPropagation();
    e.preventDefault();
    const hexDistanceToOriginX = (e.offsetX - this.origin.x) / this.hexWidth;
    const hexDistanceToOriginY = (e.offsetY - this.origin.y) / this.hexRowHeight;
    const zoomAmount = this.hexRadius * e.deltaY / 2000;

    this.zoom(zoomAmount, hexDistanceToOriginX, hexDistanceToOriginY, e.offsetX, e.offsetY);
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
      <div >
        <div className="controls">
          <button onClick={this.zoomIn}>+</button>
          <button onClick={this.zoomOut}>-</button>
        </div>
        <div ref={el => this.gameDiv = el} className="game-canvas" tabIndex="1" onKeyDown={this.onKeyDown}/>
      </div>
    );
  }
}

export default Game;
