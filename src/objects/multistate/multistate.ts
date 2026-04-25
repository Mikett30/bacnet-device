
import { BDSingletProperty, BDArrayProperty, BDPolledArrayProperty, BDPolledSingletProperty } from '../../properties/index.ts';
import { BDObject, type BDWritableProperties } from '../generic/object.ts';
import { PresentValue, type PresentValueOpts } from '../../properties/presentvalue.ts';

import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
} from '@bacnet-js/client';

export interface BDMultistateObjectOpts<Type = number> {
  name: string,
  writable?: boolean | BDWritableProperties | undefined,
  description?: string | undefined,
  relinquishDefault?: Type | undefined,
  presentValue?: Type | undefined,
  states?: string[] | undefined,
}

export class BDMultistateObject<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag]
> extends BDObject {
  readonly presentValue: PresentValue<Tag, Type>;
  readonly priorityArray?: BDArrayProperty<Tag>;
  readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
  readonly relinquishDefault?: BDSingletProperty<Tag>;
  readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
  readonly stateText?: BDPolledArrayProperty<ApplicationTag.CHARACTER_STRING>;
  readonly numberOfStates: BDPolledSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;

  constructor(type: ObjectType, tag: Tag, opts: BDMultistateObjectOpts<Type>) {
    super(type, opts);

    opts.writable = typeof opts.writable === "boolean" ? (opts.writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : opts.writable;

    //Create a present value properties that is tied to other properties.
    const presentValue = new PresentValue<Tag, Type>(tag, opts.presentValue ?? opts.relinquishDefault ?? 1 as Type, this, opts as PresentValueOpts<Type>);

    //All multistate objects have these properties.
    this.presentValue = this.addProperty(presentValue);
    this.outOfService = this.addProperty(new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, opts.writable?.OUT_OF_SERVICE ?? false));
    this.numberOfStates = this.addProperty(new BDPolledSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.NUMBER_OF_STATES, ApplicationTag.UNSIGNED_INTEGER, () => opts?.states?.length ?? 2));

    //Force multistate state text to be an array of at least 2 states, as required by the standard.
    opts.states = Array.isArray(opts.states) ? [...opts.states, ...Array.from({ length: Math.max(0, 2 - opts.states.length) }, (_, i) => `State ${i + opts.states!.length + 1}`)] : ["State 1", "State 2"];
    
    const stateTextData: BACNetAppData<ApplicationTag.CHARACTER_STRING>[] = opts.states.map(state => ({ type: ApplicationTag.CHARACTER_STRING, value: state }));
    this.stateText = this.addProperty(new BDPolledArrayProperty<ApplicationTag.CHARACTER_STRING>(PropertyIdentifier.STATE_TEXT, () => stateTextData));

    //Multistate inputs don't have these properties.
    if(type !== ObjectType.MULTI_STATE_INPUT) {
      this.relinquishDefault = this.addProperty(new BDSingletProperty<Tag, Type>(PropertyIdentifier.RELINQUISH_DEFAULT, tag, opts.relinquishDefault ?? 1 as Type, opts.writable?.RELINQUISH_DEFAULT));
      this.currentCommandPriority = this.addProperty(new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false));
      this.priorityArray = this.addProperty(new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY));
    }
  }
}
