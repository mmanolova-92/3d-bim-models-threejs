// Define global variables

var canvas, renderer, scene, texture;
var camera, ambientLight, controls;
var manager, materialLoader, objectLoader, mesh, defaultMaterial, objects = new Array();
var coordinatesWGS, coordinatesECEF0, coordinatesECEF1, coordinatesECEF2, coordinatesENU1, coordinatesENU2;
var texture, groundMaterial, groundLength, ground, geometry;
var vector, raycaster, intersects, intersected1, intersected2, intersected3;
var currentMaterial1, currentMaterial2, currentMaterial3, selected, offset = new THREE.Vector3();
var percentComplete;

// Define the coordinates of the bridge centroid in the RD Dutch coordinate reference system

var centerRD_X = 93815.2265;
var centerRD_Y = 436409.9599;
var meter2inch = 39.37007874;
var inch2meter = 0.0254;

// Define the initial position of the mouse

var mouse = { x: 0, y: 0 };

// Define the geometry and material files of the 3D BIM model

var files = new Array( { 'geometry': 'models/Koninginnebrug_Retaining structure.obj',
                         'material': 'models/Koninginnebrug_Retaining structure.mtl' },

                       { 'geometry': 'models/Koninginnebrug_Substructure.obj',
                         'material': 'models/Koninginnebrug_Substructure.mtl' },

                       { 'geometry': 'models/Koninginnebrug_Superstructure.obj',
                         'material': 'models/Koninginnebrug_Superstructure.mtl' },

                       { 'geometry': 'models/Koninginnebrug_Span locks.obj',
                         'material': 'models/Koninginnebrug_Span locks.mtl' } );

// Insert some test inspection data

var scores = new Array( { id: 1, inspector: "B. Ford", inspdate: "22/08/2012", score: 5 },
                        { id: 2, inspector: "B. Ford", inspdate: "22/08/2012", score: 3 },
                        { id: 3, inspector: "B. Ford", inspdate: "22/08/2012", score: 1 },
                        { id: 4, inspector: "B. Ford", inspdate: "22/08/2012", score: 2 },
                        { id: 1, inspector: "B. Ford", inspdate: "22/08/2007", score: 4 },
                        { id: 2, inspector: "B. Ford", inspdate: "22/08/2007", score: 2 },
                        { id: 3, inspector: "B. Ford", inspdate: "22/08/2007", score: 1 },
                        { id: 4, inspector: "B. Ford", inspdate: "22/08/2007", score: 1 },
                        { id: 1, inspector: "B. Ford", inspdate: "22/08/2002", score: 2 },
                        { id: 2, inspector: "B. Ford", inspdate: "22/08/2002", score: 1 },
                        { id: 3, inspector: "B. Ford", inspdate: "22/08/2002", score: 5 },
                        { id: 4, inspector: "B. Ford", inspdate: "22/08/2002", score: 5 } );

// Toggle show and hide of the tabs on click

$( document ).ready(function() {
  $( ".openLegend" ).click( function() {

    $( ".tabLegend" ).show( "slow" );

    $( ".openLegend" ).hide();
    $( ".openSwitcher" ).hide();
    $( ".openHistory" ).hide();

  });

  $( ".closeLegend" ).click(function() {

    $( ".tabLegend" ).hide( "slow" );

    $( ".openLegend" ).show();
    $( ".openSwitcher" ).show();
    $( ".openHistory" ).show();

  });

  $( ".openSwitcher" ).click( function() {

    $( ".tabSwitcher" ).show( "slow" );

    $( ".openSwitcher" ).hide();
    $( ".openLegend" ).hide();
    $( ".openHistory" ).hide();

  });

  $( ".closeSwitcher" ).click(function() {

    $( ".tabSwitcher" ).hide( "slow" );

    $( ".openLegend" ).show();
    $( ".openSwitcher" ).show();
    $( ".openHistory" ).show();

  });

  $( ".openHistory" ).click( function() {

    $( ".tabHistory" ).show( "slow" );

    $( ".openHistory" ).hide();
    $( ".openLegend" ).hide();
    $( ".openSwitcher" ).hide();

  });

  $( ".closeHistory" ).click(function() {

    $( ".tabHistory" ).hide( "slow" );

    $( ".openLegend" ).show();
    $( ".openSwitcher" ).show();
    $( ".openHistory" ).show();

  });

  $( ".closeDetails" ).click(function() {

    $( "#info" ).hide( "slow" );

  });

});

// Configure the visualization of the 3D BIM model in Three.js

window.onload = function () {

  init();
  animate();
  render();

}

function init() {

  canvas = document.getElementById( "webgl" );

  // Set up the WebGL renderer

  renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
  renderer.setSize( canvas.clientWidth, canvas.clientHeight );
  renderer.setViewport( 0, 0, canvas.clientWidth, canvas.clientHeight );

  renderer.setClearColor( 0x000000, 0.0 );

  renderer.domElement.style.zIndex = "1";
  renderer.domElement.style.top = "0";

  canvas.appendChild( renderer.domElement );
  canvas.addEventListener( "mousedown", onMouseDown, false );
  canvas.addEventListener( "resize", onCanvasResize, false );

  // Set up the scene, camera, light and orbit controls

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera( 70, canvas.clientWidth / canvas.clientHeight, 0.1, 100000 );
  camera.up.set( 0, 0, 1 );
  camera.position.set( 0, 200, 127 );
  console.log(camera.position);
  camera.lookAt( scene.position );
  scene.add( camera );

  ambientLight = new THREE.AmbientLight( 0xFFFFFF, 0.85 );
  scene.add( ambientLight );

  controls = new THREE.OrbitControls( camera, canvas );
  controls.noZoom = false;
  controls.noRotate = false;
  controls.noPan = false;
  controls.maxZoom = 100000;
  controls.zoomSpeed = 1.2;
  controls.addEventListener( "change", render );

  // Set up the loading manager for the OBJ and MTL files

  manager = new THREE.LoadingManager();

  manager.onProgress = function ( file, loaded, total ) {

    percentComplete = loaded / total * 100;

    $( ".progress-bar" ).width( percentComplete + "%" );

    console.log( "Loading file: " + file + ".\nLoaded " + loaded + " of " + total + " files." );

  };

  manager.onError = function ( file ) {

    console.log( "Error loading " + file );

  };

  materialLoader = new THREE.MTLLoader( manager );
  objectLoader = new THREE.OBJLoader( manager );

  var index = 0;

  // Load the OBJ files, convert the coordinates, apply the transformation matrix and add to scene

  function loadFile() {

    if (index > files.length - 1) return;

      objectLoader.load( files[index].geometry, function( object ) {

      object.userData.Name = files[index].geometry.split( "_" )[1].split( "." )[0];

      coordinatesWGS = [ { lat: 51.912815, lon: 4.497945 },
                         { lat: 51.913205, lon: 4.497099 },
                         { lat: 51.912457, lon: 4.498672 } ];

      coordinatesECEF0 = convertToECEF( coordinatesWGS[0].lat, coordinatesWGS[0].lon, 0 );
      coordinatesECEF1 = convertToECEF( coordinatesWGS[1].lat, coordinatesWGS[1].lon, 0 );
      coordinatesECEF2 = convertToECEF( coordinatesWGS[2].lat, coordinatesWGS[2].lon, 0 );

      var transformationMatrix = new THREE.Matrix4();
      transformationMatrix.set(
          0.016862, 0.018996, 0, 93811.90625,
          -0.018996, 0.016862, 0, 436408.6875,
          0, 0, 0.0254, 0,
          0, 0, 0, 1
      );

      object.applyMatrix( transformationMatrix );

      if ( index == 0 ) {

        var bboxValues = makeBBox( object );
        createGround( bboxValues, object.rotation );

      }

      object.up.set( 0, 0, 1 );

      object.position.x = 0 ;
      object.position.y = 0 ;

      object.updateMatrixWorld();

      scene.add( object );

      objects.push( object );

      // Populate the userData property of each object with the test inspection data

      for ( var i = 0; i < objects.length; i++ ) {

        objects[i].userData.Name = files[i].geometry.split( "_" )[1].split( "." )[0];

        objects[i].userData.DatabaseId12 = scores[i].id;
        objects[i].userData.DatabaseId07 = scores[i].id;
        objects[i].userData.DatabaseId02 = scores[i].id;

        objects[i].userData.InspectionDate12 = scores[i].inspdate;
        objects[i].userData.InspectionDate07 = scores[i+4].inspdate;
        objects[i].userData.InspectionDate02 = scores[i+8].inspdate;

        objects[i].userData.Inspector12 = scores[i].inspector;
        objects[i].userData.Inspector07 = scores[i+4].inspector;
        objects[i].userData.Inspector02 = scores[i+8].inspector;

        objects[i].userData.Score12 = scores[i].score;
        objects[i].userData.Score07 = scores[i+4].score;
        objects[i].userData.Score02 = scores[i+8].score;

        // Connect each object to the corresponding checkbox in the layer switcher tab

        objects[i].traverse( function ( child ) {

          child.up.set( 0, 0, 1 );

          child.updateMatrixWorld();

          if ( child instanceof THREE.Mesh ) {

            if ( $( ".years input:radio" )[0].checked ) {

              colorElement( child, objects[i].userData.Score12 );

            }

          }

        });

      }

      index++;

      loadFile();

    });

  }

  loadFile();

}

// Create the bounding box of the 3D BIM model

function makeBBox( object ) {

  var bbox = new THREE.Box3().setFromObject(object);

  var xLength = bbox.max.x - bbox.min.x;
  var yLength = bbox.max.y - bbox.min.y;
  var zLength = bbox.max.z - bbox.min.z;

  return { bbox, xLength, yLength };

}

// Configure an image of the area of interest, obtained from WMS request


function createGround( bboxValues, object_rotation ) {

  var xLength = bboxValues.xLength;
  var yLength = bboxValues.yLength;

  // Set the width and height of the WMS image

  var wmsWidth = 512;
  var wmsHeight = 512;

  // Calculate the bounding box in meters because of the RD Dutch coordinate reference system

  var length_in_meters = xLength > yLength ? Math.round( xLength ) : Math.round( yLength );

  // Calculate the lower left and upper right corners for the WMS image around the center point of the largest object in the 3D BIM model

  var centerRD_X = (bboxValues.bbox.max.x + bboxValues.bbox.min.x) / 2;
  var centerRD_Y = (bboxValues.bbox.max.y + bboxValues.bbox.min.y) / 2;

  var leftX = centerRD_X - length_in_meters;
  var lowerY = centerRD_Y - length_in_meters;
  var rightX = centerRD_X + length_in_meters;
  var upperY = centerRD_Y + length_in_meters;

  // Construct the WMS request for the digital topographic map of the Dutch cadastre

  var baseURL = "https://geodata.nationaalgeoregister.nl/top10nlv2/ows?";
  var layers = "terreinvlak,waterdeelvlak,wegdeelvlak";
  var styles = "top10nlv2:Terrein_vlak_style,top10nlv2:Waterdeel_Vlak_style,top10nlv2:Wegdeel_Vlak_style";

  var basePart = baseURL + "SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true";
  var wmsRequest = basePart + "&STYLES=" + styles + "&LAYERS=" + layers + "&SRS=EPSG:28992&WIDTH=" + wmsWidth + "&HEIGHT=" + wmsHeight
  wmsRequest += "&BBOX=" + leftX + "," + lowerY + "," + rightX + "," + upperY;

  console.log(wmsRequest);

  // Send WMS request and load the WMS image response as texture

  texture = new THREE.TextureLoader().load(wmsRequest);

  groundMaterial = new THREE.MeshBasicMaterial( { map: texture, transparent: true, opacity: .65 } );

  // Create the ground plane for the WMS image

  groundLength = xLength > yLength ? xLength * 2 : yLength * 2 ;

  geometry = new THREE.PlaneBufferGeometry(groundLength, groundLength);
  ground = new THREE.Mesh(geometry, groundMaterial);

  ground.receiveShadow = true;
  ground.position.z = -1 * bboxValues.bbox.max.z;

  scene.add( ground );

}

// Convert from WGS84 coordinates to ECEF coordinates

function convertToECEF( lat, lon, h ) {

  a = 6378137;                                // semi-major axis [m]
  f = 1/298.257223563;                        // flattering
  e = 2 * f - Math.pow( f, 2 );               // squared eccentricity

  N = a / Math.sqrt( 1 - e * Math.pow( Math.sin( THREE.Math.degToRad( lat ) ), 2 ) );
  X = ( N + 0 ) * Math.cos( THREE.Math.degToRad( lat ) ) * Math.cos( THREE.Math.degToRad( lon ) );
  Y = ( N + 0 ) * Math.cos( THREE.Math.degToRad( lat ) ) * Math.sin( THREE.Math.degToRad (lon ) );
  Z = ( ( 1 - e ) * N + 0 ) * Math.sin( THREE.Math.degToRad ( lat ) );

  return { x: X, y: Y, z: Z };

}

// Configure the colors of the elements based on the test inspection data

function colorElement( element, score ) {

  if ( score == 1 ) {

    element.material = new THREE.MeshPhongMaterial( { color: 0x2FC02F, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  } else if ( score == 2 ) {

    element.material = new THREE.MeshPhongMaterial( { color: 0x9ACD32, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  } else if ( score == 3 ) {

    element.material = new THREE.MeshPhongMaterial( { color: 0xFFDF00, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  } else if ( score == 4 ) {

    element.material = new THREE.MeshPhongMaterial( { color: 0xFF8C00, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  } else if ( score == 5 ) {

    element.material = new THREE.MeshPhongMaterial( { color: 0xFF0000, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  } else {

    element.material = new THREE.MeshPhongMaterial( { color: 0xCC0000, transparent: true, opacity: .9 } );
    element.material.needsUpdate = true;

  }

}

// Show the condition of the bridge elements

function showCondition( score1, score2, score3 ) {

  colors = { 1: "#2FC02F", 2: "#9ACD32", 3: "#FFDF00", 4: "#FF8C00", 5: "#FF0000", 6: "#CC0000" };

  document.getElementById( "score1" ).style.background = colors[score1];
  document.getElementById( "score2" ).style.background = colors[score2];
  document.getElementById( "score3" ).style.background = colors[score3];

}

// Rescale the canvas on window resize

function onCanvasResize() {

  var w = window.innerWidth;
  var h = window.innerHeight;
  camera.left = w / - 2 * viewSize;
  camera.right = w / 2 * viewSize;
  camera.top = h / 2 * viewSize;
  camera.bottom = h / - 2 * viewSize;
  camera.updateProjectionMatrix();
  renderer.setSize( w, h );

  camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( canvas.clientWidth / canvas.clientHeight ) );
  camera.aspect = canvas.clientWidth / canvas.clientHeight;

  camera.updateProjectionMatrix();
  camera.lookAt( scene.position );

  renderer.setSize( canvas.clientWidth, canvas.clientHeight );
  renderer.render( scene, camera );

}

// Set up the object selection functionality

function onMouseDown( event ) {

  event.preventDefault();

  canvasBounds = renderer.context.canvas.getBoundingClientRect();

  mouse.x = ( ( event.clientX - canvasBounds.left ) / ( canvasBounds.right - canvasBounds.left) ) * 2 - 1;
  mouse.y = - ( ( event.clientY - canvasBounds.top ) / ( canvasBounds.bottom - canvasBounds.top ) ) * 2 + 1;

  vector = new THREE.Vector3( mouse.x, mouse.y, 1 );
  vector.unproject( camera );

  raycaster = new THREE.Raycaster( camera.position, vector.sub( camera.position ).normalize() );
  raycaster.setFromCamera( mouse, camera );

  intersects = raycaster.intersectObjects( objects, true );

  if ( $( ".years input:radio" )[1].checked ) {

    if ( intersects.length > 0 ) {

      for ( var i = 0; i < intersects.length; i++ ) {

        $( "#info" ).show( "slow" );

        if ( intersects[i].object != intersected2 ) {

          if ( intersected2 ) intersected2.material = intersected2.currentMaterial2;

          intersected2 = intersects[i].object;

          intersected2.currentMaterial2 = intersects[i].object.material;

          intersected2.material = new THREE.MeshPhongMaterial( { color: 0x1E90FF, transparent: true, opacity: .9 } );
          intersected2.material.needsUpdate = true;

          document.getElementById( "object" ).value = "Movable bridge";

          if ( intersected2.parent.userData.Name == "Span locks" ) {

            document.getElementById( "objtype" ).value =  "Electrical engineering";

          } else {

            document.getElementById( "objtype" ).value = "Structure";

          }

          document.getElementById( "element" ).value = intersected2.parent.userData.Name;
          document.getElementById( "inspdate" ).value = intersected2.parent.userData.InspectionDate07;
          document.getElementById( "inspector" ).value = intersected2.parent.userData.Inspector07;

          showCondition( intersected2.parent.userData.Score12, intersected2.parent.userData.Score07, intersected2.parent.userData.Score02 );

          if ( intersected2.uuid == "61AD5CC2-44B1-4C31-A6A7-177EAC18BE06" ) {

            console.log("Yes");

          }

        }

      }

    } else {

      $( "#info" ).hide( "slow" );

      if ( intersected2 ) intersected2.material = intersected2.currentMaterial2;

      intersected2.currentMaterial2 = intersects[i].object.material;

      intersected2 = null;

    }

  } else if ( $( ".years input:radio" )[2].checked ) {

    if ( intersects.length > 0 ) {

      for ( var i = 0; i < intersects.length; i++ ) {

        $( "#info" ).show( "slow" );

        if ( intersects[i].object != intersected3 ) {

          if ( intersected3 ) intersected3.material = intersected3.currentMaterial3;

          intersected3 = intersects[i].object;

          intersected3.currentMaterial3 = intersects[i].object.material;

          intersected3.material = new THREE.MeshPhongMaterial( { color: 0x1E90FF, transparent: true, opacity: .9 } );
          intersected3.material.needsUpdate = true;

          document.getElementById( "object" ).value = "Movable bridge";

          if ( intersected3.parent.userData.Name == "Span locks" ) {

            document.getElementById( "objtype" ).value =  "Electrical engineering";

          } else {

            document.getElementById( "objtype" ).value = "Structure";

          }

          document.getElementById( "element" ).value = intersected3.parent.userData.Name;
          document.getElementById( "inspdate" ).value = intersected3.parent.userData.InspectionDate02;
          document.getElementById( "inspector" ).value = intersected3.parent.userData.Inspector02;

          showCondition( intersected3.parent.userData.Score12, intersected3.parent.userData.Score07, intersected3.parent.userData.Score02 );

        }

      }

    } else {

      $( "#info" ).hide( "slow" );

      if ( intersected3 ) intersected3.material = intersected3.currentMaterial3;

      intersected3.currentMaterial3 = intersects[i].object.material;

      intersected3 = null;

    }

  } else {

    if ( intersects.length > 0 ) {

      for ( var i = 0; i < intersects.length; i++ ) {

        $( "#info" ).show( "slow" );

        if ( intersects[i].object != intersected1 ) {

          if ( intersected1 ) intersected1.material = intersected1.currentMaterial1;

          intersected1 = intersects[i].object;

          intersected1.currentMaterial1 = intersects[i].object.material;

          intersected1.material = new THREE.MeshPhongMaterial( { color: 0x1E90FF, transparent: true, opacity: .9 } );
          intersected1.material.needsUpdate = true;

          document.getElementById( "object" ).value = "Movable bridge";

          if ( intersected1.parent.userData.Name == "Span locks" ) {

            document.getElementById( "objtype" ).value =  "Electrical engineering";

          } else {

            document.getElementById( "objtype" ).value = "Structure";

          }

          document.getElementById( "element" ).value = intersected1.parent.userData.Name;
          document.getElementById( "inspdate" ).value = intersected1.parent.userData.InspectionDate12;
          document.getElementById( "inspector" ).value = intersected1.parent.userData.Inspector12;

          showCondition( intersected1.parent.userData.Score12, intersected1.parent.userData.Score07, intersected1.parent.userData.Score02 );

        }

      }

    } else {

      $( "#info" ).hide( "slow" );

      if ( intersected1 ) intersected1.material = intersected1.currentMaterial1;

      intersected1.currentMaterial1 = intersects[i].object.material;

      intersected1 = null;

    }

  }

}

// Animate and render the scene

function animate() {

  window.requestAnimationFrame( animate ) ||
  window.mozRequestAnimationFrame( animate ) ||
  window.webkitRequestAnimationFrame( animate ) ||
  window.msRequestAnimationFrame( animate ) ||
  window.oRequestAnimationFrame( animate )
  controls.update();
  render();

}

function render() {

  camera.lookAt( scene.position );
  renderer.render( scene, camera );

}

// Configure the visibility of the 3D objects in the layer switcher tab

function showObject() {

  for ( var i = 0; i < $( ".elements input:checkbox" ).length; i++ ) {

    if ( $( ".elements input:checkbox" )[i].checked ) {

      objects[i].visible = true;

    } else {

      objects[i].visible = false;

    }

  }

}

// Show the results of the test inspections

function showHistory() {

  for ( var i = 0; i < objects.length; i++ ) {

    objects[i].traverse( function ( child ) {

      if ( child instanceof THREE.Mesh ) {

        if ( $( ".years input:radio" )[1].checked ) {

          colorElement( child, objects[i].userData.Score07 );

        } else if ( $( ".years input:radio" )[2].checked ) {

          colorElement( child, objects[i].userData.Score02 );

        } else {

          colorElement( child, objects[i].userData.Score12 );

        }

      }

    });

  }

}

// Configure the visibility of the WMS image of the base map with the toggle switch button

function showGround() {

  if ( $( ".switch input:checkbox" ).is( ":checked" ) ) {

    ground.visible = true;

  } else {

    ground.visible = false;

  }

}
