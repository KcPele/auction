import { useRef } from "react";
import { Icon } from "../primitives/Icon";
import {
  inputClass,
  labelClass,
  MAX_LISTING_PHOTOS,
  MAX_LISTING_VIDEOS,
  MAX_VIDEO_TOTAL_BYTES,
} from "./constants";
import type { ListingMediaProps, ListingVideo } from "./types";

export function MediaFields({
  photoUrls,
  videos,
  onPhotos,
  onVideos,
  onRemovePhoto,
  onRemoveVideo,
  isPending,
}: ListingMediaProps) {
  const photosInput = useRef<HTMLInputElement>(null);
  const videosInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <PhotoUploader
        photoUrls={photoUrls}
        onPick={() => photosInput.current?.click()}
        onRemove={onRemovePhoto}
        isPending={isPending}
      />
      <input
        ref={photosInput}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(event) => onPhotos(event.target.files)}
      />
      <VideoUploader
        videos={videos}
        onPick={() => videosInput.current?.click()}
        onRemove={onRemoveVideo}
        isPending={isPending}
      />
      <input
        ref={videosInput}
        type="file"
        multiple
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={(event) => onVideos(event.target.files)}
      />
    </>
  );
}

function PhotoUploader({
  photoUrls,
  onPick,
  onRemove,
  isPending,
}: {
  photoUrls: string[];
  onPick: () => void;
  onRemove: (index: number) => void;
  isPending: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>
        Photos ({photoUrls.length}/{MAX_LISTING_PHOTOS})
      </label>
      <button
        type="button"
        onClick={onPick}
        disabled={isPending || photoUrls.length >= MAX_LISTING_PHOTOS}
        className={`${inputClass} flex cursor-pointer items-center gap-2 text-fg-dim disabled:opacity-60`}
      >
        <Icon name="image" size={14} />
        {isPending
          ? "Uploading…"
          : photoUrls.length >= MAX_LISTING_PHOTOS
            ? "Maximum photos added"
            : "Add photos"}
      </button>
      {photoUrls.length > 0 && (
        <div className="mt-2 grid grid-cols-4 gap-2">
          {photoUrls.map((url, index) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className="aspect-square w-full rounded-lg object-cover"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-overlay p-0.5 text-status-foreground"
              >
                <Icon name="x" size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VideoUploader({
  videos,
  onPick,
  onRemove,
  isPending,
}: {
  videos: ListingVideo[];
  onPick: () => void;
  onRemove: (index: number) => void;
  isPending: boolean;
}) {
  const totalMb =
    videos.reduce((total, video) => total + video.sizeBytes, 0) / (1024 * 1024);
  const remainingMb = MAX_VIDEO_TOTAL_BYTES / (1024 * 1024) - totalMb;
  const full = videos.length >= MAX_LISTING_VIDEOS || remainingMb <= 0;

  return (
    <div>
      <label className={labelClass}>
        Videos ({videos.length}/{MAX_LISTING_VIDEOS}) · optional ·{" "}
        {totalMb.toFixed(1)} / {MAX_VIDEO_TOTAL_BYTES / (1024 * 1024)} MB used
      </label>
      <button
        type="button"
        onClick={onPick}
        disabled={isPending || full}
        className={`${inputClass} flex cursor-pointer items-center gap-2 text-fg-dim disabled:opacity-60`}
      >
        <Icon name="image" size={14} />
        {isPending
          ? "Uploading…"
          : full
            ? "No room for more videos"
            : "Add videos (mp4, mov, webm)"}
      </button>
      {videos.length > 0 && (
        <div className="mt-2 grid grid-cols-3 gap-2">
          {videos.map((video, index) => (
            <div key={video.url} className="relative">
              <video
                src={video.url}
                className="aspect-video w-full rounded-lg bg-media-background object-cover"
                muted
                playsInline
                preload="metadata"
              />
              <button
                type="button"
                onClick={() => onRemove(index)}
                className="absolute right-1 top-1 rounded-full bg-overlay p-0.5 text-status-foreground"
              >
                <Icon name="x" size={10} />
              </button>
              <div className="absolute bottom-1 left-1 rounded bg-overlay px-1.5 py-0.5 text-[10px] text-status-foreground">
                {(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
