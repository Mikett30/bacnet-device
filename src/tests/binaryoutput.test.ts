import { it, describe, beforeEach, afterEach } from 'node:test';
import { deepStrictEqual, rejects } from 'node:assert';
import { BDDevice } from '../objects/device/device.js';
import { bsReadProperty, bsWriteProperty } from './bacnet-stack-client.js';
import { BDBinaryOutput } from '../objects/binary/binaryoutput.js';
import { ApplicationTag, BinaryPV, ObjectType, PropertyIdentifier } from '@bacnet-js/client';

describe('BinaryOutput', () => {
  let device: BDDevice;

  beforeEach(async () => {
    device = new BDDevice(1, {
      name: 'Test Device',
    });

    device.on('error', console.error);
    device.addObject(new BDBinaryOutput({
      name: 'Test BO',
      writable: true,
      presentValue: BinaryPV.INACTIVE,
      relinquishDefault: BinaryPV.ACTIVE,
      activeText: 'On',
      inactiveText: 'Off',
    }));
  });

  afterEach(async () => {
    device.destroy();
  });

  it('should read Present_Value as relinquish default when all priorities are null', async () => {
    const value = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'active');
  });

  it('should arbitrate Present_Value by priority and fall back on release', async () => {
    await bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE, 10, ApplicationTag.ENUMERATED, BinaryPV.INACTIVE);

    let value = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'inactive');

    let priority = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.CURRENT_COMMAND_PRIORITY);
    deepStrictEqual(parseInt(priority.trim()), 10);

    await bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE, 8, ApplicationTag.ENUMERATED, BinaryPV.ACTIVE);

    value = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'active');

    priority = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.CURRENT_COMMAND_PRIORITY);
    deepStrictEqual(parseInt(priority.trim()), 8);

    await bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE, 8, ApplicationTag.NULL, 0);

    value = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'inactive');

    priority = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.CURRENT_COMMAND_PRIORITY);
    deepStrictEqual(parseInt(priority.trim()), 10);

    const priority8 = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRIORITY_ARRAY, 8);
    deepStrictEqual(priority8.trim(), 'Null');

    await bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE, 10, ApplicationTag.NULL, 0);

    value = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(value.trim(), 'active');

    priority = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.CURRENT_COMMAND_PRIORITY);
    deepStrictEqual(priority.trim(), 'Null');
  });

  it('should reject non BinaryPV enum values', async () => {
    await rejects(
      bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE, 16, ApplicationTag.ENUMERATED, 5),
      /out of range|error/i,
    );
  });

  it('should recalculate Present_Value when Relinquish_Default changes and no priorities are active', async () => {
    await bsWriteProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.RELINQUISH_DEFAULT, 16, ApplicationTag.ENUMERATED, BinaryPV.INACTIVE);

    const presentValue = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.PRESENT_VALUE);
    deepStrictEqual(presentValue.trim(), 'inactive');

    const currentPriority = await bsReadProperty(1, ObjectType.BINARY_OUTPUT, 1, PropertyIdentifier.CURRENT_COMMAND_PRIORITY);
    deepStrictEqual(currentPriority.trim(), 'Null');
  });
});
