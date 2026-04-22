import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';

import {
  type BDNumericValueOpts,
  BDNumericObject,
} from './numeric.ts';

import {
  ApplicationTag,
  EngineeringUnits,
  ObjectType,
  PropertyIdentifier,
} from '@bacnet-js/client';

export interface BDAnalogValueOpts {
  name: string,
  writable?: boolean | BDWritableProperties | undefined,
  description?: string | undefined,
  presentValue?: number | undefined,
  relinquishDefault?: number | undefined,
  minPresentValue?: number | undefined,
  maxPresentValue?: number | undefined,
  covIncrement?: number | undefined,
  units?: EngineeringUnits | undefined,
}

export class BDAnalogValue extends BDNumericObject<ApplicationTag.REAL> {
  readonly relinquishDefault: BDSingletProperty<ApplicationTag.REAL>;
  readonly priorityArray: BDArrayProperty<ApplicationTag.NULL | ApplicationTag.REAL>;
  readonly currentCommandPriority: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;

  constructor(opts: BDAnalogValueOpts) {
    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    super(ObjectType.ANALOG_VALUE, ApplicationTag.REAL, opts as BDNumericValueOpts);

    this.relinquishDefault = this.addProperty(new BDSingletProperty<ApplicationTag.REAL>(PropertyIdentifier.RELINQUISH_DEFAULT, ApplicationTag.REAL, opts.relinquishDefault ?? 0, opts.writable?.RELINQUISH_DEFAULT ?? false));
    this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false));
    this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
  }
}
