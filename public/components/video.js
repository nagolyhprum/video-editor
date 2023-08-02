{

  const videoCanvas = document.getElementById('videoCanvas');
  const playButton = document.getElementById('playButton');
  const pauseButton = document.getElementById('pauseButton');
  
  // Create a video element
  const videoElement = document.createElement('video');
  
  // Draw video frames on the canvas
  const context = videoCanvas.getContext('2d');
  videoElement.addEventListener('play', () => {
    drawVideoFrame();
  });
  
  function drawVideoFrame() {
    if (videoElement.paused || videoElement.ended) {
      return;
    }
    requestAnimationFrame(drawVideoFrame);
    context.drawImage(videoElement, 0, 0, videoCanvas.width, videoCanvas.height);
    state.set({ time: videoElement.currentTime })
  }
  
  // Play and pause video using the buttons
  playButton.addEventListener('click', () => {
    videoElement.play();
  });
  
  pauseButton.addEventListener('click', () => {
    videoElement.pause();
  });
  
  state.watch(["project"], (project) => {
      if(project) {
          videoElement.src = `/download/projects/${project}/video.mp3`
      }
  });
}