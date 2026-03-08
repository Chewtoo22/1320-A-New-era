import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/App";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RaceEngine, drawRaceScene } from "@/lib/gameEngine";

export default function RaceScreen() {
  const { player, selectedCar, recordRace } = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const animRef = useRef(null);

  const raceData = location.state;
  const opponent = raceData?.opponent;
  const prize = raceData?.prize || 500;

  const [phase, setPhase] = useState("pre"); // pre, staging, countdown, racing, finished
  const [countdownLights, setCountdownLights] = useState([false, false, false, false]);
  const [rpmPercent, setRpmPercent] = useState(0);
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
      const newLights = [step >= 1, step >= 2, step >= 3, step >= 4];
      setCountdownLights(newLights);
      if (step >= 4) {
        clearInterval(interval);
        setPhase("green");
        startGameLoop();
      }
    }, 500);
  }, [selectedCar, opponent]);

  const startGameLoop = () => {
    const loop = () => {
      const engine = engineRef.current;
      if (!engine) return;

      engine.update(performance.now());
      drawFrame();

      setRpmPercent(engine.isElectric ? (engine.player.speed / engine.playerBaseTrap) * 100 : (engine.player.rpm / engine.playerRedline) * 100);
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

  useEffect(() => {
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1200;
      canvas.height = 400;
    }
  }, []);

  const handleLaunch = () => {
    const engine = engineRef.current;
    if (!engine) return;

    if (phase === "countdown") {
      setFouled(true);
      setPhase("finished");
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const result = engine.playerLaunch(performance.now());
    if (result === 'foul') {
      setFouled(true);
      setPhase("finished");
      if (animRef.current) cancelAnimationFrame(animRef.current);
    } else if (result !== null) {
      setPhase("racing");
    }
  };

  const handleShift = () => {
    const engine = engineRef.current;
    if (!engine || phase !== "racing") return;
    const quality = engine.playerShift();
    if (quality) {
      setShiftFlash(quality);
      setTimeout(() => setShiftFlash(null), 300);
    }
  };

  useEffect(() => {
    const handleKey = (e) => {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        if (phase === "green" || phase === "countdown") handleLaunch();
      }
      if (e.code === "ArrowUp" || e.code === "ShiftLeft" || e.code === "ShiftRight") {
        e.preventDefault();
        handleShift();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase]);

  const handleFinish = async () => {
    if (!results || saving) return;
    setSaving(true);
    const won = results.winner === "player" && !fouled;
    try {
      await recordRace({
        player_car_id: selectedCar.id,
        opponent_name: opponent.name,
        opponent_car: opponent.car,
        player_et: fouled ? 99.999 : results.playerET,
        opponent_et: results.opponentET,
        player_speed: fouled ? 0 : results.playerSpeed,
        opponent_speed: results.opponentSpeed,
        result: won ? "win" : "loss",
        earnings: won ? prize : 0,
        race_type: raceData?.raceType || "quick",
        tournament_id: raceData?.tournamentId || null,
        race_index: raceData?.raceIndex ?? null,
      });
    } catch (e) {
      console.error(e);
    }
    setSaving(false);

    if (raceData?.raceType === "tournament" && raceData?.onComplete) {
      raceData.onComplete(won);
    }
    navigate(raceData?.returnTo || "/garage");
  };

  const getRpmColor = () => {
    if (rpmPercent >= 95) return "rpm-zone-red";
    if (rpmPercent >= 82) return "rpm-zone-optimal";
    if (rpmPercent >= 70) return "rpm-zone-green";
    return "rpm-zone-green";
  };

  if (!selectedCar || !opponent) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in" data-testid="race-screen">
      {/* Pre-race info */}
      {phase === "pre" && (
        <div className="text-center py-8" data-testid="pre-race">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {raceData?.raceType === "tournament" ? "Tournament Race" : "Quick Race"}
          </h2>

          <div className="flex items-center justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="w-20 h-10 rounded mx-auto mb-2" style={{ backgroundColor: selectedCar.paint_color, boxShadow: `0 0 20px ${selectedCar.paint_color}44` }} />
              <p className="text-sm font-bold">{player.username}</p>
              <p className="text-xs text-gray-500">{selectedCar.catalog.name}</p>
              <p className="text-xs neon-text">{selectedCar.effective_stats.effectiveET}s / {selectedCar.effective_stats.effectiveSpeed} mph</p>
            </div>

            <div className="text-2xl font-bold text-gray-600" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>VS</div>

            <div className="text-center">
              <div className="w-20 h-10 rounded mx-auto mb-2" style={{ backgroundColor: opponent.car_color, boxShadow: `0 0 20px ${opponent.car_color}44` }} />
              <p className="text-sm font-bold">{opponent.name}</p>
              <p className="text-xs text-gray-500">{opponent.car}</p>
              <p className="text-xs neon-text-red">???</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-2">Prize: <span className="neon-text">${prize.toLocaleString()}</span></p>
          <p className="text-xs text-gray-600 mb-6">SPACE to launch | UP ARROW to shift</p>

          <Button onClick={startRace} className="btn-neon px-12 h-12 text-lg rounded-lg animate-pulse-glow" data-testid="start-race-btn">
            Stage Car
          </Button>
        </div>
      )}

      {/* Race view */}
      {phase !== "pre" && (
        <div>
          {/* Canvas */}
          <div className="race-canvas-wrapper mb-4 relative" data-testid="race-canvas-wrapper">
            <canvas ref={canvasRef} className="race-canvas" style={{ height: '300px' }} />

            {/* Shift flash overlay */}
            {shiftFlash && <div className={`shift-flash shift-${shiftFlash}`} />}

            {/* Christmas tree overlay */}
            {(phase === "countdown" || phase === "green") && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" data-testid="christmas-tree">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`tree-light tree-light-amber ${countdownLights[i] ? 'active' : ''}`} />
                ))}
                <div className={`tree-light tree-light-green ${countdownLights[3] ? 'active' : ''}`} />
              </div>
            )}

            {/* Foul indicator */}
            {fouled && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/30">
                <div className="text-4xl font-bold neon-text-red" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>FOUL START!</div>
              </div>
            )}
          </div>

          {/* HUD */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center" data-testid="race-hud">
            {/* RPM Gauge */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500">RPM</span>
                <span className="text-xs text-gray-500">
                  {selectedCar.catalog.gears === 1 ? "ELECTRIC" : `SHIFT ZONE 82-93%`}
                </span>
              </div>
              <div className="rpm-container" data-testid="rpm-gauge">
                <div className={`rpm-fill ${getRpmColor()}`} style={{ width: `${Math.min(rpmPercent, 100)}%` }} />
                {selectedCar.catalog.gears > 1 && (
                  <>
                    <div className="rpm-shift-indicator" style={{ left: '82%' }} />
                    <div className="rpm-shift-indicator" style={{ left: '93%', background: 'var(--neon-amber)' }} />
                  </>
                )}
              </div>
            </div>

            {/* Center stats */}
            <div className="text-center min-w-[140px]">
              <div className="text-3xl font-bold neon-text" style={{ fontFamily: "'Chakra Petch', sans-serif" }} data-testid="speed-display">
                {speed} <span className="text-sm text-gray-500">MPH</span>
              </div>
              <div className="flex items-center justify-center gap-4 mt-1">
                <span className="text-sm" data-testid="gear-display">
                  {selectedCar.catalog.gears === 1 ? "D" : `G${gear}`}
                </span>
                <span className="text-xs text-gray-500" data-testid="timer-display">{raceTime.toFixed(2)}s</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              {(phase === "green" || phase === "countdown") && !fouled && (
                <Button onClick={handleLaunch} className="btn-neon h-16 px-8 text-lg rounded-lg" data-testid="launch-btn">
                  LAUNCH
                </Button>
              )}
              {phase === "racing" && selectedCar.catalog.gears > 1 && (
                <Button onClick={handleShift} className="btn-neon h-16 px-8 text-lg rounded-lg" data-testid="shift-btn">
                  SHIFT
                </Button>
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
                <div className="grid grid-cols-2 gap-6 max-w-md mx-auto mb-6">
                  <div className="game-card p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Your Run</p>
                    <p className="text-2xl font-bold neon-text">{results.playerET}s</p>
                    <p className="text-sm text-gray-400">{results.playerSpeed} mph</p>
                    <p className="text-xs text-gray-600">RT: {results.playerReaction}s</p>
                  </div>
                  <div className="game-card p-4 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">{opponent.name}</p>
                    <p className="text-2xl font-bold neon-text-red">{results.opponentET}s</p>
                    <p className="text-sm text-gray-400">{results.opponentSpeed} mph</p>
                  </div>
                </div>
              )}

              {!fouled && results.shiftQualities.length > 0 && (
                <div className="flex gap-1 justify-center mb-4">
                  {results.shiftQualities.map((q, i) => (
                    <Badge key={i} className={`text-xs ${q === 'perfect' ? 'bg-emerald-500/20 text-emerald-400' : q === 'good' ? 'bg-blue-500/20 text-blue-400' : q === 'early' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'}`}>
                      {q}
                    </Badge>
                  ))}
                </div>
              )}

              {results.winner === 'player' && !fouled && (
                <p className="text-lg neon-text mb-4">+${prize.toLocaleString()}</p>
              )}

              <Button onClick={handleFinish} disabled={saving} className="btn-neon px-8 h-12 rounded-lg" data-testid="finish-race-btn">
                {saving ? "Saving..." : "Continue"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
