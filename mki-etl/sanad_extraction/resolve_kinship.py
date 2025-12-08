#!/usr/bin/env python3
"""
Resolve kinship references (أبيه، جده، etc.) in hadith chains.

When a chain contains "أبيه" (his father), we need to look at who comes BEFORE
in the chain to determine whose father is being referenced.

Example:
  Chain: هشام بن عروة ← أبيه ← عائشة
  Resolution: أبيه = عروة بن الزبير (Hisham's father)

This script creates:
  - kinship_resolutions.json: Maps (chain_id, position) → resolved_narrator_name
  - Updates narrators_enriched.json with resolved kinship data
"""

import json
import re
from pathlib import Path
from collections import defaultdict

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent
JSON_DIR = PROJECT_ROOT / "json-datasets"
CSV_DIR = PROJECT_ROOT / "csv-datasets"

# Arabic diacritics removal
DIACRITICS = re.compile(
    r'[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]'
)

# Kinship terms to resolve
KINSHIP_TERMS = {
    'أبيه': 'father',      # his father
    'أَبِيهِ': 'father',
    'جده': 'grandfather',   # his grandfather
    'جَدِّهِ': 'grandfather',
    'عمه': 'uncle',         # his paternal uncle
    'عَمِّهِ': 'uncle',
    'أخيه': 'brother',      # his brother
    'أَخِيهِ': 'brother',
}


def normalize(text: str) -> str:
    """
    Normalize Arabic text:
    - Remove diacritics
    - Normalize alif variants (أإآا → ا)
    - Normalize taa marbuta (ة → ه)
    - Normalize yaa (ى → ي)
    """
    text = DIACRITICS.sub('', text)
    text = re.sub(r'[إأآا]', 'ا', text)
    text = re.sub(r'ة', 'ه', text)
    text = re.sub(r'ى', 'ي', text)
    return text


def extract_father_name_from_patronymic(name: str) -> str | None:
    """
    Extract father's name from 'X بن Y' or 'X ابن Y' pattern.

    Examples:
        هشام بن عروة → عروة
        جعفر بن محمد → محمد
        ابن عباس → عباس
        سعيد بن أبي سعيد → أبي سعيد
        عبد الرحمن بن عوف → عبد الرحمن بن عوف → عوف
    """
    normalized = normalize(name)

    # Pattern: name بن/ابن father_name
    # Father name can be compound: أبي X, عبد X, ابي X, ام X
    match = re.search(r'(?:بن|ابن)\s+(\S+(?:\s+\S+)?(?:\s+\S+)?)', normalized)
    if match:
        father_part = match.group(1).strip()

        # If starts with compound name indicators, keep more words
        first_word = father_part.split()[0] if father_part else ''

        # Compound name prefixes that need the next word
        compound_prefixes = ('ابي', 'ابو', 'ابا', 'ام', 'عبد', 'عبيد', 'ال')

        if first_word in compound_prefixes or first_word.startswith('ال'):
            # Already got 2-3 words, return as-is
            return father_part
        else:
            # Single name father - return just first word
            return first_word

    return None


def build_known_fathers_map(rawis_csv_path: Path) -> dict[str, str]:
    """
    Build a map of known father relationships from the rawis database.

    Returns dict: normalized_name → father_full_name
    """
    import pandas as pd

    fathers = {}

    df = pd.read_csv(rawis_csv_path, dtype=str)

    for _, row in df.iterrows():
        name = row.get('name', '')
        parents = row.get('parents', '')

        if not name or not parents:
            continue

        # Extract Arabic from name field
        arabic_match = re.search(r'[\u0600-\u06FF][\u0600-\u06FF\s]+', str(name))
        if arabic_match:
            arabic_name = normalize(arabic_match.group().strip())

            # Parents field might contain father info
            # Try to extract father from parents field
            if parents and not pd.isna(parents):
                fathers[arabic_name] = str(parents).strip()

    return fathers


def is_kinship_term(name: str) -> str | None:
    """Check if name is a kinship term. Returns the term type or None."""
    normalized = normalize(name)
    for term, kind in KINSHIP_TERMS.items():
        if normalize(term) == normalized:
            return kind
    return None


def build_narrator_to_father_map(enriched_path: Path) -> dict[str, str]:
    """
    Build a map from narrator names to their fathers using enriched data.

    This handles cases where the narrator is mentioned by first name only
    but we know their full name from the enriched database.
    """
    with open(enriched_path, 'r', encoding='utf-8') as f:
        enriched = json.load(f)

    narrator_to_father = {}

    for entry in enriched:
        original = entry.get('nameOriginal', '')
        full_name = entry.get('nameAr', '')

        if not original:
            continue

        # Try to extract father from full name
        father = extract_father_name_from_patronymic(full_name)
        if father:
            # Map both original (with diacritics) and normalized versions
            narrator_to_father[original] = father
            narrator_to_father[normalize(original)] = father

        # Also check if nameEn gives us a clue
        name_en = entry.get('nameEn', '')
        if 'ibn' in name_en.lower() or 'bin' in name_en.lower():
            match = re.search(r'(?:ibn|bin)\s+(\w+)', name_en, re.I)
            if match:
                father_en = match.group(1)
                narrator_to_father[original] = father
                narrator_to_father[normalize(original)] = father

    return narrator_to_father


def resolve_kinship_in_chains(
    narrators: list[str],
    chains: dict[str, list[int]],
    known_fathers: dict[str, str],
    narrator_to_father: dict[str, str] = None
) -> dict:
    """
    Resolve kinship references in all chains.

    Returns:
        {
            'resolutions': {
                narrator_index: {
                    'original': 'أبيه',
                    'type': 'father',
                    'resolved_in_chains': {
                        'c123': 'عروة بن الزبير',
                        'c456': 'محمد الباقر',
                        ...
                    }
                }
            },
            'stats': {...}
        }
    """
    resolutions = defaultdict(lambda: {
        'original': '',
        'type': '',
        'resolved_in_chains': {},
        'contexts': []
    })

    stats = {
        'total_kinship_refs': 0,
        'resolved': 0,
        'unresolved': 0,
        'by_type': defaultdict(int)
    }

    for chain_id, indices in chains.items():
        for pos, idx in enumerate(indices):
            narrator = narrators[idx]
            kinship_type = is_kinship_term(narrator)

            if kinship_type:
                stats['total_kinship_refs'] += 1
                stats['by_type'][kinship_type] += 1

                resolutions[idx]['original'] = narrator
                resolutions[idx]['type'] = kinship_type

                # Look at previous narrator to resolve
                if pos > 0:
                    prev_idx = indices[pos - 1]
                    prev_narrator = narrators[prev_idx]

                    # Try to extract father from patronymic
                    resolved_name = None

                    if kinship_type == 'father':
                        # Strategy 1: Extract from "X بن Y" pattern in the name itself
                        father = extract_father_name_from_patronymic(prev_narrator)
                        if father:
                            resolved_name = father

                        # Strategy 2: Look up in narrator_to_father map (from enriched data)
                        if not resolved_name and narrator_to_father:
                            if prev_narrator in narrator_to_father:
                                resolved_name = narrator_to_father[prev_narrator]
                            elif normalize(prev_narrator) in narrator_to_father:
                                resolved_name = narrator_to_father[normalize(prev_narrator)]

                        # Strategy 3: Try known fathers map (from CSV parents field)
                        if not resolved_name:
                            normalized_prev = normalize(prev_narrator)
                            if normalized_prev in known_fathers:
                                resolved_name = known_fathers[normalized_prev]

                    if resolved_name:
                        resolutions[idx]['resolved_in_chains'][chain_id] = resolved_name
                        stats['resolved'] += 1

                        # Store context for analysis
                        if len(resolutions[idx]['contexts']) < 10:
                            resolutions[idx]['contexts'].append({
                                'chain': chain_id,
                                'prev_narrator': prev_narrator,
                                'resolved_to': resolved_name
                            })
                    else:
                        stats['unresolved'] += 1
                        if len(resolutions[idx]['contexts']) < 10:
                            resolutions[idx]['contexts'].append({
                                'chain': chain_id,
                                'prev_narrator': prev_narrator,
                                'resolved_to': None
                            })

    return {
        'resolutions': dict(resolutions),
        'stats': dict(stats)
    }


def get_most_common_resolution(resolutions: dict[str, str]) -> str | None:
    """Get the most common resolved name for a kinship term."""
    if not resolutions:
        return None

    # Count occurrences
    counts = defaultdict(int)
    for name in resolutions.values():
        normalized = normalize(name)
        counts[normalized] += 1

    # Return most common (but keep original form)
    most_common_normalized = max(counts, key=counts.get)

    # Find original form
    for name in resolutions.values():
        if normalize(name) == most_common_normalized:
            return name

    return most_common_normalized


def main():
    print("=" * 60)
    print("Kinship Reference Resolver")
    print("=" * 60)

    # Load data
    print("\nLoading data...")
    with open(JSON_DIR / "narrators.json", 'r', encoding='utf-8') as f:
        narrators = json.load(f)
    print(f"  Loaded {len(narrators):,} narrators")

    with open(JSON_DIR / "chains.json", 'r', encoding='utf-8') as f:
        chains = json.load(f)
    print(f"  Loaded {len(chains):,} chains")

    # Build known fathers map from CSV
    print("\nBuilding known fathers map from CSV...")
    known_fathers = build_known_fathers_map(CSV_DIR / "all_rawis.csv")
    print(f"  Found {len(known_fathers):,} father relationships")

    # Build narrator to father map from enriched data
    print("\nBuilding narrator to father map from enriched data...")
    enriched_path = JSON_DIR / "narrators_enriched.json"
    if enriched_path.exists():
        narrator_to_father = build_narrator_to_father_map(enriched_path)
        print(f"  Found {len(narrator_to_father):,} narrator-father mappings")
    else:
        narrator_to_father = {}
        print("  (enriched data not found, skipping)")

    # Resolve kinship references
    print("\nResolving kinship references...")
    result = resolve_kinship_in_chains(narrators, chains, known_fathers, narrator_to_father)

    # Print stats
    stats = result['stats']
    print(f"\n{'=' * 60}")
    print("Resolution Statistics:")
    print(f"  Total kinship references: {stats['total_kinship_refs']:,}")
    print(f"  Resolved: {stats['resolved']:,}")
    print(f"  Unresolved: {stats['unresolved']:,}")
    print(f"  By type: {dict(stats['by_type'])}")

    # Save resolutions
    output_path = JSON_DIR / "kinship_resolutions.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(f"\nSaved resolutions to {output_path}")

    # Show examples
    print(f"\n{'=' * 60}")
    print("Example Resolutions:")
    for idx, data in list(result['resolutions'].items())[:5]:
        print(f"\n  Narrator {idx}: {data['original']} ({data['type']})")
        for ctx in data['contexts'][:3]:
            print(f"    Chain {ctx['chain']}: {ctx['prev_narrator']} → {ctx['resolved_to']}")

    # Create enriched kinship data for narrators
    print(f"\n{'=' * 60}")
    print("Creating enriched narrator entries for kinship terms...")

    enriched_kinship = []
    for idx_str, data in result['resolutions'].items():
        idx = int(idx_str)

        # Get most common resolution
        most_common = get_most_common_resolution(data['resolved_in_chains'])

        entry = {
            'id': idx,
            'nameOriginal': data['original'],
            'kinshipType': data['type'],
            'isKinshipReference': True,
            'resolvedName': most_common,
            'resolutionCount': len(data['resolved_in_chains']),
            'sampleContexts': data['contexts'][:5]
        }
        enriched_kinship.append(entry)

        if most_common:
            print(f"  {data['original']} → {most_common} (in {len(data['resolved_in_chains'])} chains)")

    # Save enriched kinship data
    kinship_enriched_path = JSON_DIR / "kinship_narrators_enriched.json"
    with open(kinship_enriched_path, 'w', encoding='utf-8') as f:
        json.dump(enriched_kinship, f, ensure_ascii=False, indent=2)
    print(f"\nSaved enriched kinship data to {kinship_enriched_path}")


if __name__ == "__main__":
    main()
