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
  for (const profile of promptTestProfiles) {
    if (profile.shoes.length < 4 || profile.socks.length < 4 || profile.accessories.length < 7) {
      throw new Error("鞋袜配饰扩充量不足：" + profile.style);
    }
  }
  state.filters.bodyType = "youthful";
  state.filters.heightMin = 145;
  state.filters.heightMax = 190;
  let heightAbove170 = 0;
  let heightCenterCount = 0;
  let heightEdgeCount = 0;
  for (let i = 0; i < 10000; i += 1) {
    generateBody();
    generateMeasurements();
    const height = Number(state.values.measurements.match(/身高 (\\d+)/)[1]);
    if (height < 145 || height > 190) throw new Error("身高超出自定义范围");
    if (height > 170) heightAbove170 += 1;
    if (height >= 157 && height <= 167) heightCenterCount += 1;
    if (height <= 146 || height >= 189) heightEdgeCount += 1;
  }
  if (!heightAbove170) throw new Error("少女感体型未能生成 170 cm 以上身高");
  if (heightCenterCount <= heightEdgeCount * 8) throw new Error("身高边缘值权重过高");

  state.filters.heightMin = 172;
  state.filters.heightMax = 175;
  for (let i = 0; i < 200; i += 1) {
    generateMeasurements();
    const height = Number(state.values.measurements.match(/身高 (\\d+)/)[1]);
    if (height < 172 || height > 175) throw new Error("窄身高范围未生效");
  }

  state.filters.outfitType = "random";
  state.filters.finishingMode = "linked";
  generateOutfit();
  generateFinishing();
  if (state.meta.finishingProfileStyle !== state.meta.outfitProfile.style) throw new Error("联动模式未跟随衣着");
  const linkedStyle = state.meta.outfitProfile.style;
  state.filters.finishingMode = "independent";
  let independentStyleFound = false;
  for (let i = 0; i < 300; i += 1) {
    generateFinishing();
    if (state.meta.finishingProfileStyle !== linkedStyle) independentStyleFound = true;
    const prompts = buildImagePrompts();
    if (/[\u3400-\u9fff]/.test(prompts.positive + prompts.negative)) throw new Error("独立鞋袜配饰提示词含未翻译中文");
  }
  if (!independentStyleFound) throw new Error("独立模式仍被绑定到当前衣着");
  state.locked = new Set(["finishing"]);
  state.filters.finishingMode = "linked";
  updateFinishingLockDependency();
  if (!state.locked.has("outfit") || !state.meta.finishingAutoLockedOutfit) throw new Error("联动锁定依赖未生效");
  state.filters.finishingMode = "independent";
  updateFinishingLockDependency();
  if (state.locked.has("outfit") || state.meta.finishingAutoLockedOutfit) throw new Error("独立模式未解除自动锁定依赖");
  globalThis.promptTestReport = {
    rolls: 400,
    presets: promptTestPresets.length,
    profiles: promptTestProfiles.length,
    finishingEntries: promptTestProfiles.reduce((total,profile) => total + profile.shoes.length + profile.socks.length + profile.accessories.length,0),
    tallYouthful: heightAbove170
  };
`;

const context = {
  document: { querySelector: () => ({}) },
  console
};
vm.runInNewContext(testSource, context, { filename: "index.html" });
console.log(`Prompt smoke test OK: ${context.promptTestReport.rolls} rolls × ${context.promptTestReport.presets} presets; ${context.promptTestReport.profiles} outfit profiles; ${context.promptTestReport.finishingEntries} finishing entries; ${context.promptTestReport.tallYouthful} youthful rolls above 170 cm`);
