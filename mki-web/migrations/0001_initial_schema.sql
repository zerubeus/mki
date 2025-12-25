-- MKI Database Schema
-- Migrating from CSV (R2) to D1 for better performance

-- Narrators table (from all_rawis.csv)
CREATE TABLE IF NOT EXISTS narrators (
  scholar_indx INTEGER PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  grade TEXT,
  status TEXT,
  generation TEXT,
  birth_year_hijri INTEGER,
  birth_year_gregorian INTEGER,
  death_year_hijri INTEGER,
  death_year_gregorian INTEGER,
  birth_place TEXT,
  death_place TEXT,
  death_reason TEXT,
  teachers TEXT,
  students TEXT,
  parents TEXT,
  spouse TEXT,
  siblings TEXT,
  children TEXT,
  places_of_stay TEXT,
  area_of_interest TEXT,
  tags TEXT,
  books TEXT
);

-- Hadiths table (from all_hadiths_clean.csv)
CREATE TABLE IF NOT EXISTS hadiths (
  id INTEGER PRIMARY KEY,
  hadith_id INTEGER UNIQUE NOT NULL,
  source TEXT NOT NULL,
  chapter_no INTEGER,
  hadith_no INTEGER,
  chapter TEXT,
  text_ar TEXT,
  text_en TEXT
);

-- Hadith chains - links hadiths to narrators with preserved order
CREATE TABLE IF NOT EXISTS hadith_chains (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hadith_id INTEGER NOT NULL,
  chain_position INTEGER NOT NULL,
  narrator_id INTEGER NOT NULL,
  FOREIGN KEY(hadith_id) REFERENCES hadiths(hadith_id),
  FOREIGN KEY(narrator_id) REFERENCES narrators(scholar_indx),
  UNIQUE(hadith_id, chain_position)
);

-- Teacher-student relationships between narrators
CREATE TABLE IF NOT EXISTS narrator_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  narrator_id INTEGER NOT NULL,
  related_id INTEGER NOT NULL,
  relationship_type TEXT NOT NULL CHECK(relationship_type IN ('teacher', 'student')),
  FOREIGN KEY(narrator_id) REFERENCES narrators(scholar_indx),
  FOREIGN KEY(related_id) REFERENCES narrators(scholar_indx),
  UNIQUE(narrator_id, related_id, relationship_type)
);

-- Seerah events table (multilingual - from seera_events*.csv)
CREATE TABLE IF NOT EXISTS seerah_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL,
  locale TEXT NOT NULL CHECK(locale IN ('ar', 'en', 'fr')),
  year_hijri INTEGER,
  year_gregorian INTEGER,
  title TEXT NOT NULL,
  description TEXT,
  location_name TEXT,
  latitude REAL,
  longitude REAL,
  era TEXT CHECK(era IN ('Pre-Prophethood', 'Meccan', 'Medinan')),
  event_type TEXT,
  UNIQUE(event_id, locale)
);

-- Indexes for common queries

-- Narrator queries
CREATE INDEX IF NOT EXISTS idx_narrators_status ON narrators(status);
CREATE INDEX IF NOT EXISTS idx_narrators_generation ON narrators(generation);
CREATE INDEX IF NOT EXISTS idx_narrators_name_en ON narrators(name_en);
CREATE INDEX IF NOT EXISTS idx_narrators_name_ar ON narrators(name_ar);

-- Hadith queries
CREATE INDEX IF NOT EXISTS idx_hadiths_source ON hadiths(source);
CREATE INDEX IF NOT EXISTS idx_hadiths_source_chapter ON hadiths(source, chapter_no);
CREATE INDEX IF NOT EXISTS idx_hadiths_hadith_no ON hadiths(source, hadith_no);

-- Chain queries
CREATE INDEX IF NOT EXISTS idx_hadith_chains_hadith ON hadith_chains(hadith_id);
CREATE INDEX IF NOT EXISTS idx_hadith_chains_narrator ON hadith_chains(narrator_id);

-- Relationship queries
CREATE INDEX IF NOT EXISTS idx_relationships_narrator ON narrator_relationships(narrator_id);
CREATE INDEX IF NOT EXISTS idx_relationships_related ON narrator_relationships(related_id);
CREATE INDEX IF NOT EXISTS idx_relationships_type ON narrator_relationships(relationship_type);

-- Seerah queries
CREATE INDEX IF NOT EXISTS idx_seerah_locale ON seerah_events(locale);
CREATE INDEX IF NOT EXISTS idx_seerah_era ON seerah_events(era);
CREATE INDEX IF NOT EXISTS idx_seerah_year ON seerah_events(year_gregorian);
CREATE INDEX IF NOT EXISTS idx_seerah_event_id ON seerah_events(event_id);
