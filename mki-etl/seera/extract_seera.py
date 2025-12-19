#!/usr/bin/env python3
"""
Seera (Prophet's Biography) Scraper for Dorar.net

Extracts historical events from the Prophet Mohammed's era from the
Historical Encyclopedia at dorar.net and outputs to CSV.
"""

import re
import time
from pathlib import Path

import pandas as pd
import requests
from bs4 import BeautifulSoup

# Constants
BASE_URL = "https://dorar.net"
LISTING_URL_TEMPLATE = f"{BASE_URL}/history?era=1&page={{page}}"
EVENT_URL_TEMPLATE = f"{BASE_URL}/history/event/{{event_id}}"
OUTPUT_DIR = Path(__file__).parent.parent.parent / "mki-datasets" / "seera"
OUTPUT_FILE = OUTPUT_DIR / "seera_events.csv"
TOTAL_PAGES = 8
REQUEST_DELAY = 0.5  # seconds between requests

# HTTP headers to mimic browser
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5,ar;q=0.3",
}


def fetch_page(url: str, retries: int = 3) -> BeautifulSoup | None:
    """Fetch a page and return BeautifulSoup object."""
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, "lxml")
        except requests.RequestException as e:
            print(f"  Attempt {attempt + 1}/{retries} failed for {url}: {e}")
            if attempt < retries - 1:
                time.sleep(2)
    return None


def get_event_ids_from_page(page: int) -> list[int]:
    """Extract all event IDs from a listing page."""
    url = LISTING_URL_TEMPLATE.format(page=page)
    print(f"Fetching listing page {page}: {url}")

    soup = fetch_page(url)
    if not soup:
        print(f"  Failed to fetch page {page}")
        return []

    event_ids = []
    # Find all links to individual event pages
    event_links = soup.find_all("a", href=re.compile(r"/history/event/\d+"))

    for link in event_links:
        href = link.get("href", "")
        match = re.search(r"/history/event/(\d+)", href)
        if match:
            event_id = int(match.group(1))
            if event_id not in event_ids:  # Avoid duplicates
                event_ids.append(event_id)

    print(f"  Found {len(event_ids)} events on page {page}")
    return event_ids


def extract_text_after_label(soup: BeautifulSoup, label: str) -> str | None:
    """Extract text content that follows a specific label."""
    # Find element containing the label
    for element in soup.find_all(string=re.compile(label)):
        parent = element.parent
        if parent:
            # Get the next sibling or nested span with the value
            next_elem = parent.find_next_sibling()
            if next_elem:
                return next_elem.get_text(strip=True)
            # Check for nested structure
            value_span = parent.find("span")
            if value_span:
                return value_span.get_text(strip=True)
            # Check parent's siblings
            parent_parent = parent.parent
            if parent_parent:
                spans = parent_parent.find_all("span")
                for span in spans:
                    text = span.get_text(strip=True)
                    if text and label not in text:
                        return text
    return None


def get_event_details(event_id: int) -> dict | None:
    """Fetch and extract details from an individual event page."""
    url = EVENT_URL_TEMPLATE.format(event_id=event_id)

    soup = fetch_page(url)
    if not soup:
        print(f"  Failed to fetch event {event_id}")
        return None

    event = {
        "event_id": event_id,
        "title": None,
        "hijri_year": None,
        "lunar_month": None,
        "gregorian_year": None,
        "details": None,
        "source_url": url,
    }

    # Find the event panel by looking for tabpanels containing "العام الهجري"
    panels = soup.find_all(attrs={"role": "tabpanel"})
    event_panel = None

    for panel in panels:
        panel_text = panel.get_text()
        if "العام الهجري" in panel_text and "تفاصيل الحدث" in panel_text:
            event_panel = panel
            break

    if not event_panel:
        return event

    # Get panel ID to find the corresponding title link
    panel_id = event_panel.get("id")
    if panel_id:
        # Find all links that control this panel
        tab_links = soup.find_all("a", href=f"#{panel_id}")
        # Choose the correct link: prefer one without 'collapsed' class
        # or one whose grandparent has 'scroll-pos' class (the actual event header)
        for tab_link in tab_links:
            # Check if this is the event header (not navigation)
            grandparent = tab_link.parent.parent if tab_link.parent else None
            if grandparent and "scroll-pos" in grandparent.get("class", []):
                title_text = tab_link.get_text(strip=True)
                if title_text:
                    event["title"] = title_text
                break
            # Fallback: use link without 'collapsed' class
            link_classes = tab_link.get("class", [])
            if "collapsed" not in link_classes:
                title_text = tab_link.get_text(strip=True)
                if title_text:
                    event["title"] = title_text
                break

    # Extract data from panel text
    panel_text = event_panel.get_text()

    # Hijri year: extract number and suffix (ق هـ or هـ)
    hijri_match = re.search(r"العام الهجري\s*:\s*(\d+)", panel_text)
    if hijri_match:
        year_num = hijri_match.group(1)
        # Check for "ق هـ" (before hijra) or just "هـ"
        after_num = panel_text[hijri_match.end():hijri_match.end() + 30]
        if "ق هـ" in after_num or "ق  هـ" in after_num:
            event["hijri_year"] = f"{year_num} ق هـ"
        elif "هـ" in after_num:
            event["hijri_year"] = f"{year_num} هـ"
        else:
            event["hijri_year"] = year_num

    # Lunar month
    month_match = re.search(r"الشهر القمري\s*:\s*(\S+)", panel_text)
    if month_match:
        event["lunar_month"] = month_match.group(1).strip()

    # Gregorian year
    greg_match = re.search(r"العام الميلادي\s*:\s*(\d+)", panel_text)
    if greg_match:
        event["gregorian_year"] = greg_match.group(1)

    # Event details: everything after "تفاصيل الحدث:"
    details_start = panel_text.find("تفاصيل الحدث:")
    if details_start != -1:
        details = panel_text[details_start + len("تفاصيل الحدث:"):].strip()
        # Clean up whitespace
        details = " ".join(details.split())
        event["details"] = details

    return event


def scrape_all_events() -> list[dict]:
    """Scrape all events from all pages."""
    all_event_ids = []

    # Phase 1: Collect all event IDs from listing pages
    print("Phase 1: Collecting event IDs from listing pages...")
    for page in range(1, TOTAL_PAGES + 1):
        event_ids = get_event_ids_from_page(page)
        all_event_ids.extend(event_ids)
        time.sleep(REQUEST_DELAY)

    # Remove duplicates while preserving order
    seen = set()
    unique_ids = []
    for eid in all_event_ids:
        if eid not in seen:
            seen.add(eid)
            unique_ids.append(eid)

    print(f"\nTotal unique events found: {len(unique_ids)}")

    # Phase 2: Fetch full details for each event
    print("\nPhase 2: Fetching event details...")
    events = []
    for i, event_id in enumerate(unique_ids, 1):
        print(f"  [{i}/{len(unique_ids)}] Fetching event {event_id}...")
        event = get_event_details(event_id)
        if event:
            events.append(event)
        time.sleep(REQUEST_DELAY)

    return events


def save_to_csv(events: list[dict], output_path: Path) -> None:
    """Save events to CSV file."""
    output_path.parent.mkdir(parents=True, exist_ok=True)

    df = pd.DataFrame(events)

    # Reorder columns
    columns = ["event_id", "title", "hijri_year", "lunar_month", "gregorian_year", "details", "source_url"]
    df = df[columns]

    # Sort by event_id
    df = df.sort_values("event_id")

    df.to_csv(output_path, index=False, encoding="utf-8-sig")
    print(f"\nSaved {len(events)} events to {output_path}")


def main():
    """Main entry point."""
    print("=" * 60)
    print("Dorar.net Seera (Prophet's Biography) Scraper")
    print("=" * 60)
    print(f"Source: {BASE_URL}/history?era=1")
    print(f"Output: {OUTPUT_FILE}")
    print("=" * 60)

    events = scrape_all_events()

    if events:
        save_to_csv(events, OUTPUT_FILE)
        print("\nDone!")
    else:
        print("\nNo events found. Check for errors above.")


if __name__ == "__main__":
    main()
