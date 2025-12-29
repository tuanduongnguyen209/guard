import { Home, PieChart, CreditCard } from 'lucide-react';

export function BottomNav({ view, onViewChange }) {
    const btnClass = (active) =>
        `flex flex-col items-center justify-center py-2 px-6 rounded-2xl transition-all duration-300 ${active ? 'text-black' : 'text-gray-400 hover:text-gray-600'}`;

    // Helper for smoother text animation selection
    const labelClass = (active) =>
        `text-[10px] font-bold uppercase mt-1 tracking-wider ${active ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`;

    return (
        <nav className="fixed bottom-6 left-6 right-6 bg-white/90 backdrop-blur-md border border-gray-100 p-2 rounded-full shadow-2xl flex justify-between px-6 z-40">
            <button onClick={() => onViewChange('home')} className={btnClass(view === 'home')}>
                <Home size={24} strokeWidth={view === 'home' ? 2.5 : 2} />
                <span className={labelClass(view === 'home')}>Home</span>
            </button>
            <button onClick={() => onViewChange('spending')} className={btnClass(view === 'spending')}>
                <CreditCard size={24} strokeWidth={view === 'spending' ? 2.5 : 2} />
                <span className={labelClass(view === 'spending')}>Spend</span>
            </button>
            <button onClick={() => onViewChange('analytics')} className={btnClass(view === 'analytics')}>
                <PieChart size={24} strokeWidth={view === 'analytics' ? 2.5 : 2} />
                <span className={labelClass(view === 'analytics')}>Data</span>
            </button>
        </nav>
    );
}
