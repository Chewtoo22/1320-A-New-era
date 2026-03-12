import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGame } from "@/App";
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

  const startGameLoop = useCallback(() => {
    const loop = () => {
      const engine = engineRef.current;
      if (!engine) return;
      engine.update(performance.now());

      // Draw race scene
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        drawRaceScene(ctx, canvas.width, canvas.height, engine, selectedCar?.paint_color || "#FFB300", opponent?.car_color || "#E63946");
      }

      // Draw tachometer
      const tach = tachRef.current;
      if (tach) {
        const ctx = tach.getContext("2d");
        const redline = selectedCar?.catalog?.redline || 7000;
        const isElec = selectedCar?.catalog?.gears === 1;
        drawTachometer(ctx, tach.width, tach.height, engine.player.rpm, redline, engine.player.gear, isElec);
      }

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
  }, [selectedCar, opponent]);

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
  }, [selectedCar, opponent, startGameLoop]);

  useEffect(() => () => { if (animRef.current) cancelAnimationFrame(animRef.current); }, []);

  useEffect(() => {
    if (canvasRef.current) { canvasRef.current.width = 1200; canvasRef.current.height = 400; }
    if (tachRef.current) { tachRef.current.width = 220; tachRef.current.height = 220; }
  }, []);

  const handleLaunch = useCallback(() => {
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
  }, [phase]);

  const handleShift = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || phase !== "racing") return;
    const quality = engine.playerShift();
    if (quality) {
      setShiftFlash(quality);
      setTimeout(() => setShiftFlash(null), 250);
    }
  }, [phase]);

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
  }, [phase, handleLaunch, handleShift]);

  const handleFinish = async () => {
    if (!results || saving) return;
    setSaving(true);
    const won = results.winner === "player" && !fouled;
    const isTournament = raceData?.raceType === "tournament";
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
        earnings: isTournament ? 0 : (won ? prize : 0),
        race_type: raceData?.raceType || "quick",
        tournament_id: raceData?.tournamentId || null,
        race_index: raceData?.raceIndex ?? null,
      });
      if (isTournament && raceData?.tournamentId != null) {
        await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/tournament/advance`, {
          player_id: player.id,
          tournament_id: raceData.tournamentId,
          race_index: raceData.raceIndex,
          won
        });
        await refreshPlayer();
      }
    } catch (e) {
      console.error(`Failed to record race result for player ${player.id}:`, e.message);
      toast.error("Failed to save race result. Try again.");
    }
    setSaving(false);
    navigate(raceData?.returnTo || "/garage");
  };

  if (!selectedCar || !opponent) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="animate-pulse">
          <h2 className="text-2xl font-bold mb-4 text-[#FFB300]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            LOADING RACE DATA
          </h2>
          <p className="text-[#94A3B8] mb-4">Preparing for race...</p>
          <div className="h-32 bg-[#1A2332] border border-[#2D3748] rounded-sm animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in" data-testid="race-screen">
      {/* Pre-race Staging */}
      {phase === "pre" && (
        <div className="text-center py-8" data-testid="pre-race">
          <h2 className="text-2xl font-bold mb-6 uppercase tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {raceData?.raceType === "tournament" ? "TOURNAMENT RACE" : "QUICK RACE"}
          </h2>

          {/* VS Display */}
          <div className="flex items-center justify-center gap-10 mb-8">
            <div className="text-center">
              <div className="w-24 h-12 rounded-sm mx-auto mb-2 border border-white/10" style={{ backgroundColor: selectedCar.paint_color, boxShadow: `0 4px 16px ${selectedCar.paint_color}33` }} />
              <p className="text-sm font-bold text-[#F1F5F9]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{player.username}</p>
              <p className="text-xs text-[#64748B]">{selectedCar.catalog.name}</p>
              <p className="text-xs text-amber-glow mt-1">{selectedCar.effective_stats.effectiveHP} HP</p>
            </div>
            <div className="text-4xl font-bold text-[#2D3748]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>VS</div>
            <div className="text-center">
              <div className="w-24 h-12 rounded-sm mx-auto mb-2 border border-white/10" style={{ backgroundColor: opponent.car_color, boxShadow: `0 4px 16px ${opponent.car_color}33` }} />
              <p className="text-sm font-bold text-[#F1F5F9]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{opponent.name}</p>
              <p className="text-xs text-[#64748B]">{opponent.car}</p>
              <p className="text-xs text-[#E63946] mt-1">???</p>
            </div>
          </div>

          <p className="text-sm text-[#94A3B8] mb-2">Prize: <span className="text-amber-glow font-bold">${prize.toLocaleString()}</span></p>

          <div className="metal-panel inline-block px-5 py-2 mb-6">
            <p className="text-xs text-[#94A3B8]">
              <span className="text-[#FFB300]">SPACE</span> = Launch | <span className="text-[#FFB300]">UP ARROW</span> = Shift | Shift at <span className="text-[#00CC66]">82-93%</span> RPM for perfect
            </p>
          </div>

          <div>
            <button onClick={startRace} className="btn-amber btn-steel btn-lg animate-engine-pulse" data-testid="start-race-btn">
              Stage Car
            </button>
          </div>
        </div>
      )}

      {/* Active Race View */}
      {phase !== "pre" && (
        <div>
          {/* Canvas */}
          <div className="race-canvas-wrapper mb-4 relative" data-testid="race-canvas-wrapper">
            <canvas ref={canvasRef} className="race-canvas" style={{ height: '300px' }} />
            {shiftFlash && <div className={`shift-flash shift-${shiftFlash}`} />}

            {/* Christmas Tree overlay */}
            {(phase === "countdown" || phase === "green") && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 p-3 bg-[#0B0F19]/90 border border-[#2D3748] rounded-sm" data-testid="christmas-tree">
                {[0, 1, 2].map(i => (
                  <div key={i} className={`tree-light tree-light-amber ${countdownLights[i] ? 'active' : ''}`} />
                ))}
                <div className={`tree-light tree-light-green ${countdownLights[3] ? 'active' : ''}`} />
              </div>
            )}

            {/* Foul overlay */}
            {fouled && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#E63946]/15 rounded-sm">
                <div className="text-4xl font-bold text-red-glow" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>FOUL START!</div>
              </div>
            )}
          </div>

          {/* HUD Dashboard */}
          <div className="flex items-center gap-6 justify-between" data-testid="race-hud">
            {/* Tachometer */}
            <div className="tach-canvas-wrapper flex-shrink-0" data-testid="tachometer">
              <canvas ref={tachRef} style={{ width: '180px', height: '180px' }} />
            </div>

            {/* Center Gauges */}
            <div className="flex-1 flex flex-col items-center gap-3">
              <div className="gauge-display w-full max-w-[200px]">
                <div className="text-3xl font-bold text-amber-glow" data-testid="speed-display" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  {speed}
                </div>
                <div className="text-xs text-[#64748B] -mt-1 uppercase tracking-wider">MPH</div>
              </div>
              <div className="flex gap-3">
                <div className="gauge-display px-4">
                  <div className="text-lg font-bold" data-testid="gear-display" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                    {selectedCar.catalog.gears === 1 ? "D" : `G${gear}`}
                  </div>
                  <div className="text-[9px] text-[#475569] uppercase tracking-wider">Gear</div>
                </div>
                <div className="gauge-display px-4">
                  <div className="text-lg font-bold" data-testid="timer-display" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                    {raceTime.toFixed(2)}s
                  </div>
                  <div className="text-[9px] text-[#475569] uppercase tracking-wider">ET</div>
                </div>
              </div>
              <div className="text-xs text-[#475569] font-mono">
                {Math.round(engineRef.current?.player?.distance || 0)}' / 1320'
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3 items-end flex-shrink-0">
              {(phase === "green" || phase === "countdown") && !fouled && (
                <button onClick={handleLaunch} className="btn-race-green btn-steel btn-lg" data-testid="launch-btn" style={{ minWidth: '140px' }}>
                  LAUNCH
                </button>
              )}
              {phase === "racing" && selectedCar.catalog.gears > 1 && (
                <button onClick={handleShift} className="btn-race-red btn-steel btn-lg" data-testid="shift-btn" style={{ minWidth: '140px' }}>
                  SHIFT
                </button>
              )}
              {phase === "racing" && selectedCar.catalog.gears === 1 && (
                <div className="gauge-display px-4 py-2">
                  <div className="text-xs text-[#00A3FF]">ELECTRIC</div>
                  <div className="text-[9px] text-[#475569]">NO SHIFTING</div>
                </div>
              )}
            </div>
          </div>

          {/* Race Results */}
          {phase === "finished" && results && (
            <div className="mt-6 text-center animate-fade-in" data-testid="race-results">
              <div
                className={`text-4xl font-bold mb-4 ${results.winner === 'player' && !fouled ? 'text-amber-glow' : 'text-red-glow'}`}
                style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              >
                {fouled ? "DISQUALIFIED" : results.winner === 'player' ? "YOU WIN!" : "YOU LOSE"}
              </div>

              {!fouled && (
                <div className="flex gap-6 justify-center mb-6">
                  <div className="steel-card p-5 min-w-[160px]">
                    <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wider">Your Run</p>
                    <p className="text-2xl font-bold text-[#00CC66]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{results.playerET}s</p>
                    <p className="text-sm text-[#94A3B8]">{results.playerSpeed} mph</p>
                    <p className="text-xs text-[#475569] mt-1">RT: {results.playerReaction}s</p>
                  </div>
                  <div className="steel-card p-5 min-w-[160px]">
                    <p className="text-xs text-[#64748B] mb-1 uppercase tracking-wider">{opponent.name}</p>
                    <p className="text-2xl font-bold text-[#E63946]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{results.opponentET}s</p>
                    <p className="text-sm text-[#94A3B8]">{results.opponentSpeed} mph</p>
                    <p className="text-xs text-[#475569] mt-1">RT: {results.opponentReaction}s</p>
                  </div>
                </div>
              )}

              {!fouled && results.shiftQualities.length > 0 && (
                <div className="flex gap-1 justify-center mb-4">
                  {results.shiftQualities.map((q, i) => (
                    <Badge
                      key={i}
                      className={`text-xs ${
                        q === 'perfect' ? 'bg-[#00CC66]/15 text-[#00CC66] border-[#00CC66]/30' :
                        q === 'good' ? 'bg-[#00A3FF]/15 text-[#00A3FF] border-[#00A3FF]/30' :
                        q === 'early' ? 'bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30' :
                        'bg-[#E63946]/15 text-[#E63946] border-[#E63946]/30'
                      }`}
                    >
                      {q}
                    </Badge>
                  ))}
                </div>
              )}

              {results.winner === 'player' && !fouled && (
                <p className="text-lg text-amber-glow mb-4 font-bold">+${prize.toLocaleString()}</p>
              )}

              <button onClick={handleFinish} disabled={saving} className="btn-amber btn-steel btn-lg" data-testid="finish-race-btn">
                {saving ? "Saving..." : "Continue"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
