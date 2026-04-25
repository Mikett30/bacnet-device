import { type BDNumericObjectOpts, BDNumericObject } from './numeric.ts';
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDPositiveIntegerValue extends BDNumericObject<ApplicationTag.UNSIGNED_INTEGER> {
  constructor(opts: BDNumericObjectOpts) {
    super(ObjectType.POSITIVE_INTEGER_VALUE, ApplicationTag.UNSIGNED_INTEGER, opts);
  }
}
