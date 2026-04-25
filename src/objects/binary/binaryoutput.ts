import { BDBinaryObject, type BDBinaryObjectOpts } from './binary.ts';
import { ApplicationTag, ObjectType } from '@bacnet-js/client';

export class BDBinaryOutput extends BDBinaryObject<ApplicationTag.BOOLEAN | ApplicationTag.NULL> {
  constructor(opts: BDBinaryObjectOpts) {
    super(ObjectType.BINARY_OUTPUT, ApplicationTag.BOOLEAN | ApplicationTag.NULL, opts);
  }
}
