
import { BDSingletProperty } from '../../properties/index.ts';
import { BDObject } from '../generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';

export interface BDDateTimeValueOpts {
  name: string,
  writable?: boolean,
  description?: string,
  presentValue?: Date,
}

export class BDDateTimeValue extends BDObject {

  readonly presentValue: BDSingletProperty<ApplicationTag.DATETIME>;

  constructor(opts: BDDateTimeValueOpts) {
    super(ObjectType.DATETIME_VALUE, opts);

    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.DATETIME, opts.presentValue ?? new Date(), opts.writable ?? false));

  }
}
