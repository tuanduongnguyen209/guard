import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, userId } from '../lib/firebase';
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns';

const SPENDING_COL_REF = collection(db, 'wealthguard', userId, 'spending');

export function useSpending() {
  /* Local Storage Key Helper */
  const getCacheKey = (range) => `wealthguard_spending_${range}`;

  const [spending, setSpending] = useState(() => {
    // Try to load 'this_month' cache for immediate display if that's the default
    const cached = localStorage.getItem(getCacheKey('this_month'));
    return cached ? JSON.parse(cached) : [];
  });
  const [filter, setFilterState] = useState('this_month'); // Renamed to avoid confusion with setFilter export
  const [loading, setLoading] = useState(false);
  
  // Ref to access current filter inside addSpending
  const filterRef = useRef(filter);
  useEffect(() => { filterRef.current = filter; }, [filter]);

  const getRange = (type) => {
    const now = new Date();
    let start, end = new Date();
    
    if (type === 'this_month') {
        start = startOfMonth(now);
        end = endOfMonth(now); // Ensure we cover the whole current month
    } else if (type === 'last_month') {
        start = startOfMonth(subMonths(now, 1));
        end = endOfMonth(subMonths(now, 1));
    } else if (type === 'last_3_months') {
        start = startOfMonth(subMonths(now, 3));
        end = endOfMonth(now);
    } else if (type === 'ytd') {
        start = startOfYear(now);
        end = endOfMonth(now);
    } else {
        start = new Date('2000-01-01');
        end = endOfMonth(now);
    }
    return { start, end };
  };

  const loadSpending = useCallback(async (rangeType) => {
    setLoading(true);
    setFilterState(rangeType);
    
    // Try load from cache first for this range
    const cached = localStorage.getItem(getCacheKey(rangeType));
    if (cached) {
        setSpending(JSON.parse(cached));
    }

    const { start, end } = getRange(rangeType);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    try {
        const q = query(
            SPENDING_COL_REF,
            where("date", ">=", startStr),
            where("date", "<=", endStr),
            orderBy("date", "desc")
        );
        
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        setSpending(data);
        localStorage.setItem(getCacheKey(rangeType), JSON.stringify(data));
    } catch (e) {
        console.error('Failed to load spending', e);
        // If fetch fails, we at least have the cached data (if any)
    }
    setLoading(false);
  }, []);

  const addSpending = async (amt, cat, details = '', type = 'expense', assetId = null) => {
    if (!amt) return;
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const newSpend = {
        amt: parseFloat(amt),
        cat,
        details: details || '',
        type,
        assetId: assetId || null,
        date: dateStr,
        createdAt: new Date().toISOString()
    };
    
    // Optimistic Update
    // Check if new item falls within current filter range
    const { start, end } = getRange(filterRef.current);
    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');
    
    // Add temporary item to UI immediately if it fits range
    const tempId = 'temp-' + Date.now();
    let addedToUi = false;
    
    if (dateStr >= startStr && dateStr <= endStr) {
        addedToUi = true;
        setSpending(prev => {
           const newState = [{ id: tempId, ...newSpend }, ...prev];
           // Update cache immediately
           localStorage.setItem(getCacheKey(filterRef.current), JSON.stringify(newState));
           return newState;
        });
    }

    try {
        const docRef = await addDoc(SPENDING_COL_REF, newSpend);
        
        if (addedToUi) {
            // Update the temp item with real ID
            setSpending(prev => {
                const newState = prev.map(item => 
                    item.id === tempId ? { ...item, id: docRef.id } : item
                );
                localStorage.setItem(getCacheKey(filterRef.current), JSON.stringify(newState));
                return newState;
            });
        }
        return true;
    } catch (e) {
        console.error('Add spending failed', e);
        alert("Error saving transaction to cloud! Check internet connection.");
        
        // Rollback on failure
        if (addedToUi) {
            setSpending(prev => {
                const newState = prev.filter(item => item.id !== tempId);
                localStorage.setItem(getCacheKey(filterRef.current), JSON.stringify(newState));
                return newState;
            });
        }
        return false;
    }
  };

  useEffect(() => {
    loadSpending('this_month');
  }, [loadSpending]);

  return {
    spending,
    filter,
    loading,
    setFilter: loadSpending,
    addSpending,
    deleteSpending: async (id) => {
        if (!id) return;
        
        // Optimistic Delete
        const { start, end } = getRange(filterRef.current);
        // Find item to revert if needed
        const itemToDelete = spending.find(s => s.id === id);
        
        setSpending(prev => {
            const newState = prev.filter(s => s.id !== id);
            localStorage.setItem(getCacheKey(filterRef.current), JSON.stringify(newState));
            return newState;
        });

        try {
            await deleteDoc(doc(SPENDING_COL_REF, id));
        } catch (e) {
            console.error('Delete failed', e);
            alert("Failed to delete expense");
            // Revert
            if (itemToDelete) {
                setSpending(prev => {
                    const newState = [...prev, itemToDelete].sort((a, b) => new Date(b.date) - new Date(a.date));
                    localStorage.setItem(getCacheKey(filterRef.current), JSON.stringify(newState));
                    return newState;
                });
            }
        }
    }
  };
}
