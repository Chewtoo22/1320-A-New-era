import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <div className="neon-text text-2xl animate-pulse" style={{ fontFamily: "'Chakra Petch', sans-serif" }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-4" data-testid="main-menu">
      {/* Speed lines background */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className="speed-line" style={{
          top: `${10 + i * 12}%`, width: `${60 + i * 20}px`, opacity: 0.15,
          animationDelay: `${i * 0.3}s`, animationDuration: `${1.5 + i * 0.2}s`
        }} />
      ))}

      <div className="relative z-10 text-center max-w-xl w-full animate-fade-in">
        {/* Title */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-wider mb-2 neon-text" style={{ fontFamily: "'Chakra Petch', sans-serif" }} data-testid="game-title">
          TURBO<br/>SHOWDOWN
        </h1>
        <p className="text-sm sm:text-base text-gray-500 mb-12 tracking-widest uppercase">Quarter Mile Legends</p>

        {player ? (
          <div className="space-y-4 animate-fade-in">
            <p className="text-gray-400 text-base mb-2">Welcome back, <span className="neon-text">{player.username}</span></p>
            <p className="text-gray-500 text-sm mb-6">
              Cash: <span className="neon-text">${player.cash?.toLocaleString()}</span> | Record: {player.wins}W - {player.losses}L
            </p>
            <Button onClick={() => navigate("/garage")} className="btn-neon w-full max-w-xs h-12 text-base rounded-lg" data-testid="continue-btn">
              Continue
            </Button>
            <div className="flex gap-3 justify-center mt-4">
              <Button variant="ghost" onClick={() => navigate("/dealership")} className="text-gray-400 hover:text-white text-sm" data-testid="menu-dealership-btn">
                Dealership
              </Button>
              <Button variant="ghost" onClick={() => navigate("/tournament")} className="text-gray-400 hover:text-white text-sm" data-testid="menu-tournament-btn">
                Tournaments
              </Button>
            </div>
          </div>
        ) : showNew ? (
          <div className="space-y-4 animate-fade-in max-w-xs mx-auto">
            <p className="text-gray-400 text-sm mb-4">Choose your racer name</p>
            <Input
              value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter username..."
              className="bg-transparent border-gray-700 text-center h-12 text-base"
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              maxLength={20}
              data-testid="username-input"
            />
            <Button onClick={handleCreate} disabled={creating} className="btn-neon w-full h-12 text-base rounded-lg" data-testid="create-player-btn">
              {creating ? "Creating..." : "Start Racing"}
            </Button>
            <Button variant="ghost" onClick={() => setShowNew(false)} className="text-gray-500 text-sm" data-testid="back-btn">
              Back
            </Button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            <Button onClick={() => setShowNew(true)} className="btn-neon w-full max-w-xs h-14 text-lg rounded-lg animate-pulse-glow" data-testid="new-game-btn">
              New Game
            </Button>
            <p className="text-gray-600 text-xs mt-8">Start with $20,000 | 17 cars to collect | 3 tournaments to conquer</p>
          </div>
        )}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
    </div>
  );
}
