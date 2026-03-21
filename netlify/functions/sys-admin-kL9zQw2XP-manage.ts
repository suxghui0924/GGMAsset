import { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

export const handler: Handler = async (event) => {
    const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

    // [SHADOW-OPS] 철통 보안: 지정된 최고 관리자 IP(218.55.137.10) 외 접근 절대 불가
    if (clientIp !== "218.55.137.10") {
        return { statusCode: 403, body: JSON.stringify({ error: "접근 권한이 없거나 차단된 IP입니다." }) };
    }

    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    if (!dbUrl) {
        return { statusCode: 500, body: JSON.stringify({ error: "DATABASE_URL 누락" }) };
    }
    const sql = neon(dbUrl);

    const method = event.httpMethod;

    if (method === "GET") {
        const rows = await sql`SELECT code, target_grade, base_year, locked_ip, is_used, created_at FROM invite_codes ORDER BY created_at DESC`;
        return { statusCode: 200, body: JSON.stringify({ codes: rows }) };
    }

    if (method === "POST") {
        const body = JSON.parse(event.body || "{}");
        const { code, target_grade, base_year } = body;

        if (!code || target_grade === undefined || !base_year) {
            return { statusCode: 400, body: JSON.stringify({ error: "필수 데이터 누락" }) };
        }

        await sql`INSERT INTO invite_codes (code, target_grade, base_year) VALUES (${code}, ${target_grade}, ${base_year})`;
        return { statusCode: 200, body: JSON.stringify({ success: true, message: "초대코드 생성 완료" }) };
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
