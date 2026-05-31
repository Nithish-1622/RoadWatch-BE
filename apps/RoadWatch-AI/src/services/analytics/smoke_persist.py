"""Smoke test for analytics streaming + persistence.

Starts the background processor, publishes a couple of events, waits for
processing, then queries the local SQLite store for recent anomalies.
"""
import asyncio
from services.analytics import stream, storage


async def main():
    await stream.start_processor(workers=1)
    # publish a few events
    await stream.publish_event({"request_id": "evt1", "n": 100, "seed": 1})
    await stream.publish_event({"request_id": "evt2", "n": 100, "seed": 2})

    # give worker time to process
    await asyncio.sleep(1.0)

    rows = await asyncio.get_event_loop().run_in_executor(None, storage.get_recent, 10)
    print("Recent anomalies:")
    for r in rows:
        print(r)


if __name__ == "__main__":
    asyncio.run(main())
