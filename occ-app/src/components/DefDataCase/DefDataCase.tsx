import { FormEvent, useState } from "react";
import ComboBox from "../ComboBox";

export type DefDataCaseInfo = {
    court_code: string;
    lda_nbr: string;
    client_name: string;
    case_id: number;
    attorney_name: string;
    attorney_id: string;
};

export type DefDataAttorneyAssignment = {
    date_assigned: string;
    attorney_id: string;
    case_id: string;
    record_type: 'cases';
}

export type DefDataAttyLabel = {
    name: string;
    value: string;
};

export type DefDataCaseProps = {
    caseInfo: DefDataCaseInfo;
    attorneyList: DefDataAttyLabel[]
    assigned: () => void;
};

export default function DefDataCase({ caseInfo, attorneyList, assigned }: DefDataCaseProps) {
    const [selectedAttorney, setSelectedAttorney] = useState(caseInfo.attorney_id);
    const [assignedDate, setAssignedDate] = useState(new Date().toISOString().split('T')[0]);

    async function updateAttorney(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formBody = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()) as DefDataAttorneyAssignment;
        formBody.attorney_id = selectedAttorney;
        formBody.date_assigned = new Date(formBody.date_assigned).toLocaleDateString()
        console.log(formBody);
        await fetch('/api/assignAttorney', {
            method: 'POST',
            body: JSON.stringify(formBody)
        });
        assigned();
    }

    function dateKeys(e: React.KeyboardEvent<HTMLInputElement>) {
        switch (e.key) {
            case 't':
                setAssignedDate(new Date().toISOString().split('T')[0]);
                e.preventDefault();
                break;
            case '-':
                setAssignedDate(new Date(new Date(assignedDate).getTime() - (24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
                e.preventDefault();
                break;
            case '+':
            case '=':
                setAssignedDate(new Date(new Date(assignedDate).getTime() + (24 * 60 * 60 * 1000)).toISOString().split('T')[0]);
                e.preventDefault();
                break;
        }
    }

    return (
        <div className="w-full mx-auto my-4 bg-white dark:bg-gray-700 shadow-lg rounded-lg">
            <h3 className="p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-600 mb-1
                        shadow-md rounded-lg border-b border-gray-200 dark:border-gray-700 font-semibold">
                {caseInfo.court_code.slice(0, 3).toUpperCase()}:{caseInfo.lda_nbr} &ndash; {caseInfo.client_name}
            </h3>
            <form className="flex items-center justify-between p-1" onSubmit={updateAttorney}>
                <input className="max-w-1/4 h-10 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none
                                placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 
                                bg-white dark:bg-gray-800 text-gray-900 dark:text-white" type="date" name="date_assigned"
                    value={assignedDate}
                    onChange={e => setAssignedDate(e.target.value)}
                    onKeyDown={dateKeys} />
                <ComboBox className="grow mx-4" name="attorney_id" options={attorneyList} onChange={v => setSelectedAttorney(v)} />
                <button
                    type="submit" 
                    className="w-1/5 p-2 h-10
                        rounded-md font-semibold
                        bg-blue-600 text-white hover:bg-blue-700 transition duration-150
                        disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                >Update</button>
                <input type="hidden" name="case_id" value={caseInfo.case_id} />
            </form>
        </div>
    )
}