#!/usr/bin/env python3
"""
Location Extraction Agent for Seera Events

Extracts specific Arabic location names from Islamic historical events
using Google Gemini API.
"""

import json
import os
import time

import pandas as pd
from dotenv import load_dotenv

from .config import (
    INPUT_CSV,
    PROGRESS_FILE,
    MODEL_NAME,
    REQUEST_DELAY,
    BATCH_SIZE,
)
from .gemini_client import GeminiLocationExtractor


def load_progress() -> dict:
    """Load progress from checkpoint file."""
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"processed_ids": [], "locations": {}}


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

    # Initialize client
    extractor = GeminiLocationExtractor(api_key, MODEL_NAME)

    # Load CSV
    print(f"Loading events from {INPUT_CSV}")
    df = pd.read_csv(INPUT_CSV)
    total_events = len(df)
    print(f"Found {total_events} events")

    # Load progress for resumability
    progress = load_progress()
    processed_ids = set(progress["processed_ids"])
    locations = progress["locations"]

    print(f"Previously processed: {len(processed_ids)} events")

    # Process events
    print("\nExtracting locations...")
    for idx, row in df.iterrows():
        event_id = str(row["event_id"])

        # Skip already processed
        if event_id in processed_ids:
            continue

        title = row["title"] if pd.notna(row["title"]) else ""
        details = row["details"] if pd.notna(row["details"]) else ""

        print(f"  [{idx + 1}/{total_events}] Event {event_id}: {title[:50]}...")

        location = extractor.extract_location(title, details)

        if location:
            locations[event_id] = location
            processed_ids.add(event_id)
            print(f"    -> {location}")
        else:
            print("    -> FAILED (will retry on next run)")

        # Save progress periodically
        if (idx + 1) % BATCH_SIZE == 0:
            progress["processed_ids"] = list(processed_ids)
            progress["locations"] = locations
            save_progress(progress)
            print(f"  [Checkpoint saved: {len(processed_ids)} events processed]")

        # Rate limiting
        time.sleep(REQUEST_DELAY)

    # Final save
    progress["processed_ids"] = list(processed_ids)
    progress["locations"] = locations
    save_progress(progress)

    # Add location_name column to DataFrame
    df["location_name"] = df["event_id"].astype(str).map(locations)
    df["location_name"] = df["location_name"].fillna("غير محدد")

    # Save back to original CSV
    df.to_csv(INPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\nUpdated {INPUT_CSV} with location_name column")
    print(f"Successfully processed {len(processed_ids)}/{total_events} events")


if __name__ == "__main__":
    main()
