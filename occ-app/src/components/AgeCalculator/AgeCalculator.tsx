import { ChangeEvent, useState } from "react";

const dateInputStyles = [
    "w-1/2",
    "p-2",
    "border",
    "rounded-md",
    "focus:outline-none",
    "focus:ring-2",
    "focus:ring-blue-500",
    "bg-white",
    "text-gray-900",
    "placeholder-gray-500",
    "border-gray-300",
    "dark:bg-gray-800",
    "dark:text-white",
    "dark:placeholder-gray-400",
    "dark:border-gray-600",
    "scheme-light",
    "dark:scheme-dark",
    "dark:[&::-webkit-calendar-picker-indicator]:filter-none!",
    "dark:[&::-webkit-calendar-picker-indicator]:invert",
    "dark:[&::-webkit-calendar-picker-indicator]:brightness-125"
].join(' ');

export default function AgeCalculator() {
    const [age, setAge] = useState('');

    function updateAge(e: ChangeEvent<HTMLInputElement>) {
        const targetDate = new Date(`${e.target.value}T00:00:00`);
        const msPerYear = 1000 * 60 * 60 * 24 * 365.25;
        const deltaTime = Date.now() - targetDate.getTime();
        if (!e.target.value) setAge('');
        else setAge(Math.floor(deltaTime / msPerYear).toString());
    }

    function handleDelete(e: React.KeyboardEvent) {
        if (e.key === 'Delete') (e.target as HTMLInputElement).value = '';
        updateAge({ target: { value: (e.target as HTMLInputElement).value } } as ChangeEvent<HTMLInputElement>);
    }

    function handlePaste(e: React.ClipboardEvent) {
        if (isNaN(new Date(e.clipboardData.getData('text')).getTime())) return;
        (e.target as HTMLInputElement).value = new Date(e.clipboardData.getData('text')).toISOString().split('T')[0];
        updateAge({ target: { value: (e.target as HTMLInputElement).value } } as ChangeEvent<HTMLInputElement>);
    }

    return (
        <div className="w-2/5 flex items-center space-x-4">
            <input className={dateInputStyles}
                type="date" onChange={updateAge}
                onKeyDown={handleDelete}
                onPaste={handlePaste}
            />
            <span className={"grow text-center" + (parseInt(age) < 18 ? " text-red-600" : " text-green-600")}>
                {age && isFinite(parseInt(age)) && (parseInt(age) < 18 ? `${age}, JUVENILE` : `${age}, ADULT`)}
            </span>
        </div>
    )
}