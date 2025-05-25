import type { HistoricalEvent, GeoCoordinates } from '../types';

export const HISTORICAL_EVENTS: HistoricalEvent[] = [
  {
    id: 1,
    year: "570 CE",
    title: "Birth of Prophet Muhammad ﷺ",
    description: "Born in Mecca, in the tribe of Quraysh. His father, Abdullah, died before his birth, and his mother, Aminah, died when he was young.",
    locationName: "Mecca",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Pre-Prophethood",
  },
  {
    id: 2,
    year: "c. 595 CE",
    title: "Marriage to Khadijah bint Khuwaylid",
    description: "Muhammad ﷺ married Khadijah, a wealthy and respected businesswoman in Mecca. She was his first wife and a great source of support.",
    locationName: "Mecca",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Pre-Prophethood",
  },
  {
    id: 3,
    year: "610 CE",
    title: "First Revelation",
    description: "While meditating in the Cave of Hira on Jabal al-Nour (Mountain of Light), Angel Jibril (Gabriel) appeared to Muhammad ﷺ and revealed the first verses of the Quran.",
    locationName: "Cave of Hira, Mecca",
    coordinates: { lat: 21.4573, lng: 39.8593 },
    era: "Meccan",
  },
  {
    id: 4,
    year: "613 CE",
    title: "Beginning of Public Preaching",
    description: "After a period of private preaching, Muhammad ﷺ began to publicly proclaim the message of Islam in Mecca, starting with his close relatives.",
    locationName: "Mecca",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Meccan",
  },
  {
    id: 5,
    year: "619 CE",
    title: "Year of Sorrow ('Aam al-Huzn)",
    description: "A difficult year marked by the deaths of his beloved wife Khadijah and his uncle Abu Talib, who provided him protection from Quraysh.",
    locationName: "Mecca",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Meccan",
  },
  {
    id: 6,
    year: "c. 621 CE",
    title: "Isra and Mi'raj (Night Journey & Ascension)",
    description: "A miraculous physical and spiritual journey from Mecca to Al-Aqsa Mosque in Jerusalem, and then an ascension through the heavens.",
    locationName: "Mecca to Jerusalem",
    coordinates: { lat: 31.7761, lng: 35.2357 }, // Jerusalem (Al-Aqsa)
    era: "Meccan",
  },
  {
    id: 7,
    year: "622 CE",
    title: "The Hijra (Migration to Medina)",
    description: "Due to increasing persecution, Muhammad ﷺ and his followers migrated from Mecca to Yathrib, which was renamed Medina. This marks the beginning of the Islamic Hijri calendar.",
    locationName: "Medina", // Destination is key for map
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Meccan", // Journey itself; Medinan era starts upon arrival
  },
  {
    id: 8,
    year: "622 CE",
    title: "Establishment of the Constitution of Medina",
    description: "A formal agreement establishing a multi-religious Islamic state in Medina, ensuring rights and responsibilities for Muslims, Jews, and other communities.",
    locationName: "Medina",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  },
  {
    id: 9,
    year: "624 CE (2 AH)",
    title: "Battle of Badr",
    description: "The first major battle between Muslims of Medina and Quraysh of Mecca. A decisive Muslim victory despite being outnumbered, strengthening the early Muslim community.",
    locationName: "Badr",
    coordinates: { lat: 23.7667, lng: 38.7917 },
    era: "Medinan",
  },
  {
    id: 10,
    year: "625 CE (3 AH)",
    title: "Battle of Uhud",
    description: "Fought near Mount Uhud against Meccans seeking revenge for Badr. Muslims faced setbacks due to tactical errors after initial success.",
    locationName: "Mount Uhud, Medina",
    coordinates: { lat: 24.5036, lng: 39.6136 },
    era: "Medinan",
  },
  {
    id: 11,
    year: "627 CE (5 AH)",
    title: "Battle of the Trench (Khandaq)",
    description: "A siege of Medina by a confederation of Meccans and other tribes. Muslims successfully defended the city by digging a trench, a tactic suggested by Salman al-Farsi.",
    locationName: "Medina",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  },
  {
    id: 12,
    year: "628 CE (6 AH)",
    title: "Treaty of Hudaybiyyah",
    description: "A pivotal 10-year peace treaty between Medina and Quraysh of Mecca, enabling Muslims to perform Umrah the following year and facilitating the spread of Islam.",
    locationName: "Hudaybiyyah (near Mecca)",
    coordinates: { lat: 21.3175, lng: 39.6586 },
    era: "Medinan",
  },
  {
    id: 13,
    year: "630 CE (8 AH)",
    title: "Conquest of Mecca",
    description: "Muhammad ﷺ and a large Muslim army entered Mecca almost unopposed. He granted amnesty to its people and cleansed the Kaaba of idols.",
    locationName: "Mecca",
    coordinates: { lat: 21.4225, lng: 39.8262 },
    era: "Medinan",
  },
  {
    id: 14,
    year: "632 CE (10 AH)",
    title: "Farewell Pilgrimage (Hajjat al-Wada)",
    description: "The only Hajj pilgrimage Muhammad ﷺ performed. He delivered his famous Farewell Sermon at Mount Arafat, summarizing key Islamic teachings.",
    locationName: "Mecca & Arafat",
    coordinates: { lat: 21.3549, lng: 39.9841 }, // Mount Arafat
    era: "Medinan",
  },
  {
    id: 15,
    year: "632 CE (11 AH)",
    title: "Death of Prophet Muhammad ﷺ",
    description: "The Prophet ﷺ passed away in Medina in the house of his wife Aisha. He was buried in what is now the Green Dome in the Prophet's Mosque (Al-Masjid an-Nabawi).",
    locationName: "Medina",
    coordinates: { lat: 24.4686, lng: 39.6142 },
    era: "Medinan",
  }
];

export const MAP_INITIAL_CENTER: [number, number] = [24.7, 39.5];
export const MAP_INITIAL_ZOOM: number = 6;
export const MAP_EVENT_ZOOM: number = 9; 