"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import MsgReader, { FieldsData } from "@kenjiuno/msgreader";

import AgeCalculator from "@/components/AgeCalculator";
import ConflictCheck from "@/components/ConflictCheck";
import LoginPanel from "@/components/LoginPanel";
import { default as DefDataCase, DefDataCaseInfo } from "@/components/DefDataCase";

export type LoginState = {
  dd?: boolean;
  sc?: boolean;
  fc?: boolean;
};

export type DefDataAttyResponse = {
  attorney_name: string;
  attorney_id: string;
};

export type ConflictData = {
  ducs: string;
  court: 'C' | 'F' | 'S';
};

export type ConflictPayload = {
  ducs: string[];
  court: 'C' | 'F' | 'S';
};

export type ConflictCase = {
  declared: boolean;
  court: 'C' | 'F' | 'S';
  duc: string;
  schedule: string;
  status: string;
  statusCode: string;
  sentenced: boolean;
  aopcScreen: string[];
}

export type ConflictResponse = {
  sbi: string;
  clientName: string;
  activeJson: ConflictCase[];
}

export type ConflictEmail = FieldsData & {
  duc: string;
  clientName: string;
  fileName: string;
  conflictSheetArrayBuffer: Uint8Array<ArrayBuffer>;
}

export default function Home() {
  const [statusLoading, setStatusLoading] = useState(true);
  const [loginState, setLoginState] = useState({} as LoginState);
  const [attorneysList, setAttorneysList] = useState([] as { value: string, name: string }[]);
  const [displayContent, setDisplayContent] = useState([] as string[]);
  const [conflictEnabled, setConflictEnabled] = useState(false);
  const [unassignedCasesList, setUnassignedCasesList] = useState([] as DefDataCaseInfo[]);
  const [showAllCasesAssigned, setShowAllCasesAssigned] = useState(false);
  const [conflictResponse, setConflictResponse] = useState(undefined as ConflictResponse | undefined);
  const [conflictCaseNumbers, setConflictCaseNumbers] = useState('');
  const [conflictClientName, setConflictClientName] = useState('');
  const [conflictEmails, setConflictEmails] = useState([] as ConflictEmail[]);

  const conflictFilesRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const loginStatusResponse = await fetch('/api/login/status');
      const loginStatus = await loginStatusResponse.json();
      setLoginState(loginStatus);
    };

    setStatusLoading(true);
    fetchStatus().then(() => setStatusLoading(false));
  }, []);

  function resetPage() {
    clearResults();
    setConflictCaseNumbers('');
    setConflictEmails([]);
    setConflictClientName('');
    if (conflictFilesRef.current) conflictFilesRef.current.value = '';
  }

  function clearResults() {
    setDisplayContent([]);
    setUnassignedCasesList([]);
    setShowAllCasesAssigned(false);
    setConflictResponse(undefined);
  }

  async function testSchedule() {
    resetPage();
    const scheduleResponse = await fetch('/api/testSchedule');
    const scheduleData = await scheduleResponse.json();

    setDisplayContent(scheduleData);
  }

  async function dropFiles(e: React.DragEvent<HTMLInputElement>) {
    e.preventDefault();
    resetPage();

    const files = e.dataTransfer.files;
    if (!files?.[0]) return;

    const dt = new DataTransfer();
    for (let file of files) dt.items.add(file);
    conflictFilesRef.current!.files = dt.files;

    const msgData = await Promise.all(Object.values(files).map(async file => {
      const buffer = await file.arrayBuffer();
      const reader = new MsgReader(buffer);
      const data = reader.getFileData();
      const duc = /\d{10}/.exec(data.body!)![0]
      const clientName = /: ([A-Z, ]*?) \d{10}/.exec(data.body!)![1].replace(',', ', ');
      const conflictSheetArrayBuffer = reader.getAttachment(data.attachments![0]).content as Uint8Array<ArrayBuffer>;
      
      return { ...data, duc, clientName, fileName: file.name, conflictSheetArrayBuffer };
    }));

    console.log(
      msgData,
      URL.createObjectURL(new Blob([msgData[0].conflictSheetArrayBuffer], { type: 'application/pdf' })),
      `${msgData[0].clientName} - ${msgData[0].duc}.pdf`
    );
    setConflictEmails(msgData);
    setConflictCaseNumbers(msgData.map(msg => msg.duc).join(','));
    setConflictClientName(msgData[0].clientName);
    setConflictEnabled(true);
  }

  function updateFiles(e: ChangeEvent<HTMLInputElement>) {
    if (!conflictEmails.length) return;

    const files = conflictFilesRef.current!.files!;
    const emails = conflictEmails.filter(v => e.target.value.includes(v.duc));
    setConflictEmails(emails);
    if (!emails.length) {
      setConflictClientName('');
      clearResults();
    }

    const caseNumbers = emails.map(v => v.duc).join(',');
    setConflictCaseNumbers(caseNumbers);
    setConflictEnabled(/^\d{10}(?:,?\s*\d{10})*\s?$/.test(caseNumbers));

    const dt = new DataTransfer();
    for (let file of files) if (emails.find(v => v.fileName === file.name)) dt.items.add(file);
    conflictFilesRef.current!.files = dt.files;
  }

  async function conflict(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearResults();
    setConflictEnabled(false);
    const conflictData = Object.fromEntries(new FormData(e.target as HTMLFormElement).entries()) as ConflictData;
    conflictData.ducs = conflictData.ducs.replaceAll(' ', ',')
    const conflictPayload: ConflictPayload = { ducs: (conflictData.ducs).split(',').filter(d => d).map(duc => duc.trim()), court: conflictData.court };
    const conflictResponse = await fetch('/api/conflict', {
      method: 'POST',
      body: JSON.stringify(conflictPayload),
      headers: {
        'Content-type': 'application/json'
      }
    });
    setConflictEnabled(true);
    if (!conflictResponse.ok) return;

    const conflictList = await conflictResponse!.json() as ConflictResponse;
    setConflictResponse(conflictList);
  }

  async function unassignedCases() {
    resetPage();
    if (!attorneysList.length) {
      const attorneysResponse = await fetch('/api/attorneyList');
      const attorneys = (await attorneysResponse.json() as DefDataAttyResponse[])
        .map(attorney => ({ name: attorney.attorney_name, value: attorney.attorney_id }));
      setAttorneysList(attorneys);
    }
    const casesResponse = await fetch('/api/unassignedCases');
    setUnassignedCasesList(await casesResponse.json() as DefDataCaseInfo[]);
    if (!unassignedCasesList.length) setShowAllCasesAssigned(true);
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      
      <LoginPanel statusLoading={statusLoading} loginUseState={ [ loginState, setLoginState ] } />

      <main className="flex-1 p-6 max-h-full overflow-y-auto">
        <h1 className="mb-4 text-4xl font-bold text-gray-900 dark:text-white">Office of Conflicts Counsel</h1>
        <div className="w-full mb-4 flex justify-between items-center">
          <AgeCalculator />
          {
            loginState.sc && 
              <button
                className="w-1/4 h-10 bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
                onClick={testSchedule}
              >
                Test Schedule
              </button>
          }
          {
            loginState.dd &&
              <button
                className="w-1/4 h-10 bg-blue-600 text-white p-2 rounded-md font-semibold hover:bg-blue-700 transition duration-150"
                onClick={unassignedCases}
              >
                Unassigned Cases
              </button>
          }
        </div>
        {
          loginState.sc &&
            <form onSubmit={conflict}>
              <input
                placeholder="Enter DUCs or drop conflict emails"
                name="ducs"
                value={conflictCaseNumbers}
                onDrag={e => e.preventDefault()}
                onDrop={dropFiles}
                autoComplete={ conflictFilesRef.current?.files?.length ? 'off' : undefined }
                disabled={!!conflictResponse}
                onChange={e => {
                  setConflictCaseNumbers(e.target.value);
                  setConflictEnabled(/^\d{10}(?:,?\s*\d{10})*\s?$/.test(e.target.value));
                  updateFiles(e);
                }}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none
                          focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 mb-2
                          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
                          disabled:bg-gray-100 dark:disabled:bg-gray-700
                          disabled:text-gray-500 dark:disabled:text-gray-400
                          disabled:placeholder-gray-400
                          disabled:border-gray-300 dark:disabled:border-gray-600
                          disabled:cursor-not-allowed disabled:opacity-90
                          disabled:focus:ring-0"
              />
              <input ref={conflictFilesRef} type="file" hidden multiple />
              <div className="flex justify-between px-8 mb-2">
                <label>
                  <input type="radio" name="court" value="C" className="mr-4" defaultChecked required />
                  CCP
                </label>
                <label>
                  <input type="radio" name="court" value="F" className="mr-4" disabled={!loginState.fc} />
                  FC
                </label>
                <label>
                  <input type="radio" name="court" value="S" className="mr-4" />
                  SC
                </label>
              </div>
              <button
                disabled={!conflictEnabled}
                type="submit"
                className="w-full p-2 mb-4 rounded-md font-semibold
                          bg-blue-600 text-white hover:bg-blue-700 transition duration-150
                          disabled:bg-gray-400 disabled:text-gray-200 disabled:cursor-not-allowed disabled:hover:bg-gray-400"
              >
                { conflictFilesRef.current?.files?.length ? 'Begin Conflict Check' : 'Case Lookup' }
              </button>
            </form>
        }
        { (unassignedCasesList.length || '') &&
          <div>
            { unassignedCasesList.map((unassignedCase, i) =>
              (<DefDataCase
                caseInfo={unassignedCase}
                attorneyList={attorneysList}
                assigned={() => setUnassignedCasesList(unassignedCasesList.filter((c, ci) => i !== ci))}
                key={unassignedCase.case_id}
              />)) }
          </div>
        }
        { (showAllCasesAssigned && !unassignedCasesList.length) &&
          <span>No unassigned cases.</span>
        }
        { conflictResponse &&
          <ConflictCheck
            conflictClientName={conflictClientName}
            conflictResponse={conflictResponse}
            conflictEmails={conflictEmails}
            clear={() => setConflictResponse(undefined)}
          />
        }
        { (displayContent.length || '') &&
          <>{ displayContent.map((l, i) => <span className="block font-mono" key={i}>{l}</span>) }</>
        }
      </main>
      
    </div>
  );
}
