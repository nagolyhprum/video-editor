import { useEffect } from "react";
import { init } from "../state/actions";
import DropZone from "./DropZone";
import ProjectName from "./ProjectName";
import VideoCanvas from "./VideoCanvas";
import ThumbnailPreview from "./ThumbnailPreview";
import RecordButton from "./RecordButton";
import TranscriptButton from "./TranscriptButton";
import SaveButton from "./SaveButton";
import TextPanel from "./TextPanel";
import StatsPanel from "./StatsPanel";
import ProjectsList from "./ProjectsList";
import PlaybackControls from "./Controls/PlaybackControls";
import EditControls from "./Controls/EditControls";
import MarkerControls from "./Controls/MarkerControls";
import MediaButtons from "./Controls/MediaButtons";
import ScaleInput from "./Controls/ScaleInput";
import TopCropInput from "./Controls/TopCropInput";
import Timeline from "./Timeline/Timeline";

export default function VideoEditorApp() {
  useEffect(() => {
    init();
  }, []);

  return (
    <DropZone>
      <ProjectName />
      <div className="flex flex-row flex-wrap gap-4 py-4">
        <VideoCanvas />
        <div id="controls" className="flex flex-col items-start gap-2.5">
          <StatsPanel />
          <PlaybackControls />
          <EditControls />
          <MarkerControls />
          <MediaButtons />
          <ScaleInput />
          <TopCropInput />
        </div>
        <TextPanel />
      </div>
      <Timeline />
      <div className="flex flex-row gap-2 py-4">
        <SaveButton />
        <RecordButton />
        <TranscriptButton />
      </div>
      <div className="flex flex-row gap-6">
        <ProjectsList />
        <ThumbnailPreview />
      </div>
    </DropZone>
  );
}
