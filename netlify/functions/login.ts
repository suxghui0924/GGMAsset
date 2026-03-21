import { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

export const handler: Handler = async (event, context) => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } };
    }

    try {
        if (event.httpMethod !== "POST") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        const { code } = JSON.parse(event.body || "{}");
        if (!code) return { statusCode: 400, body: JSON.stringify({ error: "초대코드를 입력해주세요." }) };

        // Netlify IP 추출
        const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

        if (!process.env.DATABASE_URL) {
            console.error("DATABASE_URL is not set.");
            return { statusCode: 500, body: JSON.stringify({ error: "서버 설정 오류입니다." }) };
        }
        const sql = neon(process.env.DATABASE_URL);

        const rows = await sql`SELECT * FROM invite_codes WHERE code = ${code}`;
        if (rows.length === 0) {
            return { statusCode: 401, body: JSON.stringify({ error: "유효하지 않은 초대코드입니다." }) };
        }

        const invite = rows[0];

        if (invite.locked_ip && invite.locked_ip !== clientIp) {
            // IP가 다르면 거부
            return { statusCode: 403, body: JSON.stringify({ error: "다른 기기(IP)에 종속된 초대코드입니다." }) };
        }

        if (!invite.locked_ip) {
            await sql`UPDATE invite_codes SET locked_ip = ${clientIp}, is_used = true WHERE code = ${code}`;
        }

        // 3월 12일 KST 기준 학년 계산 로직
        const now = new Date();
        const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const currentYear = kstDate.getUTCFullYear();
        const currentMonth = kstDate.getUTCMonth() + 1;
        const currentDay = kstDate.getUTCDate();

        let yearsPassed = currentYear - invite.base_year;
        // 3월 12일이 지나지 않았으면 해가 바뀌어도 아직 학년이 오르지 않음
        if (currentMonth < 3 || (currentMonth === 3 && currentDay < 12)) {
            yearsPassed -= 1;
        }
        if (yearsPassed < 0) yearsPassed = 0;

        const effectiveGrade = invite.target_grade + yearsPassed;

        if (effectiveGrade >= 4) {
            return { statusCode: 403, body: JSON.stringify({ error: "만료된 코드입니다. (졸업)" }) };
        }

        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ success: true, effectiveGrade, lockedIp: clientIp })
        };
    } catch (err: any) {
        console.error(err);
        return { statusCode: 500, body: JSON.stringify({ error: "서버 내부 오류가 발생했습니다." }) };
    }
};
