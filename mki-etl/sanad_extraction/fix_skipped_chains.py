"""
Fix remaining skipped chains using manual alias mapping.

This script processes chains that Gemini correctly identified but couldn't
be matched to narrators.json due to name variations.
"""

import json
import re
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
JSON_DATASETS_DIR = BASE_DIR / "json-datasets"

CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"
SKIPPED_FILE = JSON_DATASETS_DIR / "gemini_skipped.json"
ALIASES_FILE = JSON_DATASETS_DIR / "narrator_aliases.json"
MISMATCHED_FILE = JSON_DATASETS_DIR / "mismatched_chains.json"
STILL_UNFIXABLE_FILE = JSON_DATASETS_DIR / "still_unfixable_chains.json"


def load_json(file_path: Path) -> dict | list:
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: dict | list) -> None:
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for comparison."""
    text = re.sub(r"[\u064B-\u0652\u0670]", "", text)
    text = re.sub(r"[إأآا]", "ا", text)
    text = re.sub(r"ة", "ه", text)
    text = re.sub(r"ى", "ي", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_narrator_index(narrators: list) -> dict:
    """Build index for narrator lookup."""
    exact_ar = {}
    for i, n in enumerate(narrators):
        name_ar = n.get("nameAr", "")
        if name_ar:
            exact_ar[normalize_arabic(name_ar)] = i
    return exact_ar


def find_narrator_id(name_ar: str, narrator_index: dict, aliases: dict) -> int | None:
    """Find narrator ID using aliases first, then fuzzy matching."""
    # Clean the name
    clean_name = name_ar.strip()
    normalized = normalize_arabic(clean_name)

    # Strategy 1: Check aliases (exact match first)
    if clean_name in aliases:
        return aliases[clean_name]
    if normalized in aliases:
        return aliases[normalized]

    # Also check normalized versions of alias keys
    for alias_key, alias_id in aliases.items():
        if normalize_arabic(alias_key) == normalized:
            return alias_id

    # Strategy 2: Extract name from parentheses pattern like "أبيه (عروة بن الزبير)"
    paren_match = re.search(r"\(([^)]+)\)", clean_name)
    if paren_match:
        inner_name = paren_match.group(1)
        inner_normalized = normalize_arabic(inner_name)

        # Check aliases for inner name
        if inner_name in aliases:
            return aliases[inner_name]
        if inner_normalized in aliases:
            return aliases[inner_normalized]

        for alias_key, alias_id in aliases.items():
            if normalize_arabic(alias_key) == inner_normalized:
                return alias_id

        # Check narrator index for inner name
        if inner_normalized in narrator_index:
            return narrator_index[inner_normalized]

    # Strategy 3: Direct narrator index lookup
    if normalized in narrator_index:
        return narrator_index[normalized]

    # Strategy 4: Substring matching
    for json_name, idx in narrator_index.items():
        if json_name in normalized or normalized in json_name:
            if len(json_name) >= 6 or len(normalized) >= 6:
                return idx

    return None


def extract_chain_from_skipped(skipped_entry: dict) -> list[str] | None:
    """Extract narrator names from a skipped chain entry."""
    # New format has gemini_chain with ar/en
    if "gemini_chain" in skipped_entry:
        return [n.get("ar", "") for n in skipped_entry["gemini_chain"]]
    return None


def log(msg: str):
    print(msg, flush=True)


def main():
    log("Loading data...")
    skipped = load_json(SKIPPED_FILE)
    chains = load_json(CHAINS_FILE)
    narrators = load_json(NARRATORS_FILE)
    aliases = load_json(ALIASES_FILE)
    mismatched = load_json(MISMATCHED_FILE)

    # Build mismatch lookup by chain_id
    mismatch_by_chain = {m["chain_id"]: m for m in mismatched}

    # Build normalized alias index
    normalized_aliases = {}
    for key, value in aliases.items():
        normalized_aliases[key] = value
        normalized_aliases[normalize_arabic(key)] = value

    narrator_index = build_narrator_index(narrators)

    log(f"  Loaded {len(skipped)} skipped chains")
    log(f"  Loaded {len(aliases)} aliases")
    log(f"  Loaded {len(narrators)} narrators")
    log(f"  Loaded {len(mismatched)} mismatched chains for fallback")

    fixed = 0
    still_unfixable = []

    log("\nProcessing skipped chains...\n")

    for i, entry in enumerate(skipped):
        chain_id = entry["chain_id"]
        hadith_id = entry["hadith_id"]

        chain_names = extract_chain_from_skipped(entry)

        # If no gemini_chain, try CSV data from mismatched_chains.json
        if not chain_names and chain_id in mismatch_by_chain:
            chain_names = mismatch_by_chain[chain_id].get("csv_chain", [])
            if chain_names:
                log(f"  Using CSV fallback for {chain_id}")

        if not chain_names:
            still_unfixable.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "reason": entry.get("reason", "No chain data"),
            })
            continue

        # Map each name to an ID
        new_chain = []
        missing = []

        for name in chain_names:
            if not name:
                continue
            nid = find_narrator_id(name, narrator_index, normalized_aliases)
            if nid is not None:
                new_chain.append(nid)
            else:
                missing.append(name)

        if missing:
            still_unfixable.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "chain_names": chain_names,
                "missing_narrators": missing,
                "partial_chain": new_chain,
            })
        else:
            chains[chain_id] = new_chain
            fixed += 1
            log(f"  [{fixed}] Fixed {chain_id} ({hadith_id})")

    # Save results
    log(f"\nSaving updated chains.json ({fixed} fixed)...")
    save_json(CHAINS_FILE, chains)

    log(f"Saving {len(still_unfixable)} still unfixable to still_unfixable_chains.json...")
    save_json(STILL_UNFIXABLE_FILE, still_unfixable)

    log("\n" + "=" * 60)
    log("Summary:")
    log(f"  Total skipped: {len(skipped)}")
    log(f"  Successfully fixed: {fixed}")
    log(f"  Still unfixable: {len(still_unfixable)}")
    log("=" * 60)

    # Show unfixable details
    if still_unfixable:
        log("\nStill unfixable chains:")
        for entry in still_unfixable[:10]:
            missing = entry.get("missing_narrators", [])
            log(f"  {entry['hadith_id']}: Missing {missing}")
        if len(still_unfixable) > 10:
            log(f"  ... and {len(still_unfixable) - 10} more")


if __name__ == "__main__":
    main()
