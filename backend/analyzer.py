import json
import re
import os
import io
import google.generativeai as genai
from PIL import Image
from prompt_template import SYSTEM_PROMPT

# Configure Gemini with the API key from environment
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Use gemini-1.5-flash for fast multimodal tasks (or gemini-1.5-pro for more complex reasoning)
model = genai.GenerativeModel('gemini-flash-latest')


def extract_json(text: str) -> dict:
    """Extract JSON from the model response, stripping any surrounding text."""
    # Try to find JSON block directly
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    raise ValueError(f"No JSON found in response: {text!r}")


async def analyze_images(charts_data: list[dict], symbol: str = "Unknown", sessionDate: str = "Unknown") -> dict:
    """
    Send multiple images to Gemini vision and return structured analysis.

    Args:
        charts_data: List of dicts with keys 'bytes', 'timeframe', 'content_type'
        symbol: Trading pair/asset name
        sessionDate: Session date and time

    Returns:
        dict with keys mapping to the JSON schema.
    """
    context_str = f"Context:\n- Asset/Symbol: {symbol}\n- Current Date/Time: {sessionDate}\n\n"
    prompt_parts = [f"{SYSTEM_PROMPT}\n\n{context_str}Analyze these trading charts."]
    
    for i, chart in enumerate(charts_data):
        img = Image.open(io.BytesIO(chart['bytes']))
        prompt_parts.append(f"Chart {i+1} Timeframe: {chart['timeframe']}")
        prompt_parts.append(img)
    
    # Generate content using Gemini
    response = model.generate_content(prompt_parts)
    
    raw = response.text
    return extract_json(raw)
