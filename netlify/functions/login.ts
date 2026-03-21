import { Handler } from "@netlify/functions";
import { neon } from "@neondatabase/serverless";

export const handler: Handler = async (event, context) => {
    if (event.httpMethod === "OPTIONS") {
        return { statusCode: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "Content-Type" } as any, body: "" };
    }

    try {
        if (event.httpMethod !== "POST") {
            return { statusCode: 405, body: "Method Not Allowed" };
        }

        const { code } = JSON.parse(event.body || "{}");
        if (!code) return { statusCode: 400, body: JSON.stringify({ error: "초대코드를 입력해주세요." }) };

        // Netlify IP 추출
        const clientIp = event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";

        const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
        if (!dbUrl) {
            console.error("DATABASE_URL is not set.");
            return { statusCode: 500, body: JSON.stringify({ error: "서버 설정 오류입니다." }) };
        }
        const sql = neon(dbUrl);

        // [SHADOW-OPS] 보안 테이블 초기화 및 무차별 대입 방어 체크
        await sql`CREATE TABLE IF NOT EXISTS login_attempts (ip VARCHAR(255) PRIMARY KEY, attempts INTEGER DEFAULT 0, last_attempt_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`;
        
        const attemptRows = await sql`SELECT attempts, last_attempt_at FROM login_attempts WHERE ip = ${clientIp}`;
        if (attemptRows.length > 0) {
            const { attempts, last_attempt_at } = attemptRows[0];
            const lastAttempt = new Date(last_attempt_at);
            const now = new Date();
            const diffMinutes = (now.getTime() - lastAttempt.getTime()) / (1000 * 60);

            if (attempts >= 5 && diffMinutes < 30) {
                return { 
                    statusCode: 429, 
                    body: JSON.stringify({ 
                        error: `보안 위험 감지: 로그인 시도 횟수 초과. ${Math.ceil(30 - diffMinutes)}분 후 다시 시도해주세요.` 
                    }) 
                };
            }

            // 30분이 지났으면 시도 횟수 초기화 (혹은 아래에서 덮어씌움)
            if (diffMinutes >= 30) {
                await sql`DELETE FROM login_attempts WHERE ip = ${clientIp}`;
            }
        }

        const rows = await sql`SELECT * FROM invite_codes WHERE code = ${code}`;
        if (rows.length === 0) {
            // 실패 시 기록 누적
            await sql`
                INSERT INTO login_attempts (ip, attempts, last_attempt_at) 
                VALUES (${clientIp}, 1, CURRENT_TIMESTAMP) 
                ON CONFLICT (ip) 
                DO UPDATE SET attempts = login_attempts.attempts + 1, last_attempt_at = CURRENT_TIMESTAMP;
            `;
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

        // [SHADOW-OPS] 로그인 성공 시 시도 카운트 초기화
        await sql`DELETE FROM login_attempts WHERE ip = ${clientIp}`;

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
            headers: { "Content-Type": "application/json" } as any,
            body: JSON.stringify({ 
                success: true, 
                effectiveGrade, 
                lockedIp: clientIp, 
                isAdmin: invite.is_admin || code.startsWith("GGM-ADMIN-") 
            })
        };
    } catch (err: any) {
        console.error("Critical Server Error:", err);
        return { statusCode: 500, body: JSON.stringify({ error: "서버 내부 오류가 발생했습니다.", details: err.message || JSON.stringify(err) }) };
    }
};
