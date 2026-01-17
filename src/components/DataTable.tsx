import React, { useState, useMemo, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Settings } from 'lucide-react';
import { motion } from 'framer-motion';

interface DataTableProps {
    data: any[];
    searchTerm: string;
    onFilteredDataChange?: (data: any[]) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, searchTerm, onFilteredDataChange }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [columnFilters, setColumnFilters] = useState<{ [key: string]: string }>({});
    const [visibleColumns, setVisibleColumns] = useState<string[]>([]);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columnWidths, setColumnWidths] = useState<{ [key: string]: number }>({});
    const resizingRef = React.useRef<{ startX: number; startWidth: number; header: string } | null>(null);
    const settingsMenuRef = React.useRef<HTMLDivElement>(null);
    const parentRef = React.useRef<HTMLDivElement>(null);

    // Initialize visible columns when data changes
    React.useEffect(() => {
        if (data.length > 0) {
            setVisibleColumns(Object.keys(data[0]));
        }
    }, [data]);

    // Click outside handler for settings menu
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showColumnSelector && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowColumnSelector(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showColumnSelector]);

    const headers = useMemo(() => {
        if (data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    // Initialize default widths
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

    // Resize Handlers
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
        if (newWidth < 60) newWidth = 60; // Min width

        setColumnWidths(prev => ({
            ...prev,
            [header]: newWidth
        }));
    };

    const handleAutoFit = (header: string) => {
        // Find max length in visible data or header itself
        const maxLength = Math.max(
            ...filteredData.map(row => (row[header]?.toString() || '').length),
            header.length
        );

        // Estimation: 9px per character (monospace) + 32px padding
        // Min: 80px, Max: 600px
        const newWidth = Math.min(Math.max(maxLength * 9 + 32, 80), 600);

        setColumnWidths(prev => ({
            ...prev,
            [header]: newWidth
        }));
    };

    const handleResizeEnd = () => {
        resizingRef.current = null;
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
    };

    const filteredData = useMemo(() => {
        let result = [...data];

        if (Object.keys(columnFilters).length > 0) {
            result = result.filter(row => {
                return Object.entries(columnFilters).every(([key, value]) => {
                    if (!value) return true;
                    const cellValue = row[key]?.toString().toLowerCase() || '';
                    return cellValue.includes(value.toLowerCase());
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
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }



        return result;
    }, [data, searchTerm, sortConfig, columnFilters, visibleColumns]);

    // Notify parent of filtered data changes
    useEffect(() => {
        onFilteredDataChange?.(filteredData);
    }, [filteredData, onFilteredDataChange]);

    // Virtualizer
    const rowVirtualizer = useVirtualizer({
        count: filteredData.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 35, // Approximate row height
        overscan: 20,
    });

    const toggleColumn = (column: string) => {
        setVisibleColumns(prev =>
            prev.includes(column)
                ? prev.filter(c => c !== column)
                : [...prev, column]
        );
    };

    const handleColumnFilterChange = (column: string, value: string) => {
        setColumnFilters(prev => ({
            ...prev,
            [column]: value
        }));
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };


    // Helper to render cell content with potential badges
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
                <div style={{ display: 'flex', gap: '0.25rem' }}>
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
                                position: 'absolute',
                                top: '110%',
                                right: 0,
                                background: 'var(--bg-surface)',
                                border: '1px solid var(--border-subtle)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                padding: '1rem',
                                zIndex: 100,
                                minWidth: '200px',
                                borderRadius: '4px'
                            }}>
                                <h4 style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--slate-500)' }}>Columnas Visibles</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                    {headers.map(header => (
                                        <label key={header} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                checked={visibleColumns.includes(header)}
                                                onChange={() => toggleColumn(header)}
                                                style={{ accentColor: 'var(--blue-600)' }}
                                            />
                                            {header}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            <div
                className="table-wrapper"
                ref={parentRef}
                style={{
                    overflow: 'auto',
                    height: '100%',
                    position: 'relative' // Ensure context
                }}
            >
                {/* No inner div with height or transforms here, we simulate height inside the table */}
                <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'separate' }}>
                    <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--bg-header)' }}>
                        <tr>
                            <th style={{ width: '60px', textAlign: 'center' }}>#</th>
                            {visibleColumns.map((header) => (
                                <th key={header} style={{ width: columnWidths[header], minWidth: '80px', position: 'relative' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div
                                            onClick={() => handleSort(header)}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                        >
                                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{header}</span>
                                            {sortConfig?.key === header && (
                                                <ArrowUpDown size={12} className={sortConfig.direction === 'asc' ? 'text-blue-500' : 'text-slate-400'} />
                                            )}
                                        </div>
                                        {/* Inline Filter */}
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="text"
                                                value={columnFilters[header] || ''}
                                                onChange={(e) => handleColumnFilterChange(header, e.target.value)}
                                                placeholder="Filtrar..."
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(255,255,255,0.1)',
                                                    border: '1px solid var(--slate-700)',
                                                    color: 'var(--slate-200)',
                                                    fontSize: '0.7rem',
                                                    padding: '2px 4px',
                                                    borderRadius: '2px',
                                                    outline: 'none'
                                                }}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        </div>
                                    </div>
                                    <div
                                        className="resizer"
                                        onMouseDown={(e) => handleResizeStart(e, header)}
                                        onDoubleClick={() => handleAutoFit(header)}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}>
                                <td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 'none' }} />
                            </tr>
                        )}
                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                            const row = filteredData[virtualRow.index];
                            return (
                                <tr
                                    key={virtualRow.index}
                                    data-index={virtualRow.index}
                                    ref={rowVirtualizer.measureElement}
                                >
                                    <td style={{ textAlign: 'center', color: 'var(--slate-400)', borderRight: '1px solid var(--border-subtle)' }}>
                                        {virtualRow.index + 1}
                                    </td>
                                    {visibleColumns.map((header) => (
                                        <td key={`${virtualRow.index}-${header}`}>
                                            {renderCell(header, row[header])}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }}>
                                <td colSpan={visibleColumns.length + 1} style={{ padding: 0, border: 'none' }} />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {filteredData.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    NO SE ENCONTRARON DATOS
                </div>
            )}

            <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border-subtle)', background: 'var(--slate-50)', fontSize: '0.75rem', color: 'var(--slate-500)', display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
                <span>Vista: Virtualizada</span>
                <span>{filteredData.length} registros</span>
            </div>
        </motion.div >
    );
};
