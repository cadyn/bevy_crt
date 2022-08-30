use std::{marker::PhantomData, hash::Hash};

use bevy::{
    core_pipeline::core_2d::Transparent2d,
    prelude::*,
    sprite::{
        Mesh2dHandle, Material2d, Material2dKey, Mesh2dPipeline, Mesh2dPipelineKey, SetMesh2dBindGroup, 
        SetMesh2dViewBindGroup, DrawMesh2d, Mesh2dUniform, SetMaterial2dBindGroup, RenderMaterials2d, PreparedMaterial2d, 
    },
    render::{
        render_phase::{
            AddRenderCommand
        },
        mesh::MeshVertexBufferLayout,
        render_resource::{
            ShaderRef, RenderPipelineDescriptor, SpecializedMeshPipelineError, BufferDescriptor, BufferUsages, 
            SpecializedMeshPipelines, PipelineCache, Buffer, BindGroup, BindGroupDescriptor, BindGroupEntry, BindGroupLayout, 
            BindGroupLayoutDescriptor, BindGroupLayoutEntry, ShaderStages, BindingType, BufferBindingType, SpecializedMeshPipeline, BufferSize,
        },
        texture::FallbackImage,
        render_resource::*,
        view::{Msaa, VisibleEntities}, 
        renderer::{RenderDevice, RenderQueue}, 
        extract_component::ExtractComponentPlugin, 
        RenderApp, RenderStage, 
        render_phase::{DrawFunctions, RenderPhase, SetItemPipeline, EntityRenderCommand, TrackedRenderPass, RenderCommandResult}, 
        extract_resource::{ExtractResourcePlugin, ExtractResource}, 
        render_asset::{RenderAssets, PrepareAssetLabel}, 
        Extract,
    }, 
    utils::{FloatOrd, HashSet}, 
    ecs::system::{lifetimeless::SRes, SystemParamItem}, 
    diagnostic::{FrameTimeDiagnosticsPlugin, Diagnostics},
};


// This is how we get the framecount into our shaders.
#[derive(Default)]
struct ExtractedFrameCount {
    framecount: u32
}

impl ExtractResource for ExtractedFrameCount {
    type Source = Diagnostics;

    fn extract_resource(diagnostics: &Self::Source) -> Self {
        // The measurement might not be added yet, so just return 0 if it isn't.
        let framecount = match diagnostics.get_measurement(FrameTimeDiagnosticsPlugin::FRAME_COUNT) {
            Some(val) => val.value as u32,
            None => 0u32,
        };
        ExtractedFrameCount {
            framecount
        }
    }
}

pub struct Framecount2dPipeline<M: Material2d> {
    pub mesh2d_pipeline: Mesh2dPipeline,
    pub material2d_layout: BindGroupLayout,
    pub framecount_layout: BindGroupLayout,
    pub vertex_shader: Option<Handle<Shader>>,
    pub fragment_shader: Option<Handle<Shader>>,
    marker: PhantomData<M>,
}

// Most of this code is just copied from the bevy code itself for the generalized Material2d pipeline.
// With small additions to support us passing the framecount.
impl<M: Material2d> SpecializedMeshPipeline for Framecount2dPipeline<M>
where
    M::Data: PartialEq + Eq + Hash + Clone,
{
    type Key = Material2dKey<M>;

    fn specialize(
        &self,
        key: Self::Key,
        layout: &MeshVertexBufferLayout,
    ) -> Result<RenderPipelineDescriptor, SpecializedMeshPipelineError> {
        let mut descriptor = self.mesh2d_pipeline.specialize(key.mesh_key, layout)?;
        if let Some(vertex_shader) = &self.vertex_shader {
            descriptor.vertex.shader = vertex_shader.clone();
        }

        if let Some(fragment_shader) = &self.fragment_shader {
            descriptor.fragment.as_mut().unwrap().shader = fragment_shader.clone();
        }
        //Framecount is added to binding 3
        descriptor.layout = Some(vec![
            self.mesh2d_pipeline.view_layout.clone(),
            self.material2d_layout.clone(),
            self.mesh2d_pipeline.mesh_layout.clone(),
            self.framecount_layout.clone(),
        ]);

        M::specialize(&mut descriptor, layout, key)?;
        Ok(descriptor)
    }
}

impl<M: Material2d> FromWorld for Framecount2dPipeline<M> {
    fn from_world(world: &mut World) -> Self {
        let asset_server = world.resource::<AssetServer>();
        let render_device = world.resource::<RenderDevice>();
        let material2d_layout = M::bind_group_layout(render_device);
        let framecount_layout = render_device.create_bind_group_layout(&BindGroupLayoutDescriptor {
            label: None,
            entries: &[BindGroupLayoutEntry {
                binding: 0,
                visibility: ShaderStages::FRAGMENT,
                ty: BindingType::Buffer {
                    ty: BufferBindingType::Uniform,
                    has_dynamic_offset: false,
                    min_binding_size: BufferSize::new(std::mem::size_of::<u32>() as u64),
                },
                count: None,
            }],
        });
        Framecount2dPipeline {
            mesh2d_pipeline: world.resource::<Mesh2dPipeline>().clone(),
            material2d_layout,
            framecount_layout,
            vertex_shader: match M::vertex_shader() {
                ShaderRef::Default => None,
                ShaderRef::Handle(handle) => Some(handle),
                ShaderRef::Path(path) => Some(asset_server.load(path)),
            },
            fragment_shader: match M::fragment_shader() {
                ShaderRef::Default => None,
                ShaderRef::Handle(handle) => Some(handle),
                ShaderRef::Path(path) => Some(asset_server.load(path)),
            },
            marker: PhantomData,
        }
    }
}

//Keeps track of the buffer and bindgroup that we use.
struct FrameMeta {
    buffer: Buffer,
    bind_group: Option<BindGroup>,
}

struct PrepareNextFrameMaterials<M: Material2d> {
    assets: Vec<(Handle<M>, M)>,
}

impl<M: Material2d> Default for PrepareNextFrameMaterials<M> {
    fn default() -> Self {
        Self {
            assets: Default::default(),
        }
    }
}


fn queue_frame_bind_group<M: Material2d>(
    render_device: Res<RenderDevice>,
    mut frame_meta: ResMut<FrameMeta>,
    pipeline: Res<Framecount2dPipeline<M>>,
) {
    let bind_group = render_device.create_bind_group(&BindGroupDescriptor {
        label: None,
        layout: &pipeline.framecount_layout,
        entries: &[BindGroupEntry {
            binding: 0,
            resource: frame_meta.buffer.as_entire_binding(),
        }],
    });
    frame_meta.bind_group = Some(bind_group);
}

fn prepare_frames(
    framecount: Res<ExtractedFrameCount>,
    frame_meta: ResMut<FrameMeta>,
    render_queue: Res<RenderQueue>,
) {
    render_queue.write_buffer(
        &frame_meta.buffer,
        0,
        bevy::core::cast_slice(&[framecount.framecount]),
    );
}

/// Generalized custom pipeline with framecount resource
pub struct Framecount2dPlugin<M: Material2d>(PhantomData<M>);

impl<M: Material2d> Default for Framecount2dPlugin<M> {
    fn default() -> Self {
        Self(Default::default())
    }
}

impl<M: Material2d> Plugin for Framecount2dPlugin<M>
where
    M::Data: PartialEq + Eq + Hash + Clone,
{
    fn build(&self, app: &mut App) {
        let render_device = app.world.resource::<RenderDevice>();
        let buffer = render_device.create_buffer(&BufferDescriptor {
            label: Some("frame count uniform buffer"),
            size: std::mem::size_of::<u32>() as u64,
            usage: BufferUsages::UNIFORM | BufferUsages::COPY_DST,
            mapped_at_creation: false,
        });
        app.add_asset::<M>()
            .add_plugin(ExtractComponentPlugin::<Handle<M>>::extract_visible())
            .add_plugin(ExtractResourcePlugin::<ExtractedFrameCount>::default());
        if let Ok(render_app) = app.get_sub_app_mut(RenderApp) {
            render_app
                .add_render_command::<Transparent2d, DrawFramecount2d<M>>()
                .insert_resource(FrameMeta {
                    buffer,
                    bind_group: None,
                })
                .init_resource::<Framecount2dPipeline<M>>()
                .init_resource::<ExtractedMaterials2d<M>>()
                .init_resource::<RenderMaterials2d<M>>()
                .init_resource::<SpecializedMeshPipelines<Framecount2dPipeline<M>>>()
                .add_system_to_stage(RenderStage::Extract, extract_materials_2d::<M>)
                .add_system_to_stage(
                    RenderStage::Prepare,
                    prepare_materials_2d::<M>.after(PrepareAssetLabel::PreAssetPrepare),
                )
                .add_system_to_stage(RenderStage::Prepare, prepare_frames)
                .add_system_to_stage(RenderStage::Queue, queue_framecount2d_meshes::<M>)
                .add_system_to_stage(RenderStage::Queue, queue_frame_bind_group::<M>);
        }
    }
}


type DrawFramecount2d<M> = (
    SetItemPipeline,
    SetMesh2dViewBindGroup<0>,
    SetMaterial2dBindGroup<M, 1>,
    SetMesh2dBindGroup<2>,
    SetFrameBindGroup<3>,
    DrawMesh2d,
);

struct ExtractedMaterials2d<M: Material2d> {
    extracted: Vec<(Handle<M>, M)>,
    removed: Vec<Handle<M>>,
}

impl<M: Material2d> Default for ExtractedMaterials2d<M> {
    fn default() -> Self {
        Self {
            extracted: Default::default(),
            removed: Default::default(),
        }
    }
}

struct SetFrameBindGroup<const I: usize>;

impl<const I: usize> EntityRenderCommand for SetFrameBindGroup<I> {
    type Param = SRes<FrameMeta>;

    fn render<'w>(
        _view: Entity,
        _item: Entity,
        frame_meta: SystemParamItem<'w, '_, Self::Param>,
        pass: &mut TrackedRenderPass<'w>,
    ) -> RenderCommandResult {
        let frame_bind_group = frame_meta.into_inner().bind_group.as_ref().unwrap();
        pass.set_bind_group(I, frame_bind_group, &[]);

        RenderCommandResult::Success
    }
}



fn extract_materials_2d<M: Material2d>(
    mut commands: Commands,
    mut events: Extract<EventReader<AssetEvent<M>>>,
    assets: Extract<Res<Assets<M>>>,
) {
    let mut changed_assets = HashSet::default();
    let mut removed = Vec::new();
    for event in events.iter() {
        match event {
            AssetEvent::Created { handle } | AssetEvent::Modified { handle } => {
                changed_assets.insert(handle.clone_weak());
            }
            AssetEvent::Removed { handle } => {
                changed_assets.remove(handle);
                removed.push(handle.clone_weak());
            }
        }
    }

    let mut extracted_assets = Vec::new();
    for handle in changed_assets.drain() {
        if let Some(asset) = assets.get(&handle) {
            extracted_assets.push((handle, asset.clone()));
        }
    }

    commands.insert_resource(ExtractedMaterials2d {
        extracted: extracted_assets,
        removed,
    });
}


/// This system prepares all assets of the corresponding [`Material2d`] type
/// which where extracted this frame for the GPU.
fn prepare_materials_2d<M: Material2d>(
    mut prepare_next_frame: Local<PrepareNextFrameMaterials<M>>,
    mut extracted_assets: ResMut<ExtractedMaterials2d<M>>,
    mut render_materials: ResMut<RenderMaterials2d<M>>,
    render_device: Res<RenderDevice>,
    images: Res<RenderAssets<Image>>,
    fallback_image: Res<FallbackImage>,
    pipeline: Res<Framecount2dPipeline<M>>,
) {
    let mut queued_assets = std::mem::take(&mut prepare_next_frame.assets);
    for (handle, material) in queued_assets.drain(..) {
        match prepare_material2d(
            &material,
            &render_device,
            &images,
            &fallback_image,
            &pipeline,
        ) {
            Ok(prepared_asset) => {
                render_materials.insert(handle, prepared_asset);
            }
            Err(AsBindGroupError::RetryNextUpdate) => {
                prepare_next_frame.assets.push((handle, material));
            }
        }
    }

    for removed in std::mem::take(&mut extracted_assets.removed) {
        render_materials.remove(&removed);
    }

    for (handle, material) in std::mem::take(&mut extracted_assets.extracted) {
        match prepare_material2d(
            &material,
            &render_device,
            &images,
            &fallback_image,
            &pipeline,
        ) {
            Ok(prepared_asset) => {
                render_materials.insert(handle, prepared_asset);
            }
            Err(AsBindGroupError::RetryNextUpdate) => {
                prepare_next_frame.assets.push((handle, material));
            }
        }
    }
}

fn prepare_material2d<M: Material2d>(
    material: &M,
    render_device: &RenderDevice,
    images: &RenderAssets<Image>,
    fallback_image: &FallbackImage,
    pipeline: &Framecount2dPipeline<M>,
) -> Result<PreparedMaterial2d<M>, AsBindGroupError> {
    let prepared = material.as_bind_group(
        &pipeline.material2d_layout,
        render_device,
        images,
        fallback_image,
    )?;
    Ok(PreparedMaterial2d {
        bindings: prepared.bindings,
        bind_group: prepared.bind_group,
        key: prepared.data,
    })
}


#[allow(clippy::too_many_arguments)]
pub fn queue_framecount2d_meshes<M: Material2d>(
    transparent_draw_functions: Res<DrawFunctions<Transparent2d>>,
    material2d_pipeline: Res<Framecount2dPipeline<M>>,
    mut pipelines: ResMut<SpecializedMeshPipelines<Framecount2dPipeline<M>>>,
    mut pipeline_cache: ResMut<PipelineCache>,
    msaa: Res<Msaa>,
    render_meshes: Res<RenderAssets<Mesh>>,
    render_materials: Res<RenderMaterials2d<M>>,
    material2d_meshes: Query<(&Handle<M>, &Mesh2dHandle, &Mesh2dUniform)>,
    mut views: Query<(&VisibleEntities, &mut RenderPhase<Transparent2d>)>,
) where
    M::Data: PartialEq + Eq + Hash + Clone,
{
    if material2d_meshes.is_empty() {
        return;
    }
    for (visible_entities, mut transparent_phase) in &mut views {
        let draw_transparent_pbr = transparent_draw_functions
            .read()
            .get_id::<DrawFramecount2d<M>>()
            .unwrap();

        let msaa_key = Mesh2dPipelineKey::from_msaa_samples(msaa.samples);

        for visible_entity in &visible_entities.entities {
            if let Ok((material2d_handle, mesh2d_handle, mesh2d_uniform)) =
                material2d_meshes.get(*visible_entity)
            {
                if let Some(material2d) = render_materials.get(material2d_handle) {
                    if let Some(mesh) = render_meshes.get(&mesh2d_handle.0) {
                        let mesh_key = msaa_key
                            | Mesh2dPipelineKey::from_primitive_topology(mesh.primitive_topology);

                        let pipeline_id = pipelines.specialize(
                            &mut pipeline_cache,
                            &material2d_pipeline,
                            Material2dKey {
                                mesh_key,
                                bind_group_data: material2d.key.clone(),
                            },
                            &mesh.layout,
                        );

                        let pipeline_id = match pipeline_id {
                            Ok(id) => id,
                            Err(err) => {
                                error!("{}", err);
                                continue;
                            }
                        };

                        let mesh_z = mesh2d_uniform.transform.w_axis.z;
                        transparent_phase.add(Transparent2d {
                            entity: *visible_entity,
                            draw_function: draw_transparent_pbr,
                            pipeline: pipeline_id,
                            // NOTE: Back-to-front ordering for transparent with ascending sort means far should have the
                            // lowest sort key and getting closer should increase. As we have
                            // -z in front of the camera, the largest distance is -far with values increasing toward the
                            // camera. As such we can just use mesh_z as the distance
                            sort_key: FloatOrd(mesh_z),
                            // This material is not batched
                            batch_range: None,
                        });
                    }
                }
            }
        }
    }
}