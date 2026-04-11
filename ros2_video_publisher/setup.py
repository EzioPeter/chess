from glob import glob
from pathlib import Path

from setuptools import find_packages, setup

package_name = "chess_video_publisher"
package_root = Path(__file__).resolve().parent
repo_root = package_root.parent

video_files = [
    str(Path("..") / "test_videos" / filename)
    for filename in ("red.mp4", "black.mp4")
    if (repo_root / "test_videos" / filename).exists()
]

setup(
    name=package_name,
    version="0.1.0",
    packages=find_packages(exclude=["test"]),
    data_files=[
        ("share/ament_index/resource_index/packages", [f"resource/{package_name}"]),
        (f"share/{package_name}", ["package.xml", "requirements-yolo.txt"]),
        (f"share/{package_name}/launch", glob("launch/*.launch.py")),
        (f"share/{package_name}/config", glob("config/*.json")),
        (f"share/{package_name}/test_videos", video_files),
    ],
    install_requires=["setuptools"],
    zip_safe=True,
    maintainer="xjy",
    maintainer_email="xjy@example.com",
    description="Publishes the red and black test videos as ROS2 Image streams.",
    license="MIT",
    tests_require=["pytest"],
    entry_points={
        "console_scripts": [
            "video_stream_publisher = chess_video_publisher.video_stream_publisher:main",
            "red_yolo_bridge = chess_video_publisher.red_yolo_bridge:main",
        ],
    },
)
