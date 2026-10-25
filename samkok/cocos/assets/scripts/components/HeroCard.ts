import { _decorator, Component, Label, Sprite, SpriteFrame, resources } from 'cc';
import { HERO } from '../core/game-data';
const { ccclass, property } = _decorator;

// One collection card. Art is loaded from resources/heroes/<id>_card (see the art bible for file names).
@ccclass('HeroCard')
export class HeroCard extends Component {
  @property(Label) nameLabel: Label | null = null;
  @property(Label) levelLabel: Label | null = null;
  @property(Sprite) art: Sprite | null = null;

  show(id: string, lv: number, mech = false) {
    const h = HERO[id];
    if (this.nameLabel) this.nameLabel.string = h.th;
    if (this.levelLabel) this.levelLabel.string = `Lv.${lv}`;
    resources.load(`heroes/${id}_${mech ? 'mech' : 'card'}/spriteFrame`, SpriteFrame, (err, frame) => {
      if (!err && this.art) this.art.spriteFrame = frame;
    });
  }
}
