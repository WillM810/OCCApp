import httpsRequest from './httpsRequest.js';
import fs from 'fs';

const options = {
    'method': 'GET',
    'hostname': 'myjw.com',
    'path': '/login/7002/7007',
    'headers': {
        'Cookie': `screenx=1920; screeny=1080; timezoneoffset=-5; daylightsavings=yes; currenttime=${new Date().toString()};`,
        'Host': 'myjw.com',
        'Referer': 'https://myjw.com/10000',
        'justicelogin': 'WMcVay:FuckTh3Polic3!:10000',
    },
};

(async function () {
    const login = await httpsRequest(options);

    options.method = 'PUT';
    options.path = '/recordset/layout/7479';
    options.headers.Cookie += ` ${login.headers['set-cookie'][0].split(';')[0]};`;
    options.headers['Content-type'] = 'application/json';
    delete options.headers.justicelogin;

    options.body = JSON.stringify({
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
                "fieldValue": ["10280","2","10031","10051","10270","10252","10327","10271","10249","10290","10292","10276","10090","10255","10235","10251","10084","10203","10107","10152","10237","10145","10186","10277","10295","10286","10289","10311","10158","10199","10015","10278","10322","10234","10298","10299","10254","10216","10334","10317","10247","10039","10124","10025","10229","10332","10041","10296"],
                "dbName": "c.attorney_id",
                "displayName": null,
                "displayValue": "Emery Abdel-Latif – OLD, Attorney Private, Andre Beauregard, David Bever, Mark Blackway, Dale Bowers, Cleon Cauley, Dina Chavar, Miranda Clifton, Diane Coffey WLA Old, Maureen Coggins, Catherine Damavandi, Roni Deely, Willima Deely, Public Defender, Dean DelCollo, Neil Dignon, Edward Eaton, Zach George OLD, Lacy Holly, No JIC, Brian Jordan, Ross Karsnitz, Renee Leverette, Peter Levin, James Ligouri, Rhonda Lowe, Vivian Machado, Eric Mooney, Julianne Murray, Jamie Nutter, Gwen Osborn-Gustafson, Loreto Rufo, Pro Se, Tetra Shockley, Richard Sparaco, Joseph Stanley, Joseph van Sant, Amit Vyas OLD, Amit Vyas (Smith OLD), Marc Wienkowitz, Tim Willard, Robert Witsil, Natalie Woloshin_OLD, Elise Wolpert, Timothy Woodward, Laura Yiengst, Ken Young",
                "operator": null,
                "convertToUTC": null,
            },
            {
                "fieldName": "case_status_id",
                "fieldValue": "1",
                "displayName": null,
                "displayValue": "Open",
                "operator": null,
                "dbName": null,
                "convertToUTC": null,
            }
            // {
            //     "fieldName": "client_last_name",
            //     "fieldValue": "haith",
            //     "dbName": "cl.last_name",
            //     "operator": "word*",
            //     "displayName": null,
            //     "displayValue": null,
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "client_first_name",
            //     "fieldValue": "al",
            //     "dbName": "cl.first_name",
            //     "operator": "word*",
            //     "displayName": null,
            //     "displayValue": null,
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "sbi_nbr",
            //     "fieldValue": "00749233",
            //     "dbName": "cl.sbi_nbr",
            //     "operator": "eq",
            //     "displayName": "SBI",
            //     "displayValue": null,
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "lda_nbr",
            //     "fieldValue": "2508002058",
            //     "dbName": "c.lda_nbr",
            //     "operator": "word*",
            //     "displayName": null,
            //     "displayValue": null,
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "attorney_id",
            //     "fieldValue": "1",
            //     "dbName": "c.attorney_id",
            //     "operator": null,
            //     "displayName": null,
            //     "displayValue": "UNASSIGNED ATTORNEY",
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "case_status_id",
            //     "fieldValue": "1",
            //     "dbName": null,
            //     "operator": null,
            //     "displayName": null,
            //     "displayValue": "Open",
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "ldatype_id",
            //     "fieldValue": "11",
            //     "dbName": "c.ldatype_id",
            //     "operator": null,
            //     "displayName": "Case Type",
            //     "displayValue": "K - Kent",
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "case_id",
            //     "fieldValue": "74031",
            //     "dbName": "c.case_id",
            //     "operator": "word",
            //     "displayName": null,
            //     "displayValue": null,
            //     "convertToUTC": null
            // },
            // {
            //     "fieldName": "dob",
            //     "fieldValue": "06/15/1998",
            //     "dbName": "cl.dob",
            //     "operator": "eq",
            //     "displayName": "Date of Birth",
            //     "displayValue": null,
            //     "convertToUTC": null
            // }
        ]
    });

    console.log(options.headers);
    const data = await httpsRequest(options);
    console.log(data.statusCode);
    console.log(data.headers);
    // const caseData = JSON.parse(data.body.toString('utf8'))[0];
    // console.log(caseData.length);
    // console.log(caseData[0]);
    // console.log(caseData.map(c => c.case_id));

    // fs.writeFileSync('./caseList.txt', caseData.map(c => c.lda_nbr).join('\n'));

    // const templateCloseReq = {
    //     "case_status_id": "2",
    //     "date_closed": "02/24/2026",
    // };

    // options.method = 'POST';
    // options.path = '/data/record/cases';

    // for (let i=0; i < caseData.length; i++) {
    //     options.body = JSON.stringify({ ...templateCloseReq, 'case_id': caseData[i].case_id });

    //     const closeData = await httpsRequest(options);
    //     console.log(caseData[i].lda_nbr, 'closed');
    // }
})();


// Assign Poliquin to case id 74207
// fetch("https://myjw.com/data/record/cases", {
//   "headers": {
//     "accept": "*/*",
//     "accept-language": "en-US,en;q=0.9",
//     "content-type": "text/plain;charset=UTF-8",
//     "justiceauthtoken": "63820762-638990479676980731-346",
//     "justicedebuglog": "true",
//     "justicelogin": "",
//     "sec-ch-ua": "\"Chromium\";v=\"142\", \"Google Chrome\";v=\"142\", \"Not_A Brand\";v=\"99\"",
//     "sec-ch-ua-mobile": "?0",
//     "sec-ch-ua-platform": "\"Windows\"",
//     "sec-fetch-dest": "empty",
//     "sec-fetch-mode": "cors",
//     "sec-fetch-site": "same-origin",
//     "cookie": "screenx=1920; screeny=1080; istouch=no; timezoneoffset=-5; daylightsavings=yes; idletimeout=; currenttime=Tue Nov 18 2025 09:32:47 GMT-0500 (Eastern Standard Time); justicetoken=63820762-638990479676980731-346",
//     "Referer": "https://myjw.com/10000"
//   },
//   "body": "{\"case_id\":\"74207\",\"date_assigned\":\"11/17/2025\",\"attorney_id\":\"10052\"}",
//   "method": "POST"
// });