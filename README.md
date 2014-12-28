[![npm](http://img.shields.io/npm/v/node-verifier-schema.svg?style=flat-square)](https://www.npmjs.com/package/node-verifier-schema)
[![npm](http://img.shields.io/npm/l/node-verifier-schema.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema)
[![devDependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema#info=devDependencies)
[![Build Status](https://travis-ci.org/aliaksandr-pasynkau/node-verifier-schema.svg?branch=master&style=flat-square)](https://travis-ci.org/aliaksandr-pasynkau/node-verifier-schema)
[![Coverage Status](https://img.shields.io/coveralls/aliaksandr-pasynkau/node-verifier-schema.svg?style=flat-square)](https://coveralls.io/r/aliaksandr-pasynkau/node-verifier-schema?branch=master)

## Destination:
- validate nested in object (JSON) fields.
- compare schema with value.
- reuse api validations.

## Install
```shell
$ npm install node-verifier-schema --save
```
```js
var Schema = require('node-verifier-schema');
```

## Features
- Declarative approach for schema building.
- Several schema object build types.
- Built-in register for schemas. You can use schema aliases.
- Does not impose restrictions on a validator. You can use any framework (or its wrapper) that implements interface of schema.validator (this is easy).
- Correct nesting of schemas and fields.
- You may use shema constructor as function (returns Schema instance anyway).
- Support of async function call for value validation.
- Save your schema in YAML format and load by schema-loader.
- Errors without message - you can use for standard api results and multi-language api.

## Simple Usage
```js
var Schema = require('node-verifier-schema');

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
sc1.verifier().verify(value, function (err, isValid, validationError) {
    console.log(err); // null - js error
    console.log(isValid); // false - validation result
    console.log(validationError); // Schema.ValidationError { value: {}, rule: 'required', params: null, path: [ 'first_name' ] } - first error of validation
});

var value = { first_name: 'hello', last_name: 'world' }
sc1.verifier().verify(value, function (err, isValid, validationError) {
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
Schema.get('mySchema123123123', false); // no error, because flag 'strict' was specified as false
```

## Object Schema Building

#### Schema::like ( schema [, processor] )
**schema**: `Schema` - required.<br>
**processor**: `function(schema)` - optional.<br>
return: this field (schema)

recursive clone `schema` properties and fields.<br>
processor - for manual properties copying.
```js
var sh1 = new Schema('Hello').object(function () {
    this.field('hello');
    this.field('world');
});

var sh2 = new Schema('World').array(function () {
    this.field('some');
});
sh2.field('myField').like(sh1);
// equal
new Schema('World').array(function () {
   this.field('some');
   this.field('myField').object(function () {
       this.field('hello');
       this.field('world');
   });
});

var sh3 = new Schema('World').array(function () {
    this.field('some');
});
sh1.like(sh3);
new Schema('Hello').array(function () {
    this.field('hello');
    this.field('world');
    this.field('some');
});
```

#### Schema::validate( [ validation ] )
**validation**: `Mixed`.

This library has no own validator. You can use any lib for validation.<br>
All fields for schema can have many items of validation.
Method validate can be called many times, all items will be added into `validations` array; All `validation` join as array (not replaced).
If `validation` will be a array - this array concat with previous validations array.<br>
```js
var sh1 = new Schema().optional().validate('type object');

var verifier = sh1.verifier();
verifier.verify({}, function (err) {
    console.log(err); // null
});

var verifier = sh1.verifier();
verifier.verify(undefined, function (err) {
    console.log(err); // null
});

verifier.verify("123", function (err) {
    console.log(err instance Schema.ValidationError); // false
    console.log(err.rule); // 'type'
    console.log(err.params); // 'object'
    console.log(err.value); // '123'
    console.log(err.path); // []
});
```

#### Schema::object( nested )
**nested**: `Function`.<br>

You can build inner fields with a function. the build-function has two arguments (first - this.required, second - this.optional) for compact declaration of this schema field.<br>
You can call this method once, else throws an Error.
```js
var sh1 = new Schema().object(function (r, o) {
    r('my1');
    o('world1');
});

var sh4 = new Schema().object(function (r, o) {
    this.required('my2');
    this.optional('world2');
});

var sc1 = new Schema('hello2').like(sh4);
sc1.field('some1');
sc1.field('some2');

var sc2 = new Schema();
sc2.like(sc1); // add sh1

var sc3 = new Schema();
sc3.like(Schema.get('hello2')); // add sc1
sc1.field('inner').like(sh3);

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
**nested**: `Boolean|Function`.

If `nested` value will be `Function` - behaves as Schema::object. But this method adds the flag `isArray`=true to the schema.<br>
If `nested` value will be `Boolean` or not specified (Nullable) - adds (removes) flag of array to this schema.<br>
`isArray` flag says validator how value can be processed. By default (isArray = false) value must be object. If isArray = true - value must be array. If isArray is not compatible with value type - you get ValidationError('type', 'array', value) or ValidationError('type', 'object', value) in dependence of `isArray`.<br>
if `isArray` = true and nested fields were specified validator will process all value items as specified nested fields, if any item will be invalid - the validator error will be returned.
```js
var sch1 = Schema();

sch1.like(sh1).array();
// eq
sch1.like(sh1).array(true);
// eq
sch1.like(sh1).array();

// remove flag
sch1.array(false);
```
If you use simple array (without fields) in schema and you want to validate each item of value - you should create the validation for value.

#### Schema::clone()
create absolute clone of this schema
```js
var sc1 = new Schema().object(function () {
    this.field('first_name');
    this.required('last_name');
    this.optional('middle_name');
});
var sc2 = sc1.clone();
_.isEqual(sc1, sc2); // true
```

#### SchemaVerifier::verifier([, options])
**options**: `Object` - optional<br>
**options.ignoreExcess**: `Boolean` - optional - default `false`

returns instance of SchemaVerifier
```js
var sch = new Schema().array().required();

var verifier = sch.verifier(); // create schema validator. can throws error if rules is invalid
verifier.verify({}, function (err) {
    if (err instance of Schema.ValidationError) {
        // invalid state
    }

    if (err) {
        // has an error
    }

    // valid state
});

```

#### SchemaVerifier::verify( value, callback )
**value**: `Mixed`.<br>
**callback**: `Function`.

Runtime validation of value. Compare with schema and inner validations.<br>
This method must have fast process speed. This method is called synchronously, but it's not a problem if any validation function has async call. Async validation call is supported out of the box. (you have a callback as a second argument).<br>
Options object has a `validator` function, by default this function is not specified.<br>

**validations**: `Array` - array of validations.<br>

```js
sh1.verify(value, function (err) {
    if (err instance of Schema.ValidationError) {
        // invalid state
    }

    if (err) {
        // has an error
    }

    // valid state
});
```
**err**: `Error|Schema.ValidationError|null` js error.

#### Schema::field( name )
**name**: `String` - required - name of inside field.

Create required field (Alias Schema::required)
```js
var sc1 = new Schema();
sc1.field('name');
// eq
sc1.object(function (required, optional) {
    required('name);
});
// eq
sc1.object(function (required, optional) {
    this.field('name);
});
```

#### Schema::required( [ name, [ validate ] ] )
**name**: `String` - optional.<br>
**validate**: `Mixed` - optional.<br>

Create required field.<br>
If called without arguments - add required flag<br>
`isRequired` - flag for validation, if this flag is true then validated value must not be `undefined` - returned Schema.ValidationError('required', true)
```js
var sc1 = Schema();
sc1.field('some');
// eq
sc1.required('some');
```

#### Schema::optional( [ name, [ validate ] ] )
**name**: `String` - optional.<br>
**validate**: `Mixed` - optional.<br>

Create optional field.<br>
If called without arguments - removes required flag.
```js
var sc1 = Schema();
sc1.field('some').optional();
// eq
sc1.optional('some');
```

## Schema File Loader
Load your schema from YAML (or JS) file.

### Use
```js
var Schema = require('node-verifier-schema');
var schemaLoader = require('node-verifier-schema/load');

var schema1 = schemaLoader('path/to/file.tml');

// load schema and register as 'nameForThisSchema'
schemaLoader('path/to/file.tml', 'nameForThisSchema');
var schema2 = Schema.get('nameForThisSchema');
```
Function schemaLoader has two params:<br>
schemaLoader(absFilePath [, name]).<br>
absFilePath: `String` - absolute path to file that needs to be loaded. Must have js, yaml or yml file extension as default.<br>
name: `String` - optional - name to register this schema in Schema.register.<br>

### YAML full syntax:
schema declaration must start with `schema`, and you can add `[]` to mark this schema as array type, and `?` as optional<br>
inside fields should not be named as `=`, has `[]` and `?` flags as in schema declaration<br>
attribute name `=` means validation<br>
validation must be array, inside validation items you may specify value as you want (inside array, hash, string and so on)
```yaml
---
schema: # required attribute of schema declaration, if this is array - add '[]', if optional - add '?' on key end
    =: # this symbol for declaration of validations of this schema-element
        - type object
    fio: # inside field 'fio' declaration
        =:
            - type object
    age:
        =:
            - type number
            - max_value 100
            - min_value 16
    family[]: # this is array field 'family' with objects
        =:
            - type array
            - min_length 2
            - each:
                - type object ## inside of validation
        first_name:
            =:
                - type string
                - min_length 3
                - max_length 20
        last_name:
            =:
                - type string
                - min_length 3
                - max_length 20
        middle_name?:
            =:
                - type string
                - min_length 3
                - max_length 20
        age?: # this is optional field
            =: [ 'type number', 'max_value 100', 'min_value 16' ]
    education[]:
        =:
            - type array
            - min_length 2
            - not empty
            - each:
                - type string
                - min_length 3
                - max_length 20
        name:
            =:
                - type string
        type:
            =:
                - type string
        classes[]?: # this optional array field 'classes'
```

### YAML short syntax:
if your schema of field has no nested fields - you can specify validation items as array without validation attribute '='
```yaml
---
schema:
    =:
        - type object
    fio:
        - type object
    age:
        - type number
        - max_value 100
        - min_value 16
    family[]:
        =:
            - type array
            - min_length 2
            - each:
                - type object
        first_name:
            - type string
            - min_length 3
            - max_length 20
        last_name:
            - type string
            - min_length 3
            - max_length 20
        middle_name?:
            - type string
            - min_length 3
            - max_length 20
        age?: [ 'type number', 'max_value 100', 'min_value 16' ]
    education[]:
        =:
            - type array
            - min_length 2
            - not empty
            - each:
                - type string
                - min_length 3
                - max_length 20
        name:
            - type string
        type:
            - type string
        classes[]?:
```

#### Previous YAML examples equal next js code
```js
// js equivalent
var schema = new Schema().validate('type object').object(function (r, o) {
	r('fio', 'type object', function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
	});
	r('age', ['type number', 'max_value 100', 'min_value 16']);
	r('family', ['type array', 'min_length 2', {each: ['type object']}]).array(function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		o('age', ['type number', 'max_value 100', 'min_value 16']);
	});
	r('education', ['type array', 'min_length 2', 'not empty', {each: ['type string', 'min_length 3', 'max_length 20']}]).array(function (r, o) {
		r('name', 'type string');
		r('type', 'type string');
		o('classes').array();
	});
})
```

### Schema.ValidationError(rule [, params[, index]])
For rule you should use a valid case name.

For example:<br>
**wrong**:<br>
rule='excess_field'  with rule = $fileName ($fieldName - field, that was excess)<br>
**good**:<br>
rule='available_fields' with params=['first_name', 'last_name'...] <br>
you should put available fields in this case.

This approach creates one way to process validation errors. <br>
And in future you will not have problems with extension of your API and schema.<br>
And this formulation (in positive) get more information for API user
(in this example you get all available values of field names and can modify them correctly next time).

This system of validation errors has no end message - for multi-language support.
You can create simple function for mapping ValidationError to user-friendly message (with current user language).
```js
var messages = {
    // rule -> template
    required: function (validationError, options) {
        return 'field must be required';
    },
    available_fields: function (validationError, options) {
        return 'field must include only this values [' + validationError.params.join(',') + '], "' + validationError.value + '" given';
    }
};
```

### Schema.ValidationError(rule [, params[, index]])
**rule**: `String` - required - rule name that failed.<br>
**params**: `Mixed` - optional - all parameters to help user understand where mistake is .<br>
**index**: `Null|Number` - optional - failed item's index.<br>

Schema.ValidationError extends Error.<br>
Destination: for custom validations.<br>
```js
Schema.ValidationError('required');
// eq
new Schema.ValidationError('required', null, null);
```
after verification all errors have next properties:<br>
**error.rule** - name of rule. for example: `'type'`<br>
**error.params** - params of rule. for example: `'object'`<br>
**error.path** - json path of failed value. for example: `['hello']['world']['0']['foo']['3']['bar']`<br>
**error.value** - failed value. for example `3`<br>

### System predefined errors:
1. Schema.ValidationError('type', 'array', `value`, `path`). <br>
    returned if `schema.isArray` was not compatible with value type (`isArray` = true, but value is not Array). <br>
    { rule: 'type', params: 'array', value: `value`, path: `path` }.

2. Schema.ValidationError('type', 'object', `value`, null, `path`). <br>
    returned if `schema.isArray` was not compatible with value type (`isArray` = false, but value is not Object). <br>
    { rule: 'type', params: 'array', value: `value`, path: `path` }. <br>

3. Schema.ValidationError('available_fields', `fields`, `value`, null, `path`). <br>
    returned if value object has field, that not specified in schema. <br>
    { rule: 'available_fields', params: `fields`, value: `value`, path: `path` }. <br>
    You can ignore this error, if set `options.ignoreExcess`=true.

4. Schema.ValidationError('required', true, `value`, null, `path`). <br>
    returned if value object is undefined and flag `schema.isRequired`=true. <br>
    { rule: 'required', params: true, value: `value`, path: `path` }.

path - json selector - address to current mistake value  (Array).
