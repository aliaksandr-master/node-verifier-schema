node-verifier-schema
====================

## Simple Usage

```js
var Schema = require('node-verifier-schema').Schema;

// Create schema
var sc1 = Schema().build(function (required, optional) {
    required('first_name');
    required('last_name');
    optional('middle_name');
});
// Eq
var sc1 = Schema().build(function () {
    this.required('first_name');
    this.required('last_name');
    this.optional('middle_name');
});
// Eq
var sc1 = Schema();
    sc1.required('first_name')
    sc1.required('last_name')
    sc1.optional('middle_name');

// Validation
var value = {};
sc1.verify(value, function (err, isValid, validationError) {
    console.log(err); // null - js error
    console.log(isValid); // false - validation result
    console.log(validationError); // Schema.ValidationError { value: {}, ruleName: 'required', ruleParams: null, path: [ 'first_name' ] } - first error of validation
})

var value = { first_name: 'hello', last_name: 'world' }
sc1.verify(value, function (err, isValid, validationError) {
    console.log(err); // null
    console.log(isValid); // true
    console.log(validationError); // null
})


```

