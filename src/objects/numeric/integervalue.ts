
import {
  type BDNumericValueOpts,
  BDNumericObject,
} from './numeric.ts';

import {
  ApplicationTag,
  ObjectType,
} from '@bacnet-js/client';

export interface BDIntegerValueOpts extends Omit<BDNumericValueOpts, 'maxPresentValue' | 'minPresentValue' | 'presentValue'> {
  presentValue?: number;
  maxPresentValue?: number;
  minPresentValue?: number;
}

export class BDIntegerValue extends BDNumericObject<ApplicationTag.SIGNED_INTEGER> {
  constructor(opts: BDIntegerValueOpts) {
    super(ObjectType.INTEGER_VALUE, ApplicationTag.SIGNED_INTEGER, {
      ...opts,
      presentValue: opts.presentValue ?? 0,
      maxPresentValue: Math.min(opts.maxPresentValue ?? Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
      minPresentValue: Math.max(opts.minPresentValue ?? Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER),
    });
  }
}
