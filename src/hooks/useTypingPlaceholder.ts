import { useState, useEffect } from "react"

export function useTypingPlaceholder(fullText: string, speed: number = 100, delay: number = 2000, maxLoops: number = 2) {
    const [placeholder, setPlaceholder] = useState("")
    const [isDeleting, setIsDeleting] = useState(false)
    const [loopNum, setLoopNum] = useState(0)
    const [isStopped, setIsStopped] = useState(false)

    useEffect(() => {
        if (isStopped) return

        let timer: ReturnType<typeof setTimeout>

        const handleTyping = () => {
            const shouldDelete = isDeleting
            const currentText = fullText
            
            if (!shouldDelete) {
                setPlaceholder(currentText.substring(0, placeholder.length + 1))
                
                if (placeholder.length + 1 === currentText.length) {
                    if (loopNum >= maxLoops - 1) {
                        setIsStopped(true)
                        return
                    }
                    timer = setTimeout(() => setIsDeleting(true), delay)
                    return
                }
            } else {
                setPlaceholder(currentText.substring(0, placeholder.length - 1))
                
                if (placeholder.length === 0) {
                    setIsDeleting(false)
                    setLoopNum(loopNum + 1)
                }
            }

            const typingSpeed = shouldDelete ? speed / 2 : speed
            timer = setTimeout(handleTyping, typingSpeed)
        }

        timer = setTimeout(handleTyping, speed)

        return () => clearTimeout(timer)
    }, [placeholder, isDeleting, fullText, speed, delay, loopNum, isStopped, maxLoops])

    return isStopped ? fullText : placeholder
}
