import { Handler } from "@netlify/functions";

export const handler: Handler = async (event) => {
    const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

    return {
        statusCode: 200,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip: clientIp })
    };
};
