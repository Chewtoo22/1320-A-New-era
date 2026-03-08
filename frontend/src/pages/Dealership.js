import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

const CATEGORIES = ["all", "compact", "jdm", "muscle", "truck", "suv", "euro", "exotic", "electric"];

export default function Dealership() {
  const { player, playerCars, buyCar } = useGame();
  const navigate = useNavigate();
  const [catalog, setCatalog] = useState([]);
  const [filter, setFilter] = useState("all");
  const [buyTarget, setBuyTarget] = useState(null);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    if (!player) { navigate("/"); return; }
    axios.get(`${API}/cars/catalog`).then(r => setCatalog(r.data));
  }, [player, navigate]);

  const ownedIds = new Set(playerCars.map(c => c.car_id));
  const filtered = filter === "all" ? catalog : catalog.filter(c => c.category === filter);

  const handleBuy = async () => {
    if (!buyTarget) return;
    setBuying(true);
    try {
      await buyCar(buyTarget.id);
      toast.success(`${buyTarget.name} added to your garage!`);
      setBuyTarget(null);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Purchase failed");
    }
    setBuying(false);
  };

  if (!player) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-fade-in" data-testid="dealership-page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Dealership</h1>
          <p className="text-gray-500 text-sm mt-1">{catalog.length} cars available</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="neon-text font-bold" data-testid="dealership-cash">${player.cash?.toLocaleString()}</span>
          <Button onClick={() => navigate("/garage")} variant="ghost" className="text-gray-400" data-testid="back-to-garage">Back to Garage</Button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-6 flex-wrap" data-testid="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 text-xs rounded-full transition-all capitalize ${filter === cat ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-white/5 text-gray-500 border border-transparent hover:text-gray-300'}`}
            data-testid={`filter-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((car, i) => {
          const owned = ownedIds.has(car.id);
          return (
            <Card key={car.id} className={`game-card ${owned ? 'opacity-50' : ''}`} data-testid={`dealer-car-${i}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Badge className="text-xs capitalize" variant="secondary">{car.category}</Badge>
                  {owned && <Badge className="bg-emerald-500/20 text-emerald-400 text-xs">Owned</Badge>}
                </div>

                <div className="flex items-center justify-center h-14 mb-3 rounded" style={{ background: `linear-gradient(135deg, ${car.color}22, ${car.color}08)` }}>
                  <div className="w-16 h-6 rounded" style={{ backgroundColor: car.color, boxShadow: `0 0 15px ${car.color}44` }} />
                </div>

                <h3 className="font-semibold text-sm mb-1" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.name}</h3>
                <p className="text-xs text-gray-500 mb-3 line-clamp-2">{car.description}</p>

                <div className="grid grid-cols-3 gap-2 text-center mb-3 text-xs">
                  <div className="bg-white/5 rounded p-1.5">
                    <div className="text-gray-500">HP</div>
                    <div className="font-bold">{car.hp}</div>
                  </div>
                  <div className="bg-white/5 rounded p-1.5">
                    <div className="text-gray-500">ET</div>
                    <div className="font-bold">{car.quarterMile}s</div>
                  </div>
                  <div className="bg-white/5 rounded p-1.5">
                    <div className="text-gray-500">MPH</div>
                    <div className="font-bold">{car.trapSpeed}</div>
                  </div>
                </div>

                <Button
                  onClick={() => setBuyTarget(car)}
                  disabled={owned || player.cash < car.price}
                  className={`w-full rounded text-sm ${owned ? '' : player.cash < car.price ? 'opacity-40' : 'btn-neon'}`}
                  data-testid={`buy-btn-${car.id}`}
                >
                  {owned ? "Owned" : `$${car.price.toLocaleString()}`}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!buyTarget} onOpenChange={() => setBuyTarget(null)}>
        <DialogContent className="bg-[#0e0e16] border-gray-800">
          <DialogHeader>
            <DialogTitle style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Confirm Purchase</DialogTitle>
            <DialogDescription>
              Buy <span className="text-white font-medium">{buyTarget?.name}</span> for <span className="neon-text">${buyTarget?.price?.toLocaleString()}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 my-4 text-center text-sm">
            <div className="bg-white/5 rounded p-2">
              <div className="text-gray-500 text-xs">HP</div>
              <div className="font-bold">{buyTarget?.hp}</div>
            </div>
            <div className="bg-white/5 rounded p-2">
              <div className="text-gray-500 text-xs">Quarter Mile</div>
              <div className="font-bold">{buyTarget?.quarterMile}s</div>
            </div>
            <div className="bg-white/5 rounded p-2">
              <div className="text-gray-500 text-xs">Trap Speed</div>
              <div className="font-bold">{buyTarget?.trapSpeed} mph</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setBuyTarget(null)} data-testid="cancel-buy-btn">Cancel</Button>
            <Button onClick={handleBuy} disabled={buying} className="btn-neon rounded" data-testid="confirm-buy-btn">
              {buying ? "Buying..." : "Buy Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
