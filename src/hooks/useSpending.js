import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, addDoc, deleteDoc, doc, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db, userId } from '../lib/firebase';
import { startOfMonth, endOfMonth, subMonths, startOfYear, format } from 'date-fns';

const SPENDING_COL_REF = collection(db, 'wealthguard', userId, 'spending');

export function useSpending() {
  const [spending, setSpending] = useState([]);
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
    
    // REMOVED LocalStorage check

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
        // REMOVED LocalStorage update
    } catch (e) {
        console.error('Failed to load spending', e);
        // User requested single source of truth: if fail, show empty/error
        alert("Failed to load transactions.");
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
    
    // REMOVED Optimistic Update & tempId logic

    try {
        const docRef = await addDoc(SPENDING_COL_REF, newSpend);
        
        // Single Source of Truth: We can either re-fetch or append strictly AFTER success.
        // Appending after success is safe and faster than full re-fetch.
        setSpending(prev => [{ id: docRef.id, ...newSpend }, ...prev]);
        return true;
    } catch (e) {
        console.error('Add spending failed', e);
        alert("Error saving transaction to cloud!");
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
        
        // REMOVED Optimistic Delete

        try {
            await deleteDoc(doc(SPENDING_COL_REF, id));
            // Update UI only after success
            setSpending(prev => prev.filter(s => s.id !== id));
        } catch (e) {
            console.error('Delete failed', e);
            alert("Failed to delete expense");
            // No revert needed because we didn't change state
        }
    }
  };
}
