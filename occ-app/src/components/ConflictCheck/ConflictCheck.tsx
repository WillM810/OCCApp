"use client";

import { ConflictEmail, ConflictResponse } from "@/app/page";
import { useEffect, useRef, useState } from "react";
import ConflictViewer, { ConflictResult } from "../ConflictViewer";
import { v4 as uuidv4 } from "uuid";
// import crypto from "crypto";

export type ConflictCheckProps = {
    conflictResponse: ConflictResponse;
    conflictClientName: string;
    conflictEmails: ConflictEmail[];
    clear: () => void;
}

export default function ConflictCheck({ conflictResponse, conflictClientName, conflictEmails, clear }: ConflictCheckProps) {
    const { clientName, sbi, activeJson: conflictList } = conflictResponse;
    const [names, setNames] = useState('');
    const [conflictResults, setConflictResults] = useState([] as ConflictResult[]);
    const [barId, setBarId] = useState('');
    const [conflictBlobs, setConflictBlobs] = useState([] as { blob: string; duc: string; filename: string; }[]);

    const aopcRef = useRef<HTMLDivElement[]>([]);
    const detailsRef = useRef<HTMLDetailsElement[]>([]);

    useEffect(() => {
        function addName(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                detailsRef.current.forEach(i => i.open = false);
                return;
            }

            if (e.key === 'Enter' && (e.target as HTMLElement).tagName.toLowerCase() !== 'input') {
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'summary') e.preventDefault();
                searchPotentialConflicts();
                return;
            }
            
            if (e.key.toLowerCase() !== 'c') return;

            const sel = window.getSelection();
            if (!sel || sel.isCollapsed) return;

            const range = sel.getRangeAt(0);
            const target = aopcRef.current;

            if (!target) return;
            if (!target.some(r => r.contains(range.commonAncestorContainer))) return;

            e.preventDefault();
            const normalizedName = sel.toString()
                .trim()
                .replaceAll(/\n/g, ' ')
                .replaceAll(/\s+/g, ' ')
                .split(',')
                .reverse()
                .join(' ')
                .toUpperCase()
                .trim();
            if (!names.includes(normalizedName))
                setNames(`${normalizedName}\n${names.trim()}${(names.length) ? '\n' : ''}`);
        }

        document.addEventListener('keydown', addName);
        return () => document.removeEventListener('keydown', addName);
    });

    function toggleAopc(e: React.SyntheticEvent<HTMLDetailsElement>) {
        if (!e.nativeEvent.isTrusted) return;
        if (!e.currentTarget.open) return;
        detailsRef.current.forEach((ref) => {
            if (ref && ref !== e.currentTarget) ref.open = false;
        });
        e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    async function searchPotentialConflicts() {
        setConflictResults([]);
        if (!names.length) return;
        detailsRef.current.forEach(ref => { ref.open = false; });
        const searchList = names.trim().split('\n');
        const searchResult = await Promise.all(searchList.map(async name => {
            const itemResult = await fetch('/api/ddSearch', {
                method: 'POST',
                body: JSON.stringify({ criteria: name }),
                headers: {
                    'Content-type': 'application/json',
                },
            });

            return { name, cases: await itemResult.json() };
        }));

        setConflictResults(searchResult);
    }

    function forceTextCopy(e: React.ClipboardEvent) {
        const text = window.getSelection()?.toString().replaceAll(/\(\w{3}\)\s*/g, '');
        e.clipboardData.setData('text/plain', text!);
        e.preventDefault();
    }
    
    async function populateConflictSheet(conflictSheetArrayBuffer: Uint8Array<ArrayBuffer>, barId: string, duc: string) {
        const editedSheetRes = await fetch(`/api/editConflictSheet?barId=${barId}&court=${conflictResponse.court}`, {
            method: 'POST',
            body: JSON.stringify({
                barId,
                court: conflictResponse.court,
                conflictSheetArrayBuffer: Buffer.from(conflictSheetArrayBuffer).toString('base64'),
                duc
            })
        });
        const editedBlob = await editedSheetRes.blob()
        const editedBlobUrl = URL.createObjectURL(editedBlob);

        return editedBlobUrl;
    }

    async function processAllEmails() {
        const filename = `${uuidv4()}.eml`;
        const emlBlobRes = await fetch('/api/generateConflictEmail', {
            method: 'POST',
            body: JSON.stringify({
                barId,
                court: conflictResponse.court,
                cases: conflictEmails.map(email => ({
                    duc: email.duc,
                    conflictSheet: Buffer.from(email.conflictSheetArrayBuffer).toString('base64'),
                    sheetFilename: `${conflictClientName || clientName} - ${email.duc}.pdf`,
                    caseInfo: `${conflictClientName || clientName}: ${email.duc} – ${(conflictList.find(c => c.duc === email.duc)?.schedule || 'NONE')}`
                })),
                filename
            })
        });

        const emlBlob = await emlBlobRes.blob();
        setConflictBlobs([{ blob: URL.createObjectURL(emlBlob), filename, duc: '3232' }]);
    }

    function selectAOPC(i: number) {
        const det = detailsRef.current[i];
        if (det) det.open = true;
        const el = aopcRef.current[i];
        if (!el) return;

        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);

        const win = window.open('');
        win?.document.writeln(`<pre>${el.innerText}</pre>`);
        win?.print();
        win?.close();
    }
    
    return (
        <div className="w-full my-4 bg-white dark:bg-gray-700 shadow-lg rounded-lg">
            <h3 className="p-4 bg-linear-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-600 mb-1
                        shadow-md rounded-lg border-b border-gray-200 dark:border-gray-700 font-semibold
                        flex justify-between align-middle">
                { sbi && <span>{clientName} (SBI#: {sbi})</span>}
                <div className="flex justify-between align-middle space-x-1">
                    { sbi && <img
                        src='/icons/check.svg'
                        className="w-6 cursor-pointer"
                        onClick={searchPotentialConflicts}
                    /> }
                    { sbi && <img
                        src='/icons/reset.svg'
                        className="w-6 cursor-pointer"
                        onClick={() => { setNames(''); setConflictResults([]) }}
                    /> }
                    <img
                        src='/icons/clear.svg'
                        className="w-6 cursor-pointer"
                        onClick={() => { setNames(''); setConflictResults([]); clear() }}
                    />
                </div>
            </h3>
            
            { sbi && <textarea
                id="names"
                name="names"
                rows={4}
                placeholder="Potential Conflicts..."
                value={names}
                onChange={e => setNames(e.target.value)}
                onBlur={e => setNames(names.trim().toUpperCase() + (names.length ? '\n' : ''))}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100
                            focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            ></textarea> }
            <div className="w-full flex-col" onCopy={forceTextCopy}>
                { conflictList.map((conflictCase, i) =>
                    <details
                        key={i}
                        ref={el => {detailsRef.current[i] = el!}}
                        onToggle={toggleAopc}
                        className="max-h-full group border border-gray-300 dark:border-gray-700 rounded-xl"
                    >
                        <summary className="flex cursor-pointer items-center justify-between p-4 bg-gray-100 dark:bg-gray-800 dark:text-gray-200 rounded-lg">
                            <span className="cursor-text" onClick={e => e.preventDefault()}>
                                <span className="hover:opacity-80" style={{ userSelect: 'none' }}><img className="inline cursor-pointer mr-2 w-5 bg-gray-600 dark:bg-gray-800" alt="Print AOPC" title="Print AOPC" src='./icons/print-icon.png' onClick={() => selectAOPC(i)} /></span>
                                { conflictCase.court !== '?' && <span className="mr-2" style={{ 'userSelect': 'none' }}>({{ C: 'CCP', S: 'SUP', F: 'FAM', '?': '' }[conflictCase.court]})</span> }
                                { (conflictClientName || clientName) ? <span className={!conflictCase.declared ? 'italic' : ''}>
                                    {conflictClientName || clientName}: {conflictCase.duc} &ndash; {conflictCase.schedule}
                                </span> : <span>{conflictCase.duc}</span> }
                            </span>
                            <svg className="w-5 h-5 transition-transform group-open:rotate-180"
                                fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round"
                                d="M19 9l-7 7-7-7" />
                            </svg>
                        </summary>
                        <div className="px-4 pb-4 pt-2 text-gray-700 dark:text-gray-300" ref={el => {aopcRef.current[i] = el!}}>
                            <pre>
                                {...conflictCase.aopcScreen.map((l, i) => <span className="block" key={i}>{l}</span>)}
                            </pre>
                        </div>
                    </details>
                )}
            </div>
            { (conflictResults.length || '') && <ConflictViewer client={clientName} conflictResults={conflictResults} /> }
            { (!conflictBlobs.length && conflictResponse.sbi || '') && <form className="flex flex-col items-center w-full p-1 bg-white dark:bg-gray-700 shadow-lg rounded-lg">
                <input
                    value={barId}
                    onChange={e => setBarId(e.target.value)}
                    placeholder="Enter Conflict Attorney Bar ID"
                    maxLength={4}
                    className="block w-1/3 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none
                            focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 mb-2
                            bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center placeholder:text-center"
                />
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        processAllEmails();
                    }}
                    className="block w-1/3 p-2 mb-2 rounded-md font-semibold
                            bg-blue-600 text-white hover:bg-blue-700 transition duration-150
                            disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
                >
                    Populate Conflict Sheets
                </button>
            </form>}
            { (conflictBlobs.length || '') && <div className="w-full p-3 bg-white dark:bg-gray-700 shadow-lg rounded-lg">
                { conflictBlobs.map((blob, blobIdx) => <div className="flex w-full items-center" key={blob.duc}>
                    <a className="flex-1 text-blue-600 hover:underline hover:text-blue-800 transition duration-150" target="_blank" href={blob.blob} download={blob.filename}>{blob.filename}</a>
                    {(blobIdx === 0 ? 
                        <img
                            src='/icons/clear.svg'
                            className="w-6 cursor-pointer"
                            onClick={() => setConflictBlobs([])}
                        /> :
                        <></>)
                    }</div>
                )}
            </div>}
        </div>
    );
}