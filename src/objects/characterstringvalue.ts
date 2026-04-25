
import { BDSingletProperty } from '../properties/index.ts';
import { BDObject } from './generic/object.ts';
import {
  ObjectType,
  ApplicationTag,
  PropertyIdentifier,
  CharacterStringEncoding,
} from '@bacnet-js/client';

export interface BDCharacterStringValueOpts {
  name: string,
  writable?: boolean,
  description?: string,
  presentValue?: string,
}

export class BDCharacterStringValue extends BDObject {

  readonly presentValue: BDSingletProperty<ApplicationTag.CHARACTER_STRING>;

  constructor(opts: BDCharacterStringValueOpts) {
    super(ObjectType.CHARACTERSTRING_VALUE, opts);

    this.presentValue = this.addProperty(new BDSingletProperty(
      PropertyIdentifier.PRESENT_VALUE, ApplicationTag.CHARACTER_STRING, opts.presentValue ?? '', opts.writable ?? false, CharacterStringEncoding.UTF_8));

  }
}
