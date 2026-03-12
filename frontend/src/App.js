import { createContext, useContext, useState, useCallback, useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "sonner";
import MainMenu from "@/pages/MainMenu";
import Garage from "@/pages/Garage";
import Dealership from "@/pages/Dealership";
import UpgradeShop from "@/pages/UpgradeShop";
import RaceScreen from "@/pages/RaceScreen";
import TournamentHub from "@/pages/TournamentHub";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const GameContext = createContext(null);
export const useGame = () => useContext(GameContext);

function GameProvider({ children }) {
  const [player, setPlayer] = useState(null);
  const [playerCars, setPlayerCars] = useState([]);
  const [selectedCarId, setSelectedCarId] = useState(null);
  const [loading, setLoading] = useState(true);

  const selectedCar = playerCars.find(c => c.id === selectedCarId) || playerCars[0] || null;

  const refreshPlayer = useCallback(async (pid) => {
    const id = pid || player?.id;
    if (!id) return;
    try {
      const res = await axios.get(`${API}/player/${id}`);
      setPlayer(res.data);
    } catch (e) {
      console.error(`Failed to load player from ${API}/player/${id}:`, e.message);
    }
  }, [player?.id]);

  const refreshCars = useCallback(async (pid) => {
    const id = pid || player?.id;
    if (!id) return;
    try {
      const res = await axios.get(`${API}/cars/player/${id}`);
      setPlayerCars(res.data);
    } catch (e) {
      console.error(`Failed to load cars from ${API}/cars/player/${id}:`, e.message);
    }
  }, [player?.id]);

  useEffect(() => {
    const storedId = localStorage.getItem("turbo_player_id");
    if (storedId) {
      Promise.all([
        axios.get(`${API}/player/${storedId}`),
        axios.get(`${API}/cars/player/${storedId}`)
      ]).then(([pRes, cRes]) => {
        setPlayer(pRes.data);
        setPlayerCars(cRes.data);
        if (cRes.data.length > 0) setSelectedCarId(cRes.data[0].id);
      }).catch(() => {
        localStorage.removeItem("turbo_player_id");
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const createPlayer = async (username) => {
    const res = await axios.post(`${API}/player/create`, { username });
    setPlayer(res.data);
    localStorage.setItem("turbo_player_id", res.data.id);
    return res.data;
  };

  const buyCar = async (carId) => {
    const res = await axios.post(`${API}/cars/buy`, { player_id: player.id, car_id: carId });
    setPlayer(prev => ({ ...prev, cash: res.data.new_cash }));
    setPlayerCars(prev => [...prev, res.data.car]);
    if (!selectedCarId) setSelectedCarId(res.data.car.id);
    return res.data;
  };

  const upgradeCar = async (playerCarId, partKey, tier) => {
    const res = await axios.post(`${API}/cars/upgrade`, {
      player_id: player.id, player_car_id: playerCarId, part_key: partKey, tier
    });
    setPlayer(prev => ({ ...prev, cash: res.data.new_cash }));
    setPlayerCars(prev => prev.map(c => c.id === playerCarId ? res.data.car : c));
    return res.data;
  };

  const recordRace = async (raceData) => {
    const res = await axios.post(`${API}/race/result`, { player_id: player.id, ...raceData });
    setPlayer(res.data);
    return res.data;
  };

  const value = {
    player, playerCars, selectedCar, selectedCarId, setSelectedCarId,
    loading, createPlayer, buyCar, upgradeCar, recordRace,
    refreshPlayer, refreshCars, API
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

const NAV_ITEMS = [
  { path: "/garage", label: "GARAGE" },
  { path: "/dealership", label: "SHOWROOM" },
  { path: "/upgrades", label: "PARTS SHOP" },
  { path: "/tournament", label: "RACE TRACK" },
];

function NavBar() {
  const { player, selectedCar } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  if (!player) return null;

  return (
    <nav className="game-nav" data-testid="game-nav">
      <div className="flex items-center justify-between px-4">
        {/* Left: Logo + Tabs */}
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="font-bold text-lg tracking-wider mr-2 px-4 py-3 text-amber-glow"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            data-testid="nav-logo"
          >
            TURBO SHOWDOWN
          </button>
          <div className="h-8 w-px bg-[#2D3748] mx-2" />
          <div className="flex">
            {NAV_ITEMS.map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`nav-tab ${location.pathname === item.path ? 'active' : ''}`}
                data-testid={`nav-${item.label.toLowerCase().replace(/\s/g, '-')}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Player info */}
        <div className="flex items-center gap-4 py-3">
          {selectedCar && (
            <span className="text-xs text-chrome hidden md:block">
              {selectedCar.catalog.name}
            </span>
          )}
          <div className="h-4 w-px bg-[#2D3748]" />
          <span className="text-sm text-chrome">{player.username}</span>
          <span className="font-bold text-sm text-amber-glow" data-testid="nav-cash">
            ${player.cash?.toLocaleString()}
          </span>
          <span className="text-xs text-[#64748B]">{player.wins}W-{player.losses}L</span>
        </div>
      </div>
    </nav>
  );
}

function AppRoutes() {
  return (
    <div className="game-container">
      <NavBar />
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/garage" element={<Garage />} />
        <Route path="/dealership" element={<Dealership />} />
        <Route path="/upgrades" element={<UpgradeShop />} />
        <Route path="/race" element={<RaceScreen />} />
        <Route path="/tournament" element={<TournamentHub />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <GameProvider>
        <AppRoutes />
        <Toaster theme="dark" position="top-right" richColors />
      </GameProvider>
    </BrowserRouter>
  );
}
