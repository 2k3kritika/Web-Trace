import json
from pathlib import Path
from models import Crawl

DATA_DIR = Path(__file__).parent / "data" / "crawls"
DATA_DIR.mkdir(parents=True, exist_ok=True)

def save_crawl(crawl: Crawl):
    """Saves the crawl data to a JSON file."""
    file_path = DATA_DIR / f"{crawl.id}.json"
    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(
            crawl.model_dump(), 
            file, 
            ensure_ascii=False, 
            indent=2
            )


def load_crawl(crawl_id: str) -> Crawl:
    """Loads the crawl data from a JSON file."""
    file_path = DATA_DIR / f"{crawl_id}.json"
    if not file_path.exists():
        raise FileNotFoundError(f"No crawl found with ID: {crawl_id}")
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)
        return Crawl.model_validate(data)