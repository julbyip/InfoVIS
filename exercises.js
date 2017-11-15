




//TODO: write a Verctor-math class for 2D vectors named V2.
//      a vector2 should be represented as Array with two entrys.
//  V2 should have the following properties and methods:
//      zero            -> the zero vector
//      create          -> parameters scalar x and y       returns new vector2 with values x and y
//      add,sub,mul and div  -> parameters vector2 a and b      returns addition,subdivision etc. of a and b
//      mulScalar       -> parameters vector2 a and scalar s    returns multiplication of a by scalar
//      length          -> parameter vector2 a                  retruns a's eucledian norm
//      dot             -> parameters vector2 a and b           returns dot product of a and b
//      normalize       -> parameter vector2 a                  returns a normalisation of a to unit length




// var V2 = {
// //TODO:: place implementation here::
//     zero: [0,0],
//     create: (x=0, y=0) => { return [x, y]; },

//     add: (a, b) => { return [a[0] + b[0], a[1] + b[1]]; },
//     sub: (a, b) => { return [a[0] - b[0], a[1] - b[1]]; },
//     mul: (a, b) => { return [a[0] * b[0], a[1] * b[1]]; },
//     div: (a, b) => { return [a[0] / b[0], a[1] / b[1]]; },

//     mulScalar: (a, s) => { return [a[0] * s, a[1] * s]; },
//     length: (a) => { return (Math.sqrt( a[0] * a[0] + a[1] * a[1] )); },
//     dot: (a, b) => { return [a[0] * b[0] + a[1] * b[1]]; },
//     normalize: (a) => { return [a[0] / V2.length(a), a[1] / V2.length(a)]; }
// };




// // simple Testcases for V2

// function testV2Equality(name,result,a,b){
//     var success = false;
//     var r;
//     if(typeof V2[name] === 'undefined'){
//         console.log('V2: missing property: '+name);
//         return;
//     }else if(typeof V2[name] == 'function'){
//         r = V2[name](a,b);
//         if(typeof result == 'number')  success = result == r;
//         else                           success = r[0] == result[0] && r[1] == result[1];
//     }else{
//         r = V2[name];
//         if(typeof result == 'number')  success = result == r;
//         else                           success = r[0] == result[0] && r[1] == result[1];
//     }
//     if(!success) console.log('V2: error:  '+name+'('+a+ (b!==undefined?(' and '+b):'') +')  expected '+result+'  but got  '+r);
//     else         console.log('V2: '+name+', success');
// }

// testV2Equality('zero',[0,0]);
// testV2Equality('add',[2,5],[1,2],[1,3]);
// testV2Equality('sub',[2,5],[3,8],[1,3]);
// testV2Equality('mul',[2,5],[1,2],[2,2.5]);
// testV2Equality('div',[2,5],[4,15],[2,3]);
// testV2Equality('mulScalar',[2,5],[1,2.5],2);
// testV2Equality('normalize',[1,0],[20,0]);
// testV2Equality('length',20,[20,0]);
// testV2Equality('dot',20,[5,2],[3,2.5]);






//TODO::  implement the function toRoman,
//        that takes a integer number and returns a string containing the number converted to Roman numerals
//      ie. 1 -> I
//          2 -> II
//          4 -> IV
//          627 -> DCXXVII  etc.
//        at least all numbers to 1000 should be valid.
//        you may however extend the range to 10000, by using the correct characters (--> wikipedia) (reminder: javascript is capable of utf-8 characters)




// function toRoman(n){
//     //TODO:: place implementation here
//     res = "";
//     while (Math.floor(n/1000) != 0)
//     {
//         res += "M";
//         n = Math.floor(n /= 1000);
//     }
//     console.log("n/1000 = ", n);
//     return res;
// }


// // Simple testcases for Roman Numbers
// console.log(toRoman(1100));

// for(var i = 0;i<10;++i){
    // var n = Math.floor( Math.random()*1000 );
//     console.log(n+": "+toRoman(n));
// }





//TODO::    implement the follwoing simple  Graph - classes (properties and methods in {})
//          Node {id,label}
//          Edge {src,dst}
//          Graph {nodes[],edges[],adjList[],incList[],addNode(Node),addEdge(Edge)}
//          The Node-id should equal the index of the Node in the Graph-nodes array
//          the adjList should be an array of arrays of Node - objects
//              adjList[ nodeX.id ]  should be the set of Nodes adjacent to nodeX
//          the incList should be an array of arrays of Edge - objects
//              incList[ nodeX.id ]  should be the set of Edges incident to nodeX
//          for now, you can assume, that all nodes are added, before the first edge.
//          (optional):  you can extend the classes, so that edges and nodes can be added in an arbitrary order.


var Node = function(id, label){
    this.id = id;
    this.label = label;
}

var Edge = function(src, dst){
    this.src = src;
    this.dst = dst;
}

var Graph = function(){
    //TODO
    this.nodes = [];
    this.edges = [];
    this.adjList = [];
    this.incList = [];
    var _this = this;
    this.addNode = function(node)
    {
        
    }
}




// // some minor testcases ...

// var graph = new Graph();

// if(graph.addNode !== undefined){
//     graph.addNode( new Node(1,'N1') );
//     graph.addNode( new Node(4,'N4') );
//     graph.addNode( new Node(3,'N3') );
//     graph.addNode( new Node(0,'N0') );
//     graph.addNode( new Node(2,'N2') );
// }
// if(graph.addEdge !== undefined){
//     graph.addEdge( new Edge(0,0) );
//     graph.addEdge( new Edge(1,0) );
//     graph.addEdge( new Edge(0,2) );
//     graph.addEdge( new Edge(2,3) );
//     graph.addEdge( new Edge(0,4) );
// }

// if(graph.nodes!== undefined){
//     for(var n in graph.nodes){
//         if(graph.nodes[n].id === undefined ){console.log('missing node property "id"'); break;}
//         if(n!=graph.nodes[n].id) console.log("id not matching index");
//     }

//     if( graph.adjList !== undefined){
//         if( graph.adjList[0].length != 5 ) console.log("Node 0 should have 5 entries in adjList");
//         else if( graph.adjList[1].length != 1 ) console.log("Node 1 should have 1 entry in adjList");
//         else if( graph.adjList[2].length != 2 ) console.log("Node 2 should have 2 entries in adjList");
//         else if( graph.adjList[3].length != 1 ) console.log("Node 3 should have 1 entry in adjList");
//         else if( graph.adjList[4].length != 1 ) console.log("Node 4 should have 1 entry in adjList");
    
//         else if( graph.incList[0].length != 5 ) console.log("Node 0 should have 5 entries in incList");
//         else if( graph.incList[1].length != 1 ) console.log("Node 1 should have 1 entry in incList");
//         else if( graph.incList[2].length != 2 ) console.log("Node 2 should have 2 entries in incList");
//         else if( graph.incList[3].length != 1 ) console.log("Node 3 should have 1 entry in incList");
//         else if( graph.incList[4].length != 1 ) console.log("Node 4 should have 1 entry in incList");
//         else    console.log("Graph Success.");
//     }else console.log("Graph not implemented");

// }else console.log("Graph not implemented");




