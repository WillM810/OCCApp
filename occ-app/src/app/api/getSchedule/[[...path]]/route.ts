import { decrypt, JICPayload } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { convertDateJIC } from "@/lib/utils";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    const authCookie = request.cookies.get('S_JIC')?.value as string;
    if (!authCookie) return NextResponse.json({}, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user) return NextResponse.json({}, { status: 401 });

    const client = await Tn3270.connect();
    if (!await client.login('jic', authData.user, authData.pw)) return NextResponse.json({}, { status: 401 });
    
    const attyId = (await params).path?.[0] ?? '4447';
    const fromDate = convertDateJIC(new Date());
    const toDate = convertDateJIC(new Date(Date.now() + (365.25 * 24 * 60 * 60 * 1000)))
    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("as")`,
        `Enter()`,
        `String("00${attyId}")`,
        `Tab()`,
        `String("${fromDate}")`,
        `String("${toDate}")`,
        `Enter()`
    ]);

    const data = await client.read();
    while (!data.some(l => l.includes('*** End of Data ***'))) {
        await client.sendCommand('PF(8)');
        data.push(...(await client.read()));
    }

    await client.quit();

    return NextResponse.json(data.filter(l => /^\s{1,2}\d{1,2}/.test(l)).map(l => l.slice(4)));
}