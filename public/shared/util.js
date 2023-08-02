const getBlobText = (blob) => {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = function (event) {
          resolve(event.target.result);
        };
        reader.readAsText(blob);
    })
  }

const getVideoDuration = (file) => {
    return new Promise((resolve) => {
        const videoElement = document.createElement('video');
        videoElement.src = URL.createObjectURL(file);
        videoElement.addEventListener('loadedmetadata', function () {
          resolve(videoElement.duration);
        });
    })
}

async function seekVideo(video, at) {
  return new Promise(async (resolve) => {
    video.onseeked = resolve;
    video.currentTime = at;
  });
}