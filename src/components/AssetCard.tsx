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
    const isYoutube = /youtube\.com|youtu\.be/.test(asset.image)
    const isVideo = /\.(mp4|webm|ogg)$/i.test(asset.image)

    let videoId = ""
    if (isYoutube) {
        const match = asset.image.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
        if (match) videoId = match[1]
    }

    const tagText = asset.tags?.length ? asset.tags.join(', ') : '패키지'
    const searchQuery = encodeURIComponent(`${asset.title}.unitypackage`)
    const driveSearchUrl = `https://drive.google.com/drive/search?q=${searchQuery}`
    const storeUrl = asset.storeUrl || `https://assetstore.unity.com/?q=${encodeURIComponent(asset.title)}`

    return (
        <Card className="overflow-hidden flex flex-col group transition-all hover:shadow-md border-border/50 hover:-translate-y-1 duration-200">
            <div className="relative w-full aspect-video bg-black overflow-hidden">
                {isYoutube && videoId ? (
                    <div
                        className="w-full h-full bg-cover bg-center flex items-center justify-center"
                        style={{ backgroundImage: `url('https://img.youtube.com/vi/${videoId}/maxresdefault.jpg'), url('https://img.youtube.com/vi/${videoId}/hqdefault.jpg')` }}
                    >
                        <iframe
                            className="w-full h-full pointer-events-none"
                            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1`}
                            frameBorder="0"
                            allow="autoplay; encrypted-media"
                            allowFullScreen
                        />
                    </div>
                ) : isVideo ? (
                    <video src={asset.image} autoPlay muted loop playsInline className="w-full h-full object-cover pointer-events-none" />
                ) : (
                    <img
                        src={asset.image}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.src = 'no-image.png' }}
                    />
                )}
                <div className="absolute inset-0 z-10 bg-transparent cursor-pointer" />
            </div>

            <CardContent className="p-4 flex flex-col flex-1 gap-2">
                <Badge variant="secondary" className="w-fit text-xs text-[#0078d4] bg-blue-50 hover:bg-blue-50/80 font-medium border-0">
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
