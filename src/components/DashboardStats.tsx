import React, { useMemo } from 'react';
import { Package, DollarSign, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardStatsProps {
    data: any[];
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

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginTop: '1.5rem',
                width: '100%'
            }}
        >
            {/* Total Items Card */}
            <div className="stat-card" style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--slate-200)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: 'var(--blue-50)',
                    color: 'var(--blue-600)'
                }}>
                    <Package size={24} />
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>Total Items</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                        {stats.totalItems.toLocaleString()}
                    </h3>
                </div>
            </div>

            {/* Total Value Card - Only show if we found price data */}
            {stats.hasValueData && (
                <div className="stat-card" style={{
                    background: 'white',
                    padding: '1.25rem',
                    borderRadius: '12px',
                    border: '1px solid var(--slate-200)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{
                        padding: '0.75rem',
                        borderRadius: '10px',
                        background: 'var(--success-bg)',
                        color: 'var(--success-text)'
                    }}>
                        <DollarSign size={24} />
                    </div>
                    <div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>Valor Inventario</p>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                            {formatCurrency(stats.totalValue)}
                        </h3>
                    </div>
                </div>
            )}

            {/* Low Stock Card */}
            <div className="stat-card" style={{
                background: 'white',
                padding: '1.25rem',
                borderRadius: '12px',
                border: '1px solid var(--slate-200)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    padding: '0.75rem',
                    borderRadius: '10px',
                    background: stats.lowStockCount > 0 ? 'var(--danger-bg)' : 'var(--slate-100)',
                    color: stats.lowStockCount > 0 ? 'var(--danger-text)' : 'var(--slate-500)'
                }}>
                    <AlertTriangle size={24} />
                </div>
                <div>
                    <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', fontWeight: 500 }}>Stock Bajo</p>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--slate-900)', lineHeight: 1.2 }}>
                        {stats.lowStockCount.toLocaleString()}
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Items con {"<"} 5 unid.</p>
                </div>
            </div>
        </motion.div>
    );
};

