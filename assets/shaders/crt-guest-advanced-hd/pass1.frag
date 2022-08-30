#version 450

/*
   CRT - Guest - Advanced - HD - Pass1
   
   Copyright (C) 2018-2022 guest(r) - guest.r@gmail.com

   Incorporates many good ideas and suggestions from Dr. Venom.
   I would also like give thanks to many Libretro forums members for continuous feedback, suggestions and caring about the shader.
   
   This program is free software; you can redistribute it and/or
   modify it under the terms of the GNU General Public License
   as published by the Free Software Foundation; either version 2
   of the License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.

   You should have received a copy of the GNU General Public License
   along with this program; if not, write to the Free Software
   Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
   
*/

/*layout(push_constant) uniform Push
{
	//vec4 SourceSize;
	//vec4 OriginalSize;
	//vec4 OutputSize;
	//uint FrameCount;
	//float SIGMA_HOR;
	//float HSHARPNESS;
	float S_SHARP;
	float HARNG;
	float HSHARP; 
	float prescalex;
	float prescaley;
	float spike;
	float SIGMA_VER;
	float VSHARPNESS;
	float S_SHARPV;
	float VARNG;
	float VSHARP;
	float internal_res;
} params;

layout(std140, set = 0, binding = 0) uniform UBO
{
	mat4 MVP;
} global;
*/

//#pragma parameter bogus_filtering "[ FILTERING OPTIONS ]: " 0.0 0.0 1.0 1.0

//#pragma parameter internal_res "          Internal Resolution" 1.0 1.0 8.0 0.10
#define internal_res 1.0

//#pragma parameter HSHARPNESS "          Horizontal Filter Range" 1.0 1.0 8.0 0.25
#define HSHARPNESS 1.0

//#pragma parameter SIGMA_HOR "          Horizontal Blur Sigma" 0.50 0.1 7.0 0.025
#define SIGMA_HOR 0.50

//#pragma parameter S_SHARP "          Substractive Sharpness" 1.0 0.0 2.0 0.10
#define S_SHARP 1.0

//#pragma parameter HSHARP "          Sharpness Definition" 1.25 0.0 2.0 0.10
#define HSHARP 1.25

//#pragma parameter HARNG "          Substractive Sharpness Ringing" 0.2 0.0 4.0 0.10
#define HARNG 0.2

//#pragma parameter bogus_vfiltering "[ VERTICAL/INTERLACING FILTERING OPTIONS ]: " 0.0 0.0 1.0 1.0

//#pragma parameter VSHARPNESS "          Vertical Filter Range" 1.0 1.0 8.0 0.25
#define VSHARPNESS 1.0

//#pragma parameter SIGMA_VER "          Vertical Blur Sigma" 0.50 0.1 7.0 0.025
#define SIGMA_VER 0.50

//#pragma parameter S_SHARPV "          Vert. Substractive Sharpness" 1.0 0.0 2.0 0.10
#define S_SHARPV 1.0

//#pragma parameter VSHARP "          Vert. Sharpness Definition" 1.25 0.0 2.0 0.10
#define VSHARP 1.25

//#pragma parameter VARNG "          Substractive Sharpness Ringing" 0.2 0.0 4.0 0.10
#define VARNG 0.2

//#pragma parameter spike "          Scanline Spike Removal" 1.0 0.0 2.0 0.10
#define spike 1.0

//#pragma parameter prescalex "          Prescale-X Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with main pass, values must match
#define prescalex 1.0

//#pragma parameter prescaley "          Prescale-Y Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with Linearize Pass pass, values must match
#define prescaley 1.0

#define COMPAT_TEXTURE(c,d) texture(sampler2D(CustomMaterial_texture,c),d)
#define TEX0 vTexCoord

//#define OutputSize params.OutputSize
//#define gl_FragCoord (vTexCoord * OutputSize.xy)

//#pragma stage fragment
layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D CustomMaterial_texture;
layout(set = 1, binding = 1) uniform sampler LinearizePass;
layout(set = 1, binding = 2) uniform vec2 TextSize;

//#define OriginalSize vec2(1.0,1.0)

float invsqrsigma = 1.0/(2.0*SIGMA_HOR*SIGMA_HOR*internal_res*internal_res);

float gaussian(float x)
{
	return exp(-x*x*invsqrsigma);
}

void main()
{	
    vec2 invTextSize = 1 / TextSize;
    vec4 OriginalSize = vec4(TextSize,invTextSize.x,invTextSize.y);
	vec4 SourceSize =  OriginalSize * vec4(prescalex, prescaley, (1.0/prescalex), (1.0/prescaley));
	vec2 icoords = vTexCoord * TextSize;
	float f = fract(SourceSize.x * vTexCoord.x);
	f = 0.5 - f;
    
	vec2 tex = floor(SourceSize.xy * vTexCoord)*SourceSize.zw + 0.5*SourceSize.zw;
    //vec2 tex = SourceSize.xy * vTexCoord;
	vec3 color = vec3(0.0,0.0,0.0);
	float scolor = 0.0;
	vec2 dx  = vec2(SourceSize.z, 0.0);

	float w = 0.0;
	float swsum = 0.0;
	float wsum = 0.0;
	vec3 pixel;

	float hsharpness = HSHARPNESS * internal_res;
	vec3 cmax = vec3(0.0,0.0,0.0);
	vec3 cmin = vec3(1.0,1.0,1.0);
	float sharp = gaussian(hsharpness) * S_SHARP;
	float maxsharp = 0.20;
	float FPR = hsharpness;
	float fpx = 0.0;
	float sp = 0.0;
	float sw = 0.0;

	float ts = 0.025;
	vec3 luma = vec3(0.2126, 0.7152, 0.0722); 

	float LOOPSIZE = ceil(2.0*FPR);
	float CLAMPSIZE = round(2.0*LOOPSIZE/3.0);
	
	float n = -LOOPSIZE;
	
	do
	{
		pixel  = COMPAT_TEXTURE(LinearizePass, tex + (n*dx)).rgb;
		sp = max(max(pixel.r,pixel.g),pixel.b);
		
		w = gaussian(n+f) - sharp;
		fpx = abs(n+f-sign(n)*FPR)/FPR;
		if (abs(n) <= CLAMPSIZE) { cmax = max(cmax, pixel); cmin = min(cmin, pixel); }
		if (w < 0.0) w = clamp(w, mix(-maxsharp, 0.0, pow(fpx, HSHARP)), 0.0);
	
		color = color + w * pixel;
		wsum  = wsum + w;

		sw = max(w, 0.0) * (dot(pixel,luma) + ts); 
		scolor = scolor + sw * sp;
		swsum = swsum + sw;
		
		n = n + 1.0;
			
	} while (n <= LOOPSIZE);

	color = color / wsum;
	scolor = scolor / swsum;
	
	color = clamp(mix(clamp(color, cmin, cmax), color, HARNG), 0.0, 1.0);
	
	scolor = clamp(mix(max(max(color.r, color.g),color.b), scolor, spike), 0.0, 1.0);
	
    FragColor = vec4(color, scolor);
	//FragColor = COMPAT_TEXTURE(LinearizePass,tex);
} 