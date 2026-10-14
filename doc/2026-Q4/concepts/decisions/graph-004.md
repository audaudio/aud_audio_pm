# graph-004: The engine keeps a load gauge over its last renders

- Status: accepted
- Date: 2026-10-14
- Canonical source: tickets/2026-10-13-29-limit-the-voices-by-the-cpu-power-of-the-device.md
  (scope 3)
- Open work: the share is the render of the graph; the callback around it
  (the split into renders, the stream's own work) is not in it

## Decision

The graph records the share of its block each live render took — the
render time over the duration of the frames at the prepared rate — in a
lock-free ring of the last 1024 renders on the audio thread: one 64-bit
atomic per slot with the share, the frames and a tag of the render's
index, so that a reader detects a slot the writer overwrote without a
lock. `aud_graph_render_load` / `AudGraph.renderLoad(window)` return the
mean (weighted by the frames), the nearest-rank p99 and the maximum over a
window of time (one second by default) and the live renders and overloads
since the graph was created, and the p99, the maximum and the overloads of
the runs of renders that fill the device buffer: a render and the older
ones before it whose frames reach the buffer, since a stream whose buffer
holds several renders drops out only when such a run takes longer than it
lasts. Offline renders are not recorded. The gauge
is apart from the statistics: `resetStats` does not touch it, so
measurements that reset the stats and a governor that reads the gauge do
not disturb each other.

## Why

- A governor needs the load of the last second, not the mean since the
  last reset, and the p99, which a sum and a maximum cannot give.
- The ring costs one atomic store per render and no allocation on the
  audio thread; the reader sorts on its own thread.
