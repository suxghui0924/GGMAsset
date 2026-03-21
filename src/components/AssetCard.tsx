import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

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

    // 썸네일 배경 스타일 (네트워크 최적화를 유지하면서 썸네일은 보이게 함)
    const thumbnailStyle = isYoutube && videoId 
        ? { backgroundImage: `url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : isVideo 
        ? { backgroundColor: '#000' } 
        : { backgroundImage: `url(${asset.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

    return (
        <Card 
            className="overflow-hidden flex flex-col group transition-all hover:shadow-md border-border/50 hover:-translate-y-1 duration-200"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
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
                <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={thumbnailStyle}
                />

                {/* 유튜브/비디오용 재생 오버레이 (iframe 없음) */}
                {(isYoutube || isVideo) && (
                    <div className={`absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="w-14 h-10 bg-[#FF0000] rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-200">
                             <Play className="text-white fill-white" size={20} />
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/60 rounded text-[10px] text-white font-medium">
                            클릭하여 영상 보기
                        </div>
                    </div>
                )}

                {/* 일반 이미지용 (호버 시 스케일 효과만) */}
                {!isYoutube && !isVideo && (
                    <img
                        src={asset.image}
                        alt={asset.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]" title={asset.title}>
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
                        <Button variant="default" className="w-full text-xs h-8">
                            다운로드
                        </Button>
                    </a>
                    <a href={storeUrl} target="_blank" rel="noreferrer" className="w-full">
                        <Button variant="secondary" className="w-full text-xs h-8">
                            스토어
                        </Button>
                    </a>
                </div>
            </CardContent>
        </Card>
    )
}
