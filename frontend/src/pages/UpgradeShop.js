import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import axios from "axios";

const TIER_LABELS = { ebay: "eBay", rockauto: "RockAuto", performance: "Performance" };
const TIER_ORDER = ["ebay", "rockauto", "performance"];

export default function UpgradeShop() {
  const { player, playerCars, selectedCar, selectedCarId, setSelectedCarId, upgradeCar } = useGame();
  const navigate = useNavigate();
  const [partsCatalog, setPartsCatalog] = useState(null);
  const [upgrading, setUpgrading] = useState(null);

  useEffect(() => {
    if (!player) { navigate("/"); return; }
    axios.get(`${API}/parts/catalog`).then(r => setPartsCatalog(r.data));
  }, [player, navigate]);

  if (!player || !partsCatalog) return null;

  if (playerCars.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4 uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Parts Shop</h1>
        <p className="text-[#64748B] mb-4">You need a car first!</p>
        <button onClick={() => navigate("/dealership")} className="btn-amber btn-steel" data-testid="goto-dealership">Buy a Car</button>
      </div>
    );
  }

  const car = selectedCar || playerCars[0];
  const upgrades = car?.upgrades || {};

  const handleUpgrade = async (partKey, tier) => {
    setUpgrading(`${partKey}-${tier}`);
    try {
      await upgradeCar(car.id, partKey, tier);
      toast.success(`Installed ${partsCatalog[partKey].tiers[tier].name}!`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Upgrade failed");
    }
    setUpgrading(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in" data-testid="upgrade-shop-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            Parts Shop
          </h1>
          <p className="text-[#64748B] text-sm mt-1">Upgrade your ride</p>
        </div>
        <span className="font-bold text-amber-glow" data-testid="upgrade-cash">${player.cash?.toLocaleString()}</span>
      </div>

      {/* Car Selector */}
      {playerCars.length > 1 && (
        <div className="flex gap-1 mb-6 flex-wrap" data-testid="car-selector">
          {playerCars.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelectedCarId(c.id)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                c.id === (selectedCarId || playerCars[0]?.id)
                  ? 'bg-[#1E293B] text-[#FFB300] border-[#FFB300]'
                  : 'text-[#64748B] border-transparent hover:text-[#94A3B8]'
              }`}
              style={{ fontFamily: "'Chakra Petch', sans-serif" }}
              data-testid={`select-car-${i}`}
            >
              {c.catalog.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected Car Stats Panel */}
      <div className="metal-panel p-5 mb-6" data-testid="selected-car-stats">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.catalog.name}</h2>
            <div className="flex gap-6 mt-2 text-sm">
              <span className="text-[#94A3B8]">HP: <span className="font-bold text-[#E63946]">{car.effective_stats.effectiveHP}</span></span>
              <span className="text-[#94A3B8]">ET: <span className="font-bold text-[#00CC66]">{car.effective_stats.effectiveET}s</span></span>
              <span className="text-[#94A3B8]">MPH: <span className="font-bold text-[#00A3FF]">{car.effective_stats.effectiveSpeed}</span></span>
            </div>
          </div>
          <div className="text-right text-xs text-[#64748B]">
            <div>Base ET: {car.catalog.quarterMile}s</div>
            <div className="text-[#00CC66]">-{car.effective_stats.etReduction}s from upgrades</div>
          </div>
        </div>
      </div>

      {/* Parts Grid */}
      <div className="space-y-4">
        {Object.keys(partsCatalog).map(partKey => {
          const part = partsCatalog[partKey];
          const currentTier = upgrades[partKey];
          const currentTierIndex = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;

          return (
            <div key={partKey} className="steel-card p-4" data-testid={`part-${partKey}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-sm uppercase tracking-wider" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  {part.name}
                </h3>
                {currentTier && (
                  <span className={`tier-${currentTier}`}>
                    {TIER_LABELS[currentTier]} Installed
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TIER_ORDER.map((tier, ti) => {
                  const tierData = part.tiers[tier];
                  const isInstalled = currentTier === tier;
                  const isLower = ti <= currentTierIndex;
                  const canAfford = player.cash >= tierData.price;
                  const isUpgrading = upgrading === `${partKey}-${tier}`;

                  return (
                    <div
                      key={tier}
                      className={`rounded-sm p-3 border transition-colors ${
                        isInstalled ? 'border-[#FFB300]/40 bg-[#FFB300]/5' :
                        isLower ? 'border-[#2D3748] bg-[#0B0F19]/50 opacity-40' :
                        'border-[#2D3748] bg-[#0B0F19]'
                      }`}
                      data-testid={`tier-${partKey}-${tier}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`tier-${tier}`}>{TIER_LABELS[tier]}</span>
                        {tierData.price === 0 ? (
                          <span className="text-xs text-[#64748B]">Free</span>
                        ) : (
                          <span className={`text-xs font-bold font-mono ${canAfford ? 'text-[#F1F5F9]' : 'text-[#E63946]'}`}>
                            ${tierData.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#94A3B8] mb-2">{tierData.name}</p>
                      <div className="flex gap-2 text-xs mb-3">
                        {tierData.et_reduction > 0 && <span className="text-[#00CC66]">-{tierData.et_reduction}s ET</span>}
                        {tierData.speed_increase > 0 && <span className="text-[#00A3FF]">+{tierData.speed_increase} MPH</span>}
                        {tierData.hp_bonus > 0 && <span className="text-[#E63946]">+{tierData.hp_bonus} HP</span>}
                      </div>
                      <button
                        disabled={isInstalled || isLower || !canAfford || !!upgrading}
                        onClick={() => handleUpgrade(partKey, tier)}
                        className={`w-full text-xs py-2 ${
                          isInstalled ? 'btn-steel bg-[#FFB300]/10 text-[#FFB300] cursor-default' :
                          isLower || !canAfford || !!upgrading ? 'btn-steel opacity-40 cursor-not-allowed' :
                          'btn-steel'
                        }`}
                        data-testid={`install-${partKey}-${tier}`}
                      >
                        {isUpgrading ? "Installing..." : isInstalled ? "Installed" : isLower ? "Lower Tier" : !canAfford ? "Can't Afford" : "Install"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
