import { attorneyData, ccpEmails, fcEmails, scEmails } from "@/lib/attorneyEmails";
import { ConflictType, generateBody, generateEml, getConflictSubject } from "@/lib/emlGenerator";
import { NextRequest, NextResponse } from "next/server";
import { modifyConflictPdf } from "../editConflictSheet/route";
import { Tn3270 } from "@/lib/Tn3270";
import { decrypt, JICPayload } from "@/lib/session";

type EMLCaseData = {
    duc: string;
    caseInfo: string;
    conflictSheet: string;
    sheetFilename: string;
};

type ReqData = {
    barId: string;
    court: string;
    filename: string;
    cases: EMLCaseData[];
}

export async function POST(request: NextRequest) {
    const reqJson = await request.json() as ReqData;
    const { barId, court, filename } = reqJson;

    const conflictType = { 'C': 'ccp', 'S': 'sup', 'F': 'fam' }[court]! as ConflictType;
    const attyData = attorneyData.find(a => a.barId === barId)!;
    const courtEmails = (conflictType === 'ccp' ?
        ccpEmails :
        (conflictType === 'fam' ?
            fcEmails :
            scEmails
        )
    );

    const subject = getConflictSubject(conflictType);
    const body = attyData ? generateBody(attyData.name, conflictType, reqJson.cases.map(c => c.caseInfo), filename) : '';
    const attachments = await Promise.all(reqJson.cases.map(async c => ({
        name: c.sheetFilename,
        data: Buffer.from(await modifyConflictPdf(barId, court, c.conflictSheet, c.duc)).toString('base64').replace(/(.{76})/g, "$1\n")
    })));

    const eml = await generateEml({
        from: `"William McVay" <william.mcvay@delaware.gov>`,
        to: [ (attyData?.emails || []).join('; '), courtEmails.join('; ') ].join('; '),
        cc: attorneyData.find(a => a.barId === '3944')!.emails.join('; '),
        subject,
        body,
        signatureLogo: './src/assets/sigLogo.png',
        attachments,
    });

    if (conflictType === 'fam') {
        const authCookie = request.cookies.get('F_JIC')?.value;
        if (!authCookie)
            return NextResponse.json({ message: 'JIC login cookie not found' }, { status: 401 });

        const authData = await decrypt(authCookie) as JICPayload;
        if (!authData || !authData.user)
            return NextResponse.json({ message: 'Invalid JIC login cookie' }, { status: 401 });

        const client = await Tn3270.connect();
        const loginStatus = await client.login('jic', authData.user, authData.pw);
        if (loginStatus === 'fail' || loginStatus === 'logged')
            return NextResponse.json({ message: 'JIC login failed', loginStatus }, { status: 401 });

        await client.runCommands([
            `String("jic")`,
            `Enter()`,
            `String("x")`,
            `Enter()`,
            `String("1")`,
            `Enter()`,
            `String("fcu")`,
            `Enter()`,
            `String("aaa")`,
            `Enter()`,
        ]);

        await reqJson.cases.reduce(async (p, caseInfo) => {
            await p;
            return await client.runCommands([
                `String("${caseInfo.duc}")`,
                `Tab()`,
                `Tab()`,
                `String("k")`,
                `Tab()`,
                `String("00${barId}")`,
                `Tab()`,
                `Tab()`,
                `String("ctratt")`,
                `Enter()`,
                `PF(4)`,
            ]) as string[];
        }, Promise.resolve([] as string[]));

        await client.quit()
    }

    return new NextResponse(eml, {
        headers: {
            'Content-Type': 'message/rfc822',
            'Content-Disposition': 'inline; filename=message.eml'
        }
    })
}