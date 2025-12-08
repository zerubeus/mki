#!/usr/bin/env python3
"""
Extract sanad data from sanadset.csv with full normalization.

Creates:
- narrators.json: unique narrator names with IDs
- chains.json: unique chains as arrays of narrator IDs
- Updates hadith JSONs with chainId references
"""

import ast
import json
import re
from pathlib import Path

import pandas as pd

# Book name mapping: our key -> Arabic name in sanadset.csv
BOOK_MAPPINGS = {
    "bukhari": "صحيح البخاري",
    "muslim": "صحيح مسلم",
    "abudawud": "سنن أبي داود",
    "tirmidhi": "جامع الترمذي",
    "nasai": "سنن النسائى الصغرى",
    "ibnmajah": "سنن ابن ماجه",
    "malik": "موطأ مالك رواية يحيى الليثي",
    "ahmed": "مسند أحمد بن حنبل",
    "darimi": "سنن الدارمي",
}

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # mki-etl -> mki
DATASET_PATH = PROJECT_ROOT / "datasets" / "sanadset.csv"
HADITH_DATA_DIR = PROJECT_ROOT / "public" / "data" / "hadith"


# Patterns to detect relative terms
FATHER_PATTERNS = re.compile(r'^أَبِيهِ|^أبيه|^أَبِيهَا|^أبيها|^أَبَاهُ|^أباه')
GRANDFATHER_PATTERNS = re.compile(r'^جَدِّهِ|^جده|^جَدَّتِهِ|^جدته')
UNCLE_PATTERNS = re.compile(r'^عَمِّهِ|^عمه')

# Pattern to extract father's name from "X بن Y" or "X بْنِ Y"
IBN_PATTERN = re.compile(r'بْنِ\s+(.+)|بن\s+(.+)|بِنْتِ\s+(.+)|بنت\s+(.+)')


def resolve_relative_term(term: str, previous_narrator: str | None) -> str:
    """
    Resolve relative terms like 'أبيه' (his father) using the previous narrator's name.

    Strategies:
    1. If term is "أبيه X", extract "X" as the name
    2. If previous narrator is "هشام بن عروة", then "أبيه" = "عروة"
    """
    # Check if it's a father reference
    if FATHER_PATTERNS.match(term):
        # First, check if the name is directly in the term: "أبيه بريدة" -> "بريدة"
        name_after = FATHER_PATTERNS.sub('', term).strip()
        # Remove leading punctuation
        name_after = re.sub(r'^[،,\s]+', '', name_after).strip()

        if name_after and len(name_after) > 2:
            # Has a name after "أبيه", use it
            return name_after

        # Otherwise, try to extract from previous narrator's "X بن Y" pattern
        if previous_narrator:
            match = IBN_PATTERN.search(previous_narrator)
            if match:
                father_name = next((g for g in match.groups() if g), None)
                if father_name:
                    return father_name.strip()

        # Could not resolve
        return term

    # Check if it's a grandfather reference
    if GRANDFATHER_PATTERNS.match(term):
        # Check if name is in the term
        name_after = GRANDFATHER_PATTERNS.sub('', term).strip()
        name_after = re.sub(r'^[،,\s]+', '', name_after).strip()

        if name_after and len(name_after) > 2:
            return name_after

        # Try to get grandfather from previous narrator
        if previous_narrator:
            match = IBN_PATTERN.search(previous_narrator)
            if match:
                father_name = next((g for g in match.groups() if g), None)
                if father_name:
                    grandfather_match = IBN_PATTERN.search(father_name)
                    if grandfather_match:
                        grandfather_name = next(
                            (g for g in grandfather_match.groups() if g), None
                        )
                        if grandfather_name:
                            return grandfather_name.strip()

        return term

    # Check uncle reference
    if UNCLE_PATTERNS.match(term):
        name_after = UNCLE_PATTERNS.sub('', term).strip()
        name_after = re.sub(r'^[،,\s]+', '', name_after).strip()
        if name_after and len(name_after) > 2:
            return name_after
        return term

    # Not a relative term, return as-is
    return term


def parse_sanad_string(sanad_str: str) -> list[str] | None:
    """Parse Python list string into actual list of narrator names."""
    if pd.isna(sanad_str) or not sanad_str:
        return None
    try:
        result = ast.literal_eval(sanad_str)
        if isinstance(result, list) and len(result) > 0:
            # Filter out empty strings and clean names
            cleaned = [n.strip() for n in result if n and isinstance(n, str)]

            # Resolve relative terms
            resolved = []
            for i, name in enumerate(cleaned):
                previous = resolved[-1] if resolved else None
                resolved_name = resolve_relative_term(name, previous)
                resolved.append(resolved_name)

            return resolved if resolved else None
        return None
    except (ValueError, SyntaxError):
        return None


def load_sanad_dataset() -> pd.DataFrame:
    """Load the sanadset.csv dataset."""
    print(f"Loading dataset from {DATASET_PATH}...")

    df = pd.read_csv(
        DATASET_PATH,
        usecols=["Book", "Num_hadith", "Sanad", "Sanad_Length"],
        dtype={
            "Book": str,
            "Num_hadith": str,
            "Sanad": str,
            "Sanad_Length": "Int64",
        },
    )

    print(f"Loaded {len(df):,} rows")
    return df


def build_normalized_data(df: pd.DataFrame) -> tuple[
    dict[str, int],  # narrator_to_id
    dict[str, list[int]],  # chain_id_to_narrator_ids
    dict[str, dict[int, str]],  # book -> hadith_num -> chain_id
]:
    """
    Build normalized data structures.

    Returns:
        - narrator_to_id: mapping of narrator name to unique ID
        - chain_id_to_narrator_ids: mapping of chain ID to list of narrator IDs
        - hadith_chain_lookup: book -> hadith_num -> chain_id
    """
    narrator_to_id: dict[str, int] = {}
    chain_to_id: dict[tuple[int, ...], str] = {}  # tuple of narrator IDs -> chain ID
    chain_id_to_narrator_ids: dict[str, list[int]] = {}
    hadith_chain_lookup: dict[str, dict[int, str]] = {
        key: {} for key in BOOK_MAPPINGS
    }

    # Create reverse mapping: Arabic name -> our key
    arabic_to_key = {arabic: key for key, arabic in BOOK_MAPPINGS.items()}

    # Filter to only our target books
    target_books = set(BOOK_MAPPINGS.values())
    df_filtered = df[df["Book"].isin(target_books)]

    print(f"Filtered to {len(df_filtered):,} rows from target books")

    next_narrator_id = 0
    next_chain_id = 0

    # Process each row
    for _, row in df_filtered.iterrows():
        book_arabic = row["Book"]
        book_key = arabic_to_key.get(book_arabic)

        if not book_key:
            continue

        # Parse hadith number
        try:
            hadith_num = int(float(row["Num_hadith"]))
        except (ValueError, TypeError):
            continue

        # Parse sanad list
        sanad = parse_sanad_string(row["Sanad"])
        if sanad is None or len(sanad) == 0:
            continue

        # Skip if we already have this hadith
        if hadith_num in hadith_chain_lookup[book_key]:
            continue

        # Build narrator IDs for this chain
        narrator_ids = []
        for narrator_name in sanad:
            if narrator_name not in narrator_to_id:
                narrator_to_id[narrator_name] = next_narrator_id
                next_narrator_id += 1
            narrator_ids.append(narrator_to_id[narrator_name])

        # Check if this exact chain already exists
        chain_tuple = tuple(narrator_ids)
        if chain_tuple not in chain_to_id:
            chain_id = f"c{next_chain_id}"
            chain_to_id[chain_tuple] = chain_id
            chain_id_to_narrator_ids[chain_id] = narrator_ids
            next_chain_id += 1

        chain_id = chain_to_id[chain_tuple]
        hadith_chain_lookup[book_key][hadith_num] = chain_id

    print(f"\nNormalization stats:")
    print(f"  Unique narrators: {len(narrator_to_id):,}")
    print(f"  Unique chains: {len(chain_id_to_narrator_ids):,}")

    total_hadiths = sum(len(v) for v in hadith_chain_lookup.values())
    print(f"  Total hadiths with chains: {total_hadiths:,}")

    return narrator_to_id, chain_id_to_narrator_ids, hadith_chain_lookup


def save_normalized_files(
    narrator_to_id: dict[str, int],
    chain_id_to_narrator_ids: dict[str, list[int]],
) -> None:
    """Save narrators.json and chains.json."""

    # Create id_to_narrator (reverse mapping for the JSON)
    id_to_narrator = {v: k for k, v in narrator_to_id.items()}

    # narrators.json - array indexed by ID
    narrators_list = [id_to_narrator[i] for i in range(len(id_to_narrator))]

    narrators_path = HADITH_DATA_DIR / "narrators.json"
    with open(narrators_path, "w", encoding="utf-8") as f:
        json.dump(narrators_list, f, ensure_ascii=False, indent=2)

    size_kb = narrators_path.stat().st_size / 1024
    print(f"\nSaved {narrators_path.name}: {size_kb:.1f} KB")

    # chains.json - object with chain IDs as keys
    chains_path = HADITH_DATA_DIR / "chains.json"
    with open(chains_path, "w", encoding="utf-8") as f:
        json.dump(chain_id_to_narrator_ids, f, ensure_ascii=False)

    size_kb = chains_path.stat().st_size / 1024
    print(f"Saved {chains_path.name}: {size_kb:.1f} KB")


def update_hadith_files(
    hadith_chain_lookup: dict[str, dict[int, str]],
) -> None:
    """Update hadith JSON files with chainId references."""

    print("\nUpdating hadith JSON files...")

    for book_key in BOOK_MAPPINGS:
        json_path = HADITH_DATA_DIR / f"{book_key}.json"

        if not json_path.exists():
            print(f"  WARNING: {json_path} not found, skipping")
            continue

        # Load existing JSON
        with open(json_path, "r", encoding="utf-8") as f:
            hadiths = json.load(f)

        book_lookup = hadith_chain_lookup[book_key]
        enhanced = 0
        total = len(hadiths)

        # Update each hadith - remove old sanad, add chainId
        for hadith in hadiths:
            hadith_num = hadith.get("hadithNumber")

            # Remove old sanad fields if present
            hadith.pop("sanad", None)
            hadith.pop("sanadLength", None)

            if hadith_num is None:
                continue

            chain_id = book_lookup.get(hadith_num)
            if chain_id:
                hadith["chainId"] = chain_id
                enhanced += 1

        # Write back
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(hadiths, f, ensure_ascii=False, indent=2)

        size_kb = json_path.stat().st_size / 1024
        match_rate = (enhanced / total * 100) if total > 0 else 0
        print(f"  {book_key}.json: {enhanced}/{total} ({match_rate:.1f}%) - {size_kb:.1f} KB")


def main():
    print("=" * 60)
    print("Normalized Sanad Data Extraction Script")
    print("=" * 60)

    # Load dataset
    df = load_sanad_dataset()

    # Build normalized data
    print("\nBuilding normalized data structures...")
    narrator_to_id, chain_id_to_narrator_ids, hadith_chain_lookup = (
        build_normalized_data(df)
    )

    # Save narrators.json and chains.json
    save_normalized_files(narrator_to_id, chain_id_to_narrator_ids)

    # Update hadith JSON files
    update_hadith_files(hadith_chain_lookup)

    # Calculate total savings
    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
