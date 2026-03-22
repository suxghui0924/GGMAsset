import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from "@neondatabase/serverless";

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method === "OPTIONS") {
        return res.status(200).setHeader("Access-Control-Allow-Origin", "*").setHeader("Access-Control-Allow-Headers", "Content-Type").send("");
    }

    try {
        if (req.method !== "POST") {
            return res.status(405).send("Method Not Allowed");
        }

        const { code, deviceId } = req.body || {};
        if (!code) return res.status(400).json({ error: "초대코드를 입력해주세요." });

        // Vercel standard: x-forwarded-for contains the client IP
        const forwarded = req.headers['x-forwarded-for'];
        const clientIp = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket.remoteAddress || "unknown";

        const dbUrl = process.env.DATABASE_URL;
        if (!dbUrl) {
            console.error("DATABASE_URL is not set.");
            return res.status(500).json({ error: "서버 설정 오류입니다. (DB URL 미설정)" });
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
                return res.status(429).json({ 
                    error: `보안 위험 감지: 로그인 시도 횟수 초과. ${Math.ceil(30 - diffMinutes)}분 후 다시 시도해주세요.` 
                });
            }

            // 30분이 지났으면 시도 횟수 초기화
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
            return res.status(401).json({ error: "유효하지 않은 초대코드입니다." });
        }

        const invite = rows[0];

        // [SHADOW-OPS] Device ID 기반 락 검증 (IP 대신 강력한 기기 식별)
        if (invite.locked_device_id && deviceId && invite.locked_device_id !== deviceId) {
            return res.status(403).json({ error: "다른 기기에 종속된 초대코드입니다. (기기 제한)" });
        }

        // 구 버전 호환성 혹은 추가 보안을 위해 IP 락도 확인 (선택 사항이나 여기서는 Device ID 우선)
        // if (invite.locked_ip && invite.locked_ip !== clientIp) { ... }

        if (!invite.locked_device_id && deviceId) {
            await sql`UPDATE invite_codes SET locked_device_id = ${deviceId}, locked_ip = ${clientIp}, is_used = true WHERE code = ${code}`;
        } else {
            // 이미 기기가 등록된 경우, IP 정보만 최신화 (모니터링용)
            await sql`UPDATE invite_codes SET locked_ip = ${clientIp} WHERE code = ${code}`;
        }

        // 로그인 성공 시 시도 카운트 초기화
        await sql`DELETE FROM login_attempts WHERE ip = ${clientIp}`;

        // 3월 12일 KST 기준 학년 계산
        const now = new Date();
        const kstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000);
        const currentYear = kstDate.getUTCFullYear();
        const currentMonth = kstDate.getUTCMonth() + 1;
        const currentDay = kstDate.getUTCDate();

        let yearsPassed = currentYear - invite.base_year;
        if (currentMonth < 3 || (currentMonth === 3 && currentDay < 12)) {
            yearsPassed -= 1;
        }
        if (yearsPassed < 0) yearsPassed = 0;

        const effectiveGrade = invite.target_grade + yearsPassed;

        if (effectiveGrade >= 4) {
            return res.status(403).json({ error: "만료된 코드입니다. (졸업)" });
        }

        return res.status(200).json({ 
            success: true, 
            effectiveGrade, 
            lockedIp: clientIp, 
            isAdmin: invite.is_admin || code.startsWith("GGM-ADMIN-") 
        });

    } catch (err: any) {
        console.error("Critical Server Error:", err);
        return res.status(500).json({ error: "서버 내부 오류가 발생했습니다.", details: err.message || JSON.stringify(err) });
    }
}
