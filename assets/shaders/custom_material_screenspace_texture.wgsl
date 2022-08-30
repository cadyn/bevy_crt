#import bevy_pbr::mesh_view_bindings
struct CustomMaterial {
    color: vec4<f32>,
};

@group(1) @binding(0)
var<uniform> material: CustomMaterial;
@group(1) @binding(1)
var color_texture: texture_2d<f32>;
@group(1) @binding(2)
var color_sampler: sampler;

@fragment
fn fragment(
    @builtin(position) position: vec4<f32>,
    @location(0) world_position: vec4<f32>,
    @location(1) world_normal: vec3<f32>,
    @location(2) uv: vec2<f32>,
    @location(4) color: vec4<f32>,
) -> @location(0) vec4<f32> {
    let uv = position.xy / vec2<f32>(view.width, view.height);
    let color = textureSample(color_texture, color_sampler, uv);
    return color;
}
