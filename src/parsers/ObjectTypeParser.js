import {
	BufferAttribute,
	BufferGeometry,
	Color,
	DataTexture,
	Mesh,
	RGBFormat,
	ShaderLib,
	ShaderMaterial,
	UniformsUtils } from 'three';

// Adjusts the three.js standard shader to include batchid highlight
function batchIdHighlightShaderMixin( shader ) {

	const newShader = { ...shader };
	newShader.uniforms = {
		objectColors: { type: "t", value: new DataTexture( new Uint8Array( 3 * 256 ), 256, 1, RGBFormat ) },
		...UniformsUtils.clone( shader.uniforms ),
	};
	newShader.extensions = {
		derivatives: true,
	};
	newShader.lights = true;
	newShader.vertexShader =
		`
			attribute float type;
			varying vec3 diffuse_;
			uniform sampler2D objectColors;
		` +
		newShader.vertexShader.replace(
			/#include <uv_vertex>/,
			`
			#include <uv_vertex>
			float texCoord = type * 0.00390625 + 0.001953125;
			diffuse_ = texture( objectColors, vec2( texCoord, 0 ) ).xyz;
			`
		);
	newShader.fragmentShader =
		`
			varying vec3 diffuse_;
		` +
		newShader.fragmentShader.replace(
			/vec4 diffuseColor = vec4\( diffuse, opacity \);/,
			`
			vec4 diffuseColor = vec4( diffuse_, opacity );
			`
		);

	return newShader;

}

export class ObjectTypeParser {

	constructor() {

		this.matrix = null;
		this.on_load = null;
		this.chunkSize = 100;

		this.objectColors = {
			"Building": 0x7497df,
			"BuildingPart": 0x7497df,
			"BuildingInstallation": 0x7497df,
			"Bridge": 0x999999,
			"BridgePart": 0x999999,
			"BridgeInstallation": 0x999999,
			"BridgeConstructionElement": 0x999999,
			"CityObjectGroup": 0xffffb3,
			"CityFurniture": 0xcc0000,
			"GenericCityObject": 0xcc0000,
			"LandUse": 0xffffb3,
			"PlantCover": 0x39ac39,
			"Railway": 0x000000,
			"Road": 0x999999,
			"SolitaryVegetationObject": 0x39ac39,
			"TINRelief": 0xffdb99,
			"TransportSquare": 0x999999,
			"Tunnel": 0x999999,
			"TunnelPart": 0x999999,
			"TunnelInstallation": 0x999999,
			"WaterBody": 0x4da6ff
		};

		this.material = new ShaderMaterial( batchIdHighlightShaderMixin( ShaderLib.lambert ) );

		const cm_data = new Uint8Array( 3 * 256 );
		let i = 0;
		for ( const objType in this.objectColors ) {

			const color = new Color( this.objectColors[ objType ] );
			const stride = i * 3;

			cm_data[ stride ] = Math.floor( color.r * 255 );
			cm_data[ stride + 1 ] = Math.floor( color.g * 255 );
			cm_data[ stride + 2 ] = Math.floor( color.b * 255 );

			i ++;

		}

		this.material.uniforms.objectColors.value = new DataTexture( cm_data, 256, 1, RGBFormat );

	}

	parse( data, scene ) {

		console.log( "Starting..." );

		const worker = new Worker( "./TypeParserWorker.js" );
		const m = this.matrix;
		const on_load = this.on_load;
		const material = this.material;
		worker.onmessage = function ( e ) {

			const vertices = e.data.v_buffer;

			const geom = new BufferGeometry();

			const vertexArray = new Float32Array( vertices );
			geom.setAttribute( 'position', new BufferAttribute( vertexArray, 3 ) );
			// const idsArray = new Uint16Array( e.data.objectIds );
			// geom.setAttribute( 'objectid', new BufferAttribute( idsArray, 1 ) );
			const typeArray = new Uint8Array( e.data.objectType );
			geom.setAttribute( 'type', new BufferAttribute( typeArray, 1 ) );

			geom.attributes.position.needsUpdate = true;

			if ( m !== null ) {

				geom.applyMatrix4( m );

			}

			geom.computeVertexNormals();

			const mesh = new Mesh( geom, material );

			scene.add( mesh );

			if ( on_load ) {

				on_load();

			}

		};

		worker.postMessage( [ data, { chunkSize: this.chunkSize } ] );

	}

}
