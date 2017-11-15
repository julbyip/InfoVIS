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
    * @function hsv_to_rgb
    * @memberof i9graph
    * @description convert hsv to rgb color.
    * This method assumes h in [0,360]. RGB values
    * are computed in [0, 1]
    * @param {number} h hue
    * @param {number} s saturation
    * @param {number} v value
    * @returns {vec3} vec3 with rgb components in [0, 1]   (accessible like array)
    * @private
    */
    i9graph.hsv_to_rgb = function (h, s, v) {
        if (s === 0) {
            return [v, v, v]; // grey
        }
        var r, g, b;
        var i = Math.floor(h / 60);
        var f = h / 60 - i;
        var p = v * (1 - s);
        var q = v * (1 - s * f);
        var t = v * (1 - s * (1 - f));
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        return vec3.fromValues(r, g, b);
    };





    /**
     * @function degree
     * @memberof i9graph.centrality
     * @description computes the degree centrality for all nodes in the graph.
     * For directed graph indegree and outdegree are summed up to the node degree
     * the centrality is stored for each node in its centrality property
     * measureName can be ignored for now
     */
    i9graph.centrality.degree = function (measureName, graph) {
        //DONE:: compute the degree for all nodes using the edges
        var number_nodes = 0;
        graph.edges.forEach(function(n){
            graph.nodes[n.src].degree++;
            graph.nodes[n.dst].degree++;
        });
        // graph.nodes.forEach(function(n){console.log(n.id+": "+n.degree);});

        //DONE:: compute the minimum and maximum degree
        var min = Number.MAX_SAFE_INTEGER;
        var max = -1;
        graph.nodes.forEach(function(n)
        {
            if (n.degree < min)
                min = n.degree;
            if (n.degree > max)
                max = n.degree;
            number_nodes++;
        });
        console.log("Max: "+max+" min: "+min);

        //DONE:: assign a centrality value (in [0,1]) to each node,
        //       depending on its degree (lowest degree: 0 , highest degree: 1).
    
        graph.nodes.forEach(function (n) {
            if (n.degree == min)
                n.centrality = 0;
            else
                n.centrality = n.degree / max; 
        });
        graph.nodes.forEach(function(n){console.log(n.id+": "+n.degree+" cent:"+n.centrality+"  "+n.centrality*360);});
    }






    /**
    * @function setSizeAndColorByCentrality
    * @memberof i9graph
    * @description computes the radius and the color for each node depending on the centrality value of the node.
    * maps the scalar centrality value linearily using the rainbow color map
    */
    i9graph.setSizeAndColorByCentrality = function ( graph ) {
        //DONE:: map the centrality of each node to its radius

        //DONE:: map the scalar centrality value linearily to a rainbow color map
        //       the color of the node should be a vec3    (see function  i9graph.hsv_to_rgb )
        graph.nodes.forEach(function (n) {
            // n.radius =  Math.random()*.05 + .01;
            n.radius = n.centrality *.05 + .01;
            n.color = i9graph.hsv_to_rgb(n.centrality*360, 100, 100);
            // n.color  =  vec3.fromValues( n.centrality*360, 0, 0);
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

        //TODO:: - place all nodes on a circle with radius 1 around (0,0)
        //       - sort the nodes by their centrality
        //       - the nodes should consume space on the circle according to their size
        //       - adjust the radius of each node so that neighbouring nodes are nearly touching each other but do not overlap.
        var v = [];
        var radius = 1;
        
        graph.nodes.forEach( function(n)
        {
            v.push(n);
            console.log(n.centrality);
        })
        v.sort(function(a, b)
        {
            return a.centrality - b.centrality;
        });
        
        var umfang = 2 * Math.PI * radius;
        var act_space = 0;
        v.forEach(function(n) {
            act_space += (2 * n.radius);
        });

        var mult = umfang/act_space; 
        v.forEach(function(n) {
            n.radius *= (mult);
        });

        //var step = 2 * Math.PI / graph.nodes.length;
        var i = 0;
        for (var j = 0; j < v.length; j++) {
            if (j != 0)
                i += (v[j].radius);
            v[j].pos[0] = Math.cos(i);
            v[j].pos[1] = Math.sin(i);
            i += (v[j].radius);            
        }


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
