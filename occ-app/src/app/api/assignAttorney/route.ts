import { DDRequestError, DefenderDataClient } from "@/lib/defenderDataClient";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const ddClient = await DefenderDataClient.connect(request);
        return NextResponse.json(await ddClient.assignAttorney(await request.json()));
    } catch (e) {
        const { error, status } = e as DDRequestError;
        console.log('Error assigning attorney in Defender Data', error);
        return NextResponse.json(error, status);
    }
}