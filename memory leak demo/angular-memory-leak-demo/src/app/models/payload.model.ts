/**
 * Identifiable payload classes for memory leak demonstration and profiling.
 * 
 * In Chrome DevTools Heap Snapshot, searching for these class names
 * ('LeakedPayload' vs 'CleanPayload') in the Class Filter allows immediate,
 * unambiguous inspection of whether destroyed component instances are retained in memory.
 */

export class LeakedPayload {
  public readonly marker = 'RETAINED_LEAKED_PAYLOAD_MARKER';
  public readonly instanceId: number;
  public readonly createdAt: string;
  public readonly buffer: string[];

  constructor(instanceId: number) {
    this.instanceId = instanceId;
    this.createdAt = new Date().toISOString();
    // Pre-allocate a recognizable array (~150 KB) so it shows distinct memory weight
    // without risking browser sluggishness or freezing.
    this.buffer = new Array(3000).fill(
      `LeakedInstance_${instanceId}_BufferData_String_Marker_Payload_` + 'A'.repeat(30)
    );
  }
}

export class CleanPayload {
  public readonly marker = 'RECLAIMABLE_CLEAN_PAYLOAD_MARKER';
  public readonly instanceId: number;
  public readonly createdAt: string;
  public readonly buffer: string[];

  constructor(instanceId: number) {
    this.instanceId = instanceId;
    this.createdAt = new Date().toISOString();
    // Same memory allocation weight as LeakedPayload for a 100% fair comparison
    this.buffer = new Array(3000).fill(
      `CleanInstance_${instanceId}_BufferData_String_Marker_Payload_` + 'A'.repeat(30)
    );
  }
}
