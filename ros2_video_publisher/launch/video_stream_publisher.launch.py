from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    return LaunchDescription(
        [
            DeclareLaunchArgument("loop", default_value="true"),
            DeclareLaunchArgument("red_topic", default_value="/red/image_raw"),
            DeclareLaunchArgument("black_topic", default_value="/black/image_raw"),
            Node(
                package="chess_video_publisher",
                executable="video_stream_publisher",
                name="test_video_publisher",
                output="screen",
                parameters=[
                    {
                        "loop": ParameterValue(LaunchConfiguration("loop"), value_type=bool),
                        "red.topic": LaunchConfiguration("red_topic"),
                        "black.topic": LaunchConfiguration("black_topic"),
                    }
                ],
            ),
        ]
    )
