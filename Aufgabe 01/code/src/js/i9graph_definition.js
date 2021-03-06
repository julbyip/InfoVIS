/**
 * @fileOverview Module i9graph implements measures for
 * centrality and modularity in graphs and visualization methods.
 * @author Roberto Grosso
 * @version 1.0
 */

/** @namespace */
(function (i9graph, undefined) {
    'use strict';

    /**
     * @var {object} i9g
     * @memberof i9graph
     * @description A graph object within the i9graph module. The object
     * will be generated by the method <tt>readSingleFile</tt>.
     * @private
     */
    i9graph.i9g = {};
    
    
    /**
     * @function edge
     * @memberof i9graph
     * @description the model for an edge in a graph.
     * @param {number} s source node
     * @param {number} d destination or target node
     * @param {number} w edge weight
     * @returns {object}
     * @private
     */
    i9graph.edge = function (s,d,w=1,label=null) {
        this.src = s;
        this.dst = d;
        this.label = label;
        this.edgeStyle = 'undirected';
        this.isWeighted = false;
        this.weight = w;
    };
    
    
    /**
     * @function node
     * @memberof i9graph
     * @description the model for a node in a graph.
     * @param {number} id node unique id
     * @param {string} label node label
     * @returns {object}
     * @private
     */
    i9graph.node = function (id, label) {
        this.id = id;
		this.indegree  = 0;
        this.outdegree = 0;
        this.degree = 0;
        this.label = label;
        this.community = 0;
        this.centrality = 0;
        this.measure = {};
        this.pos    = vec2.fromValues(Math.random()*2-1,Math.random()*2-1);
        this.color  = vec3.fromValues(Math.random(),Math.random(),Math.random());
        this.radius = .01+.05*Math.random();
        this.sort_key = Math.random();
    };
    
    
    /**
     * @function graph
     * @memberof i9graph
     * @description the graph data structure. A graph can be directed
     * underected of mixed. The default value is undirected.
     * If there exists at least one edge which is directed, the
     * graph is mixed. If all edges are directed, the graph is
     * directed.
     * @returns {object}
     * @private
     */
    i9graph.graph = function () {
        this.edgeStyle = "undirected";
        this.weightedEdges = false;
        this.mode      = "static";
        this.nodes = [];
        this.edges = [];
        this.adjList = [];  //adjacence : Nodes
        this.incList = [];  //incidence : Edges
        this.node_id_map = new Map();
        this.node_extern_ids = [];
        this.measure = {};          //measure min and max values

        this.setupNodeID = function(n_id){
            //remap the ids to linear intern ids
            if( this.node_id_map[ n_id ] === undefined ){
                this.node_id_map[ n_id ] = this.nodes.length;
                this.node_extern_ids.push(n_id);
                this.nodes.push( undefined );
                this.adjList.push( [] );
                this.incList.push( [] );
            }
            return this.node_id_map[ n_id ];
        }
        
        this.addNode = function(n) {    
            n.id = this.setupNodeID( n.id );
            if( this.nodes[ n.id ] !== undefined){
                //if nodes are labled with different lables,  show both
                var label_known = false;
                this.nodes[ n.id ].label.split('|').forEach((known_label)=>{
                    if(known_label === n.label){
                        label_known=true; return;
                    }
                });
                if(!label_known) this.nodes[ n.id ].label += "|" + n.label;   
            }else{
                this.nodes[n.id] = n;
                var resList = [];
                var adjI = this.adjList[n.id];
                for(var i in adjI){
                    if(typeof adjI[i] === 'number') this.adjList[ adjI[i] ].push( n );  // resolve adj indices
                    else                            resList.push( adjI[i] );
                }
                this.adjList[n.id] = resList;
            }
        };

        this.addEdge = function(e) {
            e.src = this.setupNodeID(e.src);
            e.dst = this.setupNodeID(e.dst);
            this.incList[ e.src ].push(e);
            if(e.src !== e.dst) this.incList[ e.dst ].push(e);
            if(this.nodes[ e.src ]===undefined) this.adjList[ e.src ].push( e.dst );            //adj-List that contains a Number has to be updated.
            else                                this.adjList[ e.dst ].push( this.nodes[ e.src ] );
            if(this.nodes[ e.dst ]===undefined) this.adjList[ e.dst ].push( e.src );            //adj-List that contains a Number has to be updated.
            else                                this.adjList[ e.src ].push( this.nodes[ e.dst ] );
            this.edges.push(e);
        }

        this.checkEdgeStyle = function () {
            var _this = this;
            var dE_ = false;
            var uE_ = false;
            _this.edges.forEach( function(e) {
                if (e.edgeStyle === 'directed') {
                    dE_ = true;
                } else if (e.edgeStyle === 'undirected') {
                    uE_ = true;
                } else {
                    e.edgeStyle = 'undirected';
                    uE_ = true;
                }
                if (e.isWeighted == true) {
                    _this.weightedEdges = true;
                }
            });
            // check edgeStyles
            if (dE_ == true && uE_ == false) {
                _this.edgeStyle = 'directed';
            }else if (dE_ == true && uE_ == true) {
                _this.edgeStyle = 'mixed';
            }else if (dE_ == false && uE_ == true) {
                _this.edgeStyle = 'undirected';
            }else {
                _this.edgeStyle = 'mixed';
            }
        }
    };

})(window.i9graph = window.i9graph || {} );