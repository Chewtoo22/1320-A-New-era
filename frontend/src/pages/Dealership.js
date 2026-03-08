import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGame, API } from "@/App";
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
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-in" data-testid="dealership-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight uppercase" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
            Car Showroom
          </h1>
          <p className="text-[#64748B] text-sm mt-1">{catalog.length} cars available</p>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-bold text-amber-glow" data-testid="dealership-cash">
            ${player.cash?.toLocaleString()}
          </span>
          <button onClick={() => navigate("/garage")} className="btn-steel text-xs" data-testid="back-to-garage">
            Back to Garage
          </button>
        </div>
      </div>

      {/* Category Filter — Tab-style */}
      <div className="flex gap-1 mb-6 flex-wrap" data-testid="category-filter">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 ${
              filter === cat
                ? 'bg-[#1E293B] text-[#FFB300] border-[#FFB300]'
                : 'bg-transparent text-[#64748B] border-transparent hover:text-[#94A3B8] hover:bg-[#1E293B]/50'
            }`}
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            data-testid={`filter-${cat}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Car Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((car, i) => {
          const owned = ownedIds.has(car.id);
          return (
            <div key={car.id} className={`steel-card ${owned ? 'opacity-50' : ''}`} data-testid={`dealer-car-${i}`}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                    {car.category}
                  </span>
                  {owned && <Badge className="bg-[#FFB300]/15 text-[#FFB300] border-[#FFB300]/30 text-xs">Owned</Badge>}
                </div>

                {/* Color preview */}
                <div className="flex items-center justify-center h-14 mb-3 rounded-sm" style={{ background: `linear-gradient(135deg, ${car.color}18, ${car.color}05)` }}>
                  <div className="w-16 h-6 rounded-sm border border-white/10" style={{ backgroundColor: car.color, boxShadow: `0 0 12px ${car.color}33` }} />
                </div>

                <h3 className="font-bold text-sm mb-1 uppercase tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                  {car.name}
                </h3>
                <p className="text-xs text-[#64748B] mb-3 line-clamp-2">{car.description}</p>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  <div className="bg-[#0B0F19] rounded-sm p-1.5 border border-[#2D3748]">
                    <div className="text-[0.6rem] text-[#64748B] uppercase font-bold tracking-wider">HP</div>
                    <div className="font-bold text-sm text-[#E63946]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.hp}</div>
                  </div>
                  <div className="bg-[#0B0F19] rounded-sm p-1.5 border border-[#2D3748]">
                    <div className="text-[0.6rem] text-[#64748B] uppercase font-bold tracking-wider">ET</div>
                    <div className="font-bold text-sm text-[#00CC66]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.quarterMile}s</div>
                  </div>
                  <div className="bg-[#0B0F19] rounded-sm p-1.5 border border-[#2D3748]">
                    <div className="text-[0.6rem] text-[#64748B] uppercase font-bold tracking-wider">MPH</div>
                    <div className="font-bold text-sm text-[#00A3FF]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{car.trapSpeed}</div>
                  </div>
                </div>

                <button
                  onClick={() => !owned && player.cash >= car.price && setBuyTarget(car)}
                  disabled={owned || player.cash < car.price}
                  className={`w-full text-sm py-2 ${owned ? 'btn-steel opacity-50 cursor-default' : player.cash < car.price ? 'btn-steel opacity-40 cursor-not-allowed' : 'btn-amber btn-steel'}`}
                  data-testid={`buy-btn-${car.id}`}
                >
                  {owned ? "Owned" : `$${car.price.toLocaleString()}`}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Buy Confirmation Dialog */}
      <Dialog open={!!buyTarget} onOpenChange={() => setBuyTarget(null)}>
        <DialogContent className="bg-[#1A2332] border-[#2D3748]">
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wide" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              Buy <span className="text-[#F1F5F9] font-bold">{buyTarget?.name}</span> for <span className="text-amber-glow font-bold">${buyTarget?.price?.toLocaleString()}</span>?
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-3 my-4 text-center text-sm">
            <div className="bg-[#0B0F19] rounded-sm p-3 border border-[#2D3748]">
              <div className="text-[#64748B] text-xs uppercase font-bold">HP</div>
              <div className="font-bold text-[#E63946]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{buyTarget?.hp}</div>
            </div>
            <div className="bg-[#0B0F19] rounded-sm p-3 border border-[#2D3748]">
              <div className="text-[#64748B] text-xs uppercase font-bold">Quarter Mile</div>
              <div className="font-bold text-[#00CC66]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{buyTarget?.quarterMile}s</div>
            </div>
            <div className="bg-[#0B0F19] rounded-sm p-3 border border-[#2D3748]">
              <div className="text-[#64748B] text-xs uppercase font-bold">Trap Speed</div>
              <div className="font-bold text-[#00A3FF]" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{buyTarget?.trapSpeed} mph</div>
            </div>
          </div>
          <DialogFooter>
            <button onClick={() => setBuyTarget(null)} className="btn-steel text-sm" data-testid="cancel-buy-btn">Cancel</button>
            <button onClick={handleBuy} disabled={buying} className="btn-amber btn-steel text-sm" data-testid="confirm-buy-btn">
              {buying ? "Buying..." : "Buy Now"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
