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

const canvas = document.createElement("canvas");
const context = canvas.getContext("2d");
async function extractFrameFromVideo(video, at, height) {
  return new Promise(async (resolve) => {
    const [w, h] = [video.videoWidth, video.videoHeight];
    canvas.height = height;
    canvas.width = height / h * w;
    video.onseeked = () => {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64ImageData = canvas.toDataURL();
      const image = new Image()
      image.src = base64ImageData;
      resolve(image);
    }
    video.currentTime = at;
  });
}