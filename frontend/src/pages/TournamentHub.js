import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const DIFF_COLORS = { easy: "difficulty-easy", medium: "difficulty-medium", hard: "difficulty-hard" };
const DIFF_LABELS = { easy: "Street League", medium: "Underground", hard: "Elite" };

export default function TournamentHub() {
  const { player, selectedCar } = useGame();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [progress, setProgress] = useState({});
  const [selectedTournament, setSelectedTournament] = useState(null);

  useEffect(() => {
    if (!player) { navigate("/"); return; }
    Promise.all([
      axios.get(`${API}/tournaments`),
      axios.get(`${API}/tournament/progress/${player.id}`)
    ]).then(([tRes, pRes]) => {
      setTournaments(tRes.data);
      setProgress(pRes.data);
    });
  }, [player, navigate]);

  const startTournamentRace = (tournament, raceIndex) => {
    if (!selectedCar) {
      toast.error("Select a car from your garage first!");
      return;
    }

    const isBoss = raceIndex >= tournament.racers.length;
    const opponent = isBoss ? tournament.boss : tournament.racers[raceIndex];
    const prize = isBoss ? tournament.tournament_bonus : tournament.prize_per_race;

    navigate("/race", {
      state: {
        opponent: {
          name: isBoss ? `${opponent.name} (BOSS)` : opponent.name,
          car: opponent.car,
          et: opponent.et,
          trap: opponent.trap,
          car_color: opponent.car_color,
          bodyType: opponent.bodyType
        },
        raceType: "tournament",
        prize,
        tournamentId: tournament.id,
        raceIndex,
        returnTo: "/tournament"
      }
    });
  };

  if (!player) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in" data-testid="tournament-hub">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Tournaments</h1>
          <p className="text-gray-500 text-sm mt-1">Prove your worth on the quarter mile</p>
        </div>
        {selectedCar && (
          <div className="text-right">
            <p className="text-xs text-gray-500">Racing with</p>
            <p className="text-sm font-bold">{selectedCar.catalog.name}</p>
            <p className="text-xs neon-text">{selectedCar.effective_stats.effectiveET}s ET</p>
          </div>
        )}
      </div>

      {!selectedTournament ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tournaments.map((t, i) => {
            const prog = progress[t.id];
            const currentRace = prog?.current_race || 0;
            const completed = prog?.completed || false;
            const totalRaces = t.racers.length + 1;

            return (
              <Card key={t.id} className={`game-card ${DIFF_COLORS[t.difficulty]} border-l-4`} data-testid={`tournament-card-${i}`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xl font-bold" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{t.name}</h2>
                    <Badge className={`diff-badge text-xs`}>
                      {t.difficulty.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{t.description}</p>

                  <div className="space-y-2 mb-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Races</span>
                      <span>{totalRaces} (8 + Boss)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Prize per Race</span>
                      <span className="neon-text">${t.prize_per_race.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tournament Bonus</span>
                      <span className="neon-text">${t.tournament_bonus.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recommended ET</span>
                      <span>{t.recommended_et}s or faster</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{currentRace}/{totalRaces}</span>
                    </div>
                    <div className="stat-bar">
                      <div className="stat-bar-fill" style={{
                        width: `${(currentRace / totalRaces) * 100}%`,
                        backgroundColor: completed ? 'var(--neon-green)' : 'var(--neon-amber)'
                      }} />
                    </div>
                  </div>

                  {/* Boss preview */}
                  <div className="bg-white/5 rounded p-3 mb-4">
                    <p className="text-xs text-gray-500 mb-1">Boss: {t.boss.title}</p>
                    <p className="text-sm font-bold">{t.boss.name}</p>
                    <p className="text-xs text-gray-500">{t.boss.car}</p>
                  </div>

                  <Button
                    onClick={() => setSelectedTournament(t)}
                    className={`w-full rounded ${completed ? 'bg-emerald-500/10 text-emerald-400' : 'btn-neon'}`}
                    data-testid={`enter-tournament-${i}`}
                  >
                    {completed ? "Completed! Race Again" : currentRace > 0 ? "Continue" : "Enter"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="animate-slide-in" data-testid="tournament-bracket">
          <Button variant="ghost" onClick={() => setSelectedTournament(null)} className="text-gray-400 mb-6" data-testid="back-to-tournaments">
            Back to Tournaments
          </Button>

          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{selectedTournament.name}</h2>
          <p className="text-gray-500 text-sm mb-6">{selectedTournament.description}</p>

          <div className="space-y-3">
            {selectedTournament.racers.map((racer, i) => {
              const prog = progress[selectedTournament.id];
              const currentRace = prog?.current_race || 0;
              const isNext = i === currentRace;
              const isCompleted = i < currentRace;
              const isLocked = i > currentRace;

              return (
                <div key={i} className={`game-card p-4 flex items-center justify-between rounded-lg ${isNext ? 'neon-border' : ''} ${isLocked ? 'opacity-40' : ''}`} data-testid={`bracket-race-${i}`}>
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{racer.name}</p>
                      <p className="text-xs text-gray-500">{racer.car}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">{racer.et}s ET</span>
                    {isCompleted && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Won</Badge>}
                    {isNext && (
                      <Button size="sm" onClick={() => startTournamentRace(selectedTournament, i)} className="btn-neon-red rounded text-xs" data-testid={`race-opponent-${i}`}>
                        Race
                      </Button>
                    )}
                    {isLocked && <Badge variant="secondary" className="text-xs">Locked</Badge>}
                  </div>
                </div>
              );
            })}

            {/* Boss */}
            {(() => {
              const prog = progress[selectedTournament.id];
              const currentRace = prog?.current_race || 0;
              const isBossNext = currentRace >= selectedTournament.racers.length;
              const bossCompleted = prog?.completed;
              const boss = selectedTournament.boss;

              return (
                <div className={`game-card p-4 flex items-center justify-between rounded-lg border-l-4 ${bossCompleted ? 'border-l-emerald-500' : 'border-l-red-500'} ${!isBossNext && !bossCompleted ? 'opacity-40' : ''}`} data-testid="boss-race">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-red-500/20 text-red-400">
                      B
                    </div>
                    <div>
                      <p className="font-bold text-sm neon-text-red">{boss.name}</p>
                      <p className="text-xs text-gray-500">{boss.car}</p>
                      <p className="text-xs text-gray-600 italic">"{boss.taunt}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs neon-text-red">{boss.et}s ET</span>
                    {bossCompleted && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Defeated</Badge>}
                    {isBossNext && !bossCompleted && (
                      <Button size="sm" onClick={() => startTournamentRace(selectedTournament, selectedTournament.racers.length)} className="btn-neon-red rounded text-xs animate-pulse-glow" data-testid="race-boss-btn">
                        Challenge Boss
                      </Button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
