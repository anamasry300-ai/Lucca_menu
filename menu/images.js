// صور الأصناف - Lucca Café
// الصور محلياً في مجلد images/ لكل تصنيف
// عشان تضيف صورة: حط الصورة في المجلد المناسب وسمّها بالاسم ده
// مثال: images/coffee/espresso.jpg

function slug(name) {
  if (!name) return 'item';
  var s = name
    .replace(/[🇪🇹🇧🇷🇮🇳🇨🇴]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '')
    .toLowerCase();
  return s || 'item';
}

function getItemImage(catId, itemName) {
  return 'images/' + catId + '/' + slug(itemName) + '.jpg';
}

function itemImg(catId, itemName) {
  const path = `images/${catId}/${slug(itemName)}.jpg`;
  return path;
}

function getItemImage(catId, itemName) {
  return itemImg(catId, itemName);
}
