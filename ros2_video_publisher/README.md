# Chess Test Video ROS2 Publisher

This package publishes `test_videos/red.mp4` and `test_videos/black.mp4` as
ROS2 `sensor_msgs/Image` streams.

Default topics:

- `/red/image_raw`
- `/black/image_raw`

## Build

From `/home/xjy/entertainment/chess`:

```bash
colcon build --packages-select chess_video_publisher
source install/setup.bash
```

## Run

```bash
ros2 run chess_video_publisher video_stream_publisher
```

Or with the launch file:

```bash
ros2 launch chess_video_publisher video_stream_publisher.launch.py
```

## View Images

```bash
ros2 topic list
ros2 topic hz /red/image_raw
ros2 topic echo /red/image_raw --once
ros2 run rqt_image_view rqt_image_view
```

In `rqt_image_view`, choose `/red/image_raw` or `/black/image_raw`.

## YOLO Recognition From `/red/image_raw`

The package also includes a YOLO bridge node. It subscribes to `/red/image_raw`,
runs YOLO, publishes detections, and synchronizes the latest result to the web UI.
If a detected class is mapped to a Xiangqi notation command, it posts that command
to the web command queue so the browser can execute it.

Create the Python 3.12 conda runtime first. ROS2 Jazzy's Python extensions are
built for Python 3.12, so do not run this node from the older `yolo` Python 3.11
environment.

```bash
source ~/miniconda3/bin/activate
conda create -n ros2-yolo312 python=3.12.3 -y
conda activate ros2-yolo312
python -m pip install --upgrade pip
python -m pip install -r /home/xjy/entertainment/chess/ros2_video_publisher/requirements-yolo.txt
```

Verify that the conda Python can import both ROS2 and YOLO:

```bash
cd /home/xjy/entertainment/chess
source /opt/ros/jazzy/setup.bash
source ~/miniconda3/bin/activate ros2-yolo312
export PYTHONPATH=/home/xjy/entertainment/chess/ros2_video_publisher:$PYTHONPATH
PYTHONNOUSERSITE=1 python - <<'PY'
import rclpy, cv_bridge, sensor_msgs, std_msgs
import ultralytics, torch, cv2, requests
print("ROS2 + YOLO imports ok")
PY
```

Start the web bridge:

```bash
cd /home/xjy/entertainment/chess/ui
node server.js
```

Start the video publisher:

```bash
cd /home/xjy/entertainment/chess
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 run chess_video_publisher video_stream_publisher
```

Start YOLO on `/red/image_raw`. For this conda path, run the module with
`python -m` instead of `ros2 run`, because the installed ROS2 console script uses
`/usr/bin/python3`.

```bash
cd /home/xjy/entertainment/chess
source /opt/ros/jazzy/setup.bash
source ~/miniconda3/bin/activate ros2-yolo312
export PYTHONPATH=/home/xjy/entertainment/chess/ros2_video_publisher:$PYTHONPATH
PYTHONNOUSERSITE=1 python -m chess_video_publisher.red_yolo_bridge --ros-args \
  -p image_topic:=/red/image_raw \
  -p model:=yolov8n.pt \
  -p ui_base_url:=http://127.0.0.1:3000 \
  -p command_map_path:=/home/xjy/entertainment/chess/ros2_video_publisher/config/red_yolo_commands.example.json
```

If you later use a trained custom model, replace `model:=yolov8n.pt` with its
absolute path. The launch file still works for system-Python deployments:

```bash
ros2 launch chess_video_publisher red_yolo_bridge.launch.py \
  model:=/absolute/path/to/your_yolo_model.pt \
  command_map_path:=/home/xjy/entertainment/chess/ros2_video_publisher/config/red_yolo_commands.example.json
```

Open the page:

```bash
xdg-open http://127.0.0.1:3000
```

The web page polls `/api/yolo/latest` and shows the annotated YOLO frame plus
detections. Top-level pages also consume `/api/interface/commands`, so mapped
YOLO detections can drive the board directly.

ROS debug topics:

```bash
ros2 topic echo /red/yolo_detections
ros2 run rqt_image_view rqt_image_view /red/yolo_annotated
```

Command mapping file format:

```json
{
  "bing_san_jin_yi": {
    "type": "move",
    "side": "red",
    "notation": "兵三进一"
  },
  "reset_board": {
    "type": "reset",
    "reset": true
  }
}
```

## Useful Parameters

```bash
ros2 run chess_video_publisher video_stream_publisher --ros-args \
  -p red.topic:=/camera/red/image_raw \
  -p black.topic:=/camera/black/image_raw \
  -p red.fps:=30.0 \
  -p black.fps:=30.0 \
  -p loop:=true
```

Use custom video paths:

```bash
ros2 run chess_video_publisher video_stream_publisher --ros-args \
  -p red.video_path:=/absolute/path/to/red.mp4 \
  -p black.video_path:=/absolute/path/to/black.mp4
```
