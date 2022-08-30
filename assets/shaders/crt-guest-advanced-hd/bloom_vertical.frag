#version 450

/*
   Gaussian blur - vertical pass, dynamic range, resizable
   
   Copyright (C) 2020 guest(r) - guest.r@gmail.com

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


//#pragma parameter SIZEVB "          V. Bloom/Halation/Glow Radius" 4.0 1.0 30.0 1.0 
#define SIZEVB 4.0

//#pragma parameter SIGMA_VB "          Vertical Bloom/Halation/Glow Sigma" 1.0 0.25 15.0 0.05
#define SIGMA_VB 1.0

//#pragma parameter prescalex "          Prescale-X Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with main pass, values must match
#define prescalex 1.0

//#pragma parameter prescaley "          Prescale-Y Factor (for xBR...pre-shader...)" 1.0 1.0 5.0 0.25  // Joint parameter with Linearize Pass pass, values must match
#define prescaley 1.0

#pragma stage fragment
layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D Source_texture;
layout(set = 1, binding = 1) uniform sampler Source;
layout(set = 1, binding = 2) uniform vec2 TextSize;

#define COMPAT_TEXTURE(c,d) texture(sampler2D(Source_texture,c),d)

float invsqrsigma = 1.0/(2.0*SIGMA_VB*SIGMA_VB);

float gaussian(float x)
{
	return exp(-x*x*invsqrsigma);
}

void main()
{
    vec2 invTextSize = 1 / TextSize;
    vec4 OriginalSize = vec4(TextSize,invTextSize.x,invTextSize.y);
	vec4 SourceSize =  OriginalSize * vec4(prescalex, prescaley, (1.0/prescalex), (1.0/prescaley));
	vec4 SourceSize1 = vec4(SourceSize.x, OriginalSize.y, SourceSize.z, OriginalSize.w);

	float f = fract(SourceSize1.y * vTexCoord.y);
	f = 0.5 - f;
	vec2 tex = floor(SourceSize1.xy * vTexCoord)*SourceSize1.zw + 0.5*SourceSize1.zw;
	vec4 color = vec4(0.0);
	vec2 dy  = vec2(0.0, SourceSize1.w);

	float w;
	float wsum = 0.0;
	vec4 pixel;
	float n = -SIZEVB;

	do
	{
		pixel  = COMPAT_TEXTURE(Source, tex + n*dy);
		w      = gaussian(n+f);
		pixel.a*=pixel.a*pixel.a;
		color  = color + w * pixel;
		wsum   = wsum + w;
		n = n + 1.0;
		
	} while (n <= SIZEVB);

	color = color / wsum;
	
	float lenadj = pow(length(color.rgb) / sqrt(3), 0.75) * sqrt(3);
	
	color = color * (lenadj/length(color.rgb));

	FragColor = vec4(color.rgb, 1.0);
	//FragColor = vec4(color.rgb, pow(color.a, 0.175));
}