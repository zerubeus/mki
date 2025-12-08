"""
Fix incorrect chain data in chains.json using Gemini API with structured output.

This script:
1. Loads existing hadith data and chains
2. Uses Gemini API to get correct isnad for each hadith
3. Matches narrator names to IDs in narrators.json
4. Updates chains.json with corrected data
"""

import json
import os
import re
import sys
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Paths
JSON_DATASETS_DIR = Path(__file__).parent.parent.parent / "json-datasets"
CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"
SKIPPED_FILE = JSON_DATASETS_DIR / "skipped_chains.json"

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

BOOK_NAMES = {
    "bukhari": "صحيح البخاري",
    "muslim": "صحيح مسلم",
    "abudawud": "سنن أبي داود",
    "tirmidhi": "جامع الترمذي",
    "nasai": "سنن النسائي",
    "ibnmajah": "سنن ابن ماجه",
    "malik": "موطأ مالك",
    "ahmed": "مسند أحمد",
    "darimi": "سنن الدارمي",
}


# Pydantic models for structured output
class Narrator(BaseModel):
    """A single narrator in the chain."""
    name_ar: str = Field(description="اسم الراوي بالعربية")
    name_en: str = Field(description="Narrator name in English transliteration")


class HadithChain(BaseModel):
    """The chain of narrators (isnad) for a hadith."""
    narrators: list[Narrator] = Field(
        description="قائمة الرواة بالترتيب من المحدث إلى الصحابي"
    )


def load_json(file_path: Path) -> dict | list:
    """Load JSON file."""
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: dict | list) -> None:
    """Save JSON file."""
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_arabic(text: str) -> str:
    """Normalize Arabic text for comparison."""
    # Remove diacritics (tashkeel)
    text = re.sub(r'[\u064B-\u0652\u0670]', '', text)
    # Normalize alif variants
    text = re.sub(r'[إأآا]', 'ا', text)
    # Normalize taa marbuta
    text = re.sub(r'ة', 'ه', text)
    # Normalize yaa
    text = re.sub(r'ى', 'ي', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def create_gemini_client() -> genai.Client:
    """Create Gemini API client."""
    api_key = os.getenv("GOOGLE_AI")
    if not api_key:
        raise ValueError("GOOGLE_AI environment variable not set")
    return genai.Client(api_key=api_key)


def get_chain_from_gemini(
    client: genai.Client,
    book_name: str,
    hadith_number: int
) -> Optional[HadithChain]:
    """Query Gemini for the correct isnad of a hadith using structured output."""
    prompt = f"""أعطني إسناد الحديث رقم {hadith_number} من {book_name}.

أريد فقط سلسلة الرواة الأساسية (الإسناد الرئيسي)، وليس الأسانيد المتابعة أو الشواهد.
ابدأ من الراوي الأول (المحدث/المصنف) وانتهِ بالصحابي أو المصدر.

مثال: إذا كان النص "حدثنا يحيى بن بكير قال حدثنا الليث عن عقيل عن ابن شهاب عن عروة عن عائشة"
فالسلسلة هي: يحيى بن بكير، الليث، عقيل، ابن شهاب، عروة، عائشة"""

    try:
        response = client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": HadithChain,
            },
        )

        # Parse the response
        chain = HadithChain.model_validate_json(response.text)
        return chain

    except Exception as e:
        print(f"  Error querying Gemini: {e}")
        return None


def find_narrator_id(
    name_ar: str,
    name_en: str,
    narrators: list[dict],
    name_to_id_cache: dict
) -> Optional[int]:
    """Find narrator ID by matching Arabic or English name."""
    normalized_ar = normalize_arabic(name_ar)
    normalized_en = name_en.lower().strip()

    # Check cache first (Arabic)
    if normalized_ar in name_to_id_cache:
        return name_to_id_cache[normalized_ar]

    # Check cache (English)
    if normalized_en in name_to_id_cache:
        return name_to_id_cache[normalized_en]

    # Search through narrators
    for i, narrator in enumerate(narrators):
        narrator_ar = narrator.get("nameAr", "")
        narrator_en = narrator.get("nameEn", "")

        # Exact match Arabic
        if normalize_arabic(narrator_ar) == normalized_ar:
            name_to_id_cache[normalized_ar] = i
            return i

        # Exact match English
        if narrator_en.lower().strip() == normalized_en:
            name_to_id_cache[normalized_en] = i
            return i

    # Try partial match
    for i, narrator in enumerate(narrators):
        narrator_ar = narrator.get("nameAr", "")
        normalized_narrator_ar = normalize_arabic(narrator_ar)

        # Partial match (name might be shortened or extended)
        if len(normalized_ar) > 3:
            if normalized_ar in normalized_narrator_ar or normalized_narrator_ar in normalized_ar:
                name_to_id_cache[normalized_ar] = i
                return i

    return None


def process_hadith(
    client: genai.Client,
    hadith: dict,
    book_key: str,
    chains: dict,
    narrators: list,
    name_to_id_cache: dict,
    skipped: list
) -> bool:
    """Process a single hadith and fix its chain if needed."""
    chain_id = hadith.get("chainId")
    hadith_id = hadith.get("id", "unknown")
    hadith_number = hadith.get("hadithNumber", 0)

    if not chain_id:
        return False

    book_name = BOOK_NAMES.get(book_key, book_key)

    # Get correct chain from Gemini
    chain_result = get_chain_from_gemini(client, book_name, hadith_number)

    if not chain_result or not chain_result.narrators:
        skipped.append({
            "chainId": chain_id,
            "hadithId": hadith_id,
            "book": book_key,
            "hadithNumber": hadith_number,
            "reason": "Could not get chain from Gemini"
        })
        return False

    # Convert narrator names to IDs
    narrator_ids = []
    missing_narrators = []

    for narrator in chain_result.narrators:
        narrator_id = find_narrator_id(
            narrator.name_ar,
            narrator.name_en,
            narrators,
            name_to_id_cache
        )
        if narrator_id is not None:
            narrator_ids.append(narrator_id)
        else:
            missing_narrators.append(f"{narrator.name_ar} ({narrator.name_en})")

    if missing_narrators:
        skipped.append({
            "chainId": chain_id,
            "hadithId": hadith_id,
            "book": book_key,
            "hadithNumber": hadith_number,
            "reason": f"Missing narrators: {', '.join(missing_narrators)}",
            "correctChain": [
                {"ar": n.name_ar, "en": n.name_en}
                for n in chain_result.narrators
            ]
        })
        return False

    # Update chains.json
    old_chain = chains.get(chain_id, [])
    if narrator_ids != old_chain:
        chains[chain_id] = narrator_ids
        print(f"  Fixed {chain_id}: {len(old_chain)} -> {len(narrator_ids)} narrators")
        return True

    return False


def log(msg: str):
    """Print with flush for real-time output."""
    print(msg, flush=True)


def main():
    """Main function to fix chain data."""
    # Parse optional limit argument
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None
    if limit:
        log(f"Running with limit: {limit} hadiths per book")

    log("Initializing Gemini client...")
    client = create_gemini_client()

    log("Loading chains.json...")
    chains = load_json(CHAINS_FILE)
    log(f"  Loaded {len(chains)} chains")

    log("Loading narrators.json...")
    narrators = load_json(NARRATORS_FILE)
    log(f"  Loaded {len(narrators)} narrators")

    # Cache for name to ID lookups
    name_to_id_cache = {}

    # Build initial cache from narrators
    for i, narrator in enumerate(narrators):
        name_ar = narrator.get("nameAr", "")
        name_en = narrator.get("nameEn", "")
        if name_ar:
            normalized = normalize_arabic(name_ar)
            name_to_id_cache[normalized] = i
        if name_en:
            name_to_id_cache[name_en.lower().strip()] = i

    skipped = []
    total_fixed = 0
    total_processed = 0

    log("\nProcessing hadith files...\n")

    for book_key, filename in HADITH_FILES.items():
        file_path = JSON_DATASETS_DIR / filename
        if not file_path.exists():
            log(f"Warning: {filename} not found, skipping...")
            continue

        log(f"Processing {filename}...")
        hadiths = load_json(file_path)

        # Apply limit if specified
        if limit:
            hadiths = [h for h in hadiths if h.get("chainId")][:limit]

        book_fixed = 0
        for hadith in hadiths:
            if hadith.get("chainId"):
                total_processed += 1
                if process_hadith(
                    client, hadith, book_key, chains, narrators,
                    name_to_id_cache, skipped
                ):
                    book_fixed += 1
                    total_fixed += 1

                # Log every hadith for visibility
                if total_processed % 10 == 0:
                    log(f"  [{total_processed}] fixed: {total_fixed}")

                # Save progress periodically
                if total_processed % 100 == 0:
                    save_json(CHAINS_FILE, chains)
                    save_json(SKIPPED_FILE, skipped)

        log(f"  Fixed {book_fixed} chains in {filename}")

    # Save final results
    log("\nSaving updated chains.json...")
    save_json(CHAINS_FILE, chains)

    log(f"Saving {len(skipped)} skipped chains to skipped_chains.json...")
    save_json(SKIPPED_FILE, skipped)

    log("\n" + "=" * 50)
    log("Summary:")
    log(f"  Total processed: {total_processed}")
    log(f"  Total fixed: {total_fixed}")
    log(f"  Total skipped: {len(skipped)}")
    log("=" * 50)


if __name__ == "__main__":
    main()
