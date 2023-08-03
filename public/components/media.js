{
    const mediaDiv = document.querySelector("#media")

    state.watch(["timeline"], timeline => {
        mediaDiv.innerHTML = ""
        let startOffset = 0;
        timeline.forEach(clip => {
            clip.media.forEach(media => {
                const clipDiv = document.createElement("div")
                clipDiv.style.left = `${(startOffset + media.start) * FPS}px`
                clipDiv.style.width = `${media.length * FPS}px`
                clipDiv.style.height = `100%`
                clipDiv.style.position = `absolute`
                clipDiv.style.background = "green"
                mediaDiv.appendChild(clipDiv)
            })
            startOffset += clip.length
        })
    })
}