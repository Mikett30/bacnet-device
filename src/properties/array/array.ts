
import {
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';
import { isDeepStrictEqual } from 'node:util';

import { BDError } from '../../errors.ts';
import { type BDPropertyAccessContext } from './../types.ts';

import { BDAbstractArrayProperty } from './abstract.ts';

export class BDArrayProperty<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> extends BDAbstractArrayProperty<Tag, Type> {

  override getData(ctx?: BDPropertyAccessContext): BACNetAppData<Tag, Type>[] { return this.#data; }

  #data: BACNetAppData<Tag, Type>[];

  constructor(identifier: PropertyIdentifier) {
    super(identifier);
    this.#data = new Array(16).fill({ type: ApplicationTag.NULL, value: null });
  }

  getDataAtPriority(priority: number, ctx?: BDPropertyAccessContext) {  
    if(Number.isInteger(priority) && priority >= 1 && priority <= this.#data.length) {
      return this.#data[priority - 1];
    }
    throw new BDError('invalid priority', ErrorCode.READ_ACCESS_DENIED, ErrorClass.PROPERTY);
  }

  async setData(data: BACNetAppData<Tag, Type>[]) {
    if (isDeepStrictEqual(this.#data, data)) {
      this.#data = data;
      return;
    }

    await this.___asyncEmitSeries(true, 'beforecov', data, this);
    this.#data = data;
    await this.___asyncEmitSeries(false, 'aftercov', data, this);
  }

  async setDataAtPriority(data: BACNetAppData<Tag, Type>, priority: number) {
    if(data.value === null) {
      data = { type: ApplicationTag.NULL, value: null } as BACNetAppData<Tag, Type>;
    }

    const nextData = [...this.#data];
    nextData[priority - 1] = data;

    if (isDeepStrictEqual(this.#data, nextData)) {
      return;
    }

    await this.___asyncEmitSeries(true, 'beforecov', nextData, this);
    this.#data = nextData;
    await this.___asyncEmitSeries(false, 'aftercov', this.#data, this);
  }

  /**
   *
   * @internal
   */
  async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[], force: boolean = false, priority: number = 16) {
    if (!Number.isInteger(priority) || priority < 1 || priority > this.#data.length) {
      throw new BDError('invalid priority', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (Array.isArray(data)) {
      if (data.length !== 1) {
          throw new BDError('property is not an array or list', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
      } else {
          data = data[0];
      }
    }

    if(data.value === null) {
      data = { type: ApplicationTag.NULL, value: null } as BACNetAppData<Tag, Type>;
    }

    await this.setDataAtPriority(data, priority);
  }
  
  /**
   * 
   * @returns Returns the highest active priority level, or 0 if not being controlled.
   */
  getActivePriority() {
    return this.#data.findIndex(val => val.type !== ApplicationTag.NULL && val.value !== null && val.value !== undefined) + 1;
  }
}
