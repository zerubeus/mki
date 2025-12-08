#!/usr/bin/env python3
"""
Extract sanad (chain of narration) data from sanadset.csv and add it to hadith JSON files.
"""

import ast
import json
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


def parse_sanad_string(sanad_str: str) -> list[str] | None:
    """Parse Python list string into actual list of narrator names."""
    if pd.isna(sanad_str) or not sanad_str:
        return None
    try:
        result = ast.literal_eval(sanad_str)
        if isinstance(result, list) and len(result) > 0:
            # Filter out empty strings
            return [n for n in result if n and isinstance(n, str)]
        return None
    except (ValueError, SyntaxError):
        return None


def load_sanad_dataset() -> pd.DataFrame:
    """Load the sanadset.csv dataset."""
    print(f"Loading dataset from {DATASET_PATH}...")

    # Read CSV with specific dtypes to handle large file efficiently
    df = pd.read_csv(
        DATASET_PATH,
        usecols=["Book", "Num_hadith", "Sanad", "Sanad_Length"],
        dtype={
            "Book": str,
            "Num_hadith": str,  # Keep as string to handle various formats
            "Sanad": str,
            "Sanad_Length": "Int64",  # Nullable integer
        },
    )

    print(f"Loaded {len(df):,} rows")
    return df


def build_sanad_lookup(df: pd.DataFrame) -> dict[str, dict[int, dict]]:
    """
    Build lookup dictionary: {book_key: {hadith_num: {sanad: [...], sanadLength: N}}}
    """
    lookup: dict[str, dict[int, dict]] = {key: {} for key in BOOK_MAPPINGS}

    # Create reverse mapping: Arabic name -> our key
    arabic_to_key = {arabic: key for key, arabic in BOOK_MAPPINGS.items()}

    # Filter to only our target books
    target_books = set(BOOK_MAPPINGS.values())
    df_filtered = df[df["Book"].isin(target_books)]

    print(f"Filtered to {len(df_filtered):,} rows from target books")

    # Process each row
    matched = 0
    for _, row in df_filtered.iterrows():
        book_arabic = row["Book"]
        book_key = arabic_to_key.get(book_arabic)

        if not book_key:
            continue

        # Parse hadith number - handle various formats
        try:
            hadith_num = int(float(row["Num_hadith"]))
        except (ValueError, TypeError):
            continue

        # Parse sanad list
        sanad = parse_sanad_string(row["Sanad"])
        if sanad is None:
            continue

        sanad_length = len(sanad)

        # Store in lookup (first match wins if duplicates)
        if hadith_num not in lookup[book_key]:
            lookup[book_key][hadith_num] = {
                "sanad": sanad,
                "sanadLength": sanad_length,
            }
            matched += 1

    print(f"Built lookup with {matched:,} hadiths")

    # Print stats per book
    for key, data in lookup.items():
        print(f"  {key}: {len(data):,} hadiths with sanad")

    return lookup


def enhance_json_files(lookup: dict[str, dict[int, dict]]) -> None:
    """Add sanad data to each hadith JSON file."""

    for book_key in BOOK_MAPPINGS:
        json_path = HADITH_DATA_DIR / f"{book_key}.json"

        if not json_path.exists():
            print(f"WARNING: {json_path} not found, skipping")
            continue

        print(f"\nProcessing {book_key}.json...")

        # Load existing JSON
        with open(json_path, "r", encoding="utf-8") as f:
            hadiths = json.load(f)

        book_lookup = lookup[book_key]
        enhanced = 0
        total = len(hadiths)

        # Enhance each hadith
        for hadith in hadiths:
            hadith_num = hadith.get("hadithNumber")

            if hadith_num is None:
                continue

            sanad_data = book_lookup.get(hadith_num)

            if sanad_data:
                hadith["sanad"] = sanad_data["sanad"]
                hadith["sanadLength"] = sanad_data["sanadLength"]
                enhanced += 1

        # Write back
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(hadiths, f, ensure_ascii=False, indent=2)

        match_rate = (enhanced / total * 100) if total > 0 else 0
        print(f"  Enhanced {enhanced:,}/{total:,} hadiths ({match_rate:.1f}%)")


def main():
    print("=" * 60)
    print("Sanad Data Extraction Script")
    print("=" * 60)

    # Load dataset
    df = load_sanad_dataset()

    # Build lookup
    print("\nBuilding sanad lookup...")
    lookup = build_sanad_lookup(df)

    # Enhance JSON files
    print("\nEnhancing JSON files...")
    enhance_json_files(lookup)

    print("\n" + "=" * 60)
    print("Done!")
    print("=" * 60)


if __name__ == "__main__":
    main()
