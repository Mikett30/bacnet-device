import { 
    type ApplicationTagValueTypeMap,
    type BACNetAppData,
    PropertyIdentifier,
    ErrorCode,
    ErrorClass,
    ApplicationTag,
    BinaryPV,
} from "@bacnet-js/client";
import { isDeepStrictEqual } from "node:util";

import {
    BDSingletProperty, 
    type BDWritableProperties,
    type BDPropertyEvents,
    type EventKey,
    type EventListener,
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
        #lastObjectCovEmitValue: Type | undefined;
        #parentAfterCovWired = false;

    #onRelinquishDefaultAfterCov = async () => {
        // Relinquish_Default only drives Present_Value when no command priority is active.
        if(this.#parent.priorityArray && this.#parent.relinquishDefault && !this.#parent.priorityArray.getActivePriority()) {
            await this.setData(this.#parent.relinquishDefault.getData());
        }
    }

    constructor(tag: Tag, value: Type, parent: BDNumericObject<Tag, Type> | BDBinaryObject<Tag, Type> | BDMultistateObject<Tag, Type>, opts: PresentValueOpts<Type>) {
        super(PropertyIdentifier.PRESENT_VALUE, tag, value, opts.writable?.PRESENT_VALUE);

        //Store reference to parent object to allow present value to access other properties.
        this.#parent = parent;

        // Keep Present_Value in sync with Relinquish_Default when no slot in Priority_Array is active.
        this.#parent.relinquishDefault?.on('aftercov', this.#onRelinquishDefaultAfterCov);
    }

    override async setValue(value: Type, priority: number = 16): Promise<void> {
        await this.___writeData({ ...this.getData(), value }, true, priority);
    }

    /**
     * Prevent BDObject's default presentValue->object aftercov wiring so
     * presentValue can control when parent object aftercov is emitted.
     */
    override on<K extends EventKey<BDPropertyEvents<Tag, Type, BACNetAppData<Tag, Type>>>>(event: K, cb: EventListener<BDPropertyEvents<Tag, Type, BACNetAppData<Tag, Type>>, K>) {
        if (event === "aftercov" && !this.#parentAfterCovWired) {
            this.#parentAfterCovWired = true;
            return this;
        }

        return super.on(event, cb);
    }

    override async setData(data: BACNetAppData<Tag, Type>) {
        const previousValue = this.getData().value;
        if (isDeepStrictEqual(previousValue, data.value)) {
            await super.setData(data);
            return;
        }

        // Always emit property-level COV notifications for Present_Value changes.
        await super.setData(data);

        // Non-numeric objects do not support COV_INCREMENT filtering.
        if (!(this.#parent instanceof BDNumericObject) || typeof data.value !== "number") {
            await this.#emitParentAfterCov(data);
            return;
        }

        const covIncrement = this.#parent.covIncrement.getData().value;
        if (typeof covIncrement !== "number" || covIncrement <= 0) {
            this.#lastObjectCovEmitValue = data.value;
            await this.#emitParentAfterCov(data);
            return;
        }

        if (typeof this.#lastObjectCovEmitValue !== "number") {
            this.#lastObjectCovEmitValue = data.value;
            await this.#emitParentAfterCov(data);
            return;
        }

        const change = Math.abs(data.value - this.#lastObjectCovEmitValue);
        if (change < covIncrement) {
            return;
        }

        this.#lastObjectCovEmitValue = data.value;
        await this.#emitParentAfterCov(data);
    }

    async #emitParentAfterCov(data: BACNetAppData<Tag, Type>) {
        await this.#parent.___asyncEmitSeries(false, "aftercov", data, this, this.#parent);
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

        //For binary objects, normalize booleans to BinaryPV and enforce enum domain.
        if(this.#parent instanceof BDBinaryObject) {
            if(data.value === true) {
                data = { ...data, type: ApplicationTag.ENUMERATED as Tag, value: BinaryPV.ACTIVE as Type };
            } else if(data.value === false) {
                data = { ...data, type: ApplicationTag.ENUMERATED as Tag, value: BinaryPV.INACTIVE as Type };
            } else if(data.value !== null && data.value !== BinaryPV.ACTIVE && data.value !== BinaryPV.INACTIVE) {
                throw new BDError('value is out of range', ErrorCode.VALUE_OUT_OF_RANGE, ErrorClass.PROPERTY);
            }
        }

        //Get out of service value.
        const outOfService = this.#parent.outOfService.getData().value;

        //If priority array does not exist, require out of service to be true to write a value. (For input values).
        if(!this.#parent.priorityArray && !outOfService) { throw new BDError('input is not out of service', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }
      
        //For multistate objects, validate that the value is a valid integer within the range of states.
        //Allow null here because null is used to release a priority slot for commandable objects.
        if(this.#parent instanceof BDMultistateObject && this.#parent.stateText && this.#parent.numberOfStates) {
            if(data.value === null) {
                //No-op: null is handled by priority-array release logic below.
            } else {
                if(!Number.isInteger(data.value)) { throw new BDError('value is not an integer', ErrorCode.INVALID_DATA_TYPE, ErrorClass.PROPERTY); }
                if(data.value < 1 || data.value > this.#parent.numberOfStates.getData().value) { throw new BDError('value is out of range', ErrorCode.VALUE_OUT_OF_RANGE, ErrorClass.PROPERTY); }
            }
        }

        //If priority array exists, write to the priority array, then check active array priority.
        //Write new priority to current command priority, and update present value with highest priority value.
        if(this.#parent.priorityArray && this.#parent.relinquishDefault) {
            const priorityWriteData = data.value === null
                ? { type: ApplicationTag.NULL, value: null }
                : data;

            await this.#parent.priorityArray.___writeData(priorityWriteData as any, false, priority);
            const activePriority = this.#parent.priorityArray.getActivePriority();
            const currentCommandPriorityData: BACNetAppData<ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.NULL, number | null> = activePriority
                ? { type: ApplicationTag.UNSIGNED_INTEGER, value: activePriority }
                : { type: ApplicationTag.NULL, value: null };
            await this.#parent.currentCommandPriority?.setData(
                currentCommandPriorityData
            );
            return this.setData(activePriority ? this.#parent.priorityArray.getDataAtPriority(activePriority) : this.#parent.relinquishDefault.getData());
        }

        //If no priority array exists, the object behaves like an input and may only be written out of service.
        return this.setData(data);
    }
}