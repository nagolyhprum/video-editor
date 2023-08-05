{
    const timelineDiv = document.getElementById('timeline');
    const thumbnailsDiv = document.getElementById('thumbnails');
    const markerDiv = document.getElementById('marker');

    let mouse = false
    const moveMarker = (e) => {
        mouse = true;
        state.set({
            time : (e.clientX + timelineDiv.scrollLeft) / FPS,
            isPlaying : false
        })
    }    
    timelineDiv.onmousedown = (e) => {
        if(e.button === 0) {
            moveMarker(e)
        }
    }
    timelineDiv.onmousemove = (e) => {
        if(mouse) {
            moveMarker(e)
        }
    }
    timelineDiv.onmouseleave = timelineDiv.onmouseup = () => {
        mouse = false;
    }

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

    state.watch(["time", "isPlaying"], (time, isPlaying) => {
        markerDiv.style.left = `${time * FPS}px`   
        if(isPlaying) {
            timelineDiv.scrollLeft = time * FPS - timelineDiv.clientWidth / 2
        }
    })
    
    state.watch(["timeline", "project"], async (timeline, project) => { 
        const timelineIds = timeline.map(({ id }) => id)
        const childrenIds = Array.from(thumbnailsDiv.children).map(({ id }) => id)

        // remove thumbnails
        childrenIds.filter(id => !timelineIds.includes(id)).forEach(id => {
            thumbnailsDiv.removeChild(document.getElementById(id))
        })

        if(project) {
            const video = await videoCache(`/download/projects/${project}/video.mp3`)
            await timeline.reduce(async (promise, {
                start,
                length,
                id
            }, index) => {
                await promise
                // if i do not have that canvas then exit
                if(document.getElementById(id)) {
                    return
                }
                const height = 100
                // add canvas
                const canvas = document.createElement('canvas');
                canvas.width = length * FPS
                canvas.height = height
                canvas.id = id
                // add child at index
                const child = thumbnailsDiv.children[index]
                if(child) {
                    thumbnailsDiv.insertBefore(canvas, child)
                } else {
                    thumbnailsDiv.appendChild(canvas)
                }
                // load image
                const width = video.videoWidth * (height / video.videoHeight)
                // add background
                const context = canvas.getContext('2d');
                for(let i = 0; i < Math.ceil(canvas.width / width); i++) {
                    await seekVideo(video, start + i * (width / FPS))
                    context.drawImage(video, i * width, 0, width, height)
                    context.strokeStyle = "purple"
                    context.lineWidth = 10
                    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10)
                }
            }, Promise.resolve())
        }
    })

    state.watch(["timeline"], async (timeline) => {
        if(state.value.project) {      
            console.log({ timeline })      
            await uploadFile({
                file : new Blob([JSON.stringify(timeline)]),
                pathname : `/projects/${state.value.project}/timeline.json`
            })
        }
    })
}