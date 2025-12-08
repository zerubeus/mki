"""
Validate chain data by comparing JSON datasets with CSV datasets.

This script:
1. For each hadith in json-datasets, gets chain from chainId → chains.json → narrators.json
2. Finds the same hadith in all_hadiths_clean.csv, gets chain from chain_indx → all_rawis.csv
3. Compares the two chains by narrator names
4. Outputs mismatches to mismatched_chains.json
"""

import csv
import json
import re
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
JSON_DATASETS_DIR = BASE_DIR / "json-datasets"
CSV_DATASETS_DIR = BASE_DIR / "csv-datasets"

CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"
OUTPUT_FILE = JSON_DATASETS_DIR / "mismatched_chains.json"

HADITH_FILES = {
    "bukhari": "bukhari.json",
    "muslim": "muslim.json",
    "abudawud": "abudawud.json",
    "tirmidhi": "tirmidhi.json",
    "nasai": "nasai.json",
    "ibnmajah": "ibnmajah.json",
    "malik": "malik.json",
    "ahmed": "ahmed.json",
    "darimi": "darimi.json",
}

# Mapping from JSON source names to CSV source names
SOURCE_MAPPING = {
    "Sahih al-Bukhari": "Sahih Bukhari",
    "Sahih Muslim": "Sahih Muslim",
    "Sunan Abu Dawud": "Sunan Abu Dawud",
    "Jami' at-Tirmidhi": "Jami'at Tirmidhi",
    "Sunan an-Nasa'i": "Sunan an Nasa'i",
    "Sunan Ibn Majah": "Sunan Ibn Majah",
    "Muwatta Malik": "Muwatta Malik",
    "Musnad Ahmad": "Musnad Ahmad",
    "Sunan ad-Darimi": "Sunan al Darmi",
}


def load_json(file_path: Path) -> dict | list:
    """Load JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: list) -> None:
    """Save JSON file with proper formatting."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_csv(file_path: Path) -> list[dict]:
    """Load CSV file as list of dicts."""
    with open(file_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        return list(reader)


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for comparison."""
    # Remove diacritics (tashkeel)
    text = re.sub(r"[\u064B-\u0652\u0670]", "", text)
    # Normalize alif variants
    text = re.sub(r"[إأآا]", "ا", text)
    # Normalize taa marbuta
    text = re.sub(r"ة", "ه", text)
    # Normalize yaa
    text = re.sub(r"ى", "ي", text)
    # Remove extra spaces
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_arabic_name(full_name: str) -> str:
    """Extract Arabic name from the full name field in all_rawis.csv."""
    # Format: "English Name ( Arabic Name ( grade"
    # Try to extract Arabic text
    match = re.search(r"\(\s*([^\(]+?)\s*\(", full_name)
    if match:
        return match.group(1).strip()
    # Fallback: look for Arabic characters
    arabic_match = re.search(r"[\u0600-\u06FF]+[\u0600-\u06FF\s]+", full_name)
    if arabic_match:
        return arabic_match.group(0).strip()
    return full_name


def build_csv_hadith_index(csv_hadiths: list[dict]) -> dict:
    """
    Build an index of CSV hadiths by (source, hadith_no).
    Returns: {(normalized_source, hadith_no): csv_hadith}
    """
    index = {}
    for hadith in csv_hadiths:
        source = hadith.get("source", "").strip()
        hadith_no = hadith.get("hadith_no", "").strip()
        if source and hadith_no:
            key = (source, hadith_no)
            index[key] = hadith
    return index


def build_rawis_index(rawis: list[dict]) -> dict:
    """
    Build an index of rawis by scholar_indx.
    Returns: {scholar_indx: rawi_dict}
    """
    index = {}
    for rawi in rawis:
        scholar_indx = rawi.get("scholar_indx", "").strip()
        if scholar_indx:
            index[scholar_indx] = rawi
    return index


def get_json_chain_names(
    chain_id: str, chains: dict, narrators: list
) -> list[str] | None:
    """Get list of narrator names from JSON chain."""
    if chain_id not in chains:
        return None

    narrator_ids = chains[chain_id]
    names = []
    for nid in narrator_ids:
        if nid < len(narrators):
            narrator = narrators[nid]
            name_ar = narrator.get("nameAr", "")
            if name_ar:
                names.append(normalize_arabic(name_ar))
    return names


def get_csv_chain_names(chain_indx: str, rawis_index: dict) -> list[str] | None:
    """Get list of narrator names from CSV chain_indx."""
    if not chain_indx or chain_indx.strip() == "":
        return None

    # Parse comma-separated indices
    indices = [idx.strip() for idx in chain_indx.split(",") if idx.strip()]
    names = []

    for idx in indices:
        if idx in rawis_index:
            rawi = rawis_index[idx]
            full_name = rawi.get("name", "")
            arabic_name = extract_arabic_name(full_name)
            names.append(normalize_arabic(arabic_name))

    return names if names else None


def names_match(json_name: str, csv_name: str) -> bool:
    """
    Check if two narrator names refer to the same person.
    Uses multiple strategies: substring match, word overlap, etc.
    """
    # Direct match
    if json_name == csv_name:
        return True

    # Substring match
    if json_name in csv_name or csv_name in json_name:
        return True

    # Word-based matching: check if significant words overlap
    json_words = set(json_name.split())
    csv_words = set(csv_name.split())

    # Remove common short words
    common_words = {"بن", "ابن", "ابي", "ام", "عبد", "بنت"}
    json_significant = json_words - common_words
    csv_significant = csv_words - common_words

    # If most significant words overlap, consider it a match
    if json_significant and csv_significant:
        overlap = json_significant & csv_significant
        # Need at least 1 significant word match
        if len(overlap) >= 1:
            return True

    return False


def chains_match(json_names: list[str], csv_names: list[str]) -> tuple[bool, str]:
    """
    Compare two chains for equality.
    Returns (is_match, reason).
    """
    # Different length = definite mismatch
    if len(json_names) != len(csv_names):
        return False, f"count_diff:{len(json_names)}vs{len(csv_names)}"

    # Check each narrator in order
    mismatched_positions = []
    for i, (jn, cn) in enumerate(zip(json_names, csv_names)):
        if not names_match(jn, cn):
            mismatched_positions.append(i)

    if mismatched_positions:
        return False, f"name_diff:positions:{mismatched_positions}"

    return True, "matched"


def log(msg: str):
    """Print with flush for real-time output."""
    print(msg, flush=True)


def main():
    """Main function to validate chains."""
    log("Loading JSON chains.json...")
    chains = load_json(CHAINS_FILE)
    log(f"  Loaded {len(chains)} chains")

    log("Loading JSON narrators.json...")
    narrators = load_json(NARRATORS_FILE)
    log(f"  Loaded {len(narrators)} narrators")

    log("Loading CSV all_hadiths_clean.csv...")
    csv_hadiths = load_csv(CSV_DATASETS_DIR / "all_hadiths_clean.csv")
    log(f"  Loaded {len(csv_hadiths)} hadiths")

    log("Loading CSV all_rawis.csv...")
    rawis = load_csv(CSV_DATASETS_DIR / "all_rawis.csv")
    log(f"  Loaded {len(rawis)} rawis")

    # Build indices
    log("Building indices...")
    csv_hadith_index = build_csv_hadith_index(csv_hadiths)
    rawis_index = build_rawis_index(rawis)

    mismatches = []
    stats = {
        "total_processed": 0,
        "with_chain_id": 0,
        "found_in_csv": 0,
        "matched": 0,
        "mismatched": 0,
        "csv_not_found": 0,
        "json_chain_missing": 0,
        "csv_chain_missing": 0,
    }

    log("\nProcessing hadith files...\n")

    for book_key, filename in HADITH_FILES.items():
        file_path = JSON_DATASETS_DIR / filename
        if not file_path.exists():
            log(f"Warning: {filename} not found, skipping...")
            continue

        log(f"Processing {filename}...")
        hadiths = load_json(file_path)
        book_mismatches = 0

        for hadith in hadiths:
            stats["total_processed"] += 1
            chain_id = hadith.get("chainId")

            if not chain_id:
                continue

            stats["with_chain_id"] += 1

            # Get JSON chain
            json_names = get_json_chain_names(chain_id, chains, narrators)
            if not json_names:
                stats["json_chain_missing"] += 1
                continue

            # Find in CSV
            json_source = hadith.get("source", "")
            csv_source = SOURCE_MAPPING.get(json_source, json_source)
            hadith_no = str(hadith.get("hadithNumber", ""))

            csv_key = (csv_source, hadith_no)
            csv_hadith = csv_hadith_index.get(csv_key)

            if not csv_hadith:
                stats["csv_not_found"] += 1
                continue

            stats["found_in_csv"] += 1

            # Get CSV chain
            chain_indx = csv_hadith.get("chain_indx", "")
            csv_names = get_csv_chain_names(chain_indx, rawis_index)

            if not csv_names:
                stats["csv_chain_missing"] += 1
                continue

            # Compare chains
            is_match, reason = chains_match(json_names, csv_names)
            if is_match:
                stats["matched"] += 1
            else:
                stats["mismatched"] += 1
                book_mismatches += 1
                mismatches.append(
                    {
                        "hadith_id": hadith.get("id"),
                        "chain_id": chain_id,
                        "source": json_source,
                        "hadith_number": hadith_no,
                        "json_chain": json_names,
                        "csv_chain": csv_names,
                        "json_count": len(json_names),
                        "csv_count": len(csv_names),
                        "mismatch_reason": reason,
                    }
                )

        log(f"  Mismatches in {filename}: {book_mismatches}")

    # Save mismatches
    log(f"\nSaving {len(mismatches)} mismatches to mismatched_chains.json...")
    save_json(OUTPUT_FILE, mismatches)

    log("\n" + "=" * 60)
    log("Summary:")
    log(f"  Total hadiths processed: {stats['total_processed']}")
    log(f"  Hadiths with chainId: {stats['with_chain_id']}")
    log(f"  Found in CSV: {stats['found_in_csv']}")
    log(f"  Chains matched: {stats['matched']}")
    log(f"  Chains mismatched: {stats['mismatched']}")
    log(f"  CSV hadith not found: {stats['csv_not_found']}")
    log(f"  JSON chain missing: {stats['json_chain_missing']}")
    log(f"  CSV chain missing: {stats['csv_chain_missing']}")
    log("=" * 60)


if __name__ == "__main__":
    main()
