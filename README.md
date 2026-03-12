# 1320: A New Era 🏁

A modern drag-racing game inspired by Nitto 1320 Legends. Build your garage, tune your car, and race through tournaments to become the ultimate Street King.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS, Shadcn/Radix UI, HTML5 Canvas |
| Backend | FastAPI (Python), Motor (async MongoDB driver) |
| Database | MongoDB |
| Deployment | Emergent cloud platform |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 20+ and Yarn
- MongoDB (local or remote)

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
cp .env.example .env
# Edit .env and set MONGODB_URL to your MongoDB connection string
```

Start the backend server:

```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive API docs: `http://localhost:8000/docs`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
yarn install

# Create environment file
cp .env.example .env.local
# Edit .env.local and set REACT_APP_BACKEND_URL=http://localhost:8000
```

Start the development server:

```bash
yarn start
```

The app will open at `http://localhost:3000`.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/player/create` | Create a new player (starts with $20,000) |
| GET | `/api/player/{id}` | Get player data |
| GET | `/api/cars/catalog` | List all purchasable cars (17 models) |
| GET | `/api/cars/player/{id}` | Get a player's garage |
| POST | `/api/cars/buy` | Purchase a car |
| POST | `/api/cars/upgrade` | Upgrade a car part |
| GET | `/api/parts/catalog` | List all upgrade parts and tiers |
| GET | `/api/tournaments` | List available tournaments |
| POST | `/api/race/result` | Record a race result |
| GET | `/api/health` | Health check |

---

## Game Features

- **17 playable cars** across 8 categories: compact, JDM, muscle, truck, SUV, euro, exotic, electric
- **10 upgrade categories** with 3 tiers each (eBay → RockAuto → Performance)
- **Race engine** with physics-based quarter-mile simulation (reaction time, traction, shift quality)
- **3 tournament tiers**: Street League (easy), Underground Circuit (medium), Elite Championship (hard)
- **Boss races** with progressively harder AI opponents
- **Persistent garage** — cars and upgrades saved to MongoDB

---

## Project Structure

```
1320-A-New-era/
├── backend/
│   ├── server.py              # FastAPI application
│   ├── game_data.py           # Car catalog, parts catalog, tournaments
│   ├── race_engine.py         # Quarter-mile physics simulation
│   ├── ai_system.py           # AI opponent leveling system
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.js             # Root component, GameContext, routing
│   │   ├── pages/             # Game screens (Garage, Dealership, Race, etc.)
│   │   ├── components/ui/     # Shadcn/Radix UI components
│   │   └── hooks/
│   ├── package.json
│   └── tailwind.config.js
├── docs/                      # Design documents and wireframes
└── README.md
```

---

## Running Tests

```bash
# Backend API integration tests (requires a running server)
python backend_test.py

# Frontend tests
cd frontend && yarn test
```

---

## Environment Variables

**Backend** (`backend/.env`):

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URL` | `mongodb://localhost:27017` | MongoDB connection string |
| `DATABASE_NAME` | `turbo_showdown` | Database name |

**Frontend** (`frontend/.env.local`):

| Variable | Description |
|---|---|
| `REACT_APP_BACKEND_URL` | Backend server URL, e.g. `http://localhost:8000` |
