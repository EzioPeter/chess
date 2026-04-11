from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    return LaunchDescription(
        [
            DeclareLaunchArgument("image_topic", default_value="/red/image_raw"),
            DeclareLaunchArgument("model", default_value="yolov8n.pt"),
            DeclareLaunchArgument("ui_base_url", default_value="http://127.0.0.1:3000"),
            DeclareLaunchArgument("command_map_path", default_value=""),
            DeclareLaunchArgument("max_fps", default_value="5.0"),
            DeclareLaunchArgument("conf", default_value="0.45"),
            Node(
                package="chess_video_publisher",
                executable="red_yolo_bridge",
                name="red_image_yolo_bridge",
                output="screen",
                parameters=[
                    {
                        "image_topic": LaunchConfiguration("image_topic"),
                        "model": LaunchConfiguration("model"),
                        "ui_base_url": LaunchConfiguration("ui_base_url"),
                        "command_map_path": LaunchConfiguration("command_map_path"),
                        "max_fps": ParameterValue(LaunchConfiguration("max_fps"), value_type=float),
                        "conf": ParameterValue(LaunchConfiguration("conf"), value_type=float),
                    }
                ],
            ),
        ]
    )
