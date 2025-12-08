"""
Fix mismatched chains using CSV data as the source of truth.

This script:
1. Reads mismatched_chains.json (already contains correct csv_chain names)
2. Maps CSV narrator names to JSON narrator IDs in narrators.json
3. Updates chains.json with the corrected chain
"""

import json
import re
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
JSON_DATASETS_DIR = BASE_DIR / "json-datasets"

CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"
MISMATCHED_FILE = JSON_DATASETS_DIR / "mismatched_chains.json"
UNFIXABLE_FILE = JSON_DATASETS_DIR / "unfixable_chains.json"


def load_json(file_path: Path) -> dict | list:
    """Load JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: dict | list) -> None:
    """Save JSON file with proper formatting."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


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


def build_narrator_index(narrators: list) -> dict:
    """
    Build multiple indices for narrator lookup.
    Returns dict with different matching strategies.
    """
    # Exact normalized Arabic name -> ID
    exact_ar = {}
    # Normalized English name -> ID
    exact_en = {}
    # Word-based index: each significant word -> list of IDs
    word_index = {}

    common_words = {"بن", "ابن", "ابي", "ام", "عبد", "بنت", "ال"}

    for i, narrator in enumerate(narrators):
        name_ar = narrator.get("nameAr", "")
        name_en = narrator.get("nameEn", "")

        if name_ar:
            normalized = normalize_arabic(name_ar)
            exact_ar[normalized] = i

            # Index by significant words
            words = set(normalized.split()) - common_words
            for word in words:
                if len(word) > 2:
                    if word not in word_index:
                        word_index[word] = []
                    word_index[word].append(i)

        if name_en:
            exact_en[name_en.lower().strip()] = i

    return {
        "exact_ar": exact_ar,
        "exact_en": exact_en,
        "word_index": word_index,
        "narrators": narrators,
    }


def find_narrator_id(csv_name: str, index: dict, cache: dict) -> int | None:
    """
    Find narrator ID for a CSV name using multiple strategies.
    """
    normalized = normalize_arabic(csv_name)

    # Check cache first
    if normalized in cache:
        return cache[normalized]

    # Strategy 1: Exact match
    if normalized in index["exact_ar"]:
        cache[normalized] = index["exact_ar"][normalized]
        return cache[normalized]

    # Strategy 2: Substring match - prefer matches at START of name
    start_match = None
    start_match_len = 0
    any_match = None
    any_match_len = 0

    for json_name, idx in index["exact_ar"].items():
        if json_name in normalized:
            # JSON name is contained in CSV name
            pos = normalized.find(json_name)
            if pos == 0:
                # Match at start - prefer this!
                if len(json_name) > start_match_len:
                    start_match = idx
                    start_match_len = len(json_name)
            else:
                # Match elsewhere
                if len(json_name) > any_match_len:
                    any_match = idx
                    any_match_len = len(json_name)
        elif normalized in json_name:
            # CSV name is contained in JSON name (CSV is shorter)
            pos = json_name.find(normalized)
            if pos == 0:
                if len(normalized) > start_match_len:
                    start_match = idx
                    start_match_len = len(normalized)
            else:
                if len(normalized) > any_match_len:
                    any_match = idx
                    any_match_len = len(normalized)

    # Prefer start matches, fall back to any match
    if start_match is not None and start_match_len >= 8:
        cache[normalized] = start_match
        return start_match
    if any_match is not None and any_match_len >= 12:
        cache[normalized] = any_match
        return any_match

    # Strategy 3: Word-based matching
    common_words = {"بن", "ابن", "ابي", "ام", "عبد", "بنت", "ال", "المؤمنين"}
    csv_words = set(normalized.split()) - common_words
    csv_words = {w for w in csv_words if len(w) > 2}

    if csv_words:
        # Find candidates that share words
        candidates = {}
        for word in csv_words:
            if word in index["word_index"]:
                for idx in index["word_index"][word]:
                    candidates[idx] = candidates.get(idx, 0) + 1

        # Find best match (most shared words)
        if candidates:
            best_idx = max(candidates, key=lambda x: candidates[x])
            best_score = candidates[best_idx]

            # Require at least 2 matching words or 50% overlap
            if best_score >= 2 or (len(csv_words) > 0 and best_score >= len(csv_words) * 0.5):
                cache[normalized] = best_idx
                return best_idx

    return None


def log(msg: str):
    """Print with flush for real-time output."""
    print(msg, flush=True)


def main():
    """Main function to fix chains from CSV data."""
    log("Loading mismatched_chains.json...")
    mismatches = load_json(MISMATCHED_FILE)
    log(f"  Loaded {len(mismatches)} mismatches to fix")

    log("Loading chains.json...")
    chains = load_json(CHAINS_FILE)
    log(f"  Loaded {len(chains)} chains")

    log("Loading narrators.json...")
    narrators = load_json(NARRATORS_FILE)
    log(f"  Loaded {len(narrators)} narrators")

    log("Building narrator index...")
    index = build_narrator_index(narrators)

    # Cache for name lookups
    cache = {}

    fixed = 0
    unfixable = []

    log("\nProcessing mismatches...\n")

    for i, mismatch in enumerate(mismatches):
        chain_id = mismatch["chain_id"]
        csv_chain = mismatch["csv_chain"]  # The correct chain names
        hadith_id = mismatch["hadith_id"]

        # Map each CSV name to a narrator ID
        new_chain = []
        missing_narrators = []

        for name in csv_chain:
            narrator_id = find_narrator_id(name, index, cache)
            if narrator_id is not None:
                new_chain.append(narrator_id)
            else:
                missing_narrators.append(name)

        if missing_narrators:
            unfixable.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "csv_chain": csv_chain,
                "missing_narrators": missing_narrators,
                "partial_chain": new_chain,
            })
        else:
            # Update chains.json
            old_chain = chains.get(chain_id, [])
            chains[chain_id] = new_chain
            fixed += 1

            if fixed % 100 == 0:
                log(f"  [{fixed}] Fixed chains...")

        # Progress update
        if (i + 1) % 1000 == 0:
            log(f"  Processed {i + 1}/{len(mismatches)}")

    # Save results
    log(f"\nSaving updated chains.json ({fixed} fixed)...")
    save_json(CHAINS_FILE, chains)

    log(f"Saving {len(unfixable)} unfixable chains to unfixable_chains.json...")
    save_json(UNFIXABLE_FILE, unfixable)

    log("\n" + "=" * 60)
    log("Summary:")
    log(f"  Total mismatches: {len(mismatches)}")
    log(f"  Successfully fixed: {fixed}")
    log(f"  Unfixable (missing narrators): {len(unfixable)}")
    log("=" * 60)


if __name__ == "__main__":
    main()
