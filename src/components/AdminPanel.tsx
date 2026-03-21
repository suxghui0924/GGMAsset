import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function AdminPanel({ onClose }: { onClose: () => void }) {
    const [codes, setCodes] = useState<any[]>([])
    const [newCode, setNewCode] = useState("")
    const [targetGrade, setTargetGrade] = useState("1")
    const [baseYear, setBaseYear] = useState(new Date().getFullYear().toString())

    const fetchCodes = async () => {
        try {
            const res = await fetch("/api/sys-admin-kL9zQw2XP-manage")
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
        if (!newCode.trim()) return;
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: newCode.trim(), target_grade: parseInt(targetGrade), base_year: parseInt(baseYear) })
        })
        setNewCode("")
        fetchCodes()
    }

    const handleDelete = async (codeToDelete: string) => {
        if (!confirm("정말 이 코드를 삭제하시겠습니까?")) return
        await fetch("/api/sys-admin-kL9zQw2XP-manage", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: codeToDelete })
        })
        fetchCodes()
    }

    return (
        <Card className="w-full max-w-3xl max-h-[80vh] overflow-auto shadow-2xl relative border-destructive">
            <Button variant="ghost" className="absolute right-4 top-4" onClick={onClose}>X</Button>
            <CardHeader>
                <CardTitle className="text-xl text-destructive">시스템 관리자 전용 패널</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex gap-2 mb-6 p-4 border rounded-md bg-muted/30 items-center">
                    <div className="flex-1">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">초대코드 (예: GGM-NEW-USER)</label>
                        <Input placeholder="새 초대코드" value={newCode} onChange={e => setNewCode(e.target.value)} />
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">학년</label>
                        <Input type="number" value={targetGrade} onChange={e => setTargetGrade(e.target.value)} />
                    </div>
                    <div className="w-24">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">기준 연도</label>
                        <Input type="number" value={baseYear} onChange={e => setBaseYear(e.target.value)} />
                    </div>
                    <div className="pt-5">
                        <Button onClick={handleCreate} className="w-full">생성 & 발급</Button>
                    </div>
                </div>

                <div className="border rounded-md overflow-hidden bg-background">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-muted text-muted-foreground text-xs uppercase">
                            <tr>
                                <th className="p-3">초대 코드</th>
                                <th className="p-3">학년정보</th>
                                <th className="p-3">접속 IP 락</th>
                                <th className="p-3">사용 여부</th>
                                <th className="p-3 w-20 text-center">관리</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {codes.map(c => (
                                <tr key={c.code} className="hover:bg-muted/50 transition-colors">
                                    <td className="p-3 font-mono font-medium">{c.code}</td>
                                    <td className="p-3 text-muted-foreground">
                                        {c.target_grade}학년 <br />
                                        <span className="text-[10px] bg-secondary px-1 py-0.5 rounded">{c.base_year}년 시작</span>
                                    </td>
                                    <td className="p-3 font-mono text-xs max-w-[150px] truncate" title={c.locked_ip || "미활성"}>
                                        {c.locked_ip || <span className="text-muted-foreground opacity-50">대기 중</span>}
                                    </td>
                                    <td className="p-3">
                                        {c.is_used ?
                                            <span className="text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">사용 됨</span> :
                                            <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium">안 씀</span>
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
