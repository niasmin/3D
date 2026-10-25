import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../assets/scripts/core/game-data.ts';

const team = ['zhangfei', 'liubei', 'huangzhong', 'ganning', 'huatuo'].map(id => ({ id, lv: 5, star: 1, aw: 0 }));

test('battles are deterministic for the same seed', () => {
  const a = G.simulate(team, G.enemyTeam(3), 42), b = G.simulate(team, G.enemyTeam(3), 42);
  assert.deepEqual(a, b);
});

test('starter team clears stage 1-1', () => {
  assert.equal(G.simulate(team, G.enemyTeam(1), 1).winner, 'p');
});

test('level cap reaches 1000 at 5 stars and 5 awakenings', () => {
  assert.equal(G.levelCap(5, 5), 1000);
  assert.equal(G.levelCap(1, 0), 100);
});

test('every story stage builds a full enemy team', () => {
  for (let c = 0; c < G.STORY.length; c++) for (let s = 0; s < 3; s++) {
    const t = G.storyTeam(c, s);
    assert.equal(t.length, 5);
    assert.ok(t.every(x => G.HERO[x.id]));
  }
});

test('every general has a placeholder portrait and a bond reference that exists', () => {
  // painted art is an <img>, everyone else (and every mecha form) a drawn <svg>
  for (const h of G.HEROES) { assert.match(G.portrait(h.id), /^<(svg|img)/); assert.match(G.portrait(h.id, true), /^<svg/) }
  for (const b of G.BONDS) assert.ok(b.ids.every(id => G.HERO[id]), b.name);
});

test('a lone young Liu Bei clears the opening stage', () => {
  const solo = [{ id: 'liubei_y', lv: 1, star: 1, aw: 0 }, null, null, null, null, null];
  let wins = 0;
  for (let k = 0; k < 10; k++) if (G.simulate(solo, G.enemyTeam(1), 1000 + k).winner === 'p') wins++;
  assert.equal(wins, 10);
});

test('strategists deal magic damage and see magic defence', () => {
  assert.ok(G.ROLE.strat.mag && G.ROLE.heal.mag && !G.ROLE.war.mag);
  const s = G.stats('zhuge', 10, 1);
  assert.ok(s.mdef > s.def);
});

test('front-liners level up cheaper than strategists', () => {
  assert.ok(G.lvCost(20, 'war').gold < G.lvCost(20, 'strat').gold);
});

test('every stage belongs to a named region', () => {
  assert.equal(G.regionOf(1), 0);
  assert.equal(G.regionOf(11), 1);
  assert.ok(G.REGIONS.length >= 10);
});

test('healer-heavy enemy teams cannot stall a much stronger team to the round limit', () => {
  const strong = ['liubei_y', 'guanyu_y', 'zhangfei_y', 'huatuo', 'huangzhong', 'ganning'].map(id => ({ id, lv: 80, star: 2, aw: 0 }));
  for (const s of [44, 55]) assert.equal(G.simulate(strong, G.enemyTeam(s), s * 1000).winner, 'p');
});
