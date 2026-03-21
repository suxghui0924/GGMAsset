import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminPanel({ adminKey = "", onClose }: { adminKey?: string, onClose: () => void }) {
    const [codes, setCodes] = useState<any[]>([])
    const [targetGrade, setTargetGrade] = useState("1")
    const [baseYear, setBaseYear] = useState(new Date().getFullYear().toString())
    const [isAdminState, setIsAdminState] = useState(false) // 관리자 권한 부여 여부
    const [loading, setLoading] = useState(false)

    // API 요청 시 x-admin-key 헤더 탑재
    const getHeaders = () => {
        const headers: Record<string, string> = { "Content-Type": "application/json" }
        if (adminKey) headers["x-admin-key"] = adminKey
        return headers
    }

    const fetchCodes = async () => {
        try {
            const res = await fetch("/api/sys-admin-kL9zQw2XP-manage", { headers: getHeaders() })
            if (res.ok) {
                const data = await res.json()
                if (data.codes) setCodes(data.codes)
            }
        } catch (e) {
            console.error(e)
        }
    }

    useEffect(() => { fetchCodes() }, [])

    const handleCreate = async () => {
        setLoading(true)
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ 
                target_grade: parseInt(targetGrade), 
                base_year: parseInt(baseYear), 
                is_admin: isAdminState 
            })
        })
        setLoading(false)
        setIsAdminState(false)
        fetchCodes()
    }

    const handleDelete = async (codeToDelete: string) => {
        if (!confirm("정말 이 코드를 삭제하시겠습니까?")) return
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ code: codeToDelete })
        })
        fetchCodes()
    }

    return (
        <Card className="w-full max-w-4xl max-h-[85vh] overflow-auto shadow-2xl relative border-destructive">
            <Button variant="ghost" className="absolute right-4 top-4" onClick={onClose}>X</Button>
            <CardHeader>
                <CardTitle className="text-xl text-destructive flex items-center gap-2">
                    🛡️ SHADOW-CORE Admin Panel
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-4 mb-6 p-5 border rounded-md bg-muted/20 items-end shadow-inner">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground mb-2 block">권한 레벨 지정</label>
                        <label className="flex items-center gap-2 text-sm font-bold bg-background p-3 border rounded cursor-pointer hover:bg-muted/50 transition">
                            <input 
                                type="checkbox" 
                                className="w-4 h-4 text-destructive rounded"
                                checked={isAdminState} 
                                onChange={e => setIsAdminState(e.target.checked)} 
                            />
                            <span className={isAdminState ? "text-destructive" : "text-foreground"}>
                                최고 관리자(SHADOW) 권한 부여
                            </span>
                        </label>
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">학년</label>
                        <Input type="number" min="1" max="3" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} />
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">기준 연도</label>
                        <Input type="number" value={baseYear} onChange={e => setBaseYear(e.target.value)} />
                    </div>
                    <div className="w-32 pt-5">
                        <Button onClick={handleCreate} disabled={loading} className="w-full font-bold">자동 생성 & 발급</Button>
                    </div>
                </div>

                <div className="border rounded-md overflow-hidden bg-background shadow">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="p-3">초대 코드 (발급된 키)</th>
                                <th className="p-3">권한 / 학년별</th>
                                <th className="p-3">접속 IP 락 (추적)</th>
                                <th className="p-3">상태</th>
                                <th className="p-3 w-20 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {codes.map(c => (
                                <tr key={c.code} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-3 font-mono font-bold tracking-tight">
                                        {c.is_admin ? <span className="text-destructive">👑 {c.code}</span> : <span className="text-blue-600">{c.code}</span>}
                                    </td>
                                    <td className="p-3 text-muted-foreground">
                                        <div className="font-semibold">{c.is_admin ? "최고 관리자" : "일반 학생"}</div>
                                        <div className="text-[10px] bg-secondary px-1 py-0.5 rounded inline-block mt-1">
                                            {c.base_year}년입학 / {c.target_grade}학년
                                        </div>
                                    </td>
                                    <td className="p-3 font-mono text-xs max-w-[160px] truncate" title={c.locked_ip || "미활성"}>
                                        {c.locked_ip ? <span className="text-red-500 font-bold">{c.locked_ip}</span> : <span className="text-muted-foreground opacity-50">대기 중</span>}
                                    </td>
                                    <td className="p-3">
                                        {c.is_used ?
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-bold border border-green-200">정상 사용됨</span> :
                                            <span className="text-muted-foreground bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium">안 씀</span>
                                        }
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => handleDelete(c.code)}>파기</Button>
                                    </td>
                                </tr>
                            ))}
                            {codes.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-muted-foreground">발급된 초대코드가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
