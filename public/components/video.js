{
  const videoCanvas = document.getElementById('videoCanvas');
  const playButton = document.getElementById('playButton');
  const recordBtn = document.getElementById('record');

  const thumbnailCanvas = document.getElementById('thumbnail');

  const thickness = (isLarge) => isLarge ? 20 : 5;


  document.getElementById("mobile").onclick = () => {
    state.set({
      isMobile : !state.value.isMobile
    })
  }

  let startTime = 0;
  let startOffset = 0;
  
  // Create a video element
  const videoElement = document.createElement('video');
  
  // Draw video frames on the canvas
  const context = videoCanvas.getContext('2d');

  state.watch(["time", "timeline", "scale", "preview"], (time, timeline, scale, preview) => {
    if(!state.value.isRecording) {
      thumbnailCanvas.width = 1280;
      thumbnailCanvas.height = 720;
      const scalePercent = scale / 100
      const width = thumbnailCanvas.width * scalePercent
      const height = thumbnailCanvas.height * scalePercent
      const context = thumbnailCanvas.getContext('2d');
      context.lineCap = "round"
      context.lineJoin = "round"
      context.drawImage(
        videoElement, 
        thumbnailCanvas.width / 2 - width / 2, 
        thumbnailCanvas.height / 2 - height / 2, 
        width, 
        height
      )

      const result = getActiveClip()
        if(result) {
          const { clip, start } = result
          if(clip.text && clip.type === "image") {
            const OFFSET = 10
            context.textBaseline = "top"
            context.textAlign = "center"
            context.strokeStyle = "black"
            context.lineWidth = 20
            context.fillStyle = "white"
            context.font = `bold 100px sans-serif`
            const text = clip.text.split("\n")[0]
            context.strokeText(text, thumbnailCanvas.width / 2, OFFSET, thumbnailCanvas.width - OFFSET * 2)
            context.fillText(text, thumbnailCanvas.width / 2, OFFSET, thumbnailCanvas.width - OFFSET * 2)
          }
          if(preview) {
            drawMedia(thumbnailCanvas, context, preview, .5, true)
          }
          clip.media.forEach(media => {
            const myStart = start + media.start
            const myEnd = myStart + media.length
            if(time >= myStart && time <= myEnd) {
              drawMedia(thumbnailCanvas, context, media, (time - myStart) / media.length, true)
            }
          })
        }
    }
  })


  function rotatePoint(pointA, pointB, theta) {
    // Convert theta to radians
    const radians = (theta * Math.PI) / 180;

    // Find the distance between pointA and pointB
    const dx = pointA.x - pointB.x;
    const dy = pointA.y - pointB.y;

    // Calculate the new coordinates after rotation
    const x_new = pointB.x + dx * Math.cos(radians) - dy * Math.sin(radians);
    const y_new = pointB.y + dx * Math.sin(radians) + dy * Math.cos(radians);

    return { x: x_new, y: y_new };
  }

  function normalizePoint(point) {
    const magnitude = Math.sqrt(point.x * point.x + point.y * point.y);
    if (magnitude === 0) {
      // Handle special case of a point at the origin (0, 0)
      return { x: 0, y: 0 };
    } else {
      return { x: point.x / magnitude, y: point.y / magnitude };
    }
  }

  function generateArrowHead(P0, P1, P2, P3, percent, isLarge) {
    const arrowSize = thickness(isLarge) * 4;
    const a = spline(P0, P1, P2, P3, percent - .01);
    const b = spline(P0, P1, P2, P3, percent);

    const d = normalizePoint({
      x: a.x - b.x,
      y: a.y - b.y
    });

    const left = rotatePoint(
      {
        x: b.x + d.x * arrowSize,
        y: b.y + d.y * arrowSize
      },
      b,
      45
    );

    const right = rotatePoint(
      {
        x: b.x + d.x * arrowSize,
        y: b.y + d.y * arrowSize
      },
      b,
      -45
    );

    return [left, b, right];
  }

  function spline(P0, P1, P2, P3, percent) {
    // Ensure t is within the range [0, 1]
    const t = Math.min(Math.max(percent, 0), 1);

    const mt = 1 - t;
    const mt2 = mt * mt;
    const mt3 = mt2 * mt;
    const t2 = t * t;
    const t3 = t2 * t;

    const x = mt3 * P0.x + 3 * mt2 * t * P1.x + 3 * mt * t2 * P2.x + t3 * P3.x;
    const y = mt3 * P0.y + 3 * mt2 * t * P1.y + 3 * mt * t2 * P2.y + t3 * P3.y;

    return { x, y };
  }

  const drawMedia = (canvas, context, media, progress, isLarge) => {
    if(media.type === "circle") {
      context.save()
      const sx = canvas.width * media.width
      const sy = canvas.height * media.height
      context.scale(
        sx, 
        sy
      )
      context.beginPath()
      context.arc(
        media.x * canvas.width / sx, 
        media.y * canvas.height / sy, 
        1, 
        Math.max(0, (progress - .5) * 2) * (2 * Math.PI + Math.PI / 4), 
        Math.min(1, 2 * progress) * (2 * Math.PI + Math.PI / 4)
      )
      context.restore()
      context.strokeStyle = "black"
      context.lineWidth = 2 * thickness(isLarge)

      context.stroke()
      context.strokeStyle = "white"
      context.lineWidth = thickness(isLarge)

      context.stroke()
    } else if(media.type === "arrow") {
      context.beginPath()
      let moved = false
      for(let from = Math.max(progress * 200 - 100, 0); from <= Math.min(progress * 200, 100); from += 1) {
        const point = spline(...media.points, from / 100)
        if(moved) {
          context.lineTo(point.x * canvas.width, point.y * canvas.height)
        } else {
          context.moveTo(point.x * canvas.width, point.y * canvas.height)
          moved = true
        }
      }
      const arrowHead = generateArrowHead(...media.points.map(({
        x,
        y
      }) => ({
        x : x * canvas.width,
        y : y * canvas.height
      })), Math.min(progress * 200, 100) / 100, isLarge)
      context.lineTo(arrowHead[1].x, arrowHead[1].y)
      context.lineTo(arrowHead[0].x, arrowHead[0].y)
      context.moveTo(arrowHead[1].x, arrowHead[1].y)
      context.lineTo(arrowHead[2].x, arrowHead[2].y)
      context.strokeStyle = "black"
      context.lineWidth = 2 * thickness(isLarge)

      context.stroke()
      context.strokeStyle = "white"
      context.lineWidth = thickness(isLarge)

      context.stroke()
    } else if(media.type === "focus") {
      if(!state.value.isPlaying) {
        context.fillStyle = "yellow";
        context.fillRect(media.x * canvas.width - 5, media.y * canvas.height - 5, 10, 10);
      }
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
          return;
        }
      } else if(preview.type === "arrow") {
        if(preview.clicks + 1 < preview.points.length) {
          state.set({
            preview : {
              ...preview,
              clicks : preview.clicks + 1,
            }
          })
          return;
        }
      }

      const { clip, index } = getActiveClip()
      state.set({
        preview : null,
        timeline : [
          ...state.value.timeline.slice(0, index),
          {
            ...clip,
            id : crypto.randomUUID(),
            length : Math.max(clip.length, preview.length + preview.start),
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
      } else if(preview.type === "arrow") {
        const remap = [0, 3, 1, 2]
        const index = remap[preview.clicks]
        state.set({
          preview : {
            ...preview,
            points : [
              ...preview.points.slice(0, index), 
              { x, y },
              ...preview.points.slice(index + 1), 
            ]
          }
        })
      } else if(preview.type === "focus") {
        state.set({
          preview : {
            ...preview,
            x,
            y
          }
        })
      }
    }
  }

  const average = media => {
    if(media.type === "circle") {
      return (.5 - media.x) * videoCanvas.width
    }
    if(media.type === "arrow") {
      return media.points.reduce((total, { x }) => total + (.5 - x), 0) / media.points.length * videoCanvas.width
    }
    if(media.type === "focus") {
      return (.5 - media.x) * videoCanvas.width
    }
    return 0
  }

  const getXTargetsBasedOnMediaAndTime = () => {
    const mobile_height = videoCanvas.height;
    const mobile_width = mobile_height * 9 / 16;
    const min = videoCanvas.width / 2 - mobile_width / 2;
    const xTargets = [];
    let offset = 0;
    state.value.timeline.forEach((clip) => {
      for(let i = Math.ceil(offset); i < offset + clip.length; i++) {
        const medias = clip.media.filter(media => ["arrow", "circle", "focus"].includes(media.type) && media.start + offset <= i && media.start + offset + media.length >= i);
        const total = medias.reduce((total, media) => total + average(media), 0)
        xTargets.push(Math.min(Math.max(-min, total / (medias.length || 1)), min));
      }
      offset += clip.length;
    }) 
    return xTargets;
  }
  
  function drawVideoFrame() {
    requestAnimationFrame(drawVideoFrame);
    const isMobile = state.value.isMobile;

    videoCanvas.width = videoCanvas.width;
    context.lineCap = "round"
    context.lineJoin = "round"

    const scale = state.value.scale / 100
    const width = videoCanvas.width * scale
    const height = videoCanvas.height * scale

    const mobile_height = videoCanvas.height;
    const mobile_width = mobile_height * 9 / 16;
    if(isMobile) {
      // 9 x 16
      context.beginPath();
      context.rect(videoCanvas.width / 2 - mobile_width / 2, 0, mobile_width, mobile_height)
      context.clip();
    }
    context.save();
    if(isMobile) {
      const targets = getXTargetsBasedOnMediaAndTime();
      const from = Math.floor(state.value.time);
      const to = from + 1;
      const delta = state.value.time - from;
      context.translate((targets[to] - targets[from]) * delta + targets[from], 0);
    }
    context.drawImage(
      videoElement, 
      videoCanvas.width / 2 - width / 2, 
      videoCanvas.height / 2 - height / 2, 
      width, 
      height
    );
    const preview = state.value.preview
    if(preview) {
      drawMedia(videoCanvas, context, preview, .5, false)
    }

    const result = getActiveClip()
    if(result) {
      const { clip, start } = result
      clip.media.forEach(media => {
        const myStart = start + media.start
        const myEnd = myStart + media.length
        if(state.value.time >= myStart && state.value.time <= myEnd) {
          drawMedia(videoCanvas, context, media, (state.value.time - myStart) / media.length, state.value.isRecording)
        }
      })
      context.restore();
      if(clip.text && clip.type === "image") {
        const OFFSET = (state.value.isRecording ? 50 : 10) * devicePixelRatio
        context.textBaseline = "top"
        context.textAlign = "center"
        context.font = `bold ${(state.value.isRecording ? 75 : 24) * devicePixelRatio}px sans-serif`
        context.strokeStyle = "black"
        context.lineWidth = 10
        context.fillStyle = "white"

        const text = clip.text.split("\n")[0]
        if(isMobile) {
          context.font = `bold ${state.value.isRecording ? 50 : 20}px sans-serif`
          context.strokeText(text, videoCanvas.width / 2, OFFSET + 40, videoCanvas.width - OFFSET * 2, mobile_width)
          context.fillText(text, videoCanvas.width / 2, OFFSET + 40, videoCanvas.width - OFFSET * 2, mobile_width)
        } else {
          context.strokeText(text, videoCanvas.width / 2, OFFSET, videoCanvas.width - OFFSET * 2)
          context.fillText(text, videoCanvas.width / 2, OFFSET, videoCanvas.width - OFFSET * 2)
        }
      } else {
        context.restore();
      }
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


  recordBtn.onclick = () => {
    videoCanvas.requestFullscreen()
    videoCanvas.width = videoElement.videoWidth * devicePixelRatio
    videoCanvas.height = videoElement.videoHeight * devicePixelRatio
    videoCanvas.style.cursor = "none"
    setTimeout(() => {
      startOffset = 0
      startTime = Date.now()
      state.set({
        isPlaying : true,
        time : 0,
        isRecording: true
      })
    }, 5000)
  }

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

  const conditionalTimeUpdate = (video, time) => {
    const offset = Math.abs(video.currentTime - time)
    if(offset > 1 / 16) {
      video.currentTime = time
    }
  }

  const timeouts = []

  state.watch(["isPlaying"], isPlaying => {
    if(isPlaying) {      
      let startOffset = 0;
      state.value.timeline.forEach((clip) => {
        if(clip.length + startOffset >= state.value.time) {          
          const offset = Math.max(0, state.value.time - startOffset)
          timeouts.push(setTimeout(() => {            
            if(clip.type === "video") {
              conditionalTimeUpdate(videoElement, clip.start + offset)
              videoElement.play()
            } else if(clip.type === "image") {
              videoElement.currentTime = clip.start
              videoElement.pause()
            }
          }, (startOffset - state.value.time) * 1000))
        }
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