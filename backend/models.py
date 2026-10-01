from pydantic import BaseModel
from typing import List, Optional

class Page(BaseModel):
    id: str
    url: str
    title: Optional[str] = None
    depth: int = 0
    status: str = "success"
    content_available: bool = True

class Link(BaseModel):
    id: str
    url: str
    source: str
    target: str
    type: str = "internal"

class Crawl(BaseModel):
    id: str
    target_url: str
    status: str = "completed"
    strategy: str
    max_depth: int
    max_pages: int
    pages_crawled: int = 0
    pages: List[Page] = []
    links: List[Link] = []