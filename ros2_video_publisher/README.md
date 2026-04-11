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
