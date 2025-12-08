"""
Fix remaining mismatched chains using Gemini API with structured output.
Sequential version - slower but reliable.
"""

import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
JSON_DATASETS_DIR = BASE_DIR / "json-datasets"
CHAINS_FILE = JSON_DATASETS_DIR / "chains.json"
NARRATORS_FILE = JSON_DATASETS_DIR / "narrators.json"
MISMATCHED_FILE = JSON_DATASETS_DIR / "mismatched_chains.json"
SKIPPED_FILE = JSON_DATASETS_DIR / "gemini_skipped.json"
PROGRESS_FILE = JSON_DATASETS_DIR / "gemini_progress.json"

# Rate limit: 1 request per 0.5 seconds = 120 RPM (under 150 RPM tier 1 limit)
DELAY_BETWEEN_REQUESTS = 0.5

BOOK_NAMES = {
    "Sahih al-Bukhari": "صحيح البخاري",
    "Sahih Muslim": "صحيح مسلم",
    "Sunan Abu Dawud": "سنن أبي داود",
    "Jami' at-Tirmidhi": "جامع الترمذي",
    "Sunan an-Nasa'i": "سنن النسائي",
    "Sunan Ibn Majah": "سنن ابن ماجه",
    "Muwatta Malik": "موطأ مالك",
    "Musnad Ahmad": "مسند أحمد",
    "Sunan ad-Darimi": "سنن الدارمي",
}

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


class Narrator(BaseModel):
    name_ar: str = Field(description="اسم الراوي بالعربية")
    name_en: str = Field(description="English transliteration")


class ChainVerification(BaseModel):
    correct_chain: list[Narrator] = Field(description="السلسلة الصحيحة")
    confidence: str = Field(description="high/medium/low")
    notes: str = Field(description="Notes")


def load_json(file_path: Path) -> dict | list:
    with open(file_path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(file_path: Path, data: dict | list) -> None:
    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def normalize_arabic(text: str) -> str:
    text = re.sub(r"[\u064B-\u0652\u0670]", "", text)
    text = re.sub(r"[إأآا]", "ا", text)
    text = re.sub(r"ة", "ه", text)
    text = re.sub(r"ى", "ي", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def build_narrator_index(narrators: list) -> dict:
    exact_ar = {}
    for i, n in enumerate(narrators):
        name_ar = n.get("nameAr", "")
        if name_ar:
            exact_ar[normalize_arabic(name_ar)] = i
    return exact_ar


def find_narrator_id(name_ar: str, index: dict) -> Optional[int]:
    normalized = normalize_arabic(name_ar)

    if normalized in index:
        return index[normalized]

    start_match = None
    start_match_len = 0

    for json_name, idx in index.items():
        if json_name in normalized:
            pos = normalized.find(json_name)
            if pos == 0 and len(json_name) > start_match_len:
                start_match = idx
                start_match_len = len(json_name)
        elif normalized in json_name:
            pos = json_name.find(normalized)
            if pos == 0 and len(normalized) > start_match_len:
                start_match = idx
                start_match_len = len(normalized)

    if start_match is not None and start_match_len >= 8:
        return start_match

    common_words = {"بن", "ابن", "ابي", "ام", "عبد", "بنت", "ال"}
    name_words = set(normalized.split()) - common_words
    name_words = {w for w in name_words if len(w) > 2}

    if name_words:
        candidates = {}
        for json_name, idx in index.items():
            json_words = set(json_name.split()) - common_words
            overlap = name_words & json_words
            if overlap:
                candidates[idx] = len(overlap)

        if candidates:
            best_idx = max(candidates, key=lambda x: candidates[x])
            if candidates[best_idx] >= 2:
                return best_idx

    return None


def get_hadith_text(hadith_id: str, hadiths_cache: dict) -> Optional[str]:
    book_key = hadith_id.split("-")[0]
    if book_key not in hadiths_cache:
        return None
    for h in hadiths_cache[book_key]:
        if h.get("id") == hadith_id:
            return h.get("textAr", "")
    return None


def build_prompt(book_name: str, hadith_number: str, hadith_text: str,
                 json_chain: list[str], csv_chain: list[str]) -> str:
    return f"""أنت خبير في علم الحديث. حدد السلسلة الصحيحة للرواة.

الكتاب: {book_name} - الحديث رقم: {hadith_number}

نص الحديث:
{hadith_text[:400]}

السلسلة الحالية: {' ← '.join(json_chain)}
سلسلة بديلة: {' ← '.join(csv_chain)}

استخرج الإسناد الرئيسي من نص الحديث (من المحدث إلى الصحابي)."""


def log(msg: str):
    print(msg, flush=True)


def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else None

    log("Sequential Gemini fix (~120 RPM)")

    client = genai.Client(api_key=os.getenv("GOOGLE_AI"))

    log("Loading data...")
    mismatches = load_json(MISMATCHED_FILE)
    chains = load_json(CHAINS_FILE)
    narrators = load_json(NARRATORS_FILE)
    narrator_index = build_narrator_index(narrators)

    hadiths_cache = {}
    for book_key, filename in HADITH_FILES.items():
        file_path = JSON_DATASETS_DIR / filename
        if file_path.exists():
            hadiths_cache[book_key] = load_json(file_path)

    # Load progress
    processed_ids = set()
    if PROGRESS_FILE.exists():
        progress = load_json(PROGRESS_FILE)
        processed_ids = set(progress.get("processed", []))
        log(f"  Found {len(processed_ids)} in progress file")

    # Also load skipped
    skipped_list = []
    if SKIPPED_FILE.exists():
        skipped_list = load_json(SKIPPED_FILE)
        skipped_ids = {s["chain_id"] for s in skipped_list}
        processed_ids.update(skipped_ids)
        log(f"  Found {len(skipped_ids)} in skipped file")

    log(f"  Total already processed: {len(processed_ids)}")

    # Filter unprocessed
    to_process = [m for m in mismatches if m["chain_id"] not in processed_ids]
    if limit:
        to_process = to_process[:limit]

    total = len(to_process)
    log(f"Processing {total} mismatches (~{total * DELAY_BETWEEN_REQUESTS / 60:.1f} minutes)\n")

    fixed = 0
    start_time = time.time()

    for i, mismatch in enumerate(to_process):
        hadith_id = mismatch["hadith_id"]
        chain_id = mismatch["chain_id"]

        hadith_text = get_hadith_text(hadith_id, hadiths_cache)
        if not hadith_text:
            skipped_list.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "reason": "No hadith text",
            })
            processed_ids.add(chain_id)
            continue

        source = mismatch.get("source", "")
        book_name = BOOK_NAMES.get(source, source)

        prompt = build_prompt(
            book_name,
            mismatch["hadith_number"],
            hadith_text,
            mismatch["json_chain"],
            mismatch["csv_chain"],
        )

        try:
            log(f"  [{i+1}] Calling API for {hadith_id}...")
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "response_mime_type": "application/json",
                    "response_schema": ChainVerification,
                },
            )
            log(f"  [{i+1}] Got response, parsing...")
            result = ChainVerification.model_validate_json(response.text)
        except Exception as e:
            skipped_list.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "reason": f"Gemini error: {str(e)[:100]}",
            })
            processed_ids.add(chain_id)
            time.sleep(DELAY_BETWEEN_REQUESTS)
            continue

        if not result or not result.correct_chain:
            skipped_list.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "reason": "Empty result",
            })
            processed_ids.add(chain_id)
            time.sleep(DELAY_BETWEEN_REQUESTS)
            continue

        narrator_ids = []
        missing = []

        for narrator in result.correct_chain:
            nid = find_narrator_id(narrator.name_ar, narrator_index)
            if nid is not None:
                narrator_ids.append(nid)
            else:
                missing.append(narrator.name_ar)

        if missing:
            skipped_list.append({
                "hadith_id": hadith_id,
                "chain_id": chain_id,
                "reason": f"Missing: {', '.join(missing[:3])}",
                "confidence": result.confidence,
            })
        else:
            chains[chain_id] = narrator_ids
            fixed += 1

        processed_ids.add(chain_id)

        # Progress output
        completed = i + 1
        if fixed % 10 == 0 and fixed > 0:
            elapsed = time.time() - start_time
            rate = completed / elapsed if elapsed > 0 else 0
            eta = (total - completed) / rate / 60 if rate > 0 else 0
            log(f"  Fixed: {fixed} | {completed}/{total} | {rate:.1f}/s | ETA: {eta:.1f}m")

        # Save every 50
        if completed % 50 == 0:
            save_json(CHAINS_FILE, chains)
            save_json(PROGRESS_FILE, {"processed": list(processed_ids)})
            save_json(SKIPPED_FILE, skipped_list)
            log(f"  Progress saved at {completed}")

        # Rate limit
        time.sleep(DELAY_BETWEEN_REQUESTS)

    # Final save
    save_json(CHAINS_FILE, chains)
    save_json(PROGRESS_FILE, {"processed": list(processed_ids)})
    save_json(SKIPPED_FILE, skipped_list)

    elapsed = time.time() - start_time
    log("\n" + "=" * 50)
    log("Summary:")
    log(f"  Total processed: {len(to_process)}")
    log(f"  Fixed: {fixed}")
    log(f"  Skipped: {len(skipped_list)}")
    log(f"  Time: {elapsed/60:.1f} minutes")
    log("=" * 50)


if __name__ == "__main__":
    main()
