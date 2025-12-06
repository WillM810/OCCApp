import { NextRequest, NextResponse } from "next/server";
import { DDPayload, decrypt, encrypt } from "./session";
import httpsRequest from "./httpsRequest";

export type ddRequestOptions = {
    hostname: 'myjw.com';
    path?: string;
    method?: 'GET' | 'PUT';
    headers: {
        Referer: 'https://myjw.com/10000';
        Cookie: string;
        justicelogin?: string;
        'Content-type'?: 'application/json' | 'text/plain';
    }
};

export type ddAssignAttorneyReqParams = {
    case_id: string;
    date_assigned: string;
    attorney_id: string;
};

export type DDBasicResult = {
    DUC: string;
    Defendant: string;
    Attorney: string;
    Assigned: string;
    Type: string;
    Status: string;
    Flags: string;
};

export type DDRequestError = {
    error: {
        message: string;
    };
    status: {
        status: number;
    };
};

export type DDSearchParam = {
    fieldName: string;
    fieldValue: string;
    dbName?: string | null;
    operator?: string | null;
    displayName?: string | null;
    displayValue?: string | null;
    convertToUTC?: string | null;
};

const defaultSearchParams: { params: DDSearchParam[] } = {
    "params": [
        {
            "fieldName": "message",
            "fieldValue": "loadgrid",
            "dbName": null,
            "operator": null,
            "displayName": null,
            "displayValue": null,
            "convertToUTC": null
        },
        {
            "fieldName": "include_inactive",
            "fieldValue": "true",
            "dbName": null,
            "operator": null,
            "displayName": null,
            "displayValue": null,
            "convertToUTC": null
        },
        {
            "fieldName": "include_pfe",
            "fieldValue": "true",
            "dbName": null,
            "operator": null,
            "displayName": null,
            "displayValue": null,
            "convertToUTC": null
        },
        {
            "fieldName": "first_field_name",
            "fieldValue": "closed_from",
            "dbName": null,
            "operator": null,
            "displayName": null,
            "displayValue": null,
            "convertToUTC": null
        },
        {
            "fieldName": "second_field_name",
            "fieldValue": "closed_to",
            "dbName": null,
            "operator": null,
            "displayName": null,
            "displayValue": null,
            "convertToUTC": null
        },
        {
            "fieldName": "field_name",
            "fieldValue": "attorney_code_name"
        },
    ]
};

export class DefenderDataClient {
    static stdOptions: ddRequestOptions = {
        hostname: 'myjw.com',
        headers: {
            Referer: 'https://myjw.com/10000',
            Cookie: 'screenx=1920; screeny=1080; timezoneoffset=-5; daylightsavings=yes; ',
        }
    };

    sessionOptions: ddRequestOptions;

    static async login(request: NextRequest) {
        const { DD_username, DD_password, service } = await request.json();
        const authDate = new Date();
        const requestOptions = structuredClone(Object.assign({ method: 'GET', path: '/login/7002/7007' }, DefenderDataClient.stdOptions));
        requestOptions.headers.justicelogin = `${DD_username}:${DD_password}:10000`;
        requestOptions.headers.Cookie += ` currenttime=${authDate.toString()};`;

        const loginResponse = await httpsRequest(requestOptions);
        if (loginResponse.statusCode === 200 && loginResponse.headers['set-cookie']) {
            const expireDate = new Date(Date.now() + (24 * 60 * 60 * 1000));
            const response = NextResponse.json({ status: 'success' }, { status: 200 });
            const justiceToken = loginResponse.headers['set-cookie'][0].split(';')[0].split('=')[1];
            response.cookies.set(service, await encrypt({ token: justiceToken, date: authDate.toString(), system: service }, expireDate));
            return response;
        } else
            return NextResponse.json({ status: 'failed' }, { status: 401 });
    }

    static async connect(request: NextRequest) {
        const ddCookie = request.cookies.get('DD')?.value!;
        if (!ddCookie) throw { error: { message: 'DD login cookie not set' }, status: { status: 401 } };

        const authData = await decrypt(ddCookie) as DDPayload;
        if (!authData || !authData.token) throw { error: { message: 'Failed to decrypt session' }, status: { status: 401 } };

        return new DefenderDataClient(authData);
    }

    constructor(authData: DDPayload) {
        this.sessionOptions = structuredClone(DefenderDataClient.stdOptions);
        this.sessionOptions.headers.Cookie += `currentTime=${authData.date}; justicetoken=${authData.token}`;
        this.sessionOptions.headers['Content-type'] = 'application/json';
    }

    async request(method: string, path: string, payload?: any) {
        const requestOptions = structuredClone(Object.assign({ method, path }, this.sessionOptions));

        const resData = await httpsRequest(requestOptions, JSON.stringify(payload));
        if (resData.body.toString('utf8') === 'Improper or outdated credentials!') throw { error: { message: 'Expired credentials' }, status: { status: 401 } };
        if (resData.statusCode !== 200) throw { error: { message: `Received server response code: ${resData.statusCode}` }, status: { status: 500 } };
        return resData;
    }

    async getUnassignedCases() {
        const reqBody = {
            "params": [
                {
                    "fieldName": "message",
                    "fieldValue": "loadgrid",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": null,
                    "convertToUTC": null
                },
                {
                    "fieldName": "include_inactive",
                    "fieldValue": "true",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": null,
                    "convertToUTC": null
                },
                {
                    "fieldName": "include_pfe",
                    "fieldValue": "true",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": null,
                    "convertToUTC": null
                },
                {
                    "fieldName": "first_field_name",
                    "fieldValue": "closed_from",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": null,
                    "convertToUTC": null
                },
                {
                    "fieldName": "second_field_name",
                    "fieldValue": "closed_to",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": null,
                    "convertToUTC": null
                },
                {
                    "fieldName": "field_name",
                    "fieldValue": "attorney_code_name"
                },
                {
                    "fieldName": "attorney_id",
                    "fieldValue": "1",
                    "dbName": "c.attorney_id",
                    "operator": null,
                    "displayName": null,
                    "displayValue": "UNASSIGNED ATTORNEY",
                    "convertToUTC": null
                },
                {
                    "fieldName": "case_status_id",
                    "fieldValue": "1",
                    "dbName": null,
                    "operator": null,
                    "displayName": null,
                    "displayValue": "Open",
                    "convertToUTC": null
                },
                {
                    "fieldName": "ldatype_id",
                    "fieldValue": "11",
                    "dbName": "c.ldatype_id",
                    "operator": null,
                    "displayName": "Case Type",
                    "displayValue": "K - Kent",
                    "convertToUTC": null
                },
            ],
        };
        const resData = await this.request('PUT', '/recordset/layout/7479', reqBody);

        return JSON.parse(resData.body.toString('utf8'))[0];
    }

    async getAttorneyList() {
        const attorneyResponse = await this.request('PUT', '/layout/7131');
        const attorneysHTML = attorneyResponse.body.toString('utf8');

        const attorneyRegEx = /"attorney_id" fieldValue="(\d*)">(?:.|\s)*?"attorney_name".*?>(.*?)</g;
        const attorneysList = [];
        
        let attorneyDataMatch: RegExpExecArray | null;
        while (attorneyDataMatch = attorneyRegEx.exec(attorneysHTML)) {
            attorneysList.push({ attorney_id: attorneyDataMatch[1], attorney_name: attorneyDataMatch[2] });
        }
        
        return attorneysList;
    }

    async assignAttorney(params: ddAssignAttorneyReqParams) {
        this.sessionOptions.headers["Content-type"] = 'text/plain';
        const resData = await this.request('POST', '/data/record/cases', params);
        this.sessionOptions.headers["Content-type"] = 'application/json';
        if (resData.statusCode === 200) return { status: 'ok' };
        else throw { error: resData.body, status: 500 };
    }

    async sbiSearch({ sbi }: { sbi: string }) {
        const params = structuredClone(defaultSearchParams);
        params.params.push({
            "fieldName": "sbi_nbr",
            "fieldValue": sbi,
            "dbName": "cl.sbi_nbr",
            "operator": "eq",
            "displayName": "SBI",
            "displayValue": null,
            "convertToUTC": null
        })
        const resData = await this.request('PUT', '/recordset/layout/7479', params);
        const resJson = JSON.parse(resData.body.toString('utf8'))[0];

        return resJson;
    }

    async basicSearch({ criteria }: { criteria: string }) {
        const resData = await this.request('PUT', '/zsearch/layout/7061', { criteria });
        const resultHtml = resData.body.toString('utf8');

        const trRegEx = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi;

        const rows = [];
        let trMatch;
        while (trMatch = trRegEx.exec(resultHtml)) {
            const trContent = trMatch[1];

            const cellRegEx = /<(th|td)[\s\S]*?>([\s\S]*?)<\/\1>/gi;

            const cells = [];
            let cellMatch;
            while (cellMatch = cellRegEx.exec(trContent)) {
                const text = cellMatch[2]
                    .replaceAll(/<[^>]*>/g, '')
                    .replaceAll(/\s+/g, ' ')
                    .trim()
                cells.push(text);
            }

            if (cells.length) rows.push(cells);
        }

        rows[0][0] = 'DUC';
        const [header, ...data] = rows;
        const jsonData = data.map(row =>
            Object.fromEntries(header.map((key, i) => [key, row[i] ?? ""]))
        ) as DDBasicResult[];

        const attorneys = jsonData
            .filter(caseRow => !caseRow.Attorney.includes('UNASSIGNED') && caseRow.Status !== 'Closed')
            .reduce((p, c) => {
                p[c.Attorney] = [...(p[c.Attorney] || []), `${c.DUC}(${c.Type[0]}/${c.Status})`];
                return p;
            }, {} as { [k: string]: string[] });

        return attorneys;
    }
}