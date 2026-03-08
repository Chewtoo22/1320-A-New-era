import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RaceEngine, drawRaceScene, drawTachometer } from "@/lib/gameEngine";
import axios from "axios";

export default function RaceScreen() {
  const { player, selectedCar, recordRace, refreshPlayer } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const tachRef = useRef(null);
  const engineRef = useRef(null);
  const animRef = useRef(null);

  const raceData = location.state;
  const opponent = raceData?.opponent;
  const prize = raceData?.prize || 500;

  const [phase, setPhase] = useState("pre");
  const [countdownLights, setCountdownLights] = useState([false, false, false, false]);
  const [speed, setSpeed] = useState(0);
  const [gear, setGear] = useState(1);
  const [raceTime, setRaceTime] = useState(0);
  const [shiftFlash, setShiftFlash] = useState(null);
  const [results, setResults] = useState(null);
  const [fouled, setFouled] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!player || !selectedCar || !opponent) navigate("/garage");
  }, [player, selectedCar, opponent, navigate]);

  const startRace = useCallback(() => {
    if (!selectedCar || !opponent) return;
    const engine = new RaceEngine(selectedCar, opponent);
    engineRef.current = engine;
    engine.startCountdown();
    setPhase("countdown");

    let step = 0;
    const interval = setInterval(() => {
      engine.advanceCountdown();
      step++;
      setCountdownLights([step >= 1, step >= 2, step >= 3, step >= 4]);
      if (step >= 4) {
        clearInterval(interval);
        setPhase("green");
        startGameLoop();
      }
    }, 500);
  }, [selectedCar, opponent]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGameLoop = () => {
    const loop = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.update(performance.now());
      drawFrame();
      drawTach();
      setSpeed(Math.round(engine.player.speed));
      setGear(engine.player.gear);
      setRaceTime(engine.raceTime);

      if (engine.isFinished()) {
        setPhase("finished");
        setResults(engine.getResults());
        return;
      }
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
  };

  const drawFrame = () => {
    const canvas = canvasRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext("2d");
    drawRaceScene(ctx, canvas.width, canvas.height, engine, selectedCar?.paint_color || "#00ff88", opponent?.car_color || "#ff3366");
  };

  const drawTach = () => {
    const canvas = tachRef.current;
    const engine = engineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext("2d");
    const redline = selectedCar?.catalog?.redline || 7000;
    const isElec = selectedCar?.catalog?.gears === 1;
    drawTachometer(ctx, canvas.width, canvas.height, engine.player.rpm, redline, engine.player.gear, isElec);
  };

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  useEffect(() => {
    if (canvasRef.current) { canvasRef.current.width = 1200; canvasRef.current.height = 400; }
    if (tachRef.current) { tachRef.current.width = 220; tachRef.current.height = 220; }
  }, []);

  const handleLaunch = () => {
    const engine = engineRef.current;
    if (!engine) return;
    if (phase === "countdown") { setFouled(true); setPhase("finished"); if (animRef.current) cancelAnimationFrame(animRef.current); return; }
    const result = engine.playerLaunch(performance.now());
    if (result === 'foul') { setFouled(true); setPhase("finished"); if (animRef.current) cancelAnimationFrame(animRef.current); }
    else if (result !== null) setPhase("racing");
  };

  const handleShift = () => {
    const engine = engineRef.current;
    if (!engine || phase !== "racing") return;
    const quality = engine.playerShift();
    if (quality) { setShiftFlash(quality); setTimeout(() => setShiftFlash(null), 250); }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") { e.preventDefault(); if (phase === "green" || phase === "countdown") handleLaunch(); }
      if (e.code === "ArrowUp" || e.code === "ShiftLeft" || e.code === "ShiftRight") { e.preventDefault(); handleShift(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFinish = async () => {
    if (!results || saving) return;
    setSaving(true);
    const won = results.winner === "player" && !fouled;
    const isTournament = raceData?.raceType === "tournament";
    try {
      await recordRace({
        player_car_id: selectedCar.id, opponent_name: opponent.name, opponent_car: opponent.car,
        player_et: fouled ? 99.999 : results.playerET, opponent_et: results.opponentET,
        player_speed: fouled ? 0 : results.playerSpeed, opponent_speed: results.opponentSpeed,
        result: won ? "win" : "loss", earnings: isTournament ? 0 : (won ? prize : 0),
        race_type: raceData?.raceType || "quick", tournament_id: raceData?.tournamentId || null, race_index: raceData?.raceIndex ?? null,
      });
      if (isTournament && raceData?.tournamentId != null) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/tournament/advance`, {
          player_id: player.id, tournament_id: raceData.tournamentId, race_index: raceData.raceIndex, won
        });
        await refreshPlayer();
      }
    } catch (e) { console.error(e); }
    setSaving(false);
    navigate(raceData?.returnTo || "/garage");
  };

  if (!selectedCar || !opponent) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in" data-testid="race-screen">
      {/* Pre-race */}
      {phase === "pre" && (
        <div className="text-center py-8" data-testid="pre-race">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {raceData?.raceType === "tournament" ? "TOURNAMENT RACE" : "QUICK RACE"}
          </h2>
          <div className="flex items-center justify-center gap-10 mb-8">
            <div className="text-center">
              <div className="w-24 h-12 rounded mx-auto mb-2" style={{ backgroundColor: selectedCar.paint_color, boxShadow: `0 4px 16px ${selectedCar.paint_color}44` }} />
              <p className="text-sm font-bold">{player.username}</p>
              <p className="text-xs text-gray-500">{selectedCar.catalog.name}</p>
              <p className="text-xs neon-text mt-1">{selectedCar.effective_stats.effectiveHP} HP</p>
            </div>
            <div className="text-3xl font-bold text-gray-700" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>VS</div>
            <div className="text-center">
              <div className="w-24 h-12 rounded mx-auto mb-2" style={{ backgroundColor: opponent.car_color, boxShadow: `0 4px 16px ${opponent.car_color}44` }} />
              <p className="text-sm font-bold">{opponent.name}</p>
              <p className="text-xs text-gray-500">{opponent.car}</p>
              <p className="text-xs neon-text-red mt-1">???</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-2">Prize: <span className="neon-text">${prize.toLocaleString()}</span></p>
          <div className="metal-panel inline-block px-4 py-2 mb-6">
            <p className="text-xs text-gray-400">SPACE = Launch | UP ARROW = Shift | Shift at 82-93% RPM</p>
          </div>
          <div>
            <button onClick={startRace} className="btn-mech btn-mech-lg animate-mech-pulse" data-testid="start-race-btn">
              Stage Car
            </button>
          </div>
        </div>
      )}

      {/* Race view */}
      {phase !== "pre" && (
        <div>
          <div className="race-canvas-wrapper mb-4 relative" data-testid="race-canvas-wrapper">
            <canvas ref={canvasRef} className="race-canvas" style={{ height: '300px' }} />
            {shiftFlash && <div className={`shift-flash shift-${shiftFlash}`} />}
            {(phase === "countdown" || phase === "green") && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 metal-panel p-3" data-testid="christmas-tree">
                {[0, 1, 2].map(i => <div key={i} className={`tree-light tree-light-amber ${countdownLights[i] ? 'active' : ''}`} />)}
                <div className={`tree-light tree-light-green ${countdownLights[3] ? 'active' : ''}`} />
              </div>
            )}
            {fouled && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/30 rounded-lg">
                <div className="text-4xl font-bold neon-text-red" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>FOUL START!</div>
              </div>
            )}
          </div>

          {/* HUD with Tachometer */}
          <div className="flex items-center gap-6 justify-between" data-testid="race-hud">
            {/* Tachometer */}
            <div className="tach-canvas-wrapper flex-shrink-0" data-testid="tachometer">
              <canvas ref={tachRef} style={{ width: '180px', height: '180px' }} />
            </div>

            {/* Center gauges */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="gauge-display w-full max-w-[200px]">
                <div className="text-3xl font-bold neon-text" data-testid="speed-display">{speed}</div>
                <div className="text-xs text-gray-500 -mt-1">MPH</div>
              </div>
              <div className="flex gap-3">
                <div className="gauge-display px-4">
                  <div className="text-lg font-bold" data-testid="gear-display">{selectedCar.catalog.gears === 1 ? "D" : `G${gear}`}</div>
                  <div className="text-[9px] text-gray-600">GEAR</div>
                </div>
                <div className="gauge-display px-4">
                  <div className="text-lg font-bold" data-testid="timer-display">{raceTime.toFixed(2)}s</div>
                  <div className="text-[9px] text-gray-600">ET</div>
                </div>
              </div>
              <div className="text-xs text-gray-600">
                {Math.round(engineRef.current?.player?.distance || 0)}' / 1320'
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-3 items-end flex-shrink-0">
              {(phase === "green" || phase === "countdown") && !fouled && (
                <button onClick={handleLaunch} className="btn-mech btn-mech-lg" data-testid="launch-btn" style={{ minWidth: '140px' }}>
                  LAUNCH
                </button>
              )}
              {phase === "racing" && selectedCar.catalog.gears > 1 && (
                <button onClick={handleShift} className="btn-mech-red btn-mech btn-mech-lg" data-testid="shift-btn" style={{ minWidth: '140px' }}>
                  SHIFT
                </button>
              )}
              {phase === "racing" && selectedCar.catalog.gears === 1 && (
                <div className="gauge-display px-4 py-2">
                  <div className="text-xs neon-text">ELECTRIC</div>
                  <div className="text-[9px] text-gray-500">NO SHIFTING</div>
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          {phase === "finished" && results && (
            <div className="mt-6 text-center animate-fade-in" data-testid="race-results">
              <div className={`text-4xl font-bold mb-4 ${results.winner === 'player' && !fouled ? 'neon-text' : 'neon-text-red'}`} style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                {fouled ? "DISQUALIFIED" : results.winner === 'player' ? "YOU WIN!" : "YOU LOSE"}
              </div>
              {!fouled && (
                <div className="flex gap-6 justify-center mb-6">
                  <div className="mech-card p-5 rounded-lg min-w-[160px]">
                    <p className="text-xs text-gray-500 mb-1">Your Run</p>
                    <p className="text-2xl font-bold neon-text">{results.playerET}s</p>
                    <p className="text-sm text-gray-400">{results.playerSpeed} mph</p>
                    <p className="text-xs text-gray-600 mt-1">RT: {results.playerReaction}s</p>
                  </div>
                  <div className="mech-card p-5 rounded-lg min-w-[160px]">
                    <p className="text-xs text-gray-500 mb-1">{opponent.name}</p>
                    <p className="text-2xl font-bold neon-text-red">{results.opponentET}s</p>
                    <p className="text-sm text-gray-400">{results.opponentSpeed} mph</p>
                    <p className="text-xs text-gray-600 mt-1">RT: {results.opponentReaction}s</p>
                  </div>
                </div>
              )}
              {!fouled && results.shiftQualities.length > 0 && (
                <div className="flex gap-1 justify-center mb-4">
                  {results.shiftQualities.map((q, i) => (
                    <Badge key={i} className={`text-xs ${q === 'perfect' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : q === 'good' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : q === 'early' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
                      {q}
                    </Badge>
                  ))}
                </div>
              )}
              {results.winner === 'player' && !fouled && <p className="text-lg neon-text mb-4">+${prize.toLocaleString()}</p>}
              <button onClick={handleFinish} disabled={saving} className="btn-mech btn-mech-lg" data-testid="finish-race-btn">
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
