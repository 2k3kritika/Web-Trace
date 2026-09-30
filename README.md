# Web Trace - Web Crawler

**Web Trace** is a lightweight web crawling engine built with **Streamlit** and **crawl4ai** for exploring websites, extracting page content, and visualizing how pages are connected.

The idea is simple: **give it a URL, trace the website, understand its structure, and extract what matters.**

## Features

- **Configurable Crawling**: Set target URL, crawl depth, and page limits.
- **BFS / DFS / Best-First**: Choose how the crawler explores the site.
- **Crawl Graph**: Visualize connections between discovered pages.
- **External Link Control**: Include or ignore external links.
- **Keyword Relevance**: Best-First crawling can prioritize keyword-relevant pages.
- **Live Progress**: Monitor the crawl as it runs.
- **Content Extraction**: Collect content from discovered pages.
- **Export**: Download results as Markdown or ZIP.
- **Page Preview**: Quickly inspect crawled content.

## How It Works

```text
             Target URL
                 │
                 ▼
          ┌─────────────┐
          │ Crawl Engine│
          └──────┬──────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
       BFS      DFS   Best-First
        │        │        │
        └────────┼────────┘
                 ▼
          Discover Pages
                 │
          ┌──────┴──────┐
          ▼             ▼
     Crawl Graph    Extract Content
                          │
                    ┌─────┴─────┐
                    ▼           ▼
                Markdown       ZIP
```

Web Trace treats a website as a **connected structure rather than just a list of URLs**, making it easier to see how pages lead to one another.

## Installation

1. **Clone the repository**:

```bash
git clone https://github.com/2k3kritika/Web-Trace.git
cd Web_Trace
```

*(Replace the repository URL with the actual URL if hosted elsewhere.)*

2. **Install dependencies**:

```bash
pip install streamlit crawl4ai
```

3. **Set up `crawl4ai`**:

```bash
crawl4ai-setup
```

## Usage

1. **Run the application**:

```bash
streamlit run app.py
```

2. Open the Streamlit interface, usually available at:

```text
http://localhost:8501
```

3. Enter the target URL, configure the crawl settings, select a strategy, and click **Start Crawling**.

4. Once the crawl finishes, explore the **crawl graph**, preview extracted content, or export the results as Markdown/ZIP.

## Crawl Strategies

| Strategy       | Purpose                               |
|----------------|---------------------------------------|
| **BFS**        | Explore pages level-by-level          |
| **DFS**        | Follow paths as deeply as possible    |
| **Best-First** | Prioritize pages by keyword relevance |

## Project Idea

**Web Trace** is built as a practical foundation for website intelligence and reconnaissance workflows, with the focus on both **content extraction and understanding the structure behind a website.**