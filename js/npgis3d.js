var polylineDrive = [
    [118.40658485297624, 31.332059231180374, 5.487062272783039],
    [118.40730258911655, 31.332665606133375, 5.484974591246879],
    [118.40734615114518, 31.3327415591885, 5.483379382795052],
    [118.40739301761137, 31.33280355003172, 5.481793335337154],
    [118.40780159899063, 31.333150494588562, 5.482838639114037],
    [118.4081228172608, 31.333438784752037, 5.480337832690216],
    [118.40840537388578, 31.333716320601248, 5.480025820507011],
    [118.40880579749039, 31.334094336506766, 5.482387236141097],
    [118.40892217108522, 31.334156059297957, 5.470763082430594],
    [118.40909849590382, 31.334299882601115, 5.468242477405139],
    [118.40924311035998, 31.33438349136307, 5.465317726791699],
    [118.40953950576026, 31.33465474684004, 5.468576457629695],
    [118.40964848662168, 31.334709550967222, 5.4672065290151295],
    [118.4097475379805, 31.33469222285298, 5.468227300882198],
    [118.41013686868892, 31.33435748566237, 5.463774951430572],
    [118.41120175383357, 31.33344608185236, 5.497789588166898]
];

// 状态
var store = {
    state: {
        showInfo: true,
    }
}

// 组件
Vue.component('simple-counter', {
    template: '<button v-on:click="counter += 1">{{ counter }}</button>',
    // 技术上 data 的确是一个函数了，因此 Vue 不会警告，
    // 但是我们却给每个组件实例返回了同一个对象的引用
    data: function() {
        return {
            count: 8
        }
    }
})


var app = new Vue({
    el: '#map-nav',
    data: {
        sharedState: store.state,
        cache: [],
        current: 1,
        showItem: 3,
        allpage: 0,
        pageSize: 15,
        models: {},
        qitems: [],
        showMsg: false,
        cameraLayerCheck: false,
        bulidsUrl: "data/Data.json",
        position: [118.41345005051207, 31.32024914220665, 929.2619962061304],
        orientation: [5.888146216780636, -0.5664966720132227, 8.561862330225267e-11],
        waterCheck: true,
        otherCheck: true,
        modelTestCheck: true,
        polylineDrive: polylineDrive,
        fpfUrl: 'data/wuhu.fpf',
        camerasUrl: 'data/Cameras.json',
        getModelByMid: '/netposa/Map3d/getModelByMid?',
        modelCheck: true,
        cesiumContainer: 'cesiumContainer',
        layerName: 'defaultOverLayLayer2',
        services: [{
            "mapUrl": "model/model",
            "name": "modelTest",
            "table": "y",
            "title": "modelTest"
        }, {
            "mapUrl": "model/other",
            "name": "other",
            "title": "other"
        }, {
            "mapUrl": "model/water",
            "name": "water",
            "title": "water"
        }],
    },
    computed: {
        mapContainer: function() {
            return {
                "col-md-9": this.showMsg,
                "col-md-12": !this.showMsg
            };
        },
        pages: function() {
            var pag = [];
            if (this.current < this.showItem) { //如果当前的激活的项 小于要显示的条数
                //总页数和要显示的条数那个大就显示多少条
                var i = Math.min(this.showItem, this.allpage);
                while (i) {
                    pag.unshift(i--);
                }
            } else { //当前页数大于显示页数了
                var middle = this.current - Math.floor(this.showItem / 2), //从哪里开始
                    i = this.showItem;
                if (middle > (this.allpage - this.showItem)) {
                    middle = (this.allpage - this.showItem) + 1
                }
                while (i--) {
                    pag.push(middle++);
                }
            }
            return pag
        }
    },
    mounted: function() {

        var viewer = new NPMAP3D.MAP3D(this.cesiumContainer);
        var addedImageryLayer = new NPMAP3D.Layer.GaoDeLayer(undefined, 'GOOGLE', {
            minimumLevel: 0,
            maximumLevel: 18,
            style: NPMAP3D.BaseMap.AMAP_AERIAL
        });
        viewer.addLayer(addedImageryLayer);
        var services = this.services;
        viewer.setView({
            "position": new NPGIS3D.Geometry.Point3D(this.position[0], this.position[1], this.position[2]),
            orientation: {
                heading: this.orientation[0],
                pitch: this.orientation[1],
                roll: this.orientation[2]
            }
        });

        var layers = [];
        var host = '/server2428080';
        services.map(function(service, index) {
            var url = host + "/netposa/np3dMap/" + service.mapUrl + "/config";
            var layer = new NPGIS3D.Layer.S3MLayer(url, service.name);
            layers.push(layer);
            service.layer = layer;
        });
        var modelCheck = this.modelCheck;
        var that = this;
        that.modelPoints = {};
        viewer.addModelLayers(layers, function() {
            services.map(function(model, index) {
                var s3MLayer = model.layer;
                s3MLayer.setVisible(modelCheck);
                !model.table && s3MLayer.setEnableSelect(false);
                var postion = s3MLayer.getPosition();
                postion.h = 2500;
                // viewer.setView({
                //     "position": postion
                // });

                if (model.table && model.table == 'y') {
                    var url = host + '/netposa//Map3d/getModelBySmid?table=' + model.name;
                    that.modelLayer = s3MLayer;
                    // s3MLayer.addEventListener('click', function(model) {
                    //     that.modelPoints[model.id] = model.position;
                    //     console.log(NPGIS3D.NPCoordinate.cartesianToPointGeo(viewer.viewer.camera.position));
                    //     // if (model.id) {
                    //     //     $.getJSON(url + "&smId=" + model.id, function(result) {
                    //     //         if (result.isSucess && result.data.length > 0) {
                    //     //             if (that.builds[result.data[0].mid]) {
                    //     //                 that.builds[result.data[0].mid].smid = result.data[0].smid;
                    //     //             }
                    //     //             // $(window).toastmessage('showNoticeToast',
                    //     //             //     result.data[0].name)
                    //     //         }
                    //     //     })
                    //     // }
                    // })
                }
            })
        });

        var that = this;
        services.map(function(service) {
            that.models[service.name] = service.layer;
        })

        this.viewer = viewer;
        this.drawTool = new NPMAP3D.Tools.DrawingTool(viewer, this.cesiumContainer);
        this.measureTool = new NPMAP3D.Tools.MeasureTool(viewer, this.cesiumContainer);
        this.overlayLayer = new NPMAP3D.Layer.OverlayLayer(this.layerName);
        this.cameraLayer = new NPMAP3D.Layer.OverlayLayer('camera');
        this.viewer.addOverlayLayer(this.overlayLayer);
        this.viewer.addOverlayLayer(this.cameraLayer);


        //初始化飞行管理
        var routes = new Cesium.RouteCollection()
        routes.fromFile(this.fpfUrl)
        this.flyManager = new Cesium.FlyManager({
            scene: viewer.viewer.scene,
            routes: routes
        });

        this.camera = new NPMAP3D.AnimationLine3D(viewer);


        $.getJSON(this.bulidsUrl, function(result) {
            that.personData = result;
            var builds = {};
            that.personData.villageInfos.map(function(v) {

                v.builds.map(function(b) {
                    var c = $.extend({}, b)
                    c.villageName = v.name;
                    builds[b.buildNo] = c;

                });
            });
            that.builds = builds;
        })
        this.cameraLayerCheck ? this.cameraLayer.show() : this.cameraLayer.hide()
        $.getJSON(this.camerasUrl, function(r) {
            for (var i = 0; i < r.length; i++) {
                var point = new NPGIS3D.Geometry.Point3D(r[i][0], r[i][1], r[i][2]);
                var marker = new NPGIS3D.Overlay.Marker(point, {
                    image: 'images/camera_active.png',
                    isButtomCenter: true,
                    width: 24,
                    height: 24
                });
                var temp = new NPGIS3D.Geometry.Point3D(point.lon, point.lat, 0);
                var geoLine = new NPGIS3D.Geometry.Polyline([
                    [temp, point]
                ]);
                marker.setLine(geoLine, {
                    width: 1,
                    material: NPGIS3D.Color.WHEAT,
                });
                that.cameraLayer.addOverlay(marker);
                marker.addEventLinsener("click", function(f) {
                    if (that.mywindow) {
                        that.mywindow.remove();
                        that.mywindow = null;
                    }
                    that.mywindow = new NPGIS3D.Overlay.InfoWindow(f.geometry, viewer, '<video width="320" height="240" controls="controls" autoplay="autoplay"><source src="images/void.mp4" type="video/mp4" /></video>', {
                        offset: {
                            x: 0,
                            y: -24
                        },
                        infoSize: {
                            w: 322,
                            h: 237
                        }
                    });
                });
            }
        });

    },
    methods: {
        modelClick: function(event) {
            if (this.models[event.target.name]) {
                this.models[event.target.name].setVisible(event.target.checked);
            }
        },
        draw: function(event) {
            var m = event.target.name;
            var layer = this.overlayLayer;
            if (m == 'clean') {
                this.overlayLayer.removeAllOverlay();
            }
            this.drawTool.setMode(m.split('_')[0], function(point3D) {
                var model = point3D;
                if (point3D instanceof NPGIS3D.Geometry.Point3D) {
                    if (m.split('_').length == 2) {
                        var type = m.split('_')[1];
                        switch (type) {
                            case 'CAR':
                                model = new NPGIS3D.Overlay.Model(point3D, {
                                    uri: 'data/car.gltf',
                                    scale: 0.3
                                });
                                break;
                            case 'People':
                                model = new NPGIS3D.Overlay.Model(point3D, {
                                    uri: 'data/police.gltf',
                                    scale: 0.8
                                });

                                break;
                            case 'Marker':
                                model = new NPGIS3D.Overlay.Marker(point3D);
                                model.setLabel("你在这里做了标记", {
                                    labelPixelOffset: new NPGIS3D.Size(12.0, -32.0),
                                    labelFont: "25px 微软雅黑",
                                    labelStyle: NPGIS3D.LabelStyle.FILL_AND_OUTLINE,
                                    outlineColor: NPGIS3D.Color.RED,
                                    outlineWidth: 3,
                                    horizontalOrigin: NPGIS3D.HorizontalOrigin.LEFT,
                                    verticalOrigin: NPGIS3D.VerticalOrigin.CENTER
                                });
                                break;
                        }

                    }

                }
                layer.addOverlay(model);
            })
        },
        measure: function(event) {
            this.measureTool.setMode(event.target.name);
        },
        fly: function(event) {
            this.flyStop();
            if (event.target.name == 'Flight') {
                this.flyManager.play();
            } else {
                var line = this.polylineDrive.map(function(p) {
                    return new NPGIS3D.Geometry.Point3D(p[0], p[1], p[2])
                })
                this.camera.trackDrive(new NPMAP3D.Geometry.Polyline([line]), {
                    multiplier: 10,
                    color: '#FF0000',
                    width: 3,
                    follow: true
                });
            }
        },
        flyStop: function() {
            this.camera.stopTrack();
            this.flyManager && this.flyManager.stop();
        },
        goHome: function() {
            this.viewer.setView({
                "position": new NPGIS3D.Geometry.Point3D(this.position[0], this.position[1], this.position[2]),
                orientation: {
                    heading: this.orientation[0],
                    pitch: this.orientation[1],
                    roll: this.orientation[2]
                }
            });
        },
        clear: function() {
            this.flyStop();
            this.modelLayer.releaseSelection();
            this.overlayLayer.removeAllOverlay();
            this.measureTool.setMode('measureClean');
            this.qitems = [];
            this.showMsg = false;
            if (this.mywindow) {
                this.mywindow.remove();
                this.mywindow = null;
            }

        },
        query: function(e) {
            var personData = this.personData;
            var that = this;
            BootstrapDialog.show({
                title: e == 'persion' ? '人口查询' : '身份证查询',
                message: function(dailog) {
                    dailog.$modal[0].style.marginTop = '150px'
                    var msg = e == 'persion' ? '姓名' : '身份证号码';
                    return $('<textarea class="form-control" placeholder="请输入' + msg + '..."></textarea>');
                },
                buttons: [{
                    label: '查询',
                    cssClass: 'btn-primary',
                    hotkey: 13,
                    action: function() {
                        var q = $(".form-control", $(arguments[0].$modalContent)).val();
                        var result = [];
                        var index = 1;
                        for (var k in personData.villageInfos) {
                            var villageInfo = personData.villageInfos[k];
                            var length = villageInfo.builds.length;
                            for (var i = length - 1; i >= 0; i--) {
                                var builds = villageInfo.builds[i];
                                var rooms = builds.rooms;
                                for (var m = rooms.length - 1; m >= 0; m--) {
                                    var person = rooms[m].person;
                                    for (var n = person.length - 1; n >= 0; n--) {

                                        if (((e == 'persion' ? person[n].name : person[n].ID)).indexOf(q) != -1) {

                                            result.push({
                                                "index": index++,
                                                "villageInfo": villageInfo.name,
                                                "builds": builds.buildName,
                                                "buildNo": builds.buildNo,
                                                "floor": rooms[m].floor,
                                                "RoomNo": rooms[m].RoomNo,
                                                "person": person[n]
                                            })

                                        }
                                    }
                                }
                            }
                        }
                        if (result.length == 0) {
                            $(window).toastmessage('showNoticeToast',
                                '查询为空');
                        }
                        that.allpage = Math.ceil(result.length / that.pageSize);
                        that.cache = result;
                        that.qitems = that.cache.slice(0, that.pageSize);
                        this.dialog.close();
                        that.showMsg = result.length != 0;
                    }
                }]
            });
        },
        location: function(item) {
            var mid = item.buildNo,
                table = this.modelLayer.name;
            var that = this; {
                $.getJSON("/server2428080/" + this.getModelByMid + 'mId=' + mid + '&table=' + table,
                    function(r) {
                        if (r.isSucess && r.data.length > 0) {
                            that.modelLayer.releaseSelection();
                            that.modelLayer.setSelection([r.data[0].smid]);
                            that.builds[mid] && (that.builds[mid].smid = r.data[0].smid)
                            that.viewer.setView({
                                position: new NPGIS3D.Geometry.Point3D(r.data[0].x, r.data[0].y, 300),
                            })

                            if (that.mywindow) {
                                that.mywindow.remove();
                                that.mywindow = null;
                            }
                            that.mywindow = new NPGIS3D.Overlay.InfoWindow(new NPGIS3D.Geometry.Point3D(r.data[0].x, r.data[0].y, item.floor * 3 + 3), that.viewer, '<div>' + item.villageInfo + '-' + item.builds + '-' + item.RoomNo + '-' + item.person.name + '</div>', {
                                offset: {
                                    x: 0,
                                    y: 0
                                },
                                infoSize: {
                                    w: 180,
                                    h: 30
                                }
                            });
                        }

                    })
            }
        },
        goto: function(index) {
            if (index == this.current) return;
            this.current = index;
            this.qitems = this.cache.slice((this.current - 1) * this.pageSize, this.current * this.pageSize);
        },
        showCamera: function(event) {
            event.target.checked ? this.cameraLayer.show() : this.cameraLayer.hide()
        },
        queryFang: function() {
            var selected = this.modelLayer.getSelection();
            if (selected.length == 0) {
                $(window).toastmessage('showNoticeToast',
                    '请选中模型')
                return;
            }
            var url = "/server2428080/" + '/netposa/Map3d/getModelBySmid?table=modelTest&smId=' + selected[0];
            var that = this;
            $.getJSON(url, function(r) {
                if (!r.isSucess || r.data.length == 0) {
                    $(window).toastmessage('showNoticeToast',
                        '无数据')
                    return;
                }

                var v = that.builds[r.data[0].mid];
                if (!v) {
                    $(window).toastmessage('showNoticeToast',
                        '无数据')
                    return;
                }
                var zNodes = [];
                var treeRoot = {
                    "icon": "images/r.jpg",
                    name: v.villageName + "_" + v.buildName,
                    open: true,
                    children: []
                };

                var rooms = v.rooms;
                var floors = {};
                for (var i = rooms.length - 1; i >= 0; i--) {
                    var r = $.extend({
                        name: rooms[i].RoomNo + "室",
                        "icon": "images/9.png",
                        children: [{
                            name: "户型",
                            "icon": "images/3.png",
                            RoomNo: rooms[i].RoomNo[rooms[i].RoomNo.length - 1]
                        }, {
                            name: "人口",
                            "icon": "images/person.png",
                            person: rooms[i].person

                        }]
                    }, {

                    });
                    if (floors[rooms[i].floor]) {
                        floors[rooms[i].floor].push(r);
                    } else {
                        floors[rooms[i].floor] = [r];
                    }
                }

                for (var k in floors) {
                    treeRoot.children.push({
                        name: k + '层',
                        "icon": "images/1_open.png",
                        children: floors[k]
                    })
                }
                var table = $("#personTable").html();
                var right;
                BootstrapDialog.show({
                    title: '房屋信息',
                    message: function(dailog) {
                        dailog.$modal[0].style.marginTop = '120px'
                        var container = $('<div class="container"></div>');
                        var l = $('<div class="col-md-2" style="height: 400px;overflow: auto;"></div>');
                        right = $('<div class="col-md-4"></div>');
                        l.append('<div id="treeDemo" class="ztree"></div>')
                        container.append(l).append(right);
                        return container;
                    },
                    onshow: function(dialog) {
                        var setting = {
                            callback: {
                                onClick: function(event, treeId, treeNode) {
                                    if (treeNode.name == '人口') {
                                        right.html(juicer($("#personTable").html(), treeNode));
                                    } else if (treeNode.name == '户型') {
                                        right.html("")
                                        var img = $('<img width="300px" class="hover"></img>').attr("src", "images/" + treeNode.RoomNo + "rooms.jpg")
                                        right.append($("<div style='overflow: hidden;height: 400px;'></div>").append(img))
                                    } else {
                                        right.html("")
                                    }

                                    if (treeNode.level == 1) {
                                        var root = $.fn.zTree.getZTreeObj(treeId)
                                        treeNode.children.map(function(n) {
                                            root.expandNode(n, true, true);
                                        })
                                    }
                                }
                            }
                        };
                        $.fn.zTree.init($("#treeDemo", dialog.$modalContent), setting, treeRoot);
                    },
                    buttons: [{
                        label: '关闭',
                        cssClass: 'btn-primary',
                        action: function() {
                            this.dialog.close();
                        }
                    }]
                });

            })
        }

    }
})



// NPGIS3D.RoutePlayMode = {
//     StopAround: "StopAround",
//     StopPause: "StopPause"
// };

// /**
//  * 飞行管理
//  * @param {NPGIS3D.MAP3D} viewer [description]
//  * @param {NPGIS3D.Route[]} routes [description]
//  */
// NPGIS3D.FlyManager = function(viewer, routes) {

//     var _api = new Cesium.RouteCollection();
//     if (!Cesium.isArray(routes)) {
//         routes = [routes];
//     }
//     routes.map(function(route) {
//         var r = new Cesium.Route(route);
//         route._stopCollection.map(function(stop) {
//             r.addStop(new Cesium.RouteStop(stop));
//         })
//         r._totalDuration = route.A;
//         _api.addRoute(r);
//     })

//     _api._ready = !0

//     this._api = new Cesium.FlyManager({
//         scene: viewer.viewer.scene,
//         routes: _api
//     });

// }

// NPGIS3D.FlyManager.prototype = {
//     /**
//      * 飞行
//      * @return
//      */
//     play: function() {
//         this._api.play();
//     },
//     /**
//      * 停止飞行
//      * @return
//      */
//     stop: function() {
//         this._api.stop();
//     }
// }

// /**
//  * [Route description]
//  * @param {object} e
//  * @param {bool} e.isStopVisible 
//  * @param {bool} e.isFlyLoop
//  * @param {bool} e.isLineVisible
//  * @param {string} e.routeName
//  * @param {number} e.speed
//  * @param {bool} e.isAlongline
//  */
// NPGIS3D.Route = function(e) {
//     e = e || {};
//     this._stopCollection = [];
//     this.isStopVisible = e.isStopVisible || !1;
//     this.isFlyLoop = e.isFlyLoop || !1;
//     this.isLineVisible = e.isLineVisible || !1;
//     this.routeName = e.routeName || "";
//     this.speed = e.speed || 50;
//     this.isAlongline = e.isAlongline || !1;
//     this.totalDuration = e.totalDuration;
//     //this.altitudefree = false;
//     this.A = 0;
// }

// NPGIS3D.Route.prototype = {
//     /**
//      * 
//      * @param {NPGIS3D.RouteStop} stop
//      */
//     addStop: function(e) {
//         if (this._stopCollection.length > 0) {
//             var q = this._stopCollection[this._stopCollection.length - 1];
//             if (q.stopPlayMode != NPGIS3D.RoutePlayMode.StopAround) {
//                 var G, W = q.point,
//                     j = Cesium.Cartesian3.distance(W, e.point),
//                     Q = q.speed;
//                 G = Q > 0 ? Q : this.speed, q.duration = j / G, this.A += q.duration
//             }
//         }
//         if (this.isAlongline) {
//             e.tilt = 0;
//         }
//         this._stopCollection.push(e);
//         return true;
//     }
// }
// /**
//  * 
//  * @param {NPGIS3D.Geometry.Point3D} point    [description]
//  * @param {number} heading  [description]
//  * @param {number} tilt     [description]
//  * @param {string} stopName [description]
//  * @param {number} waitTime [description]
//  * @param {number} speed    [description]
//  * @param {number} altitude [description]
//  */
// NPGIS3D.RouteStop = function(point, heading, tilt, stopName, waitTime, speed, altitude) {
//     var newDestination = Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.h);

//     this.point = newDestination;
//     this.altitude = point.h;
//     this.heading = Cesium.Math.toRadians(heading || 0);
//     this.tilt = Cesium.Math.toRadians((tilt || 0) - 90);
//     this.stopName = stopName || '';
//     this.waitTime = waitTime || 0;
//     this.speed = Number(speed || 0);
//     this.viewtype = 'camera';
//     this.duration = 0;
//     this.stopPlayMode = NPGIS3D.RoutePlayMode.StopPause;

// }


// var route = {
//     routeName: "规划城市设计飞行",
//     speed: 29.912239860151,
//     lineType: "0",
//     showroutestop: true,
//     showrouteline: true,
//     altitudefree: false,
//     headingfree: false,
//     tiltfree: false,
//     flycircle: false,
//     alongline: false
// }


// var routeManger = new NPGIS3D.Route(route);


// var stops = [{
//     "name": "Stop2",
//     "speed": "56.721594",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.40576917780888,
//     "lat": 31.32782803384535,
//     "altitude": 300.6345879705623,
//     "heading": 42.73066864061615,
//     "tilt": 63.51223595918918,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop1",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41298260630471,
//     "lat": 31.323306129363832,
//     "altitude": 300.6345879705623,
//     "heading": 358.6527867267502,
//     "tilt": 65.25557736354747,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop3",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.4173720850241,
//     "lat": 31.329446136889096,
//     "altitude": 81.68698161747307,
//     "heading": 313.40133038151384,
//     "tilt": 72.22999349349999,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop7",
//     "speed": "312178893.684239",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.4155665082165,
//     "lat": 31.331462471197494,
//     "altitude": 38.87649401370436,
//     "heading": 313.4003915328677,
//     "tilt": 79.42127678647826,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop4",
//     "speed": "18.979529",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41235391824881,
//     "lat": 31.330925971305202,
//     "altitude": 14.904220945201814,
//     "heading": 298.8481015652357,
//     "tilt": 78.54774698309497,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 20,
//     "stopViews": [{
//         "heading": "298.85",
//         "tilt": "78.5477000000000",
//         "altitude": "14.904200",
//         "direction": "Clockwise"
//     }, {
//         "heading": "298.85",
//         "tilt": "78.5477000000000",
//         "altitude": "14.904200",
//         "direction": "Clockwise"
//     }]
// }, {
//     "name": "Stop6",
//     "speed": "35614132.090768",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41240688129596,
//     "lat": 31.331008098870864,
//     "altitude": 204.41225753165781,
//     "heading": 350.8014818746853,
//     "tilt": 57.84556780633935,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 1.5,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop5",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41143480095077,
//     "lat": 31.328025073650718,
//     "altitude": 114.84100673999637,
//     "heading": 350.70696004809025,
//     "tilt": 57.88303104022867,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop8",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.4108197604753,
//     "lat": 31.329811434822226,
//     "altitude": 33.31609281990677,
//     "heading": 10.910721886930887,
//     "tilt": 77.7135395148051,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop9",
//     "speed": "24228373.767716",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41007311668537,
//     "lat": 31.33044124997449,
//     "altitude": 22.983765684999526,
//     "heading": 10.910333649951252,
//     "tilt": 77.7135395148051,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 1.5,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop10",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.40969535579481,
//     "lat": 31.32828886230841,
//     "altitude": 24.273445839062333,
//     "heading": 31.377388766269434,
//     "tilt": 84.90289779298801,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 100,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }, {
//     "name": "Stop11",
//     "speed": "0",
//     "excluded": false,
//     "viewType": "camera",
//     "lon": 118.41361288348007,
//     "lat": 31.331700165528115,
//     "altitude": 22.817039095796645,
//     "heading": 31.37942574897607,
//     "tilt": 84.90289779298801,
//     "altitudeMode": "RelativeToGround",
//     "turnTime": 1.5,
//     "turnSlowly": false,
//     "stopPlayMode": "StopPause",
//     "autoPlay": false,
//     "pauseTime": 0,
//     "angularSpeed": 1
// }]

// stops.map(function(stop) {
//     routeManger.addStop(new NPGIS3D.RouteStop({
//         lon: stop.lon,
//         lat: stop.lat,
//         h: stop.altitude
//     }, stop.heading, stop.tilt, stop.name, stop.pauseTime, stop.speed));
// })