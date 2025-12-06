import { request } from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

const httpsRequest = options => {
    options.agent = options.agent || new HttpsProxyAgent(process.env.HTTPS_PROXY);
    return new Promise((resolve, reject) => {
        const req = request(options, response => {
            const chunks = [];

            response.on('data', chunk => {
                chunks.push(chunk);
            });

            response.on('end', () => {
                const body = Buffer.concat(chunks), { headers, statusCode } = response;
                resolve({
                    statusCode,
                    headers,
                    body,
                });
            });

            response.on('error', error => {
                reject(error);
            });
        });

        if (options.body) req.write(options.body);

        req.end();
    });
};

export default httpsRequest;