import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AdminPanel } from "./AdminPanel"

export function Login({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [isAdminIp, setIsAdminIp] = useState(false)
    const [showAdmin, setShowAdmin] = useState(false)

    useEffect(() => {
        // 최초 실행 시 서버로 IP를 물어보고, 관리자 IP인지 체크합니다.
        fetch('/api/ip-check')
            .then(res => res.json())
            .then(data => {
                // 실제 운영 시엔 218.55.137.10 만 매칭합니다. 개발용 localhost 추가.
                if (data.ip === "218.55.137.10" || data.ip === "::1" || data.ip === "127.0.0.1") {
                    setIsAdminIp(true)
                }
            })
            .catch(console.error)
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setLoading(true)

        try {
            const res = await fetch('/api/login', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || "알 수 없는 오류가 발생했습니다.")
            }

            // 휘발성 메모리 세션 처리 - 스토리지에 절대 저장하지 않음 (=새로고침시 풀림)
            onLoginSuccess()

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative selection:bg-blue-200">
            <Card className="w-full max-w-md shadow-lg border-border/50">
                <CardHeader className="text-center pb-8 pt-10">
                    <CardTitle className="text-3xl font-bold tracking-tight mb-2">
                        GGM <span className="text-[#0078d4]">Asset Vault</span>
                    </CardTitle>
                    <CardDescription className="text-base">
                        인가된 내부 사용자 전용 프리미엄 에셋 라이브러리
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-10">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div>
                            <Input
                                type="password"
                                placeholder="발급받은 초대 코드를 입력하세요"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="h-12 text-center text-lg tracking-widest placeholder:tracking-normal bg-background font-mono"
                            />
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm font-medium p-3 rounded-md text-center">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-[#0078d4] hover:bg-[#005a9e] h-12 text-md mt-2 transition-all shadow-md hover:shadow-lg"
                            disabled={loading || !code.trim()}
                        >
                            {loading ? "보안 검증 중..." : "보안 시스템 접속"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 관리자 IP 전용 히든 패널 런처 */}
            {isAdminIp && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdmin(true)}
                        className="text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                        System Admin Access
                    </Button>
                </div>
            )}

            {/* 관리자 패널 오버레이 */}
            {showAdmin && isAdminIp && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <AdminPanel onClose={() => setShowAdmin(false)} />
                </div>
            )}
        </div>
    )
}
