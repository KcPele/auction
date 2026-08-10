import { useRef } from "react";
import { Icon } from "../primitives/Icon";
import { inputClass, labelClass } from "./constants";
import { Field, NavRow } from "./FormPrimitives";
import { MediaFields } from "./MediaFields";
import type {
  CarDetailsValues,
  FieldSetters,
  GadgetDetailsValues,
  ListingMediaProps,
} from "./types";

type DetailsStepNavigation = {
  onBack: () => void;
  onNext: () => void;
};

export function CarDetailsStep({
  values,
  onChange,
  media,
  onBack,
  onNext,
}: {
  values: CarDetailsValues;
  onChange: FieldSetters<CarDetailsValues>;
  media: ListingMediaProps;
} & DetailsStepNavigation) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="text-sm text-fg-muted">Car details</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Make" value={values.make} onChange={onChange.make} placeholder="Toyota" />
        <Field label="Model" value={values.model} onChange={onChange.model} placeholder="Camry" />
        <Field
          label="Year"
          value={values.year}
          onChange={onChange.year}
          type="number"
          placeholder="2018"
        />
        <Field
          label="Colour"
          value={values.colour}
          onChange={onChange.colour}
          placeholder="Black"
        />
        <Field
          label="Registration"
          value={values.registration}
          onChange={onChange.registration}
          placeholder="ABC-123-LA"
        />
        <Field
          label="Mileage (km)"
          value={values.mileage}
          onChange={onChange.mileage}
          type="number"
          placeholder="68000"
        />
      </div>
      <Field
        label="Condition"
        value={values.condition}
        onChange={onChange.condition}
        placeholder="Good"
      />
      <Field
        label="Known faults"
        value={values.faults}
        onChange={onChange.faults}
        placeholder="AC needs servicing"
      />
      <MediaFields {...media} />
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}

export function GadgetDetailsStep({
  values,
  onChange,
  proofUrl,
  onProof,
  media,
  onBack,
  onNext,
}: {
  values: GadgetDetailsValues;
  onChange: FieldSetters<GadgetDetailsValues>;
  proofUrl: string;
  onProof: (file: File) => void;
  media: ListingMediaProps;
} & DetailsStepNavigation) {
  const proofInput = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-6 flex flex-col gap-3">
      <div className="text-sm text-fg-muted">Gadget details</div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type" value={values.type} onChange={onChange.type} placeholder="Phone" />
        <Field label="Brand" value={values.brand} onChange={onChange.brand} placeholder="Apple" />
        <Field
          label="Model"
          value={values.model}
          onChange={onChange.model}
          placeholder="iPhone 14 Pro"
        />
        <Field
          label="Colour"
          value={values.colour}
          onChange={onChange.colour}
          placeholder="Space Black"
        />
      </div>
      <Field
        label="Battery health %"
        value={values.battery}
        onChange={onChange.battery}
        type="number"
        placeholder="88"
      />
      <Field
        label="Specs (key:value, key:value)"
        value={values.specs}
        onChange={onChange.specs}
        placeholder="ram:6GB, storage:256GB"
      />
      <Field
        label="Usage history"
        value={values.usage}
        onChange={onChange.usage}
        placeholder="Used for one year"
      />
      <Field
        label="Defects"
        value={values.defects}
        onChange={onChange.defects}
        placeholder="Small scratch on the side"
      />
      <div>
        <label className={labelClass}>Proof document</label>
        <button
          type="button"
          onClick={() => proofInput.current?.click()}
          className={`${inputClass} flex cursor-pointer items-center gap-2 text-fg-dim`}
        >
          <Icon name="shield" size={14} />
          {proofUrl ? "Replace receipt" : "Upload receipt"}
        </button>
        {proofUrl && <div className="mt-1 truncate text-[10px] text-green">✓ Uploaded</div>}
        <input
          ref={proofInput}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onProof(file);
          }}
        />
      </div>
      <MediaFields {...media} />
      <NavRow onBack={onBack} onNext={onNext} />
    </div>
  );
}
