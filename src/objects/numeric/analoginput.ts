import { ApplicationTag, ObjectType } from '@bacnet-js/client';
import { type BDNumericObjectOpts, BDNumericObject } from './numeric.ts';

/**
 * Implements a BACnet Analog Input object
 *
 * The Analog Input object represents a physical or virtual analog input source such as a
 * temperature sensor, pressure sensor, or other analog measurement device. This object
 * type provides a standard way to represent analog inputs in BACnet systems.
 *
 * Required properties according to the BACnet specification:
 * - Object_Identifier (automatically added by BACnetObject)
 * - Object_Name (automatically added by BACnetObject)
 * - Object_Type (automatically added by BACnetObject)
 * - Present_Value (read-only unless Out_Of_Service is true)
 * - Status_Flags
 * - Event_State
 * - Out_Of_Service
 * - Units
 * - Reliability (optional but commonly included)
 *
 * @extends BDObject
 */
export class BDAnalogInput extends BDNumericObject<ApplicationTag.REAL | ApplicationTag.NULL> {
  /**
   * Creates a new BACnet Analog Input object
   */
  constructor(opts: BDNumericObjectOpts) {
    super(ObjectType.ANALOG_INPUT, ApplicationTag.REAL | ApplicationTag.NULL, opts);
  }
}
