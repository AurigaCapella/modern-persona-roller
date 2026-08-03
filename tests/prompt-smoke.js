const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("index.html 中未找到脚本");

const cutoff = scriptMatch[1].indexOf('document.querySelector("#rollAll")');
if (cutoff < 0) throw new Error("未找到页面初始化边界");

const testSource = `${scriptMatch[1].slice(0,cutoff)}
  const promptTestPresets = Object.keys(PROMPT_PRESETS);
  for (let i = 0; i < 400; i += 1) {
    generateName();
    generateBody();
    generateHairColor();
    generateHairLength();
    generateHairStyle();
    generateEyes();
    generateMeasurements();
    generateSkin();
    generateOutfit();
    generateFinishing();
    generatePersonality();
    for (const presetKey of promptTestPresets) {
      state.promptPreset = presetKey;
      const prompts = buildImagePrompts();
      if (!prompts.positive.includes("1girl")) throw new Error("正向提示词缺少 1girl");
      if (!prompts.positive.includes("hair")) throw new Error("正向提示词缺少头发标签");
      if (!prompts.negative.length) throw new Error("负向提示词为空");
      if (/undefined|null/.test(prompts.positive)) throw new Error("正向提示词含无效值");
      if (/[\\u3400-\\u9fff]/.test(prompts.positive + prompts.negative)) throw new Error("提示词含未翻译中文");
    }
  }
  const promptTestProfiles = Object.values(OUTFITS).flat();
  const unmappedFinishing = {
    shoes: promptTestProfiles.flatMap(profile => profile.shoes).filter(item => !footwearPrompt(item)),
    socks: promptTestProfiles.flatMap(profile => profile.socks).filter(item => !socksPrompt(item)),
    accessories: promptTestProfiles.flatMap(profile => profile.accessories).filter(item => !accessoryPrompt(item))
  };
  if (Object.values(unmappedFinishing).some(items => items.length)) {
    throw new Error("鞋袜配饰存在未映射项：" + JSON.stringify(unmappedFinishing));
  }
  globalThis.promptTestReport = { rolls: 400, presets: promptTestPresets.length };
`;

const context = {
  document: { querySelector: () => ({}) },
  console
};
vm.runInNewContext(testSource, context, { filename: "index.html" });
console.log(`Prompt smoke test OK: ${context.promptTestReport.rolls} rolls × ${context.promptTestReport.presets} presets`);
