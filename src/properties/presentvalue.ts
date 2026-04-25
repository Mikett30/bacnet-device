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

interface PresentValueOpts<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> {
  type: ApplicationTag.BOOLEAN | ApplicationTag.REAL | ApplicationTag.UNSIGNED_INTEGER | ApplicationTag.SIGNED_INTEGER,
  value: Type,
  writable?: boolean,
  outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>,
  relinquishDefault?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>,
  priorityArray?: BDArrayProperty<ApplicationTag.NULL | ApplicationTag.UNSIGNED_INTEGER>,
  covIncrement?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>,
}

export class PresentValue<
  Tag extends ApplicationTag,
  Type extends ApplicationTagValueTypeMap[Tag] = ApplicationTagValueTypeMap[Tag],
> extends BDSingletProperty<Tag, Type> {
    readonly outOfService: BDSingletProperty<ApplicationTag.BOOLEAN>;
    readonly relinquishDefault?: BDSingletProperty<Tag, Type>;
    readonly currentCommandPriority?: BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>;
    readonly priorityArray?: BDArrayProperty<Tag, Type>;
    readonly covIncrement?: BDSingletProperty<Tag, Type>;

    constructor(tag: Tag, value: Type, givePriorityArray: boolean = false, writable: BDWritableProperties | boolean = false) {
        var write = typeof writable === "boolean" ? (writable ? new Proxy({}, { get: () => true }) as BDWritableProperties : undefined) : writable;

        super(PropertyIdentifier.PRESENT_VALUE, tag as Tag, value, write?.PRESENT_VALUE ?? false);

        //Create associated OUT_OF_SERVICE property.
        this.outOfService = new BDSingletProperty<ApplicationTag.BOOLEAN>(PropertyIdentifier.OUT_OF_SERVICE, ApplicationTag.BOOLEAN, false, write?.OUT_OF_SERVICE ?? false);

        // COV Increment isn't applicable to BOOLEAN properties.
        if(tag !== ApplicationTag.BOOLEAN) {
            this.covIncrement = new BDSingletProperty<Tag, Type>(PropertyIdentifier.COV_INCREMENT, tag, value, write?.COV_INCREMENT ?? false);
        }

        // Include all properties used with a priority array.
        if(givePriorityArray) {
            this.relinquishDefault = new BDSingletProperty<Tag, Type>(PropertyIdentifier.RELINQUISH_DEFAULT, tag, value, write?.RELINQUISH_DEFAULT ?? false);
            this.currentCommandPriority = new BDSingletProperty<ApplicationTag.UNSIGNED_INTEGER>(PropertyIdentifier.CURRENT_COMMAND_PRIORITY, ApplicationTag.UNSIGNED_INTEGER, 0, false);
            this.priorityArray = new BDArrayProperty(PropertyIdentifier.PRIORITY_ARRAY);
        }
    }

    /**
     *
     * @internal
     */
    override ___readData(index: number, ctx: BDPropertyAccessContext): BACNetAppData | BACNetAppData[] {
        //Check if priority array exists, if so return the highest priorty value (lowest index) that is not null.
        //If highest priority is null, return the relinquish default value.
        if(this.priorityArray && this.relinquishDefault) {
            const priority = this.priorityArray.getActivePriority();

            return priority ? this.priorityArray.getDataAtPriority(priority, ctx) : this.relinquishDefault.___readData(index, ctx);
        }

        //Otherwise, return the present value.
        return this.getData(ctx);
    }

    /**
     *
     * @internal
     */
    override async ___writeData(data: BACNetAppData<Tag, Type> | BACNetAppData<Tag, Type>[], priority: number = 16) {
        console.log("DEBUG PRESENT VALUE WRITE", { data, priority, writable: this.writable, outOfService: this.outOfService.getData().value, hasPriorityArray: !!this.priorityArray, relinquishDefault: !!this.relinquishDefault });
        
        //Reject immediately if property is not writable.
        if(!this.writable) { throw new BDError('property is not writable', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }

        //Reject immediately if data is an array (since present value is a singlet property).
        if(Array.isArray(data)) {
            if(data.length !== 1) { throw new BDError('property is not an array or list', ErrorCode.INVALID_DATA_TYPE, ErrorClass.PROPERTY); }
            data = data[0];
        }

        //Get out of service value.
        const outOfService = this.outOfService.getData().value;

        //If priority array does not exist, require out of service to be true to write a value.
        if(!this.priorityArray && !outOfService) { throw new BDError('input is not out of service', ErrorCode.WRITE_ACCESS_DENIED, ErrorClass.PROPERTY); }
      
        //If priority array exists, write to the priority array, then check active array priority.
        //Write new priority to current command priority, and update present value with highest priority value.
        if(!outOfService && this.priorityArray && this.relinquishDefault) {
            this.priorityArray.___writeData(data as any, priority);
            const activePriority = this.priorityArray.getActivePriority();
            this.currentCommandPriority?.setValue(activePriority);
            return this.setData(activePriority ? this.priorityArray.getDataAtPriority(activePriority) : this.relinquishDefault.getData());
        }

        //If out of service is true, write directly to present value.
        return this.setData(data);
    }
}