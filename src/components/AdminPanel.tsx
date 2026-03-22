import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminPanel({ adminKey = "", onClose }: { adminKey?: string, onClose: () => void }) {
    const [codes, setCodes] = useState<any[]>([])
    const [targetGrade, setTargetGrade] = useState("1")
    const [baseYear, setBaseYear] = useState(new Date().getFullYear().toString())
    const [isAdminState, setIsAdminState] = useState(false)
    const [amount, setAmount] = useState(1) // 재생성할 키 개수
    const [loading, setLoading] = useState(false)

    // 선택된 키 목록 (일괄 삭제용)
    const [selectedCodes, setSelectedCodes] = useState<Set<string>>(new Set())

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
                is_admin: isAdminState,
                amount: amount
            })
        })
        setLoading(false)
        setIsAdminState(false)
        setAmount(1)
        fetchCodes()
    }

    const handleBulkDelete = async () => {
        if (selectedCodes.size === 0) return
        if (!confirm(`선택한 ${selectedCodes.size}개의 키를 정말 삭제하시겠습니까?`)) return

        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ codes: Array.from(selectedCodes) })
        })
        setSelectedCodes(new Set())
        fetchCodes()
    }

    const handleCopy = (code: string) => {
        navigator.clipboard.writeText(code)
        alert("복사되었습니다!")
    }

    const handleResetIp = async (code: string) => {
        if (!confirm("이 코드의 IP 제한을 초기화하시겠습니까? (다른 기기에서 접속 가능해짐)")) return
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ code, action: "reset_ip" })
        })
        fetchCodes()
    }

    const handleGradeChange = async (code: string, newGrade: string) => {
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify({ code, action: "update_grade", payload: { target_grade: parseInt(newGrade) } })
        })
        fetchCodes()
    }

    const toggleSelectAll = (checked: boolean) => {
        if (checked) setSelectedCodes(new Set(codes.map(c => c.code)))
        else setSelectedCodes(new Set())
    }

    const toggleSelect = (code: string, checked: boolean) => {
        const next = new Set(selectedCodes)
        if (checked) next.add(code)
        else next.delete(code)
        setSelectedCodes(next)
    }

    return (
        <Card className="w-full max-w-[1000px] shadow-2xl relative border-destructive flex flex-col bg-background">
            <Button variant="ghost" className="absolute right-4 top-4 z-50" onClick={onClose}>X</Button>
            <CardHeader className="flex-shrink-0">
                <CardTitle className="text-xl text-destructive flex items-center gap-2">
                    🛡️ 관리자 제어 패널
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 overflow-hidden min-h-0">
                <div className="flex flex-wrap gap-4 mb-3 p-4 border rounded-md bg-muted/20 items-end shadow-inner flex-shrink-0">
                    <div className="flex-1 min-w-[180px]">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">권한 레벨 지정</label>
                        <label className="flex items-center gap-2 text-sm font-bold bg-background p-2 border rounded cursor-pointer hover:bg-muted/50 transition">
                            <input
                                type="checkbox"
                                className="w-4 h-4 text-destructive rounded"
                                checked={isAdminState}
                                onChange={e => setIsAdminState(e.target.checked)}
                            />
                            <span className={isAdminState ? "text-destructive" : "text-foreground"}>
                                관리자 권한
                            </span>
                        </label>
                    </div>
                    <div className="w-20">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">학년</label>
                        <Input type="number" min="1" max="3" value={targetGrade} className="h-9" onChange={e => setTargetGrade(e.target.value)} />
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">기준 연도</label>
                        <Input type="number" value={baseYear} className="h-9" onChange={e => setBaseYear(e.target.value)} />
                    </div>
                    <div className="w-20">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">발급 수(개)</label>
                        <Input type="number" min="1" max="100" value={amount} className="h-9" onChange={e => setAmount(parseInt(e.target.value) || 1)} />
                    </div>
                    <div className="w-28">
                        <Button onClick={handleCreate} disabled={loading} className="w-full font-bold h-9">키 발급</Button>
                    </div>
                </div>

                <div className="mb-2 flex justify-between items-center px-1 flex-shrink-0">
                    <span className="text-sm font-medium">총 {codes.length}개의 키존재 ({selectedCodes.size}개 선택됨)</span>
                    {selectedCodes.size > 0 && (
                        <Button variant="destructive" size="sm" onClick={handleBulkDelete}>선택 일괄 삭제</Button>
                    )}
                </div>

                <div className="border rounded-md bg-background shadow flex-1 overflow-y-auto min-h-0">
                    <table className="w-full text-sm text-left relative">
                        <thead className="bg-muted text-muted-foreground text-[11px] uppercase whitespace-nowrap sticky top-0">
                            <tr>
                                <th className="p-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        onChange={e => toggleSelectAll(e.target.checked)}
                                        checked={codes.length > 0 && selectedCodes.size === codes.length}
                                    />
                                </th>
                                <th className="p-3">초대 코드 (발급된 키)</th>
                                <th className="p-3">학년 설정</th>
                                <th className="p-3">접속 IP 락 (추적)</th>
                                <th className="p-3">상태</th>
                                <th className="p-3 w-28 text-center">도구</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {codes.map(c => (
                                <tr key={c.code} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedCodes.has(c.code)}
                                            onChange={e => toggleSelect(c.code, e.target.checked)}
                                        />
                                    </td>
                                    <td className="p-3 font-mono font-bold tracking-tight">
                                        <div className="flex items-center gap-2">
                                            {c.is_admin ? <span className="text-destructive truncate max-w-[150px]" title={c.code}>👑 {c.code}</span> : <span className="text-blue-600 truncate max-w-[150px]" title={c.code}>{c.code}</span>}
                                            <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]" onClick={() => handleCopy(c.code)}>복사</Button>
                                        </div>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-1">
                                            <select
                                                className="border rounded p-1 text-xs"
                                                value={c.target_grade}
                                                onChange={e => handleGradeChange(c.code, e.target.value)}
                                            >
                                                <option value="1">1학년</option>
                                                <option value="2">2학년</option>
                                                <option value="3">3학년</option>
                                            </select>
                                            <span className="text-[10px] bg-secondary px-1 py-0.5 rounded text-muted-foreground">{c.base_year}년입학</span>
                                        </div>
                                    </td>
                                    <td className="p-3 font-mono text-xs max-w-[150px] truncate" title={c.locked_ip || "미활성"}>
                                        {c.locked_ip ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-bold">{c.locked_ip}</span>
                                                <Button variant="outline" size="sm" className="h-5 px-1.5 text-[10px]" onClick={() => handleResetIp(c.code)}>초기화</Button>
                                            </div>
                                        ) : <span className="text-muted-foreground opacity-50">대기 중</span>}
                                    </td>
                                    <td className="p-3">
                                        {c.is_used ?
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-[10px] font-bold border border-green-200">정상 사용됨</span> :
                                            <span className="text-muted-foreground bg-gray-100 px-2 py-1 rounded-full text-[10px] font-medium">안 씀</span>
                                        }
                                    </td>
                                    <td className="p-3 text-center">
                                        <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => {
                                            setSelectedCodes(new Set([c.code]));
                                            setTimeout(handleBulkDelete, 50); // 선택 후 바로 다중삭제 함수 호출로 단일 삭제 우회
                                        }}>삭제</Button>
                                    </td>
                                </tr>
                            ))}
                            {codes.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">발급된 초대코드가 없습니다.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
        </Card>
    )
}
