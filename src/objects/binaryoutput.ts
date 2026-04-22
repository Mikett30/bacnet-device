import { BDSingletProperty, BDArrayProperty } from '../properties/index.ts';
import { BDObject, type BDWritableProperties } from './generic/object.ts';

import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';

export interface BDBinaryOutputOpts {
  name: string,
  writable?: BDWritableProperties,
  description?: string,
  presentValue?: boolean,
  activeText?: string,
  inactiveText?: string,
}

export class BDBinaryOutput extends BDObject {
  readonly relinquishedDefault: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly priorityArray: BDArrayProperty<ApplicationTag.NULL | ApplicationTag.BOOLEAN>;
  readonly currentCommandPriority: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly presentValue: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly activeText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly inactiveText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;

  constructor(opts: BDBinaryOutputOpts) {
    super(ObjectType.BINARY_OUTPUT, opts);

    this.presentValue = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.PRESENT_VALUE, ApplicationTag.BOOLEAN, opts.presentValue ?? false, opts.writable?.PRESENT_VALUE ?? false));
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.activeText ?? 'Active', opts.writable?.ACTIVE_TEXT ?? false));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts.inactiveText ?? 'Inactive', opts.writable?.INACTIVE_TEXT ?? false));
    this.relinquishedDefault = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.RELINQUISH_DEFAULT, ApplicationTag.BOOLEAN, false, opts.writable?.RELINQUISH_DEFAULT ?? false));
    this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false));
    this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
  }
}
