import { encrypt } from "@/lib/session";
import { Tn3270 } from "@/lib/Tn3270";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const json = await request.json();

    const { service: system } = json;
    const [user, pw] = [json[`${system}_username`], json[`${system}_password`]];

    const expireDate = new Date();
    expireDate.setHours(expireDate.getHours() + 24);

    const client = await Tn3270.connect();
    const status = await client.login('jic', user, pw);
    await client.quit();

    const response = NextResponse.json({ status }, { status: status === 'ok' || status === 'expire' ? 200 : 401 });
    if (status === 'ok' || status === 'expire') response.cookies.set(system, await encrypt({ user, pw, system }, expireDate))
    
    return response;
}