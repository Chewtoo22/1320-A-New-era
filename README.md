# 1320: A New Era

A web-based drag racing game inspired by the classic Nitto 1320 Legends flash game — rebuilt with modern vehicles, realistic physics, and smooth gameplay.

## Features

- **17 cars** spanning 8 categories: compact, JDM, muscle, truck, SUV, euro, exotic, and electric
- **3-tier upgrade system**: eBay (budget), RockAuto (performance), and Performance Shop (race-ready) across 10 upgrade categories per car
- **Canvas-based drag racing** with RPM gauges, gear shifting mechanics, and a Christmas-tree countdown light sequence
- **3 tournament modes**: Street League (easy), Underground Circuit (medium), and Elite Championship (hard)
- **Boss races** featuring unique opponents with taunts at the end of each tournament
- **Player economy** — start with $20,000, earn cash by racing, spend it on cars and upgrades
- **Dark neon theme** with a street-racing aesthetic

## Tech Stack

| Layer    | Technology                               |
|----------|------------------------------------------|
| Frontend | React, Tailwind CSS, Shadcn UI, HTML5 Canvas |
| Backend  | FastAPI (Python)                         |
| Game Engine | Client-side JavaScript race physics |

## Project Structure

```
1320-A-New-era/
├── frontend/               React app (UI, pages, canvas game engine)
│   └── src/
│       ├── App.js          Game context, routing, navigation bar
│       ├── pages/          MainMenu, Garage, Dealership, UpgradeShop,
│       │                   RaceScreen, TournamentHub
│       └── lib/
│           └── gameEngine.js  Physics simulation, rendering
├── backend/                FastAPI backend
│   ├── server.py           All API endpoints
│   ├── game_data.py        Car catalog, parts catalog, tournament data
│   └── race_engine.py      Server-side race simulation
├── game_data.py            Re-exports from backend/game_data.py
└── backend_test.py         API integration test suite
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/player/create` | Create a new player |
| GET | `/api/player/{id}` | Get player data |
| GET | `/api/cars/catalog` | List all available cars |
| POST | `/api/cars/buy` | Purchase a car |
| GET | `/api/cars/player/{id}` | Get player's owned cars |
| GET | `/api/parts/catalog` | List all upgrade parts |
| POST | `/api/cars/upgrade` | Install an upgrade on a car |
| GET | `/api/tournaments` | List all tournaments |
| GET | `/api/tournament/progress/{id}` | Get player's tournament progress |
| POST | `/api/tournament/advance` | Advance tournament after a race |
| POST | `/api/race/result` | Record a race result and award earnings |
| POST | `/api/race/simulate` | Server-side race simulation |

## Getting Started

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

Or from the project root:

```bash
pip install -r backend/requirements.txt
uvicorn backend.server:app --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Set the `REACT_APP_BACKEND_URL` environment variable to point at your backend (e.g. `http://localhost:8000`).

## Running Tests

```bash
python backend_test.py
```

## Roadmap

- [ ] Online multiplayer (WebSocket head-to-head races)
- [ ] "Cars and Coffee" social lobby
- [ ] Engine swap system (3-day cooldown)
- [ ] Pink slip betting
- [ ] Weather effects and multiple tracks
- [ ] Persistent database (MongoDB)
