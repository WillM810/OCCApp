import { decrypt, JICPayload } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const authCookie = request.cookies.get('S_JIC')?.value as string;
    if (!authCookie) return NextResponse.json({}, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user) return NextResponse.json({}, { status: 401 });

    const client = await Tn3270.connect();
    if (!await client.login('jic', authData.user, authData.pw)) return NextResponse.json({}, { status: 401 });

    const duc = (await params).path?.[0];

    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("ch")`,
        `Enter()`,
        `String("${duc}")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
    ]);

    const criminalHistory = [];
    let screen = await client.read();
    while (screen.some(l => l.includes('DELJIS Charge Inquiry'))) {
        if (criminalHistory.length)
            criminalHistory.push(...(screen.slice(8, -3)));
        else
            criminalHistory.push(...screen.slice(0, -3));
        await client.sendCommand('Enter()');
        screen = await client.read();
    }

    await client.quit();
    
    return NextResponse.json(criminalHistory);
}