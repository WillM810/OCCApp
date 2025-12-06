import { NextRequest } from "next/server";
import { DefenderDataClient } from "@/lib/defenderDataClient";

export async function POST(request: NextRequest) {
    return await DefenderDataClient.login(request);
}