import asyncio
from services.rag.service import analyze


async def main():
    res = await analyze({"text": "large pothole on Main Street"})
    print(res)


if __name__ == "__main__":
    asyncio.run(main())
