import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, userId } from '../lib/firebase';
import { generateId } from '../lib/utils';

const DATA_DOC_REF = doc(db, 'wealthguard', userId);

export function useAssets() {
  const [assets, setAssets] = useState([]);
  const [history, setHistory] = useState([]);
  const [budget, setBudget] = useState(8000000);
  const [loading, setLoading] = useState(true);
  
  // Use a ref to access latest assets inside interval/sync logic without triggering re-renders
  const assetsRef = useRef(assets);
  useEffect(() => { assetsRef.current = assets; }, [assets]);

  // Load data - Stable
  const loadData = useCallback(async () => {
    setLoading(true);
    let loadedAssets = [];
    let loadedHistory = [];
    let loadedBudget = 8000000;

    // 1. LocalStorage
    try {
      const localData = localStorage.getItem('wealthguard_state_v2');
      if (localData) {
        const parsed = JSON.parse(localData);
        loadedAssets = parsed.assets || [];
        loadedHistory = parsed.history || [];
        loadedBudget = parsed.budget || 8000000;
        setAssets(loadedAssets);
        setHistory(loadedHistory);
        setBudget(loadedBudget);
      }
    } catch (e) {
      console.error('Local load error', e);
    }

    // 2. Firebase
    try {
      const docSnap = await getDoc(DATA_DOC_REF);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.assets) loadedAssets = data.assets;
        if (data.history) loadedHistory = data.history;
        if (data.budget) loadedBudget = data.budget;
        
        // Ensure IDs
        loadedAssets.forEach(a => { if (!a.id) a.id = generateId(); });

        setAssets(loadedAssets);
        setHistory(loadedHistory);
        setBudget(loadedBudget);
        
        // Update local
        localStorage.setItem('wealthguard_state_v2', JSON.stringify({
          assets: loadedAssets,
          history: loadedHistory,
          budget: loadedBudget
        }));
      } else if (loadedAssets.length === 0) {
        // Defaults
        loadedAssets = [
          { id: generateId(), symbol: 'BTC', name: 'Bitcoin', type: 'crypto', qty: 0.01 },
          { id: generateId(), symbol: 'VND', name: 'VNDIRECT Stock', type: 'stock', qty: 100 },
          { id: generateId(), symbol: 'CASH', name: 'Cash Savings', type: 'cash', qty: 5000000 }
        ];
        setAssets(loadedAssets);
        setDoc(DATA_DOC_REF, { assets: loadedAssets, history: [], budget: 8000000 });
      }
    } catch (e) {
      console.error('Firebase load error', e);
    }
    
    setLoading(false);
    return loadedAssets; // Return for chaining
  }, []);

  // Sync Prices - Stable (no dependencies on state)
  const syncPrices = useCallback(async (currentAssets) => {
    const assetsToSync = currentAssets || assetsRef.current;
    if (!assetsToSync || assetsToSync.length === 0) return;

    console.log('🔄 Syncing prices...');
    // Create deep copy to avoid mutating ref directly if passed from ref
    const newAssets = assetsToSync.map(a => ({...a})); 
    let changed = false;

    const cryptoIdMap = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
      'SOL': 'solana', 'XRP': 'ripple', 'ADA': 'cardano', 'DOGE': 'dogecoin'
    };

    for (let asset of newAssets) {
        if (asset.type === 'cash') { asset.price = 1; continue; }
        if (asset.type === 'debt') { asset.price = asset.price || 0; continue; }

        try {
            let newPrice = asset.price;

            if (asset.type === 'crypto') {
                const coinId = cryptoIdMap[asset.symbol.toUpperCase()] || asset.symbol.toLowerCase();
                const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=vnd`);
                const data = await res.json();
                if (data[coinId]?.vnd) {
                    newPrice = data[coinId].vnd;
                }
            } else if (asset.type === 'stock') {
                const yahooSymbol = `${asset.symbol.toUpperCase()}.VN`;
                const proxyUrl = 'https://api.allorigins.win/raw?url=';
                const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
                
                const res = await fetch(proxyUrl + encodeURIComponent(targetUrl));
                const data = await res.json();
                
                if (data?.chart?.result?.[0]?.meta) {
                    const meta = data.chart.result[0].meta;
                    const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
                    if (price > 0) newPrice = price;
                }
            }
            
            if (newPrice !== asset.price) {
                asset.price = newPrice;
                changed = true;
            }
        } catch (e) {
            console.error(`Price fetch failed for ${asset.symbol}`, e);
        }
    }

    if (changed) {
      setAssets(newAssets);
      // Cache prices to local storage
      try {
        const localData = localStorage.getItem('wealthguard_state_v2');
        const parsed = localData ? JSON.parse(localData) : {};
        parsed.assets = newAssets;
        // Preserve other keys if they exist, or default them if creating fresh (though we expect data to exist)
        if (!parsed.history) parsed.history = [];
        if (!parsed.budget) parsed.budget = 8000000;
        
        localStorage.setItem('wealthguard_state_v2', JSON.stringify(parsed));
      } catch (e) {
        console.error('Cache update error', e);
      }
    }
  }, []);

  // Initial Load - Just load data, do not auto-sync prices
  useEffect(() => {
    loadData();
  }, [loadData]); 

  // Save changes
  const saveAssets = async (newAssets) => {
    setAssets(newAssets);
    const toSave = { assets: newAssets, history, budget };
    localStorage.setItem('wealthguard_state_v2', JSON.stringify(toSave));
    try {
      await setDoc(DATA_DOC_REF, toSave, { merge: true });
    } catch (e) {
      console.error('Save failed', e);
    }
    // Refresh prices for new assets
    syncPrices(newAssets);
  };

  return {
    assets,
    history,
    loading,
    saveAssets,
    refreshPrices: () => syncPrices(),
    totalNetWorth: assets.reduce((sum, a) => sum + (a.qty * (a.price || 0)), 0)
  };
}
