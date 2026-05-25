import { BDBinaryObject, type BDBinaryObjectOpts } from './binary.ts';
import { ApplicationTag, BinaryPV, ObjectType } from '@bacnet-js/client';

export class BDBinaryInput extends BDBinaryObject<ApplicationTag.ENUMERATED | ApplicationTag.NULL> {
  constructor(opts: BDBinaryObjectOpts<BinaryPV>) {
    super(ObjectType.BINARY_INPUT, ApplicationTag.ENUMERATED | ApplicationTag.NULL, opts);
  }
}
