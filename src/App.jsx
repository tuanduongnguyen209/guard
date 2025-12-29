import { useState, useEffect } from 'react';
import { useAssets } from './hooks/useAssets';
import { useSpending } from './hooks/useSpending';
import { AssetList } from './components/AssetList';
import { BottomNav } from './components/BottomNav';
import { ManageAssetsModal } from './components/ManageAssetsModal';
import { SpendingView } from './components/SpendingView';
import { AnalyticsView } from './components/AnalyticsView';
import { formatCurrency } from './lib/utils';
import { Edit2, RefreshCw } from 'lucide-react';

function App() {
  const [view, setView] = useState('spending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { assets, history, saveAssets, totalNetWorth, refreshPrices } = useAssets();
  const { spending, filter, setFilter, addSpending, deleteSpending } = useSpending();

  // Background color logic based on budget/spending ratio
  // Standard budget is 8M VND
  const budget = 8000000;
  const spentThisMonth = spending
    .filter(s => s.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, x) => s + x.amt, 0);
  const ratio = spentThisMonth / budget;

  useEffect(() => {
    if (ratio > 0.8) {
      document.body.style.backgroundColor = '#fef2f2';
    } else {
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [ratio]);

  const handleAddTransaction = async (amt, cat, details, type, assetId) => {
    // 1. Log the transaction
    const success = await addSpending(amt, cat, details, type, assetId);
    if (!success) return;

    // 2. Update Asset Balance if source selected
    if (assetId) {
      const assetIndex = assets.findIndex(a => a.id === assetId);
      if (assetIndex > -1) {
        const newAssets = [...assets];
        const asset = { ...newAssets[assetIndex] };

        // Ensure numeric
        const currentQty = parseFloat(asset.qty || 0);
        const price = asset.price > 0 ? asset.price : 1;
        const qtyChange = parseFloat(amt) / price;

        if (type === 'income') {
          asset.qty = currentQty + qtyChange;
        } else {
          asset.qty = currentQty - qtyChange;
        }

        newAssets[assetIndex] = asset;
        saveAssets(newAssets);
      }
    }
  };

  const handleDeleteTransaction = async (id) => {
    const tx = spending.find(s => s.id === id);
    if (!tx) return;

    await deleteSpending(id);

    // Revert balance if linked
    if (tx.assetId) {
      const assetIndex = assets.findIndex(a => a.id === tx.assetId);
      if (assetIndex > -1) {
        const newAssets = [...assets];
        const asset = { ...newAssets[assetIndex] };

        const currentQty = parseFloat(asset.qty || 0);
        const price = asset.price > 0 ? asset.price : 1;
        const qtyChange = parseFloat(tx.amt) / price;

        // Inverse logic
        if (tx.type === 'income') {
          asset.qty = currentQty - qtyChange;
        } else {
          asset.qty = currentQty + qtyChange;
        }
        newAssets[assetIndex] = asset;
        saveAssets(newAssets);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshPrices();
    // Small artificial delay to show spinner if instant
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen relative font-sans text-slate-900">
      <header className="p-6 flex justify-between items-center animate-in slide-in-from-top-4 duration-500">
        <div>
          <h1 className="text-xl font-black tracking-tighter">WEALTHGUARD</h1>
          <p className={`text-[10px] uppercase font-bold tracking-widest transition-colors ${ratio > 0.8 ? 'text-red-500' : 'text-gray-500'}`}>
            {ratio > 0.8 ? "WARNING: SPENDING HIGH" : "Discipline is freedom."}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-white hover:bg-gray-50 border border-gray-100 p-2 rounded-full px-4 text-xs font-bold uppercase shadow-sm flex items-center gap-2 transition-transform active:scale-95"
        >
          <Edit2 size={12} /> Assets
        </button>
      </header>

      <main className="px-4">
        {view === 'home' && (
          <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 animate-in zoom-in-95 duration-500 relative">
              <button
                onClick={handleRefresh}
                className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors"
                aria-label="Refresh Prices"
              >
                <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
              <h2 className="text-xs font-bold text-gray-400 uppercase">Total Net Worth</h2>
              <div className="text-4xl font-black mt-1 tracking-tight">
                {formatCurrency(totalNetWorth)}
              </div>
            </div>

            <AssetList assets={assets} />
          </div>
        )}

        {view === 'spending' && (
          <SpendingView
            spending={spending}
            filter={filter}
            setFilter={setFilter}
            onAdd={handleAddTransaction}
            onDelete={handleDeleteTransaction}
            assets={assets}
          />
        )}

        {view === 'analytics' && (
          <AnalyticsView assets={assets} history={history} spending={spending} />
        )}
      </main>

      <ManageAssetsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assets={assets}
        onSave={saveAssets}
      />

      <BottomNav view={view} onViewChange={setView} />
    </div>
  );
}

export default App;
