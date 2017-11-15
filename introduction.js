//'use strict';








// Declaration:

a = 0;
a2 = 23;
var a2 = 3.14;
var a3;
var a4 = undefined;
var a5 = null;          // null !== undefined


var b;







// Basic Types:

// Number 
// 64bit double precision floats
// no integer

var n = 0;
var n2 = 3.1415;
var n3 = 123e5;
var n4 = 0xFF;
var n5 = Math.PI;
var n6 = Number.MAX_SAFE_INTEGER;
var n7 = Infinity;
var n8 = NaN;


// Boolean

var t = true;
var f = false;



// String

var s  = 'hello';
var s2 = "hello";

var s3 = 'say: "Hello World!"';
var s4 = "say: \"Hello World!\"";

var s5 = "It's alright";


b = s5.length;
b = s5.indexOf('alright');
b = s5.slice(0,4);








// Array

var A  = [];            //<- prefer this
var A2 = new Array();

var A3 = ['hello', 0, 3.1415, A, []];
var A4 = new Array(200).fill(0);


A3[0] += ' world';
A2[10] = 0;

A.push(42);
b = A3.pop();







// Object

var O = {};             //<- prefer this
var O2 = new Object();

var O3 = {
    x:20,
    y:42,
    name:'blub'
};

O3.name += 'blab';

O3.size = 23;


O3['name'] += 'blib';
O3[0] = '0';









// function

function add(a,b) {
    return a + b;
}

var add2 = function(a,b) { return a + b; }      
var add3 = (a,b) => { return a + b; }           //lambda



b = add (0,1);
b = add2(1,1);
b = add3(1,2);

b = add (0);                // b = undefined,   number + undefined = NaN
b = add (1,2,3,4,5);        // additional arguments possible, but are ignored  (--> arguments Array)



function add4(a=0,b=0){ return a+b; }     // default argument (! not supported in some Browsers)



// operators
// + - * / % ++ --    (**)
// = += -= *= /= %=

// comparison Operators
// == === != !== > < >= <=  ?:

// Logical Operators
// && || !

// Type Operators
// typeof instanceof

// Bitwise Operators
// & | ~ ^ << >> >>>            //performed on 32bit integer




// control structures

// if(){}else{}
// switch(){ case: break; default: break; }

// while(){}
// do{}while()
// for(;;){}




b = '1' + 1 ;           //'11'
b = 1 + '1' ;           //'11'

b = 1 + 1 + '1';        //'21'  !!
b = '1' + 1 + 1;        //'111' !!

b = "100" / 10;         //10
b = "10" - "5";         //5
b = "10" + "5";         //'105' !!


b = 10 / "foo";         //NaN   
b = 1 / 0;              //Infinity







b = typeof "";                      //'string'

b = typeof 42;                      //'number'
b = typeof NaN;                     //'number'
b = typeof Infinity;                //'number'

b = typeof true;                    //'boolean'

b = typeof {};                      //'object'
b = typeof [];                      //'object'        !!
b = typeof null;                    //'object'        !!

b = typeof new Number();            //'object'      !!
b = typeof new String();            //'object'      !!
b = typeof new Boolean();           //'object'      !!      --> avoid these 


var c;
A = [];

b = typeof undefined;               //'undefined'
b = typeof c;                       //'undefined'
b = typeof A[42];                   //'undefined'

b = typeof function myfunc (){ };   //'function'
b = typeof (()=>{});                //'function'





// ==       same value
// ===      same value && same type

b = null == undefined;      //true
b = null === undefined;     //false

b =            "John"  ==             "John" ;  //true
b =            "John"  ==  new String("John");  //true      --> same value
b = new String("John") ==  new String("John");  //false     --> different objects (even though same value)

b =            "John"  ===            "John" ;  //true      
b =            "John"  === new String("John");  //false    !--> different type
b = new String("John") === new String("John");  //false     --> different objects

b = 0 == '';
b = 0 === '';

b = 1 == true;
b = 1 === true;







// call by reference  /  call by value

b = 0;
function increment_value(i){ i++; }
increment_value( b );                 // does not work (call by value)


b = {value: 0 };
function increment_object( i ){ i . value ++; }
increment_object( b );                // does work (call by reference)
b = b.value;






// Iterating

A = new Array(4).fill(0);

for(var i=0; i<A.length; i++){
    A[i]++;
}

for(var i in A){        
    A[i]++;
}

A.forEach( function(e){                   // ! again call by value
    e++;
});

A.forEach( function(e,i){  
    A[i]++;
});














// Methods

b = {
    value : 0
,   inc : function(){
        this.value ++;
    }
};

b.inc();
b['inc']();

b.dec = ()=>{ this.value--; }
b.dec();








// 'Classes'  and  prototypes

var B = function(){
    this.value = 0;
    this.size = 42;
};


b = new B();


B.prototype.name = 'foo';
B.prototype.increment = function(){
    this.value++;
}

b.increment();

var c = new B();

b.name = 'john';










// Debugger example for recursive functions

function fib(n){
    if(n==1 || n==2){
        return 1;
    }else{
        var a = fib(n-1);
        var b = fib(n-2);
        return a+b;
    }
}

b = fib(4);
console.log('Fib  4: ' + b );

//b = fib(42);
//console.log('Fib 42: ' + b );











// Variable validity

var i = 1;
{ 
    var i = 2;
    console.log(i);
}
console.log(i);



function func(){
    var i = 3;
    console.log(i);
}
func();

console.log(i);










// Another example


var A = [];
for(var i =0;i<10; ++i){

    A[i] = function() { console.log('Value '+i); };

}
for(var f in A){
    A[f]();
} 






var A = [];
for(var i =0;i<10; ++i){
    (function(i){                   //wrapped in an immediately invoked function
        
        A[i] = function() { console.log('Value '+i); };

    })(i);
}
for(var f in A){
    A[f]();
} 









// Hoisting

(function(){

    console.log( varA );

    varA = 1;

    console.log( funcA );
    funcA();
    console.log( funcB );

    var varA = 2;

    function funcA(){
        console.log( varA );
    }
    var funcB = function(){
        console.log( varA );
    }

    console.log( funcB );
    funcB();

})();















// Namespaces:

// Option 1: nested objects

var namespace1 = namespace1 || {};



namespace1.funcA = function(){};
namespace1.varA  = 42;



namespace1.subspace1 = namespace1.subspace1 || {};


namespace1.subspace1.varB = "hello";





// Namespaces with private variables:

// Option 2:  IIFEs (Immediatly-invoked Function Expressions)


(function( namespace2 , undefined ){        
    var privateVarA = 0;

    namespace2.publicVarB = 2;

    function privateFunc(){
        privateVarA++;
    };

    namespace2.publicFunc = function(){
        privateFunc();
    }

})( this.namespace2 = this.namespace2 || {} );









