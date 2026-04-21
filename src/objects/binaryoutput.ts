
import { BDSingletProperty, BDArrayProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  BinaryPV,
} from '@bacnet-js/client';

export interface BDBinaryOutputOpts {
  name: string,
  writable: boolean,
  description?: string,
  presentValue?: BinaryPV,
}

const writableDefaults: Record<keyof BDBinaryOutputOpts, boolean> = {
  name: false,
  description: false,
  presentValue: false,
  covIncrement: false
}

export class BDBinaryOutput extends BDObject {

  readonly relinquishedDefault: BDSingletProperty<ApplicationTag.BOOLEAN, boolean>;
  readonly priorityArray: BDArrayProperty<ApplicationTag.NULL>;
  readonly currentCommandPriority: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER, number>;
  readonly presentValue: BDSingletProperty<ApplicationTag.ENUMERATED, BinaryPV>;

  constructor(opts: BDBinaryOutputOpts) {
    super(ObjectType.BINARY_OUTPUT, opts);

    this.presentValue = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN, BinaryPV>(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.presentValue ?? BinaryPV.INACTIVE));

    this.relinquishedDefault = this.addProperty(new BDSingletProperty(PropertyIdentifier.RELINQUISHED_DEFAULT, ApplicationTag.BOOLEAN, false));
    this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
    this.currentCommandPriority = this.addProperty(new BDSingletProperty(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0));
  }
}
