"""
Add full chain (sanad) text to hadith files.

This script reads chainId from each hadith, looks up the full sanad using
chains.json and narrators.json, and adds a 'chain' property with the full
chain text in both Arabic and English.
"""

import json
from pathlib import Path

# Paths
JSON_DATASETS_DIR = Path(__file__).parent.parent.parent / "json-datasets"
CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"

HADITH_FILES = [
    "bukhari.json",
    "muslim.json",
    "abudawud.json",
    "tirmidhi.json",
    "nasai.json",
    "ibnmajah.json",
    "malik.json",
    "ahmed.json",
    "darimi.json",
]


def load_json(file_path: Path) -> dict | list:
    """Load JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: list) -> None:
    """Save JSON file with proper formatting."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def build_chain_text(chain_id: str, chains: dict, narrators: list) -> str | None:
    """
    Build the full chain text from a chainId.

    Returns a string with narrator names in format:
    "NameAr (NameEn) ← NameAr (NameEn) ← ..."
    """
    if chain_id not in chains:
        return None

    narrator_ids = chains[chain_id]
    chain_parts = []

    for nid in narrator_ids:
        if nid < len(narrators):
            narrator = narrators[nid]
            name_ar = narrator.get("nameAr", "")
            name_en = narrator.get("nameEn", "")

            if name_ar and name_en:
                chain_parts.append(f"{name_ar} ({name_en})")
            elif name_ar:
                chain_parts.append(name_ar)
            elif name_en:
                chain_parts.append(name_en)
        else:
            print(f"  Warning: Narrator ID {nid} not found in narrators.json")

    return " ← ".join(chain_parts) if chain_parts else None


def process_hadith_file(
    file_path: Path, chains: dict, narrators: list
) -> tuple[int, int, int]:
    """
    Process a single hadith file, adding chain text to each hadith.

    Returns tuple of (total_hadiths, hadiths_with_chain, hadiths_updated).
    """
    print(f"Processing {file_path.name}...")

    hadiths = load_json(file_path)
    total = len(hadiths)
    with_chain_id = 0
    updated = 0

    for hadith in hadiths:
        chain_id = hadith.get("chainId")
        if chain_id:
            with_chain_id += 1
            chain_text = build_chain_text(chain_id, chains, narrators)
            if chain_text:
                hadith["chain"] = chain_text
                updated += 1

    save_json(file_path, hadiths)
    print(f"  Total: {total}, With chainId: {with_chain_id}, Updated: {updated}")

    return total, with_chain_id, updated


def main():
    """Main function to process all hadith files."""
    print("Loading chains.json...")
    chains = load_json(CHAINS_FILE)
    print(f"  Loaded {len(chains)} chains")

    print("Loading narrators.json...")
    narrators = load_json(NARRATORS_FILE)
    print(f"  Loaded {len(narrators)} narrators")

    print("\nProcessing hadith files...\n")

    total_hadiths = 0
    total_with_chain = 0
    total_updated = 0

    for filename in HADITH_FILES:
        file_path = JSON_DATASETS_DIR / filename
        if file_path.exists():
            t, wc, u = process_hadith_file(file_path, chains, narrators)
            total_hadiths += t
            total_with_chain += wc
            total_updated += u
        else:
            print(f"Warning: {filename} not found, skipping...")

    print("\n" + "=" * 50)
    print("Summary:")
    print(f"  Total hadiths processed: {total_hadiths}")
    print(f"  Hadiths with chainId: {total_with_chain}")
    print(f"  Hadiths updated with chain text: {total_updated}")
    print("=" * 50)


if __name__ == "__main__":
    main()
