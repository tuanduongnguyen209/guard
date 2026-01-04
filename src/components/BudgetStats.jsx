import { TrendingUp, TrendingDown, Target, Zap, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

export function BudgetStats({
    totalSpent,
    avgPerDay,
    estimatedMonthly,
    budget,
    daysInMonth,
    daysElapsed
}) {
    const progress = Math.min((estimatedMonthly / budget) * 100, 100);
    const isOverBudget = estimatedMonthly > budget;
    const isWarning = estimatedMonthly >= budget * 0.7 && estimatedMonthly <= budget;
    const isGood = estimatedMonthly < budget * 0.7;

    // Determine status for theming
    const getStatusColors = () => {
        if (isOverBudget) {
            return {
                bg: 'bg-gradient-to-br from-red-500 to-rose-600',
                progressBg: 'bg-white/20',
                progressFill: 'bg-white',
                text: 'text-white',
                subtext: 'text-red-100',
                icon: AlertTriangle,
                iconBg: 'bg-white/20'
            };
        }
        if (isWarning) {
            return {
                bg: 'bg-gradient-to-br from-amber-500 to-orange-500',
                progressBg: 'bg-white/20',
                progressFill: 'bg-white',
                text: 'text-white',
                subtext: 'text-amber-100',
                icon: TrendingUp,
                iconBg: 'bg-white/20'
            };
        }
        return {
            bg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
            progressBg: 'bg-white/20',
            progressFill: 'bg-white',
            text: 'text-white',
            subtext: 'text-emerald-100',
            icon: Zap,
            iconBg: 'bg-white/20'
        };
    };

    const getMessage = () => {
        if (isOverBudget) {
            const overBy = estimatedMonthly - budget;
            return {
                title: "Time to slow down!",
                subtitle: `You're on track to exceed by ${formatCurrency(overBy)}`,
                emoji: "🚨"
            };
        }
        if (isWarning) {
            return {
                title: "Stay mindful!",
                subtitle: "You're approaching your monthly limit",
                emoji: "⚡"
            };
        }
        return {
            title: "You're doing great!",
            subtitle: "Keep up the discipline 💪",
            emoji: "🌟"
        };
    };

    const colors = getStatusColors();
    const message = getMessage();
    const StatusIcon = colors.icon;

    return (
        <div className={`${colors.bg} p-6 rounded-[2rem] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Header with message */}
            <div className="flex items-start justify-between mb-5 relative">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{message.emoji}</span>
                        <h3 className={`font-black text-lg ${colors.text}`}>{message.title}</h3>
                    </div>
                    <p className={`text-sm ${colors.subtext} font-medium`}>{message.subtitle}</p>
                </div>
                <div className={`${colors.iconBg} p-3 rounded-2xl`}>
                    <StatusIcon size={24} className={colors.text} />
                </div>
            </div>

            {/* Progress bar */}
            <div className="mb-5 relative">
                <div className="flex justify-between text-xs mb-2">
                    <span className={`font-bold ${colors.subtext}`}>Budget Usage</span>
                    <span className={`font-black ${colors.text}`}>{Math.round(progress)}%</span>
                </div>
                <div className={`h-3 ${colors.progressBg} rounded-full overflow-hidden backdrop-blur-sm`}>
                    <div
                        className={`h-full ${colors.progressFill} rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs mt-1">
                    <span className={colors.subtext}>0</span>
                    <span className={`${colors.subtext} font-semibold`}>{formatCurrency(budget)}</span>
                </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center transition-transform hover:scale-105 active:scale-95">
                    <p className={`text-[10px] uppercase font-bold ${colors.subtext} mb-1`}>Spent</p>
                    <p className={`text-sm font-black ${colors.text}`}>{formatCurrency(totalSpent)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center transition-transform hover:scale-105 active:scale-95">
                    <p className={`text-[10px] uppercase font-bold ${colors.subtext} mb-1`}>Avg/Day</p>
                    <p className={`text-sm font-black ${colors.text}`}>{formatCurrency(avgPerDay)}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center transition-transform hover:scale-105 active:scale-95">
                    <p className={`text-[10px] uppercase font-bold ${colors.subtext} mb-1`}>Estimated</p>
                    <p className={`text-sm font-black ${colors.text}`}>{formatCurrency(estimatedMonthly)}</p>
                </div>
            </div>

            {/* Days remaining indicator */}
            <div className={`mt-4 text-center text-xs ${colors.subtext}`}>
                <span className="font-semibold">{daysInMonth - daysElapsed} days</span> remaining this month
            </div>
        </div>
    );
}
