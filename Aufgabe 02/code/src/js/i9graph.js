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



    /**
     * @function degree
     * @memberof i9graph.centrality
     * @description computes the degree centrality for all nodes in the graph.
     * For directed graph indegree and outdegree are summed up to the node degree
     * the centrality is stored for each node in its centrality property
     */
    i9graph.centrality.degree = function (measureName, graph) {
        graph.nodes.forEach(function (n){
            n.degree = 0;
        });
        graph.edges.forEach(function (e) {
            graph.nodes[e.src].degree++;
            graph.nodes[e.dst].degree++;
        });

        var minD = Number.MAX_SAFE_INTEGER;
        var maxD = 0;
        graph.nodes.forEach(function (n) {
            minD = Math.min(minD, n.degree );
            maxD = Math.max(maxD, n.degree );
        });
        if(maxD==minD){ 
            minD -=.5;  
            maxD+=.5; 
        }
        graph.nodes.forEach(function (n) {
            n.measure[measureName] = (n.degree - minD) / (maxD - minD);
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





    /**
     * @namespace animatedRandom
     * @memberof i9graph.layout
     * @description the nodes are moved randomly each frame.
     * The moving distance is decreasing.  
     */
    i9graph.layout.animatedRandom = new (function(){
        var layout = this;

        // the framework forwards the 'options' of a layout to the GUI
        this.options = {
            initial_move_distance : 0.1,
            abort_move_distance : 0.001,
            dummyValue : 42
        };

        // The start function is called once, when the layout is selected, or recomputed
        this.start = function (graph) {
            layout.move = layout.options.initial_move_distance;
        };

        // The update function is called every frame, until it returnes true;
        this.update = function (graph){
            graph.nodes.forEach(function(n){
                n.pos[0] += layout.move*(Math.random()-.5)*2;
                n.pos[1] += layout.move*(Math.random()-.5)*2;
            });
            layout.move *= 0.98;
            return layout.move < layout.options.abort_move_distance;
        };
    })();







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

    // TODO:: implement the namespace  i9graph.layout.fruchtermann 
    //  - use the implementation pattern of the   i9graph.layout.animatedRandom  namespace

    i9graph.layout.fruchtermann = new (function(){
        var layout = this;

        // the framework forwards the 'options' of a layout to the GUI
        //  - options property:  should contain several values, that can be manipulated by the user
        //  i.e. cooling_factor or initial_max_displacement
        this.options = {
            limit: 0,
            temperature: 0.9,
            cooling_factor: 0.1, 
            initial_max_displacement: 0.01 // change
        };

        // The start function is called once, when the layout is selected, or recomputed
        //  - start method:  should initialize the algorithm
        var area = 0;
        var k = 0;
        this.start = function (graph) {
            graph.nodes.forEach(function(n){
                 n.pos[0] = Math.random() * 2 - 1;
                 n.pos[1] = Math.random() * 2 - 1;

            });
            area = 4;
            k = Math.sqrt(area/graph.nodes.length);
        };

        function f_a(d) {
            return Math.pow(d, 2) / k;
        }; 
        
        function f_r(d) {
            return -Math.pow(k, 2)/ d;
        };  


        // The update function is called every frame, until it returnes true;
        //  - update method: should perform one iteration of the force based fruchtermann algorithm
        //      update should return true, if the algorithm is finished (false otherwise)
        this.update = function (graph){    
            console.log("update");
            if ((layout.options.temperature-layout.options.cooling_factor) <= layout.options.limit) {
                return true;
            }
            else
            {                
                var disp = [];
                var delta;

                    // Repulsive forces
                graph.nodes.forEach(function(v){
                    disp[v.id] = vec2.create(0,0);
                    graph.nodes.forEach(function(u) {
                        if (u.id != v.id) {
                            delta = sub(v.pos, u.pos);
                            if (len(delta) >= Number.MIN_VALUE) {
                                disp[v.id] = add (disp[v.id], scale(normalize(delta), f_r(len(delta))));
                            }
                            // console.log("add delta: "+delta);
                        }

                    });
                    // console.log("For id "+v.id+" disp = "+disp[v.id]);

                });
                // Attractive forces
                //e.v = e.src e.u = e.dst
                graph.edges.forEach (function(e)
                {
                    if(e.src != e.dst) {
                        delta = sub(graph.nodes[e.src].pos, graph.nodes[e.dst].pos);
                        disp[e.src] = sub(disp[e.src], scale(normalize(delta), f_a(len(delta))));
                        disp[e.dst] = add(disp[e.dst], scale(normalize(delta), f_a(len(delta))));
                    }
                });


                graph.nodes.forEach(function(n){
                    if (disp[n.id][0] > layout.options.inital_max_displacement) {
                        disp[n.id][0] = layout.options.inital_max_displacement;
                        // console.log("reseted disp");
                    } 
                    if (disp[n.id][1] > layout.options.inital_max_displacement) {
                        disp[n.id][1] = layout.options.inital_max_displacement;
                        // console.log("reseted disp");
                    } 

                // console.log(disp[n.id]); 
                    n.pos = add (n.pos, scale(normalize(n.pos), Math.min(len(disp[n.id]), layout.options.temperature)));
                    n.pos[0] = Math.min(1, Math.max(-1, n.pos[0]));
                    n.pos[1] = Math.min(1, Math.max(-1, n.pos[1]));
                });
                
                layout.options.temperature -= layout.options.cooling_factor;
                console.log("Temperature: "+layout.options.temperature);
                return (false)};
    }; 
    })();




    







    // generate an example Graph

    i9graph.i9g = new i9graph.graph;

    i9graph.i9g.addNode(new i9graph.node(0, 'N0'));
    i9graph.i9g.addNode(new i9graph.node(1, 'N1'));
    i9graph.i9g.addNode(new i9graph.node(2, 'N2'));
    i9graph.i9g.addNode(new i9graph.node(3, 'N3'));
    i9graph.i9g.addNode(new i9graph.node(4, 'N4'));
    i9graph.i9g.addNode(new i9graph.node(5, 'N5'));

    i9graph.i9g.addEdge(new i9graph.edge(0, 0));
    i9graph.i9g.addEdge(new i9graph.edge(1, 1));
    i9graph.i9g.addEdge(new i9graph.edge(0, 1));
    i9graph.i9g.addEdge(new i9graph.edge(1, 2));
    i9graph.i9g.addEdge(new i9graph.edge(2, 3));
    i9graph.i9g.addEdge(new i9graph.edge(1, 3));
    i9graph.i9g.addEdge(new i9graph.edge(1, 4));
    i9graph.i9g.addEdge(new i9graph.edge(1, 5));
    i9graph.i9g.addEdge(new i9graph.edge(2, 5));

    i9graph.i9g.checkEdgeStyle();
    i9graph.setGraph(i9graph.i9g);



})(window.i9graph = window.i9graph || {});
