from fastapi import (
    FastAPI,
    HTTPException,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from pydantic import BaseModel, Field

from uuid import uuid4
from typing import Dict
from io import BytesIO
from zipfile import ZipFile, ZIP_DEFLATED

import re

from crawler import (
    run_crawl,
    CrawlerSettings,
)

from models import (
    Crawl,
    Page,
    Link,
)

from data import (
    save_crawl,
    load_crawl,
)


app = FastAPI(
    title="Web Trace API",
    version="1.0.0"
)


crawl_progress: Dict[str, dict] = {}

crawl_live_data: Dict[str, dict] = {}


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173"
    ],
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

    keywords: list[str] = Field(
        default_factory=list
    )

    verbose: bool = False


@app.get("/")
def root():
    return {
        "message":
            "Welcome to the Web Trace API! "
            "API is running successfully."
    }


def build_live_graph(
    crawl_id: str,
    page_data: dict
):
    live = crawl_live_data[crawl_id]

    pages_data = live["pages_data"]

    pages_data.append(page_data)

    pages = []

    url_to_page_id = {}

    for index, page in enumerate(
        pages_data,
        start=1
    ):

        page_id = (
            f"page_{index:03d}"
        )

        page_url = page.get(
            "url",
            ""
        )

        title = (
            page.get("title")
            or "Untitled Page"
        )

        url_to_page_id[
            page_url
        ] = page_id

        pages.append(
            Page(
                id=page_id,
                url=page_url,
                title=title,
                depth=page.get(
                    "depth",
                    0
                ),
                status=(
                    "success"
                    if page.get(
                        "success",
                        True
                    )
                    else "failed"
                ),
                content_available=bool(
                    page.get("markdown")
                ),
                markdown=page.get(
                    "markdown"
                ),
            )
        )

    links = []

    for source_page in pages_data:

        source_url = source_page.get(
            "url"
        )

        source_id = (
            url_to_page_id.get(
                source_url
            )
        )

        if not source_id:
            continue

        source_links = (
            source_page.get(
                "links",
                {}
            )
        )

        for link_type in [
            "internal",
            "external"
        ]:

            link_items = (
                source_links.get(
                    link_type,
                    []
                )
                or []
            )

            for link_data in link_items:

                target_url = (
                    link_data.get(
                        "href"
                    )
                )

                if not target_url:
                    continue

                target_id = (
                    url_to_page_id.get(
                        target_url
                    )
                )

                if target_id:

                    links.append(
                        Link(
                            id=(
                                f"link_"
                                f"{len(links) + 1:03d}"
                            ),
                            url=target_url,
                            source=source_id,
                            target=target_id,
                            type=link_type,
                        )
                    )

    live["pages"] = pages

    live["links"] = links

    live["graph"] = {
        "crawl_id": crawl_id,

        "nodes": [
            {
                "id": page.id,
                "label": (
                    page.title
                    or page.url
                ),
                "url": page.url,
                "depth": page.depth,
                "status": page.status,
            }
            for page in pages
        ],

        "edges": [
            {
                "id": link.id,
                "source": link.source,
                "target": link.target,
                "type": link.type,
            }
            for link in links
        ],
    }


def run_background_crawl(
    crawl_id: str,
    request: CrawlRequest
):

    settings = CrawlerSettings(
        url=request.url,
        max_depth=request.max_depth,
        max_pages=request.max_pages,
        strategy=request.strategy,
        include_external=request.include_external,
        keywords=request.keywords,
        verbose=request.verbose,
    )

    crawl_live_data[crawl_id] = {
        "pages_data": [],
        "pages": [],
        "links": [],
        "graph": {
            "crawl_id": crawl_id,
            "nodes": [],
            "edges": [],
        },
    }

    def update_progress(
        current_pages,
        max_pages,
        url,
        page_data=None,
    ):

        # Defensive progress cap.
        current_pages = min(
            current_pages,
            max_pages
        )

        crawl_progress[crawl_id] = {
            "current": current_pages,
            "max_pages": max_pages,
            "url": url,
            "status": "crawling",
        }

        if page_data:
            build_live_graph(
                crawl_id,
                page_data
            )

        print(
            f"[PROGRESS] "
            f"{current_pages}/{max_pages} - {url}"
        )

    try:

        pages_data = run_crawl(
            settings,
            update_progress
        )

        # --------------------------------------------------
        # Final defensive safety limit.
        # Even if the crawler somehow returns extra results,
        # never persist more than the requested number.
        # --------------------------------------------------

        pages_data = pages_data[
            :request.max_pages
        ]

        live = crawl_live_data[
            crawl_id
        ]

        # Clear live data before final rebuild.
        live["pages_data"] = []

        live["pages"] = []

        live["links"] = []

        # Rebuild the final graph from the capped list.
        for page_data in pages_data:

            build_live_graph(
                crawl_id,
                page_data
            )

        pages = live["pages"]

        links = live["links"]

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

        crawl_progress[crawl_id] = {
            "current": len(pages),
            "max_pages": request.max_pages,
            "url": request.url,
            "status": "completed",
        }

        print(
            f"[COMPLETE] "
            f"{crawl_id} "
            f"({len(pages)} pages)"
        )

    except Exception as error:

        crawl_progress[crawl_id] = {
            "current": 0,
            "max_pages": request.max_pages,
            "url": request.url,
            "status": "failed",
            "error": str(error),
        }

        print(
            f"[ERROR] "
            f"Crawl {crawl_id} failed: "
            f"{error}"
        )


@app.post("/api/crawls")
def create_crawl(
    request: CrawlRequest,
    background_tasks: BackgroundTasks
):

    if request.max_pages <= 0:
        raise HTTPException(
            status_code=400,
            detail="max_pages must be greater than 0."
        )

    if request.max_depth < 0:
        raise HTTPException(
            status_code=400,
            detail="max_depth cannot be negative."
        )

    crawl_id = (
        f"crawl_{uuid4().hex}"
    )

    crawl_progress[crawl_id] = {
        "current": 0,
        "max_pages": request.max_pages,
        "url": request.url,
        "status": "pending",
    }

    crawl_live_data[crawl_id] = {
        "pages_data": [],
        "pages": [],
        "links": [],
        "graph": {
            "crawl_id": crawl_id,
            "nodes": [],
            "edges": [],
        },
    }

    background_tasks.add_task(
        run_background_crawl,
        crawl_id,
        request
    )

    return {
        "id": crawl_id,
        "status": "pending",
        "message": "Crawl started",
    }


@app.get(
    "/api/crawls/{crawl_id}/progress"
)
def get_crawl_progress(
    crawl_id: str
):

    progress = crawl_progress.get(
        crawl_id
    )

    if not progress:
        raise HTTPException(
            status_code=404,
            detail="Crawl progress not found"
        )

    return {
        "crawl_id": crawl_id,
        **progress,
    }


@app.get("/api/crawls/{crawl_id}")
def get_crawl(
    crawl_id: str
):

    try:

        crawl = load_crawl(
            crawl_id
        )

    except FileNotFoundError:

        raise HTTPException(
            status_code=404,
            detail="Crawl not found"
        )

    return crawl


@app.get(
    "/api/crawls/{crawl_id}/graph"
)
def get_crawl_graph(
    crawl_id: str
):

    live = crawl_live_data.get(
        crawl_id
    )

    if live:
        return live["graph"]

    try:

        crawl = load_crawl(
            crawl_id
        )

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
                "label": (
                    page.title
                    or page.url
                ),
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


@app.get(
    "/api/crawls/{crawl_id}/download"
)
def download_crawl(
    crawl_id: str
):

    try:

        crawl = load_crawl(
            crawl_id
        )

    except FileNotFoundError:

        raise HTTPException(
            status_code=404,
            detail="Crawl not found"
        )

    zip_buffer = BytesIO()

    with ZipFile(
        zip_buffer,
        "w",
        ZIP_DEFLATED
    ) as zip_file:

        zip_file.writestr(
            "crawl.json",
            crawl.model_dump_json(
                indent=2
            )
        )

        for page in crawl.pages:

            safe_title = re.sub(
                r"[^a-zA-Z0-9_-]",
                "_",
                page.title
                or "Untitled_Page"
            )

            filename = (
                f"pages/"
                f"{page.id}_"
                f"{safe_title}.md"
            )

            markdown = (
                getattr(
                    page,
                    "markdown",
                    None
                )
                or ""
            )

            zip_file.writestr(
                filename,
                markdown
            )

    zip_buffer.seek(0)

    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={
            "Content-Disposition":
                f'attachment; '
                f'filename='
                f'"web_trace_'
                f'{crawl_id}.zip"'
        },
    )