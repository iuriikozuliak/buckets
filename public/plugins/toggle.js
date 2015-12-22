(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/client.coffee":[function(require,module,exports){
if (typeof bkts !== "undefined" && bkts !== null) {
  bkts.plugin('toggle', {
    name: 'Toggle',
    inputView: require('./views/toggle'),
    settingsView: "  "
  });
}



},{"./views/toggle":"/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/views/toggle.coffee"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/templates/toggle.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "checked";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"form-group\">\n  <div class=\"toggle\">\n    <label class=\"control-label\">\n      <input type=\"checkbox\" id=\"input-toggle-"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "\" class=\"uiswitch form-control\" name=\""
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "\" value=\""
    + escapeExpression(((helper = (helper = helpers.value || (depth0 != null ? depth0.value : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"value","hash":{},"data":data}) : helper)))
    + "\" ";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.value : depth0), "true", {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n    </label>\n  </div>\n</div>\n";
},"useData":true});

},{}],"/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/views/toggle.coffee":[function(require,module,exports){
var Buckets, ToggleView, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Buckets = require('buckets');

tpl = require('./../templates/toggle');

module.exports = ToggleView = (function(superClass) {
  extend(ToggleView, superClass);

  function ToggleView() {
    return ToggleView.__super__.constructor.apply(this, arguments);
  }

  ToggleView.prototype.template = tpl;

  ToggleView.prototype.events = {
    'click .uiswitch': 'toggleValue'
  };

  ToggleView.prototype.toggleValue = function(event) {
    return event.toElement.value = event.toElement.value === 'true' ? 'false' : 'true';
  };

  return ToggleView;

})(Buckets.View);



},{"./../templates/toggle":"/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/templates/toggle.hbs"}]},{},["/Users/iuriikozuliak/Projects/buckets/node_modules/buckets-toggle/client.coffee"]);