# Chapter 34 — Files, Storage, and the I/O Path

> **Part VIII — A Complete System**

## When is a file write durable?

Chapter 33 separated acceptance from completion. Regular-file I/O adds another boundary: persistence after a crash or power loss. A byte copied into a kernel buffer can be available to subsequent reads long before storage makes it durable.

Consider an ordinary buffered write to an already open regular file. The virtual filesystem layer dispatches the request to the filesystem. Data is copied into the page cache, memory caching file contents, and relevant pages are marked dirty. Writeback later produces storage requests through the filesystem and block stack. Not every write uses this path: device files, direct I/O, and other modes have different contracts.

## Trace one byte through storage

Suppose an application's byte at file offset 100 changes from `0x41` to `0x42`.

| Boundary | Page-cache value | Durable storage value | What is established |
| --- | --- | --- | --- |
| Before write | `41` or uncached | `41` | old file content |
| Buffered write accepted | `42`, dirty | may remain `41` | new data accepted in memory |
| Writeback submitted | `42` | completion pending | storage work requested |
| Required persistence operations complete successfully | `42` | `42` under the storage contract | requested synchronization established |

A read through the file cache can return `42` at the second row. That successful read does not prove power-loss persistence. Likewise, an I/O completion may need to account for a device's volatile write cache and the filesystem's durability protocol before the stronger guarantee is satisfied.

fsync asks the system to synchronize the file's data and required metadata under its documented contract. Applications must check its result: errors can be reported later than the initial write. Close is not a general substitute for explicit durability synchronization.

## File content and its name are different state

Suppose an application replaces a configuration file by writing a new temporary file and renaming it. The new file's bytes and the directory entry pointing to it are distinct persistent objects. A conceptual local-filesystem update sequence is:

```text
create temporary file in the target directory
write the full new contents, handling partial writes
fsync the temporary file; check success
rename it over the old name; check success
fsync the containing directory; check success
```

This pattern addresses file contents and the namespace update separately, under a filesystem supporting the required operations and guarantees. It does not excuse ignoring any return value, cross-filesystem rename rules, or the application's own concurrency protocol.

If a crash occurs before the rename, the old name can still refer to the old file even though the temporary file's data was synchronized. If it occurs after rename but before directory synchronization, the application has not yet completed the full intended persistence sequence. Reason at each boundary rather than assuming a printed "save complete" message describes storage reality.

## The storage stack still reaches a device

Below the filesystem, requests may be queued, merged, and transferred using DMA. Chapter 32's buffer-lifetime and completion rules apply inside that lower path. The filesystem also manages metadata and ordering relationships that an isolated raw DMA transfer does not capture.

This is why diagnosing lost data requires more than observing the block device once. Determine whether the application requested durability, whether every relevant call succeeded, which file and directory were synchronized, and what guarantees the filesystem, device, and backing platform provide. A faulty device or a remote filesystem can change the investigation, but should not be asserted as the cause without evidence.

Chapter 35 follows an input event in the opposite direction, from a physical action through the kernel to an application. Both paths require distinguishing intermediate acceptance from the user's final observation.

## Check

1. A buffered write succeeds and a subsequent cached read returns the new byte. What is proven?
   - A) The read path can observe the new data.
   - B) Sudden power loss cannot lose the new data.
   - C) The containing directory was synchronized.
   - Answer: A
   - Explanation: Cached visibility does not by itself establish storage durability or namespace persistence.

2. Which must be considered for a durable replacement-file protocol? Select all that apply.
   - A) Partial writes and errors
   - B) File data synchronization
   - C) Persistence of the directory update
   - Answer: A, B, C
   - Explanation: All three represent distinct ways the intended update can remain incomplete.

3. Mark possible crash points in the replacement sequence. For each, state which operation completed and what you can conservatively claim about old and new data without inventing filesystem guarantees.

4. An application logs "saved" before checking fsync's result. Construct an execution where the log is misleading even though write returned the full byte count. Identify the evidence needed to diagnose it.

5. Research challenge: consult the write, fsync, and rename documentation for a chosen operating system/filesystem. Explain how directory synchronization and device write-cache behavior affect the intended failure model, and record any unsupported operations or guarantees.

## Limits

The main trace assumes ordinary buffered regular-file I/O. Direct I/O, network filesystems, journals, copy-on-write filesystems, and storage hardware have additional contracts. Durability must be argued for the chosen stack and failure model, with all relevant errors checked.

## Go Deeper

- [Linux VFS](https://docs.kernel.org/filesystems/vfs.html) — identify the filesystem operation boundaries.
- [Linux block-layer writeback cache control](https://docs.kernel.org/block/writeback_cache_control.html) — inspect flush and force-unit-access responsibilities.
- [Linux filesystem documentation](https://docs.kernel.org/filesystems/) — select the actual filesystem's guarantees for the research task.

## Related

- [Chapter 33 — Exposing Devices to Userspace](33_exposing_devices_to_userspace.md)
- [Chapter 35 — One Button Press, End to End](35_one_button_press_end_to_end.md)
