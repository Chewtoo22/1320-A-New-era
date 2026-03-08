# Turbo Showdown - PRD

## Original Problem Statement
Build a web-based drag racing game inspired by Nitto 1320 Legends flash game with modern vehicles, better physics, better graphics, and smoother gameplay. Features include: 17+ cars, 3-tier upgrade system, tournament career mode, online multiplayer, "Cars and Coffee" lobby, engine swaps, and pink slip betting.

## Architecture
- **Frontend**: React + Tailwind + Shadcn UI + HTML5 Canvas (racing)
- **Backend**: FastAPI + Motor (async MongoDB)
- **Database**: MongoDB (players, player_cars, race_history, tournament_progress)
- **Game Engine**: Client-side JavaScript race simulation

## User Personas
1. **Nostalgic Racer**: Played Nitto 1320 Legends, wants that feeling back with modern polish
2. **Car Enthusiast**: Loves real-world car culture, wants accurate vehicles and parts
3. **Competitive Gamer**: Wants to grind, upgrade, and compete in tournaments
4. **Casual Player**: Quick race for fun, easy to pick up

## Core Requirements (Static)
- [x] 17 real-world cars across categories (compact, JDM, muscle, truck, SUV, euro, exotic, electric)
- [x] User's 4 requested cars: 2000 SVT Contour, 2015 Durango R/T, 1990 RX-7 FC, GMC Cyclone
- [x] 3-tier upgrade system: eBay (cheap), RockAuto (moderate), Performance Shop (high-end)
- [x] 10 upgrade categories per car
- [x] Canvas-based drag racing with RPM gauge, gear shifting, Christmas tree
- [x] 3 tournament difficulties with 8 racers + boss each
- [x] Player economy starting at $20,000
- [ ] Online multiplayer (head-to-head, bracket races)
- [ ] "Cars and Coffee" social lobby
- [ ] Engine swap system (3-day process)
- [ ] Pink slip betting
- [ ] Weather effects & multiple tracks
- [ ] Paint/tint/wheels customization detail

## What's Been Implemented (Feb 2026)
- Complete backend API (17 endpoints)
- 17-car catalog with realistic stats
- 10-part upgrade system with 3 tiers each
- Player creation and persistence
- Car purchase system with category filtering
- Full upgrade shop with tier-based pricing
- Canvas-based drag racing with RPM/shifting mechanics
- Christmas tree countdown system
- AI opponent simulation
- 3 tournament modes (Street League, Underground Circuit, Elite Championship)
- Boss races with unique characters and taunts
- Tournament progression tracking
- Quick race from garage
- Responsive dark theme with neon green street racing aesthetic
- Full nav bar with real-time cash/stats display

## Prioritized Backlog
### P0 (Next Sprint)
- Online multiplayer with WebSocket support
- "Cars and Coffee" social lobby for finding races
- Head-to-head race betting system

### P1
- Engine swap system with 3-day cooldown timer
- Pink slip betting (wager your car)
- Multiple track environments
- Weather effects (rain, night, fog)
- Sound effects and engine audio

### P2
- Detailed paint/tint/wheels customization
- Car selling/trading
- Leaderboard system
- Player profiles with race history
- Achievement system
- Mobile-optimized controls

## Next Tasks
1. Implement WebSocket-based online multiplayer
2. Build "Cars and Coffee" lobby UI
3. Add engine swap mechanic with 3-day timer
4. Add more visual fidelity to race canvas (parallax layers, weather)
5. Sound effects integration
