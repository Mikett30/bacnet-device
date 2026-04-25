import { type BDNumericObjectOpts, BDNumericObject } from './numeric.ts';
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDAnalogValue extends BDNumericObject<ApplicationTag.REAL> {
  constructor(opts: BDNumericObjectOpts) {
    super(ObjectType.ANALOG_VALUE, ApplicationTag.REAL, opts);
  }
}
