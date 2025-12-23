#!/usr/bin/env python3
"""
Translation Agent for Seera Events

Translates seera_events.csv from Arabic to target language using Google Gemini API.
Keeps the exact same CSV structure.

Usage:
    uv run python -m translate.translate_seera --lang en  # English
    uv run python -m translate.translate_seera --lang fr  # French
"""

import argparse
import json
import os
import time

import pandas as pd
from dotenv import load_dotenv

from .config import (
    AGENT_DIR,
    INPUT_CSV,
    MODEL_NAME,
    REQUEST_DELAY,
    BATCH_SIZE,
    TRANSLATE_COLUMNS,
    SUPPORTED_LANGUAGES,
    get_output_csv,
    get_progress_file,
)
from .gemini_client import GeminiTranslator


def load_progress(progress_file) -> dict:
    """Load progress from checkpoint file."""
    if progress_file.exists():
        with open(progress_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed_ids": [], "translations": {}}


def save_progress(progress: dict, progress_file) -> None:
    """Save progress to checkpoint file."""
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Translate Seera events to target language")
    parser.add_argument(
        "--lang",
        type=str,
        default="en",
        choices=list(SUPPORTED_LANGUAGES.keys()),
        help=f"Target language code. Supported: {list(SUPPORTED_LANGUAGES.keys())}",
    )
    args = parser.parse_args()

    lang = args.lang
    lang_name = SUPPORTED_LANGUAGES[lang]
    output_csv = get_output_csv(lang)
    progress_file = get_progress_file(lang)

    # Load environment variables from mki-agents/.env
    env_path = AGENT_DIR.parent / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("GOOGLE_AI")
    if not api_key:
        raise ValueError("GOOGLE_AI environment variable not set")

    # Initialize translator
    translator = GeminiTranslator(api_key, MODEL_NAME, lang)

    # Load CSV
    print(f"Loading events from {INPUT_CSV}")
    df = pd.read_csv(INPUT_CSV)
    total_events = len(df)
    print(f"Found {total_events} events")
    print(f"Target language: {lang_name} ({lang})")
    print(f"Columns to translate: {TRANSLATE_COLUMNS}")

    # Load progress for resumability
    progress = load_progress(progress_file)
    processed_ids = set(progress["processed_ids"])
    translations = progress["translations"]

    print(f"Previously processed: {len(processed_ids)} events")

    # Process events
    print(f"\nTranslating to {lang_name}...")
    for idx, row in df.iterrows():
        event_id = str(row["event_id"])

        # Skip already processed
        if event_id in processed_ids:
            continue

        title = row["title"] if pd.notna(row["title"]) else ""
        print(f"  [{idx + 1}/{total_events}] Event {event_id}: {title[:50]}...")

        event_translations = {}

        for col in TRANSLATE_COLUMNS:
            original_text = row[col] if pd.notna(row[col]) else ""
            if original_text:
                print(f"    Translating '{col}'...")
                translated = translator.translate_text(original_text)
                if translated:
                    event_translations[col] = translated
                else:
                    print(f"    FAILED to translate '{col}'")
                    event_translations[col] = original_text  # Keep original on failure
                time.sleep(REQUEST_DELAY)
            else:
                event_translations[col] = original_text

        translations[event_id] = event_translations
        processed_ids.add(event_id)
        print(f"    Done!")

        # Save progress periodically
        if (idx + 1) % BATCH_SIZE == 0:
            progress["processed_ids"] = list(processed_ids)
            progress["translations"] = translations
            save_progress(progress, progress_file)
            print(f"  [Checkpoint saved: {len(processed_ids)} events processed]")

    # Final save of progress
    progress["processed_ids"] = list(processed_ids)
    progress["translations"] = translations
    save_progress(progress, progress_file)

    # Build output DataFrame
    output_rows = []
    for idx, row in df.iterrows():
        event_id = str(row["event_id"])
        new_row = row.to_dict()

        # Apply translations
        if event_id in translations:
            for col in TRANSLATE_COLUMNS:
                if col in translations[event_id]:
                    new_row[col] = translations[event_id][col]

        output_rows.append(new_row)

    output_df = pd.DataFrame(output_rows)

    # Save to output CSV
    output_df.to_csv(output_csv, index=False, encoding="utf-8-sig")
    print(f"\nTranslation complete!")
    print(f"Output saved to: {output_csv}")
    print(f"Successfully processed {len(processed_ids)}/{total_events} events")


if __name__ == "__main__":
    main()
