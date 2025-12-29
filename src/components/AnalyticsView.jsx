import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { formatCurrency } from '../lib/utils';
import { useMemo } from 'react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

export function AnalyticsView({ assets, history, spending }) {

    // --- History Chart ---
    const historyData = useMemo(() => {
        const hasHistory = history && history.length > 0;
        const labels = hasHistory ? history.map(h => h.date) : ['Today'];
        const dataPoints = hasHistory
            ? history.map(h => h.val)
            : [assets.reduce((sum, a) => sum + (a.qty * (a.price || 0)), 0)];

        return {
            labels,
            datasets: [{
                label: 'Net Worth',
                data: dataPoints,
                borderColor: '#000',
                backgroundColor: (context) => {
                    const ctx = context.chart.ctx;
                    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    return gradient;
                },
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#fff',
                pointBorderColor: '#000',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        };
    }, [history, assets]);

    const historyOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: 12,
                titleFont: { size: 13 },
                bodyFont: { size: 13, weight: 'bold' },
                callbacks: {
                    label: (ctx) => ' ' + formatCurrency(ctx.parsed.y)
                }
            }
        },
        scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: {
                border: { display: false },
                grid: { color: '#f3f4f6' },
                ticks: {
                    callback: v => (v / 1000000).toFixed(1) + 'M',
                    font: { size: 10 }
                }
            }
        }
    };

    // --- Allocation Chart ---
    const allocationData = useMemo(() => {
        const assetTypes = ['crypto', 'stock', 'cash', 'debt'];
        const typeLabels = ['Crypto', 'Stocks', 'Cash', 'Debt'];
        const typeColors = ['#f97316', '#2563eb', '#16a34a', '#dc2626'];
        const data = assetTypes.map(t =>
            assets.filter(a => a.type === t).reduce((sum, a) => sum + Math.abs(a.qty * (a.price || 0)), 0)
        );
        const hasData = assets.length > 0;

        return {
            labels: typeLabels,
            datasets: [{
                data: hasData ? data : [1],
                backgroundColor: hasData ? typeColors : ['#e5e7eb'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };
    }, [assets]);

    // --- Spending Chart ---
    const spendingDataChart = useMemo(() => {
        const cats = [...new Set(spending.map(s => s.cat))];
        const data = cats.map(c => spending.filter(s => s.cat === c).reduce((sum, s) => sum + s.amt, 0));
        const hasSpending = spending.length > 0;
        const colors = ['#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#f43f5e', '#10b981'];

        return {
            labels: hasSpending ? cats : ['No Expenses'],
            datasets: [{
                data: hasSpending ? data : [1],
                backgroundColor: hasSpending ? colors : ['#e5e7eb'],
                borderWidth: 0,
                hoverOffset: 10
            }]
        };
    }, [spending]);

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 11, weight: 'bold', family: 'Inter' } } },
            tooltip: {
                callbacks: {
                    label: (ctx) => ' ' + formatCurrency(ctx.parsed)
                }
            }
        }
    };

    return (
        <div className="space-y-4 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Net Worth Growth (Last 14 Days)</h3>
                <div className="relative h-[200px] w-full">
                    <Line data={historyData} options={historyOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Asset Allocation</h3>
                <div className="relative h-[200px] w-full flex justify-center">
                    <Doughnut data={allocationData} options={doughnutOptions} />
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase mb-4">Expense Breakdown</h3>
                <div className="relative h-[200px] w-full flex justify-center">
                    <Doughnut data={spendingDataChart} options={doughnutOptions} />
                </div>
            </div>
        </div>
    );
}
