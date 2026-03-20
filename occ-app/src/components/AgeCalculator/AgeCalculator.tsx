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
    return (
        <div className="w-2/5 flex items-center space-x-4">
            <span className={"grow text-center italic font-bold"}>
                JUVENILE DOB AFTER: {
                    new Date(
                        new Date().getFullYear() - 18,
                        new Date().getMonth(),
                        new Date().getDate()
                    ).toLocaleDateString("en-US", {
                        month: "2-digit",
                        day: "2-digit",
                        year: "2-digit"
                    })
                }
            </span>
        </div>
    )
}