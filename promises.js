// Key Insight 1: Chaining events to a promise does not chain them to each other.

// When you code a function returning a promise, make sure to always return a promise.

// var promise = new Promise(function(resolve, reject) {
//     setTimeout(function() {
//         resolve('hello world');
//     }, 2000);
// });

// promise.then(function(data) {
//     console.log(data + ' 1');
// });

// promise.then(function(data) {
//     setTimeout(function() {
//         console.log('yolo');
//     }, 2000);
// });

// promise.then(function(data) {
//     console.log(data + ' 3');
// });


// Key insight 2: Calling functions in the promise chain DOES make them wait.

// After job1 is resolved, we return job2 (which is a promise)

// Line 1: We call job1 and we store the returned promise in a variable called promise.
var promise = job1();

promise

// Line 5: We call then on this promise and we attach a callback for when the promise is resolved
.then(function(data1) {
	// Line 6: We print data1 and it is obvioulsy result of job 1 (see line 22)
    console.log('data1', data1);
    // Line 7: On this line, we call job2 and we return the resulting promise. Keep that in mind and go to line 10.
    return job2();
})
// By chaining our 2 promises (job1 then job2), 
// job2 is always executed after job1. 
// Line 6 is executed when the job1 promise is resolved, 
// line 11 is executed when the job2 promise is resolved.
.then(function(data2) {
    console.log('data2', data2);
    return 'Hello world';
})

.then(function(data3) {
    console.log('data3', data3);
})
.then(function(data4) {
	console.log("should be undefined ",data4);
});

function job1() {
    return new Promise(function(resolve, reject) {
        setTimeout(function() {
            resolve('result of job 1');
        }, 2000);
    });
}

// function job2() {
//     return new Promise(function(resolve, reject) {
//         setTimeout(function() {
//             resolve('result of job 2');
//         }, 1000);
//     });
// }

// Key Insight 3: This code returns the first promise, not the result of the .then
var t1 = ""
var t2 = ""

function test1() {
	// job1 a promise that returns 'result of job 1'
    var promise = job1();
    // No one can interact with this promise
    var data1;
    promise.then(function(data) {
        console.log(data + " no one can interact with me");
        data1 = data;
        return data + " no one can interact with me";
    });

    return promise;
}

// You should write this instead:

function test2() {
	// returns a promise 
    return job1().then(function(data) {
        // console.log(data + ' play with me ');
        return data + ' play with me '
    });
}

// EACH .then gets the original data.
test1()
	.then(function(data) {console.log(data + ' here I am')});

// Here, the .then is chained to the result of the .then inside test2. 
// This is because we returned the .then promise, not the original promise
test2()
	.then(function(data) {console.log(data + ' ... ok! ')});
// var t2 = test2().then(console.log('good stuff'));
// // console.log(t1,'\n',t2);

// // Key insight 4: Catches

// // Example 1
// let promise = request();

// promise.then(function(data) {
//     console.log(data);
// }, function(error) {
//     console.error(error);
// });


// The difference is in the promise returned by the then function. 
// In the second example, you are not calling catch on the original promise, 
// you call catch on the promise returned by then. 
// If a then has no error callback provided, 
// it will not stop on a rejected promise. BUT IT DOESNT RUN THE CODE EITHER So the promise will end in the catch.

// Example 2
// let promise = request();

// promise

// .then(function(data) {
//     console.log(data);
// })

// .catch(function(error) {
//     console.error(data);
// });


// THE Key Insight 5: $$$$ How to go from promises to async / await:

// Here is some async await code:
// function job() {
//     return new Promise(function(resolve, reject) {
//         setTimeout(resolve, 500, 'Hello world 1');
//     });
// }

// async function test() {
//     let message = await job();
//     console.log(message);

//     return 'Hello world 2';
// }

// test().then(function(message) {
//     console.log(message);
// });

// // Here is that some code in promise land (see Key Insight 3)
// function test1() {
//     return job().then(function(message) {
//         console.log(message);

//         return 'Hello world 2';
//     });
// }

// test1().then(function(data) {console.log(data, " promise version")});

// Key Insight 6: How to sequential use async await:

// You can use the await keyword even if the result is not a promise.

// This works. BUT, what happens if there is an async call within this.
// SO what if set timeout calls set timeout

// Promise syntax, ignore this function
// function later(delay, value) {
//     return new Promise(resolve => setTimeout(resolve, delay, value));
// }
// const a = async function () {
// 	//return 'hello world 1'
// 	console.log('in a')
//     return 'hiii';
// }
// const b = async function () {
// 	//return 'hello world 2'
//     return new Promise(function(resolve, reject) {
//         setTimeout(a, 2000, console.log('Hello world 2'));
//     });
// }
// // C doesn't return a promise so doesn't await
// async function c () {
// 	return new Promise(function(resolve, reject) {
//     	setTimeout(b, 3000, console.log('c'));
//     });
// }


// async function c1 () {
//     return new Promise(function(resolve, reject) {
//         setTimeout(resolve, 2000, console.log('cello word 4'));
//     });
// }

// async function main() {
//     // let message1 = await a(),
//     //     message2 = await b()

//     let message2 = "temp"
//     message2 = await c()

//     // console.log(message1);
//     await console.log(message2);

// }

// main();

// how to test what happens when the promise chain includes
