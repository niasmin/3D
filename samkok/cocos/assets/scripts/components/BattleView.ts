import { _decorator, Component, Node, Prefab, instantiate, tween, Vec3, Label } from 'cc';
import { simulate } from '../core/game-data';
import { HeroCard } from './HeroCard';
const { ccclass, property } = _decorator;

type Entry = { id: string; lv: number; star: number; aw: number; bonus?: Record<string, number> } | null;

// Plays back a battle that core/simulate has already decided. The view never changes the outcome.
@ccclass('BattleView')
export class BattleView extends Component {
  @property(Prefab) unitPrefab: Prefab | null = null;
  @property([Node]) playerSlots: Node[] = [];   // 5 anchors: 0-1 front row, 2-4 back row
  @property([Node]) enemySlots: Node[] = [];
  @property(Label) roundLabel: Label | null = null;
  speed = 1;
  private units = new Map<string, Node>();

  play(team: Entry[], foes: Entry[], seed: number, onDone: (win: boolean) => void) {
    const res = simulate(team, foes, seed);
    for (const u of res.start) {
      const anchor = (u.side === 'p' ? this.playerSlots : this.enemySlots)[u.slot];
      const node = instantiate(this.unitPrefab!);
      node.getComponent(HeroCard)?.show(u.id, u.lv);
      anchor.addChild(node);
      this.units.set(u.uid, node);
    }
    let i = 0;
    const step = () => {
      if (i >= res.actions.length) return onDone(res.winner === 'p');
      const a = res.actions[i++];
      if (this.roundLabel) this.roundLabel.string = `รอบ ${a.round}`;
      const src = this.units.get(a.src);
      if (src) {
        const dy = a.src[0] === 'p' ? 24 : -24;
        tween(src).by(0.12 / this.speed, { position: new Vec3(0, dy, 0) }).by(0.12 / this.speed, { position: new Vec3(0, -dy, 0) }).start();
      }
      for (const h of a.hits) {
        const t = this.units.get(h.tgt);
        if (t && h.dead) tween(t).to(0.3 / this.speed, { scale: new Vec3(0.8, 0.8, 1) }).call(() => (t.active = false)).start();
        // TODO: hp bars, damage numbers and effects (see applyHits/fx in the web prototype)
      }
      this.scheduleOnce(step, (a.skill ? 1.1 : 0.7) / this.speed);
    };
    step();
  }
}
