import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const DIFF_CLASS = { easy: "diff-easy", medium: "diff-medium", hard: "diff-hard" };

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
          bodyType: opponent.bodyType,
          difficulty: tournament.difficulty
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
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in" data-testid="tournament-hub">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            Race Track
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Prove your worth on the quarter mile</p>
        </div>
        {selectedCar && (
          <div className="metal-panel px-4 py-3 text-right">
            <p className="text-[0.65rem] text-[#64748B] uppercase tracking-wider font-bold">Racing With</p>
            <p className="text-sm font-bold" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{selectedCar.catalog.name}</p>
            <p className="text-xs text-[#00CC66]">{selectedCar.effective_stats.effectiveET}s ET | {selectedCar.effective_stats.effectiveHP} HP</p>
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
              <div key={t.id} className={`steel-card ${DIFF_CLASS[t.difficulty]} border-l-4 p-6`} data-testid={`tournament-card-${i}`}>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{t.name}</h2>
                  <span className="diff-label text-xs font-bold px-2 py-1 rounded-sm uppercase">{t.difficulty}</span>
                </div>

                <p className="text-sm text-[#94A3B8] mb-4">{t.description}</p>

                <div className="space-y-2 mb-4 text-xs">
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Races</span>
                    <span className="text-[#F1F5F9]">{totalRaces} (8 + Boss)</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Prize per Race</span>
                    <span className="text-amber-glow">${t.prize_per_race.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Tournament Bonus</span>
                    <span className="text-amber-glow">${t.tournament_bonus.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#94A3B8]">
                    <span>Recommended ET</span>
                    <span className="text-[#F1F5F9]">{t.recommended_et}s or faster</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[#64748B] mb-1">
                    <span>Progress</span>
                    <span>{currentRace}/{totalRaces}</span>
                  </div>
                  <div className="stat-bar">
                    <div className="stat-bar-fill" style={{
                      width: `${(currentRace / totalRaces) * 100}%`,
                      backgroundColor: completed ? '#00CC66' : '#FFB300'
                    }} />
                  </div>
                </div>

                {/* Boss preview */}
                <div className="bg-[#0B0F19] rounded-sm p-3 mb-4 border border-[#2D3748]">
                  <p className="text-[0.65rem] text-[#64748B] mb-1 uppercase tracking-wider font-bold">Boss: {t.boss.title}</p>
                  <p className="text-sm font-bold" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{t.boss.name}</p>
                  <p className="text-xs text-[#64748B]">{t.boss.car}</p>
                </div>

                <button
                  onClick={() => setSelectedTournament(t)}
                  className={`w-full ${completed ? 'btn-race-green btn-steel' : 'btn-amber btn-steel'}`}
                  data-testid={`enter-tournament-${i}`}
                >
                  {completed ? "Completed! Race Again" : currentRace > 0 ? "Continue" : "Enter"}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="animate-slide-in" data-testid="tournament-bracket">
          <button
            onClick={() => setSelectedTournament(null)}
            className="btn-steel text-xs mb-6"
            data-testid="back-to-tournaments"
          >
            Back to Tournaments
          </button>

          <h2 className="text-2xl font-bold mb-2 uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            {selectedTournament.name}
          </h2>
          <p className="text-[#94A3B8] text-sm mb-6">{selectedTournament.description}</p>

          <div className="space-y-3">
            {selectedTournament.racers.map((racer, i) => {
              const prog = progress[selectedTournament.id];
              const currentRace = prog?.current_race || 0;
              const isNext = i === currentRace;
              const isCompleted = i < currentRace;
              const isLocked = i > currentRace;

              return (
                <div
                  key={i}
                  className={`steel-card p-4 flex items-center justify-between ${isNext ? 'steel-card-selected' : ''} ${isLocked ? 'opacity-40' : ''}`}
                  data-testid={`bracket-race-${i}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold bg-[#0B0F19] border border-[#2D3748]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                      {i + 1}
                    </div>
                    <div>
                      <p className="font-bold text-sm uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{racer.name}</p>
                      <p className="text-xs text-[#64748B]">{racer.car}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#94A3B8] font-mono">{racer.et}s ET</span>
                    {isCompleted && <Badge className="bg-[#00CC66]/15 text-[#00CC66] border-[#00CC66]/30 text-xs">Won</Badge>}
                    {isNext && (
                      <button onClick={() => startTournamentRace(selectedTournament, i)} className="btn-race-red btn-steel text-xs" data-testid={`race-opponent-${i}`}>
                        Race
                      </button>
                    )}
                    {isLocked && <span className="text-xs text-[#475569]">Locked</span>}
                  </div>
                </div>
              );
            })}

            {/* Boss Fight */}
            {(() => {
              const prog = progress[selectedTournament.id];
              const currentRace = prog?.current_race || 0;
              const isBossNext = currentRace >= selectedTournament.racers.length;
              const bossCompleted = prog?.completed;
              const boss = selectedTournament.boss;

              return (
                <div
                  className={`steel-card p-4 flex items-center justify-between border-l-4 ${
                    bossCompleted ? 'border-l-[#00CC66]' : 'border-l-[#E63946]'
                  } ${!isBossNext && !bossCompleted ? 'opacity-40' : ''}`}
                  data-testid="boss-race"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold bg-[#E63946]/15 text-[#E63946] border border-[#E63946]/30" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                      B
                    </div>
                    <div>
                      <p className="font-bold text-sm text-[#E63946] uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{boss.name}</p>
                      <p className="text-xs text-[#64748B]">{boss.car}</p>
                      <p className="text-xs text-[#475569] italic mt-0.5">"{boss.taunt}"</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#E63946] font-mono">{boss.et}s ET</span>
                    {bossCompleted && <Badge className="bg-[#00CC66]/15 text-[#00CC66] border-[#00CC66]/30 text-xs">Defeated</Badge>}
                    {isBossNext && !bossCompleted && (
                      <button
                        onClick={() => startTournamentRace(selectedTournament, selectedTournament.racers.length)}
                        className="btn-race-red btn-steel text-xs animate-engine-pulse"
                        data-testid="race-boss-btn"
                      >
                        Challenge Boss
                      </button>
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
