#version 450

/*
   Interlacing
   
   Copyright (C) 2020-2021 guest(r) - guest.r@gmail.com

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


//#pragma parameter GAMMA_INPUT "Gamma Input" 1.80 1.0 5.0 0.05
#define GAMMA_INPUT 1.80

//#pragma parameter bogus_interlacing "[ INTERLACING OPTIONS ]: " 0.0 0.0 0.0 1.0

//#pragma parameter inter "          Interlace Trigger Resolution :" 400.0 0.0 800.0 25.0
#define inter 400.0     // interlace resolution

//#pragma parameter interm "          Interlace Mode: OFF, Normal 1-3, Interpolation 4" 4.0 0.0 4.0 1.0
#define interm 4.0     // interlace mode 

//#pragma parameter iscan "          Interlacing Scanline Effect" 0.20 0.0 1.0 0.05
#define iscan 0.20     // interlacing effect scanlining

//#pragma parameter intres "          Internal Resolution Y: 224p/240p, 1.5...y-dowsample" 0.0 0.0 6.0 0.5 // Joint parameter with main pass, values must match
#define intres 2.0     // interlace resolution

//#pragma parameter prescalex "          Prescale-X Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with main pass, values must match
#define prescalex 1.0     // prescale-x factor

//#pragma parameter prescaley "          Prescale-Y Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with main pass, values must match
#define prescaley 1.0     // prescale-y factor

//#pragma parameter iscans "          Interlacing (Scanline) Saturation" 0.25 0.0 1.0 0.05
#define iscans 0.25     // interlace saturation

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D Source_texture;
layout(set = 1, binding = 1) uniform sampler Source;
layout(set = 1, binding = 2) uniform vec2 TextSize;
layout(set = 3, binding = 0) uniform uint FrameCount;
#define COMPAT_TEXTURE(c,d) texture(sampler2D(Source_texture,Source),d)


vec3 plant (vec3 tar, float r)
{
	float t = max(max(tar.r,tar.g),tar.b) + 0.00001;
	return tar * r / t;
}


void main()
{
	//vec4 SourceSize = vec4(TextSize,1.0/TextSize.x,1.0/TextSize.y)
	vec4 OriginalSize = vec4(TextSize,1.0/TextSize.x,1.0/TextSize.y);
	vec4 SourceSize =  OriginalSize * vec4(prescalex, prescaley, (1.0/prescalex), (1.0/prescaley));
	vec3 c1 = COMPAT_TEXTURE(Source, vTexCoord).rgb;
	vec3 c2 = COMPAT_TEXTURE(Source, vTexCoord + vec2(0.0, SourceSize.w)).rgb;

	vec3  c  = c1;

	float intera = 1.0;
	float gamma_in = clamp(GAMMA_INPUT, 1.0, 5.0);

	float m1 = max(max(c1.r,c1.g),c1.b);
	float m2 = max(max(c2.r,c2.g),c2.b);
	vec3 df = abs(c1-c2);
		
	float d = max(max(df.r,df.g),df.b);
	if (interm == 2.0) d = mix(0.1*d,10.0*d, step(m1/(m2+0.0001),m2/(m1+0.0001)));

	float r = m1;

	float yres_div = 1.0; if (intres > 1.25) yres_div = intres;
		
	if (inter <= OriginalSize.y/yres_div && interm > 0.5 && intres != 1.0 && intres != 0.5) 
	{
		intera = 0.25;
		float line_no  = clamp(floor(mod(OriginalSize.y*vTexCoord.y, 2.0)), 0.0, 1.0);
		float frame_no = clamp(floor(mod(float(FrameCount),2.0)), 0.0, 1.0);
		float ii = abs(line_no-frame_no);
		
		if (interm < 3.5)
		{
			c2 = plant(mix(c2, c2*c2, iscans), max(max(c2.r,c2.g),c2.b));
			r = clamp(max(m1*ii, (1.0-iscan)*min(m1,m2)), 0.0, 1.0);
			c = plant( mix(mix(c1,c2, min(mix(m1, 1.0-m2, min(m1,1.0-m1))/(d+0.00001),1.0)), c1, ii), r);
			if (interm == 3.0) c = (1.0-0.5*iscan)*mix(c2, c1, ii);
		}
		if (interm == 4.0) { c = plant(mix(c, c*c, 0.5*iscans), max(max(c.r,c.g),c.b)); intera = 0.45; }
	}
	c = pow(c, vec3(gamma_in));
	
	if (vTexCoord.x > 0.5) gamma_in = intera;
	
	FragColor = vec4(c, gamma_in);
	//FragColor = COMPAT_TEXTURE(Source,vTexCoord);
	//FragColor = vec4(clamp(float(FrameCount)/float(500),0.0,1.0));
	//FragColor = vec4(1.0,1.0,1.0,1.0);
}