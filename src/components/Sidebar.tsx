import { cn } from "@/lib/utils"

interface SidebarProps {
    categories: string[]
    currentCategory: string
    onSelectCategory: (category: string) => void
}

export function Sidebar({ categories, currentCategory, onSelectCategory }: SidebarProps) {
    return (
        <aside className="w-60 shrink-0 hidden lg:block">
            <h3 className="font-semibold text-sm mb-4 text-foreground/80">카테고리</h3>
            <ul className="space-y-1">
                {categories.map((cat) => (
                    <li key={cat}>
                        <button
                            onClick={() => onSelectCategory(cat)}
                            className={cn(
                                "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                                currentCategory === cat
                                    ? "bg-blue-50 text-[#0078d4] dark:bg-blue-900/30 dark:text-blue-400 font-medium"
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {cat === 'all' ? '전체보기' : cat}
                        </button>
                    </li>
                ))}
            </ul>
        </aside>
    )
}
