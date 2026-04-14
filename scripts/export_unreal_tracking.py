import unreal
import json
import os
import time
import math

# Configuration
DUMMY_OBJECT_NAMES = ["dummy_1", "dummy_2", "dummy_3", "dummy_4"]

# Make sure this matches the exact name of your camera in the Unreal Outliner
TARGET_CAMERA_NAME = "CineCameraActor360"

POINTS_TO_EXTRACT = {
    "A1": {"sequence": "/Game/circular_sequence/seq_A1A2.seq_A1A2", "extract_at": "start"},
    "A2": {"sequence": "/Game/circular_sequence/seq_A1A2.seq_A1A2", "extract_at": "end"},
    "A3": {"sequence": "/Game/circular_sequence/seq_A1A3.seq_A1A3", "extract_at": "end"},
    "A4": {"sequence": "/Game/circular_sequence/seq_A1A4.seq_A1A4", "extract_at": "end"}
}

OUTPUT_JSON_PATH = "C:/temp/unreal_tracking_data.json"

def get_actor_by_name(name):
    """Finds an actor in the current world by its name."""
    system = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
    actors = system.get_all_level_actors()
    for actor in actors:
        if actor.get_actor_label() == name:
            return actor
    return None

def extract_sequence_data():
    output_data = {}
    
    for point_name, config in POINTS_TO_EXTRACT.items():
        seq_path = config["sequence"]
        extract_at = config["extract_at"]
        unreal.log(f"Processing Point {point_name} from sequence: {seq_path}")
        
        sequence = unreal.EditorAssetLibrary.load_asset(seq_path)
        if not sequence:
            unreal.log_error(f"Failed to load sequence at {seq_path}")
            continue
            
        # FORCE close existing sequences before opening the new one
        # Otherwise Unreal viewport will stay stuck visualizing the first sequence!
        try:
            unreal.LevelSequenceEditorBlueprintLibrary.close_level_sequence()
        except:
            pass
            
        # Give the engine a tick to clear memory
        time.sleep(0.1)
        
        unreal.LevelSequenceEditorBlueprintLibrary.open_level_sequence(sequence)
        
        # Give the engine a tick to mount the new sequence bindings
        time.sleep(0.1)
        
        # Determine the time to extract based on 'start' or 'end'
        if extract_at == "start":
            seconds = sequence.get_playback_start_seconds()
        else:
            seconds = sequence.get_playback_end_seconds()
            
        unreal.log(f"Extracting Point {point_name} at time: {seconds} seconds")
        
        # In UE5, sequencer playheads operate on Tick Resolution (e.g. 24,000 FPS)
        # We must convert seconds to the exact sequence tick!
        tick_resolution = sequence.get_tick_resolution()
        target_tick = int(seconds * tick_resolution.numerator / tick_resolution.denominator)
        
        # Set time
        try:
            # In Unreal 5.6, setting time can be finicky. 
            # We use direct legacy setter which handles tick math internally.
            target_frame_num = int(seconds * sequence.get_display_rate().numerator / sequence.get_display_rate().denominator)
            unreal.LevelSequenceEditorBlueprintLibrary.set_current_time(target_frame_num)
        except Exception as e:
            unreal.log_warning(f"Fallback time set: {e}")
            try:
                frame_number = unreal.FrameNumber(target_frame_num)
                frame_time = unreal.FrameTime(frame_number)
                playback_params = unreal.MovieSceneSequencePlaybackParams()
                playback_params.frame = frame_time
                playback_params.update_method = unreal.UpdatePositionMethod.JUMP
                unreal.LevelSequenceEditorBlueprintLibrary.set_current_time(playback_params)
            except Exception as e2:
                unreal.log_error(f"Failed to set current time: {e2}")
        
        # REQUIRED to force UE to recalculate the CameraRig_Rail position for the new frame
        try:
            unreal.LevelSequenceEditorBlueprintLibrary.refresh_current_level_sequence()
        except:
            pass
        
        unreal.get_editor_subsystem(unreal.LevelEditorSubsystem).editor_invalidate_viewports()
        
        point_data = {"camera": {}, "dummies": {}}
        
        # 1. Extract Camera
        system = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
        actors = system.get_all_level_actors()
        camera_actor = None
        
        # Look for the rail explicitly
        rail_actor = None
        for actor in actors:
            if "CameraRig_Rail" in actor.get_name() or "CameraRig_Rail" in actor.get_actor_label():
                rail_actor = actor
                break
                
        # Look across ALL actors for the target camera directly
        # Sometimes attached actors don't show up in `get_attached_actors()` depending on how they were attached in Editor
        for actor in actors:
            if isinstance(actor, unreal.CineCameraActor):
                actor_label = actor.get_actor_label() if hasattr(actor, 'get_actor_label') else actor.get_name()
                if TARGET_CAMERA_NAME and TARGET_CAMERA_NAME in actor_label:
                    camera_actor = actor
                    unreal.log(f"Found targeted camera anywhere in level: {actor_label}")
                    break
            for actor in actors:
                if isinstance(actor, unreal.CineCameraActor):
                    actor_label = actor.get_actor_label() if hasattr(actor, 'get_actor_label') else actor.get_name()
                    if TARGET_CAMERA_NAME and TARGET_CAMERA_NAME not in actor_label:
                        continue
                    camera_actor = actor
                    break
                
        if camera_actor:
            cam_component = camera_actor.get_component_by_class(unreal.CineCameraComponent)
            print(cam_component)
            print('--here---')
            if cam_component:
                cam_loc = cam_component.get_world_location()
                cam_rot = cam_component.get_world_rotation()
                focal_length = cam_component.current_focal_length
                sensor_width = cam_component.filmback.sensor_width
                fov = math.degrees(2.0 * math.atan(sensor_width / (2.0 * focal_length)))
            else:
                cam_loc = camera_actor.get_actor_location()
                cam_rot = camera_actor.get_actor_rotation()
                fov = 90.0

            point_data["camera"] = {
                "position": {"x": cam_loc.x, "y": cam_loc.y, "z": cam_loc.z},
                "rotation": {"pitch": cam_rot.pitch, "yaw": cam_rot.yaw, "roll": cam_rot.roll},
                "fov": fov
            }
        else:
            unreal.log_warning(f"No CineCameraActor found in the level matching '{TARGET_CAMERA_NAME}' or attached to the rail!")

        # 2. Extract Dummies
        for dummy_name in DUMMY_OBJECT_NAMES:
            dummy_actor = get_actor_by_name(dummy_name)
            if dummy_actor:
                loc = dummy_actor.get_actor_location()
                point_data["dummies"][dummy_name] = {
                    "x": loc.x, "y": loc.y, "z": loc.z
                }
            else:
                unreal.log_warning(f"Dummy actor '{dummy_name}' not found.")
        
        output_data[point_name] = point_data

    os.makedirs(os.path.dirname(OUTPUT_JSON_PATH), exist_ok=True)
    with open(OUTPUT_JSON_PATH, 'w') as f:
        json.dump(output_data, f, indent=4)
        
    unreal.log(f"Successfully exported tracking data to {OUTPUT_JSON_PATH}")

if __name__ == "__main__":
    extract_sequence_data()