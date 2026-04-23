import { AttorneyData, readDataFile } from "./filePersistance";

export const getAttorneyData = () => readDataFile('contacts/attorneys.json') as AttorneyData[];

export const getCcpEmails = () => readDataFile('contacts/ccp.json');
export const getFcEmails = () => readDataFile('contacts/fam.json');
export const getScEmails = () => readDataFile('contacts/sup.json');