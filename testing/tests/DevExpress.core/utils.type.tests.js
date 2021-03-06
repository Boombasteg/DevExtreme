"use strict";

var $ = require("jquery"),
    typeUtils = require("core/utils/type");

QUnit.module('Type checking');

QUnit.test('type method', function(assert) {
    var element = $("#qunit-fixture").html('"<div id="widget"></div>"');

    assert.strictEqual(typeUtils.type(0), 'number', 'number');
    assert.strictEqual(typeUtils.type(null), 'null', 'null');
    assert.strictEqual(typeUtils.type(undefined), 'undefined', 'undefined');
    assert.strictEqual(typeUtils.type(new Date()), 'date', 'date');
    assert.strictEqual(typeUtils.type({}), 'object', 'object');
    assert.strictEqual(typeUtils.type([]), 'array', 'array');
    assert.strictEqual(typeUtils.type(function() { }), 'function', 'function');
    assert.strictEqual(typeUtils.type(element[0].firstElementChild), 'object', 'HTMLDivElement');
});

QUnit.test('isDefined', function(assert) {
    assert.strictEqual(typeUtils.isDefined(0), true, 'zero number');
    assert.strictEqual(typeUtils.isDefined(1), true, 'number');
    assert.strictEqual(typeUtils.isDefined(''), true, 'empty string');
    assert.strictEqual(typeUtils.isDefined('string'), true, 'string');
    assert.strictEqual(typeUtils.isDefined(new Date()), true, 'date');
    assert.strictEqual(typeUtils.isDefined({}), true, 'empty object');
    assert.strictEqual(typeUtils.isDefined({ a: 1 }), true, 'object');
    assert.strictEqual(typeUtils.isDefined([]), true, 'empty array');
    assert.strictEqual(typeUtils.isDefined(['a', 1]), true, 'array');
    assert.strictEqual(typeUtils.isDefined(function() { }), true, 'function');

    assert.strictEqual(typeUtils.isDefined(null), false, 'null');
    assert.strictEqual(typeUtils.isDefined(undefined), false, 'undefined');
});

QUnit.test('isString', function(assert) {
    assert.strictEqual(typeUtils.isString(''), true, 'empty string');
    assert.strictEqual(typeUtils.isString('string'), true, 'string');

    assert.strictEqual(typeUtils.isString(12), false, 'number');
    assert.strictEqual(typeUtils.isString(new Date()), false, 'date');
    assert.strictEqual(typeUtils.isString([]), false, 'array');
    assert.strictEqual(typeUtils.isString({}), false, 'object');
    assert.strictEqual(typeUtils.isString(function() { }), false, 'function');
});

QUnit.test('isDate', function(assert) {
    assert.strictEqual(typeUtils.isDate(new Date()), true, 'date');

    assert.strictEqual(typeUtils.isDate({}), false, 'object');
    assert.strictEqual(typeUtils.isDate([]), false, 'array');
    assert.strictEqual(typeUtils.isDate(1), false, 'number');
    assert.strictEqual(typeUtils.isDate('s'), false, 'string');
    assert.strictEqual(typeUtils.isDate(function() { }), false, 'function');
});

QUnit.test('isFunction', function(assert) {
    assert.strictEqual(typeUtils.isFunction(function() { }), true, 'function');

    assert.strictEqual(typeUtils.isFunction({}), false, 'object');
    assert.strictEqual(typeUtils.isFunction([]), false, 'array');
    assert.strictEqual(typeUtils.isFunction(1), false, 'number');
    assert.strictEqual(typeUtils.isFunction('s'), false, 'string');
    assert.strictEqual(typeUtils.isFunction(new Date()), false, 'date');
});

QUnit.test('isNumeric', function(assert) {
    assert.strictEqual(typeUtils.isNumeric(0), true, 'zero');
    assert.strictEqual(typeUtils.isNumeric(-10), true, 'non zero');
    assert.strictEqual(typeUtils.isNumeric('1'), true, 'number string');

    assert.strictEqual(typeUtils.isNumeric(new Date()), false, 'date');
    assert.strictEqual(typeUtils.isNumeric('test'), false, 'string');
    assert.strictEqual(typeUtils.isNumeric({}), false, 'object');
    assert.strictEqual(typeUtils.isNumeric([]), false, 'array');
    assert.strictEqual(typeUtils.isNumeric(function() { }), false, 'function');
});

QUnit.test('isObject', function(assert) {
    assert.strictEqual(typeUtils.isObject({}), true, 'empty object');
    assert.strictEqual(typeUtils.isObject({ a: 1 }), true, 'object');

    assert.strictEqual(typeUtils.isObject(1), false, 'number');
    assert.strictEqual(typeUtils.isObject('test'), false, 'string');
    assert.strictEqual(typeUtils.isObject([]), false, 'array');
    assert.strictEqual(typeUtils.isObject(new Date()), false, 'date');
    assert.strictEqual(typeUtils.isObject(function() { }), false, 'function');
});

QUnit.test('isPlainObject', function(assert) {
    var testFunction = function() {
        return "test";
    };

    assert.strictEqual(typeUtils.isPlainObject({}), true, 'object is plain');
    assert.strictEqual(typeUtils.isPlainObject(new Object({})), true, 'object is plain');

    assert.strictEqual(typeUtils.isPlainObject(new testFunction()), false, 'function is not plain object');
    assert.strictEqual(typeUtils.isPlainObject([]), false, 'array is not plain object');
    assert.strictEqual(typeUtils.isPlainObject(1), false, 'number is not plain object');
    assert.strictEqual(typeUtils.isPlainObject('s'), false, 'string is not plain object');
    assert.strictEqual(typeUtils.isPlainObject(new Date()), false, 'date is not plain object');
    assert.strictEqual(typeUtils.isPlainObject($.Event), false, '$.Event is not plain object');
});
