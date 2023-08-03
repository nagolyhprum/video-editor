{

  const videoCanvas = document.getElementById('videoCanvas');
  const playButton = document.getElementById('playButton');

  let startTime = 0;
  let startOffset = 0;
  
  // Create a video element
  const videoElement = document.createElement('video');
  
  // Draw video frames on the canvas
  const context = videoCanvas.getContext('2d');
  
  function drawVideoFrame() {
    requestAnimationFrame(drawVideoFrame);
    context.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height);
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