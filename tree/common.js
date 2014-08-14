
var camera, scene, renderer, pano, point_group, camera_pano_x, camera_pano_y, domEvents, koef = 3;
var points_array_group = new Array(), real_array = new Array();

var isUserInteracting = false,
    lite = 0x555555,
    lon = 0,
    acx, R = 0, L = 0,
    lat = 0,
    phi = 0, theta = 0,
    tablet = false;
    webGl = null;


if( device.tablet() || device.mobile() ) {
    tablet = true;
}

var panosize = sizePanoView();

point_round(points_array);
init();
viewPoints();
animate();



/* здесь может быть отработка для планшетов для управление панорамой с помощью наклонов
 window.ondevicemotion = function(event){
 acx = event.accelerationIncludingGravity.x;
 acx = Math.round(acx);
 }
 */


/**
 * обновляем список видимых точек
 * @param points
 */
function point_round(points){
    points_array_group = [];
    var k = 0;
    for(var i = 0; i < points.length; i++){
        if(points[i]['code'] == 1){
            points_array_group[k]=points[i];
            k++;
        }
    }
}

/**
 * проверка на возможность подключение WEBGL,
 * в случае неудачи возвращаем рендеринг канваса
 * @returns {*}
 */
function doOnLoad(){

    var myCanvas = document.getElementById("mycanvas");
    var glContextName = ["webgl", "experimental-webgl", "webkit-3d", "moz-webgl"];
    for(var i = 0; i < glContextName.length; ++i){
        try{
            webGl = myCanvas.getContext(glContextName[i]);
        }catch(e){
        }
        if(webGl){
            break;
        }
    }
    document.getElementById( 'container').innerHTML="";
    if(webGl != null){
        return(new THREE.WebGLRenderer());
    }else{
        return(new THREE.CanvasRenderer());
    }

}

/**
 * определяем какую панораму нам выводить
 * @returns {string}
 */
function sizePanoView (){
    var panosize = 'x';

    if(window.innerWidth < 1400){
        panosize='m';
    }

    if(tablet){
        panosize='l';
    }
    return panosize;
}

/**
 * отображаем точки
 */
function viewPoints(){

    real_array = [];

    for(var i = 0; i < points_array_group.length; i++){

        // реальный обьект
        real_array[i] = new THREE.Mesh(new THREE.BoxGeometry(20,2,20), new THREE.MeshBasicMaterial({color:0x990000,opacity:0.6,
            overdraw:true}));

        real_array[i].position.y = -100;
        real_array[i].position.x = points_array_group[i]['xcoord']*koef;
        real_array[i].position.z = points_array_group[i]['ycoord']*koef;

        scene.add( real_array[i] );

    }

    for(var i = 0; i < real_array.length; i++){

        domEvents.addEventListener(real_array[i], 'mouseover', function(event){

            event.target.material.color.setHex(0xff0000);

        }, true);

        domEvents.addEventListener(real_array[i], 'mouseout', function(event){
            event.target.material.color.setHex(0x990000);
        }, true);

        domEvents.addEventListener(real_array[i], 'click', function(event){

            clickToNewPoint(event.target.id);
        }, true);
        console.debug(real_array[i]);
    }
}

/**
 * смена дикораций
 * @param mewPoint
 */
function clickToNewPoint(newPoint){
    alert(newPoint);
}

/**
 * инициализация панорамы
 */
function init() {

    var container, mesh;

    container = document.getElementById( 'container' );

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 1100 );
    camera.target = new THREE.Vector3( 100, 40, 30 );
    camera.position.y = 15;
    camera.position.x = -15;
    camera.position.z = 0;
    scene = new THREE.Scene();

    //создание глобальной площади - тоесть отрисовка всех доступных точек
/*
    var okno = new THREE.BoxGeometry(30,5,30), baselinemater = new THREE.MeshBasicMaterial({color:0xff0000,opacity:0.6,
        overdraw:true});


    // реальный обьект
    var oknoreal = new THREE.Mesh(okno, baselinemater);
    oknoreal.position.y = -50;
    oknoreal.position.x = 0;
    oknoreal.position.z = 0;
*/
    var geometry = new THREE.SphereGeometry( 200, 100, 100 );

    renderer = doOnLoad();
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    domEvents   = new THREEx.DomEvents(camera, renderer.domElement);

    var material = new THREE.MeshBasicMaterial( {
        map: THREE.ImageUtils.loadTexture( "/projects/"+project+"/"+point+"/"+panosize+"/pano.jpg" ),
        overdraw:true,
        side:THREE.BackSide
    } );

    mesh = new THREE.Mesh( geometry, material );

    //ставим на сцену обьекты
    scene.add( mesh );



    //установка событий для прокрутки панорамы
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
    document.addEventListener( 'touchstart', onDocumentMouseDown, false );
    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    document.addEventListener( 'touchmove', onDocumentMouseMove, false );
    document.addEventListener( 'mouseup', onDocumentMouseUp, false );
    document.addEventListener( 'touchend', onDocumentMouseUp, false );
    document.addEventListener( 'mousewheel', onDocumentMouseWheel, false );
    document.addEventListener( 'DOMMouseScroll', onDocumentMouseWheel, false);
    document.addEventListener( 'dragover', function ( event ) {

        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';

    }, false );

    //обьеденяем события прокрутки
    document.addEventListener( 'dragenter', function ( event ) {
        document.body.style.opacity = 0.1;
    }, false );

    document.addEventListener( 'dragleave', function ( event ) {
        document.body.style.opacity = 0.1;
    }, false );

    document.addEventListener( 'drop', function ( event ) {
        event.preventDefault();
        var reader = new FileReader();
        reader.addEventListener( 'load', function ( event ) {

            material.map.image.src = event.target.result;
            material.map.needsUpdate = true;

        }, false );
        reader.readAsDataURL( event.dataTransfer.files[ 0 ] );
        document.body.style.opacity = 0.1;

    }, false );

    window.addEventListener( 'resize', onWindowResize, true );
}

/**
 * изменение параметров окна
 */
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

/**
 * установка параметров при перемещении
 * @param event
 */
function onDocumentMouseDown( event ) {

    event.preventDefault();

    isUserInteracting = true;

    onPointerDownPointerX = event.clientX;
    onPointerDownPointerY = event.clientY;

    onPointerDownLon = lon;
    onPointerDownLat = lat;

}

/**
 * прокрутка панорамы за мышью
 * @param event
 */
function onDocumentMouseMove( event ) {

    if ( isUserInteracting === true ) {

        if(tablet){

            alert(event.targetTouches[0].pageX);
            lon = ( onPointerDownPointerX - event.targetTouches[0].pageX ) * 0.1 + onPointerDownLon;
            lat = ( event.targetTouches[0].pageY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;

        }else{
            lon = ( onPointerDownPointerX - event.clientX ) * 0.1 + onPointerDownLon;
            lat = ( event.clientY - onPointerDownPointerY ) * 0.1 + onPointerDownLat;
        }

    }
}

/**
 * захват панорамы для перемещения
 * @param event
 */
function onDocumentMouseUp( event ) {

    isUserInteracting = false;

}

/**
 * приближение отдаление
 * @param event
 */
function onDocumentMouseWheel( event ) {

    // WebKit

    if ( event.wheelDeltaY ) {

        camera.fov -= event.wheelDeltaY * 0.05;

        // Opera / Explorer 9
    } else if ( event.wheelDelta ) {

        camera.fov -= event.wheelDelta * 0.05;

        // Firefox
    } else if ( event.detail ) {

        camera.fov += event.detail * 1.0;
    }

    camera.updateProjectionMatrix();

}

/**
 * анимация при перемещении
 */
function animate() {

    requestAnimationFrame( animate );
    update();

}


/**
 * установка позиции камеры
 */
function update() {

    lat = Math.max( - 85, Math.min( 85, lat ) );
    phi = THREE.Math.degToRad( 90 - lat );
    theta = THREE.Math.degToRad( lon );


    // вращение камеры
    camera.target.x = 500 * Math.sin( phi ) * Math.cos( theta );
    camera.target.y = 500 * Math.cos( phi );
    camera.target.z = 500 * Math.sin( phi ) * Math.sin( theta );

    camera.position.x = -30 * Math.sin( phi ) * Math.cos( theta );;
    camera.position.y = -30 * Math.cos( phi );
    camera.position.z = -30 * Math.sin( phi ) * Math.sin( theta );

    camera.lookAt( camera.target );

    // ограничение на приближение и удаление камеры
    if(camera.fov > 80){
        camera.fov = 80;
    };
    if(camera.fov < 10){
        camera.fov = 10;
    };

    /*
     // distortion
     camera.position.copy( camera.target ).negate();
     */
    renderer.render( scene, camera );

}


