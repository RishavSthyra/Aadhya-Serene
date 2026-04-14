import unreal
import json
import os

# ===================== CONFIGURATION =====================
# 1. CHANGE THIS NAME BEFORE EACH RUN (e.g., "A1", "A2", "A3", "A4")
POINT_NAME = "A2" 

DUMMY_OBJECT_NAMES = ["dummy_1", "dummy_2", "dummy_3", "dummy_4"]
TARGET_BINDING_NAME = "CineCameraActor" 
JSON_OUTPUT_PATH = "C:/temp/unreal_tracking_data.json"

# Subsystems
LSEBL = unreal.LevelSequenceEditorBlueprintLibrary
EAS = unreal.get_editor_subsystem(unreal.EditorActorSubsystem)
# ==========================================================

def get_camera_from_binding(sequence, binding_name):
    """Finds the actual spawned CineCameraActor using the binding logic you provided."""
    for binding in sequence.get_bindings():
        if binding.get_display_name() == binding_name:
            binding_id = sequence.get_binding_id(binding)
            bound_objects = LSEBL.get_bound_objects(binding_id)
            if bound_objects:
                for obj in bound_objects:
                    if isinstance(obj, unreal.CineCameraActor):
                        return obj
    return None

def capture_and_append():
    # 1. Get the CURRENTLY OPEN sequence in the editor
    sequence = LSEBL.get_current_level_sequence()
    if not sequence:
        unreal.log_error("No Level Sequence is currently open! Please open one first.")
        return

    # 2. Load existing data if it exists (for appending)
    all_data = {}
    if os.path.exists(JSON_OUTPUT_PATH):
        try:
            with open(JSON_OUTPUT_PATH, 'r') as f:
                all_data = json.load(f)
        except Exception as e:
            unreal.log_warning(f"Could not load existing JSON, starting fresh: {e}")

    unreal.log(f"======= CAPTURING POINT: {POINT_NAME} =======")

    # 3. Force World Update (Your logic)
    # This ensures the actors are at the keyframe positions you've manually scrubbed to
    unreal.LevelSequenceEditorBlueprintLibrary.refresh_current_level_sequence()
    
    # 4. Find the Camera and Read Data
    camera_actor = get_camera_from_binding(sequence, TARGET_BINDING_NAME)
    
    if camera_actor:
        # Force selection refresh
        unreal.EditorLevelLibrary.set_selected_level_actors([camera_actor])
        
        loc = camera_actor.get_actor_location()
        rot = camera_actor.get_actor_rotation()
        cine_comp = camera_actor.get_cine_camera_component()
        
        point_info = {
            "camera": {
                "position": {"x": loc.x, "y": loc.y, "z": loc.z},
                "rotation": {"pitch": rot.pitch, "yaw": rot.yaw, "roll": rot.roll},
                "fov": cine_comp.field_of_view
            },
            "dummies": {}
        }
        
        # 5. Extract Dummies
        all_actors = EAS.get_all_level_actors()
        for d_name in DUMMY_OBJECT_NAMES:
            d_actor = next((a for a in all_actors if a.get_actor_label() == d_name), None)
            if d_actor:
                d_loc = d_actor.get_actor_location()
                point_info["dummies"][d_name] = {
                    "x": d_loc.x, "y": d_loc.y, "z": d_loc.z
                }
        
        # 6. APPEND to the existing data
        all_data[POINT_NAME] = point_info
        
        # 7. SAVE TO JSON
        os.makedirs(os.path.dirname(JSON_OUTPUT_PATH), exist_ok=True)
        with open(JSON_OUTPUT_PATH, 'w') as f:
            json.dump(all_data, f, indent=4)
        
        unreal.log(f"Successfully captured and appended {POINT_NAME} from {sequence.get_name()}")
    else:
        unreal.log_error(f"Binding '{TARGET_BINDING_NAME}' not found in the current sequence!")

if __name__ == "__main__":
    capture_and_append()