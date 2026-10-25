"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const vm = require("node:vm");
const core = require("../core.js");
const I = require("../i18n.js");

test("system language uses its primary language and unsupported languages fall back to English", () => {
  for (const locale of ["zh-CN", "zh-TW", "ZH_hans", "zh"]) assert.equal(I.resolveLanguage(locale), "zh-CN");
  for (const locale of ["ja", "ja-JP", "JA_jp"]) assert.equal(I.resolveLanguage(locale), "ja");
  for (const locale of ["en-US", "en-GB", "fr-FR", "ko-KR", "de", "", undefined]) assert.equal(I.resolveLanguage(locale), "en");
  for (const [locale,expected] of [["ja-JP","ja"],["en-US","en"],["zh-CN","zh-CN"],["fr-FR","en"]]) {
    const context=vm.createContext({navigator:{language:locale,languages:[locale,"zh-CN"]}});
    vm.runInContext(readFileSync(require.resolve("../i18n.js"),"utf8"),context);
    assert.equal(context.GardenI18n.locale,expected);
  }
});

test("every catalogue entry has two complete translations with exactly the same placeholders", () => {
  const tokens = value => [...value.matchAll(/\{\d+\}/g)].map(match=>match[0]).sort();
  assert.ok(Object.keys(I.MESSAGES).length > 600);
  for (const [key,translations] of Object.entries(I.MESSAGES)) {
    assert.equal(translations.length,2,key);
    for (const text of translations) {
      assert.ok(text.trim(),key);
      assert.deepEqual(tokens(text),tokens(key),key);
    }
  }
});

test("all built-in plant and achievement metadata localizes without changing persistent identifiers", () => {
  for (const locale of ["en", "ja"]) {
    const translator=I.create(locale);
    for (const plant of core.SPECIES) {
      assert.notEqual(translator.t(plant.name),plant.name);
      assert.notEqual(translator.t(plant.description),plant.description);
    }
    for (const entry of core.ACHIEVEMENTS) {
      const before=structuredClone(entry), translated=translator.achievement(entry);
      assert.equal(translated.id,entry.id);
      for (const field of ["name","condition","description"]) {
        assert.notEqual(translated[field],entry[field],`${locale} ${entry.id} ${field}`);
        assert.ok(!/\{\d+\}/.test(translated[field]),`${locale} ${entry.id}`);
        if(locale==="en") assert.ok(!/[\u3400-\u9fff]/.test(translated[field]),`${entry.id} ${translated[field]}`);
      }
      assert.deepEqual(entry,before);
    }
  }
});

test("longer core templates win over generic time templates and user content stays intact", () => {
  const en=I.create("en"),ja=I.create("ja");
  assert.equal(en.message("连续 25 分钟"),"25 min uninterrupted");
  const name="论文・My花 <b> {0}";
  assert.equal(en.t("你的「{0}」开花了！回花园看看吧。",name),`“${name}” has bloomed! Come see your garden.`);
  assert.equal(ja.message(`你的「${name}」开花了！回花园看看吧。`),`「${name}」が咲きました！庭を見に来てください。`);
  assert.equal(en.message("Custom error <script>花</script>"),"Custom error <script>花</script>");
});

test("every original static HTML label, hint and accessibility attribute has offline translations", () => {
  const html=readFileSync(require.resolve("../ui/index.html"),"utf8");
  for(const match of html.matchAll(/>([^<>]+)</g)) {
    const text=match[1].trim().replace(/\s+/g," ");
    if(/[\u3400-\u9fff]/.test(text)) assert.ok(Object.hasOwn(I.MESSAGES,text),text);
  }
  for(const match of html.matchAll(/(?:aria-label|placeholder|title)="([^"]+)"/g))
    if(/[\u3400-\u9fff]/.test(match[1])) assert.ok(Object.hasOwn(I.MESSAGES,match[1]),match[1]);
});

test("recommendations and plant guide localize while keeping host category names and original URLs", () => {
  for(const locale of ["en","ja"]) {
    const context=vm.createContext({navigator:{language:locale},GardenCore:core});
    for(const file of ["../i18n.js","../ui/collection.js","../ui/plant-guide.js"])
      vm.runInContext(readFileSync(require.resolve(file),"utf8"),context);
    const C=context.GardenCollection;
    assert.equal(C.suggestName(context.GardenI18n.t("向日葵"),["我自己的分类"],"",()=>0),
      locale==="en"?"我自己的分类 · Sunflower":"我自己的分類".replace("分類","分类")+"のヒマワリ");
    const suggested=C.suggestName(context.GardenI18n.t("向日葵"),[],"",()=>0);
    assert.ok(suggested.includes(locale==="en"?"Paper reading":"論文読み"));
    assert.ok(C.suggestName("🌷".repeat(40),["分類".repeat(50)],"",()=>0).length<=40);
    const guide=context.GardenPlantGuide;
    for(const item of Object.values(guide)) for(const field of ["botanical","origin","story","meaning"]) {
      assert.ok(item[field].length>5);
      if(locale==="en") assert.ok(!/[\u3400-\u9fff]/.test(item[field]),item[field]);
    }
    assert.equal(guide.sunflower.sources[0].url,"https://plants.ces.ncsu.edu/plants/helianthus-annuus/");
  }
});
