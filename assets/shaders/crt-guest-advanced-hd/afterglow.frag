#version 450

/*
   Phosphor Afterglow Shader pass 0
   
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

//#pragma parameter internal_res "          Internal Resolution" 1.0 1.0 8.0 0.10
#define internal_res 1.0
//#pragma parameter PR  "          Persistence Red" 0.32 0.0 0.50 0.01
#define PR 0.12
//#pragma parameter PG  "          Persistence Green"  0.32 0.0 0.50 0.01
#define PG 0.12
//#pragma parameter PB  "          Persistence Blue"  0.32 0.0 0.50 0.01
#define PB 0.12
//#pragma parameter AS  "          Afterglow Strength" 0.20 0.0 0.60 0.01
#define AS 0.20
//#pragma parameter sat "          Afterglow saturation" 0.50 0.0 1.0 0.01
#define sat 0.50

#define COMPAT_TEXTURE(b,c,d) texture(sampler2D(b,c),d)

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D OriginalHistory0_texture;
layout(set = 1, binding = 1) uniform sampler OriginalHistory0;
layout(set = 1, binding = 2) uniform vec2 TextSize;
layout(set = 1, binding = 3) uniform texture2D AfterglowPassFeedback_texture;
layout(set = 1, binding = 4) uniform sampler AfterglowPassFeedback;

#define TEX0 vTexCoord


void main()
{
	vec3 color  = COMPAT_TEXTURE(OriginalHistory0_texture, OriginalHistory0, TEX0.xy).rgb;
	vec3 accumulate = COMPAT_TEXTURE(AfterglowPassFeedback_texture, AfterglowPassFeedback, TEX0.xy).rgb;

	float w = 1.0;
	if ((color.r + color.g + color.b < (25.0/255.0))) { w = 0.0; }

	vec3 result = mix( max(mix(color, accumulate, 0.49 + vec3(PR, PG, PB))- 2.0/255.0, 0.0), color, w);

   FragColor = vec4(result,1.0);
	//FragColor = vec4(clamp(accumulate + color,0.0,1.0), w);
   //FragColor = COMPAT_TEXTURE(OriginalHistory0_texture, OriginalHistory0, TEX0.xy);
}