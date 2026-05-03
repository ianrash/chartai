import json
import re
import os
import io
import google.generativeai as genai
from PIL import Image
from prompt_template import SYSTEM_PROMPT

# Configure Gemini with the API key from environment
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

# Use gemini-1.5-flash for fast multimodal tasks
# Set temperature to 0 for deterministic output
generation_config = {
    "temperature": 0.0,
    "top_p": 0.95,
    "top_k": 40,
    "max_output_tokens": 8192,
}

model = genai.GenerativeModel('gemini-flash-latest', generation_config=generation_config)


def extract_json(text: str) -> dict:
    """Extract JSON from the model response with robust error handling."""
    text = text.strip()
    
    # Remove markdown code blocks if present
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
        text = text.strip()
    
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        pass
    
    # Try to find JSON block with balanced braces
    try:
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
            return json.loads(json_str)
    except (json.JSONDecodeError, ValueError):
        pass
    
    # Try to fix common issues and retry
    try:
        fixed = text
        # Remove trailing commas before } or ]
        fixed = re.sub(r",\s*}", "}", fixed)
        fixed = re.sub(r",\s*]", "]", fixed)
        # Fix unquoted keys that are simple words (only if not already quoted)
        fixed = re.sub(r'(?<!")(\w+):(?!")', r'"\1":', fixed)
        # Replace remaining placeholders with null
        fixed = re.sub(r'<[^>]+>', 'null', fixed)
        return json.loads(fixed)
    except Exception as e:
        # Last resort: try to fix literal \n sequences in string values
        try:
            fixed2 = text.replace('\\n', '\n')
            return json.loads(fixed2)
        except Exception as e2:
            raise ValueError(f"Failed to parse JSON: {e2}\nSample: {text[:500]!r}")


async def analyze_images(charts_data: list[dict], symbol: str = "Unknown", sessionDate: str = "Unknown") -> dict:
    """
    Send multiple images to Gemini vision and return structured analysis.
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