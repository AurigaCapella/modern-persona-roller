const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("fantasy/index.html", "utf8");
const match = html.match(/<script>([\s\S]*?)<\/script>/);
if (!match) throw new Error("fantasy/index.html 中未找到脚本");
const cutoff = match[1].indexOf("restore();buildControls();");
if (cutoff < 0) throw new Error("未找到页面初始化边界");

const source = `${match[1].slice(0, cutoff)}
  if (SPECIES.length < 18) throw new Error("种族池不足");
  if (ORIGINS.length < 40) throw new Error("出身池不足");
  if (ROLES.length < 30) throw new Error("职业池不足");
  if (POSITIVE.length < 24 || NEGATIVE.length < 38) throw new Error("性格池不足");
  if (MARKS.length < 18 || CURSES.length < 16 || HOOKS.length < 30) throw new Error("剧情类池不足");
  const required = ["name","species","origin","role","physique","hair","eyes","magic","weapon","outfit","accessory","personality","title","hook"];
  const presets = ["novelai","animagine","anime","gptimage"];
  const styles = ["balanced","light","classic"];
  const rarities = ["restrained","normal","wild"];
  const speciesSeen = new Set(), rolesSeen = new Set();
  for (let i = 0; i < 3000; i += 1) {
    state.filters.style = styles[i % styles.length];
    state.filters.rarity = rarities[i % rarities.length];
    state.filters.negative = true;
    state.filters.marks = true;
    state.filters.curse = true;
    state.filters.heterochromia = true;
    roll();
    required.forEach(key => { if (!state.values[key]) throw new Error("缺少字段：" + key); });
    speciesSeen.add(state.meta.species.key);
    rolesSeen.add(state.meta.role.key);
    if (state.meta.height < state.meta.species.height[0] || state.meta.height > state.meta.species.height[1]) throw new Error("种族身高越界");
    if (!state.meta.role.weapons.some(item => state.values.weapon.startsWith(item))) throw new Error("职业武器不兼容");
    if (!state.meta.role.armor.some(item => state.values.outfit.startsWith(item))) throw new Error("职业护甲不兼容");
    if (!state.meta.role.magic.some(item => state.values.magic.startsWith(item))) throw new Error("职业魔法不兼容");
    for (const n of state.meta.negative) {
      if (state.meta.positive.some(p => p.conflicts.includes(n.key))) throw new Error("正负性格冲突：" + n.key);
    }
    for (const preset of presets) {
      state.preset = preset;
      const p = prompt();
      if (!p.positive || !p.negative) throw new Error("提示词为空");
      if (preset !== "gptimage" && /[\\u3400-\\u9fff]/.test(p.positive + p.negative)) throw new Error("标签提示词含中文：" + p.positive);
      if (preset === "gptimage" && (!p.positive.startsWith("Create a polished") || !p.negative.startsWith("Constraints:"))) throw new Error("GPT Image 格式异常");
    }
  }
  if (speciesSeen.size < 16 || rolesSeen.size < 28) throw new Error("随机覆盖不足");
  state.locked.clear();
  toggleLock("weapon");
  if (!state.locked.has("weapon") || !state.locked.has("role")) throw new Error("武器锁定没有锁住职业上游");
  toggleLock("weapon");
  if (state.locked.has("weapon")) throw new Error("武器未能解除锁定");
  state.locked.clear();
  toggleLock("physique");
  if (!state.locked.has("species")) throw new Error("身高体型锁定没有锁住种族上游");
  state.locked.clear();
  state.filters.curse = true;
  for (const species of SPECIES) {
    state.meta.species = species;
    for (const role of ROLES) {
      state.meta.role = role;
      for (let i = 0; i < 20; i += 1) {
        genCurse();
        const c = CURSES.find(x => x.name === state.values.curse);
        if (c.species && !c.species.split(",").includes(species.key)) throw new Error("诅咒种族不兼容");
        if (c.groups && !c.groups.split(",").includes(role.group)) throw new Error("诅咒职业不兼容");
      }
    }
  }
  globalThis.report={species:SPECIES.length,origins:ORIGINS.length,roles:ROLES.length,positive:POSITIVE.length,negative:NEGATIVE.length,marks:MARKS.length,curses:CURSES.length,hooks:HOOKS.length};
`;

const stub = () => ({
  hidden: false,
  textContent: "",
  value: "",
  style: {},
  innerHTML: "",
  classList: { toggle() {} },
  querySelector: stub,
  append() {}
});
const context = {
  console,
  document: { querySelector: stub, createElement: stub },
  localStorage: { setItem() {}, getItem() { return null; } },
  navigator: { clipboard: { writeText() {} } },
  Date,
  Blob: function () {},
  URL: { createObjectURL() { return "blob:test"; }, revokeObjectURL() {} }
};
vm.runInNewContext(source, context, { filename: "fantasy/index.html" });
console.log("Fantasy smoke test OK:", context.report);
