use bevy::{
    prelude::*,
    sprite::{MaterialMesh2dBundle, Material2d, Material2dPlugin,},
    render::{
        camera::{Camera, RenderTarget},
        render_resource::{
            Extent3d, TextureDescriptor, TextureDimension, TextureFormat,
            TextureUsages, BufferDescriptor, BufferUsages, Buffer,
        },
        texture::BevyDefault,
        render_resource::*,
        view::RenderLayers, 
        renderer::{RenderDevice, RenderQueue}, 
        RenderApp, 
        RenderStage, 
        extract_resource::{ExtractResourcePlugin, ExtractResource}, 
        render_asset::{RenderAssets, PrepareAssetLabel},
    }, 
    diagnostic::{FrameTimeDiagnosticsPlugin, Diagnostics, Diagnostic},
};

use super::materials::*;

fn build_common(app: &mut App){
    app.insert_resource(AfterglowImages::default())
        .add_plugin(FrameTimeDiagnosticsPlugin)
        .add_plugin(Material2dPlugin::<AfterglowMaterial>::default())
        .add_plugin(Material2dPlugin::<PreMaterial>::default())
        .add_plugin(Framecount2dPlugin::<LinearizeMaterial>::default())
        .add_plugin(Material2dPlugin::<PostMaterial>::default())
        .add_plugin(Material2dPlugin::<BloomHorizontal>::default())
        .add_plugin(Material2dPlugin::<BloomVertical>::default())
        .add_plugin(Material2dPlugin::<PostMaterial2>::default())
        .add_plugin(Framecount2dPlugin::<DeconvergenceMaterial>::default())
        .add_plugin(ExtractResourcePlugin::<ExtractedAfterglowImages>::default())
        .add_startup_system(start_framecount);
    let render_device = app.world.resource::<RenderDevice>();
    let mut fbuffer = FrameBuffer::default();
    for i in 0..fbuffer.len(){
        fbuffer[i] = Some(render_device.create_buffer(&BufferDescriptor {
            label: Some(&format!("frame {} buffer",i)),
            size: 20000000, //About 20mb, enough for a 2048x2048 texture with uncompressed RGBA encoding with some wiggle room
            usage: BufferUsages::STORAGE | BufferUsages::COPY_DST | BufferUsages::COPY_SRC | BufferUsages::MAP_READ | BufferUsages::MAP_WRITE,
            mapped_at_creation: false,
        }));
    }
    if let Ok(render_app) = app.get_sub_app_mut(RenderApp) {
        render_app.insert_resource(fbuffer);
        render_app.add_system_to_stage(
            RenderStage::Prepare,
            imagecopysystem.after(PrepareAssetLabel::PreAssetPrepare),
        );
    }
}

/// Plugin creates a [`Camera2dBundle`] with a [`PrimaryCamera`] component attached.
/// Camera renders to an image which is then processed using the CRT effect before being rendered to the screen.
pub struct Crt2dPlugin;

impl Plugin for Crt2dPlugin {
    fn build(&self, app: &mut App) {
        app.add_startup_system(setup_post_2d);
        build_common(app);
    }
}

/// Plugin creates a [`Camera3dBundle`] with a [`PrimaryCamera`] component attached.
/// Camera renders to an image which is then processed using the CRT effect before being rendered to the screen.
pub struct Crt3dPlugin;

impl Plugin for Crt3dPlugin {
    fn build(&self, app: &mut App) {
        app.add_startup_system(setup_post_3d);
        build_common(app);
    }
}

/// This component is attached to the [`Camera2dBundle`] or [`Camera3dBundle`] by the respective CRT Effect plugin.
/// You can use this component to query for and make changes to the camera.
/// You must use this provided camera for the CRT effect to work, however you can modify as long as you do not change the RenderTarget.
#[derive(Component,Default)]
pub struct PrimaryCamera;

#[derive(Deref,DerefMut,Default)]
struct FrameBuffer([Option<Buffer>;3]);

#[derive(Component,Default)]
pub struct AfterglowImages{
    pub out_handle: Option<Handle<Image>>,
    pub in_handle: Option<Handle<Image>>,
    pub source_handle: Option<Handle<Image>>,
    pub frame_buffer: [Handle<Image>;3],
}

#[derive(Default)]
struct ExtractedAfterglowImages {
    out_handle: Option<Handle<Image>>,
    in_handle: Option<Handle<Image>>,
    source_handle: Option<Handle<Image>>,
    frame_buffer: [Handle<Image>;3],
}

impl ExtractResource for ExtractedAfterglowImages {
    type Source = AfterglowImages;

    fn extract_resource(afterglow: &Self::Source) -> Self {
        ExtractedAfterglowImages {
            in_handle: afterglow.in_handle.clone(),
            out_handle: afterglow.out_handle.clone(),
            source_handle: afterglow.source_handle.clone(),
            frame_buffer: afterglow.frame_buffer.clone(),
        }
    }
}

fn imagecopysystem(
    afterglow: ResMut<ExtractedAfterglowImages>,
    images: ResMut<RenderAssets<Image>>,
    rdevice: Res<RenderDevice>,
    rqueue: Res<RenderQueue>,
    fbuffer: Res<FrameBuffer>,
) {
    if let (Some(image_out_handle), Some(image_in_handle), Some(image_source_handle)) = (afterglow.out_handle.as_ref(), afterglow.in_handle.as_ref(), afterglow.source_handle.as_ref()) {
        let image_out = images.get(image_out_handle).unwrap();
        let image_in = images.get(image_in_handle).unwrap();
        let image_source = images.get(image_source_handle).unwrap();
        let mut command_encoder = rdevice.wgpu_device().create_command_encoder(&CommandEncoderDescriptor { label: Some("Afterglow Copier") });

        //Frame copy buffer
        let mut fcbuffer: [Option<ImageCopyBuffer>; 5] = [None, None, None, None, None];

        for i in 0..fbuffer.len(){
            if let Some(buffer) = &fbuffer[i] {
                fcbuffer[i] = Some(ImageCopyBuffer{
                    buffer: buffer,
                    layout: ImageDataLayout { offset: 0, bytes_per_row: std::num::NonZeroU32::new(8192), rows_per_image: std::num::NonZeroU32::new(2048) },
                });
            }
        }
        
        command_encoder.copy_texture_to_texture(image_out.texture.as_image_copy(), image_in.texture.as_image_copy(), Extent3d{width: image_out.size.x as u32, height: image_out.size.y as u32, ..default()});

        if let Some(buffer) = fcbuffer[0].clone() {
            command_encoder.copy_texture_to_buffer(image_source.texture.as_image_copy(), buffer, Extent3d{width: image_out.size.x as u32, height: image_out.size.y as u32, ..default()})
        }

        for i in 0..(fbuffer.len()-1) {
            if let (Some(buffer_out),Some(buffer_in)) = (&fbuffer[i],&fbuffer[i+1]){
                command_encoder.copy_buffer_to_buffer(buffer_out,0u64, buffer_in, 0u64, 20000000u64);
            }
        }

        //Used to copy all frames out of the buffer, but we can save performance by only copying the last once, since it's the one we use.
        //Keeping this here in case more frames are ever needed.
        /*for i in 0..fcbuffer.len(){
            if let Some(buffer_out) = fcbuffer[i].clone() {
                let image_in = images.get(&afterglow.frame_buffer[i]).unwrap();
                command_encoder.copy_buffer_to_texture(buffer_out, image_in.texture.as_image_copy(), Extent3d{width: image_out.size.x as u32, height: image_out.size.y as u32, ..default()})
            }
        }*/
        if let Some(buffer_out) = fcbuffer[2].clone() {
            let image_in = images.get(&afterglow.frame_buffer[2]).unwrap();
            command_encoder.copy_buffer_to_texture(buffer_out, image_in.texture.as_image_copy(), Extent3d{width: image_out.size.x as u32, height: image_out.size.y as u32, ..default()})
        }


        rqueue.submit(std::iter::once(command_encoder.finish()));
    }
}

// Used to decrease redundancy by putting all of the details of image creation into a function.
fn new_render_image(size: Extent3d, images: &mut ResMut<Assets<Image>>) -> Handle<Image> {
    
    let mut new_image = Image {
        texture_descriptor: TextureDescriptor {
            label: None,
            size,
            dimension: TextureDimension::D2,
            format: TextureFormat::bevy_default(),
            mip_level_count: 1,
            sample_count: 1,
            usage: TextureUsages::TEXTURE_BINDING
                | TextureUsages::COPY_DST
                | TextureUsages::COPY_SRC
                | TextureUsages::RENDER_ATTACHMENT,
        },
        ..default()
    };

    new_image.resize(size);

    images.add(new_image)
}

// This used to be inside of the setup function, but at some point we had too many arguments and bevy wouldn't run the system.
// We may have enough arguments to spare now, but it feels fitting to leave it as its own setup system.
fn start_framecount(mut diagnostics: ResMut<Diagnostics>,) 
{
    diagnostics.add(Diagnostic::new(FrameTimeDiagnosticsPlugin::FRAME_COUNT,"frame count",2048));
}

/// Main setup system for [`Crt3dPlugin`]
/// Put any setup systems which need the camera created here, or other resources after this.
pub fn setup_post_3d (
    afterglowimages: ResMut<AfterglowImages>,
    mut commands: Commands,
    meshes: ResMut<Assets<Mesh>>,
    mut windows: ResMut<Windows>,
    afterglow_materials: ResMut<Assets<AfterglowMaterial>>,
    pre_materials: ResMut<Assets<PreMaterial>>,
    linearize_materials: ResMut<Assets<LinearizeMaterial>>,
    post_materials: ResMut<Assets<PostMaterial>>,
    bloomh_materials: ResMut<Assets<BloomHorizontal>>,
    bloomv_materials: ResMut<Assets<BloomVertical>>,
    post2_materials: ResMut<Assets<PostMaterial2>>,
    decon_materials: ResMut<Assets<DeconvergenceMaterial>>,
    mut images: ResMut<Assets<Image>>,
) {
    let window = windows.get_primary_mut().unwrap();
    let size = Extent3d {
        width: window.physical_width(),
        height: window.physical_height(),
        ..default()
    };

    //
    // Images
    //

    // This is the texture that will be rendered to by the main camera.

    let image_source_handle = new_render_image(size, &mut images);
    
    commands.spawn_bundle(Camera3dBundle{
        camera: Camera {
            target: RenderTarget::Image(image_source_handle.clone()),
            ..default()
        },
        ..default()
    }).insert(PrimaryCamera);

    setup_post_common(
        afterglowimages,
        commands,
        meshes,
        afterglow_materials,
        pre_materials,
        linearize_materials,
        post_materials,
        bloomh_materials,
        bloomv_materials,
        post2_materials,
        decon_materials,
        images,
        image_source_handle,
        size,
        window
    );
}

/// Main setup system for [`Crt2dPlugin`]
/// Put any setup systems which need the camera created here, or other resources after this.
pub fn setup_post_2d (
    afterglowimages: ResMut<AfterglowImages>,
    mut commands: Commands,
    meshes: ResMut<Assets<Mesh>>,
    mut windows: ResMut<Windows>,
    afterglow_materials: ResMut<Assets<AfterglowMaterial>>,
    pre_materials: ResMut<Assets<PreMaterial>>,
    linearize_materials: ResMut<Assets<LinearizeMaterial>>,
    post_materials: ResMut<Assets<PostMaterial>>,
    bloomh_materials: ResMut<Assets<BloomHorizontal>>,
    bloomv_materials: ResMut<Assets<BloomVertical>>,
    post2_materials: ResMut<Assets<PostMaterial2>>,
    decon_materials: ResMut<Assets<DeconvergenceMaterial>>,
    mut images: ResMut<Assets<Image>>,
) {
    let window = windows.get_primary_mut().unwrap();
    let size = Extent3d {
        width: window.physical_width(),
        height: window.physical_height(),
        ..default()
    };

    //
    // Images
    //

    // This is the texture that will be rendered to by the main camera.

    let image_source_handle = new_render_image(size, &mut images);
    
    commands.spawn_bundle(Camera2dBundle{
        camera: Camera {
            target: RenderTarget::Image(image_source_handle.clone()),
            ..default()
        },
        ..default()
    }).insert(PrimaryCamera);

    setup_post_common(
        afterglowimages,
        commands,
        meshes,
        afterglow_materials,
        pre_materials,
        linearize_materials,
        post_materials,
        bloomh_materials,
        bloomv_materials,
        post2_materials,
        decon_materials,
        images,
        image_source_handle,
        size,
        window
    );
}

// Setup used by both the 2d and 3d setup systems.
// Used to reduce redundancy.
fn setup_post_common (
    mut afterglowimages: ResMut<AfterglowImages>,
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut afterglow_materials: ResMut<Assets<AfterglowMaterial>>,
    mut pre_materials: ResMut<Assets<PreMaterial>>,
    mut linearize_materials: ResMut<Assets<LinearizeMaterial>>,
    mut post_materials: ResMut<Assets<PostMaterial>>,
    mut bloomh_materials: ResMut<Assets<BloomHorizontal>>,
    mut bloomv_materials: ResMut<Assets<BloomVertical>>,
    mut post2_materials: ResMut<Assets<PostMaterial2>>,
    mut decon_materials: ResMut<Assets<DeconvergenceMaterial>>,
    mut images: ResMut<Assets<Image>>,
    image_source_handle: Handle<Image>,
    size: Extent3d,
    window: &Window,
) {
    // Afterglow images

    let image_afterglow_out_handle = new_render_image(size, &mut images);
    let image_afterglow_in_handle = new_render_image(size, &mut images);

    afterglowimages.out_handle = Some(image_afterglow_out_handle.clone());
    afterglowimages.in_handle = Some(image_afterglow_in_handle.clone());
    afterglowimages.source_handle = Some(image_source_handle.clone());

    for i in 0..afterglowimages.frame_buffer.len() {
        afterglowimages.frame_buffer[i] = new_render_image(size, &mut images);
    }

    // Pre image

    let image_pre_handle = new_render_image(size, &mut images);

    //Linearize image

    let image_linearize_handle = new_render_image(size, &mut images);

    // Pass1 image

    let image_pass1_handle = new_render_image(size, &mut images);

    // Horizontal bloom image

    let image_bloomh_handle = new_render_image(size, &mut images);

    //Vertical bloom image

    let image_bloomv_handle = new_render_image(size, &mut images);

    // Pass2 image

    let image_pass2_handle = new_render_image(size, &mut images);

    //
    // Post Process
    //

    let quad_handle = meshes.add(Mesh::from(shape::Quad::new(Vec2::new(
        size.width as f32,
        size.height as f32,
    ))));
    println!("{:?}",size);

    // Afterglow

    let material_handle = afterglow_materials.add(AfterglowMaterial {
        source_image: afterglowimages.frame_buffer[2].clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
        feedback: image_afterglow_in_handle.clone(),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_afterglow_out_handle.clone()), 8u8, 1);

    // Preshader

    let material_handle = pre_materials.add(PreMaterial {
        source_image: image_source_handle.clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
        afterglow: image_afterglow_in_handle.clone(),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_pre_handle.clone()), 7u8, 2);

    
    // Linearize

    let material_handle = linearize_materials.add(LinearizeMaterial {
        source_image: image_pre_handle.clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_linearize_handle.clone()), 6u8, 3);

    // Pass 1

    let material_handle = post_materials.add(PostMaterial {
        linearize_pass: image_linearize_handle.clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_pass1_handle.clone()), 5u8, 4);


    // Bloom Horizontal

    let material_handle = bloomh_materials.add(BloomHorizontal {
        linearize_pass: image_linearize_handle.clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_bloomh_handle.clone()), 4u8, 5);

    // Bloom Vertical

    let material_handle = bloomv_materials.add(BloomVertical {
        source_image: image_bloomh_handle.clone(),
        texture_size: Vec2::new(size.width as f32,size.height as f32),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_bloomv_handle.clone()), 3u8, 6);

    // Pass 2
    
    let material_handle = post2_materials.add(PostMaterial2 {
        pass_1: image_pass1_handle,
        texture_size: Vec2::new(size.width as f32,size.height as f32),
        linearize_pass: image_linearize_handle.clone(),
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Image(image_pass2_handle.clone()), 2u8, 7);

    // Deconvergence pass
    
    // This material combines outputs from the rest of the stages
    let material_handle = decon_materials.add(DeconvergenceMaterial {
        source_image: image_pass2_handle,
        texture_size: Vec2::new(size.width as f32,size.height as f32),
        linearize_pass: image_linearize_handle,
        bloom_pass: image_bloomv_handle,
        pre_pass: image_pre_handle,
    });

    setup_post_stage(&mut commands, &material_handle, &quad_handle, RenderTarget::Window(window.id()), 1u8, 8);
}

// This function reduces a lot of redundancy in creating the post processing stages.
// This bit of code used to just be copied for every stage basically until I started cleaning things up.
fn setup_post_stage<M: Material2d> (
    commands: &mut Commands,
    material: &Handle<M>,
    mesh: &Handle<Mesh>,
    target: RenderTarget,
    stagenum: u8,
    priority: isize,
) {
    let layer = RenderLayers::layer((RenderLayers::TOTAL_LAYERS) as u8 - stagenum);
    commands
        .spawn_bundle(MaterialMesh2dBundle {
            mesh: mesh.clone().into(),
            material: material.clone(),
            transform: Transform {
                translation: Vec3::new(0.0, 0.0, 1.5),
                ..default()
            },
            ..default()
        })
        .insert(layer);

    // The post-processing pass camera.
    commands
        .spawn_bundle(Camera2dBundle {
            camera: Camera {
                // renders after the first pass camera which has value: 1.
                priority,
                target,
                ..default()
            },
            ..Camera2dBundle::default()
        })
        .insert(layer)
        .insert(UiCameraConfig { show_ui: false }); //TODO: Make UI rendering configurable, along with a lot of other things.
}
