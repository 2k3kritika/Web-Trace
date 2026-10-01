from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from crawler import run_crawl, CrawlerSettings
from models import Crawl, Page, Link
from data import save_crawl, load_crawl

app = FastAPI(
    title="Web Trace API",          
    version="1.0.0"
    )

class CrawlRequest(BaseModel):
    url: str
    max_depth: int
    max_pages: int
    strategy: str =  "BFS"
    include_external: bool = False
    keywords: list[str] = []
    verbose: bool = False

@app.get("/")
def root():
    return {"message": "Welcome to the Web Trace API! API is running successfully."}

@app.post("/api/crawls")
def create_crawl(request: CrawlRequest):
    """Initiates a new crawl based on the provided settings."""
    crawl_id = f"crawl_{uuid4().hex}"  # Generate a unique crawl ID

    settings = CrawlerSettings(
        url=request.url,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        strategy=request.strategy,
        include_external=request.include_external,
        keywords=request.keywords,
        verbose=request.verbose
    )
    
    pages_data = run_crawl(settings)  # Run the crawl synchronously
    pages = []

    for index, page in enumerate(pages_data, start = 1):
        title = page.get("title") or page.get("url").rstrip("/").split("/")[-1] or "Untitled_Page"
        pages.append(
            Page(
            id=f"page_{index:03d}",
            url=page.get("url"),
            depth=0,
            status="success",
            content_available=bool(page["markdown"]),
            )
        )

    crawl = Crawl(
        id = crawl_id,
        target_url = request.url,
        strategy=request.strategy,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        pages_crawled=len(pages),
        pages = pages,
        links = [],
              )

    save_crawl(crawl)  # Save the crawl data to a JSON file
    return crawl

@app.get("/api/crawls/{crawl_id}")
def get_crawl(crawl_id: str):
    crawl = load_crawl(crawl_id)
    if crawl is None:
        raise HTTPException(
            status_code = 404,
            detail = "Crawl not found"
        )
    return crawl