import React, { useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Settings, Filter, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
                if (!newWidths['__index__']) newWidths['__index__'] = 32;
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
        if (newWidth < 20) newWidth = 20;
        setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
    };

    const handleResizeEnd = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
    };

    const handleAutoFit = (header: string) => {
        if (header === '__index__') {
            const maxLength = filteredData.length.toString().length;
            const newWidth = Math.max(maxLength * 8 + 16, 32);
            setColumnWidths(prev => ({ ...prev, [header]: newWidth }));
            return;
        }
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
            <div className="table-controls">
                <div className="toolbar-title">
                    <div style={{
                        background: 'var(--slate-100)',
                        padding: '0.4rem',
                        borderRadius: '6px',
                        display: 'flex',
                        color: 'var(--blue-600)'
                    }}>
                        <Filter size={16} />
                    </div>
                    <span>Explorador de Datos</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontWeight: 400, marginLeft: '0.25rem' }}>
                        ({filteredData.length} registros)
                    </span>
                </div>

                <div className="toolbar-actions">
                    <AnimatePresence>
                        {Object.keys(filters).length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="filter-badge-active"
                                onClick={() => setFilters({})}
                            >
                                <X size={14} />
                                <span>Limpiar {Object.keys(filters).length} {Object.keys(filters).length === 1 ? 'filtro' : 'filtros'}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div style={{ width: '1px', height: '20px', background: 'var(--slate-200)', margin: '0 0.5rem' }}></div>

                    <div style={{ position: 'relative' }} ref={settingsMenuRef}>
                        <button
                            className={`btn ${showColumnSelector ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            title="Seleccionar Columnas"
                            style={{ padding: '0.5rem' }}
                        >
                            <Settings size={18} />
                        </button>
                        {showColumnSelector && (
                            <div className="glass-panel" style={{
                                position: 'absolute', top: '110%', right: 0,
                                background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)',
                                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)', padding: '1rem', zIndex: 100,
                                minWidth: '220px', borderRadius: '8px'
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
                            <th style={{ width: '22px', textAlign: 'center', position: 'relative' }}>
                                #
                            </th>
                            {visibleColumns.map((header) => (
                                <th key={header} style={{ width: columnWidths[header], minWidth: '80px', position: 'relative' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '0.35rem', paddingBottom: '4px' }}>
                                        {/* Header Top: Title & Sort */}
                                        <div
                                            onClick={() => handleSort(header)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: '20px' }}
                                            className="group/sort"
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 600, fontSize: '0.7rem', color: 'white', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{header}</span>
                                            {sortConfig?.key === header ? (
                                                <ArrowUpDown size={11} className={sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-blue-400'} />
                                            ) : (
                                                <ArrowUpDown size={11} className="text-slate-600 opacity-0 group-hover/sort:opacity-100 transition-opacity" />
                                            )}
                                        </div>

                                        {/* Header Bottom: Filter Control */}
                                        <div style={{ display: 'flex', alignItems: 'center', height: '26px' }}>
                                            <div className="filter-input-wrapper">
                                                <input
                                                    type="text"
                                                    className="header-filter-input"
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
                                                <div className="filter-icon-header">
                                                    <Search size={10} />
                                                </div>
                                            </div>
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
                                    <td style={{
                                        textAlign: 'center',
                                        borderRight: '1px solid var(--border-subtle)',
                                        padding: '0.1rem',
                                        width: '22px',
                                        minWidth: '22px',
                                        maxWidth: '22px'
                                    }}>
                                        <span className="index-badge">{vRow.index + 1}</span>
                                    </td>
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
