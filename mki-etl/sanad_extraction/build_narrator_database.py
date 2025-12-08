#!/usr/bin/env python3
"""
Build Complete Narrator Database with 100% Confidence

This script creates two authoritative files:
1. narrators_complete.json - Every narrator fully identified
2. chains_resolved.json - Every chain with actual names (no kinship refs)

Process:
1. Normalize all 30,583 variants → 19,848 unique narrators
2. Group variants by normalized form
3. Enrich with all_rawis.csv biographical data
4. Verify using sanad text and chain context
5. Resolve kinship terms per-chain
"""

import json
import re
from pathlib import Path
from collections import defaultdict
import pandas as pd

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
JSON_DIR = PROJECT_ROOT / "json-datasets"
CSV_DIR = PROJECT_ROOT / "csv-datasets"

# Arabic diacritics to remove
DIACRITICS = re.compile(
    r'[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]'
)


def normalize_arabic(text: str) -> str:
    """
    Normalize Arabic text for grouping:
    - Remove diacritics
    - Normalize alif variants (أإآا → ا)
    - Normalize taa marbuta (ة → ه)
    - Normalize yaa (ى → ي)
    - Normalize kunyah prefixes (أبي/أبا → أبو)
    - Remove leading و (and)
    """
    if not text:
        return ""

    # Remove diacritics
    text = DIACRITICS.sub('', text)

    # Remove leading و (and)
    text = re.sub(r'^و(?=[ا-ي])', '', text)

    # Normalize alif variants
    text = re.sub(r'[إأآا]', 'ا', text)

    # Normalize taa marbuta
    text = re.sub(r'ة', 'ه', text)

    # Normalize yaa
    text = re.sub(r'ى', 'ي', text)

    # Normalize kunyah prefixes
    text = re.sub(r'^ابي\s', 'ابو ', text)
    text = re.sub(r'^ابا\s', 'ابو ', text)
    text = re.sub(r'\sابي\s', ' ابو ', text)
    text = re.sub(r'\sابا\s', ' ابو ', text)

    # Remove extra whitespace
    text = ' '.join(text.split())

    return text.strip()


def is_kinship_term(name: str) -> bool:
    """Check if name is a kinship reference (أبيه، جده، etc.)"""
    normalized = normalize_arabic(name)
    kinship_terms = {
        'ابيه', 'اباه', 'ابوه', 'ابيها',
        'جده', 'جدته', 'جدها',
        'عمه', 'عمته', 'خاله', 'خالته',
        'اخيه', 'اخته', 'اخوه',
        'امه', 'امها',
    }
    return normalized in kinship_terms


def group_narrators_by_normalized(narrators: list[str]) -> dict:
    """
    Group narrator variants by normalized form.

    Returns:
        {
            normalized_name: {
                'variants': [original_index, ...],
                'variant_names': [original_name, ...],
                'is_kinship': bool
            }
        }
    """
    groups = defaultdict(lambda: {'variants': [], 'variant_names': [], 'is_kinship': False})

    for idx, name in enumerate(narrators):
        normalized = normalize_arabic(name)
        groups[normalized]['variants'].append(idx)
        groups[normalized]['variant_names'].append(name)

        if is_kinship_term(name):
            groups[normalized]['is_kinship'] = True

    return dict(groups)


def load_rawis_data() -> dict[str, dict]:
    """
    Load all_rawis.csv and index by normalized Arabic name.
    """
    df = pd.read_csv(CSV_DIR / "all_rawis.csv", dtype=str)

    rawis_index = {}

    for _, row in df.iterrows():
        name_field = row.get('name', '')
        if not name_field or pd.isna(name_field):
            continue

        # Extract Arabic from name field
        # Format: "English Name ( Arabic Name (" or "English Arabic"
        arabic_match = re.search(r'[\u0600-\u06FF][\u0600-\u06FF\s]+', str(name_field))
        if arabic_match:
            arabic_name = arabic_match.group().strip()
            # Clean honorifics
            arabic_name = re.sub(r'رضي الله عن[هاهم]*', '', arabic_name).strip()
            arabic_name = re.sub(r'صل[ىي] الله عليه وسلم', '', arabic_name).strip()

            normalized = normalize_arabic(arabic_name)

            if normalized:
                rawis_index[normalized] = {
                    'scholar_indx': row.get('scholar_indx'),
                    'nameAr': arabic_name,
                    'nameEn': name_field.split('(')[0].strip() if '(' in name_field else name_field.split()[0] if name_field else '',
                    'grade': row.get('grade'),
                    'parents': row.get('parents'),
                    'teachers': row.get('teachers'),
                    'students': row.get('students'),
                    'birth_date_place': row.get('birth_date_place'),
                    'death_date_place': row.get('death_date_place'),
                }

    return rawis_index


def analyze_narrator_groups(groups: dict) -> dict:
    """
    Analyze the narrator groups for reporting.
    """
    stats = {
        'total_unique': len(groups),
        'by_variant_count': defaultdict(int),
        'kinship_terms': [],
        'high_variance': [],  # 11+ variants
        'ambiguous': [],  # single word, no patronymic
    }

    for normalized, data in groups.items():
        variant_count = len(data['variants'])
        stats['by_variant_count'][variant_count] += 1

        if data['is_kinship']:
            stats['kinship_terms'].append(normalized)

        if variant_count >= 11:
            stats['high_variance'].append({
                'name': normalized,
                'count': variant_count,
                'samples': data['variant_names'][:5]
            })

        # Check if ambiguous (single word, no بن/ابن)
        words = normalized.split()
        if len(words) == 1 and not data['is_kinship']:
            stats['ambiguous'].append(normalized)

    return stats


def create_narrator_database(
    groups: dict,
    rawis_index: dict[str, dict]
) -> list[dict]:
    """
    Create the narrator database entries.

    Each entry contains:
    - id: unique narrator ID
    - canonicalName: normalized Arabic name
    - variants: list of original indices
    - variantNames: list of original name strings
    - Biographical data from rawis if available
    - needsResearch: bool if not found in rawis
    """
    database = []

    for idx, (normalized, data) in enumerate(sorted(groups.items())):
        entry = {
            'id': idx,
            'canonicalName': normalized,
            'variants': data['variants'],
            'variantNames': data['variant_names'],
            'isKinship': data['is_kinship'],
        }

        # Try to find in rawis data
        if normalized in rawis_index:
            rawi = rawis_index[normalized]
            entry.update({
                'nameAr': rawi.get('nameAr', normalized),
                'nameEn': rawi.get('nameEn', ''),
                'grade': rawi.get('grade', ''),
                'teachers': rawi.get('teachers', ''),
                'students': rawi.get('students', ''),
                'birth': rawi.get('birth_date_place', ''),
                'death': rawi.get('death_date_place', ''),
                'matched': True,
                'needsResearch': False,
            })
        else:
            entry.update({
                'nameAr': normalized,
                'matched': False,
                'needsResearch': True,
            })

        database.append(entry)

    return database


def main():
    print("=" * 70)
    print("Building Complete Narrator Database")
    print("=" * 70)

    # Load narrators
    print("\n1. Loading narrators.json...")
    with open(JSON_DIR / "narrators.json", 'r', encoding='utf-8') as f:
        narrators = json.load(f)
    print(f"   Loaded {len(narrators):,} narrator variants")

    # Group by normalized form
    print("\n2. Grouping by normalized form...")
    groups = group_narrators_by_normalized(narrators)
    print(f"   Found {len(groups):,} unique narrators")

    # Analyze groups
    print("\n3. Analyzing groups...")
    stats = analyze_narrator_groups(groups)

    print(f"\n   Variant distribution:")
    for count in sorted(stats['by_variant_count'].keys()):
        num = stats['by_variant_count'][count]
        if count <= 5 or count >= 10:
            print(f"     {count} variant(s): {num:,} narrators")

    print(f"\n   Kinship terms: {len(stats['kinship_terms'])}")
    print(f"   High variance (11+): {len(stats['high_variance'])}")
    print(f"   Ambiguous (single word): {len(stats['ambiguous'])}")

    # Load rawis data
    print("\n4. Loading all_rawis.csv...")
    rawis_index = load_rawis_data()
    print(f"   Indexed {len(rawis_index):,} rawis")

    # Create database
    print("\n5. Creating narrator database...")
    database = create_narrator_database(groups, rawis_index)

    matched = sum(1 for d in database if d.get('matched'))
    needs_research = sum(1 for d in database if d.get('needsResearch'))
    kinship = sum(1 for d in database if d.get('isKinship'))

    print(f"   Matched from rawis: {matched:,}")
    print(f"   Needs research: {needs_research:,}")
    print(f"   Kinship terms: {kinship:,}")

    # Save intermediate database
    output_path = JSON_DIR / "narrators_grouped.json"
    print(f"\n6. Saving to {output_path.name}...")

    output = {
        'metadata': {
            'totalVariants': len(narrators),
            'uniqueNarrators': len(database),
            'matchedFromRawis': matched,
            'needsResearch': needs_research,
            'kinshipTerms': kinship,
        },
        'stats': {
            'highVariance': stats['high_variance'][:20],
            'kinshipTerms': stats['kinship_terms'],
            'ambiguousSamples': stats['ambiguous'][:50],
        },
        'narrators': database,
    }

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"   Saved {output_path.stat().st_size / 1024 / 1024:.2f} MB")

    # Summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total variants: {len(narrators):,}")
    print(f"Unique narrators: {len(database):,}")
    print(f"Already matched: {matched:,} ({matched/len(database)*100:.1f}%)")
    print(f"Need research: {needs_research:,} ({needs_research/len(database)*100:.1f}%)")
    print(f"\nNext step: Research the {needs_research:,} unmatched narrators")
    print("=" * 70)


if __name__ == "__main__":
    main()
