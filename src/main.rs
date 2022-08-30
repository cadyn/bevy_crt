//! Very basic example which uses the CRT effect
//! Some basic varying quads which you can move around

use bevy::{
    prelude::*,
    sprite::{MaterialMesh2dBundle, Mesh2dHandle, Material2d, Material2dPlugin,},
    reflect::TypeUuid,
    render::{render_resource::{AsBindGroup, ShaderRef,},},
};

use bevy_crt::plugin::Crt2dPlugin;

const MOVE_SPEED: f32 = 500.0;

fn main() {
    let mut app = App::new();
    app.insert_resource(ClearColor(Color::rgba(0.02, 0.02, 0.02, 1.0)));
    app.add_plugins(DefaultPlugins)
        .add_plugin(Crt2dPlugin)
        .add_plugin(Material2dPlugin::<CustomMaterial>::default())
        .add_startup_system(setup)
        .add_system(movesystem);
    app.run();
}

fn movesystem(
    time: Res<Time>,
    mut transforms: Query<&mut Transform, With<Movable>>,
    keyboard_input: Res<Input<KeyCode>>,
) {
    let left = keyboard_input.pressed(KeyCode::A) || keyboard_input.pressed(KeyCode::Left);
    let right = keyboard_input.pressed(KeyCode::D) || keyboard_input.pressed(KeyCode::Right);
    let up = keyboard_input.pressed(KeyCode::W) || keyboard_input.pressed(KeyCode::Up);
    let down = keyboard_input.pressed(KeyCode::S) || keyboard_input.pressed(KeyCode::Down);

    let x = (right as i8 - left as i8) as f32;
    let y = (up as i8 - down as i8) as f32;
    let move_vec = Vec3::new(x,y,0.0) * MOVE_SPEED * time.delta_seconds();
    for mut transform in transforms.iter_mut(){
        transform.translation += move_vec;
    }
}




#[derive(AsBindGroup, Debug, Clone, TypeUuid)]
#[uuid = "b62bb455-a72c-4b56-87bb-81e0554e234f"]
pub struct CustomMaterial {
    #[uniform(0)]
    color: Color,
    #[texture(1)]
    #[sampler(2)]
    texture: Handle<Image>,
}

impl Material2d for CustomMaterial {
    fn fragment_shader() -> ShaderRef {
        "shaders/custom_material_screenspace_texture.wgsl".into()
    }
}
#[derive(Component)]
struct Movable;

fn setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<ColorMaterial>>,
    mut custom_materials: ResMut<Assets<CustomMaterial>>,
    asset_server: Res<AssetServer>,
) {
    //
    // Actual scene
    //

    // Load the Bevy logo as a texture
    let texture_handle = asset_server.load("branding/banner.png");
    // Build a default quad mesh
    let mut mesh = Mesh::from(shape::Quad::default());
    // Build vertex colors for the quad. One entry per vertex (the corners of the quad)
    let vertex_colors: Vec<[f32; 4]> = vec![
        Color::RED.as_rgba_f32(),
        Color::GREEN.as_rgba_f32(),
        Color::BLUE.as_rgba_f32(),
        Color::WHITE.as_rgba_f32(),
    ];

    // Insert the vertex colors as an attribute
    mesh.insert_attribute(Mesh::ATTRIBUTE_COLOR, vertex_colors);

    let mesh_handle: Mesh2dHandle = meshes.add(mesh).into();

    // Spawn camera
    

    // Spawn the quad with vertex colors
    commands.spawn_bundle(MaterialMesh2dBundle {
        mesh: mesh_handle.clone(),
        transform: Transform::from_translation(Vec3::new(-96., 0., 0.))
            .with_scale(Vec3::splat(128.)),
        material: materials.add(ColorMaterial::default()),
        ..default()
    }).insert(Movable);

    // Spawning the quad with vertex colors and a texture results in tinting
    commands.spawn_bundle(MaterialMesh2dBundle {
        mesh: mesh_handle.clone(),
        transform: Transform::from_translation(Vec3::new(96., 0., 0.))
            .with_scale(Vec3::splat(128.)),
        material: materials.add(ColorMaterial::from(texture_handle)),
        ..default()
    }).insert(Movable);

    commands.spawn().insert_bundle(MaterialMesh2dBundle {
        mesh: mesh_handle,
        transform: Transform::from_translation(Vec3::new(288., 0., 0.))
        .with_scale(Vec3::splat(128.)),
        material: custom_materials.add(CustomMaterial {
            color: Color::rgba(1.,1.,1.,1.),
            texture: asset_server.load(
                "models/FlightHelmet/FlightHelmet_Materials_LensesMat_OcclusionRoughMetal.png",
            ),
        }),
        ..default()
    }).insert(Movable);
    
}
