#!/usr/bin/env python3
"""
Geocoding Agent for Seera Events

Adds geo_coordinates to each event based on the location_name column
using Google Gemini with verified reference coordinates.
"""

import json
import os
import re
import time

import pandas as pd
from dotenv import load_dotenv
from google import genai
from google.genai import types

from .config import INPUT_CSV, PROGRESS_FILE, MODEL_NAME, REQUEST_DELAY, MAX_RETRIES, RETRY_DELAY

# Verified coordinates from mki-ui/src/data/seerahEvents.ts
REFERENCE_COORDS: dict[str, tuple[float, float]] = {
    # Major cities
    "مكة": (21.4225, 39.8262),
    "مكة المكرمة": (21.4225, 39.8262),
    "المدينة": (24.4686, 39.6142),
    "المدينة المنورة": (24.4686, 39.6142),
    "يثرب": (24.4686, 39.6142),
    "الطائف": (21.2703, 40.4158),
    "القدس": (31.7761, 35.2357),
    # Specific sites in Mecca
    "غار حراء": (21.4573, 39.8593),
    "الكعبة": (21.4225, 39.8262),
    "الصفا": (21.4234, 39.8265),
    "شعب أبي طالب": (21.4230, 39.8260),
    "دار الأرقم": (21.4220, 39.8260),
    "دار الندوة": (21.4225, 39.8262),
    "الحجون": (21.4300, 39.8280),
    # Sites in/near Medina
    "مسجد قباء": (24.4397, 39.6172),
    "أحد": (24.5036, 39.6136),
    "أُحُد": (24.5036, 39.6136),
    "أُحُدٍ": (24.5036, 39.6136),
    # Battle sites
    "بدر": (23.7667, 38.7917),
    "الحديبية": (21.3175, 39.6586),
    "خيبر": (25.6931, 39.2894),
    "حنين": (21.4500, 40.0500),
    "تبوك": (28.4000, 36.5720),
    "مؤتة": (31.0500, 35.7000),
    # Other locations
    "عرفة": (21.3549, 39.9841),
    "الجعرانة": (21.5000, 40.0000),
    "نخلة": (21.5500, 40.1000),
    "الأبواء": (23.3500, 39.0500),
    "بصرى": (32.5167, 36.4833),
    "بُصرَى": (32.5167, 36.4833),
    "الحبشة": (9.0000, 38.7500),  # Ethiopia/Abyssinia (Aksum area)
    "صنعاء": (15.3694, 44.1910),
}

GEOCODE_PROMPT = """أنت خبير في الجغرافيا التاريخية الإسلامية.
أعطني الإحداثيات الجغرافية (خط العرض وخط الطول) للمكان التالي.

أمثلة مرجعية:
- مكة المكرمة: {{"lat": 21.4225, "lng": 39.8262}}
- المدينة المنورة: {{"lat": 24.4686, "lng": 39.6142}}
- غار حراء: {{"lat": 21.4573, "lng": 39.8593}}
- بدر: {{"lat": 23.7667, "lng": 38.7917}}
- أحد: {{"lat": 24.5036, "lng": 39.6136}}
- الحبشة: {{"lat": 9.0, "lng": 38.75}}
- بصرى الشام: {{"lat": 32.5167, "lng": 36.4833}}

القواعد:
1. أجب فقط بصيغة JSON: {{"lat": رقم, "lng": رقم}}
2. إذا كان المكان جزءاً من مدينة معروفة، أعط إحداثيات المدينة
3. إذا لم تعرف المكان بالضبط، أعط أقرب تقدير معقول
4. لا تضف أي نص إضافي

المكان: {location}

الإحداثيات:"""


def load_geocode_progress() -> dict:
    """Load geocoding progress from checkpoint file."""
    progress_file = PROGRESS_FILE.parent / ".geocode_progress.json"
    if progress_file.exists():
        with open(progress_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"geocoded": {}}


def save_geocode_progress(progress: dict) -> None:
    """Save geocoding progress to checkpoint file."""
    progress_file = PROGRESS_FILE.parent / ".geocode_progress.json"
    with open(progress_file, "w", encoding="utf-8") as f:
        json.dump(progress, f, ensure_ascii=False, indent=2)


def normalize_location(location: str) -> str:
    """Normalize location name for matching."""
    # Remove common suffixes/prefixes
    normalized = location.strip()
    # Remove diacritics variations
    return normalized


def get_reference_coords(location: str) -> tuple[float, float] | None:
    """Check if location matches any reference coordinates."""
    normalized = normalize_location(location)

    # Direct match
    if normalized in REFERENCE_COORDS:
        return REFERENCE_COORDS[normalized]

    # Check if location contains a known place
    for ref_name, coords in REFERENCE_COORDS.items():
        if ref_name in normalized or normalized in ref_name:
            return coords

    return None


def parse_coordinates(response_text: str) -> tuple[float, float] | None:
    """Parse JSON coordinates from Gemini response."""
    try:
        # Try to extract JSON from response
        json_match = re.search(r'\{[^}]+\}', response_text)
        if json_match:
            data = json.loads(json_match.group())
            lat = float(data.get("lat", 0))
            lng = float(data.get("lng", 0))

            # Validate bounds (Arabia + surrounding regions)
            if 5 <= lat <= 45 and 25 <= lng <= 60:
                return (lat, lng)
    except (json.JSONDecodeError, ValueError, TypeError):
        pass
    return None


def geocode_with_gemini(client: genai.Client, location: str) -> tuple[float, float] | None:
    """Get coordinates from Gemini API."""
    prompt = GEOCODE_PROMPT.format(location=location)

    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=100,
                ),
            )
            coords = parse_coordinates(response.text)
            if coords:
                return coords
        except Exception as e:
            print(f"    Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
            if attempt < MAX_RETRIES - 1:
                time.sleep(RETRY_DELAY)

    return None


def main():
    # Load environment variables
    env_path = PROGRESS_FILE.parent.parent / ".env"
    load_dotenv(env_path)

    api_key = os.getenv("GOOGLE_AI")
    if not api_key:
        raise ValueError("GOOGLE_AI environment variable not set")

    # Initialize Gemini client
    client = genai.Client(api_key=api_key)

    # Load CSV
    print(f"Loading events from {INPUT_CSV}")
    df = pd.read_csv(INPUT_CSV)

    if "location_name" not in df.columns:
        raise ValueError("location_name column not found. Run extract_locations.py first.")

    total_events = len(df)
    print(f"Found {total_events} events")

    # Get unique locations to geocode
    unique_locations = df["location_name"].dropna().unique()
    print(f"Found {len(unique_locations)} unique locations")

    # Load progress
    progress = load_geocode_progress()
    geocoded = progress["geocoded"]

    # Geocode each unique location
    print("\nGeocoding locations...")
    for i, location in enumerate(unique_locations):
        if location in geocoded:
            continue

        print(f"  [{i + 1}/{len(unique_locations)}] {location}")

        # Try reference coordinates first
        coords = get_reference_coords(location)
        if coords:
            geocoded[location] = f"{coords[0]},{coords[1]}"
            print(f"    -> {coords[0]}, {coords[1]} (reference)")
            continue

        # Use Gemini for unknown locations
        coords = geocode_with_gemini(client, location)
        if coords:
            geocoded[location] = f"{coords[0]},{coords[1]}"
            print(f"    -> {coords[0]}, {coords[1]} (gemini)")
        else:
            # Default to Mecca for unknown locations
            geocoded[location] = "21.4225,39.8262"
            print(f"    -> 21.4225, 39.8262 (default: Mecca)")

        # Save progress
        progress["geocoded"] = geocoded
        save_geocode_progress(progress)

        # Rate limiting
        time.sleep(REQUEST_DELAY)

    # Add geo_coordinates column
    df["geo_coordinates"] = df["location_name"].map(geocoded)

    # Fill any missing with Mecca coordinates
    df["geo_coordinates"] = df["geo_coordinates"].fillna("21.4225,39.8262")

    # Save updated CSV
    df.to_csv(INPUT_CSV, index=False, encoding="utf-8-sig")
    print(f"\nUpdated {INPUT_CSV} with geo_coordinates column")
    print(f"Geocoded {len(geocoded)} unique locations")


if __name__ == "__main__":
    main()
