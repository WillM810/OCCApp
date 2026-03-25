import { NextRequest, NextResponse } from "next/server";
import { readFile } from "@/lib/filePersistance";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json(readFile('contacts/attorneys.json'));
    } catch (e) {
        return NextResponse.json(e, { status: 500 });
    }
}