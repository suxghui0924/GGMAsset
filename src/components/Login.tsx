import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AdminPanel } from "./AdminPanel"
import { Sun, Moon } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const TypingText = ({ text }: { text: string }) => {
    return (
        <span className="inline-flex">
            {text.split("").map((char, index) => (
                <motion.span
                    key={index}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.2 }}
                >
                    {char === " " ? "\u00A0" : char}
                </motion.span>
            ))}
            <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="inline-block w-[3px] h-[1.1em] bg-[#0078d4] ml-1 self-center"
            />
        </span>
    )
}

interface LoginProps {
    onLoginSuccess: (isAdmin: boolean, key: string) => void
    theme?: "light" | "dark"
    onThemeToggle?: () => void
}

export function Login({ onLoginSuccess, theme, onThemeToggle }: LoginProps) {
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
        <div className="min-h-screen flex items-center justify-center relative selection:bg-blue-200 overflow-hidden bg-background">
            {/* 배경 이미지 레이어 */}
            <motion.div 
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ 
                    backgroundImage: "url('/Main.png')", 
                    backgroundSize: 'cover', 
                    backgroundPosition: 'center',
                    filter: 'blur(15px) brightness(0.7)'
                }}
            />
            <div className="absolute inset-0 z-1 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]" />

            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-10 w-full max-w-md"
            >
                <Card className="shadow-2xl border-border/50 bg-background/80 backdrop-blur-xl">
                    <CardHeader className="text-center pb-8 pt-10">
                        <CardTitle className="text-3xl font-bold tracking-tight mb-2">
                            <span className="text-foreground">GGM</span>{" "}
                            <span className="text-[#0078d4]">
                                <TypingText text="Asset" />
                            </span>
                        </CardTitle>
                        <CardDescription className="text-base text-muted-foreground font-medium">
                            경기게임마이스터고 에셋 라이브러리
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-10 pb-10">
                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-4">
                                <motion.div
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.3 }}
                                >
                                    <Input
                                        type="password"
                                        placeholder="초대 코드를 입력하세요"
                                        value={code}
                                        onChange={e => setCode(e.target.value)}
                                        className="h-12 text-center text-lg tracking-widest placeholder:tracking-normal bg-background/50 focus:bg-background transition-all font-mono shadow-inner border-border/50"
                                    />
                                </motion.div>

                                <motion.div 
                                    initial={{ x: 20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.4 }}
                                    className="flex items-start gap-3 p-3 bg-muted/40 rounded-lg border border-border/50 transition-all hover:bg-muted/60 group"
                                >
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
                                </motion.div>
                            </div>

                            <AnimatePresence mode="wait">
                                {error && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="bg-destructive/10 text-destructive text-sm font-bold p-3 rounded-md text-center border border-destructive/20 border-dashed leading-snug overflow-hidden"
                                    >
                                        {error}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <Button
                                    type="submit"
                                    className="w-full bg-[#0078d4] hover:bg-[#005a9e] h-12 text-md mt-1 transition-all shadow-xl hover:shadow-[#0078d4]/20 font-bold"
                                    disabled={loading || !code.trim() || !agreed}
                                >
                                    {loading ? "서버 검증 중..." : "로그인"}
                                </Button>
                            </motion.div>
                        </form>
                    </CardContent>
                </Card>
            </motion.div>

            {/* 왼쪽 하단 테마 토글 */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bottom-8 left-8 z-20"
            >
                <Button
                    variant="outline"
                    size="icon"
                    onClick={onThemeToggle}
                    className="rounded-full w-10 h-10 bg-background/50 backdrop-blur shadow-lg border-border/50 hover:bg-background transition-all"
                >
                    {theme === "dark" ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-blue-600" />}
                </Button>
            </motion.div>

            {/* 관리자 전용 히든 백도어 런처 */}
            <AnimatePresence>
                {canAccessAdminPanel && (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute bottom-8 right-8 z-20 flex justify-center"
                    >
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowAdmin(true)}
                            className="text-destructive/50 hover:text-destructive hover:bg-destructive/10 transition-colors font-bold tracking-widest bg-background/20 backdrop-blur px-4 underline decoration-dotted"
                        >
                            [ 관리자 패널 ]
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 관리자 패널 오버레이 */}
            <AnimatePresence>
                {showAdmin && canAccessAdminPanel && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 pt-10 pb-10 backdrop-blur-md overflow-y-auto"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 40 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 40 }}
                            className="w-full max-w-4xl"
                        >
                            <AdminPanel adminKey={code.trim()} onClose={() => setShowAdmin(false)} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
