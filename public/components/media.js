{
    const mediaDiv = document.querySelector("#media")

    const deleteMedia = (clip, media) => {
        const clipIndex = state.value.timeline.indexOf(clip)
        const mediaIndex = clip.media.indexOf(media)
        state.set({
            timeline : [
                ...state.value.timeline.slice(0, clipIndex),
                {
                    ...clip,
                    media : [
                        ...clip.media.slice(0, mediaIndex),
                        ...clip.media.slice(mediaIndex + 1)
                    ]
                },
                ...state.value.timeline.slice(clipIndex + 1)
            ]
        })
    }

    async function drawAudioWaveform(src) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const result = await fetch(src)
        const arrayBuffer = await result.arrayBuffer()
        return new Promise(resolve => {
            audioContext.decodeAudioData(arrayBuffer, (buffer) => {                
                const canvas = document.createElement('canvas');
                canvas.width = buffer.duration * FPS
                canvas.height = 100
                const width = canvas.width;
                const height = canvas.height;
                const ctx = canvas.getContext('2d');
                const data = buffer.getChannelData(0);
                const bufferLength = data.length;
                const sliceWidth = width / bufferLength;
                let x = 0;
        
                ctx.clearRect(0, 0, width, height);
                ctx.strokeStyle = 'rgb(0, 0, 0)';
                ctx.lineWidth = 1;
                ctx.beginPath();
        
                for (let i = 0; i < bufferLength; i++) {
                    const v = data[i];
                    const y = (v + 1) * (height / 2);
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    x += sliceWidth;
                }        
                ctx.lineTo(canvas.width, canvas.height / 2);
                ctx.stroke();
                resolve(canvas)
            });
        })
    }

    state.watch(["timeline"], timeline => {
        const mediaIds = timeline.map(({ media }) => media.map(({ id }) => id)).flat()
        const childrenIds = Array.from(mediaDiv.children).map(({ id }) => id)
        // remove media
        childrenIds.filter(id => !mediaIds.includes(id)).forEach(id => {
            mediaDiv.removeChild(document.getElementById(id))
        })

        let startOffset = 0;
        timeline.forEach(clip => {
            clip.media.forEach(async (media) => {
                const clipDiv = document.getElementById(media.id) || document.createElement("div")
                clipDiv.style.left = `${(startOffset + media.start) * FPS}px`
                clipDiv.style.width = `${media.length * FPS}px`
                clipDiv.style.height = `100%`
                clipDiv.style.position = `absolute`
                clipDiv.id = media.id
                clipDiv.onclick = (e) => {
                    e.preventDefault()
                    e.stopPropagation();
                    const start = prompt("Enter a value", parseFloat(media.value))
                    if(!isNaN(start)) {
                        state.set({
                            timeline : timeline.map(innerClip => {
                                if(clip.id === innerClip.id) {
                                    return {
                                        ...innerClip,
                                        media : clip.media.map((innerMedia) => {
                                            if(media.id === innerMedia.id) {
                                                return {
                                                    ...innerMedia,
                                                    start
                                                }
                                            } else {
                                                return innerMedia
                                            }
                                        })
                                    }
                                } else {
                                    return innerClip
                                }
                            })
                        })
                    }
                };
                clipDiv.oncontextmenu = (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if(confirm("Are you sure you want to delete this media?")) {
                        deleteMedia(clip, media)
                    }
                }
                if(!clipDiv.parentNode) {
                    mediaDiv.appendChild(clipDiv)
                    if(media.type === "audio") {
                        const canvas = await drawAudioWaveform(media.src)
                        clipDiv.appendChild(canvas)
                        canvas.style.width = canvas.style.height = "100%"
                        canvas.style.background = "red"
                    } else if(media.type === "circle") {
                        clipDiv.style.background = "green"
                        clipDiv.style.zIndex = 10;
                    } else if(media.type === "arrow") {
                        clipDiv.style.background = "blue"
                        clipDiv.style.zIndex = 10;
                    }
                }
            })
            startOffset += clip.length
        })
    })
}