use bevy::{
    prelude::*,
    sprite::{Material2d, Material2dKey},
    reflect::TypeUuid,
    render::{
        mesh::{InnerMeshVertexBufferLayout},
        render_resource::{
            AsBindGroup, ShaderRef, RenderPipelineDescriptor, SpecializedMeshPipelineError,
        },
    }, 
    utils::{Hashed, FixedState, },
};

mod framecount;

pub use framecount::*;

// Materials definitions in render order.

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4cc9c363-1124-4113-890e-199d81b00281"]
pub struct AfterglowMaterial {
    #[texture(0)]
    #[sampler(1)]
    pub source_image: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
    #[texture(3)]
    #[sampler(4)]
    pub feedback: Handle<Image>,
}

impl Material2d for AfterglowMaterial {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/afterglow.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4dd9c363-1124-4113-890e-199d81b00281"]
pub struct PreMaterial {
    #[texture(0)]
    #[sampler(1)]
    pub source_image: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
    #[texture(3)]
    #[sampler(4)]
    pub afterglow: Handle<Image>,
}

impl Material2d for PreMaterial {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/preshader.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid, Component)]
#[uuid = "4ff9c363-1124-4113-890e-199d81b00281"]
pub struct LinearizeMaterial {
    #[texture(0)]
    #[sampler(1)]
    pub source_image: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
}

impl Material2d for LinearizeMaterial {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/linearize.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4ee9c363-1124-4113-890e-199d81b00281"]
pub struct PostMaterial {
    #[texture(0)]
    #[sampler(1)]
    pub linearize_pass: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
}

impl Material2d for PostMaterial {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/pass1.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4ffac363-1124-4113-890e-199d81b00281"]
pub struct BloomHorizontal {
    #[texture(0)]
    #[sampler(1)]
    pub linearize_pass: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
}

impl Material2d for BloomHorizontal {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/bloom_horizontal.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4ffbc363-1124-4113-890e-199d81b00281"]
pub struct BloomVertical {
    #[texture(0)]
    #[sampler(1)]
    pub source_image: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
}

impl Material2d for BloomVertical {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/bloom_vertical.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4bb9c363-1124-4113-890e-199d81b00281"]
pub struct PostMaterial2 {
    #[texture(0)]
    #[sampler(1)]
    pub pass_1: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
    #[texture(3)]
    #[sampler(4)]
    pub linearize_pass: Handle<Image>,
}

impl Material2d for PostMaterial2 {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/pass2.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}

#[derive(AsBindGroup, Clone, TypeUuid)]
#[uuid = "4ffcc363-1124-4113-890e-199d81b00281"]
pub struct DeconvergenceMaterial {
    #[texture(0)]
    #[sampler(1)]
    pub source_image: Handle<Image>,
    #[uniform(2)]
    pub texture_size: Vec2,
    #[texture(3)]
    #[sampler(4)]
    pub linearize_pass: Handle<Image>,
    #[texture(5)]
    #[sampler(6)]
    pub bloom_pass: Handle<Image>,
    #[texture(7)]
    #[sampler(8)]
    pub pre_pass: Handle<Image>,
}

impl Material2d for DeconvergenceMaterial {
    fn vertex_shader() -> ShaderRef {
        "shaders/hyllian/crt-hyllian.vert".into()
    }

    fn fragment_shader() -> ShaderRef {
        "shaders/crt-guest-advanced-hd/deconvergence.frag".into()
    }

    fn specialize(
        descriptor: &mut RenderPipelineDescriptor,
        _layout: &Hashed<InnerMeshVertexBufferLayout, FixedState>,
        _key: Material2dKey<Self>,
    ) -> Result<(), SpecializedMeshPipelineError> {
        descriptor.vertex.entry_point = "main".into();
        descriptor.fragment.as_mut().unwrap().entry_point = "main".into();
        Ok(())
    }
}