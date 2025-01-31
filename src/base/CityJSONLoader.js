import {
	BufferAttribute,
	BufferGeometry,
	Group,
	Matrix4 } from 'three';
import { CityObjectParser } from '../parsers/CityObjectParser.js';

export class CityJSONLoader {

	constructor( parser ) {

		this.texturesPath = '';
		this.scene = new Group();
		this.matrix = null;
		this.parser = parser || new CityObjectParser();

	}

	setTexturesPath( path ) {

		this.texturesPath = path;

	}

	load( data ) {

		if ( typeof data === "object" ) {

			if ( this.matrix == null ) {

				this.computeMatrix( data );

			}

			this.parser.matrix = this.matrix;
			this.parser.parse( data, this.scene );

		}

	}

	computeMatrix( data ) {

		const normGeom = new BufferGeometry();

		const vertices = new Float32Array( data.vertices.map( v => [ v[ 0 ], v[ 1 ], 0 ] ).flat() );
		normGeom.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );

		normGeom.computeBoundingSphere();
		const centre = normGeom.boundingSphere.center;
		const radius = normGeom.boundingSphere.radius;

		const s = radius === 0 ? 1 : 1.0 / radius;

		const matrix = new Matrix4();
		matrix.set(
			s, 0, 0, - s * centre.x,
			0, s, 0, - s * centre.y,
			0, 0, s, - s * centre.z,
			0, 0, 0, 1
		);

		this.matrix = matrix;

	}

}
