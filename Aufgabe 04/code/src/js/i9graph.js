/**
 * @fileOverview Module i9graph implements measures for
 * centrality and modularity in graphs and visualization methods.
 * @author Roberto Grosso
 * @author Jonas Müller
 * @version 1.0
 */

/** @measureNamespace */
(function (i9graph, undefined) {
    "use strict";

    // setup inner measureNamespaces
    i9graph.layout = i9graph.layout || {};
    i9graph.centrality = i9graph.centrality || {};
    i9graph.community = i9graph.community || {};



 





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
     * @measureNamespace fruchtermann
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
                var movement = scale(normalize(delta), attractiveForce(len(delta)) - repulsiveForce(len(delta)));
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










    i9graph.normalizeMeasure = function (measureName, graph) {
        var min = Number.POSITIVE_INFINITY;
        var max = 0;
        graph.nodes.forEach(function (n) {
            min = Math.min(min, n.measure[measureName]);
            max = Math.max(max, n.measure[measureName]);
        });
        if (max == min) {
            min -= .5;
            max += .5;
        }
        i9graph.computedMeasures[measureName].min = min;
        i9graph.computedMeasures[measureName].max = max;      

        graph.nodes.forEach(function (n) {
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
            n.measure[measureName] = n.degree;
        });
        i9graph.normalizeMeasure(measureName,graph);
    }



    /**
     * @function closeness
     * @memberof i9graph.centrality
     * @description computes the closeness centrality for all nodes in the graph
     * This function works for directed or undirected graphs
     */
    i9graph.centrality.closeness = function (measureName, graph) {
        var N = graph.nodes.length;

        graph.nodes.forEach( function (n) {
            // visit every node using breadth first search, (find shortest pathlengths to all nodes)
            var Q = new i9graph.PriorityQueue;
            var visited = new Array( N ).fill(false);
            visited[ n.id ] = true;

            Q.insert({ key: 1., node: n.id, pathlen: 0 });
            var sum_of_inverse_shortest_pathlengths = 0; 

            while (!Q.empty()) {
                var ele = Q.remove();
                var cid = ele.node;

                graph.adjList[ cid ].forEach(function (m) {
                    var id = m.id;
                    if (id == cid) return;

                    if ( ! visited[ id ] ) {
                        visited[ id ] = true;
                        var pathlen = ele.pathlen + 1;
                        // sum up the 'closeness'  (i.e.  1 / 'farness'  ,  farness==shortest-pathlength )
                        // unreachable nodes are weighted with 0
                        sum_of_inverse_shortest_pathlengths += 1 / pathlen;
                        Q.insert({ key: 1. / pathlen, node: id, pathlen: pathlen });
                    }
                });
            }
            n.measure[measureName] = sum_of_inverse_shortest_pathlengths;
        });

        i9graph.normalizeMeasure(measureName,graph);
    }






     /**
     * @function betweenness
     * @memberof i9graph.centrality
     * @description Implements the shortest-path betweenness centrality. Paths between nodes in computing
     * using unweighted edges, i.e. edge weight is 1 for all edges.
     * @private
     */
    i9graph.centrality.betweenness = function (measureName, graph) {

        //TODO::   read and try to understand the following code-skeleton
        //         then implement the missing parts accordingly

        var N = graph.nodes.length;
        graph.nodes.forEach(function (n) { 
            n.centrality = 0; 
        });

        // for each Node n
        graph.nodes.forEach(function (n) {  
            var stack = [];          
            var nodesOnShortestPath   = new Array( N ).fill(null).map(() => []);
            var numberOfShortestPaths = new Array( N ).fill(0);  
            numberOfShortestPaths[ n.id ] = 1;

            var min_distance = new Array( N ).fill(-1); 
            min_distance[n.id] = 0;

            // Performing a breadth first search to all other nodes
            // finding:
            // - the min_distance           from n to the other node
            // - the numberOfShortestPaths  from n to the other node
            // - the direct ancestor  nodesOnShortestPath    from n to the other node
            // and - the reverse BFS stored in stack

            var Q = new i9graph.PriorityQueue();        
            Q.insert({ key: 0, node: n.id }); 

            while (!Q.empty()) {          
                var ele = Q.remove();    
                var v = ele.node;
                stack.push(v);      
                graph.adjList[ v ].forEach(function ( nw  ) {   
                    var w = nw.id;
                    if(w == v) return;

                    // TODO::
                    //   if the node  w  has not been visited:
                    //   insert it into the  Q  (with the  correct priority-key)
                    //   and mark it as visited (i.e.  set its min_distance)


                    //TODO:
                    //    if the current path to  w  is a shortest Path:
                    //    update the numberOfShortestPaths   to w
                    //    and add   v  to the collection of   nodesOnShortestPath   of  w


                });
            }

            var current_centrality  =  new Array( N ).fill(0); 
            // visit every node   in   'reverse breadth first'   order   (so current_centrality  is  0  for farest, then 1,2,3 etc.  (but scaled with path-percentage))
            while (stack.length > 0) {  
                var w = stack.pop();    
                
                // for every node  v  where    ( n --> v -> w )   is a shortest path  (n --> w)
                nodesOnShortestPath[ w ].forEach(function (v) {

                    //TODO::  sum up the current_centrality values for each node  v   on the shortest Path of   n to w
                    //  therefor::
                    //        increment  the current_centrality of v  
                    //        by the   (current_centrality of w)  +  1 
                    //        scaled by the  percentage of   paths that go over  v    
                    //                                       relative to the total paths to  w
                    
                });
            }

            graph.nodes.forEach(function(w){
                if (w.id != n.id){
                    w.centrality  +=  current_centrality[ w.id ];   
                }
            });
        });

        graph.nodes.forEach(function (n) {
            n.measure[measureName] = n.centrality;
        });
        i9graph.normalizeMeasure(measureName,graph);
    }

    
    
    
    /**
     * @function eigenvector
     * @memberof i9graph.centrality
     * @description computes the eigenvector centrality for all nodes in the graph
     * It uses power iteration to compute the largest eigenvector
     * @public
     */
    i9graph.centrality.eigenvector = function (measureName, graph) {
        if (graph.edgeStyle !== 'undirected') {
            alert('Eigenvector centrality is only useful for undirected graphs. Use PageRank centrality instead.');
        }
        
        //TODO::   read and try to understand the following code-skeleton
        //         then implement the missing parts accordingly

        // Evaluate the eigenvector Centrality
        // using Power Iteration

        var N = graph.nodes.length;
        var B = new Array(N).fill(1);
        var previous_error = Number.MAX_VALUE;

        for (var iter = 0; iter < 100; iter++) { // 100 iterations

            var T = new Array(N).fill(0);
 
            //TODO:  T[i]  =  sum of all  B[j]  where  node j is neighbour of node i

            //TODO:  normalize  T


            var error = 0;
            //TODO:  compute the  'error' (see: power iteration)

        
            // abort, when error is increasing, or error is 'small'
            if (error < 0.05 || error > previous_error) {
                if (error < previous_error) B = T;
                break;
            }
            previous_error = error;
            B = T;
        }
        
        graph.nodes.forEach(function (n, i) {
            n.measure[measureName] = B[ i ];
        });
        i9graph.normalizeMeasure(measureName,graph);
    }




    /**
     * @function pageRank
     * @memberof i9graph.centrality
     * @description computes the PageRank of a node for all nodes in the graph.
     * @public
     */
    i9graph.centrality.pageRank = function (measureName, graph) {
        if (graph.edgeStyle !== 'directed') {
            alert('PageRank centrality is only useful for directed graphs. Use eigenvector centrality instead.');
        }

        //TODO::   read and try to understand the following code-skeleton
        //         then implement the missing parts accordingly
        
        
        var N = graph.nodes.length;
        var previous_error = Number.MAX_VALUE;
        var d = 0.85; // dumping factor

        // collect all elements that link to a node i
        var L = new Array(N).fill(null).map(() => []);
        graph.edges.forEach(function (e) {
            if(e.src==e.dst) return;
            L[e.dst].push({ 
                source: e.src, 
                outdegree: graph.nodes[e.src].outdegree 
            });
        });

        var inv_d = (1 - d) / N;
        var rank_in  = new Array(N).fill(inv_d);
        var rank_out = new Array(N).fill(0);

        // iterations, never do more than 10 iterations
        for (var iter_ = 0; iter_ < 10; iter_++) {

            // a minimal rank_out is needed, to avoid unwanted source/drain behaviour
            graph.nodes.forEach(function(n,i){
                rank_out[ i ] = inv_d;
            });

            // TODO::  distribute the rank_in of every node equally to the rank_out of its successors
            //    weight this amount by the dumping_factor, to not increase the overall rank



            var error = 0;
            // TODO:: compute error



            // abort if error small enough, or increasing
            if (error > previous_error) {  // return previous result
                rank_out = rank_in;
                break;
            }
            if ( error < 0.04 && iter_ > 3 ) break;

            rank_in = rank_out.slice(); //copy
            previous_error = error;
        }


        
        graph.nodes.forEach(function (n, i) {
            n.measure[measureName] = rank_out[i];
        });
        i9graph.normalizeMeasure(measureName,graph);
    }








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
