
import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue } from '../../properties/presentvalue.ts';

import {
  ObjectType,
  ApplicationTag,
  EngineeringUnits,
  PropertyIdentifier,
  type ApplicationTagValueTypeMap,
} from '@bacnet-js/client';

export interface BDNumericObjectOpts<Type = number> {
  name: string,
  units?: EngineeringUnits,
  writable?: boolean | BDWritableProperties | undefined,
  description?: string | undefined,
  presentValue?: Type | undefined,
  covIncrement?: number | undefined,
  minPresentValue?: Type | undefined,
  maxPresentValue?: Type | undefined,
}

export type BDNumericApplicationTag =
  | ApplicationTag.REAL
  | ApplicationTag.UNSIGNED_INTEGER
  | ApplicationTag.SIGNED_INTEGER
;

export class BDNumericObject<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]
> extends BDObject {
  readonly presentValue: PresentValue<Tag, Type>;
  readonly engineeringUnit: BDSingletProperty<ApplicationTag.ENUMERATED, EngineeringUnits>;
  readonly covIncrement: BDSingletProperty<Tag, Type>;
  readonly maxPresentValue: BDSingletProperty<Tag>;
  readonly minPresentValue: BDSingletProperty<Tag>;
  readonly priorityArray?: BDArrayProperty<Tag>;
  readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly relinquishDefault?: BDSingletProperty<Tag>;
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;

  constructor(type: ObjectType, tag: Tag, opts: BDNumericObjectOpts<Type>) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    //Analog Inputs don't have a priority array.
    const givePriorityArray = type !== ObjectType.ANALOG_INPUT;

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, opts.presentValue ?? 0 as Type, givePriorityArray, opts.writable);

    //All numeric objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.covIncrement = this.addProperty(presentValue.covIncrement!);
    this.outOfService = this.addProperty(presentValue.outOfService);
    this.engineeringUnit = this.addProperty(new BDSingletProperty(PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, opts?.units ?? 95, opts?.writable?.UNITS ?? false));
    this.maxPresentValue = this.addProperty(new BDSingletProperty(PropertyIdentifier.MAX_PRES_VALUE, tag, Math.min(opts?.maxPresentValue ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) as Type, opts?.writable?.MAX_PRES_VALUE ?? false));
    this.minPresentValue = this.addProperty(new BDSingletProperty(PropertyIdentifier.MIN_PRES_VALUE, tag, Math.max(opts?.minPresentValue ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER) as Type, opts?.writable?.MIN_PRES_VALUE ?? false));

    //Analog inputs don't have these properties.
    if(givePriorityArray) {
      this.relinquishDefault = this.addProperty(presentValue.relinquishDefault!);
      this.priorityArray = this.addProperty(presentValue.priorityArray!);
      this.currentCommandPriority = this.addProperty(presentValue.currentCommandPriority!);
    }
  }
}
