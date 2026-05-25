
import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue, type PresentValueOpts } from '../../properties/presentvalue.ts';

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
  relinquishDefault?: Type | undefined,
  presentValue?: Type | undefined,
  covIncrement?: Type | undefined,
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
  readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, number | null>;
  readonly relinquishDefault?: BDSingletProperty<Tag>;
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;

  constructor(type: ObjectType, tag: Tag, opts: BDNumericObjectOpts<Type>) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    //Analog inputs don't have these commandable properties.
    if(type !== ObjectType.ANALOG_INPUT) {
      this.relinquishDefault = this.addProperty(new BDSingletProperty<Tag, Type>(PropertyIdentifier.RELINQUISH_DEFAULT, tag, opts.relinquishDefault ?? 0 as Type, opts.writable?.RELINQUISH_DEFAULT));
    }

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, opts.presentValue ?? opts.relinquishDefault ?? 0 as Type, this, opts as PresentValueOpts<Type>);

    //All numeric objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.outOfService = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, opts.writable?.OUT_OF_SERVICE ?? false));
    this.covIncrement = this.addProperty(new BDSingletProperty<Tag, Type>(PropertyIdentifier.COV_INCREMENT, tag, opts.covIncrement ?? 0 as Type, opts.writable?.COV_INCREMENT ?? false));
    this.engineeringUnit = this.addProperty(new BDSingletProperty(PropertyIdentifier.UNITS, ApplicationTag.ENUMERATED, opts?.units ?? 95, opts?.writable?.UNITS ?? false));
    this.maxPresentValue = this.addProperty(new BDSingletProperty(PropertyIdentifier.MAX_PRES_VALUE, tag, Math.min(opts?.maxPresentValue ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER) as Type, opts?.writable?.MAX_PRES_VALUE ?? false));
    this.minPresentValue = this.addProperty(new BDSingletProperty(PropertyIdentifier.MIN_PRES_VALUE, tag, Math.max(opts?.minPresentValue ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER) as Type, opts?.writable?.MIN_PRES_VALUE ?? false));

    //Analog inputs don't have these commandable properties.
    if(type !== ObjectType.ANALOG_INPUT) {
      this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, number | null>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.NULL, null, false));
      this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
    }
  }
}
