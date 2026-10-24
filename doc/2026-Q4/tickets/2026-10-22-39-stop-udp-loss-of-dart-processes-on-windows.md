# 39: Stop the UDP loss of Dart processes on Windows

Status: planned 2026-10-22 as a follow-up of ticket 38 (Make all repos run
on Windows).

## Goal

Network MIDI of `aud_midi_network` (AppleMIDI, Network MIDI 2.0) delivers
every datagram on Windows. On the development machine of ticket 38 a Dart
process loses most UDP datagrams it sends on loopback: of 200, between 1
and 52 arrive. A session sends bursts all the time — the notes of a chord,
the commands of a journal — so peers miss notes and note offs.

## What ticket 38 measured

- dart:io `RawDatagramSocket.send` and direct Winsock calls through FFI
  (`sendto`) lose alike; `send` reports every datagram as sent.
- The loss does not depend on the rate: paced at 1 ms per datagram, 12 of
  200 arrived. Nor on the payload size or `SO_SNDBUF`/`SO_RCVBUF`.
- A C program with the same Winsock calls loses nothing (200 of 200), also
  when it runs as `dart.exe` or `dartvm.exe`; so does .NET.
- The loss happens outside the agent's sandbox too, in the user's terminal.
- There is no QoS policy, and the firewall only allows `dartvm.exe`.

The cause lies between the Dart VM process and the network stack of that
machine; whether other Windows machines show it is open.

## Requirements

None yet: a bug ticket. Its Goal describes the bug.

## Affected repos

- `aud_midi_network`: the fix, and the tests that ticket 38 marked to skip
  on Windows (see below).
- `aud_audio_pm`: this plan.

## Steps

1. Reproduce on a second Windows machine and on a clean Windows install,
   with the probes of ticket 38 (a Dart FFI sender, a C receiver).
2. Find what the Dart VM process changes: loaded DLLs and WFP filters
   (`netsh wfp show filters`), the process mitigation policies, a
   repro with `dart compile exe`.
3. Report the result to dart-lang/sdk with the probes.
4. If the loss stays for Dart processes: send through a native thread of
   a small C shim built by a hook, as `aud_midi_windows` builds its shim.
5. Remove the Windows skips of the tests below.

## Tests skipped on Windows until then

- `test/apple_midi/midi_apple_midi_session_test.dart`: datagrams ignore
  what is no session command and adopt data ports
- `test/midi2/midi_network_midi2_session_test.dart`: peers without session
  get stateless answers; under loss repairs loss with error correction and
  retransmission
- `test/testing/midi_lossy_udp_proxy_test.dart`: impairment loses and
  duplicates datagrams; blocked, dropWhere drop datagrams
- `test/discovery/midi_network_browser_test.dart`: browses the real
  network — a second fault: `joinMulticast` of `multicast_dns` fails on
  Windows with WSAENOPROTOOPT (10042).

## Open questions

- Does the loss occur on other Windows machines, or only on this one?
- Does discovery on Windows use `multicast_dns` at all, or the DNS-SD API
  of Windows that `aud_midi_windows` already uses for advertising?
