import { ChunkParser } from './ChunkParser.js';

export class ParserWorker{
	postMessage(e){

		const parser = new ChunkParser();
	
		const props = e[ 1 ];
	
		if ( props ) {
	
			if ( props.chunkSize ) {
	
				parser.chunkSize = props.chunkSize;
	
			}
	
			if ( props.objectColors ) {
	
				parser.objectColors = props.objectColors;
	
			}
	
		}
	
		parser.onchunkload = ( v, objectIds, objectType ) => {
	
			const vertexArray = new Float32Array( v );
			const vertexBuffer = vertexArray.buffer;
	
			const msg = {
				v_buffer: vertexBuffer,
				objectIds,
				objectType
			};
			this.callback( msg, [ vertexBuffer ] );
	
		};
	
		parser.parse( e[ 0 ] );
	
	};
	
	
}
