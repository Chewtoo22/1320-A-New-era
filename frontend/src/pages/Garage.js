import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function CarStatBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-gray-500 w-12">{label}</span>
      <div className="stat-bar flex-1">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, backgroundColor: color || 'var(--neon-green)' }} />
      </div>
      <span className="text-gray-400 w-12 text-right">{value}</span>
    </div>
  );
}

export default function Garage() {
  const { player, playerCars, selectedCarId, setSelectedCarId, refreshCars } = useGame();
  const navigate = useNavigate();

  useEffect(() => {
    if (!player) navigate("/");
  }, [player, navigate]);

  useEffect(() => {
    if (player) refreshCars();
  }, [player, refreshCars]);

  if (!player) return null;

  const selectedCar = playerCars.find(c => c.id === selectedCarId);

  const handleQuickRace = () => {
    if (!selectedCar) { toast.error("Select a car first!"); return; }
    const et = selectedCar.effective_stats.effectiveET;
    let difficulty;
    if (et > 13) difficulty = 'easy';
    else if (et > 11) difficulty = 'medium';
    else difficulty = 'hard';

    const opponents = [
      { name: "Random Racer", car: "Mystery Car", et: et + (Math.random() * 1.5 - 0.5), trap: selectedCar.effective_stats.effectiveSpeed + Math.floor(Math.random() * 10 - 5), car_color: "#888888", bodyType: "sports" },
    ];
    const opp = opponents[0];
    navigate("/race", { state: { opponent: opp, raceType: "quick", prize: difficulty === 'easy' ? 500 : difficulty === 'medium' ? 750 : 1000 } });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in" data-testid="garage-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Your Garage</h1>
          <p className="text-gray-500 text-sm mt-1">{playerCars.length} {playerCars.length === 1 ? 'car' : 'cars'} owned</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/dealership")} className="btn-neon rounded-lg" data-testid="goto-dealership-btn">Buy Cars</Button>
          <Button onClick={handleQuickRace} className="btn-neon-red rounded-lg px-6" data-testid="quick-race-btn">Quick Race</Button>
        </div>
      </div>

      {playerCars.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg mb-4">Your garage is empty</p>
          <Button onClick={() => navigate("/dealership")} className="btn-neon rounded-lg" data-testid="first-car-btn">Buy Your First Car</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {playerCars.map((car, i) => (
            <Card
              key={car.id}
              className={`game-card cursor-pointer ${selectedCarId === car.id ? 'game-card-selected' : ''}`}
              onClick={() => setSelectedCarId(car.id)}
              data-testid={`car-card-${i}`}
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.catalog.name}</h3>
                    <p className="text-xs text-gray-500">{car.catalog.category.toUpperCase()}</p>
                  </div>
                  {selectedCarId === car.id && <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">Selected</Badge>}
                </div>

                {/* Car color preview */}
                <div className="flex items-center justify-center h-16 mb-4 rounded" style={{ background: `linear-gradient(135deg, ${car.paint_color}22, ${car.paint_color}08)` }}>
                  <div className="w-20 h-8 rounded" style={{ backgroundColor: car.paint_color, boxShadow: `0 0 20px ${car.paint_color}44` }} />
                </div>

                <div className="space-y-1.5 mb-4">
                  <CarStatBar label="HP" value={car.effective_stats.effectiveHP} max={1200} color="var(--neon-red)" />
                  <CarStatBar label="ET" value={car.effective_stats.effectiveET} max={18} color="var(--neon-green)" />
                  <CarStatBar label="MPH" value={car.effective_stats.effectiveSpeed} max={180} color="var(--neon-blue)" />
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCarId(car.id); navigate("/upgrades"); }} className="btn-neon text-xs flex-1 rounded" data-testid={`upgrade-btn-${i}`}>Upgrade</Button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); setSelectedCarId(car.id); handleQuickRace(); }} className="btn-neon-red text-xs flex-1 rounded" data-testid={`race-btn-${i}`}>Race</Button>
                </div>

                {/* Show installed upgrades count */}
                {(() => {
                  const count = Object.values(car.upgrades || {}).filter(Boolean).length;
                  return count > 0 ? (
                    <p className="text-xs text-gray-600 mt-2 text-center">{count}/10 upgrades installed</p>
                  ) : null;
                })()}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
