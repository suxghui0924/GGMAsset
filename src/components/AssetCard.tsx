import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Asset {
    id: number
    title: string
    image: string
    storeUrl: string
    tags: string[]
}

export function AssetCard({ asset }: { asset: Asset }) {
    const [isHovered, setIsHovered] = useState(false)

    const isYoutube = /youtube\.com|youtu\.be|youtube-nocookie\.com/.test(asset.image)
    const isVideo = /\.(mp4|webm|ogg)$/i.test(asset.image)

    let videoId = ""
    if (isYoutube) {
        const match = asset.image.match(/(?:youtube(?:-nocookie)?\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        if (match) videoId = match[1]
    }

    const tagText = asset.tags?.length ? asset.tags.join(', ') : '패키지'
    const searchQuery = encodeURIComponent(`${asset.title}.unitypackage`)
    const driveSearchUrl = `https://drive.google.com/drive/search?q=${searchQuery}`
    const storeUrl = asset.storeUrl || `https://assetstore.unity.com/?q=${encodeURIComponent(asset.title)}`

    // 썸네일 배경 스타일
    const thumbnailStyle = isYoutube && videoId 
        ? { backgroundImage: `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : isVideo 
        ? { backgroundColor: '#000' } 
        : { backgroundImage: `url(${asset.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

    return (
        <motion.div
            layout
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.98 }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="h-full"
        >
            <Card className="overflow-hidden flex flex-col h-full group transition-shadow hover:shadow-xl border-border/50 bg-card duration-300">
                <a 
                    href={isYoutube || isVideo ? asset.image : undefined} 
                    target="_blank" 
                    rel="noreferrer"
                    className={`relative w-full aspect-video bg-black overflow-hidden ${isYoutube || isVideo ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={(e) => {
                        if (!isYoutube && !isVideo) e.preventDefault();
                    }}
                >
                    {/* 배경 썸네일 */}
                    <motion.div 
                        animate={{ scale: isHovered ? 1.05 : 1 }}
                        transition={{ duration: 0.4 }}
                        className="absolute inset-0 w-full h-full bg-cover bg-center"
                        style={thumbnailStyle}
                    />

                    {/* 유튜브/비디오용 재생 오버레이 */}
                    {(isYoutube || isVideo) && (
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px]"
                                >
                                    <motion.div 
                                        initial={{ scale: 0.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        className="w-14 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center shadow-2xl"
                                    >
                                         <Play className="text-white fill-white" size={20} />
                                    </motion.div>
                                    <motion.div 
                                        initial={{ y: 10, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium"
                                    >
                                        클릭하여 영상 보기
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* 일반 이미지용 (호버 시 스케일 효과만 - CSS 대신 motion 사용) */}
                    {!isYoutube && !isVideo && (
                        <img
                            src={asset.image}
                            alt={asset.title}
                            className="hidden" // use background div for better control
                            onError={(e) => { 
                                e.currentTarget.onerror = null; 
                                e.currentTarget.src = '/Main.png'; 
                            }}
                        />
                    )}
                </a>

                <CardContent className="p-4 flex flex-col flex-1 gap-2">
                    <Badge variant="secondary" className="w-fit text-xs text-[#0078d4] bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-50/80 font-medium border-0">
                        {tagText}
                    </Badge>
                    <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem] group-hover:text-[#0078d4] transition-colors duration-200" title={asset.title}>
                        {asset.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-auto mb-2">
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium border border-border/50">
                            {isYoutube || isVideo ? "🎬 동영상 프리뷰" : "📸 이미지 에셋"}
                        </span>
                        <span className="text-[10px] text-muted-foreground/60">• 유니티 패키지</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-auto">
                        <a href={driveSearchUrl} target="_blank" rel="noreferrer" className="w-full">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button variant="default" className="w-full text-xs h-8 bg-[#0078d4] hover:bg-[#005a9e]">
                                    다운로드
                                </Button>
                            </motion.div>
                        </a>
                        <a href={storeUrl} target="_blank" rel="noreferrer" className="w-full">
                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                <Button variant="secondary" className="w-full text-xs h-8">
                                    스토어
                                </Button>
                            </motion.div>
                        </a>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
