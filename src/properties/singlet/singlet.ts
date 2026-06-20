
import {
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  type PropertyIdentifier,
  type CharacterStringEncoding,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
} from '@bacnet-js/client';
import { isDeepStrictEqual } from 'node:util';

import { BDError } from '../../errors.ts';
import { BDAbstractSingletProperty } from './abstract.ts';
import { type BDPropertyAccessContext } from '../types.ts';

export class BDSingletProperty<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> extends BDAbstractSingletProperty<Tag, Type> {

  #data: BACNetAppData<Tag, Type>;

  constructor(identifier: PropertyIdentifier, type: Tag, value: Type, writable: boolean = false, encoding?: CharacterStringEncoding, debug: boolean = false) {
    super(identifier);
    this.#data = { type, value, encoding };
    this.writable = this.writable = !!writable;
  }

  getData(ctx?: BDPropertyAccessContext): BACNetAppData<Tag, Type> {
    return this.#data;
  }

  getValue(ctx?: BDPropertyAccessContext): Type {
    return this.getData().value;
  }

  async setData(data: BACNetAppData<Tag, Type>) {
    if (isDeepStrictEqual(this.#data.value, data.value)) {
      this.#data = data;
      return;
    }

    await this.___asyncEmitSeries(true, 'beforecov', data, this);
    this.#data = data;
    await this.___asyncEmitSeries(false, 'aftercov', data, this);
  }

  async setValue(value: Type): Promise<void> {
    await this.setData({ ...this.getData(), value });
  }

  /**
   *
   * @internal
   */
  ___readData(index: number, ctx: BDPropertyAccessContext): BACNetAppData | BACNetAppData[] {
    return this.getData(ctx);
  }

  /**
   *
   * @internal
   */
  async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[], force: boolean = false): Promise<void> {
    if(!force && !this.writable) { throw new BDError('property is not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }

    if (Array.isArray(data)) {
      if (data.length !== 1) {
        throw new BDError('property is not an array or list', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
      } else {
        data = data[0];
      }
    }
    await this.setData(data);
  }
}
