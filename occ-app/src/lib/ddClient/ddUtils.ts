export class DDUtils {
    static courtSearchParam(court: 'CCP' | 'SUP' | 'FAM', county: 'S' | 'K' | 'N') {
        const valueMap: { [k: string]: { [k: string]: { fv: string, dv: string } } } = {
            'CCP': { 'K': { fv: '7', dv: 'CCP - Kent' } }
        }
        return {
            "fieldName": "court_id",
            "fieldValue": valueMap[court][county].fv,
            "dbName": "c.court_id",
            // "displayName": "Court",
            // "displayValue": valueMap[court][county].dv,
            // "operator": null,
            // "convertToUTC": null
        }
    }

    static countySearchParam(county: 'S' | 'K' | 'N') {
        const valueMap: { [k: string]: { dv: string, fv: string } } = {
            'K': { fv: '11', dv: 'K - Kent' }
        }

        return {
            "fieldName": "ldatype_id",
            "fieldValue": valueMap[county].fv,
            "dbName": "c.ldatype_id",
            // "displayName": "Case Type",
            // "displayValue": valueMap[county].dv,
            // "operator": null,
            // "convertToUTC": null
        };
    }

    static statusSearchParam(status: 'O' | 'C') {
        const valueMap: { [k: string]: { dv: string, fv: string } } = {
            'O': { fv: '1', dv: 'Open' }
        };

        return {
            "fieldName": "case_status_id",
            "fieldValue": valueMap[status].fv,
            "displayValue": valueMap[status].dv,
            // "dbName": null,
            // "operator": null,
            // "displayName": null,
            // "convertToUTC": null
        };
    }

    static openedAfterParam(date: Date) {
        console.log(date.toLocaleDateString())
        return {
            "fieldName": "opened_from",
            "fieldValue": date.toLocaleDateString(),
            "dbName": "c.date_opened",
            "operator": "gte",
            "displayName": "Date from",
            "displayValue": date.toLocaleDateString(),
            "convertToUTC": null
        };
    }

    static attorneyByIdParam(attyId: string) {
        return {
            "fieldName": "attorney_id",
            "fieldValue": attyId,
            "dbName": "c.attorney_id",
            // "operator": null,
            // "displayName": null,
            // "displayValue": "",
            // "convertToUTC": null
        };
    }
}