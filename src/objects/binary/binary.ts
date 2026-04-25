
import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue } from '../../properties/presentvalue.ts';

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

    //Binary Inputs don't have a priority array.
    const givePriorityArray = type !== ObjectType.BINARY_INPUT;

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, opts.presentValue ?? false as Type, givePriorityArray, opts.writable);

    //All binary objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.outOfService = this.addProperty(presentValue.outOfService);
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.activeText ?? 'On', opts.writable?.ACTIVE_TEXT ?? false));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.inactiveText ?? 'Off', opts.writable?.INACTIVE_TEXT ?? false));

    //Binary inputs don't have these properties.
    if(givePriorityArray) {
      this.relinquishDefault = this.addProperty(presentValue.relinquishDefault!);
      this.priorityArray = this.addProperty(presentValue.priorityArray!);
      this.currentCommandPriority = this.addProperty(presentValue.currentCommandPriority!);
    }
  }
}
