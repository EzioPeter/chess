from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import cv2
from ament_index_python.packages import PackageNotFoundError, get_package_share_directory
from cv_bridge import CvBridge
import rclpy
from rclpy._rclpy_pybind11 import RCLError
from rclpy.executors import ExternalShutdownException
from rclpy.node import Node
from sensor_msgs.msg import Image


PACKAGE_NAME = "chess_video_publisher"


@dataclass(frozen=True)
class StreamConfig:
    name: str
    topic: str
    frame_id: str
    video_path: Path
    fps_override: float


class VideoStream:
    def __init__(
        self,
        node: Node,
        bridge: CvBridge,
        config: StreamConfig,
        loop: bool,
        queue_size: int,
    ) -> None:
        self._node = node
        self._bridge = bridge
        self._config = config
        self._loop = loop
        self._timer = None
        self._publisher = node.create_publisher(Image, config.topic, queue_size)
        self._capture = cv2.VideoCapture(str(config.video_path))

        if not self._capture.isOpened():
            raise RuntimeError(f"cannot open {config.video_path}")

        video_fps = float(self._capture.get(cv2.CAP_PROP_FPS) or 0.0)
        self._fps = config.fps_override if config.fps_override > 0.0 else video_fps
        if self._fps <= 0.0:
            self._fps = 30.0

        self._timer = node.create_timer(1.0 / self._fps, self._publish_next_frame)
        node.get_logger().info(
            f"{config.name}: publishing {config.video_path} -> {config.topic} "
            f"at {self._fps:.2f} FPS"
        )

    def release(self) -> None:
        if self._timer is not None:
            self._timer.cancel()
        self._capture.release()

    def _publish_next_frame(self) -> None:
        ok, frame = self._capture.read()

        if not ok:
            if self._loop:
                self._capture.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ok, frame = self._capture.read()

            if not ok:
                self._node.get_logger().warning(
                    f"{self._config.name}: no more frames; stopping publisher"
                )
                if self._timer is not None:
                    self._timer.cancel()
                return

        msg = self._bridge.cv2_to_imgmsg(frame, encoding="bgr8")
        msg.header.stamp = self._node.get_clock().now().to_msg()
        msg.header.frame_id = self._config.frame_id
        try:
            self._publisher.publish(msg)
        except RCLError as exc:
            if not rclpy.ok() or "context is invalid" in str(exc):
                return
            raise


class TestVideoPublisher(Node):
    def __init__(self) -> None:
        super().__init__("test_video_publisher")

        self.declare_parameter("loop", True)
        self.declare_parameter("queue_size", 10)

        self.declare_parameter("red.video_path", "")
        self.declare_parameter("red.topic", "/red/image_raw")
        self.declare_parameter("red.frame_id", "red_camera")
        self.declare_parameter("red.fps", 0.0)

        self.declare_parameter("black.video_path", "")
        self.declare_parameter("black.topic", "/black/image_raw")
        self.declare_parameter("black.frame_id", "black_camera")
        self.declare_parameter("black.fps", 0.0)

        loop = bool(self.get_parameter("loop").value)
        queue_size = int(self.get_parameter("queue_size").value)
        self._bridge = CvBridge()
        self._streams = [
            VideoStream(
                self,
                self._bridge,
                self._stream_config("red", "red.mp4"),
                loop=loop,
                queue_size=queue_size,
            ),
            VideoStream(
                self,
                self._bridge,
                self._stream_config("black", "black.mp4"),
                loop=loop,
                queue_size=queue_size,
            ),
        ]

    def destroy_node(self) -> bool:
        for stream in getattr(self, "_streams", []):
            stream.release()
        return super().destroy_node()

    def _stream_config(self, name: str, default_filename: str) -> StreamConfig:
        configured_path = str(self.get_parameter(f"{name}.video_path").value).strip()
        video_path = (
            Path(configured_path).expanduser()
            if configured_path
            else self._find_default_video(default_filename)
        )
        video_path = video_path.resolve()

        if not video_path.exists():
            raise RuntimeError(
                f"{name}: video file does not exist: {video_path}. "
                f"Set --ros-args -p {name}.video_path:=/absolute/path/to/video.mp4"
            )

        return StreamConfig(
            name=name,
            topic=str(self.get_parameter(f"{name}.topic").value),
            frame_id=str(self.get_parameter(f"{name}.frame_id").value),
            video_path=video_path,
            fps_override=float(self.get_parameter(f"{name}.fps").value),
        )

    def _find_default_video(self, filename: str) -> Path:
        candidates = [
            Path.cwd() / "test_videos" / filename,
            Path.cwd().parent / "test_videos" / filename,
        ]

        try:
            share_dir = Path(get_package_share_directory(PACKAGE_NAME))
            candidates.append(share_dir / "test_videos" / filename)
        except PackageNotFoundError:
            pass

        source_root = Path(__file__).resolve()
        candidates.extend(parent / "test_videos" / filename for parent in source_root.parents)

        for path in candidates:
            if path.exists():
                return path

        return candidates[0]


def main(args: Optional[list[str]] = None) -> None:
    rclpy.init(args=args)
    node: Optional[TestVideoPublisher] = None
    try:
        node = TestVideoPublisher()
        rclpy.spin(node)
    except (KeyboardInterrupt, ExternalShutdownException):
        pass
    finally:
        if node is not None:
            node.destroy_node()
        if rclpy.ok():
            rclpy.shutdown()


if __name__ == "__main__":
    main()
