from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from typing import Dict

from crawler import run_crawl, CrawlerSettings
from models import Crawl, Page, Link
from data import save_crawl, load_crawl


app = FastAPI(
    title="Web Trace API",
    version="1.0.0"
)


crawl_progress: Dict[str, dict] = {}


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
    strategy: str = "BFS"
    include_external: bool = False
    keywords: list[str] = []
    verbose: bool = False


@app.get("/")
def root():
    return {
        "message": "Welcome to the Web Trace API! API is running successfully."
    }


def run_background_crawl(
    crawl_id: str,
    request: CrawlRequest
):
    """Runs the crawl in the background."""

    settings = CrawlerSettings(
        url=request.url,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        strategy=request.strategy,
        include_external=request.include_external,
        keywords=request.keywords,
        verbose=request.verbose
    )

    def update_progress(
        current_pages,
        max_pages,
        url
    ):
        crawl_progress[crawl_id] = {
            "current": current_pages,
            "max_pages": max_pages,
            "url": url,
            "status": "crawling"
        }

        print(
            f"[PROGRESS] {current_pages}/{max_pages} - {url}"
        )

    try:
        pages_data = run_crawl(
            settings,
            update_progress
        )

        pages = []
        url_to_page_id = {}

        # Build page objects
        for index, page in enumerate(
            pages_data,
            start=1
        ):
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
                    status=(
                        "success"
                        if page.get("success", True)
                        else "failed"
                    ),
                    content_available=bool(
                        page.get("markdown")
                    )
                )
            )

        links = []

        # Build link relationships
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

            for link_data in internal_links:

                target_url = link_data.get("href")

                if not target_url:
                    continue

                target_id = url_to_page_id.get(target_url)

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

        # Create complete crawl object
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

        # Save crawl to JSON
        save_crawl(crawl)

        # Mark crawl as completed
        crawl_progress[crawl_id] = {
            "current": len(pages),
            "max_pages": request.max_pages,
            "url": request.url,
            "status": "completed"
        }

        print(
            f"[COMPLETE] {crawl_id} "
            f"({len(pages)} pages)"
        )

    except Exception as error:

        crawl_progress[crawl_id] = {
            "current": 0,
            "max_pages": request.max_pages,
            "url": request.url,
            "status": "failed",
            "error": str(error)
        }

        print(
            f"[ERROR] Crawl {crawl_id} failed: {error}"
        )


@app.post("/api/crawls")
def create_crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks
):
    """Starts a crawl in the background."""

    crawl_id = f"crawl_{uuid4().hex}"

    # Initial crawl status
    crawl_progress[crawl_id] = {
        "current": 0,
        "max_pages": request.max_pages,
        "url": request.url,
        "status": "pending"
    }

    # Start crawl in background
    background_tasks.add_task(
        run_background_crawl,
        crawl_id,
        request
    )

    # Return immediately
    return {
        "id": crawl_id,
        "status": "pending",
        "message": "Crawl started"
    }


@app.get("/api/crawls/{crawl_id}/progress")
def get_crawl_progress(crawl_id: str):
    """Returns the current progress of a crawl."""

    progress = crawl_progress.get(crawl_id)

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Crawl progress not found"
        )

    return {
        "crawl_id": crawl_id,
        **progress
    }


@app.get("/api/crawls/{crawl_id}")
def get_crawl(crawl_id: str):
    """Returns the complete crawl data."""

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