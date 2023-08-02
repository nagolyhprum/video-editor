{
    const timelineDiv = document.getElementById('timeline');
    const thumbnailsDiv = document.getElementById('thumbnails');
    const markerDiv = document.getElementById('marker');

    const FPS = 10

    const videoCache = (() => {
        const cache = {}
        return (url) => {
            return new Promise(resolve => {
                if(!cache[url]) {
                    const video = document.createElement("video");
                    video.src = url;
                    cache[url] = video
                    video.onloadeddata = () => {
                        resolve(video)
                    }
                } else {
                    resolve(cache[url])
                }
            })
        }
    })()

    state.watch(["time"], time => {
        markerDiv.style.left = `${time * FPS}px`   
        timelineDiv.scrollLeft = time * FPS - timelineDiv.clientWidth / 2
    })
    
    state.watch(["timeline", "project"], async (timeline, project) => { 
        thumbnailsDiv.innerHTML = ""
        if(project) {
            const video = await videoCache(`/download/projects/${project}/video.mp3`)
            await timeline.reduce(async (promise, {
                start,
                length,
                type
            }) => {
                await promise
                const height = 100
                // add canvas
                const canvas = document.createElement('canvas');
                canvas.width = length * FPS
                canvas.height = height
                thumbnailsDiv.appendChild(canvas)
                // load image
                const image = await extractFrameFromVideo(video, start, height)
                const width = image.width
                // add background
                const context = canvas.getContext('2d');
                for(let i = 0; i < Math.ceil(canvas.width / width); i++) {
                    const thumbnail = await extractFrameFromVideo(video, start + i * (width / FPS), height)
                    context.drawImage(thumbnail, i * width, 0, width, height)
                }
            }, Promise.resolve())
        }
    })
}