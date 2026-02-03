import { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

interface Position {
  id: string;
  token: string;
  entryPrice: number;
  currentPrice: number;
  amount: number;
  valueUsd: number;
  roi: number;
}

interface DashboardData {
  balanceUsd: number;
  totalEquity: number;
  positions: Position[];
  stats: {
    winRate: number;
    maxDrawdown: number;
  };
}

export default function SandboxDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Connects to the internal Next.js API
      const res = await fetch('/api/sandbox');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Live refresh
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return <div className="p-10 text-white">Loading Sandbox...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans">
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
            Owen Sniper Sandbox
          </h1>
          <p className="text-gray-500 text-sm">Paper Trading Simulation Environment</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-green-500 font-mono">LIVE FEED</span>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Equity" 
          value={`$${data.totalEquity.toLocaleString(undefined, {maximumFractionDigits: 2})}`} 
          icon={<DollarSign className="text-green-400" />}
        />
        <StatCard 
          title="Cash Balance" 
          value={`$${data.balanceUsd.toLocaleString(undefined, {maximumFractionDigits: 2})}`} 
          icon={<Activity className="text-blue-400" />}
        />
        <StatCard 
          title="Win Rate" 
          value={`${data.stats.winRate}%`} 
          icon={<TrendingUp className="text-purple-400" />}
        />
        <StatCard 
          title="Max Drawdown" 
          value={`-${data.stats.maxDrawdown.toFixed(2)}%`} 
          icon={<TrendingDown className="text-red-400" />}
        />
      </div>

      {/* Active Positions */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Active Positions</h2>
          <button onClick={fetchData} className="p-2 hover:bg-gray-800 rounded-full transition-colors">
            <RefreshCw size={18} />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="p-4">Token</th>
                <th className="p-4">Entry</th>
                <th className="p-4">Current</th>
                <th className="p-4">Value</th>
                <th className="p-4 text-right">ROI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {data.positions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 italic">
                    No active trades. Waiting for signals...
                  </td>
                </tr>
              ) : (
                data.positions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 font-mono text-blue-400">
                      {pos.token.slice(0, 4)}...{pos.token.slice(-4)}
                    </td>
                    <td className="p-4">${pos.entryPrice.toFixed(6)}</td>
                    <td className="p-4">${pos.currentPrice.toFixed(6)}</td>
                    <td className="p-4 font-bold">${pos.valueUsd.toFixed(2)}</td>
                    <td className={`p-4 text-right font-bold ${pos.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {pos.roi > 0 ? '+' : ''}{pos.roi.toFixed(2)}%
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 p-6 rounded-xl flex items-center gap-4">
      <div className="p-3 bg-gray-800 rounded-lg">{icon}</div>
      <div>
        <div className="text-gray-500 text-xs uppercase font-bold tracking-wider">{title}</div>
        <div className="text-2xl font-bold mt-1">{value}</div>
      </div>
    </div>
  );
}
