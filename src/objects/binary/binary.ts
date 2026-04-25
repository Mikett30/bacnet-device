
import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue, type PresentValueOpts } from '../../properties/presentvalue.ts';

import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  type ApplicationTagValueTypeMap,
} from '@bacnet-js/client';

export interface BDBinaryObjectOpts<Type = boolean> {
  name: string,
  writable?: boolean | BDWritableProperties | undefined,
  description?: string | undefined,
  relinquishDefault?: Type | undefined,
  presentValue?: Type | undefined,
  activeText?: string | undefined,
  inactiveText?: string | undefined,
}

export class BDBinaryObject<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]
> extends BDObject {
  readonly presentValue: PresentValue<Tag, Type>;
  readonly priorityArray?: BDArrayProperty<Tag>;
  readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly relinquishDefault?: BDSingletProperty<Tag>;
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly activeText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly inactiveText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;

  constructor(type: ObjectType, tag: Tag, opts: BDBinaryObjectOpts<Type>) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, opts.presentValue ?? opts.relinquishDefault ?? false as Type, this, opts as PresentValueOpts<Type>);

    //All binary objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.outOfService = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, opts.writable?.OUT_OF_SERVICE ?? false));
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.activeText ?? 'On', opts.writable?.ACTIVE_TEXT ?? false));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.inactiveText ?? 'Off', opts.writable?.INACTIVE_TEXT ?? false));

    //Binary inputs don't have these properties.
    if(type !== ObjectType.BINARY_INPUT) {
      this.relinquishDefault = this.addProperty(new BDSingletProperty<Tag, Type>(PropertyIdentifier.RELINQUISH_DEFAULT, tag, opts.relinquishDefault ?? false as Type, opts.writable?.RELINQUISH_DEFAULT));
      this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false));
      this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
    }
  }
}
