import { _decorator, Component, sys } from 'cc';
import { GameState, newGame } from '../core/state';
const { ccclass } = _decorator;

const SAVE_KEY = 'kunphon-samkok-cocos-v1';

// Owns the save file. Attach once to a persistent node in the first scene.
@ccclass('GameManager')
export class GameManager extends Component {
  static inst: GameManager;
  state!: GameState;

  onLoad() {
    GameManager.inst = this;
    const raw = sys.localStorage.getItem(SAVE_KEY);
    try { this.state = raw ? JSON.parse(raw) : newGame() } catch { this.state = newGame() }
  }

  save() { sys.localStorage.setItem(SAVE_KEY, JSON.stringify(this.state)) }
}
