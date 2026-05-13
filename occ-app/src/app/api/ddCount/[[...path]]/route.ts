import { DefenderDataClient } from "@/lib/ddClient/defenderDataClient";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ path?: string[] }> }) {
    try {
        //
        const ddClient = await DefenderDataClient.connect(request);

        return NextResponse.json(await ddClient.getAttorneyCaseCount(await params));
    } catch (e) {
        return NextResponse.json({}, { status: 500 });
    }
}