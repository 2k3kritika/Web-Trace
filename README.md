# Web Trace

Web Trace is a full-stack web crawling and data extraction platform that crawls websites from a seed URL, extracts page and link information, tracks crawl progress, and visualizes the discovered website structure through a React interface.

## Features

- Crawl websites starting from a seed URL
- Configurable maximum crawl depth
- Configurable maximum number of pages
- BFS crawling strategy
- Extract page URLs, titles, links, and page content
- Track crawl progress in real time
- Store crawl and page data during execution
- Retrieve crawl results through REST APIs
- Visualize the discovered website structure in the frontend
- Option to control whether external links are included
- React-based web interface for starting and monitoring crawls

## Tech Stack

- **Backend:** Python, FastAPI
- **Crawler:** Crawl4AI
- **Frontend:** React, JavaScript
- **API:** REST API
- **Development Server:** Uvicorn
- **Version Control:** Git

## Project Structure

```text
Web_Trace/
│
├── backend/
│   ├── main.py
│   └── crawler.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── ...
│
└── README.md
```

## Requirements

Make sure the following are installed:

- Python 3.10+
- Node.js and npm
- Git

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd Web_Trace
```

### 2. Set up the Python environment

Navigate to the backend:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

If Crawl4AI requires its browser setup on a fresh installation, run its browser installation command according to the installed Crawl4AI version.

### 3. Install frontend dependencies

Open another terminal and navigate to the frontend:

```powershell
cd frontend
npm install
```

## Running the Application

Web Trace uses two development servers:

- FastAPI backend
- React frontend

### Start the Backend

From the `backend` directory:

```powershell
uvicorn main:app --reload
```

The backend will run at:

```text
http://127.0.0.1:8000
```

FastAPI's interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

### Start the Frontend

Open a second terminal and navigate to:

```text
Web_Trace/frontend
```

Run:

```powershell
npm run dev
```

Open the URL shown by Vite in the terminal, usually:

```text
http://localhost:5173
```

## How to Use Web Trace

### 1. Enter a Seed URL

Open the Web Trace frontend and enter the website URL you want to crawl.

Example:

```text
https://github.com/
```

### 2. Configure the Crawl

Set the crawl parameters:

- **Maximum Depth:** Maximum number of link levels to follow
- **Maximum Pages:** Maximum number of pages to crawl
- **Strategy:** Crawling strategy such as BFS
- **Include External Links:** Whether links pointing outside the target website should be considered

For example:

```text
URL: https://example.com
Maximum Depth: 2
Maximum Pages: 10
Strategy: BFS
Include External Links: No
```

### 3. Start the Crawl

Click the crawl/start button.

The frontend sends the crawl configuration to the FastAPI backend.

The backend creates a crawl task and starts the crawler.

### 4. Monitor Crawl Progress

While the crawler is running, the frontend requests the crawl's progress from the backend.

The progress information allows the interface to display the current crawl state and discovered pages.

### 5. Crawl and Extract Data

Crawl4AI visits the selected pages according to the configured limits and strategy.

For each successfully processed page, Web Trace collects information such as:

- Page URL
- Page title
- Links discovered on the page
- Page content
- Crawl depth
- Page relationships

The crawler continues until the configured page/depth limits are reached or there are no more eligible pages to visit.

### 6. View the Website Structure

After crawling, the collected page and link information is retrieved by the frontend.

The React interface uses this data to build a visual representation of the discovered website structure, allowing pages and their relationships to be explored more easily.

## Application Workflow

```text
                    User
                      │
                      ▼
             React Frontend
                      │
          Crawl Configuration
                      │
                      ▼
              FastAPI Backend
                      │
              Start Crawl Task
                      │
                      ▼
              Web Trace Crawler
                      │
                      ▼
                 Crawl4AI
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
      Fetch Pages            Extract Links
          │                       │
          └───────────┬───────────┘
                      ▼
              Crawl / Page Data
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
     Progress API             Graph API
          │                       │
          └───────────┬───────────┘
                      ▼
              React Frontend
                      │
                      ▼
          Website Structure View
```

## API Endpoints

### Start a Crawl

```http
POST /api/crawls
```

Starts a new crawl using the supplied configuration.

Example request:

```json
{
  "url": "https://example.com",
  "max_depth": 2,
  "max_pages": 10,
  "strategy": "BFS",
  "include_external": false,
  "keywords": [],
  "verbose": false
}
```

### Check Crawl Progress

```http
GET /api/crawls/{crawl_id}/progress
```

Returns the current status and progress information for a crawl.

### Retrieve Crawl Graph

```http
GET /api/crawls/{crawl_id}/graph
```

Returns the collected page and link relationships used by the frontend to build the website structure visualization.

## Crawling Strategy

Web Trace currently uses **Breadth-First Search (BFS)** for crawling.

For example, if the starting page contains links to several pages:

```text
             Root
          /    |    \
        A      B      C
       / \    / \      \
      D   E  F   G      H
```

BFS processes pages level by level:

```text
Root → A → B → C → D → E → F → G → H
```

The maximum depth and maximum page settings prevent the crawler from continuing indefinitely.

## Example Workflow

A typical Web Trace session looks like this:

```text
1. Start Web Trace
        ↓
2. Enter target website
        ↓
3. Set maximum depth
        ↓
4. Set maximum page limit
        ↓
5. Select crawling strategy
        ↓
6. Start crawl
        ↓
7. Backend launches crawler
        ↓
8. Pages and links are discovered
        ↓
9. Progress is reported to frontend
        ↓
10. Crawl completes
        ↓
11. Crawled data is retrieved
        ↓
12. Website structure is visualized
```

## Notes

- Web Trace is designed for crawling publicly accessible web content.
- Crawl limits should be configured appropriately for the target website.
- Large or highly connected websites can produce a large number of links and may take longer to process.
- The maximum page limit acts as an upper bound. A crawl may finish before reaching that number if there are no more eligible pages to visit.
- Some websites may restrict automated requests or use technologies that prevent certain pages from being crawled successfully.

## Future Improvements

Potential future improvements include:

- More crawling strategies
- Improved graph layouts and visualization
- Search and filtering of crawled pages
- Better handling of dynamic websites
- Crawl history and result persistence
- Exporting crawl results
- More detailed page metadata and analysis

## Author

Built as a practical full-stack web crawling and data extraction project using Python, FastAPI, Crawl4AI, and React.