
import { BDSingletProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
  type BACNetObjectID,
} from '@bacnet-js/client';

export interface BDNumericValueOpts {
  name: string,
  unit?: EngineeringUnits,
  writable?: boolean | BDWritableProperties | undefined,
  description?: string | undefined,
  presentValue: number | undefined,
  covIncrement?: number | undefined,
  minPresentValue?: number | undefined,
  maxPresentValue?: number | undefined,
}

export type BDNumericApplicationTag =
  | ApplicationTag.REAL
  | ApplicationTag.UNSIGNED_INTEGER
  | ApplicationTag.SIGNED_INTEGER
;

const tagToCovIncrementTag = {
  [ApplicationTag.REAL]: ApplicationTag.REAL,
  [ApplicationTag.UNSIGNED_INTEGER]: ApplicationTag.UNSIGNED_INTEGER,
  [ApplicationTag.SIGNED_INTEGER]: ApplicationTag.UNSIGNED_INTEGER,
} satisfies Record<BDNumericApplicationTag, ApplicationTag>;

export class BDNumericObject<Tag extends BDNumericApplicationTag> extends BDObject {
  readonly presentValue: BDSingletProperty<Tag>;
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  readonly covIncrement: BDSingletProperty<(typeof tagToCovIncrementTag)[Tag]>;
  readonly maxPresentValue: BDSingletProperty<Tag>;
  readonly minPresentValue: BDSingletProperty<Tag>;

  constructor(type: ObjectType, tag: Tag, opts: BDNumericValueOpts) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, tag, opts?.presentValue ?? 0, opts?.writable?.PRESENT_VALUE ?? false));

    this.engineeringUnit = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, opts?.unit ?? 95, opts?.writable?.UNITS ?? false));

    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, tagToCovIncrementTag[tag], opts?.covIncrement ?? 0, opts?.writable?.COV_INCREMENT ?? false));

    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_PRES_VALUE, tag, Math.min(opts?.maxPresentValue ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER), opts?.writable?.MAX_PRES_VALUE ?? false));

    this.minPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MIN_PRES_VALUE, tag, Math.max(opts?.minPresentValue ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER), opts?.writable?.MIN_PRES_VALUE ?? false));
  }
}
