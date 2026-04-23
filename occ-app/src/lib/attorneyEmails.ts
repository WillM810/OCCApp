import { readDataFile } from "./filePersistance";

export const attorneyData = readDataFile('contacts/attorneys.json');
export const ccpEmails = readDataFile('contacts/ccp.json');
export const fcEmails = readDataFile('contacts/fam.json');
export const scEmails = readDataFile('contacts/sup.json');