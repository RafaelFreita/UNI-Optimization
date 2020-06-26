#version 330 core

layout(points) in;
layout(triangle_strip, max_vertices = 4) out;

out vec2 texCoords;
out vec3 FragPos;

uniform mat4 model;
uniform mat4 view;
uniform mat4 projection;

void main() {
	vec4 p = gl_in[0].gl_Position;

	mat4 mvp = projection * view * model;

	vec4 pos = p + vec4(-0.5, -0.5, 0.0, 0.0);
	gl_Position = mvp * pos;
	FragPos = vec3(model * pos);
	texCoords = vec2(0.0, 0.0);
	EmitVertex();

	pos = p + vec4(+0.5, -0.5, 0.0, 0.0);
	gl_Position = mvp * pos;
	FragPos = vec3(model * pos);
	texCoords = vec2(1.0, 0.0);
	EmitVertex();

	pos = p + vec4(-0.5, +0.5, 0.0, 0.0);
	gl_Position = mvp * pos;
	FragPos = vec3(model * pos);
	texCoords = vec2(0.0, 1.0);
	EmitVertex();

	pos = p + vec4(+0.5, +0.5, 0.0, 0.0);
	gl_Position = mvp * pos;
	FragPos = vec3(model * pos);
	texCoords = vec2(1.0, 1.0);
	EmitVertex();

	EndPrimitive();
}