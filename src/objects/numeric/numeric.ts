
import { BDSingletProperty } from '../../properties/index.js';
import { BDObject } from '../generic/object.js';
import {
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
  type BACNetObjectID,
} from '@bacnet-js/client';

export interface BDNumericValueOpts {
  name: string,
  unit: EngineeringUnits,
  writable?: boolean,
  description?: string,
  presentValue: number,
  covIncrement?: number,
  minPresentValue: number,
  maxPresentValue: number,
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

    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, tag, opts.presentValue));

    this.engineeringUnit = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, opts.unit));

    this.covIncrement = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.COV_INCREMENT, tagToCovIncrementTag[tag], opts.covIncrement ?? 0));

    this.maxPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MAX_PRES_VALUE, tag, opts.maxPresentValue));

    this.minPresentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.MIN_PRES_VALUE, tag, opts.minPresentValue));

  }
}
