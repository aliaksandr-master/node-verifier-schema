[![Dependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema.svg?style=flat)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema)
[![devDependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema/dev-status.svg?style=flat)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema#info=devDependencies)

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

## Create Schema
```js
var sh1 = new Schema();
var sh2 = Schema();

var sh3 = new Schema('nameForRegister1');
var sh4 = Schema('nameForRegister2');
```

## Schema registration
```js
var sc1 = new Schema();

// register
var sc2 = Schema('mySchema1'); // new Schema and register as "mySchema1"
var sc3 = new Schema('mySchema2'); // new Schema and register as "mySchema2"
Schema.register('mySchema', sc1); // return sc1
Schema.register('mySchema', sc1); // throw Error (schema "mySceham" was already registered)

// get registered
Schema.get('mySchema'); // return sc1
Schema.get('mySchema1'); // return sc2
Schema.get('mySchema2'); // return sc3
Schema.get('mySchema123123123'); // throw Error (schema "mySchema123123123" was not registered)
```

## Object Schema Building

#### Schema::attachTo ( schema, name )
schema: `Schema|String` - required
name: `Schema` - required

Attach schema object to 'parent' schema as field `name`, do not forget about clone !

```js
var sh1 = new Schema('Hello').object(function () {
    this.field('hello');
    this.field('world');
});
var sh2 = new Schema('World').array(function () {
    this.field('some');
});

sh2.clone().attachTo(sh1, 'myField'); // attach clone
// Equal
sh2.clone().attachTo('Hello', 'myField'); // attach clone

// result equal:
var sh1 = new Schema('Hello').object(function () {
    this.field('hello');
    this.field('world');
    this.field('myField').array(function () {
        this.field('some');
    });
});

```

#### Schema::validate( [ validation ] )
validation: `Mixed`

You may use any validations and map this in method verify.
As default (without map) you should use function (value, doneCallback).
All `validation` join as array (not replaced).
If `validation` will be a array - this array concat with previous validations array
Option `validator` in `verify` prepare the rules.

```js
var sh1 = new Schema();
sh1.optional();
sh1.validate(function (value, done) {
    if (_.isString(value)) {
        done();
        return;
    }
    done(new Schema.ValidationError('type', 'string'));
});

sh1.verify(value, { validator: myValidator }, function (err, isValid, validationError) {
    console.log(err); // null
    console.log(isValida); // true
    console.log(validationError); // null
});

// example with custom validation mapper (validator)
var validate = [1, 2, 3];
var sh2 = sh1.clone().validate([validate]);

var myValidator = function (validationArray) {
    return function (value, done) {
        async.reduce(validationArray, null, function (_1, validation, done) {
            if (_.isFunction(validation)) {
                validation(value, done);
                return;
            }

            if (_.isArray(validation)) {
                if (_.contains(validation, value)) {
                    console.log(validation, value);
                    done();
                    return;
                }

                done(Schema.ValidationError('contains', validation));
            }
            done(new Error('invalid type of validation rule'));
        }, done);
    };
};

var value = "123";
sh2.verify(value, { validator: myValidator }, function (err2, isValid, validationError) {
    console.log(err); // null
    console.log(isValida); // false
    console.log(validationError); // [object Object]
    console.log(validationError.ruleName); // 'contains'
    console.log(validationError.ruleParams); // [1, 2, 3]
    console.log(validationError.value); // '123'
});
```

#### Schema::object( nested )
nested: `Schema|Function|String`

If `nested` is instance of `Schema` or `String` - all inside fields became own schema (cloning).
If `nested` is `Function` - You can build inner fields bu function
If you call this method call several times - you give an Error.
```js
var sh1 = new Schema().object(function (r, o) {
    r('my1');
    o('world1');
});

var sh4 = new Schema().object(function (r, o) {
    this.required('my2');
    this.optional('world2');
});

var sc1 = new Schema('hello2').object(sh4);
sc1.field('some1');
sc1.field('some2');

var sc2 = new Schema();
sc2.object(sc1); // add sh1

var sc3 = new Schema();
sc3.object('hello2'); // add sc1
sc3.attachTo(sh1, 'inner');

var testSc = new Schema().object(function (r, o) {
    r('my1');
    o('world1');
    r('inner').object(function (r, o) {
        r('my2');
        o('world2');
        r('some1');
        r('some2');
    });
});

_.isEqual(testSc, sh1); // true
```

#### Schema::array( [ nested ] )
nested: `Boolean|Function|String|Schema`

If `nested` is `Function` or `String` or `Schema` - behavior as Schema::object

If `nested` is `Boolean` or not specified - add (or remove) flag of array to this schema
```js
var sch1 = Schema();

sch1.object(sh1).array();
// eq
sch1.object(sh1).array(true);
// eq
sch1.array(sh1);

// remove flag
sch1.array(false);
```

validation of each item you should create by Schema::validate(validation)
```js
var sch1 = Schema();
sch1.array().validate(function(value, done){

});
sch1.verify()
```

#### Schema::field( name )
name: `String` - name of inside field

#### Schema::clone()
create absolute clone of schema

#### Schema::verify( value, [options,] callback )
value: `Mixed`
options: `Object` - optional
callback: `Function`

Runtime validation of value. compare with schema and inner validations

*options.validator(validations, options)* - function, that prepare specified validations. must return `function(value, doneCallback)` or array of functions
options: `Object` - options
validations: `Array` - array of validations

```js
sh1.verify(value, function (err, isValid, validationError) {
    // some code
});
```
err: `Error` js error
isValid: `Boolean` result of validation
validationError: `Null|Schema.ValidationResultError` object of
see "schema::validate".


#### Schema::required( [ name, [ validate ] ] )
name: `String` - optional
validate: `Mixed` - optional

Create required field
If called without arguments - add required flag
```js
var sc1 = Schema();
sc1.field('some');
// eq
sc1.required('some');
```

#### Schema::optional( [ name, [ validate ] ] )
name: `String` - optional
validate: `Mixed` - optional

Create optional field
If called without arguments - remove required flag
```js
var sc1 = Schema();
sc1.field('some').optional();
// eq
sc1.optional('some');
```

