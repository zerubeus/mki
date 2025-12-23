from pathlib import Path

# Paths
AGENT_DIR = Path(__file__).parent
PROJECT_ROOT = AGENT_DIR.parent.parent  # mki-agents -> mki
INPUT_CSV = PROJECT_ROOT / "mki-datasets" / "seera" / "seera_events.csv"
OUTPUT_DIR = PROJECT_ROOT / "mki-datasets" / "seera"

# Supported languages
SUPPORTED_LANGUAGES = {
    "en": "English",
    "fr": "French",
}


def get_output_csv(lang: str) -> Path:
    """Get output CSV path for a given language."""
    return OUTPUT_DIR / f"seera_events_{lang}.csv"


def get_progress_file(lang: str) -> Path:
    """Get progress file path for a given language."""
    return AGENT_DIR / f".progress_{lang}.json"


# API Settings
MODEL_NAME = "gemini-2.5-flash-lite"
REQUEST_DELAY = 0.5  # seconds between API calls
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds between retries

# Batch settings
BATCH_SIZE = 10  # Save progress every N events

# Columns to translate
TRANSLATE_COLUMNS = ["title", "details", "location_name"]
