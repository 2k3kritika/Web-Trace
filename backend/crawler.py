import asyncio
import re
from dataclasses import dataclass
from typing import List, Dict, Callable

from crawl4ai import AsyncWebCrawler, CrawlerRunConfig
from crawl4ai.deep_crawling import (
    BFSDeepCrawlStrategy,
    DFSDeepCrawlStrategy,
    BestFirstCrawlingStrategy,
)
from crawl4ai.deep_crawling.scorers import KeywordRelevanceScorer
from crawl4ai.content_scraping_strategy import LXMLWebScrapingStrategy

################################ Data & Strategy ################################
@dataclass
class CrawlerSettings:
    """Holds all the user-configurable settings for the crawler."""

    url: str
    max_depth: int
    max_pages: int
    strategy: str
    include_external: bool
    keywords: List[str]
    verbose: bool


def extract_title(markdown: str, url: str) -> str:
    """Extracts a title from markdown H1, falling back to the URL slug."""
    
    #some crawl results may have no markdown content.
    markdown = markdown or ""
    
    # Find the first H1 header in the markdown content.
    match = re.search(r"^# (.+)", markdown, re.MULTILINE)

    # Use H1 as title, otherwise fallback to the URL's last segment.
    title = (
        match[1].strip() 
        if match 
        else url.rstrip("/").split("/")[-1] or "Untitled_Page"
    )

    # Sanitize the title to be a valid filename.
    return re.sub(r"[^a-zA-Z0-9_-]", "_", title)


def build_strategy(settings: CrawlerSettings):
    """Constructs the appropriate crawl strategy based on user settings."""
    if settings.strategy == "BFS":
        return BFSDeepCrawlStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
        )
    elif settings.strategy == "BestFirst":
        # Create a scorer only if keywords are provided.
        scorer = (
            KeywordRelevanceScorer(keywords=settings.keywords, weight=0.7)
            if settings.keywords
            else None
        )
        return BestFirstCrawlingStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
            url_scorer=scorer,  # Prioritize pages with relevant keywords
        )
    elif settings.strategy == "DFS":
        return DFSDeepCrawlStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
        )
    else:
        raise ValueError(f"Unknown strategy: {settings.strategy}")


async def crawl_website_async(
    settings: CrawlerSettings,
    progress_cb: Callable[[int, int, str], None],
) -> List[Dict]:
    """Asynchronously crawls a website and returns structured page data."""

    config = CrawlerRunConfig(
        deep_crawl_strategy=build_strategy(settings),
        scraping_strategy=LXMLWebScrapingStrategy(),
        verbose=settings.verbose,
        stream=True,
    )

    pages = []

    async with AsyncWebCrawler() as crawler:

        async for result in await crawler.arun(
            settings.url,
            config=config
        ):

            markdown = result.markdown or ""
            url = result.url or settings.url

            # Crawl4AI provides depth through result.metadata
            depth = 0
            if result.metadata:
                depth = result.metadata.get("depth", 0)

            # Extract links discovered on this page
            links = {
                "internal": result.links.get("internal", []),
                "external": result.links.get("external", []),
            }

            pages.append(
                {
                    "url": url,
                    "markdown": markdown,
                    "title": extract_title(markdown, url),
                    "depth": depth,
                    "status_code": result.status_code,
                    "success": result.success,
                    "links": links,
                }
            )

            progress_cb(
                len(pages),
                settings.max_pages,
                url
            )

    return pages


def progress_callback(current_pages, max_pages, url):
    print(f"[CRAWL] {current_pages}/{max_pages} - {url}")


def run_crawl(settings):
    return asyncio.run(
        crawl_website_async(settings, progress_callback)
    )

def progress_callback(current_pages, max_pages, url):
    print(f"[CRAWL] {current_pages}/{max_pages} - {url}")

def run_crawl(settings):
    return asyncio.run(
        crawl_website_async(settings, progress_callback)
    )