
import { BDMultistateObject, type BDMultistateObjectOpts } from "./multistate.js";
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDMultiStateValue extends BDMultistateObject<ApplicationTag.UNSIGNED_INTEGER> {
  constructor(opts: BDMultistateObjectOpts) {    
    super(ObjectType.MULTI_STATE_VALUE, ApplicationTag.UNSIGNED_INTEGER, opts);
  }
}
