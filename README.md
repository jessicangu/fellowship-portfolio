# Jessica Nguyen Portfolio


## Tech Stack

- **Backend:** Flask, Jinja2
- **Frontend:** HTML, CSS, TypeScript
- **Build:** TypeScript compiled to `app/static/scripts/portfolio.js`

## Getting Started

### Prerequisites

- Python 3
- Node.js (for TypeScript compilation)

### Installation

Create and activate a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate   # macOS/Linux
.venv\Scripts\activate      # Windows
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Install Node dependencies and compile TypeScript:

```bash
npm install
npm run build
```

### Running Locally

```bash
# macOS/Linux
export FLASK_APP=app
export FLASK_DEBUG=1
flask run

# Windows (PowerShell)
$env:FLASK_APP="app"
$env:FLASK_DEBUG="1"
py -m flask run
```

Open [http://127.0.0.1:5000](http://127.0.0.1:5000) in your browser.

### Development

Watch TypeScript for changes:

```bash
npm run watch
```


```
```





