/**
 * @fileOverview Module i9graph implements measures for
 * centrality and modularity in graphs and visualization methods.
 * @author Roberto Grosso
 * @author Jonas Müller
 * @version 1.0
 */

/** @namespace */
(function (i9graph, undefined) {
    'use strict';


    /**
     * @namespace graphFileParser
     * @memberof i9graph
     * @description Read and parse graph files
     * The following file formats are supported
     *   - gml
     *   - GraphML
     *   - gexf
     * @private
     */
    var graphFileParser = {};
    i9graph.appendFile = false;

    /**
     * @function xmlToJson
     * @memberof i9graph
     * @description Parse a xml text and create a JSON-object
     * @param xml the xml text
     * @returns {object}
     * Convert xml to JSON
     */
    var xmlToJson = function (xml) {
        var obj = {};
        if (xml.nodeType == 1) {
            if (xml.attributes.length > 0) {
                obj["@attributes"] = {};
                for (var j = 0; j < xml.attributes.length; j++) {
                    var attribute = xml.attributes.item(j);
                    obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
                }
            }
        } else if (xml.nodeType == 3) {
            obj = xml.nodeValue;
        }
        if (xml.hasChildNodes()) {
            for (var i = 0; i < xml.childNodes.length; i++) {
                var item = xml.childNodes.item(i);
                var nodeName = item.nodeName;
                if (typeof (obj[nodeName]) == "undefined") {
                    obj[nodeName] = xmlToJson(item);
                } else {
                    if (typeof (obj[nodeName].push) == "undefined") {
                        var old = obj[nodeName];
                        obj[nodeName] = [];
                        obj[nodeName].push(old);
                    }
                    obj[nodeName].push(xmlToJson(item));
                }
            }
        }
        return obj;
    };
    /**
     * @function gexf
     * @memberof i9graph.graphFileParser
     * @param {string[]} content text from input file
     * @return {object} graph instance
     * @description Parse GEXF file format for graphs and returns a graph object.
     * @private
     */
    graphFileParser.gexf = function (content) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(content, "text/xml");
        var x = xmlDoc.documentElement;
        //var nodes = x.getElementsByTagName("node");
        var jsonObj = xmlToJson(x);
        var nodes = jsonObj.graph.nodes.node;
        var edges = jsonObj.graph.edges.edge;
        // the graph

        var g = i9graph.appendFile ? i9graph.i9g : new i9graph.graph;
        if (jsonObj.graph.hasOwnProperty("@attributes")) {
            if (jsonObj.graph["@attributes"].hasOwnProperty('defaultedgetype')) {
                g.edgeStyle = jsonObj.graph["@attributes"].defaultedgetype;
            } else {
                // default is undirected
                g.edgeStyle = 'undirected';
            }
            if (jsonObj.graph["@attributes"].hasOwnProperty('mode')) {
                g.mode = jsonObj.graph["@attributes"].mode;
            } else {
                // default is static
                g.mode = 'static';
            }
            if (jsonObj.graph["@attributes"].hasOwnProperty('timeformat')) {
                g.timeformat = jsonObj.graph["@attributes"].timeformat;
            } else {
                // default is double, which corresponds to a discrete dynamic graph
                g.timeformat = 'double'; //
            }
            if (jsonObj.graph["@attributes"].hasOwnProperty('start')) {
                g.start = parseFloat(jsonObj.graph["@attributes"].start);
            } else {
                // default is double, which corresponds to a discrete dynamic graph
                g.start = Number.NEGATIVE_INFINITY; //
            }
            if (jsonObj.graph["@attributes"].hasOwnProperty('end')) {
                g.end = parseFloat(jsonObj.graph["@attributes"].end);
            } else {
                // default is double, which corresponds to a discrete dynamic graph
                g.end = Number.POSITIVE_INFINITY; //
            }
        }


        var edgeStyle = g.edgeStyle;
        // node ids might start at any position
        // use a map to map start id to 0
        var nodeMap = new Map();
        var pos = 0;
        nodes.forEach(function (n) {
            var nid = parseInt(n["@attributes"].id);
            nodeMap.set(nid, pos)
            var label = n["@attributes"].label;
            var gnode = new i9graph.node(pos, label);
            // for dynamic graphs
            if (g.mode == 'dynamic') {
                gnode.activity = [];
                if (n.hasOwnProperty('spells')) {
                    if (Object.prototype.toString.call(n.spells.spell) !== '[object Array]') {
                        var start = g.start;
                        var end = g.end;
                        if (n.spells.spell['@attributes'].hasOwnProperty('start')) {
                            start = parseFloat(n.spells.spell['@attributes'].start);
                        }
                        if (n.spells.spell['@attributes'].hasOwnProperty('end')) {
                            end = parseFloat(n.spells.spell['@attributes'].end);
                        }
                        gnode.activity.push({start:start,end:end});
                    }
                    else {
                        n.spells.spell.forEach(function (s) {
                            var start = g.start;
                            var end = g.end;
                            if (s['@attributes'].hasOwnProperty('start')) {
                                start = parseFloat(s['@attributes'].start);
                            }
                            if (s['@attributes'].hasOwnProperty('end')) {
                                end = parseFloat(s['@attributes'].end);
                            }
                            gnode.activity.push({start:start,end:end});
                        });
                    }
                } else {
                    // node has no spells, it should have attributes start and end
                    var start = g.start;
                    var end = g.end;
                    if (n['@attributes'].hasOwnProperty('start')) {
                        start = parseFloat(n['@attributes'].start);
                    }
                    if (n['@attributes'].hasOwnProperty('end')) {
                        end = parseFloat(n['@attributes'].end);
                    }
                    gnode.activity.push({start:start,end:end});
                }

            }
            g.addNode(gnode);
            // next node pos
            pos++;
        });
        edges.forEach(function (e) {
            var eid = parseInt(e["@attributes"].id);
            var src = nodeMap.get(parseInt(e["@attributes"].source));
            var dst = nodeMap.get(parseInt(e["@attributes"].target));
            var weight = 1.0;
            var isWeighted = false;
            if (e["@attributes"].hasOwnProperty('weight')) {
                weight = parseFloat(e["@attributes"].weight);
                isWeighted = true;
            }
            var gedge = new i9graph.edge(src, dst, weight);
            if (e["@attributes"].hasOwnProperty('type')) {
                gedge.edgeStyle = e["@attributes"].type;
            } else {
                gedge.edgeStyle = edgeStyle;
            }
            gedge.isWeighted = isWeighted;

            // dynamics graphs
            if (g.mode == 'dynamic') {
                gedge.activity = [];
                if (e.hasOwnProperty('spells')) {
                    if (Object.prototype.toString.call(e.spells.spell) !== '[object Array]') {
                        var start = g.start;
                        var end = g.end;
                        if (e.spells.spell['@attributes'].hasOwnProperty('start')) {
                            start = parseFloat(e.spells.spell['@attributes'].start);
                        }
                        if (e.spells.spell['@attributes'].hasOwnProperty('end')) {
                            end = parseFloat(e.spells.spell['@attributes'].end);
                        }
                        gedge.activity.push({start:start,end:end});
                    }
                    else {
                        e.spells.spell.forEach(function (s) {
                            var start = g.start;
                            var end = g.end;
                            if (s['@attributes'].hasOwnProperty('start')) {
                                start = parseFloat(s['@attributes'].start);
                            }
                            if (s['@attributes'].hasOwnProperty('end')) {
                                end = parseFloat(s['@attributes'].end);
                            }
                            gedge.activity.push({start:start,end:end});
                        });
                    }
                } else {
                    // node has no spells, it should have attributes start and end
                    var start = g.start;
                    var end = g.end;
                    if (e['@attributes'].hasOwnProperty('start')) {
                        start = parseFloat(e['@attributes'].start);
                    }
                    if (e['@attributes'].hasOwnProperty('end')) {
                        end = parseFloat(e['@attributes'].end);
                    }
                    gedge.activity.push({start:start,end:end});
                }
            }
            g.addEdge(gedge);
        });

        // find adequat start and end position
        if(g.start == Number.NEGATIVE_INFINITY){
            var second = Number.POSITIVE_INFINITY;
            g.nodes.forEach(function(n){
                n.activity.forEach(function(a){
                    if(a.start != Number.NEGATIVE_INFINITY) second = Math.min(second,a.start);
                });
            });
            g.nodes.forEach(function(n){
                n.activity.forEach(function(a){
                    if(a.start == Number.NEGATIVE_INFINITY) a.start = second;
                });
            });
            g.start = second;
        }
        if(g.end == Number.POSITIVE_INFINITY){
           var second = Number.NEGATIVE_INFINITY;
            g.nodes.forEach(function(n){
                n.activity.forEach(function(a){
                    if(a.end != Number.POSITIVE_INFINITY) second = Math.max(second,a.end);
                });
            });
            g.nodes.forEach(function(n){
                n.activity.forEach(function(a){
                    if(a.end == Number.POSITIVE_INFINITY) a.end = second;
                });
            });
            g.end = second;
        }

        console.log(g.start+" -> "+g.end);



        // done!
        return g;
    };

    /**
     * @function GraphML
     * @memberof i9graph.graphFileParser
     * @param {string[]} content array of strings containing the content of graph file
     * @returns {object} graph object
     * @description Parse file in GraphML format.
     */
    graphFileParser.GraphML = function (content) {
        var parser = new DOMParser();
        var xmlDoc = parser.parseFromString(content, "text/xml");
        var x = xmlDoc.documentElement;
        //var nodes = x.getElementsByTagName("node");
        var jsonObj = xmlToJson(x);
        var nodesObj = jsonObj.graph.node;
        var edgesObj = jsonObj.graph.edge;
        var edgeStyle = 'undirected';
        // construct graph
        //var g = new i9graph.graph;
        var g = i9graph.appendFile ? i9graph.i9g : new i9graph.graph;

        if (jsonObj.graph.hasOwnProperty("@attributes") && jsonObj.graph["@attributes"].hasOwnProperty("edgedefault")) {
            g.edgeStyle = jsonObj.graph["@attributes"]["edgedefault"];
            edgeStyle = g.edgeStyle;
        }
        // read node and edge attributes
        var n_attrmap = {};
        var e_attrmap = {};
        jsonObj.key.forEach(function (k) {
            if (k["@attributes"].for === "node") {
                var key = k["@attributes"]["id"];
                var na = k["@attributes"]["attr.name"];
                var ty = k["@attributes"]["attr.type"];
                var attr = { name: na, type: ty };
                n_attrmap[key] = attr;
            }
            else if (k["@attributes"].for === "edge") {
                var key = k["@attributes"]["id"];
                var na = k["@attributes"]["attr.name"];
                var ty = k["@attributes"]["attr.type"];
                var attr = { name: na, type: ty };
                e_attrmap[key] = attr;
            }

        });
        // save all nodes in objecst with all attributes
        var pos = 0;
        var nmap = new Map();
        nodesObj.forEach(function (n) {
            var nid = n["@attributes"].id;
            var gnode = new i9graph.node(pos, "");
            // set data values, if any
            var nkeys = [];
            if (n.hasOwnProperty("data")) {
                // check if it has only one data entry or an array of them
                if (Object.prototype.toString.call(n["data"]) === '[object Array]') {
                    n["data"].forEach(function (a) {
                        var key = a["@attributes"]["key"];
                        var name = n_attrmap[key].name;
                        var type = n_attrmap[key].type;
                        var val = a["#text"];
                        if (type == 'int' || type == 'long') {
                            val = parseInt(val);
                        } else if (type == 'float' || type == 'double') {
                            val = parseFloat(val)
                        }
                        gnode[name] = val;
                        nkeys.push(key);
                    });
                    // use first key to define default label
                    gnode.label = gnode[nkeys[0]];
                }
                else {
                    var key = n["data"]["@attributes"]["key"];
                    var val = n["data"]["#text"];
                    var name = n_attrmap[key].name;
                    var type = n_attrmap[key].type;
                    if (type == 'int' || type == 'long') {
                        val = parseInt(val);
                    } else if (type == 'float' || type == 'double') {
                        val = parseFloat(val)
                    }
                    gnode[name] = val;
                    gnode.label = val;
                }
            }
            g.addNode(gnode);
            nmap.set(nid, gnode);
            pos++;
        });
        pos = 0;
        edgesObj.forEach(function (e) {
            var src = e["@attributes"].source;
            var dst = e["@attributes"].target;
            var nsrc = nmap.get(src).id;
            var ndst = nmap.get(dst).id;
            var edgkeys = [];
            var gedge = new i9graph.edge(nsrc, ndst, "");
            if (e["@attributes"].hasOwnProperty("directed")) {
                var flag = e["@attributes"].directed;
                if (flag === 'true') {
                    gedge.edgeStyle = 'directed';
                } else {
                    gedge.edgeStyle = edgeStyle;
                }
            }
            if (e.hasOwnProperty("data")) {
                // check if it has only one property or an array of them
                if (Object.prototype.toString.call(e["data"]) === '[object Array]') {
                    e["data"].forEach(function (a) {
                        var key = a["@attributes"].key;
                        var val = a["#text"];
                        var name = e_attrmap[key].name;
                        var type = e_attrmap[key].type;
                        if (type == 'int' || type == 'long') {
                            val = parseInt(val);
                        } else if (type == 'float' || type == 'double') {
                            val = parseFloat(val)
                        }
                        // if name == weight, set edge weith
                        if (name === 'weight') {
                            gedge.isWeighted = true;
                            gedge.weight = val;
                        } else {
                            gedge[name] = val;
                            edgkeys.push(key);
                        }
                    });
                }
                else {
                    var key = e["data"]["@attributes"].key;
                    var val = e["data"]["#text"];
                    var name = e_attrmap[key].name;
                    var type = e_attrmap[key].type;
                    if (type == 'int' || type == 'long') {
                        val = parseInt(val);
                    } else if (type == 'float' || type == 'double') {
                        val = parseFloat(val)
                    }
                    if (name === 'weight') {
                        gedge.isWeighted = true;
                        gedge.weight = val;
                    } else {
                        gedge[name] = val;
                        gedge.val = val;
                    }
                }
            }
            g.addEdge(gedge);
        });

        return g;
    };

    /**
     * @function gml
     * @memberof i9graph.graphFileParser
     * @param {string[]} content array of strings containing the content of graph file
     * @returns {object} graph object
     * @description Parse a gml file.
     */
    graphFileParser.gml = function (content) {
        var arrcontent = content.split('\n');
        //var g = new i9graph.graph;
        var g = i9graph.appendFile ? i9graph.i9g : new i9graph.graph;

        var edgeStyle = 'undirected';
        var edg_list = [];
        var i = 0;
        while (i < arrcontent.length) {
            //var line = arrcontent[i].replace(/\s/g, '');
            var line = arrcontent[i];
            var sh = 1;
            if (line.trim().search("directed") == 0) {
                if (line.search('1') > -1) {
                    g.edgeStyle = 'directed';
                    edgeStyle = 'directed';
                }
            }
            if (line.trim().search("node") == 0) {
                var n_id = -1;
                var n_la;
                var flag = 0;
                while (flag != 2) {
                    if (arrcontent[i + sh].trim().search("id") == 0) {
                        n_id = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''), 10);
                        flag++;
                    } else if (arrcontent[i + sh].search("label") > -1) {
                        n_la = arrcontent[i + sh].replace(/"/g, '').replace(/\blabel\b/g, '').trim();
                        flag++;
                    } else if (arrcontent[i + sh].trim().search("node") == 0 || arrcontent[i + sh].trim().search("edge") == 0) {
                        // there are no lable, use node id
                        n_la = n_id.toString();
                        break;
                    }
                    sh++;
                }
                g.addNode(new i9graph.node(n_id, n_la));
            }
            else if (line.trim().search("edge") == 0) {
                var e_sr;
                var e_dt;
                var e_vl = 1;
                var flag = true;
                var isWeighted = false;
                while (flag == true) {
                    if (arrcontent[i + sh].trim().search("source") == 0) {
                        e_sr = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''));
                    } else if (arrcontent[i + sh].trim().search("target") == 0) {
                        e_dt = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''));
                    } else if (arrcontent[i + sh].trim().search("value") == 0) {
                        e_vl = parseFloat(arrcontent[i + sh].replace(/^\D+/g, ''));
                        isWeighted = true;
                    } else if (arrcontent[i + sh].trim().search("edge") == 0) {
                        flag = false;
                        break;
                    }
                    sh++;
                    if ((i + sh) >= arrcontent.length) {
                        break;
                    }
                }
                var edg_ = new i9graph.edge(e_sr, e_dt, e_vl);
                edg_.edgeStyle = edgeStyle;
                edg_.isWeighted = isWeighted;
                g.addEdge(edg_);
            }
            i = i + sh;
        }

        // check if node index start at 1
        if (typeof g.nodes[0] === typeof undefined) {
            g.nodes.forEach(function (n, i) {
                g.nodes[i - 1] = g.nodes[i];
                g.nodes[i - 1].id = i - 1;
            });
            g.edges.forEach(function (e) {
                e.src = e.src - 1;
                e.dst = e.dst - 1;
            });
        }

        return g;
    }

    /**
     * @function gml
     * @memberof i9graph.graphFileParser
     * @param {string[]} content array of strings containing the content of graph file
     * @returns {object} graph object
     * @description Parse a gml file.
     */
    graphFileParser.ldjson = function (content) {
        var g = i9graph.appendFile ? i9graph.i9g : new i9graph.graph;

        var T = [];

        content.split('\n').forEach(function (line) {
            if (line.length < 1) return;
            //console.log(line);
            var o = JSON.parse(line);// , (key, value) => {

            var tweet = {
                id: o.id,
                text: o.text,
                reply_to: o.in_reply_to_status_id,
                user_reply_to: o.in_reply_to_user_id,
                user_reply_to_name: o.in_reply_to_screen_name,
                user_id: o.user.id,
                user_name: o.user.screen_name
            };
            T.push(tweet);
        });

        //var map = new Map();
        /*T.forEach((t)=>{
            if(t.user_reply_to!=null && t.user_reply_to!=t.user_id){
                if(map[t.user_reply_to]===undefined) map[t.user_reply_to] = 0;
                map[t.user_reply_to]++;
                if(map[t.user_id]===undefined) map[t.user_id] = 0;
                map[t.user_id]++;
            }
        });*/
        //var min_conv = 0;

        T.forEach((t) => {
            if (t.user_reply_to != null) {///*&& t.user_reply_to!=t.user_id */&& (map[t.user_id]>min_conv || map[t.user_reply_to]>min_conv)){
                g.addNode(new i9graph.node(t.user_id, t.user_name));
                g.addNode(new i9graph.node(t.user_reply_to, t.user_reply_to_name));
            }
        });

        T.forEach((t) => {
            if (t.user_reply_to != null) {  ///*&& t.user_reply_to!=t.user_id */&& (map[t.user_id]>min_conv || map[t.user_reply_to]>min_conv)){
                g.addEdge(new i9graph.edge(t.user_id, t.user_reply_to, 1, t.text));
            }
        });

        return g;
    }






    /**
     * @function i9g
     * @memberof i9graph.graphFileParser
     * @param {string[]} content array of strings containing the content of graph file
     * @returns {object} graph object
     * @description Parse a i9g file.
     */
    graphFileParser.i9g = function (content) {
        var arrcontent = content.split('\n');
        //var g = new i9graph.graph;
        var g = i9graph.appendFile ? i9graph.i9g : new i9graph.graph;
        var edgeStyle = 'undirected';
        var minEdgeBetweenness = Number.MAX_VALUE;
        var maxEdgeBetweenness = 0;
        var edg_list = [];
        var i = 0;
        while (i < arrcontent.length) {
            //var line = arrcontent[i].replace(/\s/g, '');
            var line = arrcontent[i];
            var sh = 1;
            if (line.trim().search("directed") == 0) {
                if (line.search('1') > -1) {
                    g.edgeStyle = 'directed';
                    edgeStyle = 'directed';
                }
            }
            if (line.trim().search("node") == 0) {
                var n_id = -1;
                var n_la;
                var flag = 0;
                while (flag != 2) {
                    if (arrcontent[i + sh].trim().search("id") == 0) {
                        n_id = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''), 10);
                        flag++;
                    } else if (arrcontent[i + sh].search("label") > -1) {
                        n_la = arrcontent[i + sh].replace(/"/g, '').replace(/\blabel\b/g, '').trim();
                        flag++;
                    } else if (arrcontent[i + sh].trim().search("node") == 0 || arrcontent[i + sh].trim().search("edge") == 0) {
                        // there are no lable, use node id
                        n_la = n_id.toString();
                        break;
                    }
                    sh++;
                }
                g.addNode(new i9graph.node(n_id, n_la));
            }
            else if (line.trim().search("edge") == 0) {
                var e_sr;
                var e_dt;
                var e_vl = 1;
                var e_it = -1;
                var e_mo = [];
                var flag = true;
                var isWeighted = false;
                while (flag == true) {
                    if (arrcontent[i + sh].trim().search("source") == 0) {
                        e_sr = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''));
                    } else if (arrcontent[i + sh].trim().search("target") == 0) {
                        e_dt = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''));
                    } else if (arrcontent[i + sh].trim().search("value") == 0) {
                        e_vl = parseFloat(arrcontent[i + sh].replace(/^\D+/g, ''));
                        isWeighted = true;
                    } else if (arrcontent[i + sh].trim().search('iteration') == 0) {
                        e_it = parseInt(arrcontent[i + sh].replace(/^\D+/g, ''));
                    } else if (arrcontent[i + sh].trim().search('modularity') == 0) {
                        var str_ = arrcontent[i + sh];
                        var temp = str_.substring(str_.indexOf('[') + 1, str_.indexOf(']')).split(/(?:,| )+/);
                        temp.forEach(function (s) { e_mo.push(parseInt(s)) });
                    } else if (arrcontent[i + sh].trim().search("edge") == 0) {
                        flag = false;
                        break;
                    }
                    sh++;
                    if ((i + sh) >= arrcontent.length) {
                        break;
                    }
                }
                var edg_ = new i9graph.edge(e_sr, e_dt, e_vl);
                edg_.edgeStyle = edgeStyle;
                edg_.isWeighted = isWeighted;
                if (e_it > -1) {
                    i9graph.edge.prototype.iteration = -1;
                    i9graph.edge.prototype.modularity = [];
                    edg_.iteration = e_it;
                    edg_.modularity = e_mo;
                }
                g.addEdge(edg_);
                var min_ = Math.min.apply(null, e_mo);
                var max_ = Math.max.apply(null, e_mo);
                if (minEdgeBetweenness > min_) minEdgeBetweenness = min_;
                if (maxEdgeBetweenness < max_) maxEdgeBetweenness = max_;
            }
            i = i + sh;
        }

        // check if node index start at 1
        if (typeof g.nodes[0] === typeof undefined) {
            g.nodes.forEach(function (n, i) {
                g.nodes[i - 1] = g.nodes[i];
                g.nodes[i - 1].id = i - 1;
            });
            g.edges.forEach(function (e) {
                e.src = e.src - 1;
                e.dst = e.dst - 1;
            });
        }
        // check consistency of modularity and iterations
        var maxIters = -1;
        g.edges.forEach(function (e) {
            if (maxIters < e.iteration) {
                maxIters = e.iteration;
            }
        });
        var modularityClasses = g.edges[0].modularity.length;
        g.edges.forEach(function (e) {
            if (e.modularity.length !== modularityClasses) {
                alert('edge modularity has wrong size');
            }
        });

        g.edgeMaxIteration = maxIters;
        g.edgeModularityClasses = modularityClasses;
        g.minEdgeBetweenness = minEdgeBetweenness;
        g.maxEdgeBetweenness = maxEdgeBetweenness;
        return g;
    }







    /**
     * @function readFiles
     * @memberof i9graph
     * @param {object} e input file objects
     * @description reads multiple text files in one of the
     * following format:
     *  - gml: portable Graph File format
     *  - graphml: GraphML - Graph Markup Language
     *  - GEXF: Graph Exchange XML Format, supports dynamic networks
     */
    i9graph.readFiles = function (e) {
        if (e.target.files.length == 0) return;

     //   console.log(e.target.files.length);

        for (var f = 0; f < e.target.files.length; ++f) {
            var file = e.target.files[f];
            var filename = file.name.toLowerCase();
            var filetype = "";
            console.log((i9graph.appendFile?'append':'open')+' file `'+file.name+'`');
            if (!file) { continue; }
            else if (/\.gml$/.test(filename)) { filetype = "gml"; }
            else if (/\.graphml/.test(filename)) { filetype = "GraphML"; }
            else if (/\.gexf/.test(filename)) { filetype = "gexf"; }
            else if (/\.i9g/.test(filename)) { filetype = "i9g"; }
            else if (/\.ldjson/.test(filename)) { filetype = "ldjson"; }
            else {
                alert('"'+file.name+'" cannot be loaded. Please select a gml/graphml/gexf/i9g file.');
                continue;
            }
            i9graph.addFileName( file.name.split("/").pop() );
            var reader = new FileReader();
            reader.onload = function (e) {
                var contents = e.target.result;
                i9graph.i9g = graphFileParser[filetype](contents);
                // check for consistent edge styles in graph and set graph's flag
                i9graph.i9g.checkEdgeStyle();
                i9graph.setGraph(i9graph.i9g);
            };
            reader.readAsText(file);
            //i9graph.appendFile = true;
        }
    };




})(window.i9graph = window.i9graph || {} );