import { useEffect, useRef, useState } from "react";

export type ComboBoxProps = {
    options: {
        name: string;
        value: string;
    }[];
    onChange: (value: string) => void;
    className?: string;
    name: string;
};

export default function ComboBox({ options, onChange, className, name }: ComboBoxProps) {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [highlight, setHighlight] = useState(0);

    const filtered = options.filter(option =>
        option.name.toLowerCase().includes(query.toLowerCase())
    );

    const listRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        const el = listRef.current?.children[highlight] as HTMLElement | undefined;
        if (el) el.scrollIntoView({ block: 'nearest' });
    }, [isOpen, highlight]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // console.log(e.key, /^[a-zA-Z0-9 ]$/.test(e.key))
        // if (!isOpen && (/^[a-zA-Z0-9 ]$/.test(e.key) || e.key === 'Backspace')) setIsOpen(true);

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlight(h => Math.min(h + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlight(h => Math.max(h - 1, 0));
                break;
            case 'Enter':
            case 'Tab':
                if (isOpen && e.key === 'Enter') e.preventDefault();
                if (!isOpen) return;
                const item = filtered[highlight];
                if (item) {
                    setQuery(item.name);
                    onChange(item.value);
                }
            case 'Escape':
                setIsOpen(false);
                break;
        }
    }

    return (
        <div className={(className || '') + ' relative'}>
            <input
                value={query}
                autoComplete="off"
                onChange={e => {
                    setQuery(e.target.value);
                    setIsOpen(true);
                    setHighlight(0);
                }}
                onFocus={() => {setIsOpen(true); setHighlight(0)}}
                onBlur={() => setIsOpen(false)}
                onKeyDown={handleKeyDown}
                placeholder="Select Attorney"
                name={name}
                className="w-full h-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none
                            focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />

            { isOpen &&
                <div
                    ref={listRef}
                    className="absolute left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded shadow max-h-48 overflow-auto z-10"
                >
                    { filtered.length === 0 ? (
                        <div className="p2 text-gray-600 dark:text-gray-400">No results</div>
                    ) : (
                        filtered.map((item, i) => (
                            <div
                                key={item.value}
                                onMouseDown={() => {
                                    setQuery(item.name);
                                    onChange(item.value);
                                    setIsOpen(false);
                                }}
                                className={
                                    "p-2 cursor-pointer " +
                                    (i === highlight ? "bg-blue-100 dark:bg-blue-900" : "hover:bg-blue-50 dark:hover:bg-gray-700")
                                }
                            >
                                <span className="text-gray-900 dark:text-gray-100">
                                    {item.name}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            }
        </div>
    )
}