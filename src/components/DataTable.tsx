import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    flexRender,
} from '@tanstack/react-table';
import type {
    ColumnDef,
    FilterFn,
    SortingState,
    VisibilityState,
    ColumnFiltersState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, Settings, Filter, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { type InventoryItem, useAppStore } from '../store';

interface DataTableProps {
    data: InventoryItem[];
    searchTerm: string;
    onFilteredDataChange?: (data: InventoryItem[]) => void;
}

const advancedFilter: FilterFn<InventoryItem> = (row, columnId, filterValue): boolean => {
    const rowValue = row.getValue(columnId);
    if (!filterValue) return true;

    const val = filterValue.toString().trim();
    const numValue = Number(rowValue);

    const opMatch = val.match(/^(>=|<=|>|<|=|!=)\s*(-?\d+(\.\d+)?)$/);
    if (opMatch) {
        const op = opMatch[1];
        const target = Number(opMatch[2]);
        if (!isNaN(numValue)) {
            switch (op) {
                case '>': return numValue > target;
                case '<': return numValue < target;
                case '>=': return numValue >= target;
                case '<=': return numValue <= target;
                case '=': return numValue === target;
                case '!=': return numValue !== target;
                default: return false;
            }
        }
    }

    if (val.includes('..')) {
        const parts = val.split('..');
        if (parts.length === 2) {
            const min = Number(parts[0].trim());
            const max = Number(parts[1].trim());
            if (!isNaN(numValue) && !isNaN(min) && !isNaN(max)) {
                return numValue >= min && numValue <= max;
            }
        }
    }

    return rowValue?.toString().toLowerCase().includes(val.toLowerCase()) ?? false;
};

const HighlightText = React.memo(({ text, term1, term2 }: { text: string; term1?: string; term2?: string }) => {
    if (!text) return null;
    const terms = [term1, term2].filter(Boolean) as string[];
    if (terms.length === 0) return <>{text}</>;

    const escapedTerms = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp(`(${escapedTerms.join('|')})`, 'gi');
    const parts = text.split(regex);

    return (
        <>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <span key={i} className="font-bold px-0.5 rounded-sm ring-1 bg-blue-100 text-blue-700 ring-blue-200">{part}</span>
                ) : (
                    part
                )
            )}
        </>
    );
});

export const DataTable: React.FC<DataTableProps> = ({ data, searchTerm, onFilteredDataChange }) => {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [columnSizing, setColumnSizing] = useState({});
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const { themeColor, setThemeColor } = useAppStore();
    
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const tableContainerRef = useRef<HTMLDivElement>(null);

    // Load state from localStorage on mount
    useEffect(() => {
        if (data.length > 0) {
            const headersStr = Object.keys(data[0]).join(',');
            const savedState = localStorage.getItem('table-persistence-v2');
            if (savedState) {
                try {
                    const parsed = JSON.parse(savedState);
                    if (parsed.headersStr === headersStr) {
                        if (parsed.sorting) setSorting(parsed.sorting);
                        if (parsed.columnFilters) setColumnFilters(parsed.columnFilters);
                        if (parsed.columnVisibility) setColumnVisibility(parsed.columnVisibility);
                        if (parsed.columnSizing) setColumnSizing(parsed.columnSizing);
                    }
                } catch (e) {
                    console.error("Error loading state", e);
                }
            }
        }
    }, [data]);

    // Save state to localStorage when it changes
    useEffect(() => {
        if (data.length > 0) {
            const headersStr = Object.keys(data[0]).join(',');
            localStorage.setItem('table-persistence-v2', JSON.stringify({
                headersStr,
                sorting,
                columnFilters,
                columnVisibility,
                columnSizing
            }));
        }
    }, [data, sorting, columnFilters, columnVisibility, columnSizing]);

    // Close menus on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showColumnSelector && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setShowColumnSelector(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showColumnSelector]);

    // Generate columns dynamically from data keys
    const columns = useMemo<ColumnDef<InventoryItem>[]>(() => {
        if (data.length === 0) return [];
        const keys = Object.keys(data[0]);
        return keys.map(key => ({
            accessorKey: key,
            header: key,
            filterFn: advancedFilter,
            size: key.toLowerCase().includes('id') ? 80 : 150,
            cell: info => {
                const val = info.getValue();
                const strValue = val?.toString() || '-';
                const lowerKey = key.toLowerCase();
                
                // Get current filter value for this column
                const filterVal = info.column.getFilterValue() as string;

                if (lowerKey.includes('status') || lowerKey.includes('estado')) {
                    let badgeClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600';
                    const lowerVal = strValue.toLowerCase();
                    if (lowerVal.includes('activ') || lowerVal.includes('ok') || lowerVal.includes('stock')) badgeClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700';
                    else if (lowerVal.includes('pending') || lowerVal.includes('warn') || lowerVal.includes('bajo')) badgeClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700';
                    else if (lowerVal.includes('error') || lowerVal.includes('fail') || lowerVal.includes('agotado')) badgeClass = 'inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-100 text-red-700';
                    return <span className={badgeClass}><HighlightText text={strValue} term1={searchTerm} term2={filterVal} /></span>;
                }
                return <HighlightText text={strValue} term1={searchTerm} term2={filterVal} />;
            }
        }));
    }, [data, searchTerm]);

    const table = useReactTable({
        data,
        columns,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            columnSizing,
            globalFilter: searchTerm,
        },
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onColumnSizingChange: setColumnSizing,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        columnResizeMode: 'onChange',
        globalFilterFn: 'includesString',
    });

    const { rows } = table.getRowModel();

    // Notify parent of filtered data changes
    useEffect(() => {
        onFilteredDataChange?.(rows.map(row => row.original));
    }, [rows, onFilteredDataChange]);

    // Virtualization
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: () => 35,
        overscan: 20,
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="border-2 transition-all duration-500 flex flex-col overflow-hidden rounded-3xl shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] bg-white border-slate-300"
            style={{ height: '1700px' }}
        >
            <div className="px-5 py-2.5 border-b-2 flex justify-between items-center transition-colors duration-500 bg-slate-50 border-slate-300 shadow-sm relative z-20">
                <div className="flex items-center gap-3 font-semibold text-sm transition-colors duration-500 text-slate-800">
                    <div className="p-1.5 rounded-xl ring-1 transition-all duration-300 bg-blue-50 text-blue-600 ring-blue-100">
                        <Filter size={16} strokeWidth={2} />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm tracking-tight">Explorador de Datos</span>
                        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400 mt-0.5">
                            {rows.length} registros encontrados
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {columnFilters.length > 0 && (
                            <motion.button
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all shadow-sm bg-white text-blue-600 border-blue-200 hover:bg-blue-50"
                                onClick={() => table.resetColumnFilters()}
                            >
                                <X size={14} />
                                <span>Limpiar {columnFilters.length} {columnFilters.length === 1 ? 'filtro' : 'filtros'}</span>
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <div className="w-px h-6 mx-2 transition-colors bg-slate-200"></div>

                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            className={`p-1.5 rounded-lg border transition-all shadow-sm ${showColumnSelector ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'}`}
                            onClick={() => setShowColumnSelector(!showColumnSelector)}
                            title="Seleccionar Columnas"
                        >
                            <Settings size={16} strokeWidth={1.5} />
                        </button>
                        {showColumnSelector && (
                            <div className="absolute top-[110%] right-0 border shadow-2xl p-4 z-[100] min-w-[240px] rounded-2xl backdrop-blur-2xl transition-all duration-500 bg-white border-slate-200">
                                <h4 className="text-[10px] font-bold mb-3 uppercase tracking-widest text-slate-400">Columnas Visibles</h4>
                                <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                    {table.getAllLeafColumns().map(column => {
                                        return (
                                            <label key={column.id} className="flex items-center gap-3 text-sm cursor-pointer p-2 rounded-lg transition-colors hover:bg-slate-50">
                                                <input
                                                    type="checkbox"
                                                    checked={column.getIsVisible()}
                                                    onChange={column.getToggleVisibilityHandler()}
                                                    className="w-4 h-4 rounded focus:ring-blue-500 accent-blue-500 border-slate-300 bg-white"
                                                />
                                                <span className="truncate font-medium text-slate-700">{column.id}</span>
                                            </label>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto relative transition-colors duration-500 bg-white" ref={tableContainerRef}>
                <table className="w-full border-collapse table-fixed text-sm" style={{ minWidth: table.getTotalSize() }}>
                    <thead 
                        className="sticky top-0 z-10 shadow-xl border-b transition-colors duration-500"
                        style={{ backgroundColor: themeColor, borderColor: `${themeColor}cc` }}
                    >
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                <th 
                                    className="w-12 text-center relative align-top pt-2.5 border-b border-r transition-colors duration-500 text-white"
                                    style={{ backgroundColor: themeColor, borderColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">#</span>
                                </th>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        className="relative border-b border-r px-3 py-1.5 transition-colors duration-500 text-indigo-50 overflow-hidden"
                                        style={{ 
                                            width: header.getSize(), 
                                            maxWidth: header.getSize(),
                                            backgroundColor: themeColor,
                                            borderColor: 'rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        <div className="flex flex-col h-full gap-1">
                                            <div
                                                onClick={header.column.getToggleSortingHandler()}
                                                className={`flex items-center justify-between h-5 group/sort ${header.column.getCanSort() ? 'cursor-pointer' : ''}`}
                                            >
                                                <span className="truncate font-bold text-[10px] uppercase tracking-[0.15em] transition-colors text-white group-hover/sort:text-blue-200">
                                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                                </span>
                                                {header.column.getCanSort() && (
                                                    <ArrowUpDown 
                                                        size={12} 
                                                        className={header.column.getIsSorted() ? 'text-white' : 'text-indigo-300 opacity-0 group-hover/sort:opacity-100 transition-opacity'} 
                                                    />
                                                )}
                                            </div>

                                            {header.column.getCanFilter() && (
                                                <div className="flex items-center mt-1">
                                                    <div className="relative w-full flex items-center group/filter">
                                                        <Search 
                                                            size={12} 
                                                            strokeWidth={2.5} 
                                                            className="absolute left-2 text-slate-400 group-focus-within/filter:text-indigo-600 transition-colors pointer-events-none" 
                                                        />
                                                        <input
                                                            type="text"
                                                            className={`w-full text-[11px] border rounded-lg py-1 pl-6 pr-6 outline-none transition-all placeholder-slate-400 bg-white border-transparent focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 text-slate-800 shadow-sm ${header.column.getFilterValue() ? 'border-indigo-300 bg-indigo-50/90' : 'hover:bg-slate-50'}`}
                                                            placeholder="Filtrar..."
                                                            value={(header.column.getFilterValue() ?? '') as string}
                                                            onChange={e => header.column.setFilterValue(e.target.value)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <AnimatePresence>
                                                            {!!header.column.getFilterValue() && (
                                                                <motion.button
                                                                    initial={{ opacity: 0, scale: 0.8 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    exit={{ opacity: 0, scale: 0.8 }}
                                                                    transition={{ duration: 0.15 }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        header.column.setFilterValue('');
                                                                    }}
                                                                    className="absolute right-1.5 p-0.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                                                                >
                                                                    <X size={12} strokeWidth={2.5} />
                                                                </motion.button>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        {header.column.getCanResize() && (
                                            <div
                                                onMouseDown={header.getResizeHandler()}
                                                onTouchStart={header.getResizeHandler()}
                                                className={`absolute right-0 top-0 bottom-0 w-3 translate-x-1/2 cursor-col-resize z-20 flex items-center justify-center ${header.column.getIsResizing() ? 'opacity-100' : 'opacity-0 hover:opacity-100'} transition-opacity`}
                                            >
                                                <div className={`w-1 h-3/5 rounded-full ${header.column.getIsResizing() ? 'bg-white' : 'bg-indigo-400/50'}`}></div>
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: `${rowVirtualizer.getVirtualItems()[0].start}px` }}>
                                <td colSpan={table.getVisibleLeafColumns().length + 1} className="p-0 border-none" />
                            </tr>
                        )}
                        {rowVirtualizer.getVirtualItems().map((vRow) => {
                            const row = rows[vRow.index];
                            return (
                                <tr 
                                    key={row.id} 
                                    data-index={vRow.index} 
                                    ref={rowVirtualizer.measureElement} 
                                    className="relative z-0 group cursor-pointer hover-row-effect border-b border-slate-200/60"
                                >
                                    <td className="text-center border-r p-1 w-12 min-w-[48px] max-w-[48px] transition-colors border-slate-200/60 bg-slate-50/30 group-hover:bg-blue-200/40">
                                        <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-1 group-hover:scale-110 rounded-md text-[10px] font-mono font-bold transition-all duration-300 text-slate-400 group-hover:text-blue-700">
                                            {vRow.index + 1}
                                        </span>
                                    </td>
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id} className="px-4 py-3 border-r text-xs transition-colors border-slate-200/60 text-slate-700 group-hover:text-blue-900 truncate" style={{ width: cell.column.getSize(), maxWidth: cell.column.getSize() }}>
                                            <div className={`truncate ${typeof cell.getValue() === 'number' ? 'font-mono tracking-tight' : ''}`}>
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {rowVirtualizer.getVirtualItems().length > 0 && (
                            <tr style={{ height: `${rowVirtualizer.getTotalSize() - rowVirtualizer.getVirtualItems()[rowVirtualizer.getVirtualItems().length - 1].end}px` }}>
                                <td colSpan={table.getVisibleLeafColumns().length + 1} className="p-0 border-none" />
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {rows.length === 0 && (
                <div className="p-12 flex flex-col items-center justify-center flex-1 transition-colors duration-500 text-slate-400 bg-slate-50/50">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p className="text-lg font-medium text-slate-500">No se encontraron datos</p>
                    <p className="text-sm mt-1">Intenta ajustar los filtros o la búsqueda</p>
                </div>
            )}
            <div className="px-5 py-3 border-t backdrop-blur-sm text-[11px] font-medium flex justify-between shrink-0 transition-colors duration-500 border-slate-200/80 bg-slate-50/80 text-slate-500">
                <span className="uppercase tracking-wider">Vista Virtualizada</span>
                <span className="px-2 py-1 rounded-md border shadow-sm transition-colors bg-white border-slate-200 text-slate-700">{rows.length} registros</span>
            </div>

        </motion.div>
    );
};
