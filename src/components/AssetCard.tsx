import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

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
        ? { backgroundImage: `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg'), url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')` }
        : isVideo 
        ? { backgroundColor: '#000' } // 비디오는 썸네일이 따로 없으면 검은색 (필요시 커버 이미지 추가 가능)
        : { backgroundImage: `url(${asset.image})`, backgroundSize: 'cover', backgroundPosition: 'center' };

    return (
        <Card 
            className="overflow-hidden flex flex-col group transition-all hover:shadow-md border-border/50 hover:-translate-y-1 duration-200"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="relative w-full aspect-video bg-black overflow-hidden">
                {/* 기본 썸네일 (호버하지 않았을 때 혹은 비디오가 없을 때) */}
                <div 
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-opacity duration-300"
                    style={thumbnailStyle}
                />

                {/* 호버 시에만 비디오/유튜브 렌더링 (Lazy Loading & Autoplay Control) */}
                {isHovered && (
                    <div className="absolute inset-0 z-20 animate-in fade-in duration-300">
                        {isYoutube && videoId ? (
                            <iframe
                                className="w-full h-full pointer-events-none"
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}&rel=0`}
                                title={`${asset.title} Video Preview`}
                                frameBorder="0"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="strict-origin-when-cross-origin"
                            />
                        ) : isVideo ? (
                            <video src={asset.image} autoPlay muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
                        ) : null}
                    </div>
                )}

                {/* 이미지 일반 렌더링 (유튜브나 비디오가 아닐 때) */}
                {!isYoutube && !isVideo && (
                    <img
                        src={asset.image}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                            e.currentTarget.onerror = null; 
                            e.currentTarget.src = '/Main.png'; 
                        }}
                    />
                )}
                
                <div className="absolute inset-0 z-30 bg-transparent cursor-pointer" />
            </div>

            <CardContent className="p-4 flex flex-col flex-1 gap-2">
                <Badge variant="secondary" className="w-fit text-xs text-[#0078d4] bg-blue-50 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-50/80 font-medium border-0">
                    {tagText}
                </Badge>
                <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[2.5rem]" title={asset.title}>
                    {asset.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-auto mb-2">유니티 패키지</p>

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
