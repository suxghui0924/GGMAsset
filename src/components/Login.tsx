import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AdminPanel } from "./AdminPanel"

export function Login({ onLoginSuccess }: { onLoginSuccess: (isAdmin: boolean, key: string) => void }) {
    const [code, setCode] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [isAdminIp, setIsAdminIp] = useState(false)
    const [showAdmin, setShowAdmin] = useState(false)

    const [agreed, setAgreed] = useState(false)

    // 입력 중인 코드가 관리자 키 규격인지 실시간 감지 (백도어 트리거)
    const isShadowKey = code.trim().startsWith("GGM-ADMIN-")
    const canAccessAdminPanel = isAdminIp || isShadowKey

    useEffect(() => {
        // 최초 실행 시 서버로 IP를 물어보고, 최고 관리자 IP 지정 확인
        fetch('/api/ip-check')
            .then(res => res.json())
            .then(data => {
                if (data.ip === "218.55.137.10") {
                    setIsAdminIp(true)
                }
            })
            .catch(console.error)
    }, [])

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!agreed) {
            setError("이용약관 및 개인정보(IP) 수집에 동의해야 접속 가능합니다.")
            return
        }
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
                throw new Error(data.details || data.error || "일치하는 보안 자격 증명이 없습니다.")
            }

            // 올바른 키일 경우 로그인 성공 처리 (관리자 여부와 키값 전달)
            onLoginSuccess(data.isAdmin, code.trim())

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
                    <CardDescription className="text-base text-muted-foreground font-medium">
                        경기게임마이스터고 에셋 라이브러리
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-10 pb-10">
                    <form onSubmit={handleLogin} className="flex flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            <Input
                                type="password"
                                placeholder="초대 코드를 입력하세요"
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                className="h-12 text-center text-lg tracking-widest placeholder:tracking-normal bg-background font-mono shadow-inner"
                            />

                            <div className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 transition-all hover:bg-muted/60 group">
                                <input
                                    type="checkbox"
                                    id="tos"
                                    checked={agreed}
                                    onChange={(e) => setAgreed(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-gray-300 text-[#0078d4] focus:ring-[#0078d4] cursor-pointer"
                                />
                                <label htmlFor="tos" className="text-[11px] text-muted-foreground leading-relaxed cursor-pointer select-none group-hover:text-foreground/80 transition-colors">
                                    본 시스템 접속 시 기기 식별 및 보안을 위해 <span className="text-foreground font-semibold underline decoration-dotted underline-offset-2">접속 IP 주소를 수집</span>하며,
                                    이는 외부 노출 없이 오직 1기기 1코드 보안 정책(IP Lock) 유지 목적으로만 사용됨에 동의합니다.
                                </label>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-md text-center border border-destructive/20 border-dashed animate-in fade-in zoom-in-95 leading-snug">
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full bg-[#0078d4] hover:bg-[#005a9e] h-12 text-md mt-1 transition-all shadow-md hover:shadow-lg font-bold"
                            disabled={loading || !code.trim() || !agreed}
                        >
                            {loading ? "서버 검증 중..." : "로그인"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* 관리자 전용 히든 백도어 런처 */}
            {canAccessAdminPanel && (
                <div className="absolute bottom-8 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-5 fade-in duration-500">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAdmin(true)}
                        className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors font-bold tracking-widest"
                    >
                        [ 관리자 패널 ]
                    </Button>
                </div>
            )}

            {/* 관리자 패널 오버레이 (비로그인 상태 백도어 전용) */}
            {showAdmin && canAccessAdminPanel && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 pt-10 pb-10 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
                    <AdminPanel adminKey={code.trim()} onClose={() => setShowAdmin(false)} />
                </div>
            )}
        </div>
    )
}
