import React, { useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Settings, Filter, Search, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RangeFilter } from './FilterComponents';

interface DataTableProps {
    data: any[];
    searchTerm: string;
    onFilteredDataChange?: (data: any[]) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, searchTerm, onFilteredDataChange }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);
    const [filters, setFilters] = useState<Record<string, any>>({});

    const resizingRef = React.useRef<{ startX: number; startWidth: number; header: string } | null>(null);
    const settingsMenuRef = React.useRef<HTMLDivElement>(null);
    const filterMenuRef = React.useRef<HTMLDivElement>(null);
    const parentRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showColumnSelector && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowColumnSelector(false);
            }
            if (activeFilterCol && filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setActiveFilterCol(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSelector, activeFilterCol]);

    React.useEffect(() => {
        if (data.length > 0) {
            setVisibleColumns(Object.keys(data[0]));
        }
    }, [data]);

    const headers = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    React.useEffect(() => {
        if (headers.length > 0) {
            setColumnWidths(prev => {
                const newWidths = { ...prev };
                headers.forEach(h => {
                    if (!newWidths[h]) newWidths[h] = h.toLowerCase().includes('id') ? 80 : 150;
                });
                return newWidths;
            });
        }
    }, [headers]);

    const handleResizeStart = (e: React.MouseEvent, header: string) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.pageX;
        const startWidth = columnWidths[header] || 150;
        resizingRef.current = { startX, startWidth, header };
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = 'col-resize';
    };

    const handleResizeMove = (e: MouseEvent) => {
        if (!resizingRef.current) return;
        const { startX, startWidth, header } = resizingRef.current;
        const currentX = e.pageX;
        const diff = currentX - startX;
        let newWidth = startWidth + diff;
        if (newWidth < 60) newWidth = 60;
        setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
    };

    const handleResizeEnd = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
    };

    const handleAutoFit = (header: string) => {
        const maxLength = Math.max(
            ...filteredData.map(row => (row[header]?.toString() || '').length),
            header.length
        );
        const newWidth = Math.min(Math.max(maxLength * 9 + 32, 80), 600);
        setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
    };

    const filteredData = useMemo(() => {
        let result = [...data];
        if (Object.keys(filters).length > 0) {
            result = result.filter(row => {
                return Object.entries(filters).every(([key, filterValue]) => {
                    if (!filterValue) return true;
                    const rowValue = row[key];
                    if (filterValue.min !== undefined || filterValue.max !== undefined) {
                        const numVal = Number(rowValue);
                        if (isNaN(numVal)) return true;
                        if (filterValue.min !== null && numVal < filterValue.min) return false;
                        if (filterValue.max !== null && numVal > filterValue.max) return false;
                        return true;
                    }
                    if (Array.isArray(filterValue)) {
                        if (filterValue.length === 0) return true;
                        return filterValue.includes(rowValue?.toString());
                    }
                    const cellValue = rowValue?.toString().toLowerCase() || '';
                    return cellValue.includes(filterValue.toString().toLowerCase());
                });
            });
        }
        if (searchTerm) {
            result = result.filter((row) =>
                visibleColumns.some(
                    (key) => row[key] && row[key].toString().toLowerCase().includes(searchTerm.toLowerCase())
                )
            );
        }
        if (sortConfig) {
            result.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
                if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return result;
    }, [data, searchTerm, sortConfig, filters, visibleColumns]);

    useEffect(() => {
        onFilteredDataChange?.(filteredData);
    }, [filteredData, onFilteredDataChange]);

    const rowVirtualizer = useVirtualizer({
        count: filteredData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35,
        overscan: 20,
    });

    const toggleColumn = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column) ? prev.filter(c => c !== column) : [...prev, column]
        );
    };

    const getColumnType = (key: string) => {
        if (!data || data.length === 0) return 'text';
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('estado') || lowerKey.includes('status') || lowerKey.includes('cat')) return 'select';
        for (let i = 0; i < Math.min(data.length, 50); i++) {
            const val = data[i][key];
            if (val !== null && val !== undefined && val !== '') {
                if (typeof val === 'number') return 'number';
                return 'text';
            }
        }
        return 'text';
    };

    const getColumnStats = (key: string) => {
        if (!data) return { min: 0, max: 0, uniqueValues: [] };
        const type = getColumnType(key);
        if (type === 'number') {
            const numbers = data.map(r => Number(r[key])).filter(n => !isNaN(n));
            return { min: Math.min(...numbers), max: Math.max(...numbers), uniqueValues: [] };
        }
        if (type === 'select') {
            const values = new Set(data.map(r => r[key]?.toString()).filter(Boolean));
            return { min: 0, max: 0, uniqueValues: Array.from(values).sort() };
        }
        return { min: 0, max: 0, uniqueValues: [] };
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const renderCell = (key: string, value: any) => {
        const strValue = value?.toString() || '-';
        const lowerKey = key.toLowerCase();
        if (lowerKey.includes('status') || lowerKey.includes('estado')) {
            let badgeClass = 'badge badge-neutral';
            const lowerVal = strValue.toLowerCase();
            if (lowerVal.includes('activ') || lowerVal.includes('ok') || lowerVal.includes('stock')) badgeClass = 'badge badge-success';
            else if (lowerVal.includes('pending') || lowerVal.includes('warn') || lowerVal.includes('bajo')) badgeClass = 'badge badge-warning';
            else if (lowerVal.includes('error') || lowerVal.includes('fail') || lowerVal.includes('agotado')) badgeClass = 'badge badge-danger';
            return <span className={badgeClass}>{strValue}</span>;
        }
        return strValue;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="data-container"
            style={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}
        >
            <div className="table-controls" style={{ justifyContent: 'flex-end', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {Object.keys(filters).length > 0 && (
                        <button
                            className="btn btn-outline"
                            onClick={() => setFilters({})}
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                        >
                            <X size={14} className="mr-1" />
                            Limpiar Filtros
                        </button>
                    )}
                    <div style={{ position: 'relative' }} ref={settingsMenuRef}>
                        <button
                            className="btn btn-icon"
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            title="Seleccionar Columnas"
                        >
                            <Settings size={18} />
                        </button>
                        {showColumnSelector && (
                            <div className="glass-panel" style={{
                                position: 'absolute', top: '110%', right: 0,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)', padding: '1rem', zIndex: 100,
                                minWidth: '200px', borderRadius: '4px'
                            }}>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Columnas Visibles</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {headers.map(header => (
                                        <label key={header} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                            <input type="checkbox" checked={visibleColumns.includes(header)} onChange={() => toggleColumn(header)} style={{ accentColor: 'var(--blue-600)' }} />
                                            {header}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="table-wrapper" ref={parentRef} style={{ overflow: 'auto', height: '100%', position: 'relative' }}>
                <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'separate' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-header)' }}>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                            {visibleColumns.map((header) => (
                                <th key={header} style={{ width: columnWidths[header], minWidth: '80px', position: 'relative' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.35rem', paddingBottom: '4px' }}>
                                        {/* Header Top: Title & Sort */}
                                        <div
                                            onClick={() => handleSort(header)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: '20px' }}
                                            className="group/sort"
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, fontSize: '0.7rem', color: 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{header}</span>
                                            {sortConfig?.key === header ? (
                                                <ArrowUpDown size={11} className={sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-400'} />
                                            ) : (
                                                <ArrowUpDown size={11} className="text-slate-600 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        {/* Header Bottom: Filter Control */}
                                        <div style={{ display: 'flex', alignItems: 'center', height: '26px' }}>
                                            {(() => {
                                                const type = getColumnType(header);

                                                if (type === 'text' || type === 'select') {
                                                    return (
                                                        <div style={{ position: 'relative', width: '100%' }}>
                                                            <Search size={10} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-500)' }} />
                                                            <input
                                                                type="text"
                                                                style={{
                                                                    width: '100%',
                                                                    fontSize: '10px',
                                                                    background: 'rgba(30, 41, 59, 0.5)', // slate-800 with opacity
                                                                    border: '1px solid var(--slate-700)',
                                                                    borderRadius: '4px',
                                                                    color: 'var(--slate-200)',
                                                                    padding: '0.25rem 0.5rem 0.25rem 1.8rem',
                                                                    outline: 'none',
                                                                    height: '24px'
                                                                }}
                                                                placeholder="Filtrar..."
                                                                value={filters[header] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (!val) {
                                                                        const newF = { ...filters };
                                                                        delete newF[header];
                                                                        setFilters(newF);
                                                                    } else {
                                                                        setFilters(prev => ({ ...prev, [header]: val }));
                                                                    }
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <>
                                                        {filters[header] ? (
                                                            <div
                                                                className="badge badge-primary"
                                                                style={{
                                                                    padding: '0.125rem 0.5rem',
                                                                    fontSize: '9px',
                                                                    cursor: 'pointer',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'space-between',
                                                                    gap: '0.375rem',
                                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                                    color: 'var(--blue-100)',
                                                                    width: '100%',
                                                                    height: '24px',
                                                                    borderRadius: '4px'
                                                                }}
                                                                onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === header ? null : header); }}
                                                            >
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', overflow: 'hidden' }}>
                                                                    <Filter size={10} strokeWidth={2} />
                                                                    <span style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {typeof filters[header] === 'object' && 'min' in filters[header] ? 'Rango' : Array.isArray(filters[header]) ? `${filters[header].length}` : filters[header]}
                                                                    </span>
                                                                </div>
                                                                <X size={12} style={{ marginLeft: 'auto', cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); const newF = { ...filters }; delete newF[header]; setFilters(newF); }} />
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); setActiveFilterCol(activeFilterCol === header ? null : header); }}
                                                                style={{
                                                                    width: '100%',
                                                                    height: '24px',
                                                                    background: activeFilterCol === header ? 'var(--slate-800)' : 'transparent',
                                                                    border: activeFilterCol === header ? '1px solid var(--slate-600)' : '1px solid var(--slate-800)',
                                                                    borderRadius: '4px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '0.375rem',
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s ease'
                                                                }}
                                                            >
                                                                <Filter size={10} style={{ color: activeFilterCol === header ? 'var(--blue-400)' : 'var(--slate-500)' }} />
                                                                <span style={{ fontSize: '9px', fontWeight: 500, color: activeFilterCol === header ? 'var(--blue-400)' : 'var(--slate-500)', textTransform: 'uppercase' }}>Filtro</span>
                                                            </button>
                                                        )}
                                                        <AnimatePresence>
                                                            {activeFilterCol === header && (
                                                                <motion.div
                                                                    key={`filter-${header}`} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                                                    ref={filterMenuRef} style={{ position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: '8px' }} onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    {(() => {
                                                                        const stats = getColumnStats(header);
                                                                        if (type === 'number') return <RangeFilter min={stats.min} max={stats.max} currentRange={filters[header] || { min: null, max: null }} onChange={(range) => { if (range.min === null && range.max === null) { const newF = { ...filters }; delete newF[header]; setFilters(newF); } else setFilters(prev => ({ ...prev, [header]: range })); }} />;
                                                                        return null;
                                                                    })()}
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                    <div className="resizer" onMouseDown={(e) => handleResizeStart(e, header)} onDoubleClick={() => handleAutoFit(header)} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rowVirtualizer.getVirtualItems().length > 0 && <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}><td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 'none' }} /></tr>}
                        {rowVirtualizer.getVirtualItems().map((vRow) => {
                            const row = filteredData[vRow.index];
                            return (
                                <tr key={vRow.index} data-index={vRow.index} ref={rowVirtualizer.measureElement}>
                                    <td style={{ textAlign: 'center', color: 'var(--slate-400)', borderRight: '1px solid var(--border-subtle)' }}>{vRow.index + 1}</td>
                                    {visibleColumns.map((h) => <td key={`${vRow.index}-${h}`}>{renderCell(h, row[h])}</td>)}
                                </tr>
                            );
                        })}
                        {rowVirtualizer.getVirtualItems().length > 0 && <tr style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }}><td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 'none' }} /></tr>}
                    </tbody>
                </table>
            </div>
            {filteredData.length === 0 && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>NO SE ENCONTRARON DATOS</div>}
            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--slate-50)', fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                <span>Vista: Virtualizada</span>
                <span>{filteredData.length} registros</span>
            </div>
        </motion.div>
    );
};
