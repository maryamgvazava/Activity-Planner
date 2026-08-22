// Keyword list used to confirm a listing is actually located in Georgia
// (the country) before it's accepted into the database. Matches on either
// the Georgian script name or the common English transliteration, since
// scraped/posted text is a mix of both.
'use strict';

const GEORGIA_PLACES = [
  // Country itself
  'საქართველო', 'georgia',
  // Major cities
  'თბილისი', 'tbilisi',
  'ბათუმი', 'batumi',
  'ქუთაისი', 'kutaisi',
  'რუსთავი', 'rustavi',
  'გორი', 'gori',
  'ზუგდიდი', 'zugdidi',
  'ფოთი', 'poti',
  'თელავი', 'telavi',
  'მცხეთა', 'mtskheta',
  'ქობულეთი', 'kobuleti',
  'ოზურგეთი', 'ozurgeti',
  'ახალციხე', 'akhaltsikhe',
  'ამბროლაური', 'ambrolauri',
  'მესტია', 'mestia',
  'სიღნაღი', 'sighnaghi',
  'ბოლნისი', 'bolnisi',
  'მარნეული', 'marneuli',
  'გარდაბანი', 'gardabani',
  'კასპი', 'kaspi',
  'ხაშური', 'khashuri',
  'ბორჯომი', 'borjomi',
  'წყალტუბო', 'tskaltubo',
  'ხობი', 'khobi',
  'სენაკი', 'senaki',
  'ახალქალაქი', 'akhalkalaki',
  'დმანისი', 'dmanisi',
  'წალკა', 'tsalka',
  'ლაგოდეხი', 'lagodekhi',
  'გურჯაანი', 'gurjaani',
  'საგარეჯო', 'sagarejo',
  'ყვარელი', 'kvareli',
  'დედოფლისწყარო', 'dedoplistsqaro',
  'ონი', 'oni',
  'ლენტეხი', 'lentekhi',
  'ცაგერი', 'tsageri',
  'ჩხოროწყუ', 'chkhorotsku',
  'აბაშა', 'abasha',
  'მარტვილი', 'martvili',
  'ჩოხატაური', 'chokhatauri',
  'ლანჩხუთი', 'lanchkhuti',
  'ვანი', 'vani',
  'ბაღდათი', 'baghdati',
  'ხონი', 'khoni',
  'თერჯოლა', 'terjola',
  'საჩხერე', 'sachkhere',
  'ჭიათურა', 'chiatura',
  'წყალწითელი', 'gali',
  'გუდაუთა', 'gudauta',
  'სოხუმი', 'sokhumi',
  'ცხინვალი', 'tskhinvali',
  // Regions
  'აჭარა', 'adjara', 'ajara',
  'იმერეთი', 'imereti',
  'კახეთი', 'kakheti',
  'სამეგრელო', 'samegrelo',
  'გურია', 'guria',
  'რაჭა', 'racha',
  'სვანეთი', 'svaneti',
  'შიდა ქართლი', 'shida kartli',
  'ქვემო ქართლი', 'kvemo kartli',
  'სამცხე-ჯავახეთი', 'samtskhe-javakheti', 'samtskhe javakheti',
  'მცხეთა-მთიანეთი', 'mtskheta-mtianeti', 'mtskheta mtianeti',
  'აფხაზეთი', 'abkhazia',
  'თუშეთი', 'tusheti',
  'ხევსურეთი', 'khevsureti',
  'ქართლი', 'kartli',
];

const NORMALIZED_PLACES = GEORGIA_PLACES.map((p) => p.toLowerCase());

function normalize(text) {
  return String(text || '').toLowerCase();
}

/** Does this free-text location/description look like it refers to Georgia? */
function isInGeorgia(text) {
  const t = normalize(text);
  if (!t) return false;
  return NORMALIZED_PLACES.some((place) => t.includes(place));
}

/** Best-effort extraction of the matched place name, for display/grouping. */
function extractPlace(text) {
  const t = normalize(text);
  const hit = NORMALIZED_PLACES.find((place) => t.includes(place));
  return hit || null;
}

module.exports = { GEORGIA_PLACES, isInGeorgia, extractPlace, normalize };
