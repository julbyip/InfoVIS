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
     * @namespace PriorityQueue
     * @memberof i9graph
     * @description Implements a priority queue based on a binary heap.
     * @private
     */
    i9graph.PriorityQueue = function() {
        var heap = [];
        /**
         * @function clear
         * @memberof i9graph.PriorityQueue
         * @description removes all elements from the queue
         * @public
         */
        var clear = function() { heap = []; }
        /**
         * @function size
         * @memberof i9graph.PriorityQueue
         * @description returns the number of elements in the queue
         * @returns {number} number of elements in the queue
         * @public
         */
        var size = function () { return heap.length; }
        /**
         * @function empty
         * @memberof i9graph.PriorityQueue
         * @description returns true if the queue is empty
         * @returns {boolean}
         * @public
         */
        var empty = function() { return (heap.length == 0); }
        /**
         * @function peek
         * @memberof i9graph.PriorityQueue
         * @description returns the largest element in the queue
         * @returns {object} the largest element in the queue
         * @public
         */
        var peek = function () { return heap[0]; }
        /**
         * @function insert
         * @memberof i9graph.PriorityQueue
         * @description insert an element in the queue and keeps the binary heap balanced.
         * This method assumes the object ele has the property key.
         * The object passed to the method has the following structure:<br>
         *  <tt>
         *  var ele = { node: node_val, key: key_val, pos: position };
         *  </tt>
         * @param {object} ele element to be inserted in the queue. It assumes the property <tt>key<tt>
         * @returns {number} position in the heap array.
         * @public
         */
        var insert = function ( ele ) {
            var n = heap.length;
            if (n == 0) {
                // init
                heap.push(ele);
                heap[0].pos = 0;
                return 0;
            } else {
                // upheap (float or swim an element in the heap)
                var k = n;
                var k2 = Math.floor((k-1)/2);
                while (heap[k2].key < ele.key) {
                    heap[k] = heap[k2];
                    heap[k].pos = k;
                    k = k2;
                    k2 = Math.floor((k-1)/2);
                    if (k == 0)
                        break;
                }
                heap[k] = ele;
                heap[k].pos = k;
                return k;
            }
        };

        /**
         * @function decrease
         * @memberof i9graph.PriorityQueue
         * @description Decreses the key of an element in the binary heap and rebalances the heap.
         * The object passed to the method has the following structure:<br>
         *  <tt>
         *  var ele = { node: node_val, key: key_val, pos: position };
         *  </tt>
         *
         * @param {object} ele Element to be decreased
         * @param {number} n_key Value of decreased key
         * @returns {number} position in the heap array
         * @public
         */
        var decrease = function(ele, n_key) {
            // if object found update binary heap
            var n = heap.length;
            var n2 = Math.floor(n/2);
            var k = ele.pos;
            while (k < n2) {
                var j = 2*k + 1; // left child
                if (j < (n-1) && (heap[j].key < heap[j+1].key)) {
                    // right child is greater
                    j = j+1;
                }
                if (n_key >= heap[j].key) {
                    break; // no more greater elements
                }
                // reorder heap
                heap[k] = heap[j];
                heap[k].pos = k;
                // update indices
                k = j;
            }
            heap[k] = ele;
            heap[k].key = n_key;
            heap[k].pos = k;
            return k;
        };
        /**
         * @function remove
         * @memberof i9graph.PriorityQueue
         * @description removes and return the largest element in the queue.
         * This methods reorder the queue and keeps the binary heap balanced.
         * @returns {object} the largest element in the queue.
         * @public
         */
        var remove = function() {
            // init
            var n = heap.length;
            var maxVal = heap[0];
            heap[0] = heap[n-1];
            
            // heap down (sink an element in the heap)
            var n2 = Math.floor(n/2);
            var k = 0;
            var ele = heap[k];
            while (k < n2) {
                var j = 2*k + 1; // left child
                if (j < (n-1) && (heap[j].key < heap[j+1].key)) {
                    // right child is greater
                    j = j+1;
                }
                if (ele.key >= heap[j].key) {
                    break; // no more greater elements
                }
                // reorder heap
                heap[k] = heap[j];
                heap[k].pos = k;
                // update indices
                k = j;
            }
            
            heap[k] = ele;
            heap[k].pos = k;
            heap.pop();
            
            return maxVal;
        };
        /**
         * @function testHeap
         * @memberof i9graph.PriorityQueue
         * @description This method check if the heap array satisfies the binary heap condition.
         * @public
         */
        var testHeap = function() {
            var n = heap.length;
            var n2 = Math.floor(n/2);
            for (var i = 0; i <= n2; i++) {
                for (var j = 1; j < 3; j++) {
                    var k = 2*i + j;
                    if (k < n && heap[k].key > heap[i].key) {
                        alert("wrong value at i " + i);
                    }
                }
            }
        }
        return {
            clear: clear,
            size: size,
            empty: empty,
            peek: peek,
            insert: insert,
            decrease: decrease,
            remove: remove,
            testHeap: testHeap
        };
    };

    
    
    
    


})(window.i9graph = window.i9graph || {} );