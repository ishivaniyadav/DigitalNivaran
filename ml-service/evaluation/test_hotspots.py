import sys
import os


BASE_DIR = os.path.dirname(
    os.path.dirname(
        os.path.abspath(__file__)
    )
)

sys.path.insert(
    0,
    BASE_DIR
)


from app.services.hotspot_service import (
    detect_hotspots
)


def main():

    complaints = [
        {
            "_id": "c1",
            "latitude": 28.45610,
            "longitude": 77.51210
        },
        {
            "_id": "c2",
            "latitude": 28.45620,
            "longitude": 77.51220
        },
        {
            "_id": "c3",
            "latitude": 28.45630,
            "longitude": 77.51215
        },
        {
            "_id": "c4",
            "latitude": 28.45625,
            "longitude": 77.51230
        },
        {
            "_id": "c5",
            "latitude": 28.45615,
            "longitude": 77.51225
        },

        {
            "_id": "c6",
            "latitude": 28.46010,
            "longitude": 77.52010
        },
        {
            "_id": "c7",
            "latitude": 28.46020,
            "longitude": 77.52020
        },
        {
            "_id": "c8",
            "latitude": 28.46030,
            "longitude": 77.52015
        },
        {
            "_id": "c9",
            "latitude": 28.46025,
            "longitude": 77.52030
        },
        {
            "_id": "c10",
            "latitude": 28.46015,
            "longitude": 77.52025
        }
    ]

    hotspots = detect_hotspots(
        complaints,
        eps_meters=100,
        min_samples=5
    )

    print("\nDBSCAN HOTSPOT TEST")
    print("-------------------")

    print(
        f"Detected hotspots: {len(hotspots)}"
    )

    for hotspot in hotspots:

        print(
            f"\nCluster ID: "
            f"{hotspot['cluster_id']}"
        )

        print(
            f"Complaint count: "
            f"{hotspot['complaint_count']}"
        )

        print(
            f"Center latitude: "
            f"{hotspot['center']['latitude']}"
        )

        print(
            f"Center longitude: "
            f"{hotspot['center']['longitude']}"
        )

    if len(hotspots) == 2:

        counts = sorted(
            hotspot["complaint_count"]
            for hotspot in hotspots
        )

        if counts == [5, 5]:
            print(
                "\nPASS: Two 5-complaint "
                "hotspots were detected."
            )
        else:
            print(
                "\nFAIL: Unexpected cluster sizes."
            )

    else:

        print(
            "\nFAIL: Expected 2 hotspots."
        )


if __name__ == "__main__":
    main()