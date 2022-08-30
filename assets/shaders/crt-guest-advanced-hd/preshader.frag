#version 450

/*
   CRT Advanced Afterglow, color altering
   
   Copyright (C) 2019-2022 guest(r) and Dr. Venom
   
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

//#pragma parameter AS "          Afterglow Strength" 0.20 0.0 0.60 0.01
#define AS 0.20

//#pragma parameter sat "          Afterglow saturation" 0.50 0.0 1.0 0.01
#define sat 0.5

//#pragma parameter bogus_color "[ COLOR TWEAKS ]:" 0.0 0.0 1.0 1.0

//#pragma parameter CS "          Display Gamut: sRGB, Modern, DCI, Adobe, Rec.2020" 0.0 0.0 4.0 1.0 

//#pragma parameter CP "          CRT Profile: EBU | P22 | SMPTE-C | Philips | Trin." 0.0 -1.0 5.0 1.0 

#define CP 0.0
#define CS 0.0

//#pragma parameter TNTC "          LUT Colors: Trin.1 | Trin.2 | Nec Mult. | NTSC" 0.0 0.0 4.0 1.0
#define TNTC 0.0

//#pragma parameter LS "          LUT Size" 32.0 32.0 64.0 32.0
#define LS 32.0

#define LUTLOW 5.0  // "Fix LUT Dark - Range" from 0.0 to 50.0 - RGB singletons

#define LUTBR 1.0   // "Fix LUT Brightness" from 0.0 to 1.0

//#pragma parameter WP "          Color Temperature %" 0.0 -100.0 100.0 5.0 

//#pragma parameter wp_saturation "          Saturation Adjustment" 1.0 0.0 2.0 0.05

//#pragma parameter pre_bb "          Brightness Adjustment" 1.0 0.0 2.0 0.01

//#pragma parameter contr "          Contrast Adjustment" 0.0 -1.0 1.0 0.05

//#pragma parameter sega_fix "          Sega Brightness Fix" 0.0 0.0 1.0 1.0

//#pragma parameter BP "          Raise Black Level" 0.0 -100.0 25.0 1.0

//#pragma parameter vigstr "          Vignette Strength" 0.0 0.0 2.0 0.05

//#pragma parameter vigdef "          Vignette Size" 1.0 0.5 3.0 0.10

#define WP 0.0
#define wp_saturation 1.0
#define pre_bb 1.0
#define contr 0.0
#define sega_fix 0.0
#define BP 0.0
#define vigstr 0.0
#define vigdef 1.0

layout(location = 0) in vec2 vTexCoord;
layout(location = 0) out vec4 FragColor;
layout(set = 1, binding = 0) uniform texture2D StockPass_texture;
layout(set = 1, binding = 1) uniform sampler StockPass;
layout(set = 1, binding = 2) uniform vec2 TextSize;
layout(set = 1, binding = 3) uniform texture2D AfterglowPass_texture;
layout(set = 1, binding = 4) uniform sampler AfterglowPass;

#define OriginalSize TextSize

#define COMPAT_TEXTURE(b,c,d) texture(sampler2D(b,c),d)


// Color profile matrices

const mat3 Profile0 = 
mat3(
 0.412391,  0.212639,  0.019331,
 0.357584,  0.715169,  0.119195,
 0.180481,  0.072192,  0.950532
);

const mat3 Profile1 = 
mat3(
 0.430554,  0.222004,  0.020182,
 0.341550,  0.706655,  0.129553,
 0.178352,  0.071341,  0.939322
);

const mat3 Profile2 = 
mat3(
 0.396686,  0.210299,  0.006131,
 0.372504,  0.713766,  0.115356,
 0.181266,  0.075936,  0.967571
);

const mat3 Profile3 = 
mat3(
 0.393521,  0.212376,  0.018739,
 0.365258,  0.701060,  0.111934,
 0.191677,  0.086564,  0.958385
);

const mat3 Profile4 = 
mat3(
 0.392258,  0.209410,  0.016061,
 0.351135,  0.725680,  0.093636,
 0.166603,  0.064910,  0.850324
);

const mat3 Profile5 = 
mat3(
 0.377923,  0.195679,  0.010514,
 0.317366,  0.722319,  0.097826,
 0.207738,  0.082002,  1.076960
);

const mat3 ToSRGB = 
mat3(
 3.240970, -0.969244,  0.055630,
-1.537383,  1.875968, -0.203977,
-0.498611,  0.041555,  1.056972
);

const mat3 ToModern = 
mat3(
 2.791723,	-0.894766,	0.041678,
-1.173165,	 1.815586, -0.130886,
-0.440973,	 0.032000,	1.002034
);

const mat3 ToDCI = 
mat3(
 2.493497,	-0.829489,	0.035846,
-0.931384,	 1.762664, -0.076172,
-0.402711,	 0.023625,	0.956885
);

const mat3 ToAdobe = 
mat3(
 2.041588, -0.969244,  0.013444,
-0.565007,  1.875968, -0.11836,
-0.344731,  0.041555,  1.015175
);

const mat3 ToREC = 
mat3(
 1.716651, -0.666684,  0.017640,
-0.355671,  1.616481, -0.042771,
-0.253366,  0.015769,  0.942103
); 

// Color temperature matrices

const mat3 D65_to_D55 = mat3 (
           0.4850339153,  0.2500956126,  0.0227359648,
           0.3488957224,  0.6977914447,  0.1162985741,
           0.1302823568,  0.0521129427,  0.6861537456);


const mat3 D65_to_D93 = mat3 (
           0.3412754080,  0.1759701322,  0.0159972847,
           0.3646170520,  0.7292341040,  0.1215390173,
           0.2369894093,  0.0947957637,  1.2481442225);


vec3 fix_lut(vec3 lutcolor, vec3 ref)
{
	float r = length(ref);
	float l = length(lutcolor);
	float m = max(max(ref.r,ref.g),ref.b);
	ref = normalize(lutcolor + 0.0000001) * mix(r, l, pow(m,1.25));
	return mix(lutcolor, ref, LUTBR);
}


float vignette(vec2 pos) {
	vec2 b = vec2(vigdef, vigdef) *  vec2(1.0, OriginalSize.x/OriginalSize.y) * 0.125;
	pos = clamp(pos, 0.0, 1.0);
	pos = abs(2.0*(pos - 0.5));
	vec2 res = mix(vec2(0.0,0.0), vec2(1.0,1.0), smoothstep(vec2(1.0,1.0), vec2(1.0,1.0)-b, sqrt(pos)));
	res = pow(res, vec2(0.70,0.70));	
	return max(mix(1.0, sqrt(res.x*res.y), vigstr), 0.0);
}


vec3 plant (vec3 tar, float r)
{
	float t = max(max(tar.r,tar.g),tar.b) + 0.00001;
	return tar * r / t;
}

float contrast(float x)
{ 
  float y = 2.0*x-1.0;
  y = (sin(y*1.57079632679)+1.0)*0.5;
  return mix(x, y, contr);
}

void main()
{
   vec4 imgColor = COMPAT_TEXTURE(StockPass_texture, StockPass, vTexCoord.xy);
   vec4 aftglow = COMPAT_TEXTURE(AfterglowPass_texture, AfterglowPass, vTexCoord.xy);
   
   //float w = 1.0-aftglow.w;
   //float w = min(1.0 / length(imgColor.rgb),1.0);
	float w = 1;

   float l = length(aftglow.rgb);
   aftglow.rgb = AS*w*normalize(pow(aftglow.rgb + 0.01, vec3(sat)))*l;
   float bp = w * BP/255.0;
   
   if (sega_fix > 0.5) imgColor.rgb = imgColor.rgb * (255.0 / 239.0);
   
   imgColor.rgb = min(imgColor.rgb, 1.0);
   
   vec3 color = imgColor.rgb;
 
   if (int(TNTC) == 0)
   {
      color.rgb = imgColor.rgb;
   }
   else
   {
	  float lutlow = LUTLOW/255.0; float invLS = 1.0/LS;
	  vec3 lut_ref = imgColor.rgb + lutlow*(1.0 - pow(imgColor.rgb, vec3(0.333,0.333,0.333)));
	  float lutb = lut_ref.b * (1.0-0.5*invLS);	  
	  lut_ref.rg    = lut_ref.rg * (1.0-invLS) + 0.5*invLS; 
	  float tile1 = ceil (lutb * (LS-1.0));
	  float tile0 = max(tile1 - 1.0, 0.0);
	  float f = fract(lutb * (LS-1.0)); if (f == 0.0) f = 1.0;
	  vec2 coord0 = vec2(tile0 + lut_ref.r, lut_ref.g)*vec2(invLS, 1.0);
	  vec2 coord1 = vec2(tile1 + lut_ref.r, lut_ref.g)*vec2(invLS, 1.0);
	  vec4 color1, color2, res;

      res.rgb = fix_lut (res.rgb, imgColor.rgb);
	  
      color = mix(imgColor.rgb, res.rgb, min(TNTC,1.0));
   }

	vec3 c = clamp(color, 0.0, 1.0);
	
	float p;
	mat3 m_out;
	
	if (CS == 0.0) { p = 2.2; m_out =  ToSRGB;   } else
	if (CS == 1.0) { p = 2.2; m_out =  ToModern; } else	
	if (CS == 2.0) { p = 2.6; m_out =  ToDCI;    } else
	if (CS == 3.0) { p = 2.2; m_out =  ToAdobe;  } else
	if (CS == 4.0) { p = 2.4; m_out =  ToREC;    }
	
	color = pow(c, vec3(p));
	
	mat3 m_in = Profile0;

	if (CP == 0.0) { m_in = Profile0; } else	
	if (CP == 1.0) { m_in = Profile1; } else
	if (CP == 2.0) { m_in = Profile2; } else
	if (CP == 3.0) { m_in = Profile3; } else
	if (CP == 4.0) { m_in = Profile4; } else
	if (CP == 5.0) { m_in = Profile5; }
	
	color = m_in*color;
	color = m_out*color;

	color = clamp(color, 0.0, 1.0);

	color = pow(color, vec3(1.0/p));	
	
	if (CP == -1.0) color = c;
	
	vec3 scolor1 = plant(pow(color, vec3(wp_saturation)), max(max(color.r,color.g),color.b));
	float luma = dot(color, vec3(0.299, 0.587, 0.114));
	vec3 scolor2 = mix(vec3(luma), color, wp_saturation);
	color = (wp_saturation > 1.0) ? scolor1 : scolor2;

	color = plant(color, contrast(max(max(color.r,color.g),color.b)));

	p = 2.2;
	
	color = pow(color, vec3(p)); 
 
	color = clamp(color, 0.0, 1.0); 
	
	vec3 warmer = D65_to_D55*color;
	warmer = ToSRGB*warmer;
	
	vec3 cooler = D65_to_D93*color;
	cooler = ToSRGB*cooler;
	
	float m = abs(WP)/100.0;
	
	vec3 comp = (WP < 0.0) ? cooler : warmer;
	
	color = mix(color, comp, m);
	color = pow(max(color, 0.0), vec3(1.0/p));

	if (BP > -0.5) color = color + aftglow.rgb + bp; else
	{ 
		color = max(color + BP/255.0, 0.0) / (1.0 + BP/255.0*step(- BP/255.0, max(max(color.r,color.g),color.b))) + aftglow.rgb;
	}
	
	color = min(color * pre_bb, 1.0);
	
	//FragColor = vec4(color, vignette(vTexCoord.xy));
	FragColor = vec4(color, 1.0);
	//FragColor = COMPAT_TEXTURE(AfterglowPass_texture, AfterglowPass, vTexCoord.xy);
} 