/**
 * @fileOverview Module i9graph implements measures for
 * centrality and modularity in graphs and visualization methods.
 * @author Roberto Grosso
 * @author Jonas Müller
 * @version 1.0
 */

/** @namespace */
(function (i9graph, undefined) {
    "use strict";

    // setup inner namespaces
    i9graph.layout = i9graph.layout || {};
    i9graph.centrality = i9graph.centrality || {};
    i9graph.community = i9graph.community || {};




    i9graph.normalizeMeasure = function (measureName, graph) {
        var min = Number.POSITIVE_INFINITY;
        var max = 0;
        graph.nodes.forEach(function (n) {
            if (!n.visible) return;
            min = Math.min(min, n.measure[measureName]);
            max = Math.max(max, n.measure[measureName]);
        });
        if (max == min) {
            min -= .5;
            max += .5;
        }
        graph.nodes.forEach(function (n) {
            if (!n.visible) return;
            n.measure[measureName] = (n.measure[measureName] - min) / (max - min);
        });
    }



    /**
     * @function degree
     * @memberof i9graph.centrality
     * @description computes the degree centrality for all nodes in the graph.
     * For directed graph indegree and outdegree are summed up to the node degree
     * the centrality is stored for each node in its centrality property
     */
    i9graph.centrality.degree = function (measureName, graph) {
        graph.nodes.forEach(function (n) {
            n.degree = 0;
        });
        graph.edges.forEach(function (e) {
            if (!e.visible) return;
            if (graph.nodes[e.src].visible && graph.nodes[e.dst].visible) {
                graph.nodes[e.src].degree++;
                if (e.src != e.dst) graph.nodes[e.dst].degree++;
            }
        });

        graph.nodes.forEach(function (n) {
            n.measure[measureName] = n.degree;
        });

        i9graph.normalizeMeasure(measureName, graph);
    }




    i9graph.centrality.age = function (measureName, graph) {

        // TODO::  any measure stored in the measure property can be selected in the GUI to choose the color or size of a node from.
        //     implement an intuitive mapping from the age of the node  to this centrality measure ( again in [0,1]  )
        //  a centrality of 1 for example equals red color, whereas 0 equals blue.

        graph.nodes.forEach(function(n){
            n.measure[measureName] = Math.random();
        });
    };




    i9graph.determineGraphVisibility = function (graph) {
        // DONE::  set the 'visible' property 
        //      of all nodes and edges  of the graph
        //      according to:
        //          - their activity[{start,end}] property,
        //          - and the  'i9graph.animationTime'  'i9graph.animationFrame'
        //      everything active anywhere between animationTime and animationTime+Frame should be visible    
        //  Note::  The graph-files alow the presence of edges without their linked nodes.
        //          In this application, an edge should only be visible when both nodes are.
        //  Note:: this Function is called by the Framework everytime the animationTime changes.

        graph.nodes.forEach ( function (n)
        {
            n.visible = false;
            if (n.activity[0].start <= i9graph.animationTime && n.activity[0].end >= i9graph.animationTime)
                n.visible = true;
        });

        graph.edges.forEach (function (e)
        {
            e.visible = false;
            if (e.activity[0].start <= i9graph.animationTime && e.activity[0].end >= i9graph.animationTime)
            {
                if (graph.nodes[e.src].visible && graph.nodes[e.dst].visible)
                    e.visible = true;
            }
        });
    }








    /**
     * @function random
     * @memberof i9graph.layout
     * @description each node of the currently loaded graph is getting a random position in [-1,1]^2
     */
    i9graph.layout.random = function (graph) {
        graph.nodes.forEach(function (n) {
            n.pos[0] = Math.random() * 2 - 1;
            n.pos[1] = Math.random() * 2 - 1;
        });
    }

    /**
     * @function circular
     * @memberof i9graph.layout
     * @description the nodes are placed on a circle of radius 1 around the center of the drawing area (0,0).
     * The nodes are sorted by their centrality.  
     */
    i9graph.layout.circular = function (graph) {
        var totalValue = 0;
        var maxRadius = 0;
        var Q = new i9graph.PriorityQueue;

        graph.nodes.forEach(function (n) {
            totalValue += n.radius;
            maxRadius = Math.max(n.radius, maxRadius);
            Q.insert({ key: n.sort_key, node: n });
        });

        function rad_to_radius(r) {
            var x = (Math.min(Math.PI, r) / Math.PI) - 1;
            return (1 - x * x);
        }
        var incrementalValue = 0;
        var step = 2 * Math.PI / totalValue;
        var scaling = 1 - .5 * rad_to_radius(maxRadius * step);

        while (!Q.empty()) {
            var ele = Q.remove();
            var n = ele.node;
            var mystep = .5 * n.radius * step;
            var pos = incrementalValue + mystep;
            n.pos[0] = Math.sin(pos) * scaling;
            n.pos[1] = Math.cos(pos) * scaling;
            n.radius = .8 * rad_to_radius(2 * mystep * scaling);
            incrementalValue += 2 * mystep;
        }
    }









    // vec2 Math helper functions
    function normalize(v2) { var res = vec2.create(); vec2.normalize(res, v2); return res; }
    function scale(v2, l) { var res = vec2.create(); vec2.scale(res, v2, l); return res; }
    function add(v2, u2) { var res = vec2.create(); vec2.add(res, v2, u2); return res; }
    function sub(v2, u2) { var res = vec2.create(); vec2.sub(res, v2, u2); return res; }
    function len(v2) { return vec2.length(v2); }




    /**
     * @namespace fruchtermann
     * @memberof i9graph.layout
     * @description force based fruchtermann layout.
     * initial setup is done in the start function.
     * one iteration of the layout computation is performed in the update function.
     */

    i9graph.layout.fruchtermann = new (function () {
        var layout = this;

        // the framework forwards the 'options' of a layout to the GUI
        this.options = {
            initial_displacement: 0.1,
            force_modifier: 1,
        };

        var repulsiveForce = function (dist) { return 1 / dist; }
        var attractiveForce = function (dist) { return dist * dist; }
        var max_displacement = 0;

        // The start function is called once, when the layout is selected, or recomputed
        this.start = function (graph) {
            var area = layout.options.force_modifier;
            var k = Math.sqrt(area / graph.nodes.length);
            repulsiveForce = function (dist) { return k * k / dist; }
            attractiveForce = function (dist) { return dist * dist / k; }
            max_displacement = layout.options.initial_displacement;
        };

        // The update function is called every frame, until it returnes true;
        this.update = function (graph) {
            graph.nodes.forEach(function (v) {
                v.displace = scale(sub(vec2.fromValues(0, 0), v.pos), .1);

                graph.nodes.forEach(function (u) {
                    if (u.id != v.id) {
                        var delta = sub(v.pos, u.pos);
                        v.displace = add(v.displace, scale(normalize(delta),
                            repulsiveForce(len(delta))));
                    }
                });
            });

            graph.edges.forEach(function (e) {
                var u = graph.nodes[e.src];
                var v = graph.nodes[e.dst];
                if (u.id == v.id) return;
                var delta = sub(v.pos, u.pos);
                var movement = scale(normalize(delta), attractiveForce(len(delta)) - repulsiveForce(len(delta)))/;
                u.displace = add(u.displace, movement);
                v.displace = add(v.displace, scale(movement, -1));
            });

            graph.nodes.forEach(function (v) {
                if (len(v.displace) > 0.000001) {
                    v.pos = add(v.pos,
                        scale(normalize(v.displace),
                            Math.min(max_displacement, max_displacement * len(v.displace)) * Math.random()));
                }
                // stay inside area
                v.pos[0] = Math.max(-1, Math.min(1, v.pos[0]));
                v.pos[1] = Math.max(-1, Math.min(1, v.pos[1]));
            });

        };
    })();








    /**
     * @namespace aging
     * @memberof i9graph.layout
     * @description force based fruchtermann layout.
     * using aging to adjust the force on nodes, for dynamic graphs.
     */

    i9graph.layout.aging = new (function () {
        var layout = this;
        // the framework forwards the 'options' of a layout to the GUI
        this.options = {
            max_displacement: 0.1,
            force_modifier: 1,
            aging_rate: 0.01,
        };


        //TODO:: implement the 'Aging':
        //  including the force based layout only working on 'visible' graph-elements.

        var repulsiveForce = function (dist) { return 1 / dist; }
        var attractiveForce = function (dist) { return dist * dist; }
        var max_displacement = 0;

        var ages = [][];
        var rem = [];
        var del = [];
        var add = [];

        // The start function is called once, when the layout is selected, or recomputed
        // Start as the Fruchtermann layout
        this.start = function (graph) {
            // all the nodes already are inicialized with age 1 (i9graph_definition)
            var area = layout.options.force_modifier;
            var k = Math.sqrt(area / graph.nodes.length);
            repulsiveForce = function (dist) { return k * k / dist; }
            attractiveForce = function (dist) { return dist * dist / k; }
            max_displacement = layout.options.max_displacement;
            // putting the age in a matrix nodes X time
            graph.nodes.forEach(function(n) { ages[n.id][0] = n.age});
        };

        // The update function is called every frame;
        this.update = function (graph) {

        

            return false;
        };
    })();









    // generating an example Graph
    i9graph.i9g = new i9graph.graph;

    var N = 10;
    var E = 30;

    for (var n = 0; n < N; ++n) {
        i9graph.i9g.addNode(new i9graph.node(n, 'N' + n));
    }
    for (var e = 0; e < E; ++e) {
        var src = Math.floor(Math.random() * N);
        var dst = Math.floor(Math.random() * N);
        i9graph.i9g.addEdge(new i9graph.edge(src, dst));
    }

    // add dynamic information:
    i9graph.i9g.start = 0;
    i9graph.i9g.end = 200;
    for (var s = 0; s < 2; ++s) {
        i9graph.i9g.nodes.forEach(function (n) {
            var s = i9graph.i9g.start + Math.random() * (i9graph.i9g.end - i9graph.i9g.start);
            var e = s + Math.random() * (i9graph.i9g.end - s);
            n.activity.push({ start: s, end: e });
        });
        i9graph.i9g.edges.forEach(function (n) {
            var s = i9graph.i9g.start + Math.random() * (i9graph.i9g.end - i9graph.i9g.start);
            var e = s + Math.random() * (i9graph.i9g.end - s);
            n.activity.push({ start: s, end: e });
        });
    }

    i9graph.i9g.checkEdgeStyle();
    i9graph.setGraph(i9graph.i9g);



})(window.i9graph = window.i9graph || {});
