import React, { useMemo } from 'react';
import { Package, DollarSign, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import { type InventoryItem } from '../store';

interface DashboardStatsProps {
    data: InventoryItem[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ data }) => {
    const stats = useMemo(() => {
        if (!data || data.length === 0) return null;

        const totalItems = data.length;
        let totalValue = 0;
        let lowStockCount = 0;

        // Auto-detect columns
        const headers = Object.keys(data[0]).map(h => h.toLowerCase());
        const priceKey = headers.find(h => h.includes('precio') || h.includes('price') || h.includes('costo') || h.includes('cost'));
        const stockKey = headers.find(h => h.includes('stock') || h.includes('existencia') || h.includes('cantidad') || h.includes('qty'));

        // Configurable threshold
        const LOW_STOCK_THRESHOLD = 5;

        data.forEach(row => {
            // Calculate Value
            if (priceKey && stockKey) {
                // Determine the actual keys (case sensitive match from original data)
                const originalPriceKey = Object.keys(row).find(k => k.toLowerCase() === priceKey);
                const originalStockKey = Object.keys(row).find(k => k.toLowerCase() === stockKey);

                if (originalPriceKey && originalStockKey) {
                    const price = parseFloat(String(row[originalPriceKey]).replace(/[^0-9.-]+/g, "")) || 0;
                    const stock = parseFloat(String(row[originalStockKey]).replace(/[^0-9.-]+/g, "")) || 0;
                    totalValue += price * stock;

                    if (stock < LOW_STOCK_THRESHOLD) {
                        lowStockCount++;
                    }
                }
            } else if (stockKey) {
                // Fallback if only stock is present for low stock count
                const originalStockKey = Object.keys(row).find(k => k.toLowerCase() === stockKey);
                if (originalStockKey) {
                    const stock = parseFloat(String(row[originalStockKey]).replace(/[^0-9.-]+/g, "")) || 0;
                    if (stock < LOW_STOCK_THRESHOLD) {
                        lowStockCount++;
                    }
                }
            }
        });

        return {
            totalItems,
            totalValue,
            lowStockCount,
            hasValueData: !!(priceKey && stockKey)
        };
    }, [data]);

    if (!stats) return null;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-CO', { // Using es-CO as a default spanish format, adjustable
            style: 'currency',
            currency: 'COP', // Could be dynamic or generic
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        show: { 
            opacity: 1, 
            y: 0, 
            scale: 1,
            transition: { 
                type: "spring" as const, 
                stiffness: 260, 
                damping: 20 
            } 
        }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full"
        >
            {/* Total Items Card */}
            <motion.div variants={itemVariants} className="relative p-6 rounded-3xl border transition-all duration-500 flex items-center gap-6 hover:-translate-y-1.5 group overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/50">
                <div className="relative p-4 rounded-2xl ring-1 transition-all duration-300 bg-blue-50 text-blue-600 ring-blue-100 group-hover:bg-blue-100">
                    <Package size={26} strokeWidth={1.5} />
                </div>
                <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-slate-500">Total de Artículos</p>
                    <h3 className="text-4xl font-bold leading-none font-mono tracking-tighter text-slate-900">
                        {stats.totalItems.toLocaleString()}
                    </h3>
                </div>
            </motion.div>

            {/* Total Value Card - Only show if we found price data */}
            {stats.hasValueData && (
                <motion.div variants={itemVariants} className="relative p-6 rounded-3xl border transition-all duration-500 flex items-center gap-6 hover:-translate-y-1.5 group overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/50">
                    <div className="relative p-4 rounded-2xl ring-1 transition-all duration-300 bg-emerald-50 text-emerald-600 ring-emerald-100 group-hover:bg-emerald-100">
                        <DollarSign size={26} strokeWidth={1.5} />
                    </div>
                    <div className="relative">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-slate-500">Valor Inventario</p>
                        <h3 className="text-4xl font-bold leading-none font-mono tracking-tighter text-slate-900">
                            {formatCurrency(stats.totalValue)}
                        </h3>
                    </div>
                </motion.div>
            )}

            {/* Low Stock Card */}
            <motion.div variants={itemVariants} className="relative p-6 rounded-3xl border transition-all duration-500 flex items-center gap-6 hover:-translate-y-1.5 group overflow-hidden bg-white border-slate-200 shadow-xl shadow-slate-200/50">
                <div className={`relative p-4 rounded-2xl ring-1 transition-all duration-300 ${stats.lowStockCount > 0 
                    ? 'bg-rose-50 text-rose-600 ring-rose-100 group-hover:bg-rose-100' 
                    : 'bg-slate-50 text-slate-400 ring-slate-100'}`}>
                    <AlertTriangle size={26} strokeWidth={1.5} />
                </div>
                <div className="relative">
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1.5 text-slate-500">Stock Bajo</p>
                    <div className="flex items-baseline gap-2">
                        <h3 className="text-4xl font-bold leading-none font-mono tracking-tighter text-slate-900">
                            {stats.lowStockCount.toLocaleString()}
                        </h3>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">unid {"<"} 5</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

