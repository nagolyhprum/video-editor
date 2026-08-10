export const FPS = 10;

// Gap between entering fullscreen and actually starting recorded playback --
// needs to outlast the browser's own "press Esc to exit fullscreen" overlay,
// or that overlay ends up burned into the start of the recording.
export const RECORDING_START_DELAY_MS = 8000;

// Margins the video is drawn within on the main canvas, instead of filling it.
// Bottom isn't fixed -- it falls out of preserving the video's aspect ratio
// once width is shrunk by the left/right margins.
export const VIDEO_MARGIN_LEFT = 200;
export const VIDEO_MARGIN_TOP = 10;
export const VIDEO_MARGIN_RIGHT = 10;

// Radius used for all four corners of the video.
export const VIDEO_CORNER_RADIUS = 12;

// Decorative box + banner shown in the left margin. Padding keeps it clear
// of the margin edges and the video; the box is forced square and the
// banner matches its width. The banner overlays the box like a label,
// centered on the box's bottom edge rather than sitting below it.
export const DECOR_PADDING = 25;
export const DECOR_BOX_SIZE = VIDEO_MARGIN_LEFT - DECOR_PADDING * 2;
// True native pixel size of the source tiles (box-panel.png, banner-*.png)
// -- used to crop the box's 9-slice corners/edges, so this must stay the
// actual source dimension, not a display size.
export const DECOR_SOURCE_SIZE = 32;
export const DECOR_SOURCE_BORDER = 8;
// Cap/banner display height. Kept at a whole multiple of DECOR_SOURCE_SIZE
// (here 2x) so nearest-neighbor scaling is a clean pixel-doubling -- no
// dropped detail lines (sub-native downscale) and no blur (smoothing).
export const DECOR_BANNER_HEIGHT = DECOR_SOURCE_SIZE * 2;

// Banner's bottom edge sits flush with the box's bottom edge (no hang-below),
// and it's drawn wider than the box, centered, so the *middle* segment
// (bannerWidth - 2*cap width) has room for label text.
export const DECOR_BANNER_EXTRA_WIDTH = 40;

// The cap tiles have a couple pixels of transparent padding below their
// own artwork, so lining up bounding boxes leaves a visible gap above the
// box's actual bottom border -- nudge down to close it (scales with the
// cap's display size relative to its native size).
export const DECOR_BANNER_BOTTOM_NUDGE =
  3 * (DECOR_BANNER_HEIGHT / DECOR_SOURCE_SIZE);

// Banner is drawn partially see-through so it reads as an overlay, not a
// separate opaque piece.
export const DECOR_BANNER_OPACITY = 1;

// Vertical gap between stacked box+banner units in the left margin.
export const DECOR_STACK_SPACING = 20;

// Inset between the box's inner (9-slice) fill area and the video clip
// drawn inside it, so the clip reads as "padded" rather than filling the
// box edge-to-edge.
export const DECOR_CLIP_PADDING = 10;
// Side length of the square clip drawn inside each box.
export const DECOR_CLIP_SIZE =
  DECOR_BOX_SIZE - DECOR_SOURCE_BORDER * 2 - DECOR_CLIP_PADDING * 2;

// The label banner overlays the box like a sticker on top of its bottom
// edge, which means it also covers the bottom slice of the clip drawn
// underneath it. Derived (not hand-tuned) from the same geometry the banner
// itself is positioned with, so it stays correct if those constants change.
export const DECOR_CLIP_BANNER_OVERLAP =
  DECOR_BANNER_HEIGHT - DECOR_BANNER_BOTTOM_NUDGE - DECOR_SOURCE_BORDER - DECOR_CLIP_PADDING;
// Extra breathing room above the banner so contained content doesn't butt
// right up against it.
export const DECOR_CLIP_BANNER_SAFE_PADDING = 6;
// The portion of the clip box a screenshot thumbnail can actually use
// without any of it ending up hidden under the banner.
export const DECOR_CLIP_SAFE_HEIGHT =
  DECOR_CLIP_SIZE - DECOR_CLIP_BANNER_OVERLAP - DECOR_CLIP_BANNER_SAFE_PADDING;

// Screenshot thumbnails are generated at this multiple of their on-screen
// display size (DECOR_CLIP_SIZE) rather than 1:1 -- cropping a video frame
// straight down to a small on-screen size in one step looks soft (no true
// mipmapping in canvas, and recording scales the display size up further
// still), so the source bitmap carries extra resolution to downscale from.
export const DECOR_CLIP_RESOLUTION_SCALE = 3;

// Reference export resolution every on-canvas text element is sized against
// -- actual draw size is TEXT_SIZE_AT_1080P * (canvas.width / TEXT_REFERENCE_WIDTH),
// so it reads at a consistent, minimum-viable-for-1080p-YouTube size no
// matter which canvas (or preview scale) it's drawn on.
export const DECOR_TEXT_REFERENCE_WIDTH = 1920;
export const TEXT_SIZE_AT_1080P = 40;

// Standalone box showing the active clip's caption text (regardless of clip
// type), sized to just fit the text plus padding, left-aligned, centered
// vertically in the margin.
export const DECOR_CLIP_TEXT_PADDING = 14;

// The left-margin screenshot stack pages through stackCount items at a time.
export const SCREENSHOT_PAGE_INTERVAL = 9;

// How long the camera-flash overlay stays visible (fading out) when a
// screenshot is "taken" during a recording pass.
export const SCREENSHOT_FLASH_DURATION = 0.3;

// The timeline's media track shows a small preview badge (thumbnail + label)
// on top of a screenshot's or photo's block -- capped at this size
// regardless of the block's own (duration-driven, often much narrower)
// width, so it reads as a compact pin rather than an oversized overlay.
export const MARGIN_TIMELINE_PREVIEW_SIZE = 40;
export const MARGIN_TIMELINE_LABEL_MAX_WIDTH = 70;
