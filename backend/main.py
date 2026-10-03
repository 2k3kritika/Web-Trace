from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from uuid import uuid4
from crawler import run_crawl, CrawlerSettings
from models import Crawl, Page, Link
from data import save_crawl, load_crawl
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Web Trace API",          
    version="1.0.0"
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    crawl_id = f"crawl_{uuid4().hex}"

    settings = CrawlerSettings(
        url=request.url,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        strategy=request.strategy,
        include_external=request.include_external,
        keywords=request.keywords,
        verbose=request.verbose
    )

    pages_data = run_crawl(settings)

    pages = []
    url_to_page_id = {}

    # -----------------------------------------
    # Create page nodes
    # -----------------------------------------

    for index, page in enumerate(pages_data, start=1):

        page_id = f"page_{index:03d}"

        page_url = page.get("url", "")
        title = page.get("title") or "Untitled Page"

        url_to_page_id[page_url] = page_id

        pages.append(
            Page(
                id=page_id,
                url=page_url,
                title=title,
                depth=page.get("depth", 0),
                status="success" if page.get("success", True) else "failed",
                content_available=bool(page.get("markdown"))
            )
        )

    # -----------------------------------------
    # Create graph edges
    # -----------------------------------------

    links = []

    for page_data in pages_data:

        source_url = page_data.get("url")

        source_id = url_to_page_id.get(source_url)

        if not source_id:
            continue

        internal_links = page_data.get(
            "links",
            {}
        ).get(
            "internal",
            []
        )

        for link_index, link_data in enumerate(
            internal_links,
            start=1
        ):

            target_url = link_data.get("href")

            if not target_url:
                continue

            target_id = url_to_page_id.get(target_url)

            # Only create an edge if the target was actually crawled.
            if target_id:

                links.append(
                    Link(
                        id=f"link_{len(links) + 1:03d}",
                        url=target_url,
                        source=source_id,
                        target=target_id,
                        type="internal"
                    )
                )

    # -----------------------------------------
    # Build crawl object
    # -----------------------------------------

    crawl = Crawl(
        id=crawl_id,
        target_url=request.url,
        strategy=request.strategy,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        pages_crawled=len(pages),
        pages=pages,
        links=links,
    )

    save_crawl(crawl)

    return crawl
@app.get("/api/crawls/{crawl_id}")
def get_crawl(crawl_id: str):

    try:
        crawl = load_crawl(crawl_id)

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Crawl not found"
        )

    return crawl

@app.get("/api/crawls/{crawl_id}/graph")
def get_crawl_graph(crawl_id: str):

    try:
        crawl = load_crawl(crawl_id)

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Crawl not found"
        )

    nodes = []

    for page in crawl.pages:
        nodes.append(
            {
                "id": page.id,
                "label": page.title or page.url,
                "url": page.url,
                "depth": page.depth,
                "status": page.status,
            }
        )

    edges = []

    for link in crawl.links:
        edges.append(
            {
                "id": link.id,
                "source": link.source,
                "target": link.target,
                "type": link.type,
            }
        )

    return {
        "crawl_id": crawl.id,
        "nodes": nodes,
        "edges": edges,
    }

@app.get("/api/crawls/{crawl_id}/graph")
def get_crawl_graph(crawl_id: str):
    """Returns crawl data formatted for the React graph."""

    try:
        crawl = load_crawl(crawl_id)

    except FileNotFoundError:
        raise HTTPException(
            status_code=404,
            detail="Crawl not found"
        )

    nodes = []

    for page in crawl.pages:
        nodes.append(
            {
                "id": page.id,
                "label": page.title or page.url,
                "url": page.url,
                "depth": page.depth,
                "status": page.status
            }
        )

    edges = []

    for link in crawl.links:
        edges.append(
            {
                "id": link.id,
                "source": link.source,
                "target": link.target,
                "type": link.type
            }
        )

    return {
        "crawl_id": crawl.id,
        "nodes": nodes,
        "edges": edges
    }