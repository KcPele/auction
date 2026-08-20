export type Step = "category" | "details" | "pricing" | "preview";

export type ListingCategory = "CAR" | "GADGET";

export type ListingVideo = {
  url: string;
  sizeBytes: number;
};

export type CarDetailsValues = {
  make: string;
  model: string;
  year: string;
  colour: string;
  registration: string;
  mileage: string;
  condition: string;
  faults: string;
  mechanicId: string;
};

export type GadgetDetailsValues = {
  type: string;
  brand: string;
  model: string;
  colour: string;
  battery: string;
  specs: string;
  usage: string;
  defects: string;
};

export type FieldSetters<T> = {
  [Key in keyof T]: (value: T[Key]) => void;
};

export type ListingMediaProps = {
  photoUrls: string[];
  videos: ListingVideo[];
  onPhotos: (files: FileList | null) => void;
  onVideos: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  isPending: boolean;
};
