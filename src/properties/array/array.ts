
import {
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
  PropertyIdentifier,
} from '@bacnet-js/client';

import { BDError } from '../../errors.js';
import { type BDPropertyAccessContext } from './../types.js';

import { BDAbstractArrayProperty } from './abstract.js';

export class BDArrayProperty<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> extends BDAbstractArrayProperty<Tag, Type> {

  #data: BACNetAppData<Tag, Type>[];

  constructor(identifier: PropertyIdentifier) {
    super(identifier);
    this.#data = new Array(16).fill({ type: ApplicationTag.NULL, value: null });
  }

  getData(priority: number, ctx?: BDPropertyAccessContext) {
    if(Number.isInteger(priority) && priority >= 1 && priority <= this.#data.length) {
      return this.#data[priority - 1];
    }
    return this.#data;
  }

  async setData(data: BACNetAppData<Tag, Type>[], priority: number) {
    await this.___asyncEmitSeries(true, 'beforecov', data, this);
    this.#data[priority - 1] = data;
    await this.___asyncEmitSeries(false, 'aftercov', data, this);
    return this.getActivePriority();
  }

  /**
   *
   * @internal
   */
  async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[], priority: number) {
    if (!Number.isInteger(priority) || priority < 1 || priority > this.#data.length) {
      console.log('invalid priority', priority); // DEBUG
      throw new BDError('invalid priority', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
    }
    if (Array.isArray(data)) {
      if (data.length !== 1) {
        console.log('invalid array length', data.length); // DEBUG
          throw new BDError('property is not an array or list', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY);
      } else {
          data = data[0];
      }
    }
    return this.setData(data, priority);
  }
  
  /**
   * 
   * @returns Returns the highest active priority level, or 0 if not being controlled.
   */
  getActivePriority() {
    return this.#data.findIndex(val => val.type !== ApplicationTag.NULL) + 1;
  }
}
