import { Tn3270 } from "@/lib/Tn3270";
import { DefenderDataClient } from "@/lib/ddClient/defenderDataClient";
import { decrypt, JICPayload } from "@/lib/session";
import { convertDateJIC } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const authCookie = request.cookies.get('S_JIC')?.value;
    if (!authCookie)
        return NextResponse.json({ message: 'JIC login cookie not found' }, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user)
        return NextResponse.json({ message: 'Invalid JIC login cookie' }, { status: 401 });

    const client = await Tn3270.connect();
    const loginStatus = await client.login('jic', authData.user, authData.pw);
    if (loginStatus === 'fail' || loginStatus === 'logged')
        return NextResponse.json({ message: 'JIC login failed', loginStatus }, { status: 401 });

    const { ducs, court } = await request.json() as { ducs: string[], court: 'F' | 'S' | 'C' };
    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("cs")`,
        `Enter()`,
        `String("${ducs[0]}")`,
        `Tab()`,
        `String("${court}")`,
        `String("k")`,
        `Enter()`,
    ]);

    const caseInfoScreen = await client.read();

    if (caseInfoScreen.some(l => l.includes('This Case Was Not Found For This Court.'))) {
        await client.quit();
        return NextResponse.json({ message: 'missing' }, { status: 404 });
    }

    const clientName = caseInfoScreen.find(l => l.includes('Defendant Name'))?.substring(16, 49).trim();

    await client.runCommands([
        `PF(10)`,
        `Enter()`,
    ]);

    const caseScreens = await client.read();
    const sbi = caseScreens.find(l => /\| *SBI [\dT]/.test(l))?.match(/SBI ([\dT]\d{7})/)![1]!;
    while (!caseScreens.some(l => l.includes('*** End of Data ***'))) {
        await client.sendCommand('PF(8)');
        caseScreens.push(...(await client.read()));
    }

    const caseData = caseScreens.filter(l => /\| \d{10}\s*[FSC]/.test(l))?.map(l => l.match(/\| (.*) \|/)?.[1].trim());
    const caseJson = caseData.map(l => {
        const parts = l?.match(/(\d{10})\s*([FSC])\s*(\w*)\s*(\w*)\s*/);
        return {
            duc: parts?.[1],
            court: parts?.[2],
            status: parts?.[3],
            statusCode: parts?.[4],
            sentenced: false,
            declared: false,
            schedule: 'NONE',
            aopcScreen: [] as string[]
        };
    });

    await client.sendCommand('PF(2)');

    const ddClient = await DefenderDataClient.connect(request);
    const ddCases = await ddClient.sbiSearch({ sbi }) as { lda_nbr: string }[];

    const notClosedCaseJson = caseJson.filter(c => !c.status?.startsWith('CLOSE') || ducs.includes(c.duc!));
    await notClosedCaseJson.reduce(async (previousCasePromise, currentCase) => {
        const augmentedCaseData = await previousCasePromise;
        await client.runCommands([
            `String("${currentCase.duc}")`,
            `Tab()`,
            `String("${currentCase.court}")`,
            `Enter()`,
        ]);

        const caseDetail = await client.read();

        if (caseDetail.some(l => l.includes('This Case Was Not Found For This Court.'))) return augmentedCaseData;
        if (caseDetail.some(l => l.includes('Defendant Individual Index Record Not Found.'))) return augmentedCaseData;
        currentCase.sentenced = /Sentence\s*\d{8}/.test(caseDetail.find(l => l.includes('Sentence'))!);
        currentCase.declared = ddCases.some((ddCase) => ddCase.lda_nbr === currentCase.duc) || ducs.includes(currentCase.duc!);

        await client.runCommands([
            `PF(3)`,
            `Tab()`,
            `Tab()`,
            `String("${convertDateJIC(new Date())}")`,
            `Enter()`,
        ]);

        const scheduleScreen = await client.read();
        const eventLines = scheduleScreen.filter(l => /^\s+\d{1,2}\s\w+\s+\d{2}\/\d{2}\/\d{4}(?:\s\w+)?\s*?$/.test(l));
        //@ts-ignore
        currentCase['data'] = { scheduleScreen, eventLines };
        if (eventLines.length) currentCase.schedule = eventLines[0].substring(4, 21);

        await client.sendCommand('PF(2)');

        augmentedCaseData.push(currentCase);
        return augmentedCaseData;
    }, Promise.resolve([] as any[]));

    await client.quit();

    const activeJson = notClosedCaseJson.filter(c => !c.sentenced || ducs.includes(c.duc!));
    
    let aopcClient = await Tn3270.connect();
    if (!await aopcClient.login('cjis1', authData.user, authData.pw))
        return NextResponse.json({ message: 'CJIS1 login failed'}, { status: 401 });

    await aopcClient.runCommands([
        `String("menu")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `Enter()`,
        `String("8")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
    ]);

    await activeJson.reduce(async (prevCasePromise, currentCase) => {
        const caseDataWithAOPC = await prevCasePromise;
        caseDataWithAOPC.push(currentCase);

        await aopcClient.runCommands([
            `String("${currentCase.duc}")`,
            `Enter()`,
        ]);

        const caseDisplayScreen = await aopcClient.read();
        if (caseDisplayScreen.some(l => l.includes('The entered case was not found on file.'))) {
            currentCase.aopcScreen = [ 'AOPC not found.' ];
            return caseDataWithAOPC;
        }
        if (!caseDisplayScreen[0].includes('Case Display Select')) await aopcClient.sendCommand('Enter()');
        caseDisplayScreen.splice(0, caseDisplayScreen.length, ...await aopcClient.read());

        await aopcClient.runCommands([
            `Down()`,
            `Down()`,
            `Down()`,
            `Down()`,
            `String("x")`,
            `Enter()`,
        ]);
        
        const aopcScreen = [] as string[];
        for (
            let nextScreen, screenCount = 0;
            !(nextScreen = await aopcClient.read()).some(l => l.includes('Case Display Select')) && screenCount < 100;
            await aopcClient.sendCommand('Enter()'), screenCount++
        ) aopcScreen.push(...nextScreen);
        
        if (aopcScreen.slice(-20, -1).some(l => !l.trim().match(/\??/))) {
            await aopcClient.sendCommand('PF(9)');
            currentCase.aopcScreen = aopcScreen.length ? aopcScreen : [ 'AOPC not found.' ];
        } else {
            aopcClient = await resetClient(aopcClient, authData);
            currentCase.aopcScreen = aopcScreen.map(l => l.match(/^\s*\??\s*$/) ? '' : l).join('\n').trim().split('\n');
        }
        return caseDataWithAOPC;
    }, Promise.resolve([] as any[]));

    await aopcClient.quit();

    return NextResponse.json({ sbi, clientName, caseJson, notClosedCaseJson, activeJson, ddCases });
}

async function resetClient(client: Tn3270, authData: JICPayload) {
    await client.quit();
    const nClient = await Tn3270.connect(true);
    await nClient.login('cjis1', authData.user, authData.pw);
    
    await nClient.runCommands([
        `String("menu")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `Enter()`,
        `String("8")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
    ]);

    return nClient;
}