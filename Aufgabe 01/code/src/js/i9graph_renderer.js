


var TIME, SHADER, BUFFER, FRAMEBUFFER, TEXT;


// TIME
(function (TIME, undefined) {
    var starttime = Date.now();
    TIME.secondsFromStart = 0;
    TIME.dTime = 0;

    TIME.newFrame = function () {
        var newtime = (Date.now() - starttime) / 1000;
        TIME.dTime = newtime - TIME.secondsFromStart;
        TIME.secondsFromStart = newtime;
    }
})(TIME = {});


if(graph_addon){
    console.log = function (s) { graph_addon.c_log('' + s); };
    console.error = function (s) { graph_addon.c_log('ERROR: ' + s); };
    console.warn = function (s) { graph_addon.c_log('WARN: ' + s); };
}




/** @namespace */
(function (i9graph, undefined) {
    'use strict';

    var render_continuously = false;

    var renderer = PIXI.autoDetectRenderer(innerWidth, innerHeight, { resolution: 1, antialias: false });
    renderer.view.style.position = "absolute";
    renderer.view.style.top = "0px";
    renderer.view.style.zIndex = "-2";
    renderer.view.style.left = "0px";
    renderer.view.style.display = "block";
    renderer.autoResize = true;
    document.body.appendChild(renderer.view);

    if (!PIXI.utils.isWebGLSupported()) {
        alert("Your browser does not support WebGL!");
        return;
    }


    var gl = renderer.view.getContext('experimental-webgl');
    //console.log(gl);

    var uints_for_indices = gl.getExtension("OES_element_index_uint");
    if (!uints_for_indices) {
        alert("unsigned int  indices are not Supported. --> Fast edge drawing may look weird.");
    }


    i9graph.percentage = function (p) { }

    window.addEventListener('resize', onResize);
    function onResize() {
        renderer.resize(innerWidth, innerHeight);
        i9graph.camera.update();
        FRAMEBUFFER.resize();
        rerender();
    }


    var drawNice = true;
    i9graph.niceGraphics = function () {
        drawNice = true;
        rerender();
    }

    i9graph.fastGraphics = function () {
        drawNice = false;
        rerender();
    }
    i9graph.toggleEdges = function () {
        drawNice = !drawNice;
        rerender();
    }

    var themeDark = false;
    i9graph.setThemeDark = function () {
        themeDark = true;
        document.getElementById("divtextcontainer").style.textShadow = '0 0 10px #000000';
        document.getElementById("divtextcontainer").style.color = '#D0D0D0';
        document.getElementById('navbar').classList.remove('navbar-default');
        document.getElementById('navbar').classList.add('navbar-inverse');
    }

    i9graph.setThemeLight = function () {
        themeDark = false;
        document.getElementById("divtextcontainer").style.color = '#303030';
        document.getElementById("divtextcontainer").style.textShadow = '0 0 10px #FFFFFF';
        document.getElementById('navbar').classList.remove('navbar-inverse');
        document.getElementById('navbar').classList.add('navbar-default');
    }

    i9graph.toggleTheme = function () {
        themeDark = !themeDark;
        if (themeDark) i9graph.setThemeDark();
        else i9graph.setThemeLight();
    }


    i9graph.edgeSizeFromSlider = function () { redrawAll(); line_size = Math.pow(2, .1 * (document.getElementById('edgesize').value - 80)); }
    i9graph.nodeSizeFromSlider = function () { redrawAll(); node_scale = Math.pow(2, .1 * (document.getElementById('nodesize').value - 10)); }
    i9graph.edgeDetailFromSlider = function () { redrawAll(); edge_strip_iterations = document.getElementById('edgedetail').value; }

    i9graph.edgeSizeToSlider = function () { document.getElementById('edgesize').value = 80 + 10 * Math.log2(line_size); }
    i9graph.nodeSizeToSlider = function () { document.getElementById('nodesize').value = 10 + 10 * Math.log2(node_scale); }
    i9graph.edgeDetailToSlider = function () { document.getElementById('edgedetail').value = edge_strip_iterations; }


    i9graph.resetRenderOptions = function () {
        edge_strip_iterations = 5;
        line_size = 0.006;
        node_scale = 1.;
        i9graph.edgeSizeToSlider();
        i9graph.nodeSizeToSlider();
        i9graph.edgeDetailToSlider();
        redrawAll();
    }


    i9graph.addFileName = function (name) {
        if (!i9graph.appendFile) {
            document.getElementById('Filename').innerHTML = '';
        }
        document.getElementById('Filename').innerHTML += (document.getElementById('Filename').innerHTML.length > 0 ? ' | ' : '') + name;
    }

  
    var fpsNumber = 42;
   


    (function (SHADER, undefined) {
        var all = {};
        SHADER.current = null;
        SHADER.compile = function (name, vs_c, fs_c) {
            var vs = gl.createShader(gl.VERTEX_SHADER);
            gl.shaderSource(vs, vs_c);
            gl.compileShader(vs);   
            var fs = gl.createShader(gl.FRAGMENT_SHADER);
            gl.shaderSource(fs, fs_c);
            gl.compileShader(fs);
            var s = gl.createProgram();
            gl.attachShader(s, vs);
            gl.attachShader(s, fs);
            gl.linkProgram(s);
            all[name] = s;
        }
        SHADER.bind = function (name) {
            gl.useProgram(all[name]);
            SHADER.current = all[name];
        }
        SHADER.getLocation = function (name) {
            return gl.getUniformLocation(SHADER.current, name);
        }
    })(SHADER = {});


    (function (BUFFER, undefined) {
        var all = {};
        BUFFER.create = function (name, data, dim = 3, precision = 32, float = true) {
            var b = gl.createBuffer();
            b.length = data.length / dim;
            if (b.length == 0) {
                all[name] = null;
                return;
            }
            b.dim = dim; b.precision = precision;
            if (!float) {
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
            } else { gl.bindBuffer(gl.ARRAY_BUFFER, b); }
            var arr;
            if (precision == 32 && float) arr = new Float32Array(data);
            else if (precision == 32 && !float) arr = new Uint32Array(data);
            else if (precision == 16 && !float) arr = new Uint16Array(data);
            else {  
                console.error("cannot create buffer with precision " + precision + " and float " + float);
                return;
            }
            if (!float) {
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arr, gl.STATIC_DRAW);
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            } else {
                gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW);
                gl.bindBuffer(gl.ARRAY_BUFFER, null);
            }
            all[name] = b;
        }

        BUFFER.createF32 = function (name, data, dim = 3) {
            var b = gl.createBuffer();
            b.length = data.length / dim;
            if (b.length == 0) {
                all[name] = null;
                return;
            }
            b.dim = dim; b.precision = 32;
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            all[name] = b;
        }
        BUFFER.createI32 = function (name, data, dim = 3) {
            var b = gl.createBuffer();
            b.length = data.length / dim;
            if (b.length == 0) {
                all[name] = null;
                return;
            }
            b.dim = dim; b.precision = 32;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data, gl.STATIC_DRAW);
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
            all[name] = b;
        }

        BUFFER.delete = function (name) {
            if (all[name] == null) return;
            gl.deleteBuffer(all[name]); all[name] = null;
        }
        BUFFER.bind = function (name, target = undefined) {
            if (all[name] == null) return;
            var b = all[name];
            if (target === undefined) target = name;
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            var coord = gl.getAttribLocation(SHADER.current, target);
            gl.vertexAttribPointer(coord, b.dim, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);
        }
        BUFFER.unbind = function (name) {
            if (all[name] == null) return;
            var b = all[name];
            var coord = gl.getAttribLocation(SHADER.current, name);
            gl.disableVertexAttribArray(coord);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }
        BUFFER.draw = function (name, type, target = undefined, special_run = undefined) {
            if (all[name] == null) return;
            var b = all[name];
            if (target === undefined) target = name;
            gl.bindBuffer(gl.ARRAY_BUFFER, b);
            var coord = gl.getAttribLocation(SHADER.current, target);
            gl.vertexAttribPointer(coord, b.dim, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(coord);

            if (special_run === undefined) {
                gl.drawArrays(type, 0, b.length);
            } else {
                for (var i = 0; i < special_run.length; ++i) {
                    gl.drawArrays(type, special_run[i].start, special_run[i].length);
                }
            }
            gl.disableVertexAttribArray(coord);
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
        }

        BUFFER.drawElements = function (name, type, target = undefined, special_run = undefined) {
            if (all[name] == null) return;
            var b = all[name];
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b);

            if (special_run === undefined) {
                gl.drawElements(type, b.length, gl.UNSIGNED_INT || gl.UNSIGNED_SHORT, 0);
            } else {
                for (var i = 0; i < special_run.length; ++i) {
                    gl.drawElements(type, special_run[i].length * 2, gl.UNSIGNED_INT || gl.UNSIGNED_SHORT, special_run[i].start * b.precision / 8 * 2);//offset sizof*count
                }
            }

            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        }
    })(BUFFER = {});



    (function (FRAMEBUFFER, undefined) {
        var fb;
        var rb = null;
        var tex = null;

        fb = gl.createFramebuffer();
        FRAMEBUFFER.resize = function () {
            gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
            fb.width = innerWidth;
            fb.height = innerHeight;

            if (tex == null) tex = gl.createTexture();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, fb.width, fb.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

            if (rb == null) rb = gl.createRenderbuffer();
            gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
            gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, fb.width, fb.height);

            gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
            gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);

            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindRenderbuffer(gl.RENDERBUFFER, null);
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
        FRAMEBUFFER.resize();

        FRAMEBUFFER.bind = function () { gl.bindFramebuffer(gl.FRAMEBUFFER, fb); }
        FRAMEBUFFER.unbind = function () { gl.bindFramebuffer(gl.FRAMEBUFFER, null); }
        FRAMEBUFFER.bindTexture = function () { gl.bindTexture(gl.TEXTURE_2D, tex); }
    })(FRAMEBUFFER = {});





    (function (camera, undefined) {
        camera.x = 0;
        camera.y = 0;
        camera.zoom = 1;
        camera.pixels_per_coord = 1;
        camera.aspect = 1;
        camera.W = 1;
        camera.H = 1;
        camera.MVP = mat4.create();
        var P = mat4.create();
        var V = mat4.create();

        camera.update = function () {
            camera.aspect = window.innerHeight / window.innerWidth;
            var w = 1;
            var h = camera.aspect;
            if (camera.aspect < 1) {
                w = 1 / camera.aspect;
                h = 1;
            }
            w /= camera.zoom;
            h /= camera.zoom;
            camera.W = w;
            camera.H = h;
            camera.pixels_per_coord = window.innerWidth / w;
            mat4.ortho(P, -w, w, -h, h, 0.1, 100);

            mat4.identity(V);
            mat4.lookAt(V, [camera.x, camera.y, 10], [camera.x, camera.y, 0], [0, 1, 0]);
            mat4.multiply(camera.MVP, P, V);

            rerender();
        }

        camera.movePixel = function (dX, dY) {
            camera.x -= dX / camera.pixels_per_coord * 2;
            camera.y += dY / camera.pixels_per_coord * 2;
            camera.update();
        }
        camera.update();
    })(i9graph.camera = {});





    (function (TEXT, undefined) {
        var divContainerElement = null;
        var all = [];
        var empty = [];
        var map = new Map();
        var number_of_objects = 100;

        function resize(text, size) {
            text.style.fontSize = Math.floor((size) * .5 * innerHeight) + "px";
        }
        function position(text, x, y) {
            text.style.left = Math.floor((x + 1) * .5 * innerWidth) + "px";
            text.style.top = Math.floor((-y + 1) * .5 * innerHeight) + "px";
        }

        TEXT.initialize = function () {
            divContainerElement = document.getElementById("divtextcontainer");
            for (var i = 0; i < number_of_objects; ++i) {

                var t = document.createElement('div');
                t.textNode = document.createTextNode("");
                t.appendChild(t.textNode);
                t.className = "floating-text-div";
                t.x = 0;
                t.y = 0;
                t.size = 0;

                divContainerElement.appendChild(t);
                all.push(t);
                empty.push(t);
            }
        }
        TEXT.clear = function () {
            for (var i = 0; i < all.length; ++i) {
                var t = all[i];
                if (t.size != 0) {
                    empty.push(t);
                    map[t.textNode.nodeValue] = null;
                    t.size = 0;
                }
            }
        }
        TEXT.request = function (name = "", x = 0, y = 0, size = .1, highlighted = false) {
            var t = null;
            if (empty.length > 0) {
                t = empty.pop();
            } else {  //einen verdraengen
                for (var i = 0; i < all.length; ++i) {  
                    var a = all[i];
                    if (a.size < size) {
                        map[a.textNode.nodeValue] = null;
                        t = a;
                        break;
                    }
                }
            }
            if (t != null) {
                t.textNode.nodeValue = name;
                t.x = x;
                t.y = y;
                t.size = size;
                if (highlighted) {
                    t.style.zIndex = '3';
                } else {
                    t.style.zIndex = '2';
                }
                map[name] = t;
            }
        }
        TEXT.remove = function (name = "") {
            if (map[name] != null) {
                empty.push(map[name]);
                map[name].size = 0;
                map[name] = null;
            }
        }
        TEXT.update = function () {
            if (all.length == 0) return;
            all.forEach(function (t) {
                var pos = vec4.fromValues(t.x, t.y, 0, 1);
                var res = vec4.create(); mat4.multiply(res, i9graph.camera.MVP, pos);
                resize(t, t.size / i9graph.camera.H);
                position(t, res[0], res[1]);
            });
        }
    })(TEXT = {});



    var edge_strip_iterations = 4;
    var line_size = 0.006;
    var node_scale = 1.;

    var pointing_node_transparency_factor = 0;
    var points_per_edge = 2 + 2 * (2 + Math.pow(2, edge_strip_iterations)); //(see create_edge_strip_for_edge)

    i9graph.scaleNodes = function (f) { node_scale *= f; i9graph.nodeSizeToSlider(); redrawAll(); }
    i9graph.scaleEdges = function (f) { line_size *= f; i9graph.edgeSizeToSlider(); redrawAll(); }

    i9graph.nodeSizeToSlider();
    i9graph.edgeDetailToSlider();
    i9graph.edgeSizeToSlider();



    var internGraph = new (function () {
        this.vertices = new Float32Array(0);
        this.colors = new Float32Array(0);
        this.indices = new Uint32Array(0);
        this.edge_strips = new Float32Array(0);
        this.edge_strip_colors = new Float32Array(0);
        this.N = -1;
        this.E = -1;
        this.nodesInvalid = 1;
        this.edgesInvalid = 1;
        this.edgeInvalid = [];

        this.node_names = [];
        this.neighbouringEdges = [];
        this.neighbouringNodes = [];
        this.addonPositionsInvalid = true;
        this.addonEdgesInvalid = true;
        this.addonChangedPositions = false;

        var G = this;

        this.setLength = function (nodelen, edgelen) {
            if (G.N == nodelen && G.E == edgelen) return;
            G.N = nodelen;
            G.E = edgelen;
            G.node_names = [];
            G.vertices = new Float32Array(4 * nodelen);      //x,y  ,  size,id
            G.colors = new Float32Array(3 * nodelen);      //r,g,b
            G.indices = new Uint32Array(2 * edgelen);       //src,dst
            G.edge_strips = new Float32Array(3 * edgelen * points_per_edge);      //x,y, sidecoord (in [0,line_size])
            G.edge_strip_colors = new Float32Array(3 * edgelen * points_per_edge);      //r,g,b

            G.edgeInvalid = new Array(edgelen).fill(true);
            G.neighbouringEdges = new Array(nodelen).fill(null).map(() => []);
            G.neighbouringNodes = new Array(nodelen).fill(null).map(() => []);

            G.edgesInvalid = edgelen || 1;
            G.nodesInvalid = nodelen || 1;
        };
        this.setLength(0, 0);

        this.clear = function () {
            G.setLength(0, 0);
            TEXT.clear();
        };

        this.setNode = function (n) {
            if (n.id >= G.N) { console.log('missing setLength'); return; }
            G.nodesInvalid++;
            G.addonPositionsInvalid = true;
            var actual_size = Math.max(.5 * line_size, n.radius * node_scale);
            G.vertices[4 * n.id + 0] = n.pos[0];
            G.vertices[4 * n.id + 1] = n.pos[1];
            G.vertices[4 * n.id + 2] = actual_size;
            G.vertices[4 * n.id + 3] = n.id;
            G.colors[3 * n.id + 0] = n.color[0];
            G.colors[3 * n.id + 1] = n.color[1];
            G.colors[3 * n.id + 2] = n.color[2];

            if (G.node_names[n.id] !== undefined) TEXT.remove(G.node_names[n.id]);
            G.node_names[n.id] = n.label;
            request_text_for_node(n.id);

            var el = G.neighbouringEdges[n.id];
            if (el !== undefined) {
                el.forEach((e) => {
                    G.edgeInvalid[e] = true;
                    G.edgesInvalid++;
                });
            }
        };

        this.setEdge = function (id, src, dst) {
            G.addonEdgesInvalid = true;
            G.indices[2 * id + 0] = src;
            G.indices[2 * id + 1] = dst;
            G.edgeInvalid[id] = true;
            G.edgesInvalid++;

            G.neighbouringEdges[src].push(id);
            if (src != dst) {
                G.neighbouringEdges[dst].push(id);
                G.neighbouringNodes[src].push(dst);  // only other neighbouring nodes than self are interresting
                G.neighbouringNodes[dst].push(src);
            }
        };

        this.generateEdgeStrips = function () {
            if (!G.edgesInvalid) return;

            BUFFER.delete('edge_strips');
            BUFFER.delete('edge_strip_colors');

            var ppe = 2 + 2 * (2 + Math.pow(2, edge_strip_iterations)); //(see create_edge_strip_for_edge)

            if (points_per_edge != ppe) {

                points_per_edge = ppe;
                G.edge_strips = new Float32Array(3 * G.E * points_per_edge);      //x,y, sidecoord (in [0,line_size])
                G.edge_strip_colors = new Float32Array(3 * G.E * points_per_edge);      //r,g,b
            }

            if (G.edgesInvalid < 100 || !graph_addon) {  //> 10% invalid edges
                for (var i = 0; i < G.E; ++i) {
                    if (G.edgeInvalid[i]) {
                        G.edgeInvalid[i] = false;
                        G.computeEdgeStripForEdge(i);
                    }
                }
            } else {
                // update all on GPU
                G.edgeInvalid.fill(false);
                G.updateAddon();
                graph_addon.generate_edge_stripsF32(G.edge_strips, G.edge_strip_colors, edge_strip_iterations, line_size);
            }

            BUFFER.createF32('edge_strips', G.edge_strips, 3);
            BUFFER.createF32('edge_strip_colors', G.edge_strip_colors, 3);
            G.edgesInvalid = 0;
            rerender();
        };


        this.updateAddon = function () {
            if (G.addonPositionsInvalid) {
                G.addonPositionsInvalid = false;
                graph_addon.set_positionsF32(G.vertices);
                graph_addon.set_colorsF32(G.colors);
            }

            if (G.addonEdgesInvalid) {
                G.addonEdgesInvalid = false;
                graph_addon.set_edgesI32(G.indices);
                graph_addon.compute_adjList();
            }
        }

        this.updateForce = function(step,area){
            G.addonChangedPositions = true;
            G.updateAddon();
            graph_addon.update_layoutForce(step,area);
        }

        this.updateWebGL = function () {
            if (!G.nodesInvalid && !G.addonChangedPositions) return;
            G.nodesInvalid = 0;

            BUFFER.delete('nodes');
            BUFFER.delete('colors');
            BUFFER.delete('indices');

            if (G.addonChangedPositions && graph_addon) {
                graph_addon.get_positionsF32(G.vertices);
                G.addonChangedPositions = false;
                for (var i = 0; i < G.N; ++i) {
                    i9graph.i9g.nodes[i].pos[0] = G.vertices[4 * i + 0];
                    i9graph.i9g.nodes[i].pos[1] = G.vertices[4 * i + 1];
                }
            }

            BUFFER.createF32('nodes', G.vertices, 4);
            BUFFER.createF32('colors', G.colors, 3);
            BUFFER.createI32('indices', G.indices, 1);
            rerender();
        };


        this.setGraph = function (g) {
            G.setLength(g.nodes.length, g.edges.length);
            g.nodes.forEach(function (n) { G.setNode(n); });
            g.edges.forEach(function (e, i) { G.setEdge(i, e.src, e.dst); });
        };

        this.computeEdgeStripForEdge = function (TID) {
            var ex = G.indices[2 * TID + 0];
            var ey = G.indices[2 * TID + 1];
            var extend = .5;
            var points_per_edge = 2 + 2 * (2 + (1 << edge_strip_iterations));

            var from = vec4.fromValues(G.vertices[4 * ex + 0], G.vertices[4 * ex + 1], G.vertices[4 * ex + 2], G.vertices[4 * ex + 3]);
            var from_color = vec3.fromValues(G.colors[3 * ex + 0], G.colors[3 * ex + 1], G.colors[3 * ex + 2]);
            var point = points_per_edge * TID;

            function add(a, b) { var r = vec3.create(); vec3.add(r, a, b); return r; }
            function cross(a, b) { var r = vec3.create(); vec3.cross(r, a, b); return r; }
            function sub(a, b) { var r = vec3.create(); vec3.subtract(r, a, b); return r; }
            function scale(a, b) { var r = vec3.create(); vec3.scale(r, a, b); return r; }
            function normalize(a) { var r = vec3.create(); vec3.normalize(r, a); return r; }
            function lerp(a, b, t) { var r = vec3.create(); vec3.lerp(r, a, b, t); return r; }
            function EMIT(P, C) {
                G.edge_strips[3 * point + 0] = P[0];
                G.edge_strips[3 * point + 1] = P[1];
                G.edge_strips[3 * point + 2] = P[2];
                G.edge_strip_colors[3 * point + 0] = C[0];
                G.edge_strip_colors[3 * point + 1] = C[1];
                G.edge_strip_colors[3 * point + 2] = C[2];
                point++;
            }

            var from3 = vec3.fromValues(from[0], from[1], 0);
            var r0 = from[2];
            var points = (points_per_edge - 4) / 2;

            if (ex == ey) {   //pointing to self
                //i.e. partial circle at bottom right corner of node
                var center = add(from3, scale(normalize(vec3.fromValues(1, -1, 0)), r0));
                EMIT(from3, from_color);
                EMIT(from3, from_color);
                for (var i = 0; i < points; ++i) {
                    var pos = Math.PI * .1 + .7 * i * Math.PI * 2. / points;
                    var inner_r = r0 * .5;
                    var outer_r = r0 * .5 + line_size;
                    EMIT(add(center, vec3.fromValues(Math.sin(pos) * outer_r, Math.cos(pos) * outer_r, 0)), from_color);
                    EMIT(add(center, vec3.fromValues(Math.sin(pos) * inner_r, Math.cos(pos) * inner_r, line_size)), from_color);
                }
                EMIT(from3, from_color);
                EMIT(from3, from_color);
            } else {
                var to = vec4.fromValues(G.vertices[4 * ey + 0], G.vertices[4 * ey + 1], G.vertices[4 * ey + 2], G.vertices[4 * ey + 3]);
                var to_color = vec3.fromValues(G.colors[3 * ey + 0], G.colors[3 * ey + 1], G.colors[3 * ey + 2]);
                var to3 = vec3.fromValues(to[0], to[1], 0);

                var center = lerp(from3, to3, .5);
                var right = cross(sub(to3, from3), vec3.fromValues(0, 0, 1));
                var mid = add(center, scale(right, .5 * extend));

                right = normalize(right);

                from3[2] = line_size * .5;
                mid[2] = line_size * .5;
                to3[2] = line_size * .5;

                right[2] = 1;

                EMIT(from3, from_color);
                EMIT(from3, from_color);
                for (var i = 0; i < points; ++i) {
                    var t = i / (points - 1);
                    var T = lerp(lerp(from3, mid, t),
                        lerp(mid, to3, t), t);
                    var C = lerp(from_color, to_color, t);
                    EMIT(add(T, scale(right, -line_size * .5)), C);
                    EMIT(add(T, scale(right, line_size * .5)), C);
                }
                EMIT(to3, to_color);
                EMIT(to3, to_color);
            }

        }

    })();




    i9graph.updateCudaForce=function(step,area){
        internGraph.updateForce(step,area);
    }





    BUFFER.create('quad', [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0], 3);

   

    i9graph.clearGraph = function () {
        i9graph.i9g = new i9graph.graph;
        internGraph.clear();

        i9graph.computedMeasures = {};
        document.getElementById('Filename').innerHTML = '';
    };





    i9graph.computedMeasures = {};

    i9graph.setGraph = function (g) {
        internGraph.clear();
        i9graph.i9g = g;
        i9graph.computedMeasures = {};

        internGraph.setLength(g.nodes.length, g.edges.length);
        if (g.nodes.length > 500) {
            i9graph.current_layout = 'random';
        }
        i9graph.restartLayout();
        internGraph.setGraph(g);
        rerender();
    }




    var externNodesChanged = false;
    function updateInternNodesIfChanged() {
        if (!externNodesChanged) return;
        externNodesChanged = false;
        if(i9graph.i9g && i9graph.i9g.nodes) i9graph.i9g.nodes.forEach(internGraph.setNode);
    }


    function redrawAll() {
        externNodesChanged = true;
        rerender();
    }



    i9graph.centerCamera = function () {
        i9graph.camera.zoom = .8;
        i9graph.camera.x = 0;
        i9graph.camera.y = 0;
        i9graph.camera.update();
        rerender();
    };
    i9graph.centerCamera();


    i9graph.setupDropdowns = function(){};
    var callForceLayoutUpdate = false;
    i9graph.updateLayout = function () { return true; };

    i9graph.setLayout = function (name) {
        console.log('setLayout: '+name);
        i9graph.current_layout = name;
        update_node_properties();
        i9graph.updateLayout = function () { return true; };
        callForceLayoutUpdate = false;
        document.getElementById("layoutName").innerHTML = name;
        if (!i9graph.layout[name]) alert('i9graph.layout.' + name + ' is not implemented!');
        else {
            if (typeof i9graph.layout[name] === 'function') i9graph.layout[name](i9graph.i9g);
            else {
                if (!i9graph.layout[name].start) alert('i9graph.layout.' + name + '.start is not implemented!');
                else if (!i9graph.layout[name].update) alert('i9graph.layout.' + name + '.update is not implemented!');
                else {
                    i9graph.layout[name].start(i9graph.i9g);
                    i9graph.updateLayout = i9graph.layout[name].update;
                    callForceLayoutUpdate = true;
                }
            }
        }
        i9graph.setupDropdowns();
        redrawAll();
    }




    i9graph.color_measure = '';
    i9graph.size_measure = '';
    i9graph.sort_measure = '';

    i9graph.current_layout = 'random';
    i9graph.restartLayout = function () {
        update_node_properties();
        i9graph.setLayout(i9graph.current_layout);
        redrawAll();
    }

    i9graph.setCentrality = function (type) { i9graph.computeMeasure('centrality', type);}
    i9graph.setCommunity = function (type){   i9graph.computeMeasure('community', type); }

    i9graph.computeMeasure = function (type, fnc) {//type(centrality,community), fnc(degree etc..
        if(!type|| !fnc) return;
        if (i9graph.computedMeasures[type + '.' + fnc] === undefined) {
            if(i9graph[type]===undefined) console.log('i9graph.'+type+' is not defined');
            else if(i9graph[type][fnc]===undefined) console.log('i9graph.'+type+'.'+fnc+' is not defined');
            else{
                console.log(type+'.'+fnc+' --> execute');
                i9graph[type][fnc](type+'.'+fnc , i9graph.i9g);
                i9graph.computedMeasures[type + "." + fnc] = true;
            }
        }else{
            console.log(type+'.'+fnc+' already computed');
        }

        i9graph.setupDropdowns();
        i9graph.highlight(highlighted_object);
        update_node_properties();
        redrawAll();
    }


    

    i9graph.getNodeColor = function (n) { return n.measure[i9graph.color_measure]; }
    i9graph.getNodeSort = function (n) { return n.measure[i9graph.sort_measure]; }
    i9graph.getNodeSize = function (n) { return n.measure[i9graph.size_measure]; }



    i9graph.setColorMeasure = function (name) { 
        i9graph.color_measure = name; 
        update_node_properties(); 
        redrawAll();
        i9graph.setupDropdowns();
    }

    i9graph.setSizeMeasure = function (name) { 
        i9graph.size_measure = name; 
        update_node_properties(); 
        redrawAll();
        i9graph.setupDropdowns();
    }

    i9graph.setSortMeasure = function (name) { 
        i9graph.sort_measure = name; 
        update_node_properties(); 
        redrawAll(); 
        i9graph.setupDropdowns();
    }

    i9graph.setColorMeasure('centrality.degree');
    i9graph.setSizeMeasure('centrality.degree');
    i9graph.setSortMeasure('centrality.degree');





    function computeMeasureIfUndefined(func) {
        if (i9graph.computedMeasures[func] === undefined) {
            var t = func.split('.');
            i9graph.computeMeasure(t[0], t[1]);
        }
    }



    function update_node_properties() {
        if(!i9graph.i9g || !i9graph.i9g.nodes) return;

        computeMeasureIfUndefined(i9graph.color_measure);
        computeMeasureIfUndefined(i9graph.sort_measure);
        computeMeasureIfUndefined(i9graph.size_measure);

        i9graph.setSizeAndColorByCentrality(i9graph.i9g);

        i9graph.i9g.nodes.forEach(function (n) {
            n.measure[i9graph.color_measure] = n.centrality;
            n.measure[i9graph.sort_measure] = n.centrality;
            n.measure[i9graph.size_measure] = n.centrality;
            internGraph.setNode(n);
        });

    }




    i9graph.highlight = function(i){
        highlighted_object = i;
        i9graph.setInspectorForSelectedNode( i9graph.i9g.nodes[ highlighted_object ] );
        neighbours = internGraph.neighbouringNodes[i];
        neighbouring_edges = internGraph.neighbouringEdges[i];
    }

    i9graph.setInspectorForSelectedNode = function( n ){
        var B = document.getElementById("inspector-body");
        if(!n){
            B.innerHTML = "<h4>Select Any Node</h4>";            
        }else{
            B.innerHTML = "<h3>["+n.id+"] '"+n.label+"' </h3>"
            B.innerHTML += "<h4>Measurements:</h4>"
            var centr = '';
            var comm = '';
            for(var m in n.measure){
                var a= m.split('.');

                var color = i9graph.hsv_to_rgb(240 * (1-n.measure[m]),.9,.9);
                color = '#'+ ((Math.floor( color[0] )) . toString(16)) +
                             ((Math.floor( color[1] )) . toString(16)) +
                             ((Math.floor( color[2] )) . toString(16)) ;

                var html = "<a class='inline'"
                +" href=\"#\""
                +" data-toggle='tooltip'"
                +" style='color:"+color+";'"
                +" title='"+n.measure[m]+"'"
                +" onclick='i9graph.setColorMeasure(\""+m+"\");' >"+a[1]+"</a>"
            //    +"<a href='#' onclick='i9graph.setSizeMeasure(\""+m+"\");'> oO</a>"
            //    +"<a href='#' onclick='i9graph.setSortMeasure(\""+m+"\");'> 123</a>"
                +"<br>";

                if(a[0]=='community') comm += html;
                else if(a[0]=='centrality') centr += html;
            }
            if(centr.length>0) B.innerHTML += '<h5>Centrality:</h5>'+centr;
            if(comm.length>0) B.innerHTML += '<h5>Community:</h5>'+comm;

            var ingoing='',outgoing='',selfgoing='';
            for( var i in i9graph.i9g.incList[n.id] ){
                var e = i9graph.i9g.incList[n.id][i];
                (function(e){
                    if(e.src==e.dst){  selfgoing += "<a class='inline' href='#'>"+(e.label || '""')+"</a><br>" }
                    else if(e.src==n.id){  outgoing += "<a class='inline' href='#' onclick='i9graph.highlight("+e.dst+");'>"+i9graph.i9g.nodes[e.dst].label+": "+(e.label?e.label:'""')+"</a><br>" }
                    else if(n.id==e.dst){   ingoing += "<a class='inline' href='#' onclick='i9graph.highlight("+e.src+");'>"+i9graph.i9g.nodes[e.src].label+": "+(e.label?e.label:'""')+"</a><br>" }
                    else{console.log("ERROR... ...;:");}
                })(e);
            }
            if(ingoing.length>0)  B.innerHTML += "<h4>Ingoing Edges:</h4>"+ingoing;
            if(outgoing.length>0)  B.innerHTML += "<h4>Outgoing Edges:</h4>"+outgoing;
            if(selfgoing.length>0)  B.innerHTML += "<h4>Self-pointing Edges:</h4>"+selfgoing;
        }
    }

    i9graph.setInspectorForSelectedNode();




    i9graph.setupDropdowns = function () {
        var B = document.getElementById("layout-options");
        var comm='',centr='';
        B.innerHTML = "";//"<h4>Measurements:</h4>"
        for(var c in i9graph.computedMeasures){
            var a = c.split('.');
            
            var html = "<a class='inline'"
                +" href=\"#\""
                +" data-toggle='tooltip' title='set Color by "+c+"'"
                +" style='color:#"+(i9graph.color_measure==c?'991111':'111111')+"'"
                +" onclick='i9graph.setColorMeasure(\""+c+"\");' >"+a[1]+"</a>"
                +"<a href='#' "
                +" data-toggle='tooltip' title='set Size by "+c+"'"
                +" style='color:#"+(i9graph.size_measure==c?'991111':'111111')+"'"
                +"onclick='i9graph.setSizeMeasure(\""+c+"\");'> oO</a>"
                +"<a href='#' "
                +" data-toggle='tooltip' title='set Sorting by "+c+" (only for some layouts)'"
                +" style='color:#"+(i9graph.sort_measure==c?'991111':'111111')+"'"
                +"onclick='i9graph.setSortMeasure(\""+c+"\");'> 123</a>"
                +"<br>";
            
            if(a[0]=='community') comm += html;
            else if(a[0]=='centrality') centr += html;
        }

        
        //if(centr.length>0) B.innerHTML += '<h5>Appearence by Centrality:</h5>'+centr;
        //if(comm.length>0) B.innerHTML += '<h5>Community:</h5>'+comm;

        
        var lo = i9graph.layout[i9graph.current_layout];


        if(lo.options){
            if(!lo.default_options){
                lo.default_options={};
                for(var o in lo.options){  lo.default_options[o] = lo.options[o]; }
            }
            B.innerHTML += "<h3>Options:</h3><form>";
            for(var o in lo.options){
                B.innerHTML += "<a class='inline'><input type='text' style='width:50px'"
                +" value='"+lo.options[o]+"'"
                +" oninput='i9graph.layout[i9graph.current_layout].options[\""+o+"\"] = this.value-0;'"
                +"> "+o+"</a><br>"
            }
            B.innerHTML += "</form>";
            B.innerHTML +="<button type='button' class='btn button-default' onclick='"
            +" var lo = i9graph.layout[i9graph.current_layout];"
            +" for(var o in lo.options){ lo.options[o] = lo.default_options[o];}"
            +" i9graph.setupDropdowns();"
            +"'>Reset Default Values</button>";
        }
    }




    var mouseDown = false;
    var mouseOldX = 0;
    var mouseOldY = 0;
    var dragged_object = -1;
    function handleMouseDown(event) {
        mouseDown = true;
        mouseOldX = event.clientX;
        mouseOldY = event.clientY;

        dragged_object = pointed_object;
        i9graph.highlight(dragged_object);
        rerender();
    }
    function handleMouseUp(event) {
        mouseDown = false;
        mouseOldX = event.clientX;
        mouseOldY = event.clientY;
        dragged_object = -1;
        rerender();
    }
    function handleMouseMove(event) {
        var dX = event.clientX - mouseOldX;
        var dY = event.clientY - mouseOldY;

        mouseOldX = event.clientX;
        mouseOldY = event.clientY;

        if (mouseDown) {

            if (dragged_object == -1) { //move camera
                i9graph.camera.movePixel(dX, dY);
                i9graph.camera.update();
            } else {      // move object
                var n = i9graph.i9g.nodes[dragged_object];
                n.pos[0] += dX / i9graph.camera.pixels_per_coord * 2;
                n.pos[1] -= dY / i9graph.camera.pixels_per_coord * 2;
                internGraph.setNode(n);
            }

        }
        rerender();
    }


    function handleMouseWheel(event) {
        //                  chrome              firefox
        var wheel = (event.wheelDelta / 40) || (-event.detail);
        i9graph.camera.zoom *= Math.pow(wheel < 0 ? 1.01 : 0.99, Math.abs(wheel));
        i9graph.camera.update();
        rerender();
    }


    renderer.view.onmousedown = handleMouseDown;
    document.onmouseup = handleMouseUp;
    document.onmousemove = handleMouseMove;
    document.onmousewheel = handleMouseWheel;       //chrome
    document.addEventListener("DOMMouseScroll", handleMouseWheel, false); //firefox











    SHADER.compile('soft-border'
        , `
precision mediump float;
attribute vec4 nodes;
attribute vec3 colors;
varying float border_radius;
varying float border;
varying vec3 color;

varying float radial_scale;

uniform float pixels_per_coord;
uniform mat4 MVP;

void main(void) {
color = colors;
gl_Position = MVP*vec4(nodes.xy,0.0, 1.0);
gl_PointSize = pixels_per_coord*nodes.z;

border_radius = 1.0 - 2.0*sqrt(1.0/(nodes.z*pixels_per_coord));
radial_scale = pixels_per_coord*nodes.z*.4*.5;  //.5 for diameter to radius; .4 for antialias over 2.5 Pixels
}`
        , `
precision mediump float;

varying vec3 color;
varying float radial_scale;
varying float border_radius;

uniform float transparency;

void main(void) {
vec2 cxy = 2.0 * gl_PointCoord - 1.0;
float radius_01 = dot(cxy, cxy);

float outer_antialias = min(1.,(1.-radius_01) * radial_scale);
float inner_antialias = (radius_01 - border_radius) * radial_scale;

float darker_border = 1. - .6 * min(1.,max(0.,inner_antialias));

if (radius_01 > 1.) {  discard;
}else{                 gl_FragColor = vec4( color * darker_border , transparency) * outer_antialias;
}
}`);


    SHADER.compile('node-draw-id'
        , `
precision mediump float;
attribute vec4 nodes;
varying vec4 color;
uniform float pixels_per_coord;
uniform float max_nodes;
uniform mat4 MVP;
const vec4 bitEnc = vec4(1.,255.,65025.,16581375.);
const vec4 bitDec =1./bitEnc;
vec4 EncodeFloatRGBA(float v){
vec4 enc = bitEnc*v;
enc = fract(enc);
enc -= enc.yzww * vec2(1./255.,0.).xxxy;
return enc;
}
void main(void) {
color = EncodeFloatRGBA(nodes.w/max_nodes);
gl_Position = MVP*vec4(nodes.xy,0.0, 1.0);
gl_PointSize = pixels_per_coord*nodes.z;
}`
        , `
precision mediump float;
varying vec4 color;

void main(void) {
vec2 cxy = 2.0 * gl_PointCoord - 1.0;
float radius_01 = dot(cxy, cxy);
if (radius_01 > 1.) {  discard;
}else{                 gl_FragColor = color;
}
}`);


    SHADER.compile('edges-direct'
        , `
precision mediump float;
attribute vec4 nodes;
attribute vec3 colors;
varying vec3 color;
uniform mat4 MVP;

void main(void) {
color = colors;
gl_Position = MVP*vec4(nodes.xy,0.0, 1.0);
}`, `
precision mediump float;
varying vec3 color;
void main(void) {
gl_FragColor = vec4(.4*color,.6);
}`);


    SHADER.compile('edges-strip-soft'
        , `
precision mediump float;
attribute vec3 edge_strips;
attribute vec3 edge_strip_colors;
varying vec3 color;
varying float side_coord;
uniform mat4 MVP;
uniform float pixels_per_coord;

void main(void) {
color = .4 * edge_strip_colors;
side_coord = edge_strips.z*pixels_per_coord*.4; //.4, so that the antialias goes over 2.5 pixels
gl_Position = MVP*vec4(edge_strips.xy,0.0, 1.0);
}`, `
precision mediump float;
varying vec3 color;
varying float side_coord;
uniform float transparency;

uniform float pixels_per_coord;
uniform float edge_size;
void main(void) {
float neg_side = edge_size*pixels_per_coord*.4 - side_coord;
gl_FragColor = vec4(color, .6*transparency) * min(1.,min(side_coord,neg_side));
}`);



    function request_text_for_node(i, scale = 1.) {
        var n = i9graph.i9g.nodes[i];
        TEXT.remove(n.label);
        var x = n.pos[0];
        var y = n.pos[1];
        var s = Math.max(line_size * .5, n.radius * node_scale);
        TEXT.request(n.label, x - .1 * s * scale, y + s + 1.14 * scale * s, s * scale, scale != 1.);
    }

    function request_text_for_edge(e, scale = 1., show = true, off = 0.) {
        var edge = i9graph.i9g.edges[e];
        var text = edge.label;
        if (text == null) return;
        TEXT.remove(text);
        if (!show) return;

        var i = edge.src;
        var n = i9graph.i9g.nodes[i];

        var x = n.pos[0];
        var y = n.pos[1];
        var s = Math.max(line_size * .5, n.radius * node_scale);
        TEXT.request(text, x - .1 * s * scale, y - (s + off * 1.14 * scale * s), s * scale, scale != 1.);
    }


    i9graph.addRandomNodes = function (n) {
        for (var i = 0; i < n; ++i) {
            var id = i9graph.i9g.nodes.length;
            i9graph.i9g.addNode(new i9graph.node(id, 'N' + id));
            if (id != 0) i9graph.i9g.addEdge(new i9graph.edge(id, Math.round(Math.random() * (id - 1))));
        }
        i9graph.i9g.checkEdgeStyle();
        i9graph.setGraph(i9graph.i9g);
    };



    var pointed_object = -1;
    var highlighted_object = -1;
    var last_pointed_object = -1;
    var neighbours = [];
    var neighbouring_edges = [];




    var grid = [];
    var grid_layers = 6;

    var draw_grid = false;
    i9graph.toggleGrid = function () { draw_grid = !draw_grid; };

    for (var layer = 0; layer < grid_layers; ++layer) {
        var dim = Math.pow(2, layer + 1);
        for (var x = 0; x <= dim; ++x) {
            grid.push(x * (2 / dim) - 1); grid.push(-1);
            grid.push(x * (2 / dim) - 1); grid.push(1);

            grid.push(-1); grid.push(x * (2 / dim) - 1);
            grid.push(1); grid.push(x * (2 / dim) - 1);
        }
    }


    BUFFER.create('grid', grid, 2, 32, true);





    function drawScene() {
        if (themeDark) gl.clearColor(0.1, 0.1, 0.1, 1.0);
        else gl.clearColor(0.9, 0.9, 0.9, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.disable(gl.DEPTH_TEST);




        updateInternNodesIfChanged();
        internGraph.updateWebGL();

        if (dragged_object == -1 && !mouseDown) {
            //draw Node-ids to Texture
            //read id from Texture at mousePos
            FRAMEBUFFER.bind();
            var N = internGraph.N;
            var pixel = new Uint8Array(4);
            gl.readPixels(mouseOldX, innerHeight - mouseOldY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            function decodeFloatRGBA(r, g, b, a) {
                var rgba = vec4.fromValues(r, g, b, a);
                var bitDec = vec4.fromValues(1. / 1., 1. / 255., 1. / 65025., 1. / 16581375.);
                return vec4.dot(rgba, bitDec);
            }
            var id = Math.round((N / 255.) * decodeFloatRGBA(pixel[0], pixel[1], pixel[2], pixel[3]));
            var id_inv = N;

            if (id != N && id != pointed_object) {    //point to new object
                if (pointed_object != -1) {
                    //request simple text for old    
                    request_text_for_node(pointed_object);
                    //neighbouring_edges.forEach((e) => { request_text_for_edge(e, 1., false); });
                }
                //scaled text for new obj
                request_text_for_node(id, 5);
                last_pointed_object = pointed_object = id;

                var i = 0;
                //neighbouring_edges.forEach((e) => { request_text_for_edge(e, 2., true, i++); });

                rerender();
            } else if (id == N) {
                if (pointed_object != -1) {
                    request_text_for_node(pointed_object);
                    //neighbouring_edges.forEach((e) => { request_text_for_edge(e, 1., false); });
                    rerender();
                }
                pointed_object = -1;
            }
            gl.clearColor(1, 0, 0, 0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            gl.disable(gl.BLEND);
            SHADER.bind('node-draw-id');
            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            gl.uniform1f(SHADER.getLocation('pixels_per_coord'), i9graph.camera.pixels_per_coord);
            gl.uniform1f(SHADER.getLocation('max_nodes'), N);
            BUFFER.draw('nodes', gl.POINTS);
            FRAMEBUFFER.unbind();
        }



        if (draw_grid) {
            gl.enable(gl.BLEND);
            gl.blendColor(0, 0, 0, .1);
            gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);

            gl.lineWidth(Math.max(1, Math.floor(.5 * line_size * .5 * i9graph.camera.pixels_per_coord)));
            SHADER.bind('edges-direct');
            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            //BUFFER.drawElements('indices',gl.LINES);
            BUFFER.draw('grid', gl.LINES, 'nodes');
        }




        //fade in / fade out
        if (highlighted_object == -1) {
            pointing_node_transparency_factor += 0.05;
            if (pointing_node_transparency_factor < 0.95) rerender();
            else pointing_node_transparency_factor = 1.;
        } else {
            pointing_node_transparency_factor += -0.05;
            if (pointing_node_transparency_factor > 0.05) rerender();
            else pointing_node_transparency_factor = 0.1;
        }

        gl.enable(gl.BLEND);

        var render_simple_edges = function (draw_list = undefined) {
            gl.lineWidth(Math.max(1, Math.floor(line_size * .5 * i9graph.camera.pixels_per_coord)));
            SHADER.bind('edges-direct');
            BUFFER.bind('nodes');
            BUFFER.bind('colors');
            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            //BUFFER.drawElements('indices',gl.LINES);
            BUFFER.drawElements('indices', gl.LINES, undefined, draw_list);
            BUFFER.unbind('nodes');
            BUFFER.unbind('colors');
        }

        var render_edge_strips = function (transparency = pointing_node_transparency_factor, draw_list = undefined) {
            SHADER.bind('edges-strip-soft');
            BUFFER.bind('edge_strip_colors');
            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            gl.uniform1f(SHADER.getLocation('pixels_per_coord'), i9graph.camera.pixels_per_coord);
            gl.uniform1f(SHADER.getLocation('edge_size'), line_size);
            gl.uniform1f(SHADER.getLocation('transparency'), transparency);
            BUFFER.draw('edge_strips', gl.TRIANGLE_STRIP, undefined, draw_list);
            BUFFER.unbind('edge_strip_colors');
        }

        var render_nodes = function (shader, transparency = pointing_node_transparency_factor, draw_list = undefined) {
            SHADER.bind(shader);
            BUFFER.bind('colors');
            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            gl.uniform1f(SHADER.getLocation('pixels_per_coord'), i9graph.camera.pixels_per_coord);
            gl.uniform1f(SHADER.getLocation('transparency'), transparency);
            BUFFER.draw('nodes', gl.POINTS, undefined, draw_list);
            BUFFER.unbind('colors');
        }


        //draw Edges:
        if (drawNice) {
            internGraph.generateEdgeStrips();
            //recalculateNiceEdges();
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            render_edge_strips();
        } else { // draw Fast
            gl.blendColor(0, 0, 0, pointing_node_transparency_factor);
            gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
            render_simple_edges();
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        }
        render_nodes('soft-border');


        if (pointing_node_transparency_factor < 0.95 && highlighted_object != -1) {
            //draw selected - node - Edges:
            if (drawNice) {
                var draw_list2 = [];
                neighbouring_edges.forEach((n) => { draw_list2.push({ start: n * points_per_edge, length: points_per_edge }); });
                render_edge_strips(1.04 - pointing_node_transparency_factor, draw_list2);
            } else { //Draw Fast:
                gl.blendColor(0, 0, 0, (1.04 - pointing_node_transparency_factor));
                gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
                var draw_list2 = [];
                neighbouring_edges.forEach(function (n) { draw_list2.push({ start: n, length: 1 }) });
                render_simple_edges(draw_list2);
                gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            }

            var draw_list = [{ start: highlighted_object, length: 1 }];
            neighbours.forEach((n) => { draw_list.push({ start: n, length: 1 }); });
            render_nodes('soft-border', 1.04 - pointing_node_transparency_factor, draw_list);
        }


        if (false) {
            gl.enable(gl.BLEND);
            SHADER.bind('drawTexture');
            gl.activeTexture(gl.TEXTURE0);
            FRAMEBUFFER.bindTexture();
            gl.uniform1i(SHADER.getLocation('texture'), 0);

            gl.uniformMatrix4fv(SHADER.getLocation('MVP'), false, i9graph.camera.MVP);
            BUFFER.draw('quad', gl.TRIANGLE_STRIP);

            gl.bindTexture(gl.TEXTURE_2D, null);
        }

    };


    var statusText = document.getElementById("status-text");
    var something_changed = true;
    var loop_requested = true;
    function rerender() {
        if (!loop_requested) {
            if (!render_continuously) requestAnimationFrame(Loop);
            loop_requested = true;
        }
        something_changed = true;
    }



    function Loop() {

        loop_requested = false;
        if (something_changed) {
            requestAnimationFrame(Loop);
            loop_requested = true;
        }
        something_changed = false;

        if (callForceLayoutUpdate) {
            callForceLayoutUpdate = !i9graph.updateLayout(i9graph.i9g);

            if(!callForceLayoutUpdate){
                if(!drawNice) i9graph.toggleEdges();
            }else{
                if(drawNice) i9graph.toggleEdges();
            }
            redrawAll();
        }


       //   console.log("draw");

        TIME.newFrame();
        fpsNumber += ((1.0 / TIME.dTime) - fpsNumber) * 0.1;

        if (i9graph.i9g.nodes !== undefined && statusText) {
            statusText.textContent =
                "G: " + i9graph.i9g.edgeStyle
                + ", V[" + (i9graph.i9g.nodes.length)
                + "], E[" + (i9graph.i9g.edges.length)
                + "]";//,  " + fpsNumber.toPrecision(2) + " FPS";
        }

        TEXT.update();
        drawScene();
        if (render_continuously || callForceLayoutUpdate) rerender();
    }
    Loop();

    /** end namespace i9graph*/
})(window.i9graph = window.i9graph || {});

