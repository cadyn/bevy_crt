#version 450

/*
   CRT - Guest - Advanced
   
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

//#pragma parameter bogus_brightness "[ BRIGHTNESS SETTINGS ]:" 0.0 0.0 1.0 1.0

//#pragma parameter glow "          Glow Strength" 0.08 -2.0 2.0 0.01
#define glow 0.08     // Glow Strength

//#pragma parameter bloom "          Bloom Strength" 0.0 -2.0 2.0 0.05
#define bloom 0.0     // bloom effect

//#pragma parameter mask_bloom "          Mask Bloom" 0.0 0.0 2.0 0.05
#define mask_bloom 0.0     // bloom effect

//#pragma parameter bloom_dist "          Bloom Distribution" 0.0 0.0 3.0 0.05
#define bloom_dist 0.0     // bloom effect distribution

//#pragma parameter halation "          Halation Strength" 0.0 0.0 2.0 0.025
#define halation 0.0     // halation effect

//#pragma parameter gamma_c "          Gamma correct" 1.0 0.50 2.0 0.02
#define gamma_c 1.0     // adjust brightness

//#pragma parameter brightboost "          Bright Boost Dark Pixels" 1.40 0.25 10.0 0.05
#define brightboost 1.40     // adjust brightness

//#pragma parameter brightboost1 "          Bright Boost Bright Pixels" 1.10 0.25 3.00 0.025
#define brightboost1 1.10     // adjust brightness

//#pragma parameter bogus_screen "[ SCREEN OPTIONS ]: " 0.0 0.0 1.0 1.0

//#pragma parameter IOS "          Integer Scaling: Odd:Y, Even:'X'+Y" 0.0 0.0 4.0 1.0
#define IOS 0.0     // Smart Integer Scaling

//#pragma parameter csize "          Corner Size" 0.0 0.0 0.25 0.005
#define csize 0.0     // corner size

//#pragma parameter bsize1 "          Border Size" 0.01 0.0 3.0 0.01
#define bsize1 0.01     // border Size

//#pragma parameter sborder "          Border Intensity" 0.75 0.25 2.0 0.05
#define sborder 0.75     // border intensity

//#pragma parameter barspeed "          Hum Bar Speed" 50.0 5.0 200.0 1.0
#define barspeed 50.0

//#pragma parameter barintensity "          Hum Bar Intensity" 0.0 -1.0 1.0 0.01
#define barintensity 0.1

//#pragma parameter bardir "          Hum Bar Direction" 0.0 0.0 1.0 1.0
#define bardir 0.0

//#pragma parameter warpX "          CurvatureX (default 0.03)" 0.0 0.0 0.25 0.01
#define warpX 0.03     // Curvature X

//#pragma parameter warpY "          CurvatureY (default 0.04)" 0.0 0.0 0.25 0.01
#define warpY 0.04     // Curvature Y

//#pragma parameter c_shape "          Curvature Shape" 0.25 0.05 0.60 0.05
#define c_shape 0.25     // curvature shape

//#pragma parameter overscanX "          Overscan X original pixels" 0.0 -200.0 200.0 1.0
#define overscanX 0.0     // OverscanX pixels

//#pragma parameter overscanY "          Overscan Y original pixels" 0.0 -200.0 200.0 1.0
#define overscanY 0.0     // OverscanY pixels

//#pragma parameter bogus_masks "[ CRT MASK OPTIONS ]: " 0.0 0.0 1.0 1.0

//#pragma parameter shadowMask "          CRT Mask: 0:CGWG, 1-4:Lottes, 5-12:'Trinitron'" 0.0 -1.0 12.0 1.0
#define shadowMask 0     // Mask Style

//#pragma parameter maskstr "          Mask Strength (0, 5-12)" 0.3 -0.5 1.0 0.025
#define maskstr 0.3      // Mask Strength

//#pragma parameter mcut "          Mask 5-12 Low Strength" 1.10 0.0 2.0 0.05
#define mcut 1.10      // Mask 5-12 dark color strength

//#pragma parameter masksize "          CRT Mask Size" 1.0 1.0 4.0 1.0
#define masksize 1.0     // Mask Size

//#pragma parameter maskDark "          Lottes maskDark" 0.5 0.0 2.0 0.05
#define maskDark 0.5     // Dark "Phosphor"

//#pragma parameter maskLight "          Lottes maskLight" 1.5 0.0 2.0 0.05
#define maskLight 1.5     // Light "Phosphor"

//#pragma parameter mshift "          Mask Shift/Stagger" 0.0 -8.0 8.0 1.0
#define mshift 0.0     // mask 'line' shift/stagger

//#pragma parameter mask_layout "          Mask Layout: RGB or BGR (check LCD panel) " 0.0 0.0 1.0 1.0
#define mask_layout 0.0     // mask layout: RGB or BGR

//#pragma parameter mask_gamma "          Mask gamma" 2.40 1.0 5.0 0.05
#define mask_gamma 2.40     // Mask application gamma

//#pragma parameter slotmask "          Slot Mask Strength Bright Pixels" 0.0 0.0 1.0 0.05
#define slotmask 0.0

//#pragma parameter slotmask1 "          Slot Mask Strength Dark Pixels" 0.0 0.0 1.0 0.05
#define slotmask1 0.0

//#pragma parameter slotwidth "          Slot Mask Width" 2.0 1.0 8.0 1.0
#define slotwidth 2.0     // Slot Mask Width

//#pragma parameter double_slot "          Slot Mask Height: 2x1 or 4x1..." 1.0 1.0 4.0 1.0
#define double_slot 1.0    // Slot Mask Height

//#pragma parameter slotms "          Slot Mask Size" 1.0 1.0 4.0 1.0
#define slotms 1.0     // Slot Mask Size

//#pragma parameter mclip "          Keep Mask effect with clipping" 0.50 0.0 1.0 0.05
#define mclip 0.50     //

//#pragma parameter gamma_out "Gamma out" 1.75 1.0 5.0 0.05
#define gamma_out 1.75    // output gamma


//#pragma parameter bogus_deconvergence11 "[ HORIZONTAL/VERTICAL DECONVERGENCE ]: " 0.0 0.0 1.0 1.0

//#pragma parameter dctypex "          Deconvergence type X : 0.0 - static, other - dynamic" 0.0 0.0 0.75 0.05
#define dctypex 0.0

//#pragma parameter dctypey "          Deconvergence type Y : 0.0 - static, other - dynamic" 0.0 0.0 0.75 0.05
#define dctypey 0.0

//#pragma parameter deconrr "          Horizontal Deconvergence Red Range" 0.0 -15.0 15.0 0.25
#define deconrr 0.0

//#pragma parameter deconrg "          Horizontal Deconvergence Green Range" 0.0 -15.0 15.0 0.25
#define deconrg 0.0

//#pragma parameter deconrb "          Horizontal Deconvergence Blue Range" 0.0 -15.0 15.0 0.25
#define deconrb 0.0

//#pragma parameter deconrry "          Vertical Deconvergence Red Range" 0.0 -15.0 15.0 0.25
#define deconrry 0.0

//#pragma parameter deconrgy "          Vertical Deconvergence Green Range" 0.0 -15.0 15.0 0.25
#define deconrgy 0.0

//#pragma parameter deconrby "          Vertical Deconvergence Blue Range" 0.0 -15.0 15.0 0.25
#define deconrby 0.0 

//#pragma parameter decons "          Deconvergence Strength" 1.0 0.0 3.0 0.10
#define decons 1.0

//#pragma parameter addnoised "          Add Noise" 0.0 -1.0 1.0 0.02
#define addnoised 0.0

//#pragma parameter noiseresd "          Noise Resolution" 2.0 1.0 10.0 1.0
#define noiseresd 2.0

//#pragma parameter noisetype "          Noise Type: Colored, Luma" 0.0 0.0 1.0 1.0
#define noisetype 0.0

//#pragma parameter post_br "          Post Brightness" 1.0 0.25 5.0 0.01
#define post_br 1.0


#define COMPAT_TEXTURE(b,c,d) texture(sampler2D(b,c),d)
#define TEX0 vTexCoord

#define OutputSize vec4(TextSize, 1.0 / TextSize.x, 1.0 / TextSize.y)
#define gl_FragCoord (vTexCoord * OutputSize.xy)

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D Source_texture;
layout(set = 1, binding = 1) uniform sampler Source;
layout(set = 1, binding = 2) uniform vec2 TextSize;
layout(set = 1, binding = 3) uniform texture2D LinearizePass_texture;
layout(set = 1, binding = 4) uniform sampler LinearizePass;
layout(set = 1, binding = 5) uniform texture2D BloomPass_texture;
layout(set = 1, binding = 6) uniform sampler BloomPass;
layout(set = 1, binding = 7) uniform texture2D PrePass_texture;
layout(set = 1, binding = 8) uniform sampler PrePass;
layout(set = 3, binding = 0) uniform uint FrameCount;


#define eps 1e-10 

// Shadow mask (1-4 from PD CRT Lottes shader).

vec3 Mask(vec2 pos, float mx)
{
	vec2 pos0 = pos;
	pos.y = floor(pos.y/masksize);
	float next_line = float(fract(pos.y*0.5) > 0.25);
	pos0.x = (mshift > -0.25) ? (pos0.x + next_line * mshift) : (pos0.x + pos.y * mshift);
	pos = floor(pos0/masksize);

	vec3 mask = vec3(maskDark, maskDark, maskDark);
	vec3 one = vec3(1.0);
	float dark_compensate  = mix(max( clamp( mix (mcut, maskstr, mx),0.0, 1.0) - 0.4, 0.0) + 1.0, 1.0, mx);
	float mc = 1.0 - max(maskstr, 0.0);	
	
	// No mask
	if (shadowMask == -1.0)
	{
		mask = vec3(1.0);
	}       
	
	// Phosphor.
	else if (shadowMask == 0.0)
	{
		pos.x = fract(pos.x*0.5);
		if (pos.x < 0.49) { mask.r = 1.0; mask.g = mc; mask.b = 1.0; }
		else { mask.r = mc; mask.g = 1.0; mask.b = mc; }
	}    
   
	// Very compressed TV style shadow mask.
	else if (shadowMask == 1.0)
	{
		float line = maskLight;
		float odd  = 0.0;

		if (fract(pos.x/6.0) < 0.49)
			odd = 1.0;
		if (fract((pos.y + odd)/2.0) < 0.49)
			line = maskDark;

		pos.x = fract(pos.x/3.0);
    
		if      (pos.x < 0.3) mask.r = maskLight;
		else if (pos.x < 0.6) mask.g = maskLight;
		else                    mask.b = maskLight;
		
		mask*=line;  
	} 

	// Aperture-grille.
	else if (shadowMask == 2.0)
	{
		pos.x = fract(pos.x/3.0);

		if      (pos.x < 0.3) mask.r = maskLight;
		else if (pos.x < 0.6) mask.g = maskLight;
		else                    mask.b = maskLight;
	} 

	// Stretched VGA style shadow mask (same as prior shaders).
	else if (shadowMask == 3.0)
	{
		pos.x += pos.y*3.0;
		pos.x  = fract(pos.x/6.0);

		if      (pos.x < 0.3) mask.r = maskLight;
		else if (pos.x < 0.6) mask.g = maskLight;
		else                    mask.b = maskLight;
	}

	// VGA style shadow mask.
	else if (shadowMask == 4.0)
	{
		pos.xy = floor(pos.xy*vec2(1.0, 0.5));
		pos.x += pos.y*3.0;
		pos.x  = fract(pos.x/6.0);

		if      (pos.x < 0.3) mask.r = maskLight;
		else if (pos.x < 0.6) mask.g = maskLight;
		else                    mask.b = maskLight;
	}
	
	// Trinitron mask 5
	else if (shadowMask == 5.0)
	{
		mask = vec3(0.0);		
		pos.x = fract(pos.x/2.0);
		if  (pos.x < 0.49)
		{	mask.r  = 1.0;
			mask.b  = 1.0;
		}
		else     mask.g = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;
	}    

	// Trinitron mask 6
	else if (shadowMask == 6.0)
	{
		mask = vec3(0.0);
		pos.x = fract(pos.x/3.0);
		if      (pos.x < 0.3) mask.r = 1.0;
		else if (pos.x < 0.6) mask.g = 1.0;
		else                    mask.b = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;
	}
	
	// BW Trinitron mask 7
	else if (shadowMask == 7.0)
	{
		mask = vec3(0.0);		
		pos.x = fract(pos.x/2.0);
		if  (pos.x < 0.49)
		{	mask  = vec3(0.0);
		}
		else     mask = vec3(1.0);
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;
	}    

	// BW Trinitron mask 8
	else if (shadowMask == 8.0)
	{
		mask = vec3(0.0);
		pos.x = fract(pos.x/3.0);
		if      (pos.x < 0.3) mask = vec3(0.0);
		else if (pos.x < 0.6) mask = vec3(1.0);
		else                  mask = vec3(1.0);
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;
	}    

	// Magenta - Green - Black mask
	else if (shadowMask == 9.0)
	{
		mask = vec3(0.0);
		pos.x = fract(pos.x/3.0);
		if      (pos.x < 0.3) mask    = vec3(0.0);
		else if (pos.x < 0.6) mask.rb = vec2(1.0);
		else                  mask.g  = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;	
	}  
	
	// RGBX
	else if (shadowMask == 10.0)
	{
		mask = vec3(0.0);
		pos.x = fract(pos.x * 0.25);
		if      (pos.x < 0.2)  mask  = vec3(0.0);
		else if (pos.x < 0.4)  mask.r = 1.0;
		else if (pos.x < 0.7)  mask.g = 1.0;	
		else                   mask.b = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;		
	}  

	// 4k mask
	else if (shadowMask == 11.0)
	{
		mask = vec3(0.0);
		pos.x = fract(pos.x * 0.25);
		if      (pos.x < 0.2)  mask.r  = 1.0;
		else if (pos.x < 0.4)  mask.rg = vec2(1.0);
		else if (pos.x < 0.7)  mask.gb = vec2(1.0);	
		else                   mask.b  = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;		
	}     

	// RRGGBBX mask
	else
	{
		mask = vec3(0.0);
		pos.x = floor(mod(pos.x,7.0));
		if      (pos.x < 1.0)  mask   = vec3(0.0);
		else if (pos.x < 3.0)  mask.r = 1.0;
		else if (pos.x < 5.0)  mask.g = 1.0;	
		else                   mask.b = 1.0;
		mask = clamp(mix( mix(one, mask, mcut), mix(one, mask, maskstr), mx), 0.0, 1.0) * dark_compensate;
	}
	
	return mask;
}

float SlotMask(vec2 pos, float m)
{
	if ((slotmask + slotmask1) == 0.0) return 1.0;
	else
	{
	pos = floor(pos/slotms);
	float mlen = slotwidth*2.0;
	float px = fract(pos.x/mlen);
	float py = floor(fract(pos.y/(2.0*double_slot))*2.0*double_slot);
	float slot_dark = mix(1.0-slotmask1, 1.0-slotmask, m);
	float slot = 1.0;
	if (py == 0.0 && px <  0.5) slot = slot_dark; else
	if (py == double_slot && px >= 0.5) slot = slot_dark;		
	
	return slot;
	}
}   
 
vec2 Warp(vec2 pos)
{
	pos  = pos*2.0-1.0;    
	pos  = mix(pos, vec2(pos.x*inversesqrt(1.0-c_shape*pos.y*pos.y), pos.y*inversesqrt(1.0-c_shape*pos.x*pos.x)), vec2(warpX, warpY)/c_shape);
	return pos*0.5 + 0.5;
}

vec2 Overscan(vec2 pos, float dx, float dy){
	pos=pos*2.0-1.0;    
	pos*=vec2(dx,dy);
	return pos*0.5+0.5;
} 

float humbar(float pos)
{
	if (barintensity == 0.0) return 1.0; else
	{
		pos = (barintensity >= 0.0) ? pos : (1.0-pos);
		pos = fract(pos + mod(float(FrameCount),barspeed)/(barspeed-1.0));
		pos = (barintensity <  0.0) ? pos : (1.0-pos);	
		return (1.0-barintensity) + barintensity*pos;
	}	
}


float corner(vec2 pos) {
	vec2 b = vec2(bsize1, bsize1) *  vec2(1.0, OutputSize.x/OutputSize.y) * 0.05;
	pos = clamp(pos, 0.0, 1.0);
	pos = abs(2.0*(pos - 0.5));
	float csize1 = mix(400.0, 7.0,  pow(4.0*csize, 0.10));
	float crn = dot(pow(pos, vec2(csize1)), vec2(1.0, OutputSize.y/OutputSize.x));
	crn = (csize == 0.0) ? max(pos.x, pos.y) : pow(crn, 1.0/csize1);
	pos = max(pos, crn);
	vec2 res = (bsize1 == 0.0) ? vec2(1.0) : mix(vec2(0.0), vec2(1.0), smoothstep(vec2(1.0), vec2(1.0)-b, sqrt(pos)));
	res = pow(res, vec2(sborder));	
	return sqrt(res.x*res.y);
}


vec3 plant (vec3 tar, float r)
{
	float t = max(max(tar.r,tar.g),tar.b) + 0.00001;
	return tar * r / t;
}

vec3 declip(vec3 c, float b)
{
	float m = max(max(c.r,c.g),c.b);
	if (m > b) c = c*b/m;
	return c;
}

// noise function:
// Dedicated to the public domain.
// If you want a real license, you may consider this MIT/BSD/CC0/WTFPL-licensed (take your pick).
// Adapted from ChuckNorris - shadertoy: https://www.shadertoy.com/view/XtK3Dz

vec3 noise(vec3 v){
    if (addnoised < 0.0) v.z = -addnoised; else v.z = mod(v.z,6001.0)/1753.0;
	// ensure reasonable range
    v = fract(v) + fract(v*1e4) + fract(v*1e-4);
    // seed
    v += vec3(0.12345, 0.6789, 0.314159);
    // more iterations => more random
    v = fract(v*dot(v, v)*123.456);
    v = fract(v*dot(v, v)*123.456);
	v = fract(v*dot(v, v)*123.456);
	v = fract(v*dot(v, v)*123.456);	
    return v;
} 

void fetch_pixel (inout vec3 c, inout vec3 b, vec2 coord, vec2 bcoord)
{
		float stepx = OutputSize.z;
		float stepy = OutputSize.w;
		
		float ds = decons;
				
		vec2 dx = vec2(stepx, 0.0);
		vec2 dy = vec2(0.0, stepy);		
		
		float posx = 2.0*coord.x - 1.0;
		float posy = 2.0*coord.y - 1.0;
		
		if (dctypex > 0.025)
		{
			posx = sign(posx)*pow(abs(posx), 1.05-dctypex);
			dx = posx * dx;
		}

		if (dctypey > 0.025)
		{

			posy = sign(posy)*pow(abs(posy), 1.05-dctypey);
			dy = posy * dy;
		}

		// if (dctypex > 0.025 || dctypey > 0.025) ds *= sqrt(posx*posx*sign(dctypex) + posy*posy*sign(dctypey));

		vec2 rc = deconrr * dx + deconrry*dy;
		vec2 gc = deconrg * dx + deconrgy*dy;
		vec2 bc = deconrb * dx + deconrby*dy;		

		float r1 = COMPAT_TEXTURE(Source_texture, Source, coord + rc).r;
		float g1 = COMPAT_TEXTURE(Source_texture, Source, coord + gc).g;
		float b1 = COMPAT_TEXTURE(Source_texture, Source, coord + bc).b;

		vec3 d = vec3(r1, g1, b1);
		c = clamp(mix(c, d, ds), 0.0, 1.0);
		
		r1 = COMPAT_TEXTURE(BloomPass_texture, BloomPass, bcoord + rc).r;
		g1 = COMPAT_TEXTURE(BloomPass_texture, BloomPass, bcoord + gc).g;
		b1 = COMPAT_TEXTURE(BloomPass_texture, BloomPass, bcoord + bc).b;

		d = vec3(r1, g1, b1);
		b = clamp(mix(b, d, ds), 0.0, 1.0);
} 


void main()
{
	vec2 invTextSize = 1 / TextSize;
    vec4 OriginalSize = vec4(TextSize,invTextSize.x,invTextSize.y);
	vec4 SourceSize = OriginalSize;
	
	float gamma_in = 1.0/COMPAT_TEXTURE(LinearizePass_texture, LinearizePass, vec2(0.25,0.25)).a;
	float intera = COMPAT_TEXTURE(LinearizePass_texture, LinearizePass, vec2(0.75,0.25)).a;
	bool interb  = (intera < 0.5);
	
	// Calculating texel coordinates
   
	vec2 texcoord = TEX0.xy;

	if (IOS > 0.0 && !interb){
		vec2 ofactor = OutputSize.xy/SourceSize.xy;
		vec2 intfactor = (IOS < 2.5) ? floor(ofactor) : ceil(ofactor);
		vec2 diff = ofactor/intfactor;
		float scan = diff.y;
		texcoord = Overscan(texcoord, scan, scan);
		if (IOS == 1.0 || IOS == 3.0) texcoord = vec2(TEX0.x, texcoord.y);
	} 

	texcoord = Overscan(texcoord, (OriginalSize.x - overscanX)/OriginalSize.x, (OriginalSize.y - overscanY)/OriginalSize.y);

	vec2 pos1 = TEX0.xy;
	vec2 pos  = Warp(texcoord);
	vec2 pos0 = Warp(TEX0.xy);
	vec3 color0 = COMPAT_TEXTURE(Source_texture, Source,pos1).rgb;
	float c0 = max(max(color0.r, color0.g),color0.b);
	
	// color and bloom fetching
	vec3 color = COMPAT_TEXTURE(Source_texture, Source,pos1).rgb;
	vec3  Bloom = COMPAT_TEXTURE(BloomPass_texture, BloomPass, pos).rgb;
	fetch_pixel(color, Bloom, pos1, pos); 
	
	float cm = max(max(color.r,color.g),color.b);
	float mx1 = COMPAT_TEXTURE(Source_texture, Source, pos1     ).a;
	float colmx = max(mx1, cm);
	float w3 = min((c0 + 0.0005) / (pow(colmx, gamma_in/1.4) + 0.0005), 1.0);
	
	vec2 dx = vec2(0.001, 0.0);
	float mx0 = COMPAT_TEXTURE(Source_texture, Source, pos1 - dx).a;
	float mx2 = COMPAT_TEXTURE(Source_texture, Source, pos1 + dx).a;
	float mx = max(max(mx0,mx1),max(mx2,cm));
	
	vec3 one = vec3(1.0);
	
	// Apply Mask
	
	vec3 orig1 = color;
	vec3 cmask = one;
	
	vec2 maskcoord = gl_FragCoord.xy * 1.000001;
	
	float smask = SlotMask(maskcoord, mx);	
	cmask*= Mask(maskcoord, mx);

	if (mask_layout > 0.5) cmask = cmask.rbg;

	vec3 cmask1 = cmask;
	float smask1 = smask;

	if (mask_bloom > 0.025)
	{
		float maxb = max(max(Bloom.r,Bloom.g),Bloom.b);
		maxb = pow(sqrt(maxb*mix(maxb, colmx, 0.75)),0.275);
		vec3 mBloom = 0.5*(1.5*Bloom+0.5*maxb) * mix(1.0, 2.0-colmx, (bloom_dist + 0.5));
		float maskmx = 1.0; if (shadowMask > 0.5 || shadowMask < 4.5) maskmx = maskLight; else if (shadowMask > 6.5 && shadowMask < 10.5) maskmx = 1.0; else maskmx = max(max(cmask.r,cmask.g),cmask.b);
		cmask = min(cmask + maxb*mBloom*mask_bloom, maskmx);
		smask = min(smask + 0.9*maxb*max(max(mBloom.r,mBloom.g),mBloom.b)*mask_bloom, 1.0);
	}
	
	color = pow(color, vec3(mask_gamma/gamma_in));
	color = color*cmask;
	color = min(color,1.0);
	color = color*smask;
	color = pow(color, vec3(gamma_in/mask_gamma));

	cmask = min(cmask*smask, 1.0);
	cmask1 = min(cmask1*smask1, 1.0);
	
	float bb = mix(brightboost, brightboost1, colmx);
	if (interb) bb = (abs(intera-0.5)<0.1) ? pow(0.80*bb, 0.65) : pow(bb, 0.70);
	color*=bb;

	vec3  Glow = COMPAT_TEXTURE(BloomPass_texture, BloomPass, pos).rgb;
	vec3  Ref = COMPAT_TEXTURE(LinearizePass_texture, LinearizePass, pos).rgb;	
	float maxb = COMPAT_TEXTURE(BloomPass_texture, BloomPass, pos).a;
	float vig  = COMPAT_TEXTURE(PrePass_texture, PrePass, clamp(pos, 0.0+0.5*OriginalSize.zw, 1.0-0.5*OriginalSize.zw)).a;

	vec3 Bloom1 = Bloom;

	if (bloom < -0.01) Bloom1 = plant(Bloom, maxb);

	Bloom1 = min(Bloom1*(orig1+color), max(0.5*(colmx + orig1 - color),0.001*Bloom1));
	Bloom1 = 0.5*(Bloom1 + mix(Bloom1, mix(colmx*orig1, Bloom1, 0.5), 1.0-color));

	Bloom1 = Bloom1 * mix(1.0, 2.0-colmx, bloom_dist);

	color = color + abs(bloom) * Bloom1;

	color = min(color, mix(one, cmask1, mclip));

	if (!interb) color = declip(color, mix(1.0, w3, 0.6)); else w3 = 1.0;

	if (halation > 0.01) {
		Bloom = mix(0.5*(Bloom + Bloom*Bloom), 0.75*Bloom*Bloom, colmx);	
		color = color + 2.0*max((2.0*mix(maxb*maxb, maxb, colmx)-0.5*max(max(Ref.r,Ref.g),Ref.b)),0.25)*mix(1.0,w3,0.5*colmx)*mix(one,cmask,0.6)*Bloom*halation; }

	Glow = mix(Glow, 0.25*color, 0.7*colmx);
	if (glow >= 0.0) color = color + 0.5*Glow*glow; else { cmask*=cmask; cmask*=cmask; color = color + (-glow)*cmask*Glow; }

	color = min(color, 1.0);
	
	color = pow(color, vec3(1.0/gamma_out));

	float rc = 0.6*sqrt(max(max(color.r, color.g), color.b))+0.4;
	
	if (abs(addnoised) > 0.01) 
	{
		vec3 noise0 = noise(vec3(floor(OutputSize.xy * vTexCoord / noiseresd), float(FrameCount)));
		if (noisetype < 0.5) color = mix(color, noise0, 0.25*abs(addnoised) * rc); 
		else color = min(color * mix(1.0, 1.5*noise0.x, 0.5*abs(addnoised)), 1.0);
	}
	
	FragColor = vec4(color*vig*humbar(mix(pos.y, pos.x, bardir))*post_br*corner(pos0), 1.0);
}
