# Trip Route Planner & ELD Log Generator

A premium, fully compliant logistics planning web application built using **React + TypeScript + Vite** for the frontend and **Django + Django REST Framework** for the backend. The application plots driving routes, calculates HOS-compliant schedules, and generates daily SVG ELD logs.

## Features
- **Deterministic HOS Scheduling Engine**: Dynamically calculates and inserts required driving breaks (30 mins after 8h driving), rest periods (10h off-duty after 11h driving or 14h shift), and routine fuel stops (every 1000 miles).
- **Interactive Map Visualization**: Draws OSRM-matched driving paths and displays custom colored SVG pins for every stop type.
- **Scalable SVG ELD Logsheets**: Renders midnight-split log graphs for each day of transit.
- **Landscape Print Ready**: Uses CSS print styles to permit seamless landscape logsheet printouts directly from the browser.

---

## Setup and Running

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Run the Backend (Django)
Open a terminal in the project root:

```bash
# Navigate to the backend folder
cd server

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Start the Django development server
python manage.py runserver
```
The API server will run at `http://127.0.0.1:8000/`.

#### Run Backend Unit Tests
To execute the HOS and ELD scheduler test suite, run:
```bash
python manage.py test
```

---

### 2. Run the Frontend (Vite)
Open a new terminal window in the project root:

```bash
# Navigate to the frontend folder
cd client

# Install Node dependencies
npm install

# Start the local development server
npm run dev
```
The application will run at `http://localhost:5173/`. Open it in your web browser.

---

## HOS Rules Configuration
HOS constants can be adjusted in the Django backend settings under `server/services/hos_scheduler.py` in the `HOS_CONFIG` dictionary.
