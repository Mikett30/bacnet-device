import { it, describe, beforeEach, afterEach } from 'node:test';
import { deepStrictEqual, rejects } from 'node:assert';
import { BDDevice } from '../objects/device/device.js';
import { bsReadProperty, bsWriteProperty } from './bacnet-stack-client.js';
import { BDBinaryInput } from '../objects/binary/binaryinput.js';
import { ApplicationTag, BinaryPV, ObjectType, PropertyIdentifier } from '@bacnet-js/client';

describe('BinaryInput', () => {
  let device: BDDevice;

  beforeEach(async () => {
    device = new BDDevice(1, {
      name: 'Test Device',
    });

    device.on('error', console.error);
    device.addObject(new BDBinaryInput({
      name: 'Test BI',
      writable: {
        PRESENT_VALUE: true,
        OUT_OF_SERVICE: true,
      },
      presentValue: BinaryPV.INACTIVE,
      activeText: 'Occupied',
      inactiveText: 'Unoccupied',
    }));
  });

  afterEach(async () => {
    device.destroy();
  });

  it('should read initial Present_Value', async () => {
    const value = await bsReadProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'inactive');
  });

  it('should reject Present_Value writes while Out_Of_Service is FALSE', async () => {
    await rejects(
      bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE, 16, ApplicationTag.ENUMERATED, BinaryPV.ACTIVE),
      /write access denied|input is not out of service|error/i,
    );
  });

  it('should allow Present_Value writes while Out_Of_Service is TRUE', async () => {
    await bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.OUT_OF_SERVICE, 16, ApplicationTag.BOOLEAN, 1);
    await bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE, 16, ApplicationTag.ENUMERATED, BinaryPV.ACTIVE);

    const value = await bsReadProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'active');
  });

  it('should reject null writes to Present_Value while Out_Of_Service is TRUE', async () => {
    await bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.OUT_OF_SERVICE, 16, ApplicationTag.BOOLEAN, 1);

    await rejects(
      bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE, 16, ApplicationTag.NULL, 0),
      /cannot write null value|write access denied|error/i,
    );
  });

  it('should reject non BinaryPV enum values', async () => {
    await bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.OUT_OF_SERVICE, 16, ApplicationTag.BOOLEAN, 1);

    await rejects(
      bsWriteProperty(1, ObjectType.BINARY_INPUT, 1, PropertyIdentifier.PRESENT_VALUE, 16, ApplicationTag.ENUMERATED, 7),
      /out of range|error/i,
    );
  });
});
