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
        // 코드(code)는 백엔드에서 자동 생성하므로 입력받지 않음
        const { target_grade, base_year, is_admin } = body;

        if (target_grade === undefined || !base_year) {
            return { statusCode: 400, body: JSON.stringify({ error: "필수 데이터 누락" }) };
        }

        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let finalCode = "";
        let attempt = 0;

        // 절대 중복 방지 (충돌 시 재생성)
        while (attempt < 10) {
            let randStr = "";
            const len = is_admin ? 50 : 20;
            for (let i = 0; i < len; i++) {
                randStr += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            finalCode = is_admin ? `GGM-ADMIN-${randStr}` : `GGM-USER-${randStr}`;

            const check = await sql`SELECT code FROM invite_codes WHERE code = ${finalCode}`;
            if (check.length === 0) break; // 중복 없음 확인
            attempt++;
        }

        await sql`INSERT INTO invite_codes (code, target_grade, base_year, is_admin) VALUES (${finalCode}, ${target_grade}, ${base_year}, ${is_admin || false})`;
        return { statusCode: 200, body: JSON.stringify({ success: true, message: "초대코드 생성 완료", generatedCode: finalCode }) };
    }

    if (method === "DELETE") {
        const body = JSON.parse(event.body || "{}");
        const { code } = body;
        if (!code) return { statusCode: 400, body: JSON.stringify({ error: "코드 누락" }) };

        await sql`DELETE FROM invite_codes WHERE code = ${code}`;
        return { statusCode: 200, body: JSON.stringify({ success: true, message: "삭제 완료" }) };
    }

    return { statusCode: 405, body: "Method Not Allowed" };
};
