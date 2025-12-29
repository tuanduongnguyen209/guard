import { useState, useEffect } from 'react';
import { generateId } from '../lib/utils';
import { Trash2, Plus } from 'lucide-react';

export function ManageAssetsModal({ isOpen, onClose, assets, onSave }) {
    const [localAssets, setLocalAssets] = useState([]);

    // Sync state when modal opens
    useEffect(() => {
        if (isOpen) {
            setLocalAssets(JSON.parse(JSON.stringify(assets))); // Deep copy
        }
    }, [isOpen, assets]);

    if (!isOpen) return null;

    const updateAsset = (id, field, val) => {
        setLocalAssets(prev => prev.map(a =>
            a.id === id ? { ...a, [field]: val } : a
        ));
    };

    const handleTypeChange = (id, newType) => {
        setLocalAssets(prev => prev.map(a => {
            if (a.id !== id) return a;

            // Reset logic based on new type
            if (newType === 'cash') {
                return { ...a, type: newType, price: 1, qty: a.qty || 0 };
            } else if (newType === 'debt') {
                return { ...a, type: newType, qty: 1, price: a.price < 0 ? a.price : -Math.abs(a.price || 0) };
            } else {
                return { ...a, type: newType };
            }
        }));
    };

    const addAsset = () => {
        setLocalAssets([...localAssets, { id: generateId(), symbol: 'NEW', name: 'New Asset', type: 'crypto', qty: 0, price: 0 }]);
    };

    const remove = (id) => {
        setLocalAssets(prev => prev.filter(a => a.id !== id));
    };

    const handleSave = () => {
        // Final cleanup before save (ensure cash price is 1, debt qty is 1)
        const cleanAssets = localAssets.map(a => {
            if (a.type === 'cash') return { ...a, price: 1 };
            if (a.type === 'debt') return { ...a, qty: 1 };
            return a;
        });
        onSave(cleanAssets);
        onClose();
    };

    return (
        <div className="fixed inset-0 modal-bg z-50 flex items-end animate-in fade-in duration-300">
            <div className="bg-white w-full rounded-t-[3rem] p-8 space-y-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom duration-300">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-xl font-bold">Manage Assets</h2>
                    <button onClick={onClose} className="text-gray-400 font-bold text-lg p-2">✕</button>
                </div>

                <button onClick={addAsset} className="w-full bg-gray-100 text-black p-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                    <Plus size={18} /> Add New Asset
                </button>

                <div className="space-y-4">
                    {localAssets.map((a) => (
                        <div key={a.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                            <div className="flex justify-between mb-2">
                                <input
                                    className="font-bold uppercase bg-transparent outline-none w-24"
                                    value={a.symbol}
                                    onChange={e => updateAsset(a.id, 'symbol', e.target.value)}
                                    placeholder="SYM"
                                />
                                <button onClick={() => remove(a.id)} className="text-red-500"><Trash2 size={16} /></button>
                            </div>

                            <input
                                className="mb-2 w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none focus:border-black transition-colors"
                                value={a.name}
                                onChange={e => updateAsset(a.id, 'name', e.target.value)}
                                placeholder="Name"
                            />

                            <select
                                className="mb-2 w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none"
                                value={a.type}
                                onChange={e => handleTypeChange(a.id, e.target.value)}
                            >
                                <option value="crypto">Crypto</option>
                                <option value="stock">VN Stock</option>
                                <option value="cash">Cash</option>
                                <option value="debt">Debt/Loan</option>
                            </select>

                            <div className="grid grid-cols-2 gap-2">
                                {a.type === 'cash' ? (
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Amount (VND)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none"
                                            value={a.qty}
                                            onChange={e => updateAsset(a.id, 'qty', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                ) : a.type === 'debt' ? (
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Loan Amount (VND)</label>
                                        <input
                                            type="number"
                                            step="any"
                                            className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none"
                                            value={Math.abs(a.price || 0)}
                                            onChange={e => updateAsset(a.id, 'price', -Math.abs(parseFloat(e.target.value) || 0))}
                                            placeholder="Enter positive amount"
                                        />
                                        <p className="text-[10px] text-red-500 mt-1">This will be subtracted from Net Worth.</p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Qty</label>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full bg-white border border-gray-200 p-2 rounded-lg text-sm outline-none"
                                                value={a.qty}
                                                onChange={e => updateAsset(a.id, 'qty', parseFloat(e.target.value) || 0)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-400 uppercase font-bold block mb-1">Price (VND)</label>
                                            <input
                                                type="number"
                                                disabled
                                                className="w-full bg-gray-100 text-gray-500 border border-gray-200 p-2 rounded-lg text-sm outline-none"
                                                value={Math.round(a.price || 0)}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <button onClick={handleSave} className="w-full bg-black text-white p-4 rounded-2xl font-bold mt-4 hover:opacity-90 transition-opacity">
                    Save Changes
                </button>
            </div>
        </div>
    );
}
