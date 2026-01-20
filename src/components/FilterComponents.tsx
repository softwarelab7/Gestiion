import React, { useState, useEffect } from 'react';
import { Check, Search } from 'lucide-react';

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
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-72 p-4 overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.1em] flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                Rango Numérico
            </div>
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1.5 ml-0.5">Mínimo</label>
                    <input
                        type="number"
                        className="w-full text-sm border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder={`${min}`}
                        value={minValue}
                        onChange={(e) => setMinValue(e.target.value)}
                    />
                </div>
                <div className="text-slate-300 mt-6 select-none">/</div>
                <div className="flex-1">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1.5 ml-0.5">Máximo</label>
                    <input
                        type="number"
                        className="w-full text-sm border border-slate-200 bg-slate-50 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder={`${max}`}
                        value={maxValue}
                        onChange={(e) => setMaxValue(e.target.value)}
                    />
                </div>
            </div>
            {(minValue !== '' || maxValue !== '') && (
                <button
                    onClick={() => { setMinValue(''); setMaxValue(''); }}
                    className="mt-4 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors w-full py-1.5 rounded-lg hover:bg-red-50"
                >
                    Limpiar Filtro
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
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-72 overflow-hidden flex flex-col max-h-[350px]">
            <div className="p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Filtrar opciones..."
                        className="w-full text-xs border border-slate-200 bg-white rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
            <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                {filteredOptions.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 italic">No hay resultados</div>
                ) : (
                    filteredOptions.map(option => (
                        <div
                            key={option}
                            onClick={() => toggleOption(option)}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer text-xs font-medium transition-all ${selected.includes(option)
                                ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                                : 'hover:bg-slate-50 text-slate-600'
                                }`}
                        >
                            <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${selected.includes(option)
                                ? 'bg-blue-600 border-blue-600 shadow-sm'
                                : 'border-slate-300 bg-white'
                                }`}>
                                {selected.includes(option) && <Check size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <span className="truncate">{option}</span>
                        </div>
                    ))
                )}
            </div>
            {selected.length > 0 && (
                <div className="p-3 border-t border-slate-100 bg-slate-50/80 flex justify-between items-center">
                    <span className="text-[11px] text-blue-600 font-bold uppercase tracking-wider">{selected.length} seleccionados</span>
                    <button
                        onClick={() => onChange([])}
                        className="text-[11px] font-bold text-red-500 hover:text-red-600 px-2 py-1 rounded-md hover:bg-red-50 transition-colors"
                    >
                        Borrar
                    </button>
                </div>
            )}
        </div>
    );
};

interface TextFilterProps {
    value: string;
    onChange: (value: string) => void;
    placeHolder?: string;
}

export const TextFilter: React.FC<TextFilterProps> = ({ value, onChange, placeHolder = "Buscar..." }) => {
    return (
        <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-72 p-4 overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-[0.1em] flex items-center gap-2">
                <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                Filtro de Texto
            </div>
            <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                    type="text"
                    className="w-full text-sm border border-slate-200 bg-slate-50 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                    placeholder={placeHolder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    autoFocus
                />
            </div>
            {value && (
                <button
                    onClick={() => onChange('')}
                    className="mt-4 text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors w-full py-1.5 rounded-lg hover:bg-red-50"
                >
                    Limpiar Filtro
                </button>
            )}
        </div>
    );
};
