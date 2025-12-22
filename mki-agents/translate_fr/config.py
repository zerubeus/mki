from pathlib import Path

# Paths
AGENT_DIR = Path(__file__).parent
PROJECT_ROOT = AGENT_DIR.parent.parent  # mki-agents -> mki
INPUT_CSV = PROJECT_ROOT / "mki-datasets" / "seera" / "seera_events.csv"
OUTPUT_CSV = PROJECT_ROOT / "mki-datasets" / "seera" / "seera_events_fr.csv"
PROGRESS_FILE = AGENT_DIR / ".progress.json"

# API Settings
MODEL_NAME = "gemini-2.5-flash-lite"
REQUEST_DELAY = 0.5  # seconds between API calls
MAX_RETRIES = 3
RETRY_DELAY = 2.0  # seconds between retries

# Batch settings
BATCH_SIZE = 10  # Save progress every N events

# Columns to translate (Arabic to French)
TRANSLATE_COLUMNS = ["title", "details", "location_name"]
