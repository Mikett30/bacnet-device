
import { BDSingletProperty } from '../properties/index.ts';
import { BDObject, type BDWritableProperties } from './generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';

export interface BDBinaryInputOpts {
  name: string,
  writable?: BDWritableProperties,
  description?: string,
  presentValue?: boolean,
  activeText?: string,
  inactiveText?: string,
}

export class BDBinaryInput extends BDObject {

  readonly presentValue: BDSingletProperty<ApplicationTag.BOOLEAN, boolean>;
  readonly activeText: BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>;
  readonly inactiveText: BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>;

  constructor(opts: BDBinaryInputOpts) {
    super(ObjectType.BINARY_INPUT, opts);

    this.presentValue = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.presentValue ?? false, opts.writable?.PRESENT_VALUE ?? false));
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.activeText ?? 'Active', opts.writable?.ACTIVE_TEXT ?? false));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.inactiveText ?? 'Inactive', opts.writable?.INACTIVE_TEXT ?? false));
  }
}
