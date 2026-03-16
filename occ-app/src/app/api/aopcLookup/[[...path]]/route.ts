import { decrypt, JICPayload } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const authCookie = request.cookies.get('S_JIC')?.value as string;
    if (!authCookie) return NextResponse.json({}, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user) return NextResponse.json({}, { status: 401 });

    const client = await Tn3270.connect();
    if (!await client.login('cjis1', authData.user, authData.pw)) return NextResponse.json({}, { status: 401 });

    const duc = (await params).path?.[0];

    await client.runCommands([
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
        `String(${duc})`,
        `Enter()`,
    ]);

    

    const caseDisplayScreen = await client.read();
    if (caseDisplayScreen.some(l => l.includes('The entered case was not found on file.'))) {
        await client.quit();
        return NextResponse.json([ 'AOPC not found.' ]);
    }
    if (!caseDisplayScreen[0].includes('Case Display Select')) await client.sendCommand('Enter()');
    caseDisplayScreen.splice(0, caseDisplayScreen.length, ...await client.read());

    await client.runCommands([
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
        !(nextScreen = await client.read()).some(l => l.includes('Case Display Select')) && screenCount < 100;
        await client.sendCommand('Enter()'), screenCount++
    ) aopcScreen.push(...nextScreen);
    
    if (aopcScreen.slice(-20, -1).some(l => !l.trim().match(/\??/))) {
        await client.sendCommand('PF(9)');
        await client.quit();
        return NextResponse.json(aopcScreen.length ? aopcScreen : [ 'AOPC not found.' ]);
    } else {
        await client.quit();
        return NextResponse.json(aopcScreen.map(l => l.match(/^\s*\??\s*$/) ? '' : l).join('\n').trim().split('\n'));
    }
}