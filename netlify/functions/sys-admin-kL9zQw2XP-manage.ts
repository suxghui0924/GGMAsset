import { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

export const handler: Handler = async (event) => {
    const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;

    if (!dbUrl) {
        return { statusCode: 500, body: JSON.stringify({ error: "DATABASE_URL 누락" }) };
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
        // 구버전 테이블 호환 패치
        await sql`ALTER TABLE invite_codes ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;`;
    } catch (e: any) {
        console.error("DB Initialization Error:", e);
    }

    // [SHADOW-OPS] 접근 권한 이중 검증 (최고관리자 IP 혹은 발급된 Admin Key 보유자)
    const adminKey = event.headers["x-admin-key"];
    let isKeyAuthorized = false;

    if (adminKey) {
        const rows = await sql`SELECT is_admin FROM invite_codes WHERE code = ${adminKey}`;
        if (rows.length > 0 && rows[0].is_admin) {
            isKeyAuthorized = true;
        }
    }

    if (clientIp !== "218.55.137.10" && !isKeyAuthorized) {
        return { statusCode: 403, body: JSON.stringify({ error: "접근 권한이 없거나 차단된 IP입니다." }) };
    }

    const method = event.httpMethod;

    if (method === "GET") {
        const rows = await sql`SELECT code, target_grade, base_year, locked_ip, is_admin, is_used, created_at FROM invite_codes ORDER BY created_at DESC`;
        return { statusCode: 200, body: JSON.stringify({ codes: rows }) };
    }

    if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const { target_grade, base_year, is_admin, amount = 1 } = body;

        if (target_grade === undefined || !base_year) {
            return { statusCode: 400, body: JSON.stringify({ error: "필수 데이터 누락" }) };
        }

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        const generatedCodes = [];
        const count = Math.min(Math.max(amount, 1), 100); // 1~100개 제한

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

        return { statusCode: 200, body: JSON.stringify({ success: true, message: `${count}개 생성 완료`, generatedCodes }) };
    }

    if (method === "PUT") {
        const body = JSON.parse(event.body || "{}");
        const { code, action, payload } = body;

        if (!code || !action) return { statusCode: 400, body: JSON.stringify({ error: "코드 혹은 액션 누락" }) };

        if (action === "reset_ip") {
            await sql`UPDATE invite_codes SET locked_ip = NULL, is_used = false WHERE code = ${code}`;
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "IP 락 해제 완료" }) };
        }

        if (action === "update_grade" && payload) {
            await sql`UPDATE invite_codes SET target_grade = ${payload.target_grade} WHERE code = ${code}`;
            return { statusCode: 200, body: JSON.stringify({ success: true, message: "학년 갱신 완료" }) };
        }

        return { statusCode: 400, body: JSON.stringify({ error: "알 수 없는 액션" }) };
    }

    if (method === "DELETE") {
        const body = JSON.parse(event.body || "{}");
        const { codes } = body; // Array of codes
        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            // 하위 호환성 (단일 삭제)
            if (body.code) {
                await sql`DELETE FROM invite_codes WHERE code = ${body.code}`;
                return { statusCode: 200, body: JSON.stringify({ success: true, message: "삭제 완료" }) };
            }
            return { statusCode: 400, body: JSON.stringify({ error: "삭제할 코드가 전달되지 않았습니다." }) };
        }

        // 다중 삭제 루프
        for (const c of codes) {
            await sql`DELETE FROM invite_codes WHERE code = ${c}`;
        }
        return { statusCode: 200, body: JSON.stringify({ success: true, message: `${codes.length}개 삭제 완료` }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
