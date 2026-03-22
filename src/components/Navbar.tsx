import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Sun, Moon } from "lucide-react"
import { useTypingPlaceholder } from "@/hooks/useTypingPlaceholder"
import { motion, AnimatePresence } from "framer-motion"

interface NavbarProps {
    searchQuery: string
    onSearchChange: (val: string) => void
    isAdmin?: boolean
    adminKey?: string
    theme?: "light" | "dark"
    onThemeToggle?: () => void
    onOpenAdmin?: () => void
}

const AnimatedMirrorInput = ({ value, placeholder, isFocused }: { value: string, placeholder: string, isFocused: boolean }) => {
    return (
        <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden px-3">
            <div className="flex items-center tracking-tight text-sm font-medium relative w-full">
                <AnimatePresence mode="popLayout" initial={false}>
                    {value.length === 0 ? (
                        <motion.span
                            key="placeholder"
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 0.4, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="text-muted-foreground whitespace-nowrap"
                        >
                            {placeholder}
                        </motion.span>
                    ) : (
                        <div className="flex items-center overflow-hidden">
                            {value.split("").map((char, index) => (
                                <motion.span
                                    key={`${index}-${char}`}
                                    initial={{ opacity: 0, x: 10, filter: "blur(2px)" }}
                                    animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                    exit={{ opacity: 0, x: -10, filter: "blur(2px)" }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    className="inline-block whitespace-pre"
                                >
                                    {char === " " ? "\u00A0" : char}
                                </motion.span>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
                
                <AnimatePresence>
                    {isFocused && (
                        <motion.span
                            key="search-cursor"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            exit={{ opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "easeInOut" }}
                            className="w-[1.5px] h-[1.1em] bg-[#0078d4] shrink-0"
                            style={{ 
                                marginLeft: value.length === 0 ? "1px" : "2px"
                            }}
                        />
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export function Navbar({ searchQuery, onSearchChange, isAdmin, theme, onThemeToggle, onOpenAdmin }: NavbarProps) {
    const [isFocused, setIsFocused] = useState(false)
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
                    <div className="relative group/search">
                        <Input
                            type="text"
                            placeholder=""
                            className="w-full pr-10 bg-muted/20 focus:bg-background transition-all text-transparent caret-transparent"
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    (e.target as HTMLInputElement).blur()
                                }
                            }}
                        />
                        <AnimatedMirrorInput value={searchQuery} placeholder={typingPlaceholder} isFocused={isFocused} />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/search:text-[#0078d4] transition-colors" />
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
