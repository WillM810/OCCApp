export type ConflictResult = {
    name: string;
    cases: {
        [k: string]: string[];
    }
};

export type ConflictViewerProps = {
    conflictResults: ConflictResult[];
    client: string;
};

export default function ConflictViewer({ conflictResults, client }: ConflictViewerProps) {
    return (
        <div className="mt-2 p-2">
            { conflictResults.map((conflict, i) => 
                <div className="mb-2" key={i}>
                    <span className={"block font-semibold" + (conflict.name === client ? ' italic' : '')}>
                        {conflict.name}{ conflict.name === client ? ' (Client)' : ''}:
                    </span>
                    { !Object.keys(conflict.cases).length && <span className="block">None.</span>}
                    { (Object.keys(conflict.cases).length || '') && Object.keys(conflict.cases).map((atty, j) =>
                        <span key={j} className="block">{atty.toUpperCase()} &ndash; {(conflict.cases[atty]).join(', ')}</span>
                    ) }
                </div>
            )}
        </div>
    )
}