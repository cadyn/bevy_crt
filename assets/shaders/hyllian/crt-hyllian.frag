/*
   Hyllian's CRT Shader
  
   Copyright (C) 2011-2020 Hyllian - sergiogdb@gmail.com

   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:

   The above copyright notice and this permission notice shall be included in
   all copies or substantial portions of the Software.

   THE SOFTWARE IS PROVIDED "AS IS", WITHout WARRANTY OF ANY KinD, EXPRESS OR
   IMPLIED, inCLUDinG BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONinFRinGEMENT. in NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER in AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISinG FROM,
   out OF OR in CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALinGS in
   THE SOFTWARE.

*/

//#version 120

#define GAMMA_IN(color)     pow(color, vec4(InputGamma, InputGamma, InputGamma, InputGamma))
#define GAMMA_OUT(color)    pow(color, vec4(1.0 / OutputGamma, 1.0 / OutputGamma, 1.0 / OutputGamma, 1.0 / OutputGamma))


#define texCoord TEX0

out vec4 FragColor;

#define PRECISION

layout(set = 1, binding = 0) uniform texture2D CustomMaterial_texture;
layout(set = 1, binding = 2) uniform PRECISION vec2 TextureSize;
layout(set = 1, binding = 1) uniform sampler s_p;
in vec2 texCoord;

#define BEAM_PROFILE 0.0
#define BEAM_MIN_WIDTH 0.86
#define BEAM_MAX_WIDTH 1.0
#define SCANLINES_STRENGTH 0.2
#define COLOR_BOOST 1.5
#define HFILTER_SHARPNESS 1.0
#define CRT_ANTI_RINGING 1.0
#define InputGamma 2.4
#define OutputGamma 2.2
#define VSCANLINES 0.1
#define CRT_CURVATURE 1.0 
#define CRT_warpX 0.031 
#define CRT_warpY 0.041 
#define CRT_cornersize 0.01 
#define CRT_cornersmooth 1000.0 
#define cornersize CRT_cornersize
#define cornersmooth CRT_cornersmooth
#define InputSize TextureSize
// END PARAMETERS //


const vec2 corner_aspect   = vec2(1.0,  0.75);
vec2 CRT_Distortion = vec2(CRT_warpX, CRT_warpY) * 15.;


float corner(vec2 coord)
{
    coord = (coord - vec2(0.5)) + vec2(0.5, 0.5);
    coord = min(coord, vec2(1.0) - coord) * corner_aspect;
    vec2 cdist = vec2(cornersize);
    coord = (cdist - min(coord, cdist));
    float dist = sqrt(dot(coord, coord));
    
    return clamp((cdist.x - dist)*cornersmooth, 0.0, 1.0);
}


vec2 Warp(vec2 texCoord){

  vec2 curvedCoords = texCoord * 2.0 - 1.0;
  float curvedCoordsDistance = sqrt(curvedCoords.x*curvedCoords.x+curvedCoords.y*curvedCoords.y);

  curvedCoords = curvedCoords / curvedCoordsDistance;

  curvedCoords = curvedCoords * (1.0-pow(vec2(1.0-(curvedCoordsDistance/1.4142135623730950488016887242097)),(1.0/(1.0+CRT_Distortion*0.2))));

  curvedCoords = curvedCoords / (1.0-pow(vec2(0.29289321881345247559915563789515),(1.0/(vec2(1.0)+CRT_Distortion*0.2))));

  curvedCoords = curvedCoords * 0.5 + 0.5;
  return curvedCoords;
}


// Horizontal cubic filter.

// Some known filters use these values:

//    B = 0.0, C = 0.0  =>  Hermite cubic filter.
//    B = 1.0, C = 0.0  =>  Cubic B-Spline filter.
//    B = 0.0, C = 0.5  =>  Catmull-Rom Spline filter. This is the default used in this shader.
//    B = C = 1.0/3.0   =>  Mitchell-Netravali cubic filter.
//    B = 0.3782, C = 0.3109  =>  Robidoux filter.
//    B = 0.2620, C = 0.3690  =>  Robidoux Sharp filter.

float B = 1.0 - HFILTER_SHARPNESS;
float C = HFILTER_SHARPNESS*0.5; // B+2C=1  Mitchel-Netravali recommendation line.  

mat4 invX = mat4(                          (-B - 6.0*C)/6.0,   (12.0 - 9.0*B - 6.0*C)/6.0,  -(12.0 - 9.0*B - 6.0*C)/6.0,   (B + 6.0*C)/6.0,
                                              (3.0*B + 12.0*C)/6.0, (-18.0 + 12.0*B + 6.0*C)/6.0, (18.0 - 15.0*B - 12.0*C)/6.0,                -C,
                                              (-3.0*B - 6.0*C)/6.0,                          0.0,          (3.0*B + 6.0*C)/6.0,               0.0,
                                                             B/6.0,            (6.0 - 2.0*B)/6.0,                        B/6.0,               0.0);



#define scanlines_strength (4.0*profile.x)
#define beam_min_width     profile.y
#define beam_max_width     profile.z
#define color_boost        profile.w

vec4 get_beam_profile()
{
	vec4 bp = vec4(SCANLINES_STRENGTH, BEAM_MIN_WIDTH, BEAM_MAX_WIDTH, COLOR_BOOST);

if (BEAM_PROFILE == 1.0)  bp = vec4(0.40, 1.00, 1.00, 1.00); // Catmull-rom
if (BEAM_PROFILE == 2.0)  bp = vec4(0.72, 1.00, 1.00, 1.25); // Catmull-rom
if (BEAM_PROFILE == 3.0)  bp = vec4(0.60, 0.50, 1.00, 1.25); // Hermite
if (BEAM_PROFILE == 4.0)  bp = vec4(0.60, 0.72, 1.00, 1.25); // Hermite
if (BEAM_PROFILE == 5.0)  bp = vec4(0.68, 0.68, 1.00, 1.25); // Hermite
if (BEAM_PROFILE == 6.0)  bp = vec4(0.70, 0.50, 1.00, 1.80); // Catmull-rom

	return bp;
}




void main()
{
    vec4 profile = get_beam_profile();

    vec2 dx = mix(vec2(1.0/TextureSize.x, 0.0), vec2(0.0, 1.0/TextureSize.y), VSCANLINES);
    vec2 dy = mix(vec2(0.0, 1.0/TextureSize.y), vec2(1.0/TextureSize.x, 0.0), VSCANLINES);

//    vec2 pix_coord = texCoord.xy*TextureSize + vec2(-0.5, 0.5);

    vec2 pp = texCoord.xy;
    pp = (CRT_CURVATURE > 0.5) ? (Warp(pp*TextureSize.xy/InputSize.xy)*InputSize.xy/TextureSize.xy) : pp;
 

    vec2 pix_coord = pp.xy*TextureSize + vec2(-0.5, 0.5);

    vec2 tc = mix((floor(pix_coord) + vec2(0.5, 0.5))/TextureSize, (floor(pix_coord) + vec2(1.0, -0.5))/TextureSize, VSCANLINES);

    vec2 fp = mix(fract(pix_coord), fract(pix_coord.yx), VSCANLINES);

    vec4 c00 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc     - dx - dy).xyzw);
    vec4 c01 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc          - dy).xyzw);
    vec4 c02 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc     + dx - dy).xyzw);
    vec4 c03 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc + 2.0*dx - dy).xyzw);
    vec4 c10 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc     - dx).xyzw);
    vec4 c11 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc         ).xyzw);
    vec4 c12 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc     + dx).xyzw);
    vec4 c13 = GAMMA_IN(texture(sampler2D(CustomMaterial_texture,s_p), tc + 2.0*dx).xyzw);

    mat4 color_matrix0 = mat4(c00, c01, c02, c03);
    mat4 color_matrix1 = mat4(c10, c11, c12, c13);

    vec4 lobes = vec4(fp.x*fp.x*fp.x, fp.x*fp.x, fp.x, 1.0);

    vec4 invX_Px  = invX * lobes;
    vec4 color0   = color_matrix0 * invX_Px;
    vec4 color1   = color_matrix1 * invX_Px;

    //  Get min/max samples
    vec4 min_sample0 = min(c01,c02);
    vec4 max_sample0 = max(c01,c02);
    vec4 min_sample1 = min(c11,c12);
    vec4 max_sample1 = max(c11,c12);

    // Anti-ringing
    vec4 aux = color0;
    color0 = clamp(color0, min_sample0, max_sample0);
    color0 = mix(aux, color0, CRT_ANTI_RINGING);
    aux = color1;
    color1 = clamp(color1, min_sample1, max_sample1);
    color1 = mix(aux, color1, CRT_ANTI_RINGING);

    float pos0 = fp.y;
    float pos1 = 1.0 - fp.y;

    vec4 lum0 = mix(vec4(beam_min_width), vec4(beam_max_width), color0);
    vec4 lum1 = mix(vec4(beam_min_width), vec4(beam_max_width), color1);

    vec4 d0 = scanlines_strength*pos0/(lum0+0.0000001);
    vec4 d1 = scanlines_strength*pos1/(lum1+0.0000001);

    d0 = exp(-d0*d0);
    d1 = exp(-d1*d1);

    vec4 color = color_boost*(color0*d0+color1*d1);

    color  = GAMMA_OUT(color);

    FragColor =  vec4(color);

    FragColor *= (CRT_CURVATURE > 0.5) ? corner(pp*TextureSize.xy/InputSize.xy) : 1.0;
}
