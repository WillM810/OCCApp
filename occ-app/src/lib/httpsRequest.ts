import { IncomingHttpHeaders } from 'http';
import { request, RequestOptions } from 'https';
import { HttpsProxyAgent } from 'https-proxy-agent';

type HttpsResponse = {
    statusCode: number | undefined;
    headers: IncomingHttpHeaders;
    body: Buffer<ArrayBuffer>;
};

const httpsRequest: (options: RequestOptions, body?: string) => Promise<HttpsResponse> = (options: RequestOptions, body?: string) => {
    options.agent = options.agent || new HttpsProxyAgent(process.env.HTTPS_PROXY!);
    return new Promise((resolve, reject) => {
        const req = request(options, response => {
            const chunks: any[] = [];

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

        if (body) req.write(body);

        req.end();
    });
};

export default httpsRequest;