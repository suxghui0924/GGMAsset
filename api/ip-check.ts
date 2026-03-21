import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel standard: x-forwarded-for contains the client IP
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress;

    return res.status(200).json({ ip: ip || "unknown" });
}
