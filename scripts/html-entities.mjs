const entities={amp:'&',quot:'"',apos:"'",nbsp:' ',aacute:'á',atilde:'ã',ccedil:'ç',lt:'<',gt:'>'};
export const decodeEntities=(value='')=>value.replace(/&(#x[0-9a-f]+|#\d+|amp|quot|apos|nbsp|aacute|atilde|ccedil|lt|gt);/gi,(entity,key)=>{
 if(key[0]!=='#')return entities[key.toLowerCase()]??entity;
 const number=key[1].toLowerCase()==='x'?parseInt(key.slice(2),16):parseInt(key.slice(1),10);
 return number>0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff)?String.fromCodePoint(number):entity;
});
