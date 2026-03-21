import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search } from "lucide-react"

interface NavbarProps {
    searchQuery: string
    onSearchChange: (val: string) => void
    isAdmin?: boolean
    adminKey?: string
    onOpenAdmin?: () => void
}

export function Navbar({ searchQuery, onSearchChange, isAdmin, onOpenAdmin }: NavbarProps) {
    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between mx-auto px-4 max-w-[1400px]">
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight">
                        GGM <span className="text-[#0078d4]">Asset Vault</span>
                    </span>
                </div>

                <div className="flex-1 max-w-2xl mx-8 relative">
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="에셋 검색..."
                            className="w-full pr-10"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <Button 
                            className="bg-destructive hover:bg-destructive/90 text-white font-bold tracking-widest shadow shadow-destructive/50"
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
