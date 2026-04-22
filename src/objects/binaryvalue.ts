
import { BDSingletProperty, BDArrayProperty } from '../properties/index.ts';
import { BDObject, type BDWritableProperties } from './generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  BinaryPV,
} from '@bacnet-js/client';

export interface BDBinaryValueOpts {
  name: string,
  writable?: BDWritableProperties,
  description?: string,
  presentValue?: BinaryPV,
  activeText?: string,
  inactiveText?: string,
}

export class BDBinaryValue extends BDObject {
  readonly relinquishedDefault: BDSingletProperty<ApplicationTag.BOOLEAN, boolean>;
  readonly priorityArray: BDArrayProperty<ApplicationTag.NULL>;
  readonly currentCommandPriority: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER, number>;
  readonly presentValue: BDSingletProperty<ApplicationTag.ENUMERATED, BinaryPV>;
  readonly activeText: BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>;
  readonly inactiveText: BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>;

  constructor(opts: BDBinaryValueOpts) {
    super(ObjectType.BINARY_VALUE, opts);

    this.presentValue = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN, BinaryPV>(PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.presentValue ?? BinaryPV.INACTIVE, opts.writable?.PRESENT_VALUE ?? false));
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.activeText ?? 'Active', opts.writable?.ACTIVE_TEXT ?? false));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING, string>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.inactiveText ?? 'Inactive', opts.writable?.INACTIVE_TEXT ?? false));
    this.relinquishedDefault = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN, boolean>(PropertyIdentifier.RELINQUISHED_DEFAULT, ApplicationTag.BOOLEAN, false, opts.writable?.RELINQUISHED_DEFAULT ?? false));
    this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER, number>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false));
    this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
  }
}
