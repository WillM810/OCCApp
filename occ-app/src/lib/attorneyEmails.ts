import { readFile } from "./filePersistance";

export const attorneyData = readFile('contacts/attorneys.json');
export const ccpEmails = readFile('contacts/ccp.json');
export const fcEmails = readFile('contacts/fam.json');
export const scEmails = readFile('contacts/sup.json');