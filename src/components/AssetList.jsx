import { formatCurrency } from '../lib/utils';

export function AssetCard({ asset, delay }) {
    const value = asset.qty * (asset.price || 0);
    const isDebt = asset.type === 'debt';

    // Tailwind classes map
    const colorClass = isDebt ? 'text-red-600' :
        asset.type === 'crypto' ? 'text-orange-500' :
            asset.type === 'stock' ? 'text-blue-600' :
                'text-green-600';

    return (
        <div
            className={`bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-fade-in hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ${isDebt ? 'debt-card' : ''}`}
            style={{ animationDelay: `${delay * 0.05}s` }}
        >
            <p className="text-[10px] font-bold text-gray-400 uppercase flex items-center gap-1">
                {isDebt && '⚠️ '}{asset.name} ({asset.symbol})
            </p>
            <p className={`font-bold ${colorClass}`}>
                {formatCurrency(value)}
            </p>
            <p className="text-xs text-gray-500">
                {asset.qty} × {formatCurrency(Math.abs(asset.price || 0))}{isDebt && ' (debt)'}
            </p>
        </div>
    );
}

export function AssetList({ assets }) {
    if (!assets.length) return <div className="text-center text-gray-400 py-10">No assets found.</div>;

    return (
        <div className="grid grid-cols-2 gap-3 pb-24">
            {assets.map((asset, i) => (
                <AssetCard key={asset.id} asset={asset} delay={i} />
            ))}
        </div>
    );
}
