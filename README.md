## Destination:
1. validate nested fields.
2. compare schema with value

## Install
```shell
$ npm install node-verifier-schema --save
```
```js
var Schema = require('node-verifier-schema');
```

## Features
1. Several types of object schema build
2. Built-in register for schemas
3. Does not impose validator. You can use any framework (wrappers), that implement validator interfaces
4. Correct nesting of schemas
5. Easy to test
6. Simple class implementation
7. one dependencies is lodash
8. You may use Shema constructor as function (returned Schema instance anyway)
9. Chain calls
10. Async validation support (node like)

## Simple Usage

```js
var Schema = require('node-verifier-schema').Schema;

// Create schema
var sc1 = Schema().object(function (required, optional) {
    field('first_name');
    required('last_name');
    optional('middle_name');
});
// Eq
var sc1 = Schema().object(function () {
    this.required('first_name');
    this.field('last_name');
    this.optional('middle_name');
});
// Eq
var sc1 = Schema().object(function () {
    this.field('first_name');
    this.field('last_name');
    this.field('middle_name').optional();
});
// Eq
var sc1 = Schema();
    sc1.required('first_name')
    sc1.field('last_name')
    sc1.optional('middle_name');

// Validation
var value = {};
sc1.verify(value, function (err, isValid, validationError) {
    console.log(err); // null - js error
    console.log(isValid); // false - validation result
    console.log(validationError); // Schema.ValidationError { value: {}, ruleName: 'required', ruleParams: null, path: [ 'first_name' ] } - first error of validation
});

var value = { first_name: 'hello', last_name: 'world' }
sc1.verify(value, function (err, isValid, validationError) {
    console.log(err); // null
    console.log(isValid); // true
    console.log(validationError); // null
});

```

