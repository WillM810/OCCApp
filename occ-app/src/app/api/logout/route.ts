import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const service = request.nextUrl.searchParams.get('service');

    const response = NextResponse.json({});
    if (service?.toUpperCase() === 'ALL')
        [ 'DD', 'S_JIC', 'F_JIC' ].forEach(s => response.cookies.set(s, '', { maxAge: 0 }));
    else if (service)
        response.cookies.set(service.toUpperCase(), '', { maxAge: 0 });

    return new Response('OK', {
        headers: {
            'Set-Cookie': response.headers.get('Set-Cookie') || ''
        }
    })
}