"""Bake the static Saloon light field and export the shipped GLB/EXR pair.

Blender and Cycles are development tools only. The browser loads the resulting
assets from the application origin and never performs progressive lighting.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

# Accepted lighting and bake constants. Keep these values in sync with the
# committed GLB and EXR by rebuilding through `pnpm --filter web build:saloon-shell`.
LIGHT_TEMPERATURE_K = 3400
LIGHT_POSITION = (-2.8, 10.0, 1.0)
LIGHT_TARGET = (0.0, 0.8, 0.0)
LIGHT_SIZE_METRES = 6.0
LIGHT_ENERGY_WATTS = 800.0
WORLD_COLOR = (0.72, 0.66, 0.58, 1.0)
WORLD_STRENGTH = 0.22
CYCLES_SAMPLES = 512
DIFFUSE_BOUNCES = 4
ATLAS_SIZE = 2048
BAKE_MARGIN_PX = 16

EXPECTED_MESHES = ("Floor", "Sand", "Table", "Plinth")
BASE_UV_NAME = "UVMap"
LIGHTMAP_UV_NAME = "Lightmap"

SCRIPT_DIR = Path(__file__).resolve().parent
WEB_ROOT = SCRIPT_DIR.parent
INTERMEDIATE_GLB = WEB_ROOT / ".saloon-build" / "saloon-shell-geometry.glb"
FINAL_GLB = WEB_ROOT / "public" / "models" / "saloon" / "saloon-shell.glb"
FINAL_EXR = WEB_ROOT / "public" / "textures" / "saloon" / "saloon-lightmap.exr"


def fail(message: str) -> None:
    raise RuntimeError(message)


def mesh_objects() -> dict[str, bpy.types.Object]:
    result = {obj.name: obj for obj in bpy.context.scene.objects if obj.type == "MESH"}
    missing = [name for name in EXPECTED_MESHES if name not in result]
    unexpected = sorted(set(result) - set(EXPECTED_MESHES))
    if missing:
        fail(f"Missing expected shell meshes: {', '.join(missing)}")
    if unexpected:
        fail(f"Unexpected shell meshes: {', '.join(unexpected)}")
    return {name: result[name] for name in EXPECTED_MESHES}


def select_objects(objects: list[bpy.types.Object]) -> None:
    if bpy.context.object and bpy.context.object.mode != "OBJECT":
        bpy.ops.object.mode_set(mode="OBJECT")
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects[0]


def world_bounds(obj: bpy.types.Object) -> tuple[tuple[float, float, float], tuple[float, float, float]]:
    points = [obj.matrix_world @ Vector(corner) for corner in obj.bound_box]
    minimum = tuple(min(point[axis] for point in points) for axis in range(3))
    maximum = tuple(max(point[axis] for point in points) for axis in range(3))
    return minimum, maximum


def snapshot_bounds(objects: dict[str, bpy.types.Object]) -> dict[str, tuple[tuple[float, float, float], tuple[float, float, float]]]:
    return {name: world_bounds(obj) for name, obj in objects.items()}


def assert_bounds_match(
    before: dict[str, tuple[tuple[float, float, float], tuple[float, float, float]]],
    after: dict[str, bpy.types.Object],
) -> None:
    tolerance = 1e-4
    for name, expected in before.items():
        actual = world_bounds(after[name])
        for expected_point, actual_point in zip(expected, actual, strict=True):
            for expected_value, actual_value in zip(expected_point, actual_point, strict=True):
                if abs(expected_value - actual_value) > tolerance:
                    fail(
                        f"World-space bounds changed for {name}: expected {expected}, got {actual}"
                    )


def create_uv_sets(objects: dict[str, bpy.types.Object]) -> None:
    # Base UVs are independent because runtime clay colours do not use a base
    # texture. They still ship as TEXCOORD_0 so the asset has a conventional
    # first UV set.
    for obj in objects.values():
        mesh = obj.data
        while mesh.uv_layers:
            mesh.uv_layers.remove(mesh.uv_layers[0])
        mesh.uv_layers.new(name=BASE_UV_NAME)
        mesh.uv_layers.active_index = 0
        mesh.uv_layers[BASE_UV_NAME].active_render = True

        select_objects([obj])
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(
            angle_limit=math.radians(66.0),
            margin_method="SCALED",
            island_margin=0.02,
            correct_aspect=True,
            scale_to_bounds=True,
        )
        bpy.ops.object.mode_set(mode="OBJECT")

        mesh.uv_layers.new(name=LIGHTMAP_UV_NAME)
        mesh.uv_layers.active_index = 1

        select_objects([obj])
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="SELECT")
        bpy.ops.uv.smart_project(
            angle_limit=math.radians(66.0),
            margin_method="SCALED",
            island_margin=0.0,
            correct_aspect=True,
            scale_to_bounds=False,
        )
        bpy.ops.object.mode_set(mode="OBJECT")

    # Multi-object edit mode packs every object's projected islands into one
    # shared atlas. Connected faces remain useful islands; packing every
    # triangle separately wastes the atlas and creates blocky GI.
    selected = list(objects.values())
    select_objects(selected)
    for obj in selected:
        obj.data.uv_layers.active_index = 1
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.pack_islands(
        rotate=True,
        rotate_method="ANY",
        scale=True,
        merge_overlap=False,
        margin_method="SCALED",
        margin=(BAKE_MARGIN_PX / ATLAS_SIZE) * 1.5,
        shape_method="AABB",
    )
    bpy.ops.object.mode_set(mode="OBJECT")

    for obj in selected:
        layers = obj.data.uv_layers
        names = tuple(layer.name for layer in layers)
        if names != (BASE_UV_NAME, LIGHTMAP_UV_NAME):
            fail(f"{obj.name} UV layers are {names}, expected UVMap then Lightmap")
        layers[BASE_UV_NAME].active_render = True
        layers.active_index = 1


def polygon_area(points: list[tuple[float, float]]) -> float:
    return abs(
        sum(
            points[index][0] * points[(index + 1) % len(points)][1]
            - points[(index + 1) % len(points)][0] * points[index][1]
            for index in range(len(points))
        )
    ) / 2


def triangle_intersection_area(
    subject: tuple[tuple[float, float], tuple[float, float], tuple[float, float]],
    clip_triangle: tuple[tuple[float, float], tuple[float, float], tuple[float, float]],
) -> float:
    """Clip one UV triangle by another and return their positive overlap area."""

    clip = list(clip_triangle)
    signed_area = sum(
        clip[index][0] * clip[(index + 1) % 3][1]
        - clip[(index + 1) % 3][0] * clip[index][1]
        for index in range(3)
    )
    if signed_area < 0:
        clip.reverse()

    output = list(subject)
    for index, edge_start in enumerate(clip):
        edge_end = clip[(index + 1) % 3]
        input_points = output
        output = []
        if not input_points:
            break

        def side(point: tuple[float, float]) -> float:
            return (edge_end[0] - edge_start[0]) * (point[1] - edge_start[1]) - (
                edge_end[1] - edge_start[1]
            ) * (point[0] - edge_start[0])

        previous = input_points[-1]
        previous_side = side(previous)
        for current in input_points:
            current_side = side(current)
            previous_inside = previous_side >= -1e-12
            current_inside = current_side >= -1e-12
            if current_inside != previous_inside:
                denominator = previous_side - current_side
                if abs(denominator) > 1e-15:
                    amount = previous_side / denominator
                    output.append(
                        (
                            previous[0] + amount * (current[0] - previous[0]),
                            previous[1] + amount * (current[1] - previous[1]),
                        )
                    )
            if current_inside:
                output.append(current)
            previous = current
            previous_side = current_side

    return polygon_area(output) if len(output) >= 3 else 0.0


def verify_lightmap_uvs(
    objects: dict[str, bpy.types.Object], *, require_authored_names: bool = True
) -> None:
    """Reject missing, out-of-bounds, degenerate, or overlapping UV triangles."""

    epsilon = 1e-10
    triangles: list[
        tuple[
            float,
            float,
            float,
            float,
            str,
            int,
            tuple[tuple[float, float], tuple[float, float], tuple[float, float]],
        ]
    ] = []

    for name, obj in objects.items():
        layers = obj.data.uv_layers
        names = tuple(layer.name for layer in layers)
        if len(layers) != 2:
            fail(f"{name} does not have exactly two UV layers: {names}")
        if require_authored_names and names != (BASE_UV_NAME, LIGHTMAP_UV_NAME):
            fail(f"{name} does not have consecutive UVMap and Lightmap layers")
        # glTF stores UVs as ordered TEXCOORD semantics, not named layers.
        # Blender therefore reimports TEXCOORD_1 as UVMap.001. Index 1 is the
        # invariant that Three.js exposes as geometry attribute `uv1`.
        uv_data = layers[1].data
        obj.data.calc_loop_triangles()
        for triangle in obj.data.loop_triangles:
            coordinates = tuple(
                (float(uv_data[index].uv.x), float(uv_data[index].uv.y))
                for index in triangle.loops
            )
            min_x = min(uv[0] for uv in coordinates)
            max_x = max(uv[0] for uv in coordinates)
            min_y = min(uv[1] for uv in coordinates)
            max_y = max(uv[1] for uv in coordinates)
            if min_x < -epsilon or min_y < -epsilon or max_x > 1 + epsilon or max_y > 1 + epsilon:
                fail(f"{name} triangle {triangle.index} has out-of-bounds Lightmap UVs")
            if polygon_area(list(coordinates)) <= epsilon:
                vertices = [obj.data.vertices[index].co for index in triangle.vertices]
                world_area = (vertices[1] - vertices[0]).cross(vertices[2] - vertices[0]).length / 2
                if world_area > epsilon:
                    fail(f"{name} triangle {triangle.index} has degenerate Lightmap UVs")
                continue
            triangles.append(
                (min_x, max_x, min_y, max_y, name, triangle.index, coordinates)
            )

    # Sweep on x to keep exact triangle comparisons bounded. Shared island
    # edges have zero area and pass; duplicated or crossing islands fail.
    active: list[
        tuple[
            float,
            float,
            float,
            float,
            str,
            int,
            tuple[tuple[float, float], tuple[float, float], tuple[float, float]],
        ]
    ] = []
    for triangle in sorted(triangles, key=lambda item: item[0]):
        min_x, max_x, min_y, max_y, name, index, coordinates = triangle
        active = [other for other in active if other[1] > min_x + epsilon]
        for other in active:
            if min(max_y, other[3]) - max(min_y, other[2]) <= epsilon:
                continue
            if triangle_intersection_area(coordinates, other[6]) > epsilon:
                fail(
                    f"Lightmap overlap: {name} triangle {index} and "
                    f"{other[4]} triangle {other[5]}"
                )
        active.append(triangle)


def configure_cycles(scene: bpy.types.Scene) -> str:
    scene.render.engine = "CYCLES"
    scene.cycles.samples = CYCLES_SAMPLES
    scene.cycles.diffuse_bounces = DIFFUSE_BOUNCES
    scene.cycles.max_bounces = max(DIFFUSE_BOUNCES, 4)
    scene.cycles.use_denoising = True

    device_label = "CPU"
    try:
        preferences = bpy.context.preferences.addons["cycles"].preferences
        preferences.compute_device_type = "METAL"
        preferences.get_devices()
        metal_devices = [device for device in preferences.devices if device.type == "METAL"]
        if metal_devices:
            for device in preferences.devices:
                device.use = device in metal_devices
            scene.cycles.device = "GPU"
            device_label = "METAL: " + ", ".join(device.name for device in metal_devices)
    except (KeyError, RuntimeError, TypeError):
        scene.cycles.device = "CPU"

    return device_label


def blackbody_rgb(temperature: int) -> tuple[float, float, float]:
    """Approximate an sRGB blackbody colour for Blender's area-light colour."""

    value = temperature / 100.0
    if value <= 66:
        red = 255.0
        green = 99.4708025861 * math.log(value) - 161.1195681661
        blue = 0.0 if value <= 19 else 138.5177312231 * math.log(value - 10) - 305.0447927307
    else:
        red = 329.698727446 * ((value - 60) ** -0.1332047592)
        green = 288.1221695283 * ((value - 60) ** -0.0755148492)
        blue = 255.0

    clamp = lambda channel: max(0.0, min(255.0, channel)) / 255.0
    return clamp(red), clamp(green), clamp(blue)


def create_light_rig(scene: bpy.types.Scene) -> None:
    world = bpy.data.worlds.new("SaloonWorld")
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background is None:
        fail("Could not create the Cycles World background")
    background.inputs["Color"].default_value = WORLD_COLOR
    background.inputs["Strength"].default_value = WORLD_STRENGTH
    scene.world = world

    light_data = bpy.data.lights.new(name="SaloonAreaKey", type="AREA")
    light_data.energy = LIGHT_ENERGY_WATTS
    light_data.shape = "DISK"
    light_data.size = LIGHT_SIZE_METRES
    light_data.color = blackbody_rgb(LIGHT_TEMPERATURE_K)
    light_object = bpy.data.objects.new(name="SaloonAreaKey", object_data=light_data)
    scene.collection.objects.link(light_object)
    light_object.location = LIGHT_POSITION
    light_object.rotation_euler = (
        Vector(LIGHT_TARGET) - Vector(LIGHT_POSITION)
    ).to_track_quat("-Z", "Y").to_euler()


def prepare_bake_materials(
    objects: dict[str, bpy.types.Object], image: bpy.types.Image
) -> list[tuple[bpy.types.Material, bpy.types.Node]]:
    targets: list[tuple[bpy.types.Material, bpy.types.Node]] = []
    seen: set[str] = set()

    for obj in objects.values():
        if len(obj.data.materials) != 1 or obj.data.materials[0] is None:
            fail(f"{obj.name} must retain exactly one material identity")
        material = obj.data.materials[0]
        if material.name in seen:
            continue
        seen.add(material.name)
        material.use_nodes = True
        node_tree = material.node_tree
        if node_tree is None:
            fail(f"Could not create nodes for {material.name}")
        for node in node_tree.nodes:
            node.select = False
        target = node_tree.nodes.new("ShaderNodeTexImage")
        target.name = "SaloonLightmapBakeTarget"
        target.label = "Shared Cycles lightmap bake target"
        target.image = image
        target.interpolation = "Linear"
        target.select = True
        node_tree.nodes.active = target
        targets.append((material, target))

    if len(targets) != len(EXPECTED_MESHES):
        fail(f"Expected four shell materials, found {len(targets)}")
    return targets


def bake_lightmap(
    scene: bpy.types.Scene,
    objects: dict[str, bpy.types.Object],
) -> bpy.types.Image:
    FINAL_EXR.parent.mkdir(parents=True, exist_ok=True)
    image = bpy.data.images.new(
        "SaloonLightmap",
        width=ATLAS_SIZE,
        height=ATLAS_SIZE,
        alpha=False,
        float_buffer=True,
    )
    image.generated_color = (0.0, 0.0, 0.0, 1.0)
    try:
        image.colorspace_settings.name = "Linear Rec.709"
    except TypeError:
        image.colorspace_settings.name = "Linear"

    targets = prepare_bake_materials(objects, image)
    select_objects(list(objects.values()))
    scene.render.bake.use_pass_direct = True
    scene.render.bake.use_pass_indirect = True
    scene.render.bake.use_pass_color = False
    scene.render.bake.margin = BAKE_MARGIN_PX
    scene.render.bake.target = "IMAGE_TEXTURES"
    bpy.ops.object.bake(
        type="DIFFUSE",
        pass_filter={"DIRECT", "INDIRECT"},
        margin=BAKE_MARGIN_PX,
        use_clear=True,
        uv_layer=LIGHTMAP_UV_NAME,
    )

    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.image_settings.color_depth = "16"
    scene.render.image_settings.exr_codec = "ZIP"
    image.filepath_raw = str(FINAL_EXR)
    image.file_format = "OPEN_EXR"
    image.use_half_precision = True
    image.save_render(filepath=str(FINAL_EXR), scene=scene)

    for material, target in targets:
        if material.node_tree is not None:
            material.node_tree.nodes.remove(target)

    if not FINAL_EXR.is_file() or FINAL_EXR.stat().st_size == 0:
        fail(f"Cycles did not write {FINAL_EXR}")
    if tuple(image.size) != (ATLAS_SIZE, ATLAS_SIZE) or not image.is_float:
        fail("The baked lightmap is not the required 2048 px floating-point image")
    return image


def prepare_lightmap_uvs_for_gltf(objects: dict[str, bpy.types.Object]) -> None:
    # Blender bakes image rows and UVs from a bottom-left origin. glTF exports
    # UVs for top-left image data, while Three.js loads the standalone EXR with
    # flipY=false. Pre-flipping TEXCOORD_1 cancels the exporter conversion so
    # the runtime UVs address the unmodified Cycles EXR.
    for obj in objects.values():
        lightmap = obj.data.uv_layers[LIGHTMAP_UV_NAME]
        for loop in lightmap.data:
            loop.uv.y = 1.0 - loop.uv.y


def export_shell(objects: dict[str, bpy.types.Object]) -> None:
    FINAL_GLB.parent.mkdir(parents=True, exist_ok=True)
    select_objects(list(objects.values()))
    bpy.ops.export_scene.gltf(
        filepath=str(FINAL_GLB),
        export_format="GLB",
        use_selection=True,
        export_texcoords=True,
        export_materials="EXPORT",
        export_apply=False,
        export_yup=True,
    )
    if not FINAL_GLB.is_file() or FINAL_GLB.stat().st_size == 0:
        fail(f"Blender did not write {FINAL_GLB}")


def verify_exported_glb(
    original_bounds: dict[str, tuple[tuple[float, float, float], tuple[float, float, float]]]
) -> tuple[dict[str, bpy.types.Object], int]:
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(FINAL_GLB))
    objects = mesh_objects()
    assert_bounds_match(original_bounds, objects)
    verify_lightmap_uvs(objects, require_authored_names=False)
    triangles = 0
    for obj in objects.values():
        obj.data.calc_loop_triangles()
        triangles += len(obj.data.loop_triangles)
    return objects, triangles


def main() -> None:
    if not INTERMEDIATE_GLB.is_file():
        fail(f"Missing geometry input: {INTERMEDIATE_GLB}")

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=str(INTERMEDIATE_GLB))
    objects = mesh_objects()
    original_bounds = snapshot_bounds(objects)

    create_uv_sets(objects)
    verify_lightmap_uvs(objects)

    scene = bpy.context.scene
    device = configure_cycles(scene)
    create_light_rig(scene)
    bake_lightmap(scene, objects)
    prepare_lightmap_uvs_for_gltf(objects)
    export_shell(objects)

    exported, triangles = verify_exported_glb(original_bounds)
    uv_report = ", ".join(
        f"{name}={[layer.name for layer in obj.data.uv_layers]}" for name, obj in exported.items()
    )

    print("\nSALOON_BAKE_SUCCESS")
    print(f"Blender: {bpy.app.version_string}")
    print(f"Cycles device: {device}")
    print(f"Meshes: {', '.join(exported)}")
    print(f"Triangles: {triangles}")
    print(f"UV layers: {uv_report}")
    print(f"Atlas: {ATLAS_SIZE}x{ATLAS_SIZE}, half-float OpenEXR, margin {BAKE_MARGIN_PX}px")
    print(
        "Light: "
        f"{LIGHT_TEMPERATURE_K}K, position {LIGHT_POSITION}, size {LIGHT_SIZE_METRES}m, "
        f"energy {LIGHT_ENERGY_WATTS}W, world {WORLD_STRENGTH}"
    )
    print(f"Cycles: {CYCLES_SAMPLES} samples, {DIFFUSE_BOUNCES} diffuse bounces")
    print(f"GLB: {FINAL_GLB} ({FINAL_GLB.stat().st_size} bytes)")
    print(f"EXR: {FINAL_EXR} ({FINAL_EXR.stat().st_size} bytes)")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"SALOON_BAKE_FAILED: {error}", file=sys.stderr)
        raise
