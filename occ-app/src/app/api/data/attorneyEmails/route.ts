import { NextRequest, NextResponse } from "next/server";
import { readDataFile } from "@/lib/filePersistance";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json(readDataFile('contacts/attorneys.json'));
    } catch (e) {
        return NextResponse.json(e, { status: 500 });
    }
}