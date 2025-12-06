import { decrypt } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import { DefenderDataClient } from "@/lib/defenderDataClient";
import { LoginState } from "@/app/page";

export async function GET(request: NextRequest) {
    const responseData = {} as LoginState;

    const [ sjicCookie, fjicCookie ] = [
        request.cookies.get('S_JIC'),
        request.cookies.get('F_JIC'),
    ];

    if (!sjicCookie || !await decrypt(sjicCookie?.value!)) responseData.sc = false;
    else responseData.sc = true;
    if (!fjicCookie || !await decrypt(fjicCookie?.value!)) responseData.fc = false;
    else responseData.fc = true;

    try {
        const ddClient = await DefenderDataClient.connect(request);
        await ddClient.getUnassignedCases();
        responseData.dd = true;
    } catch (e) {
        console.error(request.cookies.get('DD'));
        console.error(e);
        responseData.dd = false;
    }

    const response = NextResponse.json(responseData);
    if (!responseData.sc) response.cookies.set('S_JIC', '', { maxAge: 0 });
    if (!responseData.fc) response.cookies.set('F_JIC', '', { maxAge: 0 });
    if (!responseData.dd) response.cookies.set('DD', '', { maxAge: 0 });
    return response;
}