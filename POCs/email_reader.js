import { readFileSync } from 'fs';
import MsgReader from '@kenjiuno/msgreader';

const filePath = '../PDO Conflict Appointment Request CARTERKEVIN M.msg'; // Replace with your file path

try {
    // Read the file into a buffer
    const msgFileBuffer = readFileSync(filePath);

    // Initialize the reader with the buffer
    const ReaderConstructor = MsgReader.default || MsgReader;

    const msgReader = new ReaderConstructor(msgFileBuffer);

    // Get the parsed file data
    const fileData = msgReader.getFileData();

    if (fileData.error) {
        console.error('Error parsing MSG file:', fileData.error.message);
    } else {
        console.log('--- Email Data ---');
        console.log(`Subject: ${fileData.subject}`);
        console.log(`From: ${fileData.senderName} <${fileData.senderEmail}>`);
        console.log(`Date: ${fileData.creationTime}`);
        console.log('Body (Text):');
        console.log(fileData.body);
        console.log('Body (HTML):');
        console.log(fileData.htmlBody);

        if (fileData.attachments && fileData.attachments.length > 0) {
            console.log(`\nAttachments found: ${fileData.attachments.length}`);
            fileData.attachments.forEach(attachment => {
                console.log(msgReader.getAttachment(attachment));
                console.log(`- ${attachment.fileName} (${attachment.contentLength} bytes)`);
                // You can save attachments using fs.writeFileSync(attachment.fileName, attachment.content);
            });
        }
    }
} catch (error) {
    console.error('An error occurred:', error.message);
}
