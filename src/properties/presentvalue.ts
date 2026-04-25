import { 
  type ApplicationTagValueTypeMap,
  type BACNetAppData,
  PropertyIdentifier,
  ErrorCode,
  ErrorClass,
  ApplicationTag,
} from "@bacnet-js/client";

import {
    BDArrayProperty, 
    BDSingletProperty, 
    type BDWritableProperties 
} from "../index.ts";

import { BDError } from '../errors.ts';
import { type BDPropertyAccessContext } from './types.ts';

import {
    BDNumericObject,
    BDBinaryObject,
    BDMultistateObject,
    type BDNumericObjectOpts,
    type BDBinaryObjectOpts,
    type BDMultistateObjectOpts
} from '../index.ts';

export interface PresentValueOpts<Type> extends BDNumericObjectOpts<Type>, BDBinaryObjectOpts<Type>, BDMultistateObjectOpts<Type> {
    writable: BDWritableProperties
}

export class PresentValue<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> extends BDSingletProperty<Tag, Type> {
    #parent: BDNumericObject<Tag, Type> | BDBinaryObject<Tag, Type> | BDMultistateObject<Tag, Type>;

    constructor(tag: Tag, value: Type, parent: BDNumericObject<Tag, Type> | BDBinaryObject<Tag, Type> | BDMultistateObject<Tag, Type>, opts: PresentValueOpts<Type>) {
        super(PropertyIdentifier.PRESENT_VALUE, tag, value, opts.writable?.PRESENT_VALUE);

        //Store reference to parent object to allow present value to access other properties.
        this.#parent = parent;
    }

    /**
     *
     * @internal
     */
    override ___readData(index: number, ctx: BDPropertyAccessContext): BACNetAppData | BACNetAppData[] {
        //Check if priority array exists, if so return the highest priorty value (lowest index) that is not null.
        //If highest priority is null, return the relinquish default value.
        if(this.#parent.priorityArray && this.#parent.relinquishDefault) {
            const priority = this.#parent.priorityArray.getActivePriority();

            return priority ? this.#parent.priorityArray.getDataAtPriority(priority, ctx) : this.#parent.relinquishDefault.___readData(index, ctx);
        }

        //Otherwise, return the present value.
        return this.getData(ctx);
    }

    /**
     *
     * @internal
     */
    override async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[], force: boolean = false, priority: number = 16) {
        //Reject immediately if property is not writable.
        if(!force && !this.writable) { throw new BDError('property is not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }

        //Reject immediately if data is an array (since present value is a singlet property).
        if(Array.isArray(data)) {
            if(data.length !== 1) { throw new BDError('property is not an array or list', ErrorCode.INVALID_DATA_TYPE, ErrorClass.PROPERTY); }
            data = data[0];
        }

        //Get out of service value.
        const outOfService = this.#parent.outOfService.getData().value;

        //If priority array does not exist, require out of service to be true to write a value. (For input values).
        if(!this.#parent.priorityArray && !outOfService) { throw new BDError('input is not out of service', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }
      
        //When out of service is true, reject null value writes as they are intended to clear priority array values.
        if(outOfService && data.value === null) { throw new BDError('cannot write null value to present value when out of service', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }

        //For multistate objects, validate that the value is a valid integer within the range of states.
        if(this.#parent instanceof BDMultistateObject && this.#parent.stateText && this.#parent.numberOfStates) {
            if(!Number.isInteger(data.value)) { throw new BDError('value is not an integer', ErrorCode.INVALID_DATA_TYPE, ErrorClass.PROPERTY); }
            if(data.value < 1 || data.value > this.#parent.numberOfStates.getData().value) { throw new BDError('value is out of range', ErrorCode.VALUE_OUT_OF_RANGE, ErrorClass.PROPERTY); }
        }

        //If priority array exists, write to the priority array, then check active array priority.
        //Write new priority to current command priority, and update present value with highest priority value.
        if(!outOfService && this.#parent.priorityArray && this.#parent.relinquishDefault) {
            this.#parent.priorityArray.___writeData(data as any, false, priority);
            const activePriority = this.#parent.priorityArray.getActivePriority();
            this.#parent.currentCommandPriority?.setValue(activePriority);
            return this.setData(activePriority ? this.#parent.priorityArray.getDataAtPriority(activePriority) : this.#parent.relinquishDefault.getData());
        }

        //If out of service is true, write directly to present value.
        return this.setData(data);
    }
}