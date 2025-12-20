import time

from google import genai
from google.genai import types

from .config import MAX_RETRIES, RETRY_DELAY
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


class GeminiLocationExtractor:
    def __init__(self, api_key: str, model_name: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    def extract_location(self, title: str, details: str) -> str | None:
        """Extract location from event details with retry logic."""
        prompt = USER_PROMPT_TEMPLATE.format(title=title, details=details)

        for attempt in range(MAX_RETRIES):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.1,
                        max_output_tokens=100,
                    ),
                )
                location = response.text.strip()
                location = location.strip("\"'").strip()
                return location if location else "غير محدد"

            except Exception as e:
                print(f"  Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)

        return None
