#!/usr/bin/env python3
"""
Merge Narrator Research Results

This script merges researched narrator data into the grouped narrator database.
It takes JSON files with biographical data and updates narrators_grouped.json.
"""

import json
import re
from pathlib import Path
from collections import defaultdict

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
JSON_DIR = PROJECT_ROOT / "json-datasets"

# Arabic diacritics removal
DIACRITICS = re.compile(
    r'[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]'
)


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for matching."""
    if not text:
        return ""

    text = DIACRITICS.sub('', text)
    text = re.sub(r'^و(?=[ا-ي])', '', text)
    text = re.sub(r'[إأآا]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'ى', 'ي', text)
    text = re.sub(r'^ابي\s', 'ابو ', text)
    text = re.sub(r'^ابا\s', 'ابو ', text)
    text = re.sub(r'\sابي\s', ' ابو ', text)
    text = re.sub(r'\sابا\s', ' ابو ', text)
    text = ' '.join(text.split())

    return text.strip()


def build_lookup_index(narrators: list[dict]) -> dict[str, int]:
    """
    Build an index from normalized canonical names to narrator array indices.
    Also index variant names for fuzzy matching.
    """
    index = {}

    for i, narrator in enumerate(narrators):
        canonical = narrator.get('canonicalName', '')
        if canonical:
            index[canonical] = i
            # Also add without spaces for compound names
            index[canonical.replace(' ', '')] = i

        # Index all variants too
        for variant in narrator.get('variantNames', []):
            normalized = normalize_arabic(variant)
            if normalized and normalized not in index:
                index[normalized] = i

    return index


def match_research_to_narrator(
    research: dict,
    lookup_index: dict[str, int],
    narrators: list[dict]
) -> int | None:
    """
    Find the narrator index that matches this research entry.
    Tries multiple matching strategies.
    """
    # Strategy 0: Try explicit matchVariants first (most reliable)
    match_variants = research.get('matchVariants', [])
    for variant in match_variants:
        normalized = normalize_arabic(variant)
        if normalized in lookup_index:
            return lookup_index[normalized]

    # Strategy 1: Direct canonical name match
    canonical = research.get('canonicalName', '')
    if canonical:
        normalized = normalize_arabic(canonical)
        if normalized in lookup_index:
            return lookup_index[normalized]
        # Try without spaces
        if normalized.replace(' ', '') in lookup_index:
            return lookup_index[normalized.replace(' ', '')]

    # Strategy 2: Try kunyah + name pattern
    kunyah = research.get('kunyah', '')
    if kunyah:
        normalized_kunyah = normalize_arabic(kunyah)
        if normalized_kunyah in lookup_index:
            return lookup_index[normalized_kunyah]

    # Strategy 3: Try short forms from nasab
    nasab = research.get('nasab', '')
    if nasab:
        # Extract "X ibn Y" pattern
        match = re.search(r'(\S+)\s+(?:بن|ابن)\s+(\S+)', normalize_arabic(nasab))
        if match:
            short_form = f"{match.group(1)} بن {match.group(2)}"
            if short_form in lookup_index:
                return lookup_index[short_form]

    return None


def merge_research_into_narrator(narrator: dict, research: dict) -> dict:
    """
    Merge research data into a narrator entry.
    Research fields override existing fields.
    """
    merged = narrator.copy()

    # Update biographical fields
    field_mappings = {
        'canonicalName': 'canonicalName',
        'nameEn': 'nameEn',
        'kunyah': 'kunyah',
        'nasab': 'nasab',
        'status': 'status',
        'generation': 'generation',
        'birth': 'birth',
        'death': 'death',
        'location': 'location',
        'grade': 'grade',
        'father': 'father',
        'husband': 'husband',
        'teachers': 'teachers',
        'students': 'students',
        'notes': 'notes',
    }

    for research_field, narrator_field in field_mappings.items():
        if research.get(research_field):
            merged[narrator_field] = research[research_field]

    # Mark as researched
    merged['matched'] = True
    merged['needsResearch'] = False
    merged['researchSource'] = 'manual_web_research'

    return merged


def merge_research_files(research_dir: Path) -> list[dict]:
    """
    Load all research JSON files from a directory.
    """
    all_research = []

    for json_file in research_dir.glob("*.json"):
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                if isinstance(data, list):
                    all_research.extend(data)
                elif isinstance(data, dict) and 'narrators' in data:
                    all_research.extend(data['narrators'])
        except Exception as e:
            print(f"Warning: Could not load {json_file}: {e}")

    return all_research


def main():
    print("=" * 60)
    print("Merging Narrator Research Results")
    print("=" * 60)

    # Load current grouped narrators
    grouped_path = JSON_DIR / "narrators_grouped.json"
    print(f"\nLoading {grouped_path.name}...")

    with open(grouped_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    narrators = data['narrators']
    print(f"  Loaded {len(narrators):,} narrators")

    # Build lookup index
    print("\nBuilding lookup index...")
    lookup_index = build_lookup_index(narrators)
    print(f"  Indexed {len(lookup_index):,} name variants")

    # Load research files
    research_dir = JSON_DIR / "narrator_research"
    if not research_dir.exists():
        research_dir.mkdir(parents=True)
        print(f"\nCreated {research_dir} - place research JSON files here")
        return

    print(f"\nLoading research from {research_dir}...")
    research_entries = merge_research_files(research_dir)
    print(f"  Found {len(research_entries):,} research entries")

    # Merge research
    print("\nMerging research into narrator database...")
    matched = 0
    unmatched = []

    for research in research_entries:
        idx = match_research_to_narrator(research, lookup_index, narrators)

        if idx is not None:
            narrators[idx] = merge_research_into_narrator(narrators[idx], research)
            matched += 1
        else:
            unmatched.append(research.get('canonicalName', 'Unknown'))

    print(f"  Matched: {matched:,}")
    print(f"  Unmatched: {len(unmatched):,}")

    if unmatched[:10]:
        print(f"  Sample unmatched: {unmatched[:10]}")

    # Update metadata
    data['metadata']['matchedFromRawis'] = sum(
        1 for n in narrators if n.get('matched')
    )
    data['metadata']['needsResearch'] = sum(
        1 for n in narrators if n.get('needsResearch')
    )
    data['metadata']['researchedManually'] = matched

    # Save updated database
    output_path = JSON_DIR / "narrators_grouped.json"
    print(f"\nSaving to {output_path.name}...")

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  Saved {output_path.stat().st_size / 1024 / 1024:.2f} MB")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total narrators: {len(narrators):,}")
    print(f"Matched (total): {data['metadata']['matchedFromRawis']:,}")
    print(f"Still need research: {data['metadata']['needsResearch']:,}")


if __name__ == "__main__":
    main()
