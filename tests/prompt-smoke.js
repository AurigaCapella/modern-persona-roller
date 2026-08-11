const fs = require("node:fs");
const vm = require("node:vm");

const html = fs.readFileSync("index.html", "utf8");
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) throw new Error("index.html 中未找到脚本");

const cutoff = scriptMatch[1].indexOf('document.querySelector("#rollAll")');
if (cutoff < 0) throw new Error("未找到页面初始化边界");

const testSource = `${scriptMatch[1].slice(0,cutoff)}
  const promptTestPresets = Object.keys(PROMPT_PRESETS);
  if (FRONT_HAIR_STYLES.length < 30 || BACK_HAIR_STYLES.length < 90) throw new Error("前发 / 后发池扩充量不足");
  if (Object.values(PERSONALITY_LAYERS).flat().length < 65 || NEGATIVE_PERSONALITIES.length < 40) throw new Error("性格池扩充量不足");
  if (BODY_FEATURES.length < 35 || HEALTH_CONDITIONS.length < 30) throw new Error("身体特征或健康状况池扩充量不足");
  const allPositivePersonalities = Object.values(PERSONALITY_LAYERS).flat();
  if (allPositivePersonalities.some(item => !PERSONALITY_PROMPTS[item.key]?.length)) throw new Error("正向性格存在未映射提示词");
  if (NEGATIVE_PERSONALITIES.some(item => !NEGATIVE_PERSONALITY_PROMPTS[item.key]?.length)) throw new Error("负面性格存在未映射提示词");
  if (BODY_FEATURES.some(item => /[\u3400-\u9fff]/.test(item.prompt.join(" ")))) throw new Error("身体特征池含未翻译提示词");
  if (HEALTH_CONDITIONS.some(item => /[\u3400-\u9fff]/.test(item.prompt.join(" ")))) throw new Error("健康状况池含未翻译提示词");
  for (let i = 0; i < 400; i += 1) {
    generateName();
    generateBody();
    generateHairColor();
    generateHairLength();
    generateBackHair();
    generateFrontHair();
    const rolledBackHair = BACK_HAIR_STYLES.find(item => item.key === state.meta.backHairKey);
    const rolledFrontHair = FRONT_HAIR_STYLES.find(item => item.key === state.meta.frontHairKey);
    if (!rolledBackHair.lengths.includes(state.meta.hairLengthKey)) throw new Error("后发超出头发长度限制");
    if (!rolledFrontHair.lengths.includes(state.meta.hairLengthKey)) throw new Error("前发超出头发长度限制");
    if (rolledBackHair.front && !rolledBackHair.front.includes(rolledFrontHair.category)) throw new Error("前发与后发类别冲突");
    generateEyes();
    generateMeasurements();
    generateSkin();
    generateOutfit();
    generateFinishing();
    generatePersonality();
    for (const presetKey of promptTestPresets) {
      state.promptPreset = presetKey;
      const prompts = buildImagePrompts();
      if (presetKey !== "gptimage" && !prompts.positive.includes("1girl")) throw new Error("标签提示词缺少 1girl");
      if (presetKey === "gptimage" && (!prompts.positive.includes("Subject:") || !prompts.negative.startsWith("Constraints:"))) {
        throw new Error("GPT Image 结构化提示词格式不完整");
      }
      if (!prompts.positive.includes("hair")) throw new Error("正向提示词缺少头发标签");
      if (rolledFrontHair.prompt.some(tag => !prompts.positive.includes(tag))) throw new Error("前发标签未写入提示词");
      if (rolledBackHair.prompt.some(tag => !prompts.positive.includes(tag))) throw new Error("后发标签未写入提示词");
      if (!prompts.negative.length) throw new Error("负向提示词为空");
      if (/undefined|null/.test(prompts.positive)) throw new Error("正向提示词含无效值");
      if (/[\\u3400-\\u9fff]/.test(prompts.positive + prompts.negative)) throw new Error("提示词含未翻译中文");
    }
  }
  for (const length of HAIR_LENGTHS) {
    const backPool = BACK_HAIR_STYLES.filter(item => item.lengths.includes(length.key));
    if (backPool.length < 16) throw new Error("某长度后发池不足 16 项：" + length.key);
    for (const back of backPool) {
      const frontPool = FRONT_HAIR_STYLES.filter(item => item.lengths.includes(length.key) && (!back.front || back.front.includes(item.category)));
      if (!frontPool.length) throw new Error("后发没有可兼容前发：" + back.key);
    }
  }
  state.meta.hairLengthKey = "long";
  state.meta.frontHairKey = "hime-sidelocks";
  state.locked = new Set(["frontHair"]);
  for (let i = 0; i < 500; i += 1) {
    generateBackHair();
    const lockedBack = BACK_HAIR_STYLES.find(item => item.key === state.meta.backHairKey);
    if (lockedBack.front && !lockedBack.front.includes("hime")) throw new Error("锁定前发后生成了不兼容后发");
  }
  state.locked.clear();
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

  const personalityByKey = new Map(Object.values(PERSONALITY_LAYERS).flat().map(tag => [tag.key,tag]));
  const negativePersonalityByKey = new Map(NEGATIVE_PERSONALITIES.map(tag => [tag.key,tag]));
  const assertPersonalityCompatible = keys => {
    for (let i = 0; i < keys.length; i += 1) {
      for (let j = i + 1; j < keys.length; j += 1) {
        if (!personalitiesCompatible(personalityByKey.get(keys[i]),personalityByKey.get(keys[j]))) {
          throw new Error("性格标签产生冲突：" + keys.join(","));
        }
      }
    }
  };
  for (const count of [1,2,3]) {
    state.filters.personalityCount = String(count);
    for (let i = 0; i < 500; i += 1) {
      generatePersonality();
      if (state.meta.personalityKeys.length !== count) throw new Error("固定性格数量未生效：" + count);
      assertPersonalityCompatible(state.meta.personalityKeys);
    }
  }
  state.filters.personalityCount = "random";
  const randomPersonalityCounts = {1:0,2:0,3:0};
  for (let i = 0; i < 6000; i += 1) {
    generatePersonality();
    randomPersonalityCounts[state.meta.personalityKeys.length] += 1;
    assertPersonalityCompatible(state.meta.personalityKeys);
  }
  if (Object.values(randomPersonalityCounts).some(count => count < 1500 || count > 2500)) {
    throw new Error("随机性格数量分布异常：" + JSON.stringify(randomPersonalityCounts));
  }

  state.filters.negativePersonality = true;
  const negativePersonalityCounts = {1:0,2:0};
  for (let i = 0; i < 5000; i += 1) {
    generatePersonality();
    generateNegativePersonality();
    const negatives = state.meta.negativePersonalityKeys;
    negativePersonalityCounts[negatives.length] += 1;
    if (negatives.length < 1 || negatives.length > 2) throw new Error("负面性格数量不在 1–2 个范围");
    for (const negativeKey of negatives) {
      const negative = negativePersonalityByKey.get(negativeKey);
      for (const positiveKey of state.meta.personalityKeys) {
        if (!personalitiesCompatible(negative,personalityByKey.get(positiveKey))) {
          throw new Error("负面性格与正向性格冲突：" + negativeKey + "/" + positiveKey);
        }
      }
    }
    if (negatives.length === 2 && !personalitiesCompatible(negativePersonalityByKey.get(negatives[0]),negativePersonalityByKey.get(negatives[1]))) {
      throw new Error("两个负面性格互相冲突：" + negatives.join(","));
    }
  }
  if (negativePersonalityCounts[1] < 1800 || negativePersonalityCounts[2] < 1800) {
    throw new Error("负面性格 1–2 个分布异常：" + JSON.stringify(negativePersonalityCounts));
  }

  state.filters.bodyFeatures = true;
  state.filters.healthConditions = true;
  for (let i = 0; i < 500; i += 1) {
    generateBodyFeatures();
    generateHealthConditions();
    const feature = BODY_FEATURES.find(item => item.key === state.meta.bodyFeatureKey);
    const health = HEALTH_CONDITIONS.find(item => item.key === state.meta.healthConditionKey);
    if (!feature || !health) throw new Error("身体特征或健康状况未写入元数据");
    const prompts = buildImagePrompts();
    if (feature.prompt.some(tag => !prompts.positive.includes(tag))) throw new Error("身体特征未写入提示词");
    if (health.prompt.some(tag => !prompts.positive.includes(tag))) throw new Error("可见辅助器具未写入提示词");
    if (/[\u3400-\u9fff]/.test(prompts.positive + prompts.negative)) throw new Error("可选身体设定提示词含未翻译中文");
  }
  state.filters.bodyFeatures = false;
  state.filters.healthConditions = false;
  state.filters.negativePersonality = false;

  const promptUi = {
    "#promptPreset": {value:"gptimage"},
    "#positivePrompt": {value:"",setAttribute(name,value){ this[name] = value; }},
    "#negativePrompt": {value:"",setAttribute(name,value){ this[name] = value; }},
    "#promptNote": {textContent:""},
    "#positivePromptTitle": {textContent:""},
    "#negativePromptTitle": {textContent:""},
    "#copyAllPrompts": {textContent:""},
    "#summaryValue": {textContent:"测试人设汇总"}
  };
  document.querySelector = selector => promptUi[selector] || null;
  state.promptPreset = "gptimage";
  renderPrompt();
  if (promptUi["#positivePromptTitle"].textContent !== "图像描述") throw new Error("GPT Image 图像描述标题未切换");
  if (promptUi["#negativePromptTitle"].textContent !== "约束条件") throw new Error("GPT Image 约束条件标题未切换");
  if (!promptUi["#copyAllPrompts"].textContent.includes("GPT Image")) throw new Error("GPT Image 复制按钮未切换");
  if (!promptUi["#positivePrompt"].value.includes("Composition:")) throw new Error("GPT Image 图像描述未渲染");
  if (!promptUi["#negativePrompt"].value.startsWith("Constraints:")) throw new Error("GPT Image 约束条件未渲染");
  const exportedPromptText = formatText();
  if (!exportedPromptText.includes("### 图像描述") || !exportedPromptText.includes("### 约束条件")) throw new Error("GPT Image 文本导出标题不正确");

  state.promptPreset = "novelai";
  renderPrompt();
  if (promptUi["#positivePromptTitle"].textContent !== "正向提示词") throw new Error("标签预设正向标题未恢复");
  if (promptUi["#negativePromptTitle"].textContent !== "负向提示词") throw new Error("标签预设负向标题未恢复");
  globalThis.promptTestReport = {
    rolls: 400,
    presets: promptTestPresets.length,
    profiles: promptTestProfiles.length,
    finishingEntries: promptTestProfiles.reduce((total,profile) => total + profile.shoes.length + profile.socks.length + profile.accessories.length,0),
    tallYouthful: heightAbove170,
    personalityCounts: randomPersonalityCounts,
    negativePersonalityCounts,
    frontHair:FRONT_HAIR_STYLES.length,
    backHair:BACK_HAIR_STYLES.length,
    positivePersonalities:Object.values(PERSONALITY_LAYERS).flat().length,
    negativePersonalities:NEGATIVE_PERSONALITIES.length,
    bodyFeatures:BODY_FEATURES.length,
    healthConditions:HEALTH_CONDITIONS.length
  };
`;

const context = {
  document: { querySelector: () => ({}) },
  console
};
vm.runInNewContext(testSource, context, { filename: "index.html" });
console.log(`Prompt smoke test OK: ${context.promptTestReport.rolls} rolls × ${context.promptTestReport.presets} presets; hair ${context.promptTestReport.frontHair} front / ${context.promptTestReport.backHair} back; personality ${context.promptTestReport.positivePersonalities} positive / ${context.promptTestReport.negativePersonalities} negative; body features ${context.promptTestReport.bodyFeatures}; health conditions ${context.promptTestReport.healthConditions}; negative distribution ${JSON.stringify(context.promptTestReport.negativePersonalityCounts)}`);
