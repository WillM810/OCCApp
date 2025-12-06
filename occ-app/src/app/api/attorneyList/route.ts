import { DDRequestError, DefenderDataClient } from "@/lib/defenderDataClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const ddClient = await DefenderDataClient.connect(request);
        return NextResponse.json(await ddClient.getAttorneyList());
    } catch (e) {
        const { error, status } = e as DDRequestError;
        console.error('Error fetching attorney list from Defender Data', error);
        return NextResponse.json(error, status);
    }
}