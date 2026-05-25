import { BDBinaryObject, type BDBinaryObjectOpts } from './binary.ts';
import { ApplicationTag, BinaryPV, ObjectType } from '@bacnet-js/client';

export class BDBinaryValue extends BDBinaryObject<ApplicationTag.ENUMERATED | ApplicationTag.NULL> {
  constructor(opts: BDBinaryObjectOpts<BinaryPV>) {
    super(ObjectType.BINARY_VALUE, ApplicationTag.ENUMERATED | ApplicationTag.NULL, opts);
  }
}
