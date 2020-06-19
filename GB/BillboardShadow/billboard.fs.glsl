#version 330 core

in vec3 FragPos;
in vec2 texCoords;

out vec4 FragColor;

// texture samplers
uniform sampler2D texture1;
uniform mat4 model;

uniform vec3 viewPos;
uniform vec3 lightPos = vec3(0.0, 5.0, -5.0);
uniform vec3 lightColor = vec3(1.0, 1.0, 1.0);

float ambientStrength = 0.1;
float specularStrength = 0.4;

void main()
{
	vec3 lightDir = normalize(lightPos - FragPos);

	vec3 normal = mat3(transpose(inverse(model))) * vec3(0.0, 0.0, 1.0);
	float nDotL = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = nDotL * lightColor;

	vec3 viewDir = normalize(viewPos - FragPos);
	vec3 halfDir = normalize(lightDir + viewDir); // Blinn-phong

	float spec = pow(max(dot(normal, halfDir), 0.0), 1024);
	vec3 specular = specularStrength * spec * lightColor;

	vec3 baseLight = (ambientStrength * lightColor) + diffuse;

	FragColor = vec4(baseLight, 1.0) * texture(texture1, texCoords);
	FragColor += vec4(specular, 0.0);
}

