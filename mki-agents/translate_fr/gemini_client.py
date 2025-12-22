import time

from google import genai
from google.genai import types

from .config import MAX_RETRIES, RETRY_DELAY
from .prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE


class GeminiFrenchTranslator:
    def __init__(self, api_key: str, model_name: str):
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name

    def translate_text(self, text: str) -> str | None:
        """Translate Arabic text to French with retry logic."""
        if not text or not text.strip():
            return text

        prompt = USER_PROMPT_TEMPLATE.format(text=text)

        for attempt in range(MAX_RETRIES):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=SYSTEM_PROMPT,
                        temperature=0.3,
                        max_output_tokens=4096,
                    ),
                )
                translation = response.text.strip()
                return translation if translation else text

            except Exception as e:
                print(f"  Attempt {attempt + 1}/{MAX_RETRIES} failed: {e}")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(RETRY_DELAY)

        return None
