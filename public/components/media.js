{
    const mediaDiv = document.querySelector("#media")

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
        mediaDiv.innerHTML = ""
        let startOffset = 0;
        timeline.forEach(clip => {
            clip.media.forEach(async media => {
                const clipDiv = document.createElement("div")
                clipDiv.style.left = `${(startOffset + media.start) * FPS}px`
                clipDiv.style.width = `${media.length * FPS}px`
                clipDiv.style.height = `100%`
                clipDiv.style.position = `absolute`
                mediaDiv.appendChild(clipDiv)
                if(media.type === "audio") {
                    const canvas = await drawAudioWaveform(media.src)
                    clipDiv.appendChild(canvas)
                    canvas.style.width = canvas.style.height = "100%"
                    canvas.style.background = "red"
                    canvas.style.zIndex = 10;
                } else if(media.type === "circle") {
                    clipDiv.style.opacity = .5
                    clipDiv.style.background = "green"
                } else if(media.type === "arrow") {
                    clipDiv.style.opacity = .5
                    clipDiv.style.background = "blue"
                }
            })
            startOffset += clip.length
        })
    })
}