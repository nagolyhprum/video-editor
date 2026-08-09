import { loadImage } from "./imageCache";

// Kenney "UI Pack - Pixel Adventure" tiles (CC0), used as a 9-slice panel
// and a 3-slice horizontal banner for decorative chrome in the left margin.
export function getBoxPanelImage(): Promise<HTMLImageElement> {
  return loadImage("/box-panel.png");
}

export function getBannerLeftImage(): Promise<HTMLImageElement> {
  return loadImage("/banner-left.png");
}

export function getBannerMiddleImage(): Promise<HTMLImageElement> {
  return loadImage("/banner-middle.png");
}

export function getBannerRightImage(): Promise<HTMLImageElement> {
  return loadImage("/banner-right.png");
}
