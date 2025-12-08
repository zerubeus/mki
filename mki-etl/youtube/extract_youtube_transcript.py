#!/usr/bin/env python3
"""Extract transcripts from YouTube videos and save as JSON."""

import json
import re
import sys
from pathlib import Path

from youtube_transcript_api import YouTubeTranscriptApi

# Paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent.parent  # mki-etl -> mki
OUTPUT_DIR = PROJECT_ROOT / "json-datasets"


def extract_video_id(url_or_id: str) -> str:
    """Extract video ID from YouTube URL or return as-is if already an ID."""
    patterns = [
        r'(?:v=|/v/|youtu\.be/)([a-zA-Z0-9_-]{11})',
        r'^([a-zA-Z0-9_-]{11})$'
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_id)
        if match:
            return match.group(1)
    raise ValueError(f"Could not extract video ID from: {url_or_id}")


def get_transcript(video_id: str, languages: list[str] | None = None) -> dict:
    """Fetch transcript for a YouTube video."""
    if languages is None:
        languages = ['en', 'ar']

    api = YouTubeTranscriptApi()
    transcript_list = api.list(video_id)

    transcript = None
    transcript_info = {}

    # Try to find transcript in preferred languages
    try:
        transcript = transcript_list.find_transcript(languages)
        transcript_info['type'] = 'manual' if not transcript.is_generated else 'auto-generated'
        transcript_info['language'] = transcript.language
        transcript_info['language_code'] = transcript.language_code
    except Exception:
        # Fall back to any available transcript
        for t in transcript_list:
            transcript = t
            transcript_info['type'] = 'manual' if not t.is_generated else 'auto-generated'
            transcript_info['language'] = t.language
            transcript_info['language_code'] = t.language_code
            break

    if transcript is None:
        raise ValueError(f"No transcript available for video: {video_id}")

    fetched = transcript.fetch()
    segments = [{'text': s.text, 'start': s.start, 'duration': s.duration} for s in fetched]

    return {
        'video_id': video_id,
        'transcript_info': transcript_info,
        'segments': segments
    }


def save_transcript(data: dict, output_name: str) -> Path:
    """Save transcript data to JSON."""
    output_path = OUTPUT_DIR / f"{output_name}.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return output_path


def main(video_url: str, output_name: str | None = None):
    """Main entry point."""
    video_id = extract_video_id(video_url)

    if output_name is None:
        output_name = f"youtube_transcript_{video_id}"

    print(f"Extracting transcript for video: {video_id}")

    data = get_transcript(video_id)

    print(f"Found {len(data['segments'])} segments")
    print(f"Language: {data['transcript_info']['language']} ({data['transcript_info']['type']})")

    output_path = save_transcript(data, output_name)
    print(f"Saved to: {output_path}")

    return data


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_youtube_transcript.py <youtube_url_or_id> [output_name]")
        sys.exit(1)

    video_url = sys.argv[1]
    output_name = sys.argv[2] if len(sys.argv) > 2 else None
    main(video_url, output_name)
