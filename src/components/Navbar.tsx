import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sun, Moon } from "lucide-react"
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder"

interface NavbarProps {
    searchQuery: string
    onSearchChange: (val: string) => void
    isAdmin?: boolean
    adminKey?: string
    theme?: "light" | "dark"
    onThemeToggle?: () => void
    onOpenAdmin?: () => void
}

export function Navbar({ searchQuery, onSearchChange, isAdmin, theme, onThemeToggle, onOpenAdmin }: NavbarProps) {
    const typingPlaceholder = useTypingPlaceholder("에셋 검색...", 150, 3000)

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-300">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-[1400px]">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">
                        GGM <span className="text-[#0078d4]">Asset</span>
                    </span>
                </div>

                <div className="flex-1 max-w-2xl mx-8 relative">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder={typingPlaceholder}
                            className="w-full pr-10 bg-muted/20 focus:bg-background transition-all"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onThemeToggle}
                        className="rounded-full w-9 h-9"
                    >
                        {theme === "dark" ? <Sun className="h-4 w-4 text-yellow-500" /> : <Moon className="h-4 w-4 text-blue-600" />}
                    </Button>

                    {isAdmin && (
                        <Button 
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold tracking-widest shadow-lg shadow-destructive/20 h-9 px-4"
                            onClick={onOpenAdmin}
                        >
                            ADMIN PANEL
                        </Button>
                    )}
                </div>
            </div>
        </nav>
    )
}
