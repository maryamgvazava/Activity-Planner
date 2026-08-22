// Populates the local database with a handful of sample rows so the UI has
// something to show right after install. Safe to run multiple times against
// a fresh (or freshly deleted) data/db.json.
'use strict';

const db = require('../server/db');
const { normalizeLand, normalizeBuyer } = require('../server/lib/validate');

const lands = [
  {
    location: 'Tbilisi, Lisi Lake',
    areaM2: 600,
    cadastralCode: '01.10.05.123',
    category: 'Residential',
    ownerName: 'Nino Kapanadze',
    phoneNumber: '+995555112233',
    price: 90000,
    currency: 'USD',
    sourceUrl: 'https://home.ss.ge/en/real-estate/example-1',
    source: 'ss.ge',
  },
  {
    location: 'Kobuleti, Adjara',
    areaM2: 1200,
    cadastralCode: '19.02.31.045',
    category: 'Agricultural',
    ownerName: 'Levan Chkheidze',
    phoneNumber: '+995599887766',
    price: 45000,
    currency: 'USD',
    sourceUrl: 'https://home.ge/land/example-2',
    source: 'home.ge',
  },
  {
    location: 'Gori, Shida Kartli',
    areaM2: 3000,
    cadastralCode: null,
    category: 'Agricultural',
    ownerName: null,
    phoneNumber: '+995551234567',
    price: 30000,
    currency: 'GEL',
    sourceUrl: 'https://www.facebook.com/example/posts/example-3',
    source: 'facebook',
  },
];

const buyers = [
  {
    location: 'Tbilisi',
    areaM2: 500,
    priceMin: 60000,
    priceMax: 100000,
    currency: 'USD',
    advertiserName: 'Giorgi Beridze',
    phoneNumber: '+995555000111',
    sourceUrl: 'https://www.facebook.com/example/posts/buyer-1',
    source: 'facebook',
  },
  {
    location: 'Adjara, Kobuleti',
    areaM2: 1000,
    priceMin: 35000,
    priceMax: 50000,
    currency: 'USD',
    advertiserName: 'Tamar Lomidze',
    phoneNumber: '+995599222333',
    sourceUrl: 'https://www.facebook.com/example/posts/buyer-2',
    source: 'facebook',
  },
  {
    location: 'Shida Kartli, Gori',
    areaM2: 3200,
    priceMin: 25000,
    priceMax: 32000,
    currency: 'GEL',
    advertiserName: 'Data Kiknadze',
    phoneNumber: '+995551987654',
    sourceUrl: 'https://www.facebook.com/example/posts/buyer-3',
    source: 'facebook',
  },
];

for (const land of lands) db.insert('lands', normalizeLand(land));
for (const buyer of buyers) db.insert('buyers', normalizeBuyer(buyer));

console.log(`Seeded ${lands.length} land listings and ${buyers.length} buyer listings.`);
