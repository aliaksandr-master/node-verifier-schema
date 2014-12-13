[![npm](http://img.shields.io/npm/v/node-verifier-schema.svg?style=flat-square)](https://www.npmjs.com/package/node-verifier-schema)
[![npm](http://img.shields.io/npm/l/node-verifier-schema.svg?style=flat-square)](http://opensource.org/licenses/MIT)
[![Dependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema)
[![devDependency Status](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema/dev-status.svg?style=flat-square)](https://david-dm.org/aliaksandr-pasynkau/node-verifier-schema#info=devDependencies)

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
- Several types for build of schema object.
- Built-in register for schemas. You can use schema aliases.
- Does not impose restriction on validator. You can use any framework (or its wrapper), that implement interface of schema.validator (this is easy).
- Correct nesting of schemas and fields.
- You may use shema constructor as function (returned Schema instance anyway).
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
Schema.get('mySchema123123123', false); // no error, because flag 'strict' was specified as false
```

## Object Schema Building

#### Schema::attachTo ( schema, name )
**schema**: `Schema|String` - required.

name: `Schema` - required - name of field for attach to object.<br>
Attach schema object to 'parent' schema as field `name`.<br>
Do not forget make clone if you use this schema for several fields at the same time!
```js
var sh1 = new Schema('Hello').object(function () {
    this.field('hello');
    this.field('world');
});
var sh2 = new Schema('World').array(function () {
    this.field('some');
});

sh2.attachTo(sh1, 'myField'); // attach schema
// Equal
sh2.clone().attachTo('Hello', 'myField'); // attach clone of schema

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
**validation**: `Mixed`.

This library has no own validator. You can use any lib for validation.<br>
All fields for schema can have many items of validation. Method validate can be called many times, all items will be added into `validations` array; All `validation` join as array (not replaced). If `validation` will be a array - this array concat with previous validations array.<br>
If you use the function type of validation - this function must have two required arguments (first - `Mixed` - value to validate, second - `function(err)`  - callback function for returning the result of validation. first argument `err` - must be specified as Schema.ValidationError({string} ruleName [, {*}ruleParams]) or instance of Error).<br>
By use experience we can say next. For usability validations should have type String / Object / Boolean / Number / Array. Not Function, because if you use function for validation in schema declaration - you cant save this schema in file, grows the difficulty of detect errors in this validation from outside.<br>
Better Use the abstract `validator` in `verify` method for convert params into validation function.
```js
var sh1 = new Schema();
sh1.optional();
sh1.validate(function (value, done) { // declaration of validation by function
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
var sh2 = sh1.clone().validate([validate]); // declaration of validation by array (into nested array for concat arrays first)

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
**nested**: `Schema|Function|String`.<br>

If `nested` is instance of `Schema` or `String` - all inside fields of this schema became own parent schema (by cloning).<br>
If `nested` is `Function` - You can build inner fields bu function. That build-function has two arguments (first - this.required, second - this.optional) for compact declaration of this schema field.<br>
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
**nested**: `Boolean|Function|String|Schema`.

If `nested` value will be `Function` or `String` or `Schema` - behavior as Schema::object. But this method add the flag `isArray` to the schema.<br>
If `nested` value will be `Boolean` or not specified (Nullable) - add (remove) flag of array to this schema.<br>
`isArray` flag say validator how value can be processed. By default (isArray = false) value must be object. If isArray = true - value must be array. If isArray will not compatible with value type - you will have ValidationError('type', 'array', value) or ValidationError('type', 'object', value) in dependence of `isArray`.<br>
if `isArray` = true and nested fields was specified, then validator will be process all value items as specified nested fields, if any item will be invalid - will be returned the validation error.
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
If you use in schema simple array (without fields) and you want to validate each item of value - you should create the validation for value. For example
```js
var sch1 = new Schema().array().validate(function(value, done){
    var itemIndex;
    var isValid = _.all(value, function (item, index) {
        // some validation, for example: type = string
        itemIndex = index;
        return _.isString(item);
    });

    if (!isValid) {
        done(Schema.ValidationError('type', 'string', itemIndex));
        return;
    }

    done();
});

sch1.verify(["1" ,"2" ,"3", 4], function (err, isValid, validationError) {
    console.log(err); // null
    console.log(isValid); // false
    console.log(validationError); // Schema.ValidationResultError => { ruleName: 'type', ruleParams: 'string', arrayItemIndex: 3, value: ["1" ,"2" ,"3", 4] }
});
```

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

#### Schema::verify( value, [options,] callback )
**value**: `Mixed`.<br>
**options**: `Object` - optional.<br>
**callback**: `Function`.

Runtime validation of value. compare with schema and inner validations.<br>
This method must have fast process speed. This method is called synchronously, but if any validation function has async call - not a problem. Async validation call support from the box. (you have a callback in second argument).<br>
Options object has a `validator` function, by default this function not specified.<br>

**options.validator(validations [, options])** - function, that prepare specified validations. must return `function(value, doneCallback)` or array of functions.<br>
**options**: `Object` - options.<br>
**validations**: `Array` - array of validations.<br>
see: `Schema::validation`

```js
sh1.verify(value, function (err, isValid, validationError) {
    // some code
});
```
**err**: `Error` js error.<br>
**isValid**: `Boolean` result of validation.<br>
**validationError**: `Null|Schema.ValidationResultError` - information error

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
If called without arguments - remove required flag.
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
absFilePath: `String` - absolute path of file that need to load. Must have js, yaml or yml file extension as default.<br>
name: `String` - optional - name for register this schema in Schema.register.<br>

### YAML full syntax:
schema declaration must start from `schema`, and you can add `[]` for mark this schema as array type, and `?` as optional<br>
inside fields should not named as `=`, has `[]` and `?` flags as in schema declaration<br>
attribute name `=` means validation<br>
validation must be array, inside items of validations you may specify value as you want (inside array, hash, string and so on)
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

## Errors
all errors has three arguments:<br>
**ruleName**: `String` - required - rule name that was failed.<br>
**ruleParams**: `Mixed` - any parameters for help user understand where mistake.<br>
**arrayItemIndex**: `Null|Number` - item's index, that caused an error.

For ruleName you should use a valid case name.

For example:<br>
**wrong**:<br>
ruleName='excess_field'  with ruleName = $fileName ($fieldName - field, that was excess)<br>
**good**:<br>
ruleName='available_fields' with ruleParams=['first_name', 'last_name'...] <br>
you should put available fields for this case.

This approach create one way for process validation errors. <br>
And in future you will not have problems with extends your API and schema.<br>
And this formulation (in positive) get more information for API user
(in this example you get all available values of field names and can modify correctly in next try).

This system of validation errors has no end message - for multi-language support.
You can create simple function for mapping ValidationResultError to user-friendly message (with current user language).
```js
var messages = {
    // ruleName -> template
    required: function (validationError, options) {
        return 'field must be required';
    },
    available_fields: function (validationError, options) {
        return 'field must include only this values [' + validationError.ruleParams.join(',') + '], "' + validationError.value + '" given';
    }
};
```

### Schema.ValidationError(ruleName [, ruleParams[, arrayItemIndex]])
**ruleName**: `String` - required - rule name that was failed.<br>
**ruleParams**: `Mixed` - optional - any parameters for help user understand where mistake.<br>
**arrayItemIndex**: `Null|Number` - optional - item's index, that caused an error.<br>

Schema.ValidationError extends Error.<br>
Destination: for custom validations.<br>
If you return instance of `Schema.ValidationError` - in result of validation you get the `Schema.ValidationResultError` instance with same fields. All `Schema.ValidationError` convert to `Schema.ValidationResultError`.
```js
Schema.ValidationError('required', true);
// eq
new Schema.ValidationError('required', true, null);
```

### Schema.ValidationResultError(ruleName, ruleParams, value[, arrayItemIndex])
**ruleName**: `String` - required - rule name that was failed.<br>
**ruleParams**: `Mixed|Null` - required - any parameters for help user understand where mistake.<br>
**value**: `Mixed` - value that caused an error.<br>
**arrayItemIndex**: `Null|Number` - optional - item's index that caused an error.

Schema.ValidationResultError extends Schema.ValidationError.
```js
new Schema.ValidationResultError('required', true, value, null);
```

### System predefined errors:
1. Schema.ValidationResultError('type', 'array', `value`). <br>
    returned if `schema.isArray` was not compatible with value type (`isArray` = true, but value is not Array). <br>
    { ruleName: 'type', ruleParams: 'array', value: `value`, arrayItemIndex: null }.

2. Schema.ValidationResultError('type', 'object', `value`). <br>
    returned if `schema.isArray` was not compatible with value type (`isArray` = false, but value is not Object). <br>
    { ruleName: 'type', ruleParams: 'array', value: `value`, arrayItemIndex: null }. <br>

3. Schema.ValidationResultError('available_fields', _.keys(schema.fields), `value`, null). <br>
    returned if value object has field, that not specified in schema. <br>
    { ruleName: 'available_fields', ruleParams: _.keys(schema.fields), value: `value`, arrayItemIndex: null }. <br>
    You can ignore this error, if set `options.ignoreExcess`=true.

4. Schema.ValidationResultError('required', true, `value`, null). <br>
    returned if value object is undefined and flag `schema.isRequired`=true. <br>
    { ruleName: 'required', ruleParams: true, value: `value`, arrayItemIndex: null }.

arrayItemIndex - specified if this object in array and value is item of array.

