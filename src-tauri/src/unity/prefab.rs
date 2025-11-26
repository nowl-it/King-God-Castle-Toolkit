// Allow camelCase field names to match Unity's naming conventions
#![allow(non_snake_case)]

use crate::utils::yaml_to_json;
use base64::{engine::general_purpose, Engine as _};
use glob::glob;
use image::ImageReader;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use unity_yaml_rust::yaml::YamlLoader;

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub struct PrefabElement {
    #[serde(default)]
    pub id: i64,
    game_object: Option<GameObject>,
    transform: Option<Transform>,
    animator: Option<Animator>,
    mono_behaviour: Option<MonoBehaviour>,
    sprite_renderer: Option<SpriteRenderer>,
    particle_system: Option<ParticleSystem>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Animator {
    #[serde(rename = "m_AllowConstantClipSamplingOptimization")]
    m_allow_constant_clip_sampling_optimization: i64,
    #[serde(rename = "m_ApplyRootMotion")]
    m_apply_root_motion: i64,
    #[serde(rename = "m_Avatar")]
    m_avatar: MAvatar,
    #[serde(rename = "m_Controller")]
    m_controller: MController,
    #[serde(rename = "m_CorrespondingSourceObject")]
    m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_CullingMode")]
    m_culling_mode: i64,
    #[serde(rename = "m_Enabled")]
    m_enabled: i64,
    #[serde(rename = "m_GameObject")]
    m_game_object: MAvatar,
    #[serde(rename = "m_HasTransformHierarchy")]
    m_has_transform_hierarchy: i64,
    #[serde(rename = "m_KeepAnimatorStateOnDisable")]
    m_keep_animator_state_on_disable: i64,
    #[serde(rename = "m_LinearVelocityBlending")]
    m_linear_velocity_blending: i64,
    #[serde(rename = "m_ObjectHideFlags")]
    m_object_hide_flags: i64,
    #[serde(rename = "m_PrefabAsset")]
    m_prefab_asset: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    m_prefab_instance: MAvatar,
    #[serde(rename = "m_StabilizeFeet")]
    m_stabilize_feet: i64,
    #[serde(rename = "m_UpdateMode")]
    m_update_mode: i64,
    #[serde(rename = "m_WarningMessage")]
    m_warning_message: Option<serde_json::Value>,
    #[serde(rename = "m_WriteDefaultValuesOnDisable")]
    m_write_default_values_on_disable: i64,
    #[serde(rename = "serializedVersion", default)]
    serialized_version: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MAvatar {
    #[serde(rename = "fileID")]
    file_id: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MController {
    #[serde(rename = "fileID")]
    file_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    guid: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    m_controller_type: Option<i64>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GameObject {
    #[serde(rename = "m_Component")]
    m_component: Vec<MComponent>,
    #[serde(rename = "m_CorrespondingSourceObject")]
    m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_Icon")]
    m_icon: MAvatar,
    #[serde(rename = "m_IsActive")]
    m_is_active: i64,
    #[serde(rename = "m_Layer")]
    m_layer: i64,
    #[serde(rename = "m_Name")]
    m_name: String,
    #[serde(rename = "m_NavMeshLayer")]
    m_nav_mesh_layer: i64,
    #[serde(rename = "m_ObjectHideFlags")]
    m_object_hide_flags: i64,
    #[serde(rename = "m_PrefabAsset")]
    m_prefab_asset: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    m_prefab_instance: MAvatar,
    #[serde(rename = "m_StaticEditorFlags")]
    m_static_editor_flags: i64,
    #[serde(rename = "m_TagString")]
    m_tag_string: String,
    #[serde(rename = "serializedVersion", default)]
    serialized_version: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct MComponent {
    component: MAvatar,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MonoBehaviour {
    actor_image: Option<MAvatar>,
    animator: Option<MAvatar>,
    attached_unit_effect_renderers: Option<Vec<Option<serde_json::Value>>>,
    attached_unit_effects: Option<Vec<Option<serde_json::Value>>>,
    attack_collider: Option<MAvatar>,
    effect_root: Option<Vec<Option<serde_json::Value>>>,
    #[serde(rename = "isUI")]
    is_ui: Option<i64>,
    #[serde(rename = "m_CorrespondingSourceObject")]
    m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_EditorClassIdentifier")]
    m_editor_class_identifier: Option<serde_json::Value>,
    #[serde(rename = "m_EditorHideFlags")]
    m_editor_hide_flags: i64,
    #[serde(rename = "m_Enabled")]
    m_enabled: i64,
    #[serde(rename = "m_GameObject")]
    m_game_object: MAvatar,
    #[serde(rename = "m_Name")]
    m_name: Option<serde_json::Value>,
    #[serde(rename = "m_ObjectHideFlags")]
    m_object_hide_flags: i64,
    #[serde(rename = "m_PrefabAsset")]
    m_prefab_asset: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    m_prefab_instance: MAvatar,
    #[serde(rename = "m_Script")]
    m_script: MController,
    particle_roots: Option<Vec<Option<serde_json::Value>>>,
    #[serde(rename = "pauseUpdateUI")]
    pause_update_ui: Option<i64>,
    position_root: Option<MAvatar>,
    shadow: Option<MAvatar>,
    shoot_point: Option<MAvatar>,
    sprites: Option<Vec<MAvatar>>,
    target: Option<MAvatar>,
    torso: Option<MAvatar>,
    unit_id: Option<i64>,
    sheet_data: Option<MController>,
    sprite_renderer: Option<MAvatar>,
    unit_controller: Option<MAvatar>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimplifiedMonoBehaviour {
    unit_id: Option<i64>,
    is_ui: Option<i64>,
    pause_update_ui: Option<i64>,
    script_guid: String,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SpriteRenderer {
    #[serde(rename = "m_AdaptiveModeThreshold")]
    m_adaptive_mode_threshold: f64,
    #[serde(rename = "m_AutoUVMaxAngle")]
    m_auto_uv_max_angle: i64,
    #[serde(rename = "m_AutoUVMaxDistance")]
    m_auto_uv_max_distance: f64,
    #[serde(rename = "m_CastShadows")]
    m_cast_shadows: i64,
    #[serde(rename = "m_Color")]
    m_color: MColor,
    #[serde(rename = "m_CorrespondingSourceObject")]
    m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_DrawMode")]
    m_draw_mode: i64,
    #[serde(rename = "m_DynamicOccludee")]
    m_dynamic_occludee: i64,
    #[serde(rename = "m_Enabled")]
    m_enabled: i64,
    #[serde(rename = "m_FlipX")]
    m_flip_x: i64,
    #[serde(rename = "m_FlipY")]
    m_flip_y: i64,
    #[serde(rename = "m_GameObject")]
    m_game_object: MAvatar,
    #[serde(rename = "m_IgnoreNormalsForChartDetection")]
    m_ignore_normals_for_chart_detection: i64,
    #[serde(rename = "m_ImportantGI")]
    m_important_gi: i64,
    #[serde(rename = "m_LightProbeUsage")]
    m_light_probe_usage: i64,
    #[serde(rename = "m_LightProbeVolumeOverride")]
    m_light_probe_volume_override: MAvatar,
    #[serde(rename = "m_LightmapParameters")]
    m_lightmap_parameters: MAvatar,
    #[serde(rename = "m_MaskInteraction")]
    m_mask_interaction: i64,
    #[serde(rename = "m_Materials")]
    m_materials: Vec<MController>,
    #[serde(rename = "m_MinimumChartSize")]
    m_minimum_chart_size: i64,
    #[serde(rename = "m_MotionVectors")]
    m_motion_vectors: i64,
    #[serde(rename = "m_ObjectHideFlags")]
    m_object_hide_flags: i64,
    #[serde(rename = "m_PrefabAsset")]
    m_prefab_asset: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    m_prefab_instance: MAvatar,
    #[serde(rename = "m_PreserveUVs")]
    m_preserve_u_vs: i64,
    #[serde(rename = "m_ProbeAnchor")]
    m_probe_anchor: MAvatar,
    #[serde(rename = "m_RayTraceProcedural")]
    m_ray_trace_procedural: i64,
    #[serde(rename = "m_RayTracingMode")]
    m_ray_tracing_mode: i64,
    #[serde(rename = "m_ReceiveGI")]
    m_receive_gi: i64,
    #[serde(rename = "m_ReceiveShadows")]
    m_receive_shadows: i64,
    #[serde(rename = "m_ReflectionProbeUsage")]
    m_reflection_probe_usage: i64,
    #[serde(rename = "m_RendererPriority")]
    m_renderer_priority: i64,
    #[serde(rename = "m_RenderingLayerMask")]
    m_rendering_layer_mask: i64,
    #[serde(rename = "m_ScaleInLightmap")]
    m_scale_in_lightmap: i64,
    #[serde(rename = "m_SelectedEditorRenderState")]
    m_selected_editor_render_state: i64,
    #[serde(rename = "m_Size")]
    m_size: MSize,
    #[serde(rename = "m_SortingLayer")]
    m_sorting_layer: i64,
    #[serde(rename = "m_SortingLayerID")]
    m_sorting_layer_id: i64,
    #[serde(rename = "m_SortingOrder")]
    m_sorting_order: i64,
    #[serde(rename = "m_Sprite")]
    m_sprite: MController,
    #[serde(rename = "m_SpriteSortPoint")]
    m_sprite_sort_point: i64,
    #[serde(rename = "m_SpriteTileMode")]
    m_sprite_tile_mode: i64,
    #[serde(rename = "m_StaticBatchInfo")]
    m_static_batch_info: MStaticBatchInfo,
    #[serde(rename = "m_StaticBatchRoot")]
    m_static_batch_root: MAvatar,
    #[serde(rename = "m_StaticShadowCaster")]
    m_static_shadow_caster: i64,
    #[serde(rename = "m_StitchLightmapSeams")]
    m_stitch_lightmap_seams: i64,
    #[serde(rename = "m_WasSpriteAssigned")]
    m_was_sprite_assigned: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MColor {
    a: f64,
    b: f64,
    g: f64,
    r: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct MSize {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub x: f64,
    pub y: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct MStaticBatchInfo {
    first_sub_mesh: i64,
    sub_mesh_count: i64,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Transform {
    #[serde(rename = "m_Children")]
    m_children: Vec<MAvatar>,
    #[serde(rename = "m_ConstrainProportionsScale")]
    m_constrain_proportions_scale: i64,
    #[serde(rename = "m_CorrespondingSourceObject")]
    m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_Father")]
    m_father: MAvatar,
    #[serde(rename = "m_GameObject")]
    m_game_object: MAvatar,
    #[serde(rename = "m_LocalEulerAnglesHint")]
    m_local_euler_angles_hint: MLocal,
    #[serde(rename = "m_LocalPosition")]
    m_local_position: MLocal,
    #[serde(rename = "m_LocalRotation")]
    m_local_rotation: MLocal,
    #[serde(rename = "m_LocalScale")]
    m_local_scale: MLocal,
    #[serde(rename = "m_ObjectHideFlags")]
    m_object_hide_flags: i64,
    #[serde(rename = "m_PrefabAsset")]
    m_prefab_asset: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    m_prefab_instance: MAvatar,
    #[serde(rename = "serializedVersion", default)]
    serialized_version: Option<i64>,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct MLocal {
    x: f64,
    y: f64,
    z: f64,
    w: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimplifiedTransform {
    local_position: MLocal,
    local_scale: MLocal,
    local_rotation: MLocal,
    local_euler_angles_hint: MLocal,
    father_id: i64,
    children_ids: Vec<i64>,
}

// Struct để chứa thông tin Sprite Rect
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct SpriteRectInfo {
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimplifiedSpriteRenderer {
    color: MColor,
    size: MSize,
    sprite_guid: String,
    sprite_base64: Option<String>,
    sprite_rect: Option<SpriteRectInfo>,
    sorting_order: i64,
    offset: Vector2, // Đã có sẵn
    flip_x: i64,
    flip_y: i64,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimplifiedAnimator {
    enabled: i64,
    controller_guid: String,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SimplifiedParticleSystem {
    enabled: i64,
    #[serde(rename = "lengthInSec")]
    length_in_sec: f64,
    simulation_speed: f64,
    looping: i64,
    prewarm: i64,
    play_on_awake: i64,
    auto_random_seed: i64,
    start_lifetime: f64,
    start_speed: f64,
    start_size: f64,
    start_color: MColor,
    gravity_modifier: f64,
    emission_rate: f64,
    shape_type: i64,
}

#[derive(Serialize, Deserialize)]
pub struct HierarchyNode {
    name: String,
    #[serde(rename = "type")]
    r#type: String,
    is_active: i64,
    transform: Option<SimplifiedTransform>,
    sprite_renderer: Option<SimplifiedSpriteRenderer>,
    animator: Option<SimplifiedAnimator>,
    particle_system: Option<SimplifiedParticleSystem>,
    animation_clips: Option<Vec<String>>, // List of animation clip names
    mono_behaviours: Vec<SimplifiedMonoBehaviour>,
    children: Vec<HierarchyNode>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vector2 {
    pub x: f32,
    pub y: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vector3 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NullableVector3 {
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub z: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Vector4 {
    pub x: f32,
    pub y: f32,
    pub z: f32,
    pub w: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Rect {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub x: f32,
    pub y: f32,
    pub width: f32,
    pub height: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileReference {
    #[serde(rename = "fileID")]
    pub file_id: i64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub guid: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub file_type: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Bounds {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_Center")]
    pub center: Vector3,
    #[serde(rename = "m_Extent")]
    pub extent: Vector3,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VertexChannel {
    pub dimension: i32,
    pub format: i32,
    pub offset: i32,
    pub stream: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VertexData {
    #[serde(rename = "_typelessdata")]
    pub typeless_data: Option<String>,
    #[serde(rename = "m_Channels")]
    pub channels: Vec<VertexChannel>,
    #[serde(rename = "m_DataSize")]
    pub data_size: i32,
    #[serde(rename = "m_VertexCount")]
    pub vertex_count: i32,
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubMesh {
    #[serde(rename = "baseVertex")]
    pub base_vertex: i32,
    #[serde(rename = "firstByte")]
    pub first_byte: i32,
    #[serde(rename = "firstVertex")]
    pub first_vertex: i32,
    #[serde(rename = "indexCount")]
    pub index_count: i32,
    #[serde(rename = "localAABB")]
    pub local_aabb: Bounds,
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub topology: i32,
    #[serde(rename = "vertexCount")]
    pub vertex_count: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum IndexBuffer {
    Number(f64),
    String(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderData {
    #[serde(rename = "alphaTexture")]
    pub alpha_texture: FileReference,
    #[serde(rename = "atlasRectOffset")]
    pub atlas_rect_offset: Vector2,
    #[serde(rename = "downscaleMultiplier")]
    pub downscale_multiplier: f32,
    #[serde(rename = "m_Bindpose")]
    pub bindpose: Vec<serde_json::Value>, // Empty array in this case
    #[serde(rename = "m_IndexBuffer")]
    pub index_buffer: Option<IndexBuffer>, // Can be null or a large number
    #[serde(rename = "m_SubMeshes")]
    pub sub_meshes: Vec<SubMesh>,
    #[serde(rename = "m_VertexData")]
    pub vertex_data: VertexData,
    #[serde(rename = "secondaryTextures")]
    pub secondary_textures: Vec<serde_json::Value>, // Empty array
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "settingsRaw")]
    pub settings_raw: i32,
    pub texture: FileReference,
    #[serde(rename = "textureRect")]
    pub texture_rect: Rect,
    #[serde(rename = "textureRectOffset")]
    pub texture_rect_offset: Vector2,
    #[serde(rename = "uvTransform")]
    pub uv_transform: Vector4,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderDataKey {
    // Key is a hash string, value is a large integer
    // Using HashMap for flexible key handling
    #[serde(flatten)]
    pub data: std::collections::HashMap<String, i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sprite {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_AtlasName")]
    pub atlas_name: Option<String>,
    #[serde(rename = "m_AtlasRD")]
    pub atlas_rd: RenderData,
    #[serde(rename = "m_AtlasTags")]
    pub atlas_tags: Vec<serde_json::Value>, // Empty array
    #[serde(rename = "m_Bones")]
    pub bones: Vec<serde_json::Value>, // Empty array
    #[serde(rename = "m_Border")]
    pub border: Vector4,
    #[serde(rename = "m_CorrespondingSourceObject")]
    pub corresponding_source_object: FileReference,
    #[serde(rename = "m_Extrude")]
    pub extrude: i32,
    #[serde(rename = "m_IsPolygon")]
    pub is_polygon: i32,
    #[serde(rename = "m_Name")]
    pub name: String,
    #[serde(rename = "m_ObjectHideFlags")]
    pub object_hide_flags: i32,
    #[serde(rename = "m_Offset")]
    pub offset: Vector2,
    #[serde(rename = "m_PackingTag")]
    pub packing_tag: Option<String>,
    #[serde(rename = "m_PhysicsShape")]
    pub physics_shape: Vec<Vec<Vector2>>,
    #[serde(rename = "m_Pivot")]
    pub pivot: Vector2,
    #[serde(rename = "m_PixelsToUnits")]
    pub pixels_to_units: f32,
    #[serde(rename = "m_PrefabAsset")]
    pub prefab_asset: FileReference,
    #[serde(rename = "m_PrefabInstance")]
    pub prefab_instance: FileReference,
    #[serde(rename = "m_RD")]
    pub rd: RenderData,
    #[serde(rename = "m_Rect")]
    pub rect: Rect,
    #[serde(rename = "m_RenderDataKey")]
    pub render_data_key: RenderDataKey,
    #[serde(rename = "m_SpriteAtlas")]
    pub sprite_atlas: FileReference,
    #[serde(rename = "m_SpriteID")]
    pub sprite_id: Option<String>,
    #[serde(rename = "alphaTexture", default)]
    pub alpha_texture: Option<FileReference>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SpriteAsset {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "Sprite")]
    pub sprite: Sprite,
}

#[derive(Serialize, Deserialize, Debug)]
struct SpriteRD {
    texture: MController,
    #[serde(rename = "textureRect")]
    texture_rect: Rect,
}

// Struct để chứa thông tin sprite với rect và offset
#[derive(Debug, Clone)]
struct SpriteInfo {
    base64: Option<String>,
    rect: SpriteRectInfo,
    offset: Vector2, // Đã được bổ sung
}

// Hàm tìm đường dẫn file asset từ GUID (sprite hoặc texture)
fn find_asset_path(guid: &str, project_path: &str, extension: &str) -> Option<String> {
    let meta_patterns = vec![
        format!(
            "{}/Assets/00_Unit/#Image/**/*.{}.meta",
            project_path, extension
        ),
        format!("{}/Assets/00_Unit/#Image/**/*.meta", project_path), // Cho .png.meta, .asset.meta
        format!("{}/Assets/00_Unit/SpriteAtlas/**/*.meta", project_path), // Cho Sprite Atlas
        format!("{}/Assets/**/*.{}.meta", project_path, extension),
        format!("{}/Assets/**/*.meta", project_path), // Cho .png.meta, .asset.meta
    ];
    for pattern in meta_patterns {
        if let Ok(meta_files) = glob(&pattern) {
            for meta_file in meta_files.filter_map(Result::ok) {
                if let Ok(meta_content) = fs::read_to_string(&meta_file) {
                    if meta_content.contains(&format!("guid: {}", guid)) {
                        let asset_path = meta_file.with_extension(""); // Bỏ .meta
                        if asset_path.exists() {
                            return Some(asset_path.to_string_lossy().to_string());
                        }
                    }
                }
            }
        }
    }
    None
}

// Cập nhật hàm sprite_to_base64 để trả về cả base64, rect info và offset
fn sprite_to_base64_with_rect(sprite_guid: &str, project_path: &str) -> Option<SpriteInfo> {
    // Tìm Sprite.asset hoặc .png từ GUID
    let sprite_path = find_asset_path(sprite_guid, project_path, "asset")
        .or_else(|| find_asset_path(sprite_guid, project_path, "png"))
        .or_else(|| find_asset_path(sprite_guid, project_path, "jpg"))?;

    if sprite_path.ends_with(".png") || sprite_path.ends_with(".jpg") {
        // Nếu là ảnh trực tiếp, encode base64 và lấy kích thước
        let base64 = image_to_base64(&sprite_path);
        let rect = get_image_dimensions(&sprite_path)?;
        return Some(SpriteInfo {
            base64,
            rect,
            offset: Vector2 { x: 0.0, y: 0.0 }, // Offset mặc định cho ảnh trực tiếp
        });
    }

    // Xử lý .asset (Sprite Atlas)
    let sprite_content = fs::read_to_string(&sprite_path).ok()?;
    let yaml = YamlLoader::load_from_str(&sprite_content).ok()?;

    if yaml.is_empty() {
        return None;
    }

    let json = yaml_to_json(&yaml[3])
        .map_err(|e| {
            println!("yaml_to_json error for sprite GUID {}: {}", sprite_guid, e);
            "Failed to convert YAML to JSON"
        })
        .ok()?;

    let sprite_asset: SpriteAsset = match serde_json::from_value::<SpriteAsset>(json.clone()) {
        Ok(s) => s,
        Err(e) => {
            println!(
                "Failed to parse SpriteAsset JSON for GUID {}: {}",
                sprite_guid, e
            );

            // Log thêm thông tin chi tiết về vị trí lỗi
            println!("Error at line: {:?}", e.line());
            println!("Error at column: {:?}", e.column());

            // Log JSON gốc để debug
            println!(
                "Original JSON: {}",
                serde_json::to_string_pretty(&json).unwrap_or_else(|_| "Invalid JSON".to_string())
            );

            return None;
        }
    };

    // Lấy texture GUID từ m_RD.texture
    let texture_guid = sprite_asset.sprite.rd.texture.guid;
    if texture_guid.is_none() {
        return None;
    }
    let texture_guid = texture_guid.unwrap(); // Unwrap to get the String

    let texture_path = find_asset_path(&texture_guid, project_path, "png")
        .or_else(|| find_asset_path(&texture_guid, project_path, "jpg"))?;

    // Load texture image
    let reader = ImageReader::open(&texture_path).ok()?;
    let img = reader.decode().ok()?;

    // Crop theo textureRect (pixels)
    let rect = sprite_asset.sprite.rd.texture_rect;
    let x = rect.x as u32;
    let mut y = rect.y as u32;
    let w = rect.width as u32;
    let h = rect.height as u32;

    // Flip y vì Unity UV bottom-left, image top-left
    let texture_height = img.height();
    y = texture_height - (y + h);

    // Crop
    let cropped = img.crop_imm(x, y, w, h);

    // Encode to base64
    let mut buf = std::io::Cursor::new(Vec::new());
    cropped.write_to(&mut buf, image::ImageFormat::Png).ok()?;
    let base64_str = general_purpose::STANDARD.encode(buf.get_ref());
    let base64 = Some(format!("data:image/png;base64,{}", base64_str));

    // Tạo SpriteRectInfo từ m_Rect của sprite (không phải textureRect)
    let sprite_rect = SpriteRectInfo {
        x: sprite_asset.sprite.rect.x,
        y: sprite_asset.sprite.rect.y,
        width: sprite_asset.sprite.rect.width,
        height: sprite_asset.sprite.rect.height,
    };

    // Lấy offset từ sprite asset - ĐÂY LÀ ĐIỂM QUAN TRỌNG
    let sprite_offset = sprite_asset.sprite.offset;

    Some(SpriteInfo {
        base64,
        rect: sprite_rect,
        offset: sprite_offset, // Sử dụng offset từ sprite asset
    })
}

// Hàm lấy kích thước ảnh trực tiếp
fn get_image_dimensions(file_path: &str) -> Option<SpriteRectInfo> {
    let reader = ImageReader::open(file_path).ok()?;
    let img = reader.decode().ok()?;
    Some(SpriteRectInfo {
        x: 0.0,
        y: 0.0,
        width: img.width() as f32,
        height: img.height() as f32,
    })
}

// Hàm chuyển file ảnh trực tiếp thành base64
fn image_to_base64(file_path: &str) -> Option<String> {
    if !file_path.ends_with(".png") && !file_path.ends_with(".jpg") {
        return None;
    }
    let img_data = fs::read(file_path).ok()?;
    let mime_type = if file_path.ends_with(".png") {
        "image/png"
    } else {
        "image/jpeg"
    };
    let base64_str = general_purpose::STANDARD.encode(&img_data);
    Some(format!("data:{};base64,{}", mime_type, base64_str))
}

pub type Prefab = Vec<PrefabElement>;

async fn read_prefab(prefab_path: String) -> Result<Prefab, String> {
    let prefab_content = fs::read_to_string(&prefab_path)
        .map_err(|e| format!("Failed to read prefab file: {}", e))?;

    let mut prefab_elements = Vec::new();
    let lines: Vec<&str> = prefab_content.lines().collect();
    let mut i = 0;
    while i < lines.len() {
        if lines[i].starts_with("--- !u!") {
            let header = lines[i];
            let parts: Vec<&str> = header.split_whitespace().collect();
            if parts.len() != 3 {
                i += 1;
                continue;
            }
            let id_str = parts[2].trim_start_matches('&');
            let id: i64 = match id_str.parse() {
                Ok(num) => num,
                Err(_) => {
                    i += 1;
                    continue;
                }
            };
            let mut body_lines = Vec::new();
            i += 1;
            while i < lines.len() && !lines[i].starts_with("--- !u!") {
                body_lines.push(lines[i]);
                i += 1;
            }
            let body = body_lines.join("\n");
            let docs = match YamlLoader::load_from_str(&body) {
                Ok(d) => d,
                Err(_) => {
                    continue;
                }
            };
            if docs.is_empty() {
                continue;
            }
            let yaml = &docs[0];
            let json = match yaml_to_json(yaml) {
                Ok(j) => j,
                Err(_) => continue,
            };
            let mut element: PrefabElement = match serde_json::from_value(json) {
                Ok(e) => e,
                Err(_) => continue,
            };
            element.id = id;
            prefab_elements.push(element);
        } else {
            i += 1;
        }
    }
    Ok(prefab_elements)
}

fn build_hierarchy(prefab: &Prefab, project_path: &str) -> HierarchyNode {
    let mut id_to_go: HashMap<i64, &GameObject> = HashMap::new();
    let mut id_to_trans: HashMap<i64, &Transform> = HashMap::new();
    let mut trans_id_to_go_id: HashMap<i64, i64> = HashMap::new();
    let mut go_id_to_trans_id: HashMap<i64, i64> = HashMap::new();
    let mut id_to_sprite: HashMap<i64, &SpriteRenderer> = HashMap::new();
    let mut id_to_animator: HashMap<i64, &Animator> = HashMap::new();
    let mut id_to_particle: HashMap<i64, &ParticleSystem> = HashMap::new();
    let mut id_to_monos: HashMap<i64, Vec<&MonoBehaviour>> = HashMap::new();

    for el in prefab {
        let id = el.id;
        if let Some(go) = &el.game_object {
            id_to_go.insert(id, go);
        }
        if let Some(trans) = &el.transform {
            let go_id = trans.m_game_object.file_id;
            id_to_trans.insert(id, trans);
            trans_id_to_go_id.insert(id, go_id);
            go_id_to_trans_id.insert(go_id, id);
        }
        if let Some(sr) = &el.sprite_renderer {
            let go_id = sr.m_game_object.file_id;
            id_to_sprite.insert(go_id, sr);
        }
        if let Some(anim) = &el.animator {
            let go_id = anim.m_game_object.file_id;
            id_to_animator.insert(go_id, anim);
        }
        if let Some(ps) = &el.particle_system {
            let go_id = ps.m_game_object.file_id;
            id_to_particle.insert(go_id, ps);
        }
        if let Some(mono) = &el.mono_behaviour {
            let go_id = mono.m_game_object.file_id;
            id_to_monos.entry(go_id).or_insert(Vec::new()).push(mono);
        }
    }
    let root_trans: Vec<i64> = id_to_trans
        .iter()
        .filter_map(|(&tid, trans)| {
            if trans.m_father.file_id == 0 {
                Some(tid)
            } else {
                None
            }
        })
        .collect();
    let root_trans_id = root_trans[0];
    let root_go_id = trans_id_to_go_id[&root_trans_id];

    fn build_node(
        go_id: i64,
        id_to_go: &HashMap<i64, &GameObject>,
        id_to_trans: &HashMap<i64, &Transform>,
        trans_id_to_go_id: &HashMap<i64, i64>,
        go_id_to_trans_id: &HashMap<i64, i64>,
        id_to_sprite: &HashMap<i64, &SpriteRenderer>,
        id_to_animator: &HashMap<i64, &Animator>,
        id_to_particle: &HashMap<i64, &ParticleSystem>,
        id_to_monos: &HashMap<i64, Vec<&MonoBehaviour>>,
        project_path: &str,
    ) -> HierarchyNode {
        let go = id_to_go.get(&go_id).unwrap();
        let name = go.m_name.clone();
        let r#type = "GameObject".to_string();
        let is_active = go.m_is_active;
        let transform = if let Some(&trans_id) = go_id_to_trans_id.get(&go_id) {
            if let Some(trans) = id_to_trans.get(&trans_id) {
                Some(SimplifiedTransform {
                    local_position: trans.m_local_position.clone(),
                    local_scale: trans.m_local_scale.clone(),
                    local_rotation: trans.m_local_rotation.clone(),
                    local_euler_angles_hint: trans.m_local_euler_angles_hint.clone(),
                    father_id: trans.m_father.file_id,
                    children_ids: trans.m_children.iter().map(|c| c.file_id).collect(),
                })
            } else {
                None
            }
        } else {
            None
        };

        // Cập nhật xử lý sprite_renderer để bao gồm sprite_rect và offset
        let sprite_renderer = if let Some(sr) = id_to_sprite.get(&go_id) {
            let sprite_guid = sr.m_sprite.guid.clone();

            // Sử dụng hàm đã cập nhật để lấy cả base64, rect info và offset
            let sprite_info = if let Some(guid) = &sprite_guid {
                sprite_to_base64_with_rect(guid, project_path)
            } else {
                None
            };

            let (sprite_base64, sprite_rect, sprite_offset) = if let Some(info) = sprite_info {
                (info.base64, Some(info.rect), info.offset)
            } else {
                (None, None, Vector2 { x: 0.0, y: 0.0 })
            };

            Some(SimplifiedSpriteRenderer {
                color: sr.m_color.clone(),
                size: sr.m_size.clone(),
                offset: sprite_offset, // Sử dụng offset từ sprite asset thay vì default
                sprite_guid: sprite_guid.unwrap_or_default(),
                sprite_base64,
                sprite_rect, // Thông tin sprite rect
                sorting_order: sr.m_sorting_order,
                flip_x: sr.m_flip_x,
                flip_y: sr.m_flip_y,
            })
        } else {
            None
        };

        let animator = if let Some(anim) = id_to_animator.get(&go_id) {
            Some(SimplifiedAnimator {
                enabled: anim.m_enabled,
                controller_guid: anim.m_controller.guid.clone().unwrap_or_default(),
            })
        } else {
            None
        };

        let particle_system = if let Some(ps) = id_to_particle.get(&go_id) {
            Some(SimplifiedParticleSystem {
                enabled: ps.m_enabled,
                length_in_sec: ps.lengthInSec,
                simulation_speed: ps.simulationSpeed,
                looping: ps.looping,
                prewarm: ps.prewarm,
                play_on_awake: ps.playOnAwake,
                auto_random_seed: ps.autoRandomSeed,
                start_lifetime: ps.startLifetime.scalar.unwrap_or(0.0),
                start_speed: ps.startSpeed.scalar.unwrap_or(0.0),
                start_size: ps.startSizeX.scalar.unwrap_or(0.0), // Using X size
                start_color: ps.startColor.maxColor.clone(),
                gravity_modifier: ps.gravityModifier.scalar.unwrap_or(0.0),
                emission_rate: ps.emission.rateOverTime.scalar.unwrap_or(0.0),
                shape_type: ps.shape.shape_type,
            })
        } else {
            None
        };
        let mono_behaviours: Vec<SimplifiedMonoBehaviour> =
            if let Some(monos) = id_to_monos.get(&go_id) {
                monos
                    .iter()
                    .map(|mono| SimplifiedMonoBehaviour {
                        unit_id: mono.unit_id,
                        is_ui: mono.is_ui,
                        pause_update_ui: mono.pause_update_ui,
                        script_guid: mono.m_script.guid.clone().unwrap_or_default(),
                    })
                    .collect()
            } else {
                Vec::new()
            };
        let mut children = Vec::new();
        if let Some(trans_id) = go_id_to_trans_id.get(&go_id) {
            if let Some(trans) = id_to_trans.get(trans_id) {
                for child in &trans.m_children {
                    let child_trans_id = child.file_id;
                    let child_go_id = *trans_id_to_go_id.get(&child_trans_id).unwrap_or(&0);
                    if child_go_id != 0 {
                        children.push(build_node(
                            child_go_id,
                            id_to_go,
                            id_to_trans,
                            trans_id_to_go_id,
                            go_id_to_trans_id,
                            id_to_sprite,
                            id_to_animator,
                            id_to_particle,
                            id_to_monos,
                            project_path,
                        ));
                    }
                }
            }
        }
        HierarchyNode {
            name,
            r#type,
            is_active,
            transform,
            sprite_renderer,
            animator,
            particle_system,
            animation_clips: None, // TODO: Implement animation clips parsing from controller
            mono_behaviours,
            children,
        }
    }

    build_node(
        root_go_id,
        &id_to_go,
        &id_to_trans,
        &trans_id_to_go_id,
        &go_id_to_trans_id,
        &id_to_sprite,
        &id_to_animator,
        &id_to_particle,
        &id_to_monos,
        project_path,
    )
}

#[tauri::command]
pub async fn prefab_hierarchy(
    prefab_path: String,
    project_path: String,
) -> Result<HierarchyNode, String> {
    let prefab = read_prefab(prefab_path).await?;
    let hierarchy = build_hierarchy(&prefab, &project_path);
    Ok(hierarchy)
}

// Animation structures
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AnimationController {
    #[serde(rename = "fileID")]
    pub file_id: i64,
    pub guid: String,
    #[serde(rename = "type")]
    pub controller_type: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnimationClip {
    #[serde(rename = "m_ObjectHideFlags")]
    pub m_object_hide_flags: i64,
    #[serde(rename = "m_CorrespondingSourceObject", default)]
    pub m_corresponding_source_object: Option<FileReference>,
    #[serde(rename = "m_Name")]
    pub m_name: String,
    #[serde(rename = "m_Legacy")]
    pub m_legacy: i64,
    #[serde(rename = "m_Compressed")]
    pub m_compressed: i64,
    #[serde(rename = "m_UseHighQualityCurve")]
    pub m_use_high_quality_curve: i64,
    #[serde(rename = "m_RotationCurves")]
    pub m_rotation_curves: Vec<RotationCurve>,
    #[serde(rename = "m_CompressedRotationCurves")]
    pub m_compressed_rotation_curves: Vec<serde_json::Value>,
    #[serde(rename = "m_EulerCurves")]
    pub m_euler_curves: Vec<EulerCurve>,
    #[serde(rename = "m_PositionCurves")]
    pub m_position_curves: Vec<PositionCurve>,
    #[serde(rename = "m_ScaleCurves")]
    pub m_scale_curves: Vec<ScaleCurve>,
    #[serde(rename = "m_FloatCurves")]
    pub m_float_curves: Vec<FloatCurve>,
    #[serde(rename = "m_PPtrCurves")]
    pub m_pptr_curves: Vec<PPtrCurve>,
    #[serde(rename = "m_SampleRate", default)]
    pub m_sample_rate: Option<f64>,
    #[serde(rename = "m_WrapMode")]
    pub m_wrap_mode: i64,
    #[serde(rename = "m_Bounds")]
    pub m_bounds: AnimationBounds,
    #[serde(rename = "m_ClipBindingConstant")]
    pub m_clip_binding_constant: ClipBindingConstant,
    #[serde(rename = "m_AnimationClipSettings")]
    pub m_animation_clip_settings: Option<AnimationClipSettings>,
    #[serde(rename = "m_EditorCurves")]
    pub m_editor_curves: Vec<serde_json::Value>,
    #[serde(rename = "m_EulerEditorCurves")]
    pub m_euler_editor_curves: Vec<serde_json::Value>,
    #[serde(rename = "m_HasGenericRootTransform")]
    pub m_has_generic_root_transform: i64,
    #[serde(rename = "m_HasMotionFloatCurves")]
    pub m_has_motion_float_curves: i64,
    #[serde(rename = "m_Events")]
    pub m_events: Vec<AnimationEvent>,
    #[serde(rename = "m_PrefabAsset", default)]
    pub m_prefab_asset: Option<FileReference>,
    #[serde(rename = "m_PrefabInstance", default)]
    pub m_prefab_instance: Option<FileReference>,
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(flatten, default)]
    pub unknown: std::collections::HashMap<String, serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RotationCurve {
    pub curve: AnimationCurve,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EulerCurve {
    pub curve: Vector3AnimationCurve,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PositionCurve {
    pub curve: Vector3AnimationCurve,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ScaleCurve {
    pub curve: Vector3AnimationCurve,
    pub path: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FloatCurve {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub curve: AnimationCurve,
    pub path: String,
    pub attribute: String,
    #[serde(rename = "classID")]
    pub class_id: i64,
    pub script: FileReference,
    #[serde(default)]
    pub flags: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PPtrCurve {
    pub curve: Vec<PPtrKeyframe>,
    pub attribute: String,
    pub path: String,
    #[serde(rename = "classID")]
    pub class_id: i64,
    pub script: FileReference,
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(default)]
    pub flags: Option<i64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PPtrKeyframe {
    pub time: Option<f64>,
    pub value: MController,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnimationCurve {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_Curve")]
    pub m_curve: Vec<Keyframe>,
    #[serde(rename = "m_PreInfinity", default)]
    pub m_pre_infinity: i64,
    #[serde(rename = "m_PostInfinity", default)]
    pub m_post_infinity: i64,
    #[serde(rename = "m_RotationOrder", default)]
    pub m_rotation_order: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Keyframe {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub time: Option<f64>,
    pub value: Option<f64>,
    #[serde(rename = "inSlope")]
    pub in_slope: Option<f64>,
    #[serde(rename = "outSlope")]
    pub out_slope: Option<f64>,
    #[serde(rename = "tangentMode")]
    pub tangent_mode: i64,
    #[serde(rename = "weightedMode")]
    pub weighted_mode: i64,
    #[serde(rename = "inWeight")]
    pub in_weight: Option<f64>,
    #[serde(rename = "outWeight")]
    pub out_weight: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vector3Keyframe {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub time: Option<f64>,
    pub value: Vector3,
    #[serde(rename = "inSlope")]
    pub in_slope: Option<NullableVector3>,
    #[serde(rename = "outSlope")]
    pub out_slope: Option<NullableVector3>,
    #[serde(rename = "tangentMode")]
    pub tangent_mode: i64,
    #[serde(rename = "weightedMode")]
    pub weighted_mode: i64,
    #[serde(rename = "inWeight")]
    pub in_weight: Option<NullableVector3>,
    #[serde(rename = "outWeight")]
    pub out_weight: Option<NullableVector3>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Vector3AnimationCurve {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_Curve")]
    pub m_curve: Vec<Vector3Keyframe>,
    #[serde(rename = "m_PreInfinity")]
    pub m_pre_infinity: i64,
    #[serde(rename = "m_PostInfinity")]
    pub m_post_infinity: i64,
    #[serde(rename = "m_RotationOrder")]
    pub m_rotation_order: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnimationBounds {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_Center")]
    pub m_center: MSize,
    #[serde(rename = "m_Extent")]
    pub m_extent: MSize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ClipBindingConstant {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "genericBindings")]
    pub generic_bindings: Vec<GenericBinding>,
    #[serde(rename = "pptrCurveMapping")]
    pub pptr_curve_mapping: Vec<PPtrCurveMapping>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GenericBinding {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub path: i64,
    pub attribute: i64,
    pub script: FileReference,
    #[serde(rename = "typeID")]
    pub type_id: i64,
    #[serde(rename = "customType")]
    pub custom_type: i64,
    #[serde(rename = "isPPtrCurve")]
    pub is_pptr_curve: i64,
    #[serde(rename = "isIntCurve")]
    pub is_int_curve: i64,
    #[serde(rename = "isSerializeReferenceCurve")]
    pub is_serialize_reference_curve: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PPtrCurveMapping {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "fileID")]
    pub file_id: i64,
    pub guid: String,
    #[serde(rename = "type")]
    pub asset_type: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnimationClipSettings {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_AdditiveReferencePoseClip", default)]
    pub m_additive_reference_pose_clip: Option<FileReference>,
    #[serde(rename = "m_AdditiveReferencePoseTime")]
    pub m_additive_reference_pose_time: f64,
    #[serde(rename = "m_StartTime")]
    pub m_start_time: f64,
    #[serde(rename = "m_StopTime")]
    pub m_stop_time: f64,
    #[serde(rename = "m_OrientationOffsetY")]
    pub m_orientation_offset_y: f64,
    #[serde(rename = "m_Level")]
    pub m_level: f64,
    #[serde(rename = "m_CycleOffset")]
    pub m_cycle_offset: f64,
    #[serde(rename = "m_HasAdditiveReferencePose")]
    pub m_has_additive_reference_pose: i64,
    #[serde(rename = "m_LoopTime")]
    pub m_loop_time: i64,
    #[serde(rename = "m_LoopBlend")]
    pub m_loop_blend: i64,
    #[serde(rename = "m_LoopBlendOrientation")]
    pub m_loop_blend_orientation: i64,
    #[serde(rename = "m_LoopBlendPositionY")]
    pub m_loop_blend_position_y: i64,
    #[serde(rename = "m_LoopBlendPositionXZ")]
    pub m_loop_blend_position_xz: i64,
    #[serde(rename = "m_KeepOriginalOrientation")]
    pub m_keep_original_orientation: i64,
    #[serde(rename = "m_KeepOriginalPositionY")]
    pub m_keep_original_position_y: i64,
    #[serde(rename = "m_KeepOriginalPositionXZ")]
    pub m_keep_original_position_xz: i64,
    #[serde(rename = "m_HeightFromFeet", default)]
    pub m_height_from_feet: i64,
    #[serde(rename = "m_Mirror", default)]
    pub m_mirror: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AnimationEvent {
    pub time: f64,
    #[serde(rename = "functionName")]
    pub function_name: String,
    pub data: Option<String>,
    #[serde(rename = "objectReferenceParameter")]
    pub object_reference_parameter: FileReference,
    #[serde(rename = "floatParameter")]
    pub float_parameter: f64,
    #[serde(rename = "intParameter")]
    pub int_parameter: i64,
    #[serde(rename = "messageOptions")]
    pub message_options: i64,
}

// Particle System structures
#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ParticleSystem {
    #[serde(rename = "m_ObjectHideFlags")]
    pub m_object_hide_flags: i64,
    #[serde(rename = "m_CorrespondingSourceObject")]
    pub m_corresponding_source_object: MAvatar,
    #[serde(rename = "m_PrefabInstance")]
    pub m_prefab_instance: MAvatar,
    #[serde(rename = "m_PrefabAsset")]
    pub m_prefab_asset: MAvatar,
    #[serde(rename = "m_GameObject")]
    pub m_game_object: MAvatar,
    #[serde(rename = "m_Enabled")]
    pub m_enabled: i64,
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub lengthInSec: f64,
    pub simulationSpeed: f64,
    pub stopAction: i64,
    pub cullingMode: i64,
    pub ringBufferMode: i64,
    pub ringBufferLoopRange: MSize,
    pub looping: i64,
    pub prewarm: i64,
    pub playOnAwake: i64,
    pub useUnscaledTime: i64,
    pub autoRandomSeed: i64,
    pub useRigidbodyForVelocity: i64,
    pub startDelay: MinMaxCurve,
    pub startLifetime: MinMaxCurve,
    pub startSpeed: MinMaxCurve,
    pub startSize3D: i64,
    pub startSizeX: MinMaxCurve,
    pub startSizeY: MinMaxCurve,
    pub startSizeZ: MinMaxCurve,
    pub startRotation3D: i64,
    pub startRotationX: MinMaxCurve,
    pub startRotationY: MinMaxCurve,
    pub startRotationZ: MinMaxCurve,
    pub startColor: MinMaxGradient,
    pub gravityModifier: MinMaxCurve,
    pub shape: ParticleShape,
    pub emission: ParticleEmission,
    pub velocityOverLifetime: VelocityOverLifetime,
    pub limitVelocityOverLifetime: LimitVelocityOverLifetime,
    pub inheritVelocity: InheritVelocity,
    pub forceOverLifetime: ForceOverLifetime,
    pub colorOverLifetime: ColorOverLifetime,
    pub colorBySpeed: ColorBySpeed,
    pub sizeOverLifetime: SizeOverLifetime,
    pub sizeBySpeed: SizeBySpeed,
    pub rotationOverLifetime: RotationOverLifetime,
    pub rotationBySpeed: RotationBySpeed,
    pub externalForces: ExternalForces,
    pub noise: ParticleNoise,
    pub collision: ParticleCollision,
    pub trigger: ParticleTrigger,
    pub subEmitters: SubEmitters,
    pub textureSheetAnimation: TextureSheetAnimation,
    pub lights: ParticleLights,
    pub trails: ParticleTrails,
    pub customData: CustomData,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MinMaxCurve {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub minMaxState: i64,
    pub scalar: Option<f64>,
    pub minScalar: Option<f64>,
    pub maxCurve: AnimationCurve,
    pub minCurve: AnimationCurve,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct MinMaxGradient {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub minMaxState: i64,
    pub minColor: MColor,
    pub maxColor: MColor,
    pub maxGradient: Gradient,
    pub minGradient: Gradient,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Gradient {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub key0: GradientColorKey,
    pub key1: GradientColorKey,
    pub key2: GradientColorKey,
    pub key3: GradientColorKey,
    pub key4: GradientColorKey,
    pub key5: GradientColorKey,
    pub key6: GradientColorKey,
    pub key7: GradientColorKey,
    pub ctime0: u16,
    pub ctime1: u16,
    pub ctime2: u16,
    pub ctime3: u16,
    pub ctime4: u16,
    pub ctime5: u16,
    pub ctime6: u16,
    pub ctime7: u16,
    pub atime0: u16,
    pub atime1: u16,
    pub atime2: u16,
    pub atime3: u16,
    pub atime4: u16,
    pub atime5: u16,
    pub atime6: u16,
    pub atime7: u16,
    #[serde(rename = "m_Mode")]
    pub m_mode: i64,
    #[serde(rename = "m_NumColorKeys")]
    pub m_num_color_keys: i64,
    #[serde(rename = "m_NumAlphaKeys")]
    pub m_num_alpha_keys: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GradientColorKey {
    pub color: MColor,
    pub time: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleShape {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "type")]
    pub shape_type: i64,
    pub angle: Option<f64>,
    pub length: Option<f64>,
    pub boxThickness: MSize,
    pub radiusThickness: Option<f64>,
    pub donutRadius: Option<f64>,
    #[serde(rename = "m_Position")]
    pub m_position: MSize,
    #[serde(rename = "m_Rotation")]
    pub m_rotation: MSize,
    #[serde(rename = "m_Scale")]
    pub m_scale: MSize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleEmission {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub rateOverTime: MinMaxCurve,
    pub rateOverDistance: MinMaxCurve,
    #[serde(rename = "m_Bursts")]
    pub m_bursts: Vec<ParticleBurst>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleBurst {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub time: Option<f64>,
    pub countCurve: MinMaxCurve,
    pub cycleCount: i64,
    pub repeatInterval: Option<f64>,
    pub probability: Option<f64>,
}

// Additional particle system modules
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VelocityOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub radial: MinMaxCurve,
    pub speedModifier: MinMaxCurve,
    pub space: i64,
    pub orbitalX: MinMaxCurve,
    pub orbitalY: MinMaxCurve,
    pub orbitalZ: MinMaxCurve,
    pub orbitalOffsetX: MinMaxCurve,
    pub orbitalOffsetY: MinMaxCurve,
    pub orbitalOffsetZ: MinMaxCurve,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LimitVelocityOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub magnitude: MinMaxCurve,
    pub separateAxes: i64,
    pub space: i64,
    pub drag: MinMaxCurve,
    pub multiplyDragByParticleSize: i64,
    pub multiplyDragByParticleVelocity: i64,
    pub dampen: f64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct InheritVelocity {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "m_Mode")]
    pub m_mode: i64,
    #[serde(rename = "m_Curve")]
    pub m_curve: MinMaxCurve,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ForceOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub space: i64,
    pub randomizePerFrame: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColorOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub color: MinMaxGradient,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColorBySpeed {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub color: MinMaxGradient,
    pub range: MSize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SizeOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub size: MinMaxCurve,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub separateAxes: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SizeBySpeed {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub size: MinMaxCurve,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub separateAxes: i64,
    pub range: MSize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RotationOverLifetime {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub separateAxes: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct RotationBySpeed {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub x: MinMaxCurve,
    pub y: MinMaxCurve,
    pub z: MinMaxCurve,
    pub separateAxes: i64,
    pub range: MSize,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExternalForces {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub multiplier: f64,
    pub multiplierCurve: MinMaxCurve,
    pub influenceFilter: i64,
    pub influenceMask: LayerMask,
    pub influenceList: Vec<MController>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LayerMask {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    #[serde(rename = "m_Bits")]
    pub m_bits: u32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleNoise {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub strength: MinMaxCurve,
    pub strengthX: MinMaxCurve,
    pub strengthY: MinMaxCurve,
    pub strengthZ: MinMaxCurve,
    pub separateAxes: i64,
    pub frequency: Option<f64>,
    pub damping: i64,
    pub octaves: i64,
    pub octaveMultiplier: Option<f64>,
    pub octaveScale: Option<f64>,
    pub quality: i64,
    pub scrollSpeed: MinMaxCurve,
    pub scrollSpeedX: MinMaxCurve,
    pub scrollSpeedY: MinMaxCurve,
    pub scrollSpeedZ: MinMaxCurve,
    pub remapEnabled: i64,
    pub remap: MinMaxCurve,
    pub remapX: MinMaxCurve,
    pub remapY: MinMaxCurve,
    pub remapZ: MinMaxCurve,
    pub positionAmount: MinMaxCurve,
    pub rotationAmount: MinMaxCurve,
    pub sizeAmount: MinMaxCurve,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleCollision {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "type")]
    pub collision_type: i64,
    #[serde(rename = "mode")]
    pub collision_mode: i64,
    pub dampen: MinMaxCurve,
    pub bounce: MinMaxCurve,
    pub lifetimeLoss: MinMaxCurve,
    pub minKillSpeed: Option<f64>,
    pub maxKillSpeed: Option<f64>,
    pub radiusScale: Option<f64>,
    pub collidesWith: LayerMask,
    pub maxCollisionShapes: i64,
    pub quality: i64,
    pub voxelSize: Option<f64>,
    pub collisionMessages: i64,
    pub collidesWithDynamic: i64,
    pub interiorCollisions: i64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleTrigger {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub collidesWith: LayerMask,
    pub inside: i64,
    pub outside: i64,
    pub enter: i64,
    pub exit: i64,
    pub radiusScale: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubEmitters {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "m_SubEmitters")]
    pub m_sub_emitters: Vec<SubEmitter>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubEmitter {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub emitter: MController,
    #[serde(rename = "type")]
    pub sub_emitter_type: i64,
    pub properties: i64,
    pub emitProbability: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TextureSheetAnimation {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "mode")]
    pub animation_mode: i64,
    pub timeMode: i64,
    pub fps: Option<f64>,
    pub numTilesX: i64,
    pub numTilesY: i64,
    pub animation: i64,
    pub rowMode: i64,
    pub cycles: Option<f64>,
    pub uvChannelMask: i64,
    pub randomRow: i64,
    pub sprites: Vec<MController>,
    pub flipU: Option<f64>,
    pub flipV: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleLights {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    pub ratio: f64,
    pub randomDistribution: i64,
    pub color: i64,
    pub useRandomColorRange: i64,
    pub colorRangeHueMin: Option<f64>,
    pub colorRangeHueMax: Option<f64>,
    pub colorRangeSaturationMin: Option<f64>,
    pub colorRangeSaturationMax: Option<f64>,
    pub colorRangeValueMin: Option<f64>,
    pub colorRangeValueMax: Option<f64>,
    pub intensity: MinMaxCurve,
    pub range: MinMaxCurve,
    pub rangeCurve: MinMaxCurve,
    pub sizeAffectsRange: i64,
    pub alphaAffectsIntensity: i64,
    pub includeInBounding: i64,
    pub light: MController,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ParticleTrails {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
    #[serde(rename = "mode")]
    pub trail_mode: i64,
    pub ratio: Option<f64>,
    pub lifetime: MinMaxCurve,
    pub minVertexDistance: Option<f64>,
    pub textureMode: i64,
    pub worldSpace: i64,
    pub dieWithParticles: i64,
    pub sizeAffectsWidth: i64,
    pub sizeAffectsLifetime: i64,
    pub inheritParticleColor: i64,
    pub colorOverLifetime: MinMaxGradient,
    pub widthOverTrail: MinMaxCurve,
    pub colorOverTrail: MinMaxGradient,
    pub generateLightingData: i64,
    pub shadowBias: Option<f64>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CustomData {
    #[serde(rename = "serializedVersion", default)]
    pub serialized_version: Option<i64>,
    pub enabled: i64,
}
