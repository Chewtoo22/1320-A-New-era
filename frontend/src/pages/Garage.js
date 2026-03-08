import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/App";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

function StatBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-[#64748B] w-10 uppercase tracking-wider font-bold" style={{ fontSize: '0.65rem' }}>{label}</span>
      <div className="stat-bar flex-1">
        <div className="stat-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-[#94A3B8] w-12 text-right font-mono">{value}</span>
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
    const opp = {
      name: "Random Racer",
      car: "Mystery Car",
      et: et + (Math.random() * 1.5 - 0.5),
      trap: selectedCar.effective_stats.effectiveSpeed + Math.floor(Math.random() * 10 - 5),
      car_color: "#64748B",
      bodyType: "sports",
      difficulty: et > 13 ? 'easy' : et > 11 ? 'medium' : 'hard'
    };
    const prize = et > 13 ? 500 : et > 11 ? 750 : 1000;
    navigate("/race", { state: { opponent: opp, raceType: "quick", prize } });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in" data-testid="garage-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            Your Garage
          </h1>
          <p className="text-[#64748B] text-sm mt-1">
            {playerCars.length} {playerCars.length === 1 ? 'car' : 'cars'} owned
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate("/dealership")} className="btn-steel text-sm" data-testid="goto-dealership-btn">
            Buy Cars
          </button>
          <button onClick={handleQuickRace} className="btn-race-red btn-steel text-sm" data-testid="quick-race-btn">
            Quick Race
          </button>
        </div>
      </div>

      {playerCars.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-[#64748B] text-lg mb-4">Your garage is empty</p>
          <button onClick={() => navigate("/dealership")} className="btn-amber btn-steel" data-testid="first-car-btn">
            Buy Your First Car
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playerCars.map((car, i) => (
            <div
              key={car.id}
              className={`steel-card bolted cursor-pointer p-5 ${selectedCarId === car.id ? 'steel-card-selected' : ''}`}
              onClick={() => setSelectedCarId(car.id)}
              data-testid={`car-card-${i}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                    {car.catalog.name}
                  </h3>
                  <p className="text-xs text-[#64748B] uppercase tracking-wider">{car.catalog.category}</p>
                </div>
                {selectedCarId === car.id && (
                  <Badge className="bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30 text-xs">Selected</Badge>
                )}
              </div>

              {/* Car color swatch */}
              <div className="flex items-center justify-center h-16 mb-4 rounded-sm" style={{ background: `linear-gradient(135deg, ${car.paint_color}18, ${car.paint_color}05)` }}>
                <div className="w-20 h-8 rounded-sm border border-white/10" style={{ backgroundColor: car.paint_color, boxShadow: `0 0 16px ${car.paint_color}33` }} />
              </div>

              {/* Stats */}
              <div className="space-y-1.5 mb-4">
                <StatBar label="HP" value={car.effective_stats.effectiveHP} max={1200} color="#E63946" />
                <StatBar label="ET" value={car.effective_stats.effectiveET} max={18} color="#00CC66" />
                <StatBar label="MPH" value={car.effective_stats.effectiveSpeed} max={180} color="#00A3FF" />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCarId(car.id); navigate("/upgrades"); }}
                  className="btn-steel text-xs flex-1 py-2"
                  data-testid={`upgrade-btn-${i}`}
                >
                  Upgrade
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelectedCarId(car.id); handleQuickRace(); }}
                  className="btn-race-red btn-steel text-xs flex-1 py-2"
                  data-testid={`race-btn-${i}`}
                >
                  Race
                </button>
              </div>

              {/* Upgrades count */}
              {(() => {
                const count = Object.values(car.upgrades || {}).filter(Boolean).length;
                return count > 0 ? (
                  <p className="text-xs text-[#475569] mt-3 text-center">{count}/10 upgrades installed</p>
                ) : null;
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
