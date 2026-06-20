import { type BDNumericObjectOpts, BDNumericObject } from './numeric.ts';
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDIntegerValue extends BDNumericObject<ApplicationTag.SIGNED_INTEGER> {
  constructor(opts: BDNumericObjectOpts) {
    super(ObjectType.INTEGER_VALUE, ApplicationTag.SIGNED_INTEGER, opts);
  }
}
