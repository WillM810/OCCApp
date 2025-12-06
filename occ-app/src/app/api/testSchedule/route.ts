import { decrypt, JICPayload } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const authCookie = request.cookies.get('S_JIC')?.value as string;
    if (!authCookie) return NextResponse.json({}, { status: 401 });

    const authData = await decrypt(authCookie) as JICPayload;
    if (!authData || !authData.user) return NextResponse.json({}, { status: 401 });

    const client = await Tn3270.connect();
    if (!await client.login('jic', authData.user, authData.pw)) return NextResponse.json({}, { status: 401 });
    await client.runCommands([
        `String("jic")`,
        `Enter()`,
        `String("x")`,
        `Enter()`,
        `String("1")`,
        `Enter()`,
        `String("as")`,
        `Enter()`,
        `String("003944")`,
        `Tab()`,
        `String("11182025")`,
        `String("11182026")`,
        `Enter()`
    ]);

    const data = await client.read();
    await client.quit();

    return NextResponse.json(data);
}