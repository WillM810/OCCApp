import { NextRequest } from "next/server";

export function convertDateJIC(d: Date) {
    return (d.getMonth() + 1).toString().padStart(2, '0') +
            d.getDate().toString().padStart(2, '0') +
            d.getFullYear();
}

export async function safeJson(req: NextRequest) {
    try {
        return await req.json();
    } catch {}
    return {};
}