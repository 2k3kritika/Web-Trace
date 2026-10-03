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


@dataclass
class CrawlerSettings:
    url: str
    max_depth: int
    max_pages: int
    strategy: str
    include_external: bool
    keywords: List[str]
    verbose: bool


def extract_title(markdown: str, url: str) -> str:
    markdown = markdown or ""

    match = re.search(
        r"^# (.+)",
        markdown,
        re.MULTILINE
    )

    title = (
        match[1].strip()
        if match
        else url.rstrip("/").split("/")[-1]
        or "Untitled_Page"
    )

    return re.sub(
        r"[^a-zA-Z0-9_-]",
        "_",
        title
    )


def build_strategy(settings: CrawlerSettings):
    if settings.strategy == "BFS":
        return BFSDeepCrawlStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
        )

    elif settings.strategy == "DFS":
        return DFSDeepCrawlStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
        )

    elif settings.strategy == "BestFirst":
        scorer = None

        if settings.keywords:
            scorer = KeywordRelevanceScorer(
                keywords=settings.keywords,
                weight=0.7
            )

        return BestFirstCrawlingStrategy(
            max_depth=settings.max_depth,
            include_external=settings.include_external,
            max_pages=settings.max_pages,
            url_scorer=scorer,
        )

    else:
        raise ValueError(
            f"Unknown strategy: {settings.strategy}"
        )


async def crawl_website_async(
    settings: CrawlerSettings,
    progress_cb: Callable,
) -> List[Dict]:

    if settings.max_pages <= 0:
        raise ValueError(
            "max_pages must be greater than 0."
        )

    strategy = build_strategy(settings)

    config = CrawlerRunConfig(
        deep_crawl_strategy=strategy,
        scraping_strategy=LXMLWebScrapingStrategy(),
        page_timeout=15000,
        stream=True,
        verbose=settings.verbose,
    )

    pages = []

    print(
        f"[CRAWLER] Starting crawl: {settings.url}"
    )

    print(
        f"[CRAWLER] Strategy: {settings.strategy}"
    )

    print(
        f"[CRAWLER] Max depth: {settings.max_depth}"
    )

    print(
        f"[CRAWLER] Max pages: {settings.max_pages}"
    )

    print(
        f"[CRAWLER] External links: "
        f"{settings.include_external}"
    )

    async with AsyncWebCrawler() as crawler:
        print(
            "[CRAWLER] Browser initialized."
        )

        results = await crawler.arun(
            settings.url,
            config=config
        )

        print(
            "[CRAWLER] arun() started."
        )

        try:
            async for result in results:

                # Application-level hard limit.
                # Never process more pages than requested.
                if len(pages) >= settings.max_pages:
                    print(
                        f"[CRAWLER] Max page limit reached: "
                        f"{settings.max_pages}. "
                        f"Closing crawl stream."
                    )
                    break

                markdown = result.markdown or ""

                url = (
                    result.url
                    or settings.url
                )

                depth = 0

                if result.metadata:
                    depth = result.metadata.get(
                        "depth",
                        0
                    )

                result_links = (
                    result.links or {}
                )

                internal_links = (
                    result_links.get(
                        "internal",
                        []
                    )
                    or []
                )

                external_links = (
                    result_links.get(
                        "external",
                        []
                    )
                    or []
                )

                links = {
                    "internal": internal_links,
                    "external": external_links,
                }

                page_data = {
                    "url": url,
                    "markdown": markdown,
                    "title": extract_title(
                        markdown,
                        url
                    ),
                    "depth": depth,
                    "status_code": result.status_code,
                    "success": result.success,
                    "links": links,
                }

                pages.append(page_data)

                print(
                    f"[CRAWLER] "
                    f"Page {len(pages)}/"
                    f"{settings.max_pages}"
                )

                print(
                    f"[CRAWLER] URL: {url}"
                )

                print(
                    f"[CRAWLER] Depth: {depth}"
                )

                print(
                    f"[CRAWLER] Status: "
                    f"{result.status_code}"
                )

                print(
                    f"[CRAWLER] Success: "
                    f"{result.success}"
                )

                print(
                    f"[CRAWLER] Internal links found: "
                    f"{len(internal_links)}"
                )

                print(
                    f"[CRAWLER] External links found: "
                    f"{len(external_links)}"
                )

                progress_cb(
                    len(pages),
                    settings.max_pages,
                    url,
                    page_data
                )

                print(
                    f"[CRAWLER] Callback completed "
                    f"for page {len(pages)}."
                )

        finally:
            # Close the async stream if Crawl4AI exposes
            # an async close method.
            if hasattr(results, "aclose"):
                await results.aclose()

    print(
        f"[CRAWLER] Crawl finished. "
        f"Total pages: {len(pages)}"
    )

    return pages


def progress_callback(
    current_pages,
    max_pages,
    url,
    page_data=None
):
    print(
        f"[CRAWL] "
        f"{current_pages}/{max_pages} - {url}"
    )


def run_crawl(
    settings,
    progress_cb
):
    return asyncio.run(
        crawl_website_async(
            settings,
            progress_cb
        )
    )