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

Attach clone of schema object to 'parent' schema as field `name`

```js
var sh1 = new Schema('Hello').object(function () {
    this.field('hello');
    this.field('world');
});
var sh2 = new Schema('World').array(function () {
    this.field('some');
});

sh2.attachTo(sh1, 'myField'); // attach clone of sh2
// Equal
sh2.attachTo('Hello', 'myField'); // attach clone of sh2

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

sh1.verify(undefined, function (err, isValid, validationError) {
    // ... some code
});

// example with custom validation mapper (validator)
sh2 = sh1.clone();
sh2.validate([1, 2, 3]);
var value = 123;

var myValidator = function (validationArray) {
    var newArrayOfValidations = _.map(validationArray, function (validation) {
        return ;
    });
    return [function (value, done) {
       async.reduce(validationArray, null, function (_1, validation, done) {
            if (_.isFunction(validation)) {
                validation(value, done);
                return;
            }
            if (_.isArray(validation)) {
                if (_.contains(validation, value)) {
                    done();
                    return;
                }

                done(Schema.ValidationError('contains', validation));
            }
            done(new Error('invalid type of validation rule'));
       }, done);
    }];
};

sh2.verify(value, { validator: myValidator }, function (err, isValid, validationError) {
    // ... some code
});
```

#### Schema::object( nested )
nested: `Schema|Function|String`

If `nested` is instance of `Schema` or `String` - all inside fields became own schema (cloning).
If you call this method call several times - you give an Error.
```js
var sc1 = Schema('hello');
sc1.field('some1');
sc1.field('some2');

var sc2 = Schema();
sc1.object(sh1); // add sh1
sc1.object(sh4); // error

var sc3 = Schema();
sc3.object('hello'); // add sc1
```

If `nested` is `Function` - You can build inner fields bu function
```js

var sc1 = Schema();
sc1.object(function (req, opt) {
    req('someRequiredField1', 'someValidation');
    opt('someOptionalField2', 'someValidation')
    this.required('someRequiredField3');
    this.optional('someOptionalField4').object(sc2);
    this.field('someRequiredField5').object(function (req, opt) {
        // ...
    });
});

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
```js
sh1.verify(value, function (err, isValid, validationError) {
});
```
err: `Error` js error
isValid: `Boolean` result of validation
validationError: `Null|Schema.ValidationResultError` object of


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

