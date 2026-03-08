import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import axios from "axios";

const TIER_LABELS = { ebay: "eBay Special", rockauto: "RockAuto", performance: "Performance Shop" };
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
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Upgrade Shop</h1>
        <p className="text-gray-500 mb-4">You need a car first!</p>
        <Button onClick={() => navigate("/dealership")} className="btn-neon rounded-lg" data-testid="goto-dealership">Buy a Car</Button>
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

  const partKeys = Object.keys(partsCatalog);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in" data-testid="upgrade-shop-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Upgrade Shop</h1>
          <p className="text-gray-500 text-sm mt-1">Make it faster</p>
        </div>
        <span className="neon-text font-bold" data-testid="upgrade-cash">${player.cash?.toLocaleString()}</span>
      </div>

      {/* Car selector */}
      {playerCars.length > 1 && (
        <div className="flex gap-2 mb-6 flex-wrap" data-testid="car-selector">
          {playerCars.map((c, i) => (
            <button
              key={c.id}
              onClick={() => setSelectedCarId(c.id)}
              className={`px-3 py-1.5 text-xs rounded-full transition-all ${c.id === (selectedCarId || playerCars[0]?.id) ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'}`}
              data-testid={`select-car-${i}`}
            >
              {c.catalog.name}
            </button>
          ))}
        </div>
      )}

      {/* Selected car stats */}
      <Card className="game-card mb-6 neon-border" data-testid="selected-car-stats">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.catalog.name}</h2>
              <div className="flex gap-4 mt-2 text-sm">
                <span>HP: <span className="neon-text-red font-bold">{car.effective_stats.effectiveHP}</span></span>
                <span>ET: <span className="neon-text font-bold">{car.effective_stats.effectiveET}s</span></span>
                <span>MPH: <span className="font-bold" style={{ color: 'var(--neon-blue)' }}>{car.effective_stats.effectiveSpeed}</span></span>
              </div>
            </div>
            <div className="text-right text-xs text-gray-500">
              <div>Base ET: {car.catalog.quarterMile}s</div>
              <div className="neon-text">-{car.effective_stats.etReduction}s from upgrades</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Parts */}
      <div className="space-y-4">
        {partKeys.map(partKey => {
          const part = partsCatalog[partKey];
          const currentTier = upgrades[partKey];
          const currentTierIndex = currentTier ? TIER_ORDER.indexOf(currentTier) : -1;

          return (
            <Card key={partKey} className="game-card" data-testid={`part-${partKey}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{part.name}</h3>
                  {currentTier && (
                    <Badge className={`tier-${currentTier} text-xs`}>
                      {TIER_LABELS[currentTier]} Installed
                    </Badge>
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
                      <div key={tier} className={`rounded-lg p-3 border ${isInstalled ? 'border-emerald-500/40 bg-emerald-500/5' : isLower ? 'border-gray-800 bg-white/[0.02] opacity-40' : 'border-gray-800 bg-white/[0.02]'}`} data-testid={`tier-${partKey}-${tier}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded tier-${tier}`}>{TIER_LABELS[tier]}</span>
                          {tierData.price === 0 ? (
                            <span className="text-xs text-gray-500">Free</span>
                          ) : (
                            <span className={`text-xs font-bold ${canAfford ? 'text-white' : 'text-red-400'}`}>${tierData.price.toLocaleString()}</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{tierData.name}</p>
                        <div className="flex gap-2 text-xs text-gray-500 mb-3">
                          {tierData.et_reduction > 0 && <span className="neon-text">-{tierData.et_reduction}s ET</span>}
                          {tierData.speed_increase > 0 && <span style={{ color: 'var(--neon-blue)' }}>+{tierData.speed_increase} MPH</span>}
                          {tierData.hp_bonus > 0 && <span className="neon-text-red">+{tierData.hp_bonus} HP</span>}
                        </div>
                        <Button
                          size="sm"
                          disabled={isInstalled || isLower || !canAfford || !!upgrading}
                          onClick={() => handleUpgrade(partKey, tier)}
                          className={`w-full text-xs rounded ${isInstalled ? 'bg-emerald-500/10 text-emerald-400' : 'btn-neon'}`}
                          data-testid={`install-${partKey}-${tier}`}
                        >
                          {isUpgrading ? "Installing..." : isInstalled ? "Installed" : isLower ? "Lower Tier" : !canAfford ? "Can't Afford" : "Install"}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
