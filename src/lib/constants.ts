export const FPS = 10;

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

// Reference export resolution the banner's label text is sized against --
// the actual draw size is scaled by canvas.width / DECOR_TEXT_REFERENCE_WIDTH,
// so it reads at the right size once rendered out at 1920x1080.
export const DECOR_TEXT_REFERENCE_WIDTH = 1920;
export const DECOR_BANNER_TEXT_SIZE_AT_REFERENCE = 48;
