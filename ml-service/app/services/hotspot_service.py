import numpy as np

from sklearn.cluster import DBSCAN


EARTH_RADIUS_METERS = 6371000


def detect_hotspots(
    complaints,
    eps_meters=100,
    min_samples=5
):
    if not complaints:
        return []


    coordinates = np.array([
        [
            complaint["latitude"],
            complaint["longitude"]
        ]
        for complaint in complaints
    ])


    coordinates_radians = np.radians(
        coordinates
    )


    eps_radians = (
        eps_meters / EARTH_RADIUS_METERS
    )


    dbscan = DBSCAN(
        eps=eps_radians,
        min_samples=min_samples,
        metric="haversine"
    )


    labels = dbscan.fit_predict(
        coordinates_radians
    )


    hotspots = []


    unique_labels = set(labels)


    for label in unique_labels:

        if label == -1:
            continue


        cluster_indexes = np.where(
            labels == label
        )[0]


        cluster_complaints = [
            complaints[index]
            for index in cluster_indexes
        ]


        center_latitude = float(
            np.mean(
                coordinates[
                    cluster_indexes,
                    0
                ]
            )
        )


        center_longitude = float(
            np.mean(
                coordinates[
                    cluster_indexes,
                    1
                ]
            )
        )


        hotspots.append({
            "cluster_id": int(label),

            "complaint_count": len(
                cluster_complaints
            ),

            "center": {
                "latitude":
                    center_latitude,

                "longitude":
                    center_longitude
            },

            "complaint_ids": [
                str(
                    complaint["_id"]
                )
                for complaint
                in cluster_complaints
            ]
        })


    hotspots.sort(
        key=lambda hotspot:
        hotspot["complaint_count"],
        reverse=True
    )


    return hotspots