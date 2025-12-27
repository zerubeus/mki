---
license: cc-by-4.0
language:
  - ar
  - en
  - fr
tags:
  - islamic-history
  - seerah
  - prophet-muhammad
  - biography
  - timeline
  - multilingual
size_categories:
  - n<1K
---

# Seera Events Dataset

A multilingual dataset of historical events from the life of Prophet Muhammad ﷺ (Seerah), covering the period from 571 CE to 632 CE.

## Dataset Description

This dataset contains 142 historical events translated into three languages: Arabic, English, and French. Each event includes detailed descriptions, dates in both Hijri and Gregorian calendars, and geographical coordinates.

### Source

Data extracted from [Dorar.net Historical Encyclopedia](https://dorar.net/history?era=1), a scholarly Arabic resource for Islamic history.

## Dataset Structure

| Column | Description |
|--------|-------------|
| `event_id` | Unique identifier for each event |
| `title` | Event title in the respective language |
| `hijri_year` | Year in Islamic calendar (e.g., "1 هـ" or "53 ق هـ" for before Hijra) |
| `lunar_month` | Islamic lunar month (Arabic names) |
| `gregorian_year` | Year in Gregorian calendar (571-632 CE) |
| `details` | Full description of the event |
| `source_url` | Link to the original source on Dorar.net |
| `location_name` | Place where the event occurred |
| `geo_coordinates` | Latitude and longitude (format: "lat,lon") |
| `locale` | Language code: `ar` (Arabic), `en` (English), `fr` (French) |

## Statistics

- **Total records**: 426 (142 events × 3 languages)
- **Languages**: Arabic (ar), English (en), French (fr)
- **Time period**: 571 CE - 632 CE
- **Events per language**: 142

## Usage

```python
from datasets import load_dataset

# Load the full dataset
dataset = load_dataset("mustknowislam/seera_events")

# Filter by language
arabic_events = dataset.filter(lambda x: x["locale"] == "ar")
english_events = dataset.filter(lambda x: x["locale"] == "en")
french_events = dataset.filter(lambda x: x["locale"] == "fr")
```

## Timeline Coverage

The dataset covers the complete prophetic biography including:

- **Pre-Prophethood Era** (571-610 CE): Birth, childhood, youth, and early life
- **Meccan Period** (610-622 CE): Revelation, early da'wah, persecution, and migration
- **Medinan Period** (622-632 CE): Establishment of the Muslim community, battles, treaties, and final years

## License

This dataset is released under the [CC-BY-4.0](https://creativecommons.org/licenses/by/4.0/) license.

## Citation

If you use this dataset, please cite:

```bibtex
@dataset{seera_events_2024,
  title={Seera Events Dataset: Multilingual Timeline of Prophet Muhammad's Life},
  author={Must Know Islam},
  year={2024},
  publisher={Hugging Face},
  url={https://huggingface.co/datasets/mustknowislam/seera_events}
}
```

## Related Projects

- [Must Know Islam](https://mustknowislam.com) - Islamic educational platform
