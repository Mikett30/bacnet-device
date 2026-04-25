
import { BDSingletProperty } from '../../properties/index.ts';
import { BDObject } from '../generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';

export interface BDTimeValueOpts {
  name: string,
  writable?: boolean,
  description?: string,
  presentValue?: Date,
}

export class BDTimeValue extends BDObject {

  readonly presentValue: BDSingletProperty<ApplicationTag.TIME>;

  constructor(opts: BDTimeValueOpts) {
    super(ObjectType.TIME_VALUE, opts);

    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.TIME, opts.presentValue ?? new Date(), opts.writable ?? false));
      
  }
}
