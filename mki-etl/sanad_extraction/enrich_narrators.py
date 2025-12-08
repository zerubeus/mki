#!/usr/bin/env python3
"""
Enrich narrators.json with data from all_rawis.csv.

This script matches narrator names from narrators.json (Arabic names with diacritics)
with entries in all_rawis.csv (detailed narrator information) and creates an enriched
dataset with biographical information.

Creates:
- narrators_enriched.json: Array of narrator objects with enriched data
- narrator_matches_report.json: Report of matched vs unmatched narrators
"""

import json
import re
import unicodedata
from pathlib import Path

import pandas as pd

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # mki-etl -> mki
NARRATORS_JSON = PROJECT_ROOT / "json-datasets" / "narrators.json"
RAWIS_CSV = PROJECT_ROOT / "csv-datasets" / "all_rawis.csv"
MANUAL_DATA_JSON = PROJECT_ROOT / "json-datasets" / "unmatched_narrators_manual.json"
KINSHIP_ENRICHED_JSON = PROJECT_ROOT / "json-datasets" / "kinship_narrators_enriched.json"
OUTPUT_DIR = PROJECT_ROOT / "json-datasets"

# Arabic diacritics (tashkeel) to remove for normalization
ARABIC_DIACRITICS = re.compile(
    r'[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]'
)

# Common Arabic prefixes to handle
ARABIC_PREFIXES = ['وَ', 'وَّ', 'وِ', 'و', 'فَ', 'ف', 'بِ', 'ب', 'لِ', 'ل']

# Non-name terms (kinship references and generic terms) to filter out
NON_NAME_TERMS = {
    # Father references
    'ابيه', 'ابيها', 'اباه', 'ابوه',    # his/her father
    'ابيك', 'اباك', 'ابوك',              # your father
    'ابي', 'ابا', 'ابو',                 # my father (standalone)
    # Grandfather
    'جده', 'جدته', 'جدها', 'جدك',        # his/her/your grandfather
    # Uncle/Aunt
    'عمه', 'عمته', 'خاله', 'خالته',      # his/her uncle/aunt
    'عمك', 'خالك',                       # your uncle
    # Mother
    'امه', 'امها', 'امك',                # his/her/your mother
    # Siblings
    'اخيه', 'اخته', 'اخوه',              # his/her brother/sister
    'اخيك', 'اختك',                      # your brother/sister
    # Children
    'ابنه', 'ابنته', 'ابنها',            # his/her son/daughter
    'ابنك', 'ابنتك',                     # your son/daughter
    # Generic terms
    'مخبر', 'مخبره',                     # informer/narrator
    'رجل', 'امراه', 'رجلا',              # a man, a woman
    'ام ولد', 'ام ولده',                # mother of a child
    'شيخ', 'شيخه', 'شيخا',               # a sheikh
    'بعض اصحابه',                        # some of his companions
    'رجل من اصحابه',                     # a man from his companions
    'فلان', 'فلانه',                     # so-and-so (placeholder)
}


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for matching:
    - Remove diacritics (tashkeel)
    - Normalize kunyah prefixes (أبي، أبا → أبو)
    - Remove leading و (and)
    - Normalize alef variants
    - Remove extra whitespace
    """
    if not text:
        return ""

    # Remove diacritics
    text = ARABIC_DIACRITICS.sub('', text)

    # Remove common prefixes like وعن (and from), فعن, etc.
    text = re.sub(r'^وعن\s+', '', text)
    text = re.sub(r'^فعن\s+', '', text)
    text = re.sub(r'^عن\s+', '', text)

    # Remove leading و (and) - handles cases like "وعبد الله"
    text = re.sub(r'^و(?=[ا-ي])', '', text)

    # Normalize alef variants
    text = re.sub(r'[إأآا]', 'ا', text)

    # Normalize taa marbuta
    text = re.sub(r'ة', 'ه', text)

    # Normalize yaa
    text = re.sub(r'ى', 'ي', text)

    # Normalize kunyah prefixes: ابي، ابا → ابو (all mean "father of")
    text = re.sub(r'^ابي\s', 'ابو ', text)
    text = re.sub(r'^ابا\s', 'ابو ', text)

    # Also handle genitive case inside names: "بن ابي" → "بن ابو"
    text = re.sub(r'\sابي\s', ' ابو ', text)
    text = re.sub(r'\sابا\s', ' ابو ', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text.strip()


def is_valid_narrator_name(name: str) -> bool:
    """
    Check if a name is a valid narrator name (not a kinship reference or generic term).
    """
    normalized = normalize_arabic(name)
    return normalized not in NON_NAME_TERMS and len(normalized) > 2


def extract_arabic_from_name(name_field: str) -> tuple[str, str]:
    """
    Extract Arabic name from the CSV name field.

    Handles multiple formats:
    - "English Name ( Arabic Name ( honorific"
    - "English Name Arabic Name" (no separator)

    Returns: (arabic_name, english_name)
    """
    if not name_field or pd.isna(name_field):
        return "", ""

    # Try format with ' ( ' separator first
    parts = name_field.split(' ( ')

    if len(parts) >= 2:
        english_name = parts[0].strip()
        arabic_name = parts[1].strip()
        # Clean up honorifics like رضي الله عنه
        arabic_name = re.sub(r'رضي الله عن[هاهم]*', '', arabic_name).strip()
        arabic_name = re.sub(r'صلى الله عليه وسلم', '', arabic_name).strip()
        arabic_name = re.sub(r'صلّ[یي] الل[هھ] علي[هھ] وآل[هھ] وسلّم', '', arabic_name).strip()
        # Remove trailing parentheses and whitespace
        arabic_name = re.sub(r'\s*\(\s*$', '', arabic_name).strip()
        return arabic_name, english_name

    # Fallback: extract Arabic characters directly from the string
    # Arabic Unicode range: \u0600-\u06FF (includes letters, diacritics, etc.)
    arabic_match = re.search(r'[\u0600-\u06FF][\u0600-\u06FF\s]+', name_field)
    if arabic_match:
        arabic_name = arabic_match.group().strip()
        # English is everything before the Arabic
        english_name = name_field[:arabic_match.start()].strip()
        # Clean up honorifics
        arabic_name = re.sub(r'رضي الله عن[هاهم]*', '', arabic_name).strip()
        arabic_name = re.sub(r'صلى الله عليه وسلم', '', arabic_name).strip()
        return arabic_name, english_name

    # No Arabic found
    return "", name_field.strip()


def calculate_similarity(s1: str, s2: str) -> float:
    """
    Calculate similarity between two Arabic strings.
    Uses a combination of exact match, contains, and character-level similarity.
    """
    if not s1 or not s2:
        return 0.0

    # Normalize both strings
    n1 = normalize_arabic(s1)
    n2 = normalize_arabic(s2)

    if not n1 or not n2:
        return 0.0

    # Exact match
    if n1 == n2:
        return 1.0

    # One contains the other
    if n1 in n2 or n2 in n1:
        shorter = min(len(n1), len(n2))
        longer = max(len(n1), len(n2))
        return shorter / longer * 0.9

    # Character-level Jaccard similarity
    set1 = set(n1.replace(' ', ''))
    set2 = set(n2.replace(' ', ''))

    if not set1 or not set2:
        return 0.0

    intersection = len(set1 & set2)
    union = len(set1 | set2)
    jaccard = intersection / union

    # Word-level overlap
    words1 = set(n1.split())
    words2 = set(n2.split())
    word_intersection = len(words1 & words2)
    word_union = len(words1 | words2)
    word_jaccard = word_intersection / word_union if word_union > 0 else 0

    # Combine both metrics
    return (jaccard * 0.4 + word_jaccard * 0.6)


def load_narrators() -> list[str]:
    """Load narrators from narrators.json."""
    print(f"Loading narrators from {NARRATORS_JSON}...")
    with open(NARRATORS_JSON, 'r', encoding='utf-8') as f:
        narrators = json.load(f)
    print(f"  Loaded {len(narrators):,} narrators")
    return narrators


def load_rawis() -> pd.DataFrame:
    """Load rawis from all_rawis.csv."""
    print(f"Loading rawis from {RAWIS_CSV}...")
    df = pd.read_csv(RAWIS_CSV, dtype=str)
    print(f"  Loaded {len(df):,} rawis")
    return df


def load_kinship_data() -> dict[int, dict]:
    """
    Load kinship resolution data from kinship_narrators_enriched.json.

    Returns dict mapping narrator_id → kinship data
    """
    if not KINSHIP_ENRICHED_JSON.exists():
        print(f"  Kinship data file not found: {KINSHIP_ENRICHED_JSON}")
        return {}

    print(f"Loading kinship data from {KINSHIP_ENRICHED_JSON}...")
    with open(KINSHIP_ENRICHED_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    kinship_index = {}
    for entry in data:
        narrator_id = entry.get('id')
        if narrator_id is not None:
            kinship_index[narrator_id] = entry

    print(f"  Loaded {len(kinship_index):,} kinship entries")
    return kinship_index


def load_manual_data() -> dict[str, dict]:
    """
    Load manually researched narrator data from unmatched_narrators_manual.json.

    Returns dict mapping normalized original name -> narrator data
    """
    if not MANUAL_DATA_JSON.exists():
        print(f"  Manual data file not found: {MANUAL_DATA_JSON}")
        return {}

    print(f"Loading manual data from {MANUAL_DATA_JSON}...")
    with open(MANUAL_DATA_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)

    manual_index = {}
    narrators = data.get('narrators', [])

    for narrator in narrators:
        original_name = narrator.get('nameOriginal', '')
        if not original_name:
            continue

        # Skip entries that are just references to other entries
        notes = narrator.get('notes', '')
        if 'Same as entry' in notes:
            continue

        normalized = normalize_arabic(original_name)

        # Convert manual data format to match CSV format
        manual_entry = {
            'nameAr': narrator.get('nameAr', original_name),
            'nameEn': narrator.get('nameEn', ''),
            'kunyah': narrator.get('kunyah', ''),
            'status': narrator.get('status', ''),
            'generation': narrator.get('generation', ''),
            'grade': narrator.get('grade', ''),
            'birthYear': narrator.get('birthYear', ''),
            'deathYear': narrator.get('deathYear', ''),
            'birthPlace': narrator.get('birthPlace', ''),
            'deathPlace': narrator.get('deathPlace', ''),
            'teachers': ', '.join(narrator.get('teachers', [])) if isinstance(narrator.get('teachers'), list) else narrator.get('teachers', ''),
            'students': ', '.join(narrator.get('students', [])) if isinstance(narrator.get('students'), list) else narrator.get('students', ''),
            'notes': narrator.get('notes', ''),
            'source': 'manual'
        }

        manual_index[normalized] = manual_entry

        # Also index by normalized Arabic name (without diacritics)
        name_ar = narrator.get('nameAr', '')
        if name_ar:
            normalized_ar = normalize_arabic(name_ar)
            if normalized_ar and normalized_ar not in manual_index:
                manual_index[normalized_ar] = manual_entry

    print(f"  Loaded {len(manual_index):,} manual entries")
    return manual_index


def build_rawi_index(df: pd.DataFrame) -> dict[str, dict]:
    """
    Build an index of rawis by normalized Arabic name.

    Creates multiple lookup keys for each rawi to maximize matching:
    - Full normalized name
    - Kunyah only (ابو هريره)
    - First name only (for famous narrators)
    - Name variants without tribal/location suffixes

    Returns dict mapping normalized_name -> rawi_data
    """
    index = {}

    for _, row in df.iterrows():
        arabic_name, english_name = extract_arabic_from_name(row.get('name', ''))

        if not arabic_name:
            continue

        normalized = normalize_arabic(arabic_name)

        if not normalized:
            continue

        rawi_data = {
            'scholar_indx': row.get('scholar_indx'),
            'nameAr': arabic_name,
            'nameEn': english_name,
            'grade': row.get('grade'),
            'parents': row.get('parents'),
            'spouse': row.get('spouse'),
            'siblings': row.get('siblings'),
            'children': row.get('children'),
            'birthPlace': row.get('birth_place'),
            'birthDateHijri': row.get('birth_date_hijri'),
            'birthDateGregorian': row.get('birth_date_gregorian'),
            'deathPlace': row.get('death_place'),
            'deathDateHijri': row.get('death_date_hijri'),
            'deathDateGregorian': row.get('death_date_gregorian'),
            'deathReason': row.get('death_reason'),
            'placesOfStay': row.get('places_of_stay'),
            'teachers': row.get('teachers'),
            'students': row.get('students'),
            'areaOfInterest': row.get('area_of_interest'),
            'tags': row.get('tags'),
            'books': row.get('books'),
        }

        # Store by normalized name (may overwrite duplicates, that's okay)
        index[normalized] = rawi_data

        # Also store by parts of the name for partial matching
        parts = normalized.split()

        # Index by first word only (for famous single-name narrators like عمر، عائشه، مالك)
        if parts and len(parts[0]) >= 3:
            first_name = parts[0]
            if first_name not in index:
                index[first_name] = rawi_data

        # Index by first two words: "عبد الله بن عمر" -> "عبد الله"
        if len(parts) >= 2:
            key = ' '.join(parts[:2])
            if key not in index:
                index[key] = rawi_data

        # Index by first three words
        if len(parts) >= 3:
            key = ' '.join(parts[:3])
            if key not in index:
                index[key] = rawi_data

        # Index by kunyah (ابو/ام patterns): "ابو هريره" from full name
        if parts and parts[0] in ['ابو', 'ام']:
            kunyah = ' '.join(parts[:2]) if len(parts) >= 2 else parts[0]
            if kunyah not in index:
                index[kunyah] = rawi_data

        # Index by name after "بن" (patronymic): "بن عمر" -> rawi
        for i, part in enumerate(parts):
            if part == 'بن' and i + 1 < len(parts):
                # Get the part after "بن"
                after_ibn = ' '.join(parts[i:i+2])  # "بن عمر"
                if after_ibn not in index:
                    index[after_ibn] = rawi_data
                # Also index just the father's name
                father_name = parts[i+1]
                if len(father_name) >= 3 and father_name not in index:
                    index[father_name] = rawi_data
                break

        # Index by name without "بن/ابن" prefix if it exists
        # e.g., "ابن شهاب" -> also "شهاب"
        if len(parts) >= 2 and parts[0] in ['ابن', 'بن']:
            short_name = ' '.join(parts[1:])
            if short_name and short_name not in index:
                index[short_name] = rawi_data

        # Index by removing tribal/location suffixes (نسبة)
        # e.g., "محمد بن ابراهيم التيمي" -> "محمد بن ابراهيم"
        if len(parts) >= 3:
            # Check if last part looks like a nisbah (tribal/location identifier)
            last_part = parts[-1]
            if last_part.endswith('ي') and len(last_part) > 3:
                key_without_nisbah = ' '.join(parts[:-1])
                if key_without_nisbah not in index:
                    index[key_without_nisbah] = rawi_data

    print(f"  Built index with {len(index):,} entries")
    return index


def find_best_match(
    narrator_name: str,
    rawi_index: dict[str, dict],
    normalized_keys: list[str],
    threshold: float = 0.6,
    use_fuzzy: bool = False
) -> tuple[dict | None, float]:
    """
    Find the best matching rawi for a narrator name.

    Returns: (rawi_data, similarity_score) or (None, 0)
    """
    normalized = normalize_arabic(narrator_name)

    if not normalized:
        return None, 0.0

    # Try exact match first
    if normalized in rawi_index:
        return rawi_index[normalized], 1.0

    # Try partial match - check if narrator name is contained in any indexed name
    for indexed_name in normalized_keys:
        if normalized in indexed_name or indexed_name in normalized:
            shorter = min(len(normalized), len(indexed_name))
            longer = max(len(normalized), len(indexed_name))
            score = shorter / longer * 0.95
            if score >= threshold:
                return rawi_index[indexed_name], score

    # Skip fuzzy matching for performance unless explicitly enabled
    if not use_fuzzy:
        return None, 0.0

    # Try fuzzy matching (slower, only for high-value matches)
    best_match = None
    best_score = 0.0

    for indexed_name in normalized_keys:
        score = calculate_similarity(normalized, indexed_name)
        if score > best_score:
            best_score = score
            best_match = rawi_index[indexed_name]

    if best_score >= threshold:
        return best_match, best_score

    return None, 0.0


def enrich_narrators(
    narrators: list[str],
    rawi_index: dict[str, dict],
    manual_index: dict[str, dict],
    kinship_index: dict[int, dict],
    threshold: float = 0.6
) -> tuple[list[dict], dict]:
    """
    Enrich narrator list with rawi data.

    Uses CSV data first, then falls back to manual data for unmatched narrators.
    Kinship terms (أبيه، جده، etc.) are enriched with resolved context data.

    Returns:
        - list of enriched narrator objects
        - statistics dict
    """
    enriched = []
    matched_count = 0
    matched_manual_count = 0
    matched_kinship_count = 0
    filtered_count = 0
    unmatched = []

    # Pre-compute normalized keys for faster matching
    normalized_keys = list(rawi_index.keys())

    print(f"\nMatching {len(narrators):,} narrators against {len(normalized_keys):,} rawis + {len(manual_index):,} manual + {len(kinship_index):,} kinship entries...")

    for i, narrator_name in enumerate(narrators):
        if (i + 1) % 5000 == 0:
            print(f"  Processed {i + 1:,} / {len(narrators):,}")

        # Check if this is a kinship reference with resolution data
        if i in kinship_index:
            kinship_data = kinship_index[i]
            entry = {
                'id': i,
                'nameOriginal': narrator_name,
                'isKinshipReference': True,
                'kinshipType': kinship_data.get('kinshipType', ''),
                'resolvedName': kinship_data.get('resolvedName'),
                'resolutionCount': kinship_data.get('resolutionCount', 0),
                'sampleContexts': kinship_data.get('sampleContexts', [])[:3],
                'source': 'kinship'
            }
            enriched.append(entry)
            matched_kinship_count += 1
            continue

        # Skip other non-name entries (generic references without kinship data)
        if not is_valid_narrator_name(narrator_name):
            entry = {
                'id': i,
                'nameOriginal': narrator_name,
                'nameAr': narrator_name,
                'isNonName': True,  # Mark as filtered
            }
            enriched.append(entry)
            filtered_count += 1
            continue

        match, score = find_best_match(
            narrator_name, rawi_index, normalized_keys, threshold, use_fuzzy=False
        )

        if match:
            # Create enriched entry from CSV data
            entry = {
                'id': i,
                'nameOriginal': narrator_name,
                **{k: v for k, v in match.items() if v and not pd.isna(v)},
                'matchScore': round(score, 3),
                'source': 'csv'
            }
            enriched.append(entry)
            matched_count += 1
        else:
            # Try manual data as fallback
            normalized = normalize_arabic(narrator_name)
            if normalized in manual_index:
                manual_match = manual_index[normalized]
                entry = {
                    'id': i,
                    'nameOriginal': narrator_name,
                    **{k: v for k, v in manual_match.items() if v},
                    'matchScore': 1.0,
                    'source': 'manual'
                }
                enriched.append(entry)
                matched_manual_count += 1
            else:
                # Keep basic entry
                entry = {
                    'id': i,
                    'nameOriginal': narrator_name,
                    'nameAr': narrator_name,
                }
                enriched.append(entry)
                unmatched.append(narrator_name)

    total_matched = matched_count + matched_manual_count + matched_kinship_count
    stats = {
        'total': len(narrators),
        'matchedCsv': matched_count,
        'matchedManual': matched_manual_count,
        'matchedKinship': matched_kinship_count,
        'matched': total_matched,
        'filtered': filtered_count,
        'unmatched': len(unmatched),
        'matchRate': round(total_matched / len(narrators) * 100, 2),
        'matchRateExcludingFiltered': round(
            total_matched / (len(narrators) - filtered_count) * 100, 2
        ) if (len(narrators) - filtered_count) > 0 else 0,
        'unmatchedSamples': unmatched[:50]  # First 50 unmatched for review
    }

    return enriched, stats


def save_results(enriched: list[dict], stats: dict) -> None:
    """Save enriched data and report."""

    # Save enriched narrators
    output_path = OUTPUT_DIR / "narrators_enriched.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(enriched, f, ensure_ascii=False, indent=2)

    size_mb = output_path.stat().st_size / (1024 * 1024)
    print(f"\nSaved {output_path.name}: {size_mb:.2f} MB")

    # Save report
    report_path = OUTPUT_DIR / "narrator_matches_report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(stats, f, ensure_ascii=False, indent=2)

    print(f"Saved {report_path.name}")


def main():
    print("=" * 60)
    print("Narrator Enrichment Script")
    print("=" * 60)

    # Load data
    narrators = load_narrators()
    rawis_df = load_rawis()

    # Load manual data
    print("\nLoading manual data...")
    manual_index = load_manual_data()

    # Load kinship data
    print("\nLoading kinship data...")
    kinship_index = load_kinship_data()

    # Build index
    print("\nBuilding rawi index...")
    rawi_index = build_rawi_index(rawis_df)

    # Enrich narrators
    enriched, stats = enrich_narrators(narrators, rawi_index, manual_index, kinship_index, threshold=0.6)

    # Save results
    save_results(enriched, stats)

    # Print summary
    print("\n" + "=" * 60)
    print("Summary:")
    print(f"  Total narrators: {stats['total']:,}")
    print(f"  Filtered (non-names): {stats['filtered']:,}")
    print(f"  Matched from CSV: {stats['matchedCsv']:,}")
    print(f"  Matched from manual: {stats['matchedManual']:,}")
    print(f"  Matched kinship refs: {stats['matchedKinship']:,}")
    print(f"  Total matched: {stats['matched']:,} ({stats['matchRate']}%)")
    print(f"  Match rate (excluding filtered): {stats['matchRateExcludingFiltered']}%")
    print(f"  Unmatched: {stats['unmatched']:,}")
    print("=" * 60)


if __name__ == "__main__":
    main()
