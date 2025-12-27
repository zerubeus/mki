#!/usr/bin/env python3
"""Merge seera CSV files with locale column."""

import pandas as pd
from pathlib import Path

DATASETS_DIR = Path(__file__).parent.parent.parent / "mki-datasets" / "seera"

FILES = {
    "seera_events.csv": "ar",
    "seera_events_en.csv": "en",
    "seera_events_fr.csv": "fr",
}


def main():
    dfs = []
    for filename, locale in FILES.items():
        df = pd.read_csv(DATASETS_DIR / filename)
        df["locale"] = locale
        dfs.append(df)
        print(f"Loaded {filename}: {len(df)} rows")

    merged = pd.concat(dfs, ignore_index=True)
    output_path = DATASETS_DIR / "seera_events_all.csv"
    merged.to_csv(output_path, index=False)
    print(f"Merged {len(merged)} rows to {output_path}")


if __name__ == "__main__":
    main()
