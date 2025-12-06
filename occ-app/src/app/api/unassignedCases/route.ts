import { DDRequestError, DefenderDataClient } from "@/lib/defenderDataClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const ddClient = await DefenderDataClient.connect(request);
        return NextResponse.json(await ddClient.getUnassignedCases());
    } catch (e) {
        const { error, status } = e as DDRequestError;
        console.error('Error fetching unassigned cases from Defender Data', error);
        return NextResponse.json(error, status);
    }
}