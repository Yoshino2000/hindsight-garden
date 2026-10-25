"use strict";
const test=require("node:test"), assert=require("node:assert/strict");
const C=require("../core.js"), V=require("../ui/variants.js");
const clamp=value=>Math.max(0,Math.min(1,value));
function mask(palette,rgb) {
  const value=clamp(rgb.reduce((sum,value,index)=>sum+palette.mask[index]*value,palette.mask[3]));
  return value*(palette.brightness?clamp(2.5*rgb[0]+2.5*rgb[1]-2.4):1);
}
test("all eight hidden palettes are distinct and keep representative green leaves outside their masks",()=>{
  assert.deepEqual(Object.keys(V.PALETTES),C.SPECIES.map(item=>item.id));
  assert.equal(new Set(Object.values(V.PALETTES).map(item=>item.color)).size,8);
  for(const [id,palette]of Object.entries(V.PALETTES)) {
    assert.match(palette.color,/^#[\da-f]{6}$/i);
    for(const rgb of [[123/255,132/255,33/255],[.25,.45,.15],[.5,.65,.3]])
      assert.equal(mask(palette,rgb),0,id);
    const matrix=V.coefficients(palette.color);
    assert.equal(matrix.length,20);
    assert.deepEqual(matrix.slice(15),[0,0,0,1,0]);
  }
  assert.ok(mask(V.PALETTES.sunflower,[.95,.75,.1])>.8);
  assert.ok(mask(V.PALETTES.tulip,[.95,.5,.55])>.8);
  assert.equal(mask(V.PALETTES.sunflower,[.45,.3,.08]),0,"dark sunflower center stays original");
});
