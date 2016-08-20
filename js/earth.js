var BUSILA = BUSILA || {};

BUSILA.Earth = function(container, opts) {
opts = opts || {};

var Shaders = {
    'earth' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0 );',
        '}'
      ].join('\n')
    },
    'atmosphere' : {
      uniforms: {},
      vertexShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'vNormal = normalize( normalMatrix * normal );',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
        '}'
      ].join('\n'),
      fragmentShader: [
        'varying vec3 vNormal;',
        'void main() {',
          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 12.0 );',
          'gl_FragColor = vec4( 0.4, 0.5, 0.8, 0.8 ) * intensity;',
        '}'
      ].join('\n')
    },
    'cloud' : {
      uniforms: {
        'texture': { type: 't', value: null }
      },
      vertexShader: [
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
          'vNormal = normalize( normalMatrix * normal );',
          'vUv = uv;',
        '}'
      ].join('\n'),
      fragmentShader: [
        'uniform sampler2D texture;',
        'varying vec3 vNormal;',
        'varying vec2 vUv;',
        'void main() {',
          'vec3 diffuse = texture2D( texture, vUv ).xyz;',
          'float intensity = 1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) );',
          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * pow( intensity, 3.0 );',
          'gl_FragColor = vec4( diffuse + atmosphere, 1.0);',
        '}'
      ].join('\n')
    },

  };

  var camera, scene, renderer;
  var mesh, atmosphere, point;
  var clouds,skybox;

  var progressManager;

  var curZoomSpeed = 0;
  var zoomSpeed = 10;

  var initRotationSpeedX = 0.01;//0.1
  var initRotationSpeedY = 0.01; //0.1
  var initEarthSpeed = 0.04; //0.3

  var mouse = { x: 0, y: 0 }, mouseOnDown = { x: 0, y: 0 };
  var rotation = { x: 0, y: 0 },
      target = { x: Math.PI*3/2, y: Math.PI / 6.0 },
      targetOnDown = { x: 0, y: 0 };

  var distance = 100000, distanceTarget = 100000;

  var PI_HALF = Math.PI / 2;

  function init(){
  	var shader, uniforms, material;
  	
  	w = container.offsetWidth || window.innerWidth;
  	h = container.offsetHeight || window.innerHeight;

  	camera = new THREE.PerspectiveCamera(30, w / h, 1, 10000);
  	camera.position.z = distance;

  	scene = new THREE.Scene();

    progressManager = new THREE.LoadingManager();


	var geometry = new THREE.SphereGeometry(200, 40, 30);
	shader = Shaders['earth'];
	uniforms = THREE.UniformsUtils.clone(shader.uniforms);

	var loader = new THREE.TextureLoader(progressManager);
	loader.load(
		'./images/hd/diffuse.jpg',
		function(texture){
			uniforms['texture'].value = texture;
			// atmosphere
			uniforms = THREE.UniformsUtils.clone(shader.uniforms);
		}
	);
	
	material = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: shader.vertexShader,
		fragmentShader: shader.fragmentShader
	});
			
	mesh = new THREE.Mesh(geometry, material);
	mesh.rotation.y = Math.PI;
	scene.add(mesh);

	shader = Shaders['atmosphere'];


    
    material = new THREE.ShaderMaterial({

          uniforms: uniforms,
          vertexShader: shader.vertexShader,
          fragmentShader: shader.fragmentShader,
          side: THREE.BackSide,
          blending: THREE.AdditiveBlending,
          transparent: true

        });

    mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set( 1.1, 1.1, 1.1 );
    scene.add(mesh);

    //test

    shader = Shaders['cloud'];
    
  loader.load(
    './images/clouds.jpg',
    function(texture){
      shader.uniforms['texture'].value = texture;
      // atmosphere
      uniforms = THREE.UniformsUtils.clone(shader.uniforms);
       
    },
    function(e){
      console.log('loading clouds');s
    },
    function(e){
      console.log('error loading cloads');
    }
  );

    material = new THREE.ShaderMaterial({
        uniforms: shader.uniforms,
          vertexShader: shader.vertexShader,
        fragmentShader: shader.fragmentShader,
         blending: THREE.AdditiveBlending,
          transparent: true


        }); 

    clouds = new THREE.Mesh(geometry, material);
    clouds.scale.set(1.01,1.01,1.01);
    scene.add(clouds);
    //skybox 



    //done

	
	renderer = new THREE.WebGLRenderer({antialias: true});
    renderer.setSize(w, h);
    renderer.domElement.style.position = 'absolute';
    container.appendChild(renderer.domElement);

    container.addEventListener('mousedown', onMouseDown, false);
    container.addEventListener('mousewheel DOMMouseScroll', onMouseWheel, false);
    window.addEventListener('resize', onWindowResize, false);

    container.addEventListener('mouseover', function() {
      overRenderer = true;
    }, false);

    container.addEventListener('mouseout', function() {
      overRenderer = false;
    }, false);


  }

   function onMouseDown(event) {
    event.preventDefault();

    container.addEventListener('mousemove', onMouseMove, false);
    container.addEventListener('mouseup', onMouseUp, false);
    container.addEventListener('mouseout', onMouseOut, false);

    mouseOnDown.x = - event.clientX;
    mouseOnDown.y = event.clientY;

    targetOnDown.x = target.x;
    targetOnDown.y = target.y;

    container.style.cursor = 'move';
  }

  function onMouseMove(event) {
    mouse.x = - event.clientX;
    mouse.y = event.clientY;

    var zoomDamp = distance/1000;

    target.x = targetOnDown.x + (mouse.x - mouseOnDown.x) * 0.005 * zoomDamp;
    target.y = targetOnDown.y + (mouse.y - mouseOnDown.y) * 0.005 * zoomDamp;

    target.y = target.y > PI_HALF ? PI_HALF : target.y;
    target.y = target.y < - PI_HALF ? - PI_HALF : target.y;
  }

  function onMouseUp(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
    container.style.cursor = 'auto';
  }

  function onMouseOut(event) {
    container.removeEventListener('mousemove', onMouseMove, false);
    container.removeEventListener('mouseup', onMouseUp, false);
    container.removeEventListener('mouseout', onMouseOut, false);
  }

  function onMouseWheel(event) {
  	console.log('mouse')
    event.preventDefault();
    if (overRenderer) {
      zoom(event.wheelDeltaY * 0.3);
    }
    return false;
  }

  function onWindowResize( event ) {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( container.offsetWidth, container.offsetHeight );
  }


  function zoom(delta) {
    distanceTarget -= delta;
    distanceTarget = distanceTarget > 1000 ? 1000 : distanceTarget;
    distanceTarget = distanceTarget < 350 ? 350 : distanceTarget;
  }

  function animate() {
    requestAnimationFrame(animate);
    render();
  }

  function render() {

  	zoom(curZoomSpeed);
  
    rotation.x += (target.x - rotation.x) * initRotationSpeedX;
    rotation.y += (target.y - rotation.y) * initRotationSpeedY;
    distance += (distanceTarget - distance) * initEarthSpeed;

    camera.position.x = distance * Math.sin(rotation.x) * Math.cos(rotation.y);
    camera.position.y = distance * Math.sin(rotation.y);
    camera.position.z = distance * Math.cos(rotation.x) * Math.cos(rotation.y);

    camera.lookAt(mesh.position);

    clouds.rotation.x -= 0.0001;
    clouds.rotation.y -= 0.0001;

    renderer.render(scene, camera);

  }

  init();
  this.animate = animate;

  this.renderer = renderer;
  this.scene = scene;

  this.progressManager = progressManager;

  return this;

}

