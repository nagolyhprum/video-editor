{

  const videoCanvas = document.getElementById('videoCanvas');
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');

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
      isPlaying : true
    })
  });
  
  pauseButton.addEventListener('click', () => {
    state.set({
      isPlaying : false
    })
  });

  state.watch(["time"], time => {
    if(!state.value.isPlaying) {
      videoElement.currentTime = time
    }
  })

  state.watch(["isPlaying"], isPlaying => {
    if(isPlaying) {      
      videoElement.play()
    } else {
      videoElement.pause()
    }
  })
  
  state.watch(["project"], (project) => {
      if(project) {
          videoElement.src = `/download/projects/${project}/video.mp3`
          videoElement.currentTime = 0
      }
  });
}