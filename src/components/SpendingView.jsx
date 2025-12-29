import { useState, useEffect } from 'react';
import { CATEGORIES, CATEGORY_ICONS, formatCurrency } from '../lib/utils';
import { Filter, Trash2, ArrowRightLeft } from 'lucide-react';

export function SpendingView({ spending, filter, setFilter, onAdd, onDelete, assets = [] }) {
    const [type, setType] = useState('expense');

    const [selectedAssetId, setSelectedAssetId] = useState('');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        if (!isInitialized && assets.length > 0) {
            const defaultAsset = assets.find(a => a.type === 'cash');
            if (defaultAsset) {
                setSelectedAssetId(defaultAsset.id);
            }
            setIsInitialized(true);
        }
    }, [assets, isInitialized]);

    // Sort assets to put Cash/Bank type first if possible, or just default order
    // Filter out assets that might not be spendable if we wanted, but let's keep all.

    const handleAdd = (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const amt = fd.get('amt');
        const cat = fd.get('cat');
        const details = fd.get('details');
        const assetId = fd.get('assetId');

        if (amt && cat) {
            onAdd(amt, cat, details, type, assetId);
            e.target.reset();
            // Reset type or keep it? Keep it.
        }
    };

    return (
        <div className="space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`text-white p-6 rounded-[2rem] shadow-xl transition-colors duration-500 ${type === 'expense' ? 'bg-black' : 'bg-emerald-900'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-sm">
                        {type === 'expense' ? 'Log Expense' : 'Log Income'}
                    </h3>
                    <div className="bg-white/10 p-1 rounded-xl flex gap-1">
                        <button
                            onClick={() => setType('expense')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${type === 'expense' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Expense
                        </button>
                        <button
                            onClick={() => setType('income')}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-900 shadow-sm' : 'text-gray-400 hover:text-white'}`}
                        >
                            Income
                        </button>
                    </div>
                </div>

                <form onSubmit={handleAdd}>
                    <input
                        name="amt"
                        type="number"
                        placeholder="VND Amount..."
                        className="w-full bg-white/10 p-4 rounded-2xl mb-3 outline-none border border-white/10 text-white placeholder-white/40 focus:border-white/50 transition-colors"
                        required
                    />
                    <input
                        name="details"
                        type="text"
                        placeholder="Details (optional)..."
                        className="w-full bg-white/10 p-4 rounded-2xl mb-3 outline-none border border-white/10 text-white placeholder-white/40 focus:border-white/50 transition-colors text-sm"
                    />

                    <div className="w-full bg-white/10 p-4 rounded-2xl mb-3 text-sm flex flex-col gap-2 border border-white/10">
                        <label className="text-xs font-bold text-white/60 uppercase">
                            {type === 'expense' ? 'Pay From' : 'Deposit To'}
                        </label>
                        <select
                            name="assetId"
                            className="bg-transparent text-white outline-none w-full cursor-pointer appearance-none font-bold"
                            value={selectedAssetId}
                            onChange={(e) => setSelectedAssetId(e.target.value)}
                        >
                            <option value="" className="text-black">No Linked Asset</option>
                            {assets.filter(a => a.type === 'cash').map(a => (
                                <option key={a.id} value={a.id} className="text-black">
                                    {a.name} ({formatCurrency(a.qty)})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <select
                            name="cat"
                            className="flex-1 bg-white/10 p-4 rounded-2xl text-sm outline-none border border-white/10 text-white cursor-pointer hover:bg-white/20 transition-colors"
                        >
                            {CATEGORIES.map(c => <option key={c} value={c} className="text-black">{c}</option>)}
                        </select>
                        <button type="submit" className="bg-white text-black px-8 rounded-2xl font-bold active:scale-95 transition-transform hover:bg-gray-200">
                            {type === 'expense' ? 'Log' : 'Add'}
                        </button>
                    </div>
                </form>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="font-bold text-sm">Recent Activity</h3>
                    <div className="relative">
                        <Filter size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                        <select
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            className="text-xs bg-white border border-gray-200 rounded-lg py-2 pl-8 pr-2 font-bold outline-none appearance-none hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <option value="this_month">This Month</option>
                            <option value="last_month">Last Month</option>
                            <option value="last_3_months">Last 3 Months</option>
                            <option value="ytd">Year to Date</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    {spending.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">No activity in this period.</div>
                    ) : spending.map((s, i) => {
                        const isIncome = s.type === 'income';
                        return (
                            <div key={s.id || i} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-50 mb-2 shadow-sm group">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full text-lg ${isIncome ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                                        {CATEGORY_ICONS[s.cat] || (isIncome ? '💰' : '💸')}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">
                                            {s.cat}
                                            {s.details && <span className="font-normal text-gray-500 ml-1 text-xs break-all "> • {s.details}</span>}
                                        </p>
                                        <p className="text-[10px] text-gray-400">
                                            {s.date}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`font-black ${isIncome ? 'text-emerald-600' : 'text-red-500'}`}>
                                        {isIncome ? '+' : '-'}{formatCurrency(s.amt)}
                                    </div>
                                    <button
                                        onClick={() => onDelete && onDelete(s.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2 -mr-2 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                        aria-label="Delete item"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
