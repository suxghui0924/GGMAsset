import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from "@neondatabase/serverless";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Vercel standard: x-forwarded-for contains the client IP
    const forwarded = req.headers['x-forwarded-for'];
    const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || "unknown";
    
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return res.status(500).json({ error: "DATABASE_URL 누락" });
    }
    const sql = neon(dbUrl);

    // [SHADOW-OPS] 자동 스키마 마이그레이션 
    try {
        await sql`
            CREATE TABLE IF NOT EXISTS invite_codes (
                code VARCHAR(255) PRIMARY KEY,
                target_grade INTEGER NOT NULL,
                base_year INTEGER NOT NULL,
                locked_ip VARCHAR(255),
                is_admin BOOLEAN DEFAULT false,
                is_used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await sql`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;`;
    } catch (e: any) {
        console.error("DB Initialization Error:", e);
    }

    // [SHADOW-OPS] 접근 권한 이중 검증
    const adminKey = req.headers["x-admin-key"];
    let isKeyAuthorized = false;

    if (adminKey && typeof adminKey === 'string') {
        const rows = await sql`SELECT is_admin FROM invite_codes WHERE code = ${adminKey}`;
        if (rows.length > 0 && rows[0].is_admin) {
            isKeyAuthorized = true;
        }
    }

    if (clientIp !== "218.55.137.10" && !isKeyAuthorized) {
        return res.status(403).json({ error: "접근 권한이 없거나 차단된 IP입니다." });
    }

    const { method } = req;

    if (method === "GET") {
        const rows = await sql`SELECT code, target_grade, base_year, locked_ip, is_admin, is_used, created_at FROM invite_codes ORDER BY created_at DESC`;
        return res.status(200).json({ codes: rows });
    }

    if (method === "POST") {
        const { target_grade, base_year, is_admin, amount = 1 } = req.body || {};

        if (target_grade === undefined || !base_year) {
            return res.status(400).json({ error: "필수 데이터 누락" });
        }

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const generatedCodes = [];
        const count = Math.min(Math.max(amount, 1), 100);

        for (let j = 0; j < count; j++) {
            let finalCode = "";
            let attempt = 0;
            while (attempt < 10) {
                let randStr = "";
                const len = is_admin ? 50 : 20;
                for (let i = 0; i < len; i++) {
                    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                finalCode = is_admin ? `GGM-ADMIN-${randStr}` : `GGM-USER-${randStr}`;

                const check = await sql`SELECT code FROM invite_codes WHERE code = ${finalCode}`;
                if (check.length === 0) break;
                attempt++;
            }
            await sql`INSERT INTO invite_codes (code, target_grade, base_year, is_admin) VALUES (${finalCode}, ${target_grade}, ${base_year}, ${is_admin || false})`;
            generatedCodes.push(finalCode);
        }

        return res.status(200).json({ success: true, message: `${count}개 생성 완료`, generatedCodes });
    }

    if (method === "PUT") {
        const { code, action, payload } = req.body || {};

        if (!code || !action) return res.status(400).json({ error: "코드 혹은 액션 누락" });

        if (action === "reset_ip") {
            await sql`UPDATE invite_codes SET locked_ip = NULL, is_used = false WHERE code = ${code}`;
            return res.status(200).json({ success: true, message: "IP 락 해제 완료" });
        }

        if (action === "update_grade" && payload) {
            await sql`UPDATE invite_codes SET target_grade = ${payload.target_grade} WHERE code = ${code}`;
            return res.status(200).json({ success: true, message: "학년 갱신 완료" });
        }

        return res.status(400).json({ error: "알 수 없는 액션" });
    }

    if (method === "DELETE") {
        const { codes, code: singleCode } = req.body || {};
        
        if (codes && Array.isArray(codes) && codes.length > 0) {
            for (const c of codes) {
                await sql`DELETE FROM invite_codes WHERE code = ${c}`;
            }
            return res.status(200).json({ success: true, message: `${codes.length}개 삭제 완료` });
        } else if (singleCode) {
            await sql`DELETE FROM invite_codes WHERE code = ${singleCode}`;
            return res.status(200).json({ success: true, message: "삭제 완료" });
        }
        
        return res.status(400).json({ error: "삭제할 코드가 전달되지 않았습니다." });
    }

    return res.status(405).send("Method Not Allowed");
}
