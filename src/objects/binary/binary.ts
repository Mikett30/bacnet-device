
import { BDSingletProperty, BDArrayProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue, type PresentValueOpts } from '../../properties/presentvalue.ts';

import {
  ObjectType,
  ApplicationTag,
  BinaryPV,
  CharacterStringEncoding,
  PropertyIdentifier,
  type ApplicationTagValueTypeMap,
} from '@bacnet-js/client';

export interface BDBinaryObjectOpts<Type = BinaryPV> {
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
  readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, number | null>;
  readonly relinquishDefault?: BDSingletProperty<Tag>;
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly activeText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;
  readonly inactiveText: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;

  static normalizeBinaryPV(value: unknown): BinaryPV {
    return value === true || value === 1 ? BinaryPV.ACTIVE : BinaryPV.INACTIVE;
  }

  constructor(type: ObjectType, tag: Tag, opts: BDBinaryObjectOpts<Type>) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    const defaultPV = BDBinaryObject.normalizeBinaryPV(opts.presentValue ?? opts.relinquishDefault ?? BinaryPV.INACTIVE) as Type;
    const defaultRelinquish = BDBinaryObject.normalizeBinaryPV(opts.relinquishDefault ?? BinaryPV.INACTIVE) as Type;

    //Binary inputs don't have these commandable properties.
    if(type !== ObjectType.BINARY_INPUT) {
      this.relinquishDefault = this.addProperty(new BDSingletProperty<Tag, Type>(PropertyIdentifier.RELINQUISH_DEFAULT, tag, defaultRelinquish, opts.writable?.RELINQUISH_DEFAULT));
    }

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, defaultPV, this, opts as PresentValueOpts<Type>);

    //All binary objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.outOfService = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, opts.writable?.OUT_OF_SERVICE ?? false));
    this.activeText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.ACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.activeText ?? 'On', opts.writable?.ACTIVE_TEXT ?? false, CharacterStringEncoding.UTF_8));
    this.inactiveText = this.addProperty(new BDSingletProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.INACTIVE_TEXT, ApplicationTag.CHARACTER_STRING, opts?.inactiveText ?? 'Off', opts.writable?.INACTIVE_TEXT ?? false, CharacterStringEncoding.UTF_8));

    //Binary inputs don't have these commandable properties.
    if(type !== ObjectType.BINARY_INPUT) {
      this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, number | null>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.NULL, null, false));
      this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
    }
  }
}
