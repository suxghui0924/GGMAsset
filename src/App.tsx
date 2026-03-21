import { useState, useMemo, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Sidebar } from "@/components/Sidebar"
import { AssetCard } from "@/components/AssetCard"
import { Login } from "@/components/Login"
import { AdminPanel } from "@/components/AdminPanel"
import { assets } from "@/data"

const CATEGORIES = ["all", "2D", "3D", "VFX", "UI", "Misc"]

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminKey, setAdminKey] = useState("")
  const [showAdmin, setShowAdmin] = useState(false)

  const [searchQuery, setSearchQuery] = useState("")
  const [currentCategory, setCurrentCategory] = useState("all")
  const [currentSort, setCurrentSort] = useState("name")
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as "light" | "dark") || "light"
    }
    return "light"
  })

  // 테마 적용 로직
  useEffect(() => {
    const root = window.document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const filteredAssets = useMemo(() => {
    let result = assets.filter((asset) => {
      const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory =
        currentCategory === "all" ||
        asset.tags.some((tag) => {
          if (currentCategory === "UI") return tag.includes("UI")
          if (currentCategory === "Misc") return tag.includes("기타")
          if (currentCategory === "VFX") return tag.includes("VFX")
          if (currentCategory === "3D") return tag.includes("3D")
          return tag === currentCategory
        })
      return matchesSearch && matchesCategory
    })

    if (currentSort === "name") {
      result.sort((a, b) => a.title.localeCompare(b.title))
    } else if (currentSort === "newest") {
      result.sort((a, b) => b.id - a.id)
    }

    return result
  }, [searchQuery, currentCategory, currentSort])

  if (!isLoggedIn) {
    return <Login 
        theme={theme}
        onThemeToggle={() => setTheme(t => t === "light" ? "dark" : "light")}
        onLoginSuccess={(adminStatus, key) => {
            setIsLoggedIn(true)
            setIsAdmin(adminStatus)
            setAdminKey(key)
        }} 
    />
  }

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-foreground font-sans">
      <Navbar 
        searchQuery={searchQuery} 
        onSearchChange={setSearchQuery} 
        isAdmin={isAdmin} 
        adminKey={adminKey} 
        theme={theme}
        onThemeToggle={() => setTheme(t => t === "light" ? "dark" : "light")}
        onOpenAdmin={() => setShowAdmin(true)} 
      />

      <main className="container mx-auto px-4 max-w-[1400px] py-8 flex gap-8">
        <Sidebar
          categories={CATEGORIES}
          currentCategory={currentCategory}
          onSelectCategory={setCurrentCategory}
        />

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold tracking-tight">
              {currentCategory === "all" ? "모든 카테고리의 에셋" : `카테고리: "${currentCategory}"`}
            </h1>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery("")
                  setCurrentCategory("all")
                  setCurrentSort("name")
                }}
                className="text-sm px-3 py-1.5 border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5 text-muted-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                필터 초기화
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">정렬</span>
                <select
                  className="text-sm border rounded-md px-2 py-1.5 bg-background outline-none hover:border-blue-300 transition-colors"
                  value={currentSort}
                  onChange={(e) => setCurrentSort(e.target.value)}
                >
                  <option value="name">이름순</option>
                  <option value="newest">최신순 (ID순)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6 text-sm text-muted-foreground">
            {filteredAssets.length} 개의 결과
          </div>

          {filteredAssets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 pb-12">
              {filteredAssets.map((asset) => (
                <AssetCard key={asset.id} asset={asset} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 text-muted-foreground">
              <h2 className="text-xl font-medium mb-2 opacity-80">일치하는 에셋이 없습니다</h2>
              <p className="text-sm">다른 검색어나 카테고리를 선택해 보세요.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground mt-8">
        <p>GGM Asset © 2026 | 경기게임마이스터고 에셋 저장소</p>
      </footer>

      {/* 전역 관리자 패널 오버레이 (최상위 레빌 렌더링으로 위치 오류 방지) */}
      {showAdmin && isAdmin && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-start justify-center p-4 pt-10 pb-10 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
          <AdminPanel adminKey={adminKey} onClose={() => setShowAdmin(false)} />
        </div>
      )}
    </div>
  )
}
