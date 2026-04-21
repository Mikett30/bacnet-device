
import { BDSingletProperty } from '../properties/index.js';
import { BDObject } from './generic/object.js';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  BinaryPV,
} from '@bacnet-js/client';

export interface BDBinaryInputOpts {
  name: string,
  writable: boolean,
  description?: string,
  presentValue?: BinaryPV,
}

const writableDefaults: Record<keyof BDBinaryInputOpts, boolean> = {
  name: false,
  description: false,
  presentValue: false,
  covIncrement: false
}

export class BDBinaryInput extends BDObject {

  readonly presentValue: BDSingletProperty<ApplicationTag.ENUMERATED, BinaryPV>;

  constructor(opts: BDBinaryInputOpts) {
    super(ObjectType.BINARY_INPUT, opts);

    this.presentValue = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN, BinaryPV>(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.presentValue ?? BinaryPV.INACTIVE));

  }
}
