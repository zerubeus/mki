# Hadith Dataset Architecture

This document describes the data structure for the hadith dataset that supports isnad (chain of narration) visualization.

## Overview

The dataset is designed to:

- Store hadiths with their chains of narration
- Normalize narrator data to avoid duplication
- Support multiple chains per hadith (for mutawatir narrations)
- Enable chain analysis and grading
- Support Arabic and English content

---

## File Structure

```
src/data/hadith/
├── narrators.json    # Curated narrators for isnad visualization (keyed by ID)
├── hadiths.json      # Curated hadiths with structured chains
├── constants.ts      # UI labels, colors, configuration
├── index.ts          # Helper functions + exports
└── books/
    └── index.ts      # Fetch helpers + chain resolution

public/data/hadith/   # Static files (NOT bundled, fetched on demand)
├── narrators.json    # 30,231 unique narrator names (normalized)
├── chains.json       # 54,537 unique chains (arrays of narrator IDs)
├── bukhari.json      # 7,277 hadiths with chainId references
├── muslim.json       # 7,459 hadiths
├── abudawud.json     # 5,276 hadiths
├── tirmidhi.json     # 4,053 hadiths
├── nasai.json        # 5,768 hadiths
├── ibnmajah.json     # 4,345 hadiths
├── malik.json        # 1,985 hadiths
├── ahmed.json        # 1,374 hadiths
└── darimi.json       # 3,406 hadiths
```

### Two Data Layers

1. **Curated data** (`src/data/hadith/hadiths.json`, `src/data/hadith/narrators.json`)
   - Hand-crafted structured isnad chains
   - Used for detailed chain visualization with narrator metadata
   - Rich narrator information (birth/death, biography, grade)

2. **Imported books** (`public/data/hadith/*.json`)
   - 40,943 hadiths from 9 major books
   - Source: [hadith-json](https://github.com/AhmedBaset/hadith-json)
   - Arabic + English text
   - **Normalized sanad data** extracted from [sanadset.csv](https://github.com/Abdullahaml1/prepare-quran-dataset)

---

## Normalized Sanad Architecture

The imported hadith data uses a fully normalized structure to avoid duplicating narrator names across 40,000+ hadiths.

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  bukhari.json   │     │   chains.json   │     │ narrators.json  │
│                 │     │                 │     │                 │
│ {               │     │ {               │     │ [               │
│   "chainId":    │────▶│   "c28488":     │────▶│   "ابن شهاب",   │
│   "c28488"      │     │   [19978, 853,  │     │   "سفيان",      │
│ }               │     │    2493, ...]   │     │   ...           │
│                 │     │ }               │     │ ]               │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     hadith              chain (array of         narrator names
   references           narrator IDs)           (indexed by ID)
```

### File Details

**narrators.json** (1.8 MB) - Array of 30,231 unique narrator names
```json
[
  "ابْنِ شِهَابٍ",
  "بَشِيرُ بْنُ أَبِي مَسْعُودٍ الْأَنْصَارِيُّ",
  "عُرْوَةُ بْنُ الزُّبَيْرِ",
  ...
]
```

**chains.json** (2.4 MB) - Object mapping chain ID to array of narrator indices
```json
{
  "c0": [0, 1, 2, 3],
  "c1": [4, 5],
  "c28488": [19978, 853, 2493, 742, 19815, 15],
  ...
}
```

**Hadith files** - Store only `chainId` reference
```json
{
  "id": "bukhari-1",
  "hadithNumber": 1,
  "textAr": "...",
  "textEn": "...",
  "chainId": "c28488"
}
```

### Coverage

| Book | With Sanad | Total | Coverage |
|------|-----------|-------|----------|
| Ibn Majah | 4,333 | 4,345 | 99.7% |
| Ahmad | 1,352 | 1,374 | 98.4% |
| Nasa'i | 5,643 | 5,768 | 97.8% |
| Bukhari | 6,969 | 7,277 | 95.8% |
| Tirmidhi | 3,772 | 4,053 | 93.1% |
| Abu Dawud | 4,568 | 5,276 | 86.6% |
| Darimi | 2,712 | 3,406 | 79.6% |
| Malik | 1,571 | 1,985 | 79.1% |
| Muslim | 5,347 | 7,459 | 71.7% |
| **Total** | **36,267** | **40,943** | **88.6%** |

---

## Data Types

### Narrator Status

```typescript
type NarratorStatus =
  | "prophet"      // النبي ﷺ
  | "companion"    // صحابي
  | "trustworthy"  // ثقة
  | "truthful"     // صدوق
  | "unknown"      // مجهول
  | "weak"         // ضعيف
  | "collector";   // المخرج (البخاري، مسلم، إلخ)
```

### Generation

```typescript
type NarratorGeneration =
  | "prophet"       // النبي ﷺ
  | "sahaba"        // الصحابة (0-100 هـ)
  | "tabieen"       // التابعون (50-150 هـ)
  | "atba_tabieen"  // أتباع التابعين (100-200 هـ)
  | "later";        // المتأخرون (200+ هـ)
```

### Hadith Grade

```typescript
type HadithGrade =
  | "sahih"  // صحيح
  | "hasan"  // حسن
  | "daif"   // ضعيف
  | "mawdu"; // موضوع
```

### ImportedHadith

```typescript
interface ImportedHadith {
  id: string;
  textAr: string;
  textEn: string;
  topic?: string;
  topicAr?: string;
  source: string;
  sourceAr: string;
  bookId: number;
  chapterId: number;
  hadithNumber: number;
  narrator?: string;
  chainId?: string;  // Reference to chain in chains.json
}
```

---

## JSON Schemas

### Curated narrators.json (src/data/hadith/)

```json
{
  "narrator_id": {
    "id": "narrator_id",
    "nameAr": "الاسم بالعربية",
    "nameEn": "Name in English",
    "status": "trustworthy",
    "generation": "tabieen",
    "birthYear": 46,
    "deathYear": 96,
    "biographyAr": "السيرة بالعربية",
    "biographyEn": "Biography in English",
    "grade": "ثقة"
  }
}
```

### Curated hadiths.json

```json
[
  {
    "id": "hadith-id",
    "textAr": "متن الحديث بالعربية",
    "textEn": "Hadith text in English",
    "topic": "Topic",
    "topicAr": "الموضوع",
    "analysisAr": "تحليل الحديث",
    "analysisEn": "Hadith analysis",
    "chains": [
      {
        "id": "chain-id",
        "grade": "sahih",
        "source": "Sahih al-Bukhari",
        "sourceAr": "صحيح البخاري",
        "narrators": ["bukhari", "teacher", "...", "companion", "prophet"],
        "referenceNumber": "1"
      }
    ]
  }
]
```

---

## Usage

### Importing Curated Data

```typescript
import {
  narrators,
  hadiths,
  getNarrator,
  getHadith,
  searchHadiths,
  statusLabels,
  generationLabels,
} from "@/data/hadith";
```

### Using Imported Books with Chain Resolution

```typescript
import {
  loadBook,
  getHadithByNumber,
  searchInBook,
  bookInfo,
  resolveChain,
  loadNarrators,
  loadChains,
} from "@/data/hadith/books";

// Lazy load a book
const bukhariHadiths = await loadBook('bukhari');

// Get specific hadith by number
const hadith = await getHadithByNumber('bukhari', 1);
// => { id: 'bukhari-1', chainId: 'c28488', ... }

// Resolve chain ID to narrator names
if (hadith.chainId) {
  const sanad = await resolveChain(hadith.chainId);
  // => ["الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ", "سُفْيَانُ", ...]
}

// Search within a book
const results = await searchInBook('muslim', 'الصلاة');

// Get book metadata
console.log(bookInfo.bukhari); // { nameEn: 'Sahih al-Bukhari', nameAr: '...', count: 7277 }
```

### Helper Functions

```typescript
// Get a narrator by ID (curated data)
const bukhari = getNarrator("bukhari");

// Get a hadith by ID (curated data)
const hadith = getHadith("actions-by-intentions");

// Search hadiths (curated)
const results = searchHadiths("نية");

// Get narrators by generation
const companions = getNarratorsByGeneration("sahaba");

// Find common link (مدار) in hadith chains
const madar = findCommonLink(hadith);
```

---

## Adding New Data

### Adding a New Narrator (Curated)

1. Open `src/data/hadith/narrators.json`
2. Add a new entry with a unique ID:

```json
"new_narrator_id": {
  "id": "new_narrator_id",
  "nameAr": "اسم الراوي",
  "nameEn": "Narrator Name",
  "status": "trustworthy",
  "generation": "tabieen",
  "deathYear": 120,
  "biographyAr": "نبذة عن الراوي",
  "biographyEn": "Brief biography",
  "grade": "ثقة"
}
```

### Adding a New Hadith (Curated)

1. Open `src/data/hadith/hadiths.json`
2. Ensure all narrators in the chain exist in `narrators.json`
3. Add the hadith:

```json
{
  "id": "new-hadith-id",
  "textAr": "متن الحديث",
  "textEn": "Hadith text",
  "topic": "Topic",
  "topicAr": "الموضوع",
  "chains": [
    {
      "id": "chain-1",
      "grade": "sahih",
      "source": "Sahih al-Bukhari",
      "sourceAr": "صحيح البخاري",
      "narrators": ["bukhari", "...", "companion", "prophet"],
      "referenceNumber": "123"
    }
  ]
}
```

---

## Re-extracting Sanad Data

The normalized sanad data was extracted from `sanadset.csv`. To re-run:

```bash
cd data-work
uv run extract_sanad_normalized.py
```

This will:
1. Read `datasets/sanadset.csv` (650,986 hadiths)
2. Filter to the 9 target books
3. Build unique narrator list → `public/data/hadith/narrators.json`
4. Build unique chains → `public/data/hadith/chains.json`
5. Update hadith files with `chainId` references

---

## Visualization Components

### HadithDetailView

Displays hadith text and isnad chain visualization:
- For curated hadiths: Full interactive diagram with narrator metadata
- For imported hadiths with `chainId`: Mermaid flowchart from resolved chain
- For imported hadiths without `chainId`: "Sanad not available" message

```tsx
import HadithDetailView from "@/components/HadithDetailView";

<HadithDetailView locale="ar" t={translations} />;
```

### HadithIsnadFlow

Displays curated hadiths with full chain analysis:

```tsx
import HadithIsnadFlow from "@/components/HadithIsnadFlow";

<HadithIsnadFlow locale="ar" t={translations} />;
```

---

## Current Dataset

### Curated Data (for detailed visualization)

**Narrators**: 33 entries
- Prophet Muhammad ﷺ
- 9 Companions (Sahaba)
- 8 Successors (Tabi'een)
- 9 Followers of Successors
- 7 Later scholars and collectors

**Hadiths with chains**: 3 entries
1. **الجنة تحت أقدام الأمهات** - Weak hadith (demonstrates weak chain)
2. **انشق القمر** - Mutawatir hadith (3 chains)
3. **إنما الأعمال بالنيات** - Authentic (2 chains, common link)

### Imported Books (full text + normalized sanad)

**Total**: 40,943 hadiths from 9 books
**With sanad**: 36,267 (88.6%)

| Book | Hadiths | Size |
|------|---------|------|
| Sahih al-Bukhari | 7,277 | 14 MB |
| Sahih Muslim | 7,459 | 13 MB |
| Sunan an-Nasa'i | 5,768 | 9 MB |
| Sunan Abu Dawud | 5,276 | 9 MB |
| Jami' at-Tirmidhi | 4,053 | 9 MB |
| Sunan Ibn Majah | 4,345 | 7 MB |
| Sunan ad-Darimi | 3,406 | 4 MB |
| Muwatta Malik | 1,985 | 4 MB |
| Musnad Ahmad | 1,374 | 3 MB |

**Normalized data**:
- `narrators.json`: 1.8 MB (30,231 unique names)
- `chains.json`: 2.4 MB (54,537 unique chains)

---

## Future Enhancements

1. ~~**Structured isnad extraction**: Parse narrator chains from Arabic text~~ ✅ Done via sanadset.csv
2. **Extended narrator data**: Add biographical data to imported narrators
3. **Cross-referencing**: Link imported hadiths to curated chains
4. **Search improvements**: Full-text search with Arabic support
5. **Grading data**: Import hadith authenticity grades
6. **Narrator relationships**: Build teacher/student network graph
