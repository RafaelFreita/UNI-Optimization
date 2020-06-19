#version 330 core

in vec2 texCoords;
in vec3 FragPos;
in mat4 mvp;

out vec4 FragColor;

// texture samplers
uniform sampler2D texture1;
uniform sampler2D texture2;
uniform vec3 viewPos;
uniform vec4 billboardPos = vec4(0.0, 0.0, 0.0, 1.0);

uniform vec3 lightPos = vec3(0.0, 5.0, -5.0);
uniform vec3 lightColor = vec3(1.0, 1.0, 1.0);

uniform mat4 billboardModel;

float ambientStrength = 0.1;
float specularStrength = 0.15;
float shadowStrength = 0.1;

bool intersect_triangle(
	vec3 ro, vec3 rd, vec3 A, vec3 B, vec3 C,
	out float t, out float u, out float v, out vec3 N
) {
	vec3 E1 = B - A;
	vec3 E2 = C - A;
	N = cross(E1, E2);
	float det = -dot(rd, N);
	float invdet = 1.0 / det;
	vec3 AO = ro - A;
	vec3 DAO = cross(AO, rd);
	u = dot(E2, DAO) * invdet;
	v = -dot(E1, DAO) * invdet;
	t = dot(AO, N) * invdet;
	//det >= 1e-6 && t >= 0.0 &&  // Not sure why u need those tbh
	return (u >= 0.0 && v >= 0.0 && (u + v) <= 1.0);
}

float map(float value, float inMin, float inMax, float outMin, float outMax) {
	return outMin + (outMax - outMin) * (value - inMin) / (inMax - inMin);
}

void main()
{
	vec3 lightDir = normalize(lightPos - FragPos);
	vec3 normal = vec3(0.0, 1.0, 0.0);
	float nDotL = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = nDotL * lightColor;

	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(lightDir + viewDir); // Blinn-phong

	float spec = pow(max(dot(normal, halfDir), 0.0), 64);
	vec3 specular = specularStrength * spec * lightColor;

	vec3 baseLight = (ambientStrength * lightColor) + diffuse;

	FragColor = vec4(baseLight, 1.0) * texture(texture1, texCoords * 3);
	FragColor += vec4(specular, 1.0);

	vec3 a = vec3(billboardModel * (billboardPos + vec4(-0.5, -0.5, 0.0, 0.0)));
	vec3 b = vec3(billboardModel * (billboardPos + vec4(+0.5, -0.5, 0.0, 0.0)));
	vec3 c = vec3(billboardModel * (billboardPos + vec4(-0.5, +0.5, 0.0, 0.0)));
	vec3 d = vec3(billboardModel * (billboardPos + vec4(+0.5, +0.5, 0.0, 0.0)));

	float t, u, v;
	vec3 n;
	float treeAlpha = 0.0f;
	if (intersect_triangle(FragPos, lightPos, a, b, c, t, u, v, n)) {
		treeAlpha = texture(texture2, vec2(u, v)).a;
	}

	if (intersect_triangle(FragPos, lightPos, d, c, b, t, u, v, n)) {
		u = 1 - u;
		v = 1 - v;
		treeAlpha = texture(texture2, vec2(u, v)).a;
	}

	treeAlpha = map((1 - treeAlpha), 0.0, 1.0, shadowStrength, 1.0);
	FragColor.rgb *= treeAlpha;
}

