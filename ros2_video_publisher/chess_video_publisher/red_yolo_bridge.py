import base64
import json
import time
from pathlib import Path
from typing import Any, Optional

import cv2
from cv_bridge import CvBridge
import rclpy
from rclpy.executors import ExternalShutdownException
from rclpy.node import Node
from rclpy.qos import qos_profile_sensor_data
from sensor_msgs.msg import Image
from std_msgs.msg import String

try:
    from ultralytics import YOLO
except ModuleNotFoundError:
    YOLO = None

try:
    import requests
except ModuleNotFoundError:
    requests = None


class RedImageYoloBridge(Node):
    def __init__(self) -> None:
        super().__init__("red_image_yolo_bridge")

        self.declare_parameter("image_topic", "/red/image_raw")
        self.declare_parameter("model", "yolov8n.pt")
        self.declare_parameter("device", "")
        self.declare_parameter("imgsz", 640)
        self.declare_parameter("conf", 0.45)
        self.declare_parameter("iou", 0.45)
        self.declare_parameter("max_fps", 5.0)
        self.declare_parameter("ui_base_url", "http://127.0.0.1:3000")
        self.declare_parameter("include_image", True)
        self.declare_parameter("jpeg_quality", 72)
        self.declare_parameter("publish_annotated", True)
        self.declare_parameter("annotated_topic", "/red/yolo_annotated")
        self.declare_parameter("detections_topic", "/red/yolo_detections")
        self.declare_parameter("command_side", "red")
        self.declare_parameter("command_map_json", "{}")
        self.declare_parameter("command_map_path", "")
        self.declare_parameter("stable_frames", 3)
        self.declare_parameter("command_cooldown_sec", 2.0)
        self.declare_parameter("http_timeout_sec", 0.8)

        if YOLO is None:
            raise RuntimeError(
                "缺少 ultralytics。请先安装：python3 -m pip install ultralytics"
            )
        if requests is None:
            raise RuntimeError("缺少 requests。请先安装：python3 -m pip install requests")

        self._bridge = CvBridge()
        self._latest_frame = None
        self._latest_stamp = None
        self._latest_frame_id = ""
        self._last_inference_at = 0.0
        self._last_warning_at = 0.0
        self._stable_label = None
        self._stable_count = 0
        self._last_command_key = None
        self._last_command_at = 0.0
        self._sequence = 0

        self._image_topic = str(self.get_parameter("image_topic").value)
        self._model_path = str(self.get_parameter("model").value)
        self._device = str(self.get_parameter("device").value).strip()
        self._imgsz = int(self.get_parameter("imgsz").value)
        self._conf = float(self.get_parameter("conf").value)
        self._iou = float(self.get_parameter("iou").value)
        self._max_fps = max(0.1, float(self.get_parameter("max_fps").value))
        self._ui_base_url = str(self.get_parameter("ui_base_url").value).rstrip("/")
        self._include_image = bool(self.get_parameter("include_image").value)
        self._jpeg_quality = max(20, min(95, int(self.get_parameter("jpeg_quality").value)))
        self._publish_annotated = bool(self.get_parameter("publish_annotated").value)
        self._command_side = str(self.get_parameter("command_side").value)
        self._stable_frames = max(1, int(self.get_parameter("stable_frames").value))
        self._command_cooldown_sec = max(
            0.0,
            float(self.get_parameter("command_cooldown_sec").value),
        )
        self._http_timeout_sec = max(0.1, float(self.get_parameter("http_timeout_sec").value))
        self._command_map = self._load_command_map()

        self._session = requests.Session()
        self._model = YOLO(self._model_path)

        self._detections_pub = self.create_publisher(
            String,
            str(self.get_parameter("detections_topic").value),
            10,
        )
        self._annotated_pub = (
            self.create_publisher(
                Image,
                str(self.get_parameter("annotated_topic").value),
                10,
            )
            if self._publish_annotated
            else None
        )

        self.create_subscription(
            Image,
            self._image_topic,
            self._handle_image,
            qos_profile_sensor_data,
        )
        self.create_timer(1.0 / self._max_fps, self._run_inference)

        self.get_logger().info(
            f"YOLO bridge listening on {self._image_topic}; "
            f"model={self._model_path}; ui={self._ui_base_url}"
        )

    def _load_command_map(self) -> dict[str, Any]:
        command_map: dict[str, Any] = {}
        raw_json = str(self.get_parameter("command_map_json").value).strip()
        map_path = str(self.get_parameter("command_map_path").value).strip()

        if raw_json and raw_json != "{}":
            try:
                parsed = json.loads(raw_json)
                if isinstance(parsed, dict):
                    command_map.update(parsed)
                else:
                    raise ValueError("command_map_json 必须是 JSON object")
            except Exception as exc:
                raise RuntimeError(f"无法解析 command_map_json: {exc}") from exc

        if map_path:
            try:
                parsed = json.loads(Path(map_path).expanduser().read_text(encoding="utf8"))
                if isinstance(parsed, dict):
                    command_map.update(parsed)
                else:
                    raise ValueError("command_map_path 指向的文件必须是 JSON object")
            except Exception as exc:
                raise RuntimeError(f"无法读取 command_map_path={map_path}: {exc}") from exc

        return command_map

    def _handle_image(self, msg: Image) -> None:
        try:
            self._latest_frame = self._bridge.imgmsg_to_cv2(msg, desired_encoding="bgr8")
            self._latest_stamp = msg.header.stamp
            self._latest_frame_id = msg.header.frame_id
        except Exception as exc:
            self._warn_throttled(f"Image 转 OpenCV 失败: {exc}")

    def _run_inference(self) -> None:
        if self._latest_frame is None:
            return

        now = time.monotonic()
        if now - self._last_inference_at < 1.0 / self._max_fps:
            return
        self._last_inference_at = now

        frame = self._latest_frame.copy()
        try:
            result = self._model.predict(
                frame,
                imgsz=self._imgsz,
                conf=self._conf,
                iou=self._iou,
                device=self._device or None,
                verbose=False,
            )[0]
        except Exception as exc:
            self._warn_throttled(f"YOLO 推理失败: {exc}")
            return

        detections = self._extract_detections(result)
        top_detection = detections[0] if detections else None
        command = self._command_for_top_detection(top_detection)

        annotated = result.plot() if self._include_image or self._annotated_pub else None
        payload = self._build_payload(detections, top_detection, command, annotated)

        self._publish_detection_json(payload)
        if annotated is not None and self._annotated_pub is not None:
            self._publish_annotated_image(annotated)

        self._post_yolo_payload(payload)

        if command is not None:
            sent = self._post_interface_command(command)
            payload["command_sent"] = sent
            if sent:
                self._post_yolo_payload(payload)

    def _extract_detections(self, result) -> list[dict[str, Any]]:
        detections = []
        names = result.names or {}
        boxes = result.boxes

        if boxes is None:
            return detections

        for box in boxes:
            class_id = int(box.cls[0].item())
            label = names.get(class_id, str(class_id)) if isinstance(names, dict) else str(class_id)
            confidence = float(box.conf[0].item())
            xyxy = [float(value) for value in box.xyxy[0].tolist()]
            detections.append(
                {
                    "class_id": class_id,
                    "label": label,
                    "confidence": confidence,
                    "bbox_xyxy": xyxy,
                }
            )

        detections.sort(key=lambda item: item["confidence"], reverse=True)
        return detections

    def _command_for_top_detection(
        self,
        top_detection: Optional[dict[str, Any]],
    ) -> Optional[dict[str, Any]]:
        if not top_detection:
            self._stable_label = None
            self._stable_count = 0
            return None

        label = str(top_detection["label"])
        if label == self._stable_label:
            self._stable_count += 1
        else:
            self._stable_label = label
            self._stable_count = 1

        if self._stable_count < self._stable_frames or label not in self._command_map:
            return None

        command = self._normalize_command(self._command_map[label])
        if command is None:
            return None

        key = json.dumps(command, ensure_ascii=False, sort_keys=True)
        now = time.monotonic()
        if key == self._last_command_key and now - self._last_command_at < self._command_cooldown_sec:
            return None

        self._last_command_key = key
        self._last_command_at = now
        return command

    def _normalize_command(self, value: Any) -> Optional[dict[str, Any]]:
        if isinstance(value, str):
            return {
                "type": "move",
                "side": self._command_side,
                "notation": value,
            }

        if not isinstance(value, dict):
            return None

        command_type = str(value.get("type", "move"))
        if command_type in ("reset", "prepare"):
            return {
                "type": command_type,
                "reset": value.get("reset", True) is not False,
            }

        if command_type == "move":
            notation = value.get("notation")
            if not notation:
                return None
            return {
                "type": "move",
                "side": value.get("side", self._command_side),
                "notation": str(notation),
            }

        return None

    def _build_payload(
        self,
        detections: list[dict[str, Any]],
        top_detection: Optional[dict[str, Any]],
        command: Optional[dict[str, Any]],
        annotated,
    ) -> dict[str, Any]:
        self._sequence += 1
        payload = {
            "sequence": self._sequence,
            "source_topic": self._image_topic,
            "frame_id": self._latest_frame_id,
            "stamp": {
                "sec": int(self._latest_stamp.sec) if self._latest_stamp else 0,
                "nanosec": int(self._latest_stamp.nanosec) if self._latest_stamp else 0,
            },
            "received_at": time.time(),
            "detections": detections[:20],
            "top_detection": top_detection,
            "stable_label": self._stable_label,
            "stable_count": self._stable_count,
            "command": command,
            "command_sent": False,
        }

        if self._include_image and annotated is not None:
            payload["annotated_jpeg"] = self._encode_jpeg(annotated)

        return payload

    def _encode_jpeg(self, frame) -> Optional[str]:
        ok, encoded = cv2.imencode(
            ".jpg",
            frame,
            [int(cv2.IMWRITE_JPEG_QUALITY), self._jpeg_quality],
        )
        if not ok:
            return None
        return base64.b64encode(encoded.tobytes()).decode("ascii")

    def _publish_detection_json(self, payload: dict[str, Any]) -> None:
        msg = String()
        msg.data = json.dumps(
            {key: value for key, value in payload.items() if key != "annotated_jpeg"},
            ensure_ascii=False,
        )
        self._detections_pub.publish(msg)

    def _publish_annotated_image(self, annotated) -> None:
        msg = self._bridge.cv2_to_imgmsg(annotated, encoding="bgr8")
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = self._latest_frame_id or "red_yolo"
        self._annotated_pub.publish(msg)

    def _post_yolo_payload(self, payload: dict[str, Any]) -> None:
        try:
            self._session.post(
                f"{self._ui_base_url}/api/yolo/detections",
                json=payload,
                timeout=self._http_timeout_sec,
            )
        except Exception as exc:
            self._warn_throttled(f"无法同步 YOLO 结果到网页: {exc}")

    def _post_interface_command(self, command: dict[str, Any]) -> bool:
        try:
            response = self._session.post(
                f"{self._ui_base_url}/api/interface/command",
                json=command,
                timeout=self._http_timeout_sec,
            )
            response.raise_for_status()
            self.get_logger().info(f"已投递网页命令: {command}")
            return True
        except Exception as exc:
            self._warn_throttled(f"网页命令投递失败: {exc}")
            return False

    def _warn_throttled(self, message: str, interval_sec: float = 5.0) -> None:
        now = time.monotonic()
        if now - self._last_warning_at >= interval_sec:
            self.get_logger().warning(message)
            self._last_warning_at = now


def main(args: Optional[list[str]] = None) -> None:
    rclpy.init(args=args)
    node: Optional[RedImageYoloBridge] = None
    try:
        node = RedImageYoloBridge()
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
