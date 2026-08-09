import { useEffect, useRef } from "react";
import { getState, setState, useEditorState } from "../state/store";
import { getActiveClip, getAllScreenshots } from "../state/actions";
import {
  canvasRegionToVideoRegion,
  clipToRoundedRect,
  computeDecorStackCount,
  draw9SlicePanel,
  drawBanner,
  drawMedia,
  drawTiledBackground,
  normalizeRegion,
} from "../lib/canvas";
import { getSharedVideoElement, getVideoBlobUrl } from "../lib/videoElement";
import { getCanvasBackgroundImage } from "../lib/backgroundImage";
import { generateBoxClipThumbnails } from "../lib/boxClips";
import {
  getBannerLeftImage,
  getBannerMiddleImage,
  getBannerRightImage,
  getBoxPanelImage,
} from "../lib/decorAssets";
import { setMainCanvas } from "../lib/mainCanvas";
import { getPlaybackOrigin } from "../lib/playback";
import {
  DECOR_BANNER_BOTTOM_NUDGE,
  DECOR_BANNER_EXTRA_WIDTH,
  DECOR_BANNER_HEIGHT,
  DECOR_BANNER_OPACITY,
  DECOR_BOX_SIZE,
  DECOR_CLIP_PADDING,
  DECOR_CLIP_SAFE_HEIGHT,
  DECOR_CLIP_SIZE,
  DECOR_CLIP_TEXT_PADDING,
  DECOR_PADDING,
  DECOR_SOURCE_BORDER,
  DECOR_SOURCE_SIZE,
  DECOR_STACK_SPACING,
  DECOR_TEXT_REFERENCE_WIDTH,
  TEXT_SIZE_AT_1080P,
  VIDEO_CORNER_RADIUS,
  VIDEO_MARGIN_LEFT,
  VIDEO_MARGIN_RIGHT,
  VIDEO_MARGIN_TOP,
} from "../lib/constants";
import type { Media, MediaPreview } from "../state/types";

function average(media: Media | MediaPreview, canvasWidth: number): number {
  if (media.type === "circle") {
    return (0.5 - media.x) * canvasWidth;
  }
  if (media.type === "arrow") {
    return (
      (media.points.reduce((total, { x }) => total + (0.5 - x), 0) /
        media.points.length) *
      canvasWidth
    );
  }
  if (media.type === "focus") {
    return (0.5 - media.x) * canvasWidth;
  }
  return 0;
}

function conditionalTimeUpdate(video: HTMLVideoElement, time: number): void {
  const offset = Math.abs(video.currentTime - time);
  if (offset > 1 / 16) {
    video.currentTime = time;
  }
}

export default function VideoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number>(0);
  const screenshotThumbnailsRef = useRef<{ label: string; canvas: HTMLCanvasElement }[]>([]);
  const project = useEditorState((s) => s.project);
  const time = useEditorState((s) => s.time);
  const isPlaying = useEditorState((s) => s.isPlaying);
  const timeline = useEditorState((s) => s.timeline);
  const topCrop = useEditorState((s) => s.topCrop);

  // Each stacked box shows one actual screenshot media item, cropped to the
  // region the user drew -- regenerated whenever the timeline's screenshots
  // change. The render loop picks which page of these to display each frame,
  // so this only needs to (re)run once per edit, not every frame.
  useEffect(() => {
    const screenshots = getAllScreenshots();
    if (!project || !screenshots.length) {
      screenshotThumbnailsRef.current = [];
      return;
    }
    let cancelled = false;
    const canvasWidth = canvasRef.current?.width ?? 960;
    const canvasHeight = canvasRef.current?.height ?? 540;
    const specs = screenshots.map(({ media, sourceTime }) => ({
      time: sourceTime,
      region: canvasRegionToVideoRegion(
        { x: media.x, y: media.y, width: media.width, height: media.height },
        canvasWidth,
        canvasHeight,
        topCrop,
      ),
    }));
    generateBoxClipThumbnails(
      `/api/download/projects/${project}/video.mp3`,
      specs,
      DECOR_CLIP_SIZE,
      DECOR_CLIP_SAFE_HEIGHT
    ).then(
      (thumbnails) => {
        if (cancelled) return;
        screenshotThumbnailsRef.current = screenshots.map(({ media }, i) => ({
          label: media.label,
          canvas: thumbnails[i],
        }));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [project, timeline, topCrop]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas: HTMLCanvasElement = canvasRef.current;
    setMainCanvas(canvas);
    const context = canvas.getContext("2d")!;
    const videoElement = getSharedVideoElement();

    let backgroundPattern: CanvasPattern | null = null;
    getCanvasBackgroundImage().then((image) => {
      backgroundPattern = context.createPattern(image, "repeat");
    });

    let boxPanelImage: HTMLImageElement | null = null;
    let bannerLeftImage: HTMLImageElement | null = null;
    let bannerMiddleImage: HTMLImageElement | null = null;
    let bannerRightImage: HTMLImageElement | null = null;
    getBoxPanelImage().then((image) => {
      boxPanelImage = image;
    });
    getBannerLeftImage().then((image) => {
      bannerLeftImage = image;
    });
    getBannerMiddleImage().then((image) => {
      bannerMiddleImage = image;
    });
    getBannerRightImage().then((image) => {
      bannerRightImage = image;
    });

    const getXTargetsBasedOnMediaAndTime = (): number[] => {
      const mobileHeight = canvas.height;
      const mobileWidth = (mobileHeight * 9) / 16;
      const min = canvas.width / 2 - mobileWidth / 2;
      const xTargets: number[] = [];
      let offset = 0;
      getState().timeline.forEach((clip) => {
        for (let i = Math.ceil(offset); i < offset + clip.length; i++) {
          const medias = clip.media.filter(
            (media) =>
              ["arrow", "circle", "focus"].includes(media.type) &&
              media.start + offset <= i &&
              media.start + offset + media.length >= i,
          );
          const total = medias.reduce(
            (sum, media) => sum + average(media, canvas.width),
            0,
          );
          xTargets.push(
            Math.min(Math.max(-min, total / (medias.length || 1)), min),
          );
        }
        offset += clip.length;
      });
      return xTargets;
    };

    function drawVideoFrame() {
      rafRef.current = requestAnimationFrame(drawVideoFrame);
      const state = getState();
      const isMobile = state.isMobile;

      canvas.width = canvas.width;
      context.lineCap = "round";
      context.lineJoin = "round";

      if (backgroundPattern) {
        drawTiledBackground(
          context,
          backgroundPattern,
          canvas.width,
          canvas.height,
        );
      }

      // Video is drawn within fixed margins rather than filling the canvas:
      // width is shrunk by the left/right margins, then height is shrunk by
      // that same percentage to preserve aspect ratio -- the bottom margin
      // is whatever space that leaves. Computed up front so the lower-margin
      // text box below can size itself against it too.
      const videoWidth = canvas.width - VIDEO_MARGIN_LEFT - VIDEO_MARGIN_RIGHT;
      const widthChangePercent = videoWidth / canvas.width;
      const fullVideoHeight = canvas.height * widthChangePercent;

      // Top crop trims that much off the top of the video output and hands
      // the freed space straight to the bottom margin -- the video's own top
      // edge stays put at VIDEO_MARGIN_TOP, it just gets shorter.
      const topCrop = Math.max(0, Math.min(state.topCrop, fullVideoHeight));
      const videoHeight = fullVideoHeight - topCrop;
      const videoBottom = VIDEO_MARGIN_TOP + videoHeight;

      const screenshots = screenshotThumbnailsRef.current;
      if (
        screenshots.length > 0 &&
        (boxPanelImage ||
          (bannerLeftImage && bannerMiddleImage && bannerRightImage))
      ) {
        context.imageSmoothingEnabled = false;

        // stack as many box+banner units as fit vertically in the margin,
        // each separated by DECOR_STACK_SPACING -- only the top needs its
        // own reserved padding, the bottom-most unit can run right up to
        // the canvas edge. The same count doubles as the pagination page
        // size, advancing to the next page every 9 seconds of video time.
        const unitHeight = DECOR_BOX_SIZE + DECOR_BANNER_BOTTOM_NUDGE;
        const stackCount = computeDecorStackCount(canvas.height);
        const totalPages = Math.ceil(screenshots.length / stackCount);
        const page = Math.floor(state.time / 9) % totalPages;
        const pageItems = screenshots.slice(page * stackCount, page * stackCount + stackCount);

        pageItems.forEach((item, i) => {
          const unitTop = DECOR_PADDING + i * (unitHeight + DECOR_STACK_SPACING);

          if (boxPanelImage) {
            draw9SlicePanel(
              context,
              boxPanelImage,
              DECOR_SOURCE_SIZE,
              DECOR_SOURCE_BORDER,
              DECOR_PADDING,
              unitTop,
              DECOR_BOX_SIZE,
              DECOR_BOX_SIZE
            );
          }
          const clipX = DECOR_PADDING + DECOR_SOURCE_BORDER + DECOR_CLIP_PADDING;
          const clipY = unitTop + DECOR_SOURCE_BORDER + DECOR_CLIP_PADDING;
          context.save();
          clipToRoundedRect(context, clipX, clipY, DECOR_CLIP_SIZE, DECOR_CLIP_SIZE, VIDEO_CORNER_RADIUS);
          context.drawImage(item.canvas, clipX, clipY, DECOR_CLIP_SIZE, DECOR_CLIP_SIZE);
          context.restore();

          if (bannerLeftImage && bannerMiddleImage && bannerRightImage) {
            // overlays the box like a label: bottom edge flush with the box's
            // bottom edge, slightly wider than the box and centered on it
            const boxBottom = unitTop + DECOR_BOX_SIZE;
            const bannerWidth = DECOR_BOX_SIZE + DECOR_BANNER_EXTRA_WIDTH;
            const bannerX = DECOR_PADDING - DECOR_BANNER_EXTRA_WIDTH / 2;
            const bannerY =
              boxBottom - DECOR_BANNER_HEIGHT + DECOR_BANNER_BOTTOM_NUDGE;
            context.save();
            context.globalAlpha = DECOR_BANNER_OPACITY;
            drawBanner(
              context,
              bannerLeftImage,
              bannerMiddleImage,
              bannerRightImage,
              bannerX,
              bannerY,
              bannerWidth,
              DECOR_BANNER_HEIGHT
            );
            context.restore();

            // label text, sized so it reads correctly once exported at 1920x1080
            context.save();
            const fontSize = TEXT_SIZE_AT_1080P * (canvas.width / DECOR_TEXT_REFERENCE_WIDTH);
            context.font = `bold ${fontSize}px sans-serif`;
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.lineJoin = "round";
            context.strokeStyle = "black";
            context.lineWidth = fontSize * 0.18;
            context.fillStyle = "white";
            const label = item.label;
            const labelX = bannerX + bannerWidth / 2;
            const labelY = bannerY + 1 + DECOR_BANNER_HEIGHT * 0.56;
            context.strokeText(label, labelX, labelY);
            context.fillText(label, labelX, labelY);
            context.restore();
          }
        });
        context.imageSmoothingEnabled = true;
      }

      // Standalone box showing the active clip's caption text, regardless of
      // clip type -- fills the lower margin (below the video, aligned to its
      // left/right edges) rather than sitting in the left margin, left-aligned
      // text vertically centered inside it.
      const activeClipForText = getActiveClip();
      const textBoxHeight = canvas.height - (videoBottom + DECOR_PADDING) - DECOR_PADDING;
      if (boxPanelImage && activeClipForText && textBoxHeight > DECOR_SOURCE_BORDER * 2) {
        const clipText = activeClipForText.clip.text || "";
        const textFontSize = TEXT_SIZE_AT_1080P * (canvas.width / DECOR_TEXT_REFERENCE_WIDTH);
        context.font = `bold ${textFontSize}px sans-serif`;

        const textBoxX = VIDEO_MARGIN_LEFT;
        const textBoxWidth = videoWidth;
        const textBoxY = videoBottom + DECOR_PADDING;

        context.imageSmoothingEnabled = false;
        draw9SlicePanel(
          context,
          boxPanelImage,
          DECOR_SOURCE_SIZE,
          DECOR_SOURCE_BORDER,
          textBoxX,
          textBoxY,
          textBoxWidth,
          textBoxHeight
        );
        context.imageSmoothingEnabled = true;

        context.save();
        context.font = `bold ${textFontSize}px sans-serif`;
        context.textAlign = "left";
        context.textBaseline = "middle";
        context.fillStyle = "black";
        context.fillText(
          clipText,
          textBoxX + DECOR_SOURCE_BORDER + DECOR_CLIP_TEXT_PADDING,
          textBoxY + textBoxHeight / 2
        );
        context.restore();
      }

      const mobileHeight = canvas.height;
      const mobileWidth = (mobileHeight * 9) / 16;
      if (isMobile) {
        context.beginPath();
        context.rect(
          canvas.width / 2 - mobileWidth / 2,
          0,
          mobileWidth,
          mobileHeight,
        );
        context.clip();
      }
      context.save();
      if (isMobile) {
        const targets = getXTargetsBasedOnMediaAndTime();
        const from = Math.floor(state.time);
        const to = from + 1;
        const delta = state.time - from;
        context.translate(
          (targets[to] - targets[from]) * delta + targets[from],
          0,
        );
      }
      context.save();
      clipToRoundedRect(
        context,
        VIDEO_MARGIN_LEFT,
        VIDEO_MARGIN_TOP,
        videoWidth,
        videoHeight,
        VIDEO_CORNER_RADIUS,
      );
      if (videoElement.videoWidth && videoElement.videoHeight) {
        // crop the same amount off the top of the source, scaled from output
        // pixels to the video's native resolution, so the visible zoom level
        // of the remaining footage doesn't change -- just where it starts.
        const sourceScale = videoElement.videoHeight / fullVideoHeight;
        const sy = topCrop * sourceScale;
        const sHeight = videoElement.videoHeight - sy;
        context.drawImage(
          videoElement,
          0,
          sy,
          videoElement.videoWidth,
          sHeight,
          VIDEO_MARGIN_LEFT,
          VIDEO_MARGIN_TOP,
          videoWidth,
          videoHeight,
        );
      } else {
        context.drawImage(
          videoElement,
          VIDEO_MARGIN_LEFT,
          VIDEO_MARGIN_TOP,
          videoWidth,
          videoHeight,
        );
      }
      context.restore();

      const preview = state.preview;
      if (preview) {
        drawMedia(canvas, context, preview, 0.5, false, state.isPlaying);
      }

      const result = getActiveClip();
      if (result) {
        const { clip, start } = result;
        clip.media.forEach((media) => {
          const myStart = start + media.start;
          const myEnd = myStart + media.length;
          if (state.time >= myStart && state.time <= myEnd) {
            drawMedia(
              canvas,
              context,
              media,
              (state.time - myStart) / media.length,
              state.isRecording,
              state.isPlaying,
            );
          }
        });
        context.restore();
      }

      if (state.isPlaying) {
        const { startTime, startOffset } = getPlaybackOrigin();
        setState({ time: startOffset + (Date.now() - startTime) / 1000 });
      }
    }
    drawVideoFrame();
    (window as any).__manualDraw = drawVideoFrame;

    const handleClick = () => {
      const preview = getState().preview;
      if (!preview) return;
      let previewToCommit = preview;

      if (preview.type === "circle") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, clicks: preview.clicks + 1 } });
          return;
        }
      } else if (preview.type === "arrow") {
        if (preview.clicks + 1 < preview.points.length) {
          setState({ preview: { ...preview, clicks: preview.clicks + 1 } });
          return;
        }
      } else if (preview.type === "screenshot") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, clicks: preview.clicks + 1 } });
          return;
        }
        const label = prompt("Enter a label for this screenshot");
        if (label === null) {
          setState({ preview: null });
          return;
        }
        const region = normalizeRegion(preview.x, preview.y, preview.width, preview.height);
        previewToCommit = { ...preview, ...region, label };
      }

      const result = getActiveClip();
      if (!result) return;
      const { clip, index } = result;
      const state = getState();
      setState({
        preview: null,
        timeline: [
          ...state.timeline.slice(0, index),
          {
            ...clip,
            id: crypto.randomUUID(),
            length: Math.max(clip.length, previewToCommit.length + previewToCommit.start),
            media: [...clip.media, previewToCommit],
          },
          ...state.timeline.slice(index + 1),
        ],
      });
    };

    const handleMouseMove = (e: MouseEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (e.clientX - bounds.left) / canvas.width;
      const y = (e.clientY - bounds.top) / canvas.height;
      const preview = getState().preview;
      if (!preview) return;
      if (preview.type === "circle") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, x, y } });
        } else {
          setState({
            preview: {
              ...preview,
              width: Math.abs(x - preview.x),
              height: Math.abs(y - preview.y),
            },
          });
        }
      } else if (preview.type === "arrow") {
        const remap = [0, 3, 1, 2];
        const idx = remap[preview.clicks];
        setState({
          preview: {
            ...preview,
            points: [
              ...preview.points.slice(0, idx),
              { x, y },
              ...preview.points.slice(idx + 1),
            ] as typeof preview.points,
          },
        });
      } else if (preview.type === "focus") {
        setState({ preview: { ...preview, x, y } });
      } else if (preview.type === "screenshot") {
        if (preview.clicks === 0) {
          setState({ preview: { ...preview, x, y } });
        } else {
          setState({ preview: { ...preview, width: x - preview.x, height: y - preview.y } });
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("mousemove", handleMouseMove);

    // Recording mode hides the cursor and only ever gets exited by leaving
    // fullscreen (Esc, browser chrome, etc) -- there's no dedicated "stop"
    // action, so fullscreenchange is the only reliable place to restore the
    // cursor and clear the stale isRecording/isPlaying state.
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        canvas.style.cursor = "";
        if (getState().isRecording) {
          setState({ isRecording: false, isPlaying: false });
        }
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      cancelAnimationFrame(rafRef.current);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      setMainCanvas(null);
    };
  }, []);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    if (!getState().isPlaying) {
      const result = getActiveClip();
      if (result) {
        const { clip, start } = result;
        const elapsed = clip.type === "video" ? time - start : 0;
        videoElement.currentTime = clip.start + elapsed;
      }
    }
  }, [time]);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    const timeouts: number[] = [];
    const audioElements: HTMLAudioElement[] = [];
    if (isPlaying) {
      let startOffset = 0;
      const state = getState();
      state.timeline.forEach((clip) => {
        if (clip.length + startOffset >= state.time) {
          const offset = Math.max(0, state.time - startOffset);
          const clipStartOffset = startOffset;
          timeouts.push(
            window.setTimeout(
              () => {
                if (clip.type === "video") {
                  conditionalTimeUpdate(videoElement, clip.start + offset);
                  videoElement.play();
                } else if (clip.type === "image") {
                  videoElement.currentTime = clip.start;
                  videoElement.pause();
                }
              },
              (clipStartOffset - state.time) * 1000,
            ),
          );
        }
        clip.media.forEach((media) => {
          if (media.start + startOffset + media.length >= state.time) {
            const finalOffset = startOffset;
            timeouts.push(
              window.setTimeout(
                () => {
                  if (media.type === "audio") {
                    const audio = new Audio(media.src);
                    audioElements.push(audio);
                    audio.currentTime = Math.max(
                      state.time - (finalOffset + media.start),
                      0,
                    );
                    audio.play();
                  }
                },
                (startOffset + media.start - state.time) * 1000,
              ),
            );
          }
        });
        startOffset += clip.length;
      });
    } else {
      videoElement.pause();
    }
    return () => {
      while (timeouts.length) clearTimeout(timeouts.pop());
      // Timeouts only stop audio that hasn't started yet -- anything already
      // playing (created inside a fired timeout callback) needs an explicit
      // pause here too, or it keeps playing after the video is paused.
      while (audioElements.length) audioElements.pop()!.pause();
    };
  }, [isPlaying]);

  useEffect(() => {
    const videoElement = getSharedVideoElement();
    if (!project) return;
    let cancelled = false;
    getVideoBlobUrl(`/api/download/projects/${project}/video.mp3`).then((blobUrl) => {
      if (cancelled) return;
      videoElement.src = blobUrl;
      videoElement.onloadeddata = () => {
        videoElement.currentTime = 0;
        setState({ duration: videoElement.duration });
      };
    });
    return () => {
      cancelled = true;
    };
  }, [project]);

  return (
    <canvas
      ref={canvasRef}
      id="videoCanvas"
      width={960}
      height={540}
      className="bg-black"
    />
  );
}
