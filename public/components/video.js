{

  const videoCanvas = document.getElementById('videoCanvas');
  const playButton = document.getElementById('playButton');

  let startTime = 0;
  let startOffset = 0;
  
  // Create a video element
  const videoElement = document.createElement('video');
  
  // Draw video frames on the canvas
  const context = videoCanvas.getContext('2d');

  const drawMedia = (media, progress) => {
    if(media.type === "circle") {
      context.save()
      const sx = videoCanvas.width * media.width
      const sy = videoCanvas.height * media.height
      context.scale(
        sx, 
        sy
      )
      context.beginPath()
      context.arc(
        media.x * videoCanvas.width / sx, 
        media.y * videoCanvas.height / sy, 
        1, 
        Math.max(0, (progress - .5) * 2) * 2 * Math.PI, 
        Math.min(1, 2 * progress) * 2 * Math.PI
      )
      context.restore()
      context.strokeStyle = "red"
      context.lineWidth = 5
      context.stroke()
    }
  }

  videoCanvas.onclick = () => {
    const preview = state.value.preview
    if(preview) {
      if(preview.type === "circle") {
        if(preview.clicks === 0) {
          state.set({
            preview : {
              ...preview,
              clicks : preview.clicks + 1,
            }
          })
        } else {
          const { clip } = getActiveClip()
          const index = state.value.timeline.indexOf(clip)
          state.set({
            preview : null,
            timeline : [
              ...state.value.timeline.slice(0, index),
              {
                ...clip,
                media : [
                  ...clip.media,
                  preview
                ]
              },
              ...state.value.timeline.slice(index + 1),
            ]
          })
        }
      }
    }
  }

  videoCanvas.onmousemove = (e) => {
    const bounds = videoCanvas.getBoundingClientRect()
    const x = (e.pageX - bounds.left) / videoCanvas.width
    const y = (e.pageY - bounds.top) / videoCanvas.height
    const preview = state.value.preview
    if(preview) {
      if(preview.type === "circle") {
        if(preview.clicks === 0) {
          state.set({
            preview : {
              ...preview,
              x,
              y
            }
          })
        } else {
          state.set({
            preview : {
              ...preview,
              width : Math.abs(x - preview.x),
              height : Math.abs(y - preview.y)
            }
          })
        }
      }
    }
  }
  
  function drawVideoFrame() {
    requestAnimationFrame(drawVideoFrame);
    context.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height);
    const preview = state.value.preview
    if(preview) {
      drawMedia(preview, .5)
    }
    const result = getActiveClip()
    if(result) {
      const { clip, start } = result
      clip.media.forEach(media => {
        const myStart = start + media.start
        const myEnd = myStart + media.length
        if(state.value.time >= myStart && state.value.time <= myEnd) {
          drawMedia(media, (state.value.time - myStart) / media.length)
        }
      })
    }
    if(state.value.isPlaying) {
      state.set({ 
        time: startOffset + (Date.now() - startTime) / 1000,
      })
    }
  }
  drawVideoFrame();
  
  // Play and pause video using the buttons
  playButton.addEventListener('click', () => {
    startOffset = state.value.time
    startTime = Date.now()
    state.set({
      isPlaying : !state.value.isPlaying
    })
  });

  state.watch(["time"], time => {
    if(!state.value.isPlaying) {
      const result = getActiveClip()
      if(result) {
        const { clip, start } = result
        const elapsed = clip.type === "video" ? time - start : 0
        videoElement.currentTime = clip.start + elapsed
      }
    }
  })

  const timeouts = []

  state.watch(["isPlaying"], isPlaying => {
    if(isPlaying) {      
      let startOffset = 0;
      state.value.timeline.forEach((clip) => {
        if(clip.length + startOffset >= state.value.time) {          
          const finalOffset = startOffset
          timeouts.push(setTimeout(() => {            
            const offset = Math.max(0, state.value.time - finalOffset)
            if(clip.type === "video") {
              videoElement.currentTime = clip.start + offset
              videoElement.play()
            } else {
              videoElement.currentTime = clip.start
              videoElement.pause()
            }
          }, (startOffset - state.value.time) * 1000))
        }
        // TODO : MEDIA
        clip.media.forEach(media => {
          if(media.start + startOffset + media.length >= state.value.time) {
            const finalOffset = startOffset
            timeouts.push(setTimeout(() => {
              if(media.type === "audio") {
                const audio = new Audio(media.src)
                audio.currentTime = Math.max(state.value.time - (finalOffset + media.start), 0)
                audio.play()
              }
            }, (startOffset + media.start - state.value.time) * 1000))
          }
        })
        startOffset += clip.length
      })
    } else {
      videoElement.pause()
      while(timeouts.length) {
        clearTimeout(timeouts.pop())
      }
    }
  })
  
  state.watch(["project"], (project) => {
      if(project) {      
        videoElement.src = `/download/projects/${project}/video.mp3`
        videoElement.onloadeddata = () => {
          videoElement.currentTime = 0
        }
      }
  });
}