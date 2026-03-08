import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/App";
import { toast } from "sonner";

export default function MainMenu() {
  const { player, loading, createPlayer } = useGame();
  const [username, setUsername] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!username.trim()) { toast.error("Enter a username"); return; }
    setCreating(true);
    try {
      await createPlayer(username.trim());
      toast.success("Welcome to Turbo Showdown!");
      navigate("/dealership");
    } catch (e) {
      toast.error("Failed to create player");
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-amber-glow text-2xl animate-pulse" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
          LOADING...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" data-testid="main-menu">
      {/* Subtle grid background */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(to right, #F1F5F9 1px, transparent 1px), linear-gradient(to bottom, #F1F5F9 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFB300] opacity-[0.03] rounded-full blur-[120px]" />

      <div className="relative z-10 text-center max-w-xl w-full animate-fade-in">
        {/* Title */}
        <div className="mb-4">
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter uppercase text-amber-glow"
            style={{ fontFamily: "'Chakra Petch', sans-serif" }}
            data-testid="game-title"
          >
            TURBO<br/>SHOWDOWN
          </h1>
          <div className="flex items-center justify-center gap-3 mt-3">
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-transparent to-[#FFB300]" />
            <p className="text-xs sm:text-sm text-[#94A3B8] tracking-[0.25em] uppercase font-semibold" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
              Quarter Mile Legends
            </p>
            <div className="h-px flex-1 max-w-[80px] bg-gradient-to-l from-transparent to-[#FFB300]" />
          </div>
        </div>

        {/* Decorative line */}
        <div className="w-full max-w-[300px] mx-auto h-[2px] bg-gradient-to-r from-transparent via-[#2D3748] to-transparent mb-10" />

        {player ? (
          <div className="space-y-4 animate-fade-in">
            <div className="steel-card p-6 max-w-sm mx-auto">
              <p className="text-[#94A3B8] text-sm mb-1">Welcome back</p>
              <p className="text-xl font-bold text-amber-glow" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>{player.username}</p>
              <div className="flex justify-center gap-6 mt-3 text-sm">
                <span className="text-[#94A3B8]">Cash: <span className="text-amber-glow font-bold">${player.cash?.toLocaleString()}</span></span>
                <span className="text-[#94A3B8]">{player.wins}W - {player.losses}L</span>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={() => navigate("/garage")} className="btn-amber btn-steel btn-lg animate-engine-pulse" data-testid="continue-btn">
                Continue
              </button>
            </div>
            <div className="flex gap-4 justify-center mt-4">
              <button onClick={() => navigate("/dealership")} className="text-[#64748B] hover:text-[#F1F5F9] text-sm transition-colors" data-testid="menu-dealership-btn">
                Showroom
              </button>
              <button onClick={() => navigate("/tournament")} className="text-[#64748B] hover:text-[#F1F5F9] text-sm transition-colors" data-testid="menu-tournament-btn">
                Race Track
              </button>
            </div>
          </div>
        ) : showNew ? (
          <div className="space-y-4 animate-fade-in max-w-sm mx-auto">
            <div className="steel-card p-6">
              <p className="text-[#94A3B8] text-sm mb-4 uppercase tracking-wider" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>
                Choose Your Racer Name
              </p>
              <input
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username..."
                className="w-full bg-[#0B0F19] border border-[#2D3748] text-center h-12 text-base text-[#F1F5F9] rounded-sm px-4 focus:border-[#FFB300] focus:ring-1 focus:ring-[#FFB300] outline-none font-mono"
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                maxLength={20}
                data-testid="username-input"
              />
            </div>
            <button onClick={handleCreate} disabled={creating} className="btn-amber btn-steel btn-lg w-full max-w-sm" data-testid="create-player-btn">
              {creating ? "Creating..." : "Start Racing"}
            </button>
            <button onClick={() => setShowNew(false)} className="text-[#64748B] text-sm hover:text-[#94A3B8] transition-colors" data-testid="back-btn">
              Back
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setShowNew(true)} className="btn-amber btn-steel btn-lg animate-engine-pulse" data-testid="new-game-btn">
              New Game
            </button>
            <p className="text-[#475569] text-xs mt-8 tracking-wider">
              Start with $20,000 | 17 cars to collect | 3 tournaments to conquer
            </p>
          </div>
        )}
      </div>

      {/* Bottom accent */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFB300]/20 to-transparent" />
    </div>
  );
}
