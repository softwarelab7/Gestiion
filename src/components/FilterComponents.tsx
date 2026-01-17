import React, { useState, useEffect } from 'react';
import { Check, Calculator } from 'lucide-react';

interface RangeFilterProps {
    min: string | number;
    max: string | number;
    onChange: (range: { min: number | null; max: number | null }) => void;
    currentRange: { min: number | null; max: number | null };
}

export const RangeFilter: React.FC<RangeFilterProps> = ({ min, max, onChange, currentRange }) => {
    const [minValue, setMinValue] = useState(currentRange.min?.toString() || '');
    const [maxValue, setMaxValue] = useState(currentRange.max?.toString() || '');

    // Debounce changes
    useEffect(() => {
        const timer = setTimeout(() => {
            onChange({
                min: minValue === '' ? null : Number(minValue),
                max: maxValue === '' ? null : Number(maxValue)
            });
        }, 500);
        return () => clearTimeout(timer);
    }, [minValue, maxValue]);

    return (
        <div className="p-3 bg-white rounded-lg shadow-xl border border-slate-200 w-64">
            <div className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider flex items-center gap-1">
                <Calculator size={12} />
                Rango Numérico
            </div>
            <div className="flex items-center gap-2">
                <div className="flex-1">
                    <label className="text-[10px] text-slate-400 block mb-1">Mínimo</label>
                    <input
                        type="number"
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={`${min}`}
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                    />
                </div>
                <span className="text-slate-300 mt-4">-</span>
                <div className="flex-1">
                    <label className="text-[10px] text-slate-400 block mb-1">Máximo</label>
                    <input
                        type="number"
                        className="w-full text-sm border rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder={`${max}`}
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                    />
                </div>
            </div>
            {(minValue !== '' || maxValue !== '') && (
                <button
                    onClick={() => { setMinValue(''); setMaxValue(''); }}
                    className="mt-2 text-xs text-red-500 hover:text-red-700 underline w-full text-center"
                >
                    Limpiar Rango
                </button>
            )}
        </div>
    );
};

interface SelectFilterProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
}

export const SelectFilter: React.FC<SelectFilterProps> = ({ options, selected, onChange }) => {
    const [search, setSearch] = useState('');

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(search.toLowerCase())
    );

    const toggleOption = (option: string) => {
        const newSelected = selected.includes(option)
            ? selected.filter(s => s !== option)
            : [...selected, option];
        onChange(newSelected);
    };

    return (
        <div className="bg-white rounded-lg shadow-xl border border-slate-200 w-64 overflow-hidden flex flex-col max-h-[300px]">
            <div className="p-2 border-b border-slate-100">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Buscar..."
                        className="w-full text-sm border-none bg-slate-50 rounded px-2 py-1.5 focus:ring-0 focus:bg-slate-100 outline-none"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-1">
                {filteredOptions.length === 0 ? (
                    <div className="p-2 text-center text-xs text-slate-400">No hay coincidentes</div>
                ) : (
                    filteredOptions.map(option => (
                        <div
                            key={option}
                            onClick={() => toggleOption(option)}
                            className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm ${selected.includes(option) ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center ${selected.includes(option) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 bg-white'
                                }`}>
                                {selected.includes(option) && <Check size={10} className="text-white" />}
                            </div>
                            <span className="truncate">{option}</span>
                        </div>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div className="p-2 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
                    <span className="text-xs text-blue-600 font-medium">{selected.length} seleccionados</span>
                    <button
                        onClick={() => onChange([])}
                        className="text-xs text-red-500 hover:text-red-700"
                    >
                        Borrar
                    </button>
                </div>
            )}
        </div>
    );
};
