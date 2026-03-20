import { decrypt, JICPayload } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { safeJson } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return doSbiLookup(request, { params });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    return doSbiLookup(request, { params });
}

async function doSbiLookup(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const authCookie = request.cookies.get('S_JIC')?.value as string;
    if (!authCookie) return NextResponse.json({}, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user) return NextResponse.json({}, { status: 401 });

    const client = await Tn3270.connect();
    if (!await client.login('jic', authData.user, authData.pw)) return NextResponse.json({}, { status: 401 });

    const paramValues = await params;
    const reqPayload = await safeJson(request);
    const court = (paramValues.path?.[0] || reqPayload.court)[0].toUpperCase();
    const duc = paramValues.path?.[1] || reqPayload.duc;

    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("cs")`,
        `Enter()`,
        `String("${duc}")`,
        `Tab()`,
        `String("${court}")`,
        `String("k")`,
        `Enter()`,
    ]);

    const caseInfoScreen = await client.read();

    if (caseInfoScreen.some(l => l.includes('This Case Was Not Found For This Court.'))) {
        await client.quit();
        return NextResponse.json({}, { status: 404 });
    }

    await client.runCommands([
        `PF(10)`,
        `Enter()`,
    ]);

    const caseScreens = await client.read();
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
            // sentenced: false,
            // declared: false,
            // schedule: 'NONE',
            // aopcScreen: [] as string[]
        };
    });

    await client.quit();

    return NextResponse.json({
        caseInfoScreen,
        caseJson,
        sbi: /SBI\s([T0]\d{7})/.exec(caseInfoScreen[4])?.[1],
        name: /Defendant Name ([\w\s]*?)\s{2}/.exec(caseInfoScreen[4])?.[1],
    });
}