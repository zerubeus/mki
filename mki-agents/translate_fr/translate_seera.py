#!/usr/bin/env python3
"""
French Translation Agent for Seera Events

Translates seera_events.csv from Arabic to French using Google Gemini API.
Keeps the exact same CSV structure.
"""

import json
import os
import time

import pandas as pd
from dotenv import load_dotenv

from .config import (
    INPUT_CSV,
    OUTPUT_CSV,
    PROGRESS_FILE,
    MODEL_NAME,
    REQUEST_DELAY,
    BATCH_SIZE,
    TRANSLATE_COLUMNS,
)
from .gemini_client import GeminiFrenchTranslator


def load_progress() -> dict:
    """Load progress from checkpoint file."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed_ids": [], "translations": {}}


def save_progress(progress: dict) -> None:
    """Save progress to checkpoint file."""
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def main():
    # Load environment variables from mki-agents/.env
    env_path = PROGRESS_FILE.parent.parent / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("GOOGLE_AI")
    if not api_key:
        raise ValueError("GOOGLE_AI environment variable not set")

    # Initialize translator
    translator = GeminiFrenchTranslator(api_key, MODEL_NAME)

    # Load CSV
    print(f"Loading events from {INPUT_CSV}")
    df = pd.read_csv(INPUT_CSV)
    total_events = len(df)
    print(f"Found {total_events} events")
    print(f"Columns to translate: {TRANSLATE_COLUMNS}")

    # Load progress for resumability
    progress = load_progress()
    processed_ids = set(progress["processed_ids"])
    translations = progress["translations"]

    print(f"Previously processed: {len(processed_ids)} events")

    # Process events
    print("\nTranslating to French...")
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
            save_progress(progress)
            print(f"  [Checkpoint saved: {len(processed_ids)} events processed]")

    # Final save of progress
    progress["processed_ids"] = list(processed_ids)
    progress["translations"] = translations
    save_progress(progress)

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
    output_df.to_csv(OUTPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\nTranslation complete!")
    print(f"Output saved to: {OUTPUT_CSV}")
    print(f"Successfully processed {len(processed_ids)}/{total_events} events")


if __name__ == "__main__":
    main()
