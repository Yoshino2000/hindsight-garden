// Built-in reading cards, checked against the sources in docs/plant-guide-sources.md.
// Representative plants explain the artwork's inspiration; they do not identify its species.
(function (root) {
  "use strict";

  const flowerBook = {
    label: "Greenaway《花语》（1884）",
    url: "https://www.gutenberg.org/cache/epub/31591/pg31591-images.html",
  };

  const guide = {
    sunflower: {
      botanical: "代表种：向日葵（Helianthus annuus）",
      origin:
        "原生于美国西部及墨西哥部分地区，属于菊科一年生植物。如今已广泛引种，既常见于花园，也会出现在路旁和田野。",
      story:
        "幼年的向日葵会随太阳移动，夜间又转回东方；成熟后通常不再追日，而是朝东迎接清晨。研究发现，较早暖起来的花盘也更受传粉昆虫欢迎。",
      meaning:
        "本花园寓意：向光与耐心。愿每天的一点时间，都能慢慢积成阳光。",
      sources: [
        {
          label: "北卡罗来纳州立大学 · 向日葵",
          url: "https://plants.ces.ncsu.edu/plants/helianthus-annuus/",
        },
        {
          label: "加州大学戴维斯分校 · 向日葵的生物钟",
          url: "https://www.ucdavis.edu/news/sunflowers-move-clock",
        },
      ],
    },
    hydrangea: {
      botanical: "代表种：大叶绣球（Hydrangea macrophylla）",
      origin:
        "大叶绣球的野生原生范围在日本。经过丰富的园艺选择，它在花园里展现出饱满的球形花序，也有花瓣轻盈舒展的蕾丝状花序。",
      story:
        "部分大叶绣球会在蓝色和粉色之间变化，其中的秘密，与土壤酸碱度影响铝的可利用性有关。白花等品种则有自己的颜色规律，这种变化并不适用于所有绣球。",
      meaning:
        "本花园寓意：相聚与感谢。让细小的努力聚成花团，也把感谢留给陪伴你的人。",
      sources: [
        {
          label: "英国皇家植物园 Kew · 大叶绣球",
          url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:791637-1/general-information",
        },
        {
          label: "英国皇家园艺学会 RHS · 绣球种植指南",
          url: "https://www.rhs.org.uk/plants/hydrangea/shrubby/growing-guide",
        },
      ],
    },
    tulip: {
      botanical: "园艺意象：郁金香属（Tulipa），不特指品种",
      origin:
        "郁金香不只属于荷兰。郁金香属的许多野生种来自中亚，后来进入奥斯曼宫廷与欧洲花园，才形成今天熟悉的园艺景观。",
      story:
        "十四世纪，野生郁金香已被种进奥斯曼宫廷；十七世纪，它又在欧洲引发收藏热潮。花园里一只安静的花杯，背后曾连着漫长的旅行与园艺交流。",
      meaning:
        "在 Greenaway 的十九世纪花语书里，红色郁金香代表「爱的告白」。一只安静的花杯，也可以盛放真诚的心意。",
      sources: [
        {
          label: "英国国家信托 · 郁金香的历史",
          url: "https://www.nationaltrust.org.uk/discover/history/gardens-landscapes/history-of-tulips",
        },
        {
          label: "英国皇家园艺学会 RHS · 郁金香属",
          url: "https://www.rhs.org.uk/plants/tulip",
        },
        flowerBook,
      ],
    },
    daisy: {
      botanical: "代表种：雏菊（Bellis perennis）",
      origin:
        "这里以多年生的雏菊为代表，原生范围包括马德拉、欧洲至地中海和中亚。它是低矮的小草花，常见于修剪过的草地。",
      story:
        "英国人把雏菊叫作「白昼的眼睛」：清晨，花序逐渐展开，草坪便像睁开许多小眼睛。牛津大学的植物档案记录了这个名字的来历，平常的小花也有昼夜节律。",
      meaning:
        "Greenaway 的十九世纪花语书赋予雏菊「纯真」之意。平常的一天，也值得为那些小美好开一朵花。",
      sources: [
        {
          label: "英国皇家植物园 Kew · 雏菊",
          url: "https://powo.science.kew.org/taxon/urn:lsid:ipni.org:names:184409-1/general-information",
        },
        {
          label: "牛津大学 · 雏菊与白昼的眼睛",
          url: "https://herbaria.plants.ox.ac.uk/bol/plants400/Profiles/AB/Bellis",
        },
        flowerBook,
      ],
    },
    rose: {
      botanical: "园艺意象：蔷薇属（Rosa），泛指园艺玫瑰",
      origin:
        "这里的「玫瑰」取蔷薇属园艺花卉的意象。它的野生成员分布于北半球，现代园艺类型则经历了长期杂交，拥有丰富多样的家谱。",
      story:
        "中国月季很早就受到园艺家的喜爱；传入欧洲后，它们反复开花的特性也参与了现代园艺玫瑰的育种。今天看见的一朵花，可能藏着跨越许多花园的家谱。",
      meaning:
        "Greenaway 的十九世纪花语书以「爱」解释玫瑰，不同颜色另有不同寄意。本花园借它表达珍爱：把值得珍惜的时光，留成层层舒展的花瓣。",
      sources: [
        {
          label: "伊利诺伊大学推广服务 · 玫瑰类型与育种",
          url: "https://extension.illinois.edu/roses/roses-types",
        },
        flowerBook,
      ],
    },
    lavender: {
      botanical: "代表种：狭叶薰衣草（Lavandula angustifolia）",
      origin:
        "这里以狭叶薰衣草为代表，原生于西班牙东北部至意大利一带。它属于唇形科，带着地中海地区日照与山地环境的印记。",
      story:
        "紫色花田不一定种着同一种薰衣草。法国自然历史博物馆介绍，常见的杂交薰衣草来自狭叶与宽叶薰衣草；相似的紫色和香气背后，也藏着不同的植物家谱。",
      meaning:
        "本花园寓意：安静与休息。让一簇温柔的紫色，提醒你给自己留一点余裕。",
      sources: [
        {
          label: "英国皇家植物园 Kew · 狭叶薰衣草",
          url: "https://powo.science.kew.org/taxon/449008-1",
        },
        {
          label: "法国国家自然历史博物馆 · 真薰衣草与杂交薰衣草",
          url: "https://www.mnhn.fr/fr/lavande-vraie",
        },
      ],
    },
    cosmos: {
      botanical: "代表种：秋英／波斯菊（Cosmos bipinnatus）",
      origin:
        "波斯菊的名字容易让人想到波斯，这里介绍的秋英却原生于墨西哥。它是一年生菊科草本，常被用作公园和花境中的观赏植物。",
      story:
        "它的属名 Cosmos 来自含有「秩序」之意的希腊词。那一圈轻盈的花瓣，其实围着由许多小花组成的黄色中心；看似随风散漫，也有整齐的结构。",
      meaning:
        "本花园寓意：自在与秩序。不必赶着长大，也能按自己的节奏开花。",
      sources: [
        {
          label: "新加坡国家公园局 NParks · 秋英",
          url: "https://www.nparks.gov.sg/florafaunaweb/flora/3/6/3683",
        },
        {
          label: "加州大学尔湾分校 · 波斯菊与名字来历",
          url: "https://nathistoc.bio.uci.edu/Plants%20of%20Upper%20Newport%20Bay%20(Robert%20De%20Ruff)/Asteraceae/Cosmos%20bipinnatus.htm",
        },
      ],
    },
    lily: {
      botanical: "园艺意象：百合属（Lilium），不特指品种",
      origin:
        "百合属的野生成员分布于北美、欧洲和亚洲，生活环境相当多样。园艺百合有丰富的颜色和花形，舒展的花瓣为花园带来明亮的层次。",
      story:
        "百合的地下鳞茎由一片片肉质鳞片组成。园艺上能用鳞片繁殖：在合适条件下，鳞片基部会长出小鳞茎；一小片储藏着的能量，也能慢慢成为新植株。",
      meaning:
        "Greenaway 的十九世纪花语书将白百合与「纯洁、甜美」相连。把这一朵明亮的花，送给温柔的祝愿。",
      sources: [
        {
          label: "英国皇家园艺学会 RHS · 百合属",
          url: "https://www.rhs.org.uk/plants/lilies",
        },
        {
          label: "爱荷华州立大学 · 百合的繁殖",
          url: "https://yardandgarden.extension.iastate.edu/how-to/how-propagate-garden-lilies",
        },
        flowerBook,
      ],
    },
  };

  root.GardenPlantGuide = guide;
  if (typeof module !== "undefined" && module.exports) module.exports = guide;
})(typeof globalThis !== "undefined" ? globalThis : self);
