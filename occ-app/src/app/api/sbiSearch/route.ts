import { DDRequestError, DefenderDataClient } from "@/lib/defenderDataClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const ddClient = await DefenderDataClient.connect(request);
        const reqPayload = await request.json();
        return NextResponse.json(await ddClient.sbiSearch(reqPayload));
    } catch (e) {
        const { error, status } = e as DDRequestError;
        console.log('Error performing Defender Data search', error);
        return NextResponse.json(error, status);
    }
}