"use strict";

////////////////////////////////////////
// Requiring of Core Node modules
var util = require( "util" ),
	childProcess = require( "child_process" ),
	fs = require( "fs" ),
	path = require( "path" );

var processFile,
	sourceFiles,
	sourceDir,
	targetDir,
	lastArgument;


processFile = function ( sourceFile, targetFile, callback ) {
	fs.open(
		sourceFile,
		'r+',
		function ( error, fileHandle ) {

			if ( error ) {
				console.error( "There was a fatal error while opening the file '" + sourceFile + "'. ('" + ( error.stack || error.message || error.toString() ) + "')" );
			}
	
			fs.readFile(
				sourceFile,
				{},
				function ( error, data ) {
					var parsedJSON,
						organisedJSON;
			
					if ( error ) {
						console.error( "There was a fatal error while reading the file '" + sourceFile + "'. ('" + ( error.stack || error.message || error.toString() ) + "')" );
					}
			
					if ( data ) {
				
						try {
					
							parsedJSON = JSON.parse( data );
					
							organisedJSON = JSON.stringify( parsedJSON, 0, 4 );
					
							fs.writeFile(
								targetFile,
								organisedJSON,
								function ( error, written, buffer ) {
									if ( error ) {
										console.error( "There was a fatal error while writing the file '" + targetFile + "'. ('" + ( error.stack || error.message || error.toString() ) + "')" );
									}
							
									callback( error, !error );
								}
							)
						}
						catch ( error ) {
							console.error( "There was a fatal error while processing the file '" + sourceFile + "'. ('" + ( error.stack || error.message || error.toString() ) + "')" );
					
							callback( error, null );
						} 
					}
					else {
						callback( error, null );
					}
				}
			);
	
		}
	);
};

////////////////////////////////////////
// Console marker - exit
process.on(
	'exit',
	function () {
		console.log( "\nExiting '" + __dirname + "/app.js'." );
		console.log( ( new Array( 41 ) ).join( " •" ) + "\n" );
	}
);

process.on(
	'SIGINT',
	function () {
		////////////////////////////////////////
		// Close each open database
		mongoWrangler.closeDBs();

		process.exit();
	}
);

////////////////////////////////////////
////////////////////////////////////////

if ( process.argv.length < 4 ) {
	console.log( "There weren't enough arguments!" );
	console.log( "You need to supply a source directory or at least one source file, and a target directory." );
	
	process.exit();
}
else {
	lastArgument = process.argv[ process.argv.length - 1 ];
	
	if ( !fs.lstatSync( lastArgument ).isDirectory() ) {
		console.log( "The last argument wasn't a directory!" );
		console.log( "You need to supply a target directory as the last argument where the files will be saved to." );
	
		process.exit();
	}
	else {
		for ( var i = 2; i < process.argv.length - 1; i++ ) {
			(function ( filePath, j ) {
				var stats = fs.lstatSync( filePath );
				
				if ( stats ) {
					if ( stats.isDirectory() ) {
						fs.readdir(
							filePath,
							function ( error, files ) {
								if ( error ) {
									console.error( "There was a fatal error while reading these files in '" + filePath + "'. ('" + ( error.stack || error.message || error.toString() ) + "')" );
								}
								
								if ( files ) {
									if ( files.length ) {
										
										console.log( "Processing " + files.length + " files in '" + filePath + "'" );
										
										files.forEach(
											function ( element, i ) {
												var fullPath = filePath + "/" + element,
													targetFile = lastArgument + "/" + element;
												
												if ( path.extname( fullPath ).toLowerCase() === ".json" ) {
													processFile(
														fullPath,
														targetFile,
														function ( error, result ) {
															if ( error ) {
																console.error( "We didn't manage to process '" + element + "'" );
															}
															else {
																console.log( "We processed '" + element + "', it is in '" + lastArgument + "'" );
															}
														}
													);
												}
												else {
													console.log( "We skipped '" + element + "', it doesn't look a JSON file." );
												}
											}
										)
									}
									else {
										console.warn( "It doesn't look like '" + filePath + "' contains any files!" );
									}
								}
								else {
									console.warn( "No files object for '" + filePath + "' - there is probably a problem!" );
								}
							}
						)
					}
					else if ( stats.isFile() ) {
						if ( path.extname( filePath ).toLowerCase() === ".json" ) {
							processFile(
								filePath,
								lastArgument,
								function ( error, result ) {
									if ( error ) {
										console.error( "We didn't manage to process '" + filePath + "'" );
									}
									else {
										console.log( "We processed '" + filePath + "', it is in '" + lastArgument + "'" );
									}
								}
							);
						}
						else {
							console.warn( "It doesn't look like '" + filePath + "' is a JSON file!" );
						}
					}
					else {
						console.warn( "We don't exactly know what '" + filePath + "' is!" );
					}
				}
				else {
					console.warn( "We encountered a problem getting information for '" + filePath + "'!" );
				}
			})( process.argv[ i ], i );
			
		}
	}
}

////////////////////////////////////////
////////////////////////////////////////
