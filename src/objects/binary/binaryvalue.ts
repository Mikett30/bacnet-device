import { BDBinaryObject, type BDBinaryObjectOpts } from './binary.ts';
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDBinaryValue extends BDBinaryObject<ApplicationTag.BOOLEAN | ApplicationTag.NULL> {
  constructor(opts: BDBinaryObjectOpts) {
    super(ObjectType.BINARY_VALUE, ApplicationTag.BOOLEAN | ApplicationTag.NULL, opts);
  }
}
