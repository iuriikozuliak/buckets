require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"backbone":[function(require,module,exports){
module.exports=require('KDJVm1');
},{}],"KDJVm1":[function(require,module,exports){
//     Backbone.js 1.1.2

//     (c) 2010-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(root, factory) {

  // Set up Backbone appropriately for the environment. Start with AMD.
  if (typeof define === 'function' && define.amd) {
    define(['underscore', 'jquery', 'exports'], function(_, $, exports) {
      // Export global even in AMD case in case this script is loaded with
      // others that may still expect a global Backbone.
      root.Backbone = factory(root, exports, _, $);
    });

  // Next for Node.js or CommonJS. jQuery may not be needed as a module.
  } else if (typeof exports !== 'undefined') {
    var _ = require('underscore');
    factory(root, exports, _);

  // Finally, as a browser global.
  } else {
    root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
  }

}(this, function(root, Backbone, _, $) {

  // Initial Setup
  // -------------

  // Save the previous value of the `Backbone` variable, so that it can be
  // restored later on, if `noConflict` is used.
  var previousBackbone = root.Backbone;

  // Create local references to array methods we'll want to use later.
  var array = [];
  var push = array.push;
  var slice = array.slice;
  var splice = array.splice;

  // Current version of the library. Keep in sync with `package.json`.
  Backbone.VERSION = '1.1.2';

  // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
  // the `$` variable.
  Backbone.$ = $;

  // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
  // to its previous owner. Returns a reference to this Backbone object.
  Backbone.noConflict = function() {
    root.Backbone = previousBackbone;
    return this;
  };

  // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
  // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
  // set a `X-Http-Method-Override` header.
  Backbone.emulateHTTP = false;

  // Turn on `emulateJSON` to support legacy servers that can't deal with direct
  // `application/json` requests ... will encode the body as
  // `application/x-www-form-urlencoded` instead and will send the model in a
  // form param named `model`.
  Backbone.emulateJSON = false;

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     _.extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Events = Backbone.Events = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var once = _.once(function() {
        self.off(name, once);
        callback.apply(this, arguments);
      });
      once._callback = callback;
      return this.on(name, once, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = void 0;
        return this;
      }
      names = name ? [name] : _.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeningTo = this._listeningTo;
      if (!listeningTo) return this;
      var remove = !name && !callback;
      if (!callback && typeof name === 'object') callback = this;
      if (obj) (listeningTo = {})[obj._listenId] = obj;
      for (var id in listeningTo) {
        obj = listeningTo[id];
        obj.off(name, callback, this);
        if (remove || _.isEmpty(obj._events)) delete this._listeningTo[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args); return;
    }
  };

  var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  _.each(listenMethods, function(implementation, method) {
    Events[method] = function(obj, name, callback) {
      var listeningTo = this._listeningTo || (this._listeningTo = {});
      var id = obj._listenId || (obj._listenId = _.uniqueId('l'));
      listeningTo[id] = obj;
      if (!callback && typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  });

  // Aliases for backwards compatibility.
  Events.bind   = Events.on;
  Events.unbind = Events.off;

  // Allow the `Backbone` object to serve as a global event bus, for folks who
  // want global "pubsub" in a convenient place.
  _.extend(Backbone, Events);

  // Backbone.Model
  // --------------

  // Backbone **Models** are the basic data object in the framework --
  // frequently representing a row in a table in a database on your server.
  // A discrete chunk of data and a bunch of useful, related methods for
  // performing computations and transformations on that data.

  // Create a new model with the specified attributes. A client id (`cid`)
  // is automatically generated and assigned for you.
  var Model = Backbone.Model = function(attributes, options) {
    var attrs = attributes || {};
    options || (options = {});
    this.cid = _.uniqueId('c');
    this.attributes = {};
    if (options.collection) this.collection = options.collection;
    if (options.parse) attrs = this.parse(attrs, options) || {};
    attrs = _.defaults({}, attrs, _.result(this, 'defaults'));
    this.set(attrs, options);
    this.changed = {};
    this.initialize.apply(this, arguments);
  };

  // Attach all inheritable methods to the Model prototype.
  _.extend(Model.prototype, Events, {

    // A hash of attributes whose current and previous value differ.
    changed: null,

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Return a copy of the model's `attributes` object.
    toJSON: function(options) {
      return _.clone(this.attributes);
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Get the value of an attribute.
    get: function(attr) {
      return this.attributes[attr];
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(attr) {
      return _.escape(this.get(attr));
    },

    // Returns `true` if the attribute contains a value that is not null
    // or undefined.
    has: function(attr) {
      return this.get(attr) != null;
    },

    // Set a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    set: function(key, val, options) {
      var attr, attrs, unset, changes, silent, changing, prev, current;
      if (key == null) return this;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options || (options = {});

      // Run validation.
      if (!this._validate(attrs, options)) return false;

      // Extract attributes and options.
      unset           = options.unset;
      silent          = options.silent;
      changes         = [];
      changing        = this._changing;
      this._changing  = true;

      if (!changing) {
        this._previousAttributes = _.clone(this.attributes);
        this.changed = {};
      }
      current = this.attributes, prev = this._previousAttributes;

      // Check for changes of `id`.
      if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

      // For each `set` attribute, update or delete the current value.
      for (attr in attrs) {
        val = attrs[attr];
        if (!_.isEqual(current[attr], val)) changes.push(attr);
        if (!_.isEqual(prev[attr], val)) {
          this.changed[attr] = val;
        } else {
          delete this.changed[attr];
        }
        unset ? delete current[attr] : current[attr] = val;
      }

      // Trigger all relevant attribute changes.
      if (!silent) {
        if (changes.length) this._pending = options;
        for (var i = 0, l = changes.length; i < l; i++) {
          this.trigger('change:' + changes[i], this, current[changes[i]], options);
        }
      }

      // You might be wondering why there's a `while` loop here. Changes can
      // be recursively nested within `"change"` events.
      if (changing) return this;
      if (!silent) {
        while (this._pending) {
          options = this._pending;
          this._pending = false;
          this.trigger('change', this, options);
        }
      }
      this._pending = false;
      this._changing = false;
      return this;
    },

    // Remove an attribute from the model, firing `"change"`. `unset` is a noop
    // if the attribute doesn't exist.
    unset: function(attr, options) {
      return this.set(attr, void 0, _.extend({}, options, {unset: true}));
    },

    // Clear all attributes on the model, firing `"change"`.
    clear: function(options) {
      var attrs = {};
      for (var key in this.attributes) attrs[key] = void 0;
      return this.set(attrs, _.extend({}, options, {unset: true}));
    },

    // Determine if the model has changed since the last `"change"` event.
    // If you specify an attribute name, determine if that attribute has changed.
    hasChanged: function(attr) {
      if (attr == null) return !_.isEmpty(this.changed);
      return _.has(this.changed, attr);
    },

    // Return an object containing all the attributes that have changed, or
    // false if there are no changed attributes. Useful for determining what
    // parts of a view need to be updated and/or what attributes need to be
    // persisted to the server. Unset attributes will be set to undefined.
    // You can also pass an attributes object to diff against the model,
    // determining if there *would be* a change.
    changedAttributes: function(diff) {
      if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
      var val, changed = false;
      var old = this._changing ? this._previousAttributes : this.attributes;
      for (var attr in diff) {
        if (_.isEqual(old[attr], (val = diff[attr]))) continue;
        (changed || (changed = {}))[attr] = val;
      }
      return changed;
    },

    // Get the previous value of an attribute, recorded at the time the last
    // `"change"` event was fired.
    previous: function(attr) {
      if (attr == null || !this._previousAttributes) return null;
      return this._previousAttributes[attr];
    },

    // Get all of the attributes of the model at the time of the previous
    // `"change"` event.
    previousAttributes: function() {
      return _.clone(this._previousAttributes);
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // triggering a `"change"` event.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        if (!model.set(model.parse(resp, options), options)) return false;
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(key, val, options) {
      var attrs, method, xhr, attributes = this.attributes;

      // Handle both `"key", value` and `{key: value}` -style arguments.
      if (key == null || typeof key === 'object') {
        attrs = key;
        options = val;
      } else {
        (attrs = {})[key] = val;
      }

      options = _.extend({validate: true}, options);

      // If we're not waiting and attributes exist, save acts as
      // `set(attr).save(null, opts)` with validation. Otherwise, check if
      // the model will be valid when the attributes, if any, are set.
      if (attrs && !options.wait) {
        if (!this.set(attrs, options)) return false;
      } else {
        if (!this._validate(attrs, options)) return false;
      }

      // Set temporary attributes if `{wait: true}`.
      if (attrs && options.wait) {
        this.attributes = _.extend({}, attributes, attrs);
      }

      // After a successful server-side save, the client is (optionally)
      // updated with the server-side state.
      if (options.parse === void 0) options.parse = true;
      var model = this;
      var success = options.success;
      options.success = function(resp) {
        // Ensure attributes are restored during synchronous saves.
        model.attributes = attributes;
        var serverAttrs = model.parse(resp, options);
        if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
        if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
          return false;
        }
        if (success) success(model, resp, options);
        model.trigger('sync', model, resp, options);
      };
      wrapError(this, options);

      method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
      if (method === 'patch') options.attrs = attrs;
      xhr = this.sync(method, this, options);

      // Restore attributes.
      if (attrs && options.wait) this.attributes = attributes;

      return xhr;
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(options) {
      options = options ? _.clone(options) : {};
      var model = this;
      var success = options.success;

      var destroy = function() {
        model.trigger('destroy', model, model.collection, options);
      };

      options.success = function(resp) {
        if (options.wait || model.isNew()) destroy();
        if (success) success(model, resp, options);
        if (!model.isNew()) model.trigger('sync', model, resp, options);
      };

      if (this.isNew()) {
        options.success();
        return false;
      }
      wrapError(this, options);

      var xhr = this.sync('delete', this, options);
      if (!options.wait) destroy();
      return xhr;
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
      var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url') ||
        urlError();
      if (this.isNew()) return base;
      return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
      return new this.constructor(this.attributes);
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
      return !this.has(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function(options) {
      return this._validate({}, _.extend(options || {}, { validate: true }));
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs, options) {
      if (!options.validate || !this.validate) return true;
      attrs = _.extend({}, this.attributes, attrs);
      var error = this.validationError = this.validate(attrs, options) || null;
      if (!error) return true;
      this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
      return false;
    }

  });

  // Underscore methods that we want to implement on the Model.
  var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

  // Mix in each Underscore method as a proxy to `Model#attributes`.
  _.each(modelMethods, function(method) {
    Model.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.attributes);
      return _[method].apply(_, args);
    };
  });

  // Backbone.Collection
  // -------------------

  // If models tend to represent a single row of data, a Backbone Collection is
  // more analagous to a table full of data ... or a small slice or page of that
  // table, or a collection of rows that belong together for a particular reason
  // -- all of the messages in this particular folder, all of the documents
  // belonging to this particular author, and so on. Collections maintain
  // indexes of their models, both in order, and for lookup by `id`.

  // Create a new **Collection**, perhaps to contain a specific type of `model`.
  // If a `comparator` is specified, the Collection will maintain
  // its models in sort order, as they're added and removed.
  var Collection = Backbone.Collection = function(models, options) {
    options || (options = {});
    if (options.model) this.model = options.model;
    if (options.comparator !== void 0) this.comparator = options.comparator;
    this._reset();
    this.initialize.apply(this, arguments);
    if (models) this.reset(models, _.extend({silent: true}, options));
  };

  // Default options for `Collection#set`.
  var setOptions = {add: true, remove: true, merge: true};
  var addOptions = {add: true, remove: false};

  // Define the Collection's inheritable methods.
  _.extend(Collection.prototype, Events, {

    // The default model for a collection is just a **Backbone.Model**.
    // This should be overridden in most cases.
    model: Model,

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // The JSON representation of a Collection is an array of the
    // models' attributes.
    toJSON: function(options) {
      return this.map(function(model){ return model.toJSON(options); });
    },

    // Proxy `Backbone.sync` by default.
    sync: function() {
      return Backbone.sync.apply(this, arguments);
    },

    // Add a model, or list of models to the set.
    add: function(models, options) {
      return this.set(models, _.extend({merge: false}, options, addOptions));
    },

    // Remove a model, or a list of models from the set.
    remove: function(models, options) {
      var singular = !_.isArray(models);
      models = singular ? [models] : _.clone(models);
      options || (options = {});
      var i, l, index, model;
      for (i = 0, l = models.length; i < l; i++) {
        model = models[i] = this.get(models[i]);
        if (!model) continue;
        delete this._byId[model.id];
        delete this._byId[model.cid];
        index = this.indexOf(model);
        this.models.splice(index, 1);
        this.length--;
        if (!options.silent) {
          options.index = index;
          model.trigger('remove', model, this, options);
        }
        this._removeReference(model, options);
      }
      return singular ? models[0] : models;
    },

    // Update a collection by `set`-ing a new list of models, adding new ones,
    // removing models that are no longer present, and merging models that
    // already exist in the collection, as necessary. Similar to **Model#set**,
    // the core operation for updating the data contained by the collection.
    set: function(models, options) {
      options = _.defaults({}, options, setOptions);
      if (options.parse) models = this.parse(models, options);
      var singular = !_.isArray(models);
      models = singular ? (models ? [models] : []) : _.clone(models);
      var i, l, id, model, attrs, existing, sort;
      var at = options.at;
      var targetModel = this.model;
      var sortable = this.comparator && (at == null) && options.sort !== false;
      var sortAttr = _.isString(this.comparator) ? this.comparator : null;
      var toAdd = [], toRemove = [], modelMap = {};
      var add = options.add, merge = options.merge, remove = options.remove;
      var order = !sortable && add && remove ? [] : false;

      // Turn bare objects into model references, and prevent invalid models
      // from being added.
      for (i = 0, l = models.length; i < l; i++) {
        attrs = models[i] || {};
        if (attrs instanceof Model) {
          id = model = attrs;
        } else {
          id = attrs[targetModel.prototype.idAttribute || 'id'];
        }

        // If a duplicate is found, prevent it from being added and
        // optionally merge it into the existing model.
        if (existing = this.get(id)) {
          if (remove) modelMap[existing.cid] = true;
          if (merge) {
            attrs = attrs === model ? model.attributes : attrs;
            if (options.parse) attrs = existing.parse(attrs, options);
            existing.set(attrs, options);
            if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
          }
          models[i] = existing;

        // If this is a new, valid model, push it to the `toAdd` list.
        } else if (add) {
          model = models[i] = this._prepareModel(attrs, options);
          if (!model) continue;
          toAdd.push(model);
          this._addReference(model, options);
        }

        // Do not add multiple models with the same `id`.
        model = existing || model;
        if (order && (model.isNew() || !modelMap[model.id])) order.push(model);
        modelMap[model.id] = true;
      }

      // Remove nonexistent models if appropriate.
      if (remove) {
        for (i = 0, l = this.length; i < l; ++i) {
          if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
        }
        if (toRemove.length) this.remove(toRemove, options);
      }

      // See if sorting is needed, update `length` and splice in new models.
      if (toAdd.length || (order && order.length)) {
        if (sortable) sort = true;
        this.length += toAdd.length;
        if (at != null) {
          for (i = 0, l = toAdd.length; i < l; i++) {
            this.models.splice(at + i, 0, toAdd[i]);
          }
        } else {
          if (order) this.models.length = 0;
          var orderedModels = order || toAdd;
          for (i = 0, l = orderedModels.length; i < l; i++) {
            this.models.push(orderedModels[i]);
          }
        }
      }

      // Silently sort the collection if appropriate.
      if (sort) this.sort({silent: true});

      // Unless silenced, it's time to fire all appropriate add/sort events.
      if (!options.silent) {
        for (i = 0, l = toAdd.length; i < l; i++) {
          (model = toAdd[i]).trigger('add', model, this, options);
        }
        if (sort || (order && order.length)) this.trigger('sort', this, options);
      }

      // Return the added (or merged) model (or models).
      return singular ? models[0] : models;
    },

    // When you have more items than you want to add or remove individually,
    // you can reset the entire set with a new list of models, without firing
    // any granular `add` or `remove` events. Fires `reset` when finished.
    // Useful for bulk operations and optimizations.
    reset: function(models, options) {
      options || (options = {});
      for (var i = 0, l = this.models.length; i < l; i++) {
        this._removeReference(this.models[i], options);
      }
      options.previousModels = this.models;
      this._reset();
      models = this.add(models, _.extend({silent: true}, options));
      if (!options.silent) this.trigger('reset', this, options);
      return models;
    },

    // Add a model to the end of the collection.
    push: function(model, options) {
      return this.add(model, _.extend({at: this.length}, options));
    },

    // Remove a model from the end of the collection.
    pop: function(options) {
      var model = this.at(this.length - 1);
      this.remove(model, options);
      return model;
    },

    // Add a model to the beginning of the collection.
    unshift: function(model, options) {
      return this.add(model, _.extend({at: 0}, options));
    },

    // Remove a model from the beginning of the collection.
    shift: function(options) {
      var model = this.at(0);
      this.remove(model, options);
      return model;
    },

    // Slice out a sub-array of models from the collection.
    slice: function() {
      return slice.apply(this.models, arguments);
    },

    // Get a model from the set by id.
    get: function(obj) {
      if (obj == null) return void 0;
      return this._byId[obj] || this._byId[obj.id] || this._byId[obj.cid];
    },

    // Get the model at the given index.
    at: function(index) {
      return this.models[index];
    },

    // Return models with matching attributes. Useful for simple cases of
    // `filter`.
    where: function(attrs, first) {
      if (_.isEmpty(attrs)) return first ? void 0 : [];
      return this[first ? 'find' : 'filter'](function(model) {
        for (var key in attrs) {
          if (attrs[key] !== model.get(key)) return false;
        }
        return true;
      });
    },

    // Return the first model with matching attributes. Useful for simple cases
    // of `find`.
    findWhere: function(attrs) {
      return this.where(attrs, true);
    },

    // Force the collection to re-sort itself. You don't need to call this under
    // normal circumstances, as the set will maintain sort order as each item
    // is added.
    sort: function(options) {
      if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
      options || (options = {});

      // Run sort based on type of `comparator`.
      if (_.isString(this.comparator) || this.comparator.length === 1) {
        this.models = this.sortBy(this.comparator, this);
      } else {
        this.models.sort(_.bind(this.comparator, this));
      }

      if (!options.silent) this.trigger('sort', this, options);
      return this;
    },

    // Pluck an attribute from each model in the collection.
    pluck: function(attr) {
      return _.invoke(this.models, 'get', attr);
    },

    // Fetch the default set of models for this collection, resetting the
    // collection when they arrive. If `reset: true` is passed, the response
    // data will be passed through the `reset` method instead of `set`.
    fetch: function(options) {
      options = options ? _.clone(options) : {};
      if (options.parse === void 0) options.parse = true;
      var success = options.success;
      var collection = this;
      options.success = function(resp) {
        var method = options.reset ? 'reset' : 'set';
        collection[method](resp, options);
        if (success) success(collection, resp, options);
        collection.trigger('sync', collection, resp, options);
      };
      wrapError(this, options);
      return this.sync('read', this, options);
    },

    // Create a new instance of a model in this collection. Add the model to the
    // collection immediately, unless `wait: true` is passed, in which case we
    // wait for the server to agree.
    create: function(model, options) {
      options = options ? _.clone(options) : {};
      if (!(model = this._prepareModel(model, options))) return false;
      if (!options.wait) this.add(model, options);
      var collection = this;
      var success = options.success;
      options.success = function(model, resp) {
        if (options.wait) collection.add(model, options);
        if (success) success(model, resp, options);
      };
      model.save(null, options);
      return model;
    },

    // **parse** converts a response into a list of models to be added to the
    // collection. The default implementation is just to pass it through.
    parse: function(resp, options) {
      return resp;
    },

    // Create a new collection with an identical list of models as this one.
    clone: function() {
      return new this.constructor(this.models);
    },

    // Private method to reset all internal state. Called when the collection
    // is first initialized or reset.
    _reset: function() {
      this.length = 0;
      this.models = [];
      this._byId  = {};
    },

    // Prepare a hash of attributes (or other model) to be added to this
    // collection.
    _prepareModel: function(attrs, options) {
      if (attrs instanceof Model) return attrs;
      options = options ? _.clone(options) : {};
      options.collection = this;
      var model = new this.model(attrs, options);
      if (!model.validationError) return model;
      this.trigger('invalid', this, model.validationError, options);
      return false;
    },

    // Internal method to create a model's ties to a collection.
    _addReference: function(model, options) {
      this._byId[model.cid] = model;
      if (model.id != null) this._byId[model.id] = model;
      if (!model.collection) model.collection = this;
      model.on('all', this._onModelEvent, this);
    },

    // Internal method to sever a model's ties to a collection.
    _removeReference: function(model, options) {
      if (this === model.collection) delete model.collection;
      model.off('all', this._onModelEvent, this);
    },

    // Internal method called every time a model in the set fires an event.
    // Sets need to update their indexes when models change ids. All other
    // events simply proxy through. "add" and "remove" events that originate
    // in other collections are ignored.
    _onModelEvent: function(event, model, collection, options) {
      if ((event === 'add' || event === 'remove') && collection !== this) return;
      if (event === 'destroy') this.remove(model, options);
      if (model && event === 'change:' + model.idAttribute) {
        delete this._byId[model.previous(model.idAttribute)];
        if (model.id != null) this._byId[model.id] = model;
      }
      this.trigger.apply(this, arguments);
    }

  });

  // Underscore methods that we want to implement on the Collection.
  // 90% of the core usefulness of Backbone Collections is actually implemented
  // right here:
  var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
    'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
    'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
    'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
    'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
    'lastIndexOf', 'isEmpty', 'chain', 'sample'];

  // Mix in each Underscore method as a proxy to `Collection#models`.
  _.each(methods, function(method) {
    Collection.prototype[method] = function() {
      var args = slice.call(arguments);
      args.unshift(this.models);
      return _[method].apply(_, args);
    };
  });

  // Underscore methods that take a property name as an argument.
  var attributeMethods = ['groupBy', 'countBy', 'sortBy', 'indexBy'];

  // Use attributes instead of properties.
  _.each(attributeMethods, function(method) {
    Collection.prototype[method] = function(value, context) {
      var iterator = _.isFunction(value) ? value : function(model) {
        return model.get(value);
      };
      return _[method](this.models, iterator, context);
    };
  });

  // Backbone.View
  // -------------

  // Backbone Views are almost more convention than they are actual code. A View
  // is simply a JavaScript object that represents a logical chunk of UI in the
  // DOM. This might be a single item, an entire list, a sidebar or panel, or
  // even the surrounding frame which wraps your whole app. Defining a chunk of
  // UI as a **View** allows you to define your DOM events declaratively, without
  // having to worry about render order ... and makes it easy for the view to
  // react to specific changes in the state of your models.

  // Creating a Backbone.View creates its initial element outside of the DOM,
  // if an existing element is not provided...
  var View = Backbone.View = function(options) {
    this.cid = _.uniqueId('view');
    options || (options = {});
    _.extend(this, _.pick(options, viewOptions));
    this._ensureElement();
    this.initialize.apply(this, arguments);
    this.delegateEvents();
  };

  // Cached regex to split keys for `delegate`.
  var delegateEventSplitter = /^(\S+)\s*(.*)$/;

  // List of view options to be merged as properties.
  var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

  // Set up all inheritable **Backbone.View** properties and methods.
  _.extend(View.prototype, Events, {

    // The default `tagName` of a View's element is `"div"`.
    tagName: 'div',

    // jQuery delegate for element lookup, scoped to DOM elements within the
    // current view. This should be preferred to global lookups where possible.
    $: function(selector) {
      return this.$el.find(selector);
    },

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // **render** is the core function that your view should override, in order
    // to populate its element (`this.el`), with the appropriate HTML. The
    // convention is for **render** to always return `this`.
    render: function() {
      return this;
    },

    // Remove this view by taking the element out of the DOM, and removing any
    // applicable Backbone.Events listeners.
    remove: function() {
      this.$el.remove();
      this.stopListening();
      return this;
    },

    // Change the view's element (`this.el` property), including event
    // re-delegation.
    setElement: function(element, delegate) {
      if (this.$el) this.undelegateEvents();
      this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
      this.el = this.$el[0];
      if (delegate !== false) this.delegateEvents();
      return this;
    },

    // Set callbacks, where `this.events` is a hash of
    //
    // *{"event selector": "callback"}*
    //
    //     {
    //       'mousedown .title':  'edit',
    //       'click .button':     'save',
    //       'click .open':       function(e) { ... }
    //     }
    //
    // pairs. Callbacks will be bound to the view, with `this` set properly.
    // Uses event delegation for efficiency.
    // Omitting the selector binds the event to `this.el`.
    // This only works for delegate-able events: not `focus`, `blur`, and
    // not `change`, `submit`, and `reset` in Internet Explorer.
    delegateEvents: function(events) {
      if (!(events || (events = _.result(this, 'events')))) return this;
      this.undelegateEvents();
      for (var key in events) {
        var method = events[key];
        if (!_.isFunction(method)) method = this[events[key]];
        if (!method) continue;

        var match = key.match(delegateEventSplitter);
        var eventName = match[1], selector = match[2];
        method = _.bind(method, this);
        eventName += '.delegateEvents' + this.cid;
        if (selector === '') {
          this.$el.on(eventName, method);
        } else {
          this.$el.on(eventName, selector, method);
        }
      }
      return this;
    },

    // Clears all callbacks previously bound to the view with `delegateEvents`.
    // You usually don't need to use this, but may wish to if you have multiple
    // Backbone views attached to the same DOM element.
    undelegateEvents: function() {
      this.$el.off('.delegateEvents' + this.cid);
      return this;
    },

    // Ensure that the View has a DOM element to render into.
    // If `this.el` is a string, pass it through `$()`, take the first
    // matching element, and re-assign it to `el`. Otherwise, create
    // an element from the `id`, `className` and `tagName` properties.
    _ensureElement: function() {
      if (!this.el) {
        var attrs = _.extend({}, _.result(this, 'attributes'));
        if (this.id) attrs.id = _.result(this, 'id');
        if (this.className) attrs['class'] = _.result(this, 'className');
        var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
        this.setElement($el, false);
      } else {
        this.setElement(_.result(this, 'el'), false);
      }
    }

  });

  // Backbone.sync
  // -------------

  // Override this function to change the manner in which Backbone persists
  // models to the server. You will be passed the type of request, and the
  // model in question. By default, makes a RESTful Ajax request
  // to the model's `url()`. Some possible customizations could be:
  //
  // * Use `setTimeout` to batch rapid-fire updates into a single request.
  // * Send up the models as XML instead of JSON.
  // * Persist models via WebSockets instead of Ajax.
  //
  // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
  // as `POST`, with a `_method` parameter containing the true HTTP method,
  // as well as all requests with the body as `application/x-www-form-urlencoded`
  // instead of `application/json` with the model in a param named `model`.
  // Useful when interfacing with server-side languages like **PHP** that make
  // it difficult to read the body of `PUT` requests.
  Backbone.sync = function(method, model, options) {
    var type = methodMap[method];

    // Default options, unless specified.
    _.defaults(options || (options = {}), {
      emulateHTTP: Backbone.emulateHTTP,
      emulateJSON: Backbone.emulateJSON
    });

    // Default JSON-request options.
    var params = {type: type, dataType: 'json'};

    // Ensure that we have a URL.
    if (!options.url) {
      params.url = _.result(model, 'url') || urlError();
    }

    // Ensure that we have the appropriate request data.
    if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
      params.contentType = 'application/json';
      params.data = JSON.stringify(options.attrs || model.toJSON(options));
    }

    // For older servers, emulate JSON by encoding the request into an HTML-form.
    if (options.emulateJSON) {
      params.contentType = 'application/x-www-form-urlencoded';
      params.data = params.data ? {model: params.data} : {};
    }

    // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
    // And an `X-HTTP-Method-Override` header.
    if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
      params.type = 'POST';
      if (options.emulateJSON) params.data._method = type;
      var beforeSend = options.beforeSend;
      options.beforeSend = function(xhr) {
        xhr.setRequestHeader('X-HTTP-Method-Override', type);
        if (beforeSend) return beforeSend.apply(this, arguments);
      };
    }

    // Don't process data on a non-GET request.
    if (params.type !== 'GET' && !options.emulateJSON) {
      params.processData = false;
    }

    // If we're sending a `PATCH` request, and we're in an old Internet Explorer
    // that still has ActiveX enabled by default, override jQuery to use that
    // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
    if (params.type === 'PATCH' && noXhrPatch) {
      params.xhr = function() {
        return new ActiveXObject("Microsoft.XMLHTTP");
      };
    }

    // Make the request, allowing the user to override any Ajax options.
    var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    model.trigger('request', model, xhr, options);
    return xhr;
  };

  var noXhrPatch =
    typeof window !== 'undefined' && !!window.ActiveXObject &&
      !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

  // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
  var methodMap = {
    'create': 'POST',
    'update': 'PUT',
    'patch':  'PATCH',
    'delete': 'DELETE',
    'read':   'GET'
  };

  // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
  // Override this if you'd like to use a different library.
  Backbone.ajax = function() {
    return Backbone.$.ajax.apply(Backbone.$, arguments);
  };

  // Backbone.Router
  // ---------------

  // Routers map faux-URLs to actions, and fire events when routes are
  // matched. Creating a new one sets its `routes` hash, if not set statically.
  var Router = Backbone.Router = function(options) {
    options || (options = {});
    if (options.routes) this.routes = options.routes;
    this._bindRoutes();
    this.initialize.apply(this, arguments);
  };

  // Cached regular expressions for matching named param parts and splatted
  // parts of route strings.
  var optionalParam = /\((.*?)\)/g;
  var namedParam    = /(\(\?)?:\w+/g;
  var splatParam    = /\*\w+/g;
  var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  // Set up all inheritable **Backbone.Router** properties and methods.
  _.extend(Router.prototype, Events, {

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function(){},

    // Manually bind a single named route to a callback. For example:
    //
    //     this.route('search/:query/p:num', 'search', function(query, num) {
    //       ...
    //     });
    //
    route: function(route, name, callback) {
      if (!_.isRegExp(route)) route = this._routeToRegExp(route);
      if (_.isFunction(name)) {
        callback = name;
        name = '';
      }
      if (!callback) callback = this[name];
      var router = this;
      Backbone.history.route(route, function(fragment) {
        var args = router._extractParameters(route, fragment);
        router.execute(callback, args);
        router.trigger.apply(router, ['route:' + name].concat(args));
        router.trigger('route', name, args);
        Backbone.history.trigger('route', router, name, args);
      });
      return this;
    },

    // Execute a route handler with the provided parameters.  This is an
    // excellent place to do pre-route setup or post-route cleanup.
    execute: function(callback, args) {
      if (callback) callback.apply(this, args);
    },

    // Simple proxy to `Backbone.history` to save a fragment into the history.
    navigate: function(fragment, options) {
      Backbone.history.navigate(fragment, options);
      return this;
    },

    // Bind all defined routes to `Backbone.history`. We have to reverse the
    // order of the routes here to support behavior where the most general
    // routes can be defined at the bottom of the route map.
    _bindRoutes: function() {
      if (!this.routes) return;
      this.routes = _.result(this, 'routes');
      var route, routes = _.keys(this.routes);
      while ((route = routes.pop()) != null) {
        this.route(route, this.routes[route]);
      }
    },

    // Convert a route string into a regular expression, suitable for matching
    // against the current location hash.
    _routeToRegExp: function(route) {
      route = route.replace(escapeRegExp, '\\$&')
                   .replace(optionalParam, '(?:$1)?')
                   .replace(namedParam, function(match, optional) {
                     return optional ? match : '([^/?]+)';
                   })
                   .replace(splatParam, '([^?]*?)');
      return new RegExp('^' + route + '(?:\\?([\\s\\S]*))?$');
    },

    // Given a route, and a URL fragment that it matches, return the array of
    // extracted decoded parameters. Empty or unmatched parameters will be
    // treated as `null` to normalize cross-browser behavior.
    _extractParameters: function(route, fragment) {
      var params = route.exec(fragment).slice(1);
      return _.map(params, function(param, i) {
        // Don't decode the search params.
        if (i === params.length - 1) return param || null;
        return param ? decodeURIComponent(param) : null;
      });
    }

  });

  // Backbone.History
  // ----------------

  // Handles cross-browser history management, based on either
  // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
  // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
  // and URL fragments. If the browser supports neither (old IE, natch),
  // falls back to polling.
  var History = Backbone.History = function() {
    this.handlers = [];
    _.bindAll(this, 'checkUrl');

    // Ensure that `History` can be used outside of the browser.
    if (typeof window !== 'undefined') {
      this.location = window.location;
      this.history = window.history;
    }
  };

  // Cached regex for stripping a leading hash/slash and trailing space.
  var routeStripper = /^[#\/]|\s+$/g;

  // Cached regex for stripping leading and trailing slashes.
  var rootStripper = /^\/+|\/+$/g;

  // Cached regex for detecting MSIE.
  var isExplorer = /msie [\w.]+/;

  // Cached regex for removing a trailing slash.
  var trailingSlash = /\/$/;

  // Cached regex for stripping urls of hash.
  var pathStripper = /#.*$/;

  // Has the history handling already been started?
  History.started = false;

  // Set up all inheritable **Backbone.History** properties and methods.
  _.extend(History.prototype, Events, {

    // The default interval to poll for hash changes, if necessary, is
    // twenty times a second.
    interval: 50,

    // Are we at the app root?
    atRoot: function() {
      return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
    },

    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    getHash: function(window) {
      var match = (window || this).location.href.match(/#(.*)$/);
      return match ? match[1] : '';
    },

    // Get the cross-browser normalized URL fragment, either from the URL,
    // the hash, or the override.
    getFragment: function(fragment, forcePushState) {
      if (fragment == null) {
        if (this._hasPushState || !this._wantsHashChange || forcePushState) {
          fragment = decodeURI(this.location.pathname + this.location.search);
          var root = this.root.replace(trailingSlash, '');
          if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
        } else {
          fragment = this.getHash();
        }
      }
      return fragment.replace(routeStripper, '');
    },

    // Start the hash change handling, returning `true` if the current URL matches
    // an existing route, and `false` otherwise.
    start: function(options) {
      if (History.started) throw new Error("Backbone.history has already been started");
      History.started = true;

      // Figure out the initial configuration. Do we need an iframe?
      // Is pushState desired ... is it available?
      this.options          = _.extend({root: '/'}, this.options, options);
      this.root             = this.options.root;
      this._wantsHashChange = this.options.hashChange !== false;
      this._wantsPushState  = !!this.options.pushState;
      this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
      var fragment          = this.getFragment();
      var docMode           = document.documentMode;
      var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

      // Normalize root to always include a leading and trailing slash.
      this.root = ('/' + this.root + '/').replace(rootStripper, '/');

      if (oldIE && this._wantsHashChange) {
        var frame = Backbone.$('<iframe src="javascript:0" tabindex="-1">');
        this.iframe = frame.hide().appendTo('body')[0].contentWindow;
        this.navigate(fragment);
      }

      // Depending on whether we're using pushState or hashes, and whether
      // 'onhashchange' is supported, determine how we check the URL state.
      if (this._hasPushState) {
        Backbone.$(window).on('popstate', this.checkUrl);
      } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
        Backbone.$(window).on('hashchange', this.checkUrl);
      } else if (this._wantsHashChange) {
        this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
      }

      // Determine if we need to change the base url, for a pushState link
      // opened by a non-pushState browser.
      this.fragment = fragment;
      var loc = this.location;

      // Transition from hashChange to pushState or vice versa if both are
      // requested.
      if (this._wantsHashChange && this._wantsPushState) {

        // If we've started off with a route from a `pushState`-enabled
        // browser, but we're currently in a browser that doesn't support it...
        if (!this._hasPushState && !this.atRoot()) {
          this.fragment = this.getFragment(null, true);
          this.location.replace(this.root + '#' + this.fragment);
          // Return immediately as browser will do redirect to new url
          return true;

        // Or if we've started out with a hash-based route, but we're currently
        // in a browser where it could be `pushState`-based instead...
        } else if (this._hasPushState && this.atRoot() && loc.hash) {
          this.fragment = this.getHash().replace(routeStripper, '');
          this.history.replaceState({}, document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) return this.loadUrl();
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
      if (this._checkUrlInterval) clearInterval(this._checkUrlInterval);
      History.started = false;
    },

    // Add a route to be tested when the fragment changes. Routes added later
    // may override previous routes.
    route: function(route, callback) {
      this.handlers.unshift({route: route, callback: callback});
    },

    // Checks the current URL to see if it has changed, and if it has,
    // calls `loadUrl`, normalizing across the hidden iframe.
    checkUrl: function(e) {
      var current = this.getFragment();
      if (current === this.fragment && this.iframe) {
        current = this.getFragment(this.getHash(this.iframe));
      }
      if (current === this.fragment) return false;
      if (this.iframe) this.navigate(current);
      this.loadUrl();
    },

    // Attempt to load the current URL fragment. If a route succeeds with a
    // match, returns `true`. If no defined routes matches the fragment,
    // returns `false`.
    loadUrl: function(fragment) {
      fragment = this.fragment = this.getFragment(fragment);
      return _.any(this.handlers, function(handler) {
        if (handler.route.test(fragment)) {
          handler.callback(fragment);
          return true;
        }
      });
    },

    // Save a fragment into the hash history, or replace the URL state if the
    // 'replace' option is passed. You are responsible for properly URL-encoding
    // the fragment in advance.
    //
    // The options object can contain `trigger: true` if you wish to have the
    // route callback be fired (not usually desirable), or `replace: true`, if
    // you wish to modify the current URL without adding an entry to the history.
    navigate: function(fragment, options) {
      if (!History.started) return false;
      if (!options || options === true) options = {trigger: !!options};

      var url = this.root + (fragment = this.getFragment(fragment || ''));

      // Strip the hash for matching.
      fragment = fragment.replace(pathStripper, '');

      if (this.fragment === fragment) return;
      this.fragment = fragment;

      // Don't include a trailing slash on the root.
      if (fragment === '' && url !== '/') url = url.slice(0, -1);

      // If pushState is available, we use it to set the fragment as a real URL.
      if (this._hasPushState) {
        this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

      // If hash changes haven't been explicitly disabled, update the hash
      // fragment to store history.
      } else if (this._wantsHashChange) {
        this._updateHash(this.location, fragment, options.replace);
        if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
          // Opening and closing the iframe tricks IE7 and earlier to push a
          // history entry on hash-tag change.  When replace is true, we don't
          // want this.
          if(!options.replace) this.iframe.document.open().close();
          this._updateHash(this.iframe.location, fragment, options.replace);
        }

      // If you've told us that you explicitly don't want fallback hashchange-
      // based history, then `navigate` becomes a page refresh.
      } else {
        return this.location.assign(url);
      }
      if (options.trigger) return this.loadUrl(fragment);
    },

    // Update the hash location, either replacing the current entry, or adding
    // a new one to the browser history.
    _updateHash: function(location, fragment, replace) {
      if (replace) {
        var href = location.href.replace(/(javascript:|#).*$/, '');
        location.replace(href + '#' + fragment);
      } else {
        // Some browsers require that `hash` contains a leading #.
        location.hash = '#' + fragment;
      }
    }

  });

  // Create the default Backbone.history.
  Backbone.history = new History;

  // Helpers
  // -------

  // Helper function to correctly set up the prototype chain, for subclasses.
  // Similar to `goog.inherits`, but uses a hash of prototype properties and
  // class properties to be extended.
  var extend = function(protoProps, staticProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && _.has(protoProps, 'constructor')) {
      child = protoProps.constructor;
    } else {
      child = function(){ return parent.apply(this, arguments); };
    }

    // Add static properties to the constructor function, if supplied.
    _.extend(child, parent, staticProps);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    var Surrogate = function(){ this.constructor = child; };
    Surrogate.prototype = parent.prototype;
    child.prototype = new Surrogate;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) _.extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
  };

  // Set up inheritance for the model, collection, router, view and history.
  Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

  // Throw an error when a URL is needed, and none is supplied.
  var urlError = function() {
    throw new Error('A "url" property or function must be specified');
  };

  // Wrap an optional error callback with a fallback error event.
  var wrapError = function(model, options) {
    var error = options.error;
    options.error = function(resp) {
      if (error) error(model, resp, options);
      model.trigger('error', model, resp, options);
    };
  };

  return Backbone;

}));

},{}],"9U5Jgg":[function(require,module,exports){
/*!
 * Chaplin 1.0.1
 *
 * Chaplin may be freely distributed under the MIT license.
 * For all details and documentation:
 * http://chaplinjs.org
 */

(function(){

var loader = (function() {
  var modules = {};
  var cache = {};

  var dummy = function() {return function() {};};
  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    definition(module.exports, dummy(), module);
    var exports = cache[name] = module.exports;
    return exports;
  };

  var loader = function(path) {
    if (cache.hasOwnProperty(path)) return cache[path];
    if (modules.hasOwnProperty(path)) return initModule(path, modules[path]);
    throw new Error('Cannot find module "' + path + '"');
  };

  loader.register = function(bundle, fn) {
    modules[bundle] = fn;
  };
  return loader;
})();

loader.register('chaplin/application', function(e, r, module) {
'use strict';

var Application, Backbone, Composer, Dispatcher, EventBroker, Layout, Router, mediator, _;

_ = loader('underscore');

Backbone = loader('backbone');

Dispatcher = loader('chaplin/dispatcher');

Layout = loader('chaplin/views/layout');

Composer = loader('chaplin/composer');

Router = loader('chaplin/lib/router');

EventBroker = loader('chaplin/lib/event_broker');

mediator = loader('chaplin/mediator');

module.exports = Application = (function() {

  Application.extend = Backbone.Model.extend;

  _.extend(Application.prototype, EventBroker);

  Application.prototype.title = '';

  Application.prototype.dispatcher = null;

  Application.prototype.layout = null;

  Application.prototype.router = null;

  Application.prototype.composer = null;

  Application.prototype.started = false;

  function Application(options) {
    if (options == null) {
      options = {};
    }
    this.initialize(options);
  }

  Application.prototype.initialize = function(options) {
    if (options == null) {
      options = {};
    }
    if (this.started) {
      throw new Error('Application#initialize: App was already started');
    }
    this.initRouter(options.routes, options);
    this.initDispatcher(options);
    this.initLayout(options);
    this.initComposer(options);
    this.initMediator();
    return this.start();
  };

  Application.prototype.initDispatcher = function(options) {
    return this.dispatcher = new Dispatcher(options);
  };

  Application.prototype.initLayout = function(options) {
    var _ref;
    if (options == null) {
      options = {};
    }
    if ((_ref = options.title) == null) {
      options.title = this.title;
    }
    return this.layout = new Layout(options);
  };

  Application.prototype.initComposer = function(options) {
    if (options == null) {
      options = {};
    }
    return this.composer = new Composer(options);
  };

  Application.prototype.initMediator = function() {
    return mediator.seal();
  };

  Application.prototype.initRouter = function(routes, options) {
    this.router = new Router(options);
    return typeof routes === "function" ? routes(this.router.match) : void 0;
  };

  Application.prototype.start = function() {
    this.router.startHistory();
    this.started = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  Application.prototype.disposed = false;

  Application.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) {
      return;
    }
    properties = ['dispatcher', 'layout', 'router', 'composer'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      if (this[prop] != null) {
        this[prop].dispose();
      }
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Application;

})();

});;loader.register('chaplin/mediator', function(e, r, module) {
'use strict';

var Backbone, handlers, mediator, support, utils, _,
  __slice = [].slice;

Backbone = loader('backbone');

_ = loader('underscore');

support = loader('chaplin/lib/support');

utils = loader('chaplin/lib/utils');

mediator = {};

mediator.subscribe = mediator.on = Backbone.Events.on;

mediator.subscribeOnce = mediator.once = Backbone.Events.once;

mediator.unsubscribe = mediator.off = Backbone.Events.off;

mediator.publish = mediator.trigger = Backbone.Events.trigger;

mediator._callbacks = null;

handlers = mediator._handlers = {};

mediator.setHandler = function(name, method, instance) {
  return handlers[name] = {
    instance: instance,
    method: method
  };
};

mediator.execute = function() {
  var args, handler, name, nameOrObj, silent;
  nameOrObj = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
  silent = false;
  if (typeof nameOrObj === 'object') {
    silent = nameOrObj.silent;
    name = nameOrObj.name;
  } else {
    name = nameOrObj;
  }
  handler = handlers[name];
  if (handler) {
    return handler.method.apply(handler.instance, args);
  } else if (!silent) {
    throw new Error("mediator.execute: " + name + " handler is not defined");
  }
};

mediator.removeHandlers = function(instanceOrNames) {
  var handler, name, _i, _len;
  if (!instanceOrNames) {
    mediator._handlers = {};
  }
  if (utils.isArray(instanceOrNames)) {
    for (_i = 0, _len = instanceOrNames.length; _i < _len; _i++) {
      name = instanceOrNames[_i];
      delete handlers[name];
    }
  } else {
    for (name in handlers) {
      handler = handlers[name];
      if (handler.instance === instanceOrNames) {
        delete handlers[name];
      }
    }
  }
};

utils.readonly(mediator, 'subscribe', 'subscribeOnce', 'unsubscribe', 'publish', 'setHandler', 'execute', 'removeHandlers');

mediator.seal = function() {
  if (support.propertyDescriptors && Object.seal) {
    return Object.seal(mediator);
  }
};

utils.readonly(mediator, 'seal');

module.exports = mediator;

});;loader.register('chaplin/dispatcher', function(e, r, module) {
'use strict';

var Backbone, Dispatcher, EventBroker, mediator, utils, _;

_ = loader('underscore');

Backbone = loader('backbone');

mediator = loader('chaplin/mediator');

utils = loader('chaplin/lib/utils');

EventBroker = loader('chaplin/lib/event_broker');

module.exports = Dispatcher = (function() {

  Dispatcher.extend = Backbone.Model.extend;

  _.extend(Dispatcher.prototype, EventBroker);

  Dispatcher.prototype.previousRoute = null;

  Dispatcher.prototype.currentController = null;

  Dispatcher.prototype.currentRoute = null;

  Dispatcher.prototype.currentParams = null;

  Dispatcher.prototype.currentQuery = null;

  function Dispatcher() {
    this.initialize.apply(this, arguments);
  }

  Dispatcher.prototype.initialize = function(options) {
    if (options == null) {
      options = {};
    }
    this.settings = _.defaults(options, {
      controllerPath: 'controllers/',
      controllerSuffix: '_controller'
    });
    return this.subscribeEvent('router:match', this.dispatch);
  };

  Dispatcher.prototype.dispatch = function(route, params, options) {
    var _ref, _ref1,
      _this = this;
    params = params ? _.extend({}, params) : {};
    options = options ? _.extend({}, options) : {};
    if (!(options.query != null)) {
      options.query = {};
    }
    if (options.forceStartup !== true) {
      options.forceStartup = false;
    }
    if (!options.forceStartup && ((_ref = this.currentRoute) != null ? _ref.controller : void 0) === route.controller && ((_ref1 = this.currentRoute) != null ? _ref1.action : void 0) === route.action && _.isEqual(this.currentParams, params) && _.isEqual(this.currentQuery, options.query)) {
      return;
    }
    return this.loadController(route.controller, function(Controller) {
      return _this.controllerLoaded(route, params, options, Controller);
    });
  };

  Dispatcher.prototype.loadController = function(name, handler) {
    var fileName, moduleName,
      _this = this;
    fileName = name + this.settings.controllerSuffix;
    moduleName = this.settings.controllerPath + fileName;
    if (typeof define !== "undefined" && define !== null ? define.amd : void 0) {
      return require([moduleName], handler);
    } else {
      return setTimeout(function() {
        return handler(require(moduleName));
      }, 0);
    }
  };

  Dispatcher.prototype.controllerLoaded = function(route, params, options, Controller) {
    var controller, prev, previous;
    if (this.nextPreviousRoute = this.currentRoute) {
      previous = _.extend({}, this.nextPreviousRoute);
      if (this.currentParams != null) {
        previous.params = this.currentParams;
      }
      if (previous.previous) {
        delete previous.previous;
      }
      prev = {
        previous: previous
      };
    }
    this.nextCurrentRoute = _.extend({}, route, prev);
    controller = new Controller(params, this.nextCurrentRoute, options);
    return this.executeBeforeAction(controller, this.nextCurrentRoute, params, options);
  };

  Dispatcher.prototype.executeAction = function(controller, route, params, options) {
    if (this.currentController) {
      this.publishEvent('beforeControllerDispose', this.currentController);
      this.currentController.dispose(params, route, options);
    }
    this.currentController = controller;
    this.currentParams = params;
    this.currentQuery = options.query;
    controller[route.action](params, route, options);
    if (controller.redirected) {
      return;
    }
    return this.publishEvent('dispatcher:dispatch', this.currentController, params, route, options);
  };

  Dispatcher.prototype.executeBeforeAction = function(controller, route, params, options) {
    var before, executeAction, promise,
      _this = this;
    before = controller.beforeAction;
    executeAction = function() {
      if (controller.redirected || _this.currentRoute && route === _this.currentRoute) {
        _this.nextPreviousRoute = _this.nextCurrentRoute = null;
        controller.dispose();
        return;
      }
      _this.previousRoute = _this.nextPreviousRoute;
      _this.currentRoute = _this.nextCurrentRoute;
      _this.nextPreviousRoute = _this.nextCurrentRoute = null;
      return _this.executeAction(controller, route, params, options);
    };
    if (!before) {
      executeAction();
      return;
    }
    if (typeof before !== 'function') {
      throw new TypeError('Controller#beforeAction: function expected. ' + 'Old object-like form is not supported.');
    }
    promise = controller.beforeAction(params, route, options);
    if (promise && promise.then) {
      return promise.then(executeAction);
    } else {
      return executeAction();
    }
  };

  Dispatcher.prototype.disposed = false;

  Dispatcher.prototype.dispose = function() {
    if (this.disposed) {
      return;
    }
    this.unsubscribeAllEvents();
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Dispatcher;

})();

});;loader.register('chaplin/composer', function(e, r, module) {
'use strict';

var Backbone, Composer, Composition, EventBroker, mediator, utils, _;

_ = loader('underscore');

Backbone = loader('backbone');

mediator = loader('chaplin/mediator');

utils = loader('chaplin/lib/utils');

Composition = loader('chaplin/lib/composition');

EventBroker = loader('chaplin/lib/event_broker');

module.exports = Composer = (function() {

  Composer.extend = Backbone.Model.extend;

  _.extend(Composer.prototype, EventBroker);

  Composer.prototype.compositions = null;

  function Composer() {
    this.initialize.apply(this, arguments);
  }

  Composer.prototype.initialize = function(options) {
    if (options == null) {
      options = {};
    }
    this.compositions = {};
    mediator.setHandler('composer:compose', this.compose, this);
    mediator.setHandler('composer:retrieve', this.retrieve, this);
    return this.subscribeEvent('dispatcher:dispatch', this.cleanup);
  };

  Composer.prototype.compose = function(name, second, third) {
    if (typeof second === 'function') {
      if (third || second.prototype.dispose) {
        if (second.prototype instanceof Composition) {
          return this._compose(name, {
            composition: second,
            options: third
          });
        } else {
          return this._compose(name, {
            options: third,
            compose: function() {
              var autoRender, disabledAutoRender;
              if (second.prototype instanceof Backbone.Model || second.prototype instanceof Backbone.Collection) {
                this.item = new second(null, this.options);
              } else {
                this.item = new second(this.options);
              }
              autoRender = this.item.autoRender;
              disabledAutoRender = autoRender === void 0 || !autoRender;
              if (disabledAutoRender && typeof this.item.render === 'function') {
                return this.item.render();
              }
            }
          });
        }
      }
      return this._compose(name, {
        compose: second
      });
    }
    if (typeof third === 'function') {
      return this._compose(name, {
        compose: third,
        options: second
      });
    }
    return this._compose(name, second);
  };

  Composer.prototype._compose = function(name, options) {
    var composition, current, isPromise, returned;
    if (typeof options.compose !== 'function' && !(options.composition != null)) {
      throw new Error('Composer#compose was used incorrectly');
    }
    if (options.composition != null) {
      composition = new options.composition(options.options);
    } else {
      composition = new Composition(options.options);
      composition.compose = options.compose;
      if (options.check) {
        composition.check = options.check;
      }
    }
    current = this.compositions[name];
    isPromise = false;
    if (current && current.check(composition.options)) {
      current.stale(false);
    } else {
      if (current) {
        current.dispose();
      }
      returned = composition.compose(composition.options);
      isPromise = typeof (returned != null ? returned.then : void 0) === 'function';
      composition.stale(false);
      this.compositions[name] = composition;
    }
    if (isPromise) {
      return returned;
    } else {
      return this.compositions[name].item;
    }
  };

  Composer.prototype.retrieve = function(name) {
    var active;
    active = this.compositions[name];
    if (active && !active.stale()) {
      return active.item;
    } else {
      return void 0;
    }
  };

  Composer.prototype.cleanup = function() {
    var composition, name, _ref;
    _ref = this.compositions;
    for (name in _ref) {
      composition = _ref[name];
      if (composition.stale()) {
        composition.dispose();
        delete this.compositions[name];
      } else {
        composition.stale(true);
      }
    }
  };

  Composer.prototype.dispose = function() {
    var composition, name, _ref;
    if (this.disposed) {
      return;
    }
    this.unsubscribeAllEvents();
    mediator.removeHandlers(this);
    _ref = this.compositions;
    for (name in _ref) {
      composition = _ref[name];
      composition.dispose();
    }
    delete this.compositions;
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Composer;

})();

});;loader.register('chaplin/controllers/controller', function(e, r, module) {
'use strict';

var Backbone, Controller, EventBroker, mediator, utils, _,
  __slice = [].slice,
  __hasProp = {}.hasOwnProperty;

_ = loader('underscore');

Backbone = loader('backbone');

EventBroker = loader('chaplin/lib/event_broker');

utils = loader('chaplin/lib/utils');

mediator = loader('chaplin/mediator');

module.exports = Controller = (function() {

  Controller.extend = Backbone.Model.extend;

  _.extend(Controller.prototype, Backbone.Events);

  _.extend(Controller.prototype, EventBroker);

  Controller.prototype.view = null;

  Controller.prototype.redirected = false;

  function Controller() {
    this.initialize.apply(this, arguments);
  }

  Controller.prototype.initialize = function() {};

  Controller.prototype.beforeAction = function() {};

  Controller.prototype.adjustTitle = function(subtitle) {
    return mediator.execute('adjustTitle', subtitle);
  };

  Controller.prototype.reuse = function(name) {
    var method;
    method = arguments.length === 1 ? 'retrieve' : 'compose';
    return mediator.execute.apply(mediator, ["composer:" + method].concat(__slice.call(arguments)));
  };

  Controller.prototype.compose = function() {
    throw new Error('Controller#compose was moved to Controller#reuse');
  };

  Controller.prototype.redirectTo = function(pathDesc, params, options) {
    this.redirected = true;
    return utils.redirectTo(pathDesc, params, options);
  };

  Controller.prototype.disposed = false;

  Controller.prototype.dispose = function() {
    var obj, prop;
    if (this.disposed) {
      return;
    }
    for (prop in this) {
      if (!__hasProp.call(this, prop)) continue;
      obj = this[prop];
      if (!(obj && typeof obj.dispose === 'function')) {
        continue;
      }
      obj.dispose();
      delete this[prop];
    }
    this.unsubscribeAllEvents();
    this.stopListening();
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Controller;

})();

});;loader.register('chaplin/models/collection', function(e, r, module) {
'use strict';

var Backbone, Collection, EventBroker, Model, utils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = loader('underscore');

Backbone = loader('backbone');

EventBroker = loader('chaplin/lib/event_broker');

Model = loader('chaplin/models/model');

utils = loader('chaplin/lib/utils');

module.exports = Collection = (function(_super) {

  __extends(Collection, _super);

  function Collection() {
    return Collection.__super__.constructor.apply(this, arguments);
  }

  _.extend(Collection.prototype, EventBroker);

  Collection.prototype.model = Model;

  Collection.prototype.serialize = function() {
    return this.map(utils.serialize);
  };

  Collection.prototype.disposed = false;

  Collection.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) {
      return;
    }
    this.trigger('dispose', this);
    this.reset([], {
      silent: true
    });
    this.unsubscribeAllEvents();
    this.stopListening();
    this.off();
    properties = ['model', 'models', '_byId', '_byCid', '_callbacks'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Collection;

})(Backbone.Collection);

});;loader.register('chaplin/models/model', function(e, r, module) {
'use strict';

var Backbone, EventBroker, Model, serializeAttributes, serializeModelAttributes, utils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = loader('underscore');

Backbone = loader('backbone');

utils = loader('chaplin/lib/utils');

EventBroker = loader('chaplin/lib/event_broker');

serializeAttributes = function(model, attributes, modelStack) {
  var delegator, key, otherModel, serializedModels, value, _i, _len, _ref;
  delegator = utils.beget(attributes);
  if (modelStack == null) {
    modelStack = {};
  }
  modelStack[model.cid] = true;
  for (key in attributes) {
    value = attributes[key];
    if (value instanceof Backbone.Model) {
      delegator[key] = serializeModelAttributes(value, model, modelStack);
    } else if (value instanceof Backbone.Collection) {
      serializedModels = [];
      _ref = value.models;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        otherModel = _ref[_i];
        serializedModels.push(serializeModelAttributes(otherModel, model, modelStack));
      }
      delegator[key] = serializedModels;
    }
  }
  delete modelStack[model.cid];
  return delegator;
};

serializeModelAttributes = function(model, currentModel, modelStack) {
  var attributes;
  if (model === currentModel || model.cid in modelStack) {
    return null;
  }
  attributes = typeof model.getAttributes === 'function' ? model.getAttributes() : model.attributes;
  return serializeAttributes(model, attributes, modelStack);
};

module.exports = Model = (function(_super) {

  __extends(Model, _super);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  _.extend(Model.prototype, EventBroker);

  Model.prototype.getAttributes = function() {
    return this.attributes;
  };

  Model.prototype.serialize = function() {
    return serializeAttributes(this, this.getAttributes());
  };

  Model.prototype.disposed = false;

  Model.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) {
      return;
    }
    this.trigger('dispose', this);
    this.unsubscribeAllEvents();
    this.stopListening();
    this.off();
    properties = ['collection', 'attributes', 'changed', 'defaults', '_escapedAttributes', '_previousAttributes', '_silent', '_pending', '_callbacks'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Model;

})(Backbone.Model);

});;loader.register('chaplin/views/layout', function(e, r, module) {
'use strict';

var $, Backbone, EventBroker, Layout, View, mediator, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = loader('underscore');

Backbone = loader('backbone');

mediator = loader('chaplin/mediator');

utils = loader('chaplin/lib/utils');

EventBroker = loader('chaplin/lib/event_broker');

View = loader('chaplin/views/view');

$ = Backbone.$;

module.exports = Layout = (function(_super) {

  __extends(Layout, _super);

  Layout.prototype.el = 'body';

  Layout.prototype.keepElement = true;

  Layout.prototype.title = '';

  Layout.prototype.globalRegions = null;

  Layout.prototype.listen = {
    'beforeControllerDispose mediator': 'scroll'
  };

  function Layout(options) {
    if (options == null) {
      options = {};
    }
    this.openLink = __bind(this.openLink, this);

    this.globalRegions = [];
    this.title = options.title;
    if (options.regions) {
      this.regions = options.regions;
    }
    this.settings = _.defaults(options, {
      titleTemplate: function(data) {
        var st;
        st = data.subtitle ? "" + data.subtitle + " \u2013 " : '';
        return st + data.title;
      },
      openExternalToBlank: false,
      routeLinks: 'a, .go-to',
      skipRouting: '.noscript',
      scrollTo: [0, 0]
    });
    mediator.setHandler('region:show', this.showRegion, this);
    mediator.setHandler('region:register', this.registerRegionHandler, this);
    mediator.setHandler('region:unregister', this.unregisterRegionHandler, this);
    mediator.setHandler('region:find', this.regionByName, this);
    mediator.setHandler('adjustTitle', this.adjustTitle, this);
    Layout.__super__.constructor.apply(this, arguments);
    if (this.settings.routeLinks) {
      this.startLinkRouting();
    }
  }

  Layout.prototype.scroll = function() {
    var position;
    position = this.settings.scrollTo;
    if (position) {
      return window.scrollTo(position[0], position[1]);
    }
  };

  Layout.prototype.adjustTitle = function(subtitle) {
    var title,
      _this = this;
    if (subtitle == null) {
      subtitle = '';
    }
    title = this.settings.titleTemplate({
      title: this.title,
      subtitle: subtitle
    });
    setTimeout(function() {
      document.title = title;
      return _this.publishEvent('adjustTitle', subtitle, title);
    }, 50);
    return title;
  };

  Layout.prototype.startLinkRouting = function() {
    var route;
    route = this.settings.routeLinks;
    if (!route) {
      return;
    }
    if ($) {
      return this.$el.on('click', route, this.openLink);
    } else {
      return this.delegate('click', route, this.openLink);
    }
  };

  Layout.prototype.stopLinkRouting = function() {
    var route;
    route = this.settings.routeLinks;
    if ($) {
      if (route) {
        return this.$el.off('click', route);
      }
    } else {
      return this.undelegate('click', route, this.openLink);
    }
  };

  Layout.prototype.isExternalLink = function(link) {
    var _ref, _ref1;
    return link.target === '_blank' || link.rel === 'external' || ((_ref = link.protocol) !== 'http:' && _ref !== 'https:' && _ref !== 'file:') || ((_ref1 = link.hostname) !== location.hostname && _ref1 !== '');
  };

  Layout.prototype.openLink = function(event) {
    var el, external, href, isAnchor, skipRouting, type;
    if (utils.modifierKeyPressed(event)) {
      return;
    }
    el = $ ? event.currentTarget : event.delegateTarget;
    isAnchor = el.nodeName === 'A';
    href = el.getAttribute('href') || el.getAttribute('data-href') || null;
    if (!(href != null) || href === '' || href.charAt(0) === '#') {
      return;
    }
    skipRouting = this.settings.skipRouting;
    type = typeof skipRouting;
    if (type === 'function' && !skipRouting(href, el) || type === 'string' && ($ ? $(el).is(skipRouting) : Backbone.utils.matchesSelector(el, skipRouting))) {
      return;
    }
    external = isAnchor && this.isExternalLink(el);
    if (external) {
      if (this.settings.openExternalToBlank) {
        event.preventDefault();
        window.open(href);
      }
      return;
    }
    utils.redirectTo({
      url: href
    });
    event.preventDefault();
  };

  Layout.prototype.registerRegionHandler = function(instance, name, selector) {
    if (name != null) {
      return this.registerGlobalRegion(instance, name, selector);
    } else {
      return this.registerGlobalRegions(instance);
    }
  };

  Layout.prototype.registerGlobalRegion = function(instance, name, selector) {
    this.unregisterGlobalRegion(instance, name);
    return this.globalRegions.unshift({
      instance: instance,
      name: name,
      selector: selector
    });
  };

  Layout.prototype.registerGlobalRegions = function(instance) {
    var name, selector, version, _i, _len, _ref;
    _ref = utils.getAllPropertyVersions(instance, 'regions');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      version = _ref[_i];
      for (name in version) {
        selector = version[name];
        this.registerGlobalRegion(instance, name, selector);
      }
    }
  };

  Layout.prototype.unregisterRegionHandler = function(instance, name) {
    if (name != null) {
      return this.unregisterGlobalRegion(instance, name);
    } else {
      return this.unregisterGlobalRegions(instance);
    }
  };

  Layout.prototype.unregisterGlobalRegion = function(instance, name) {
    var cid, region;
    cid = instance.cid;
    return this.globalRegions = (function() {
      var _i, _len, _ref, _results;
      _ref = this.globalRegions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        region = _ref[_i];
        if (region.instance.cid !== cid || region.name !== name) {
          _results.push(region);
        }
      }
      return _results;
    }).call(this);
  };

  Layout.prototype.unregisterGlobalRegions = function(instance) {
    var region;
    return this.globalRegions = (function() {
      var _i, _len, _ref, _results;
      _ref = this.globalRegions;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        region = _ref[_i];
        if (region.instance.cid !== instance.cid) {
          _results.push(region);
        }
      }
      return _results;
    }).call(this);
  };

  Layout.prototype.regionByName = function(name) {
    var reg, _i, _len, _ref;
    _ref = this.globalRegions;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      reg = _ref[_i];
      if (reg.name === name && !reg.instance.stale) {
        return reg;
      }
    }
  };

  Layout.prototype.showRegion = function(name, instance) {
    var region;
    region = this.regionByName(name);
    if (!region) {
      throw new Error("No region registered under " + name);
    }
    return instance.container = region.selector === '' ? $ ? region.instance.$el : region.instance.el : region.instance.noWrap ? $ ? $(region.instance.container).find(region.selector) : region.instance.container.querySelector(region.selector) : region.instance[$ ? '$' : 'find'](region.selector);
  };

  Layout.prototype.dispose = function() {
    var prop, _i, _len, _ref;
    if (this.disposed) {
      return;
    }
    this.stopLinkRouting();
    _ref = ['globalRegions', 'title', 'route'];
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      prop = _ref[_i];
      delete this[prop];
    }
    mediator.removeHandlers(this);
    return Layout.__super__.dispose.apply(this, arguments);
  };

  return Layout;

})(View);

});;loader.register('chaplin/views/view', function(e, r, module) {
'use strict';

var $, Backbone, EventBroker, View, attach, bind, mediator, setHTML, utils, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

_ = loader('underscore');

Backbone = loader('backbone');

mediator = loader('chaplin/mediator');

EventBroker = loader('chaplin/lib/event_broker');

utils = loader('chaplin/lib/utils');

$ = Backbone.$;

bind = (function() {
  if (Function.prototype.bind) {
    return function(item, ctx) {
      return item.bind(ctx);
    };
  } else if (_.bind) {
    return _.bind;
  }
})();

setHTML = (function() {
  if ($) {
    return function(elem, html) {
      return elem.html(html);
    };
  } else {
    return function(elem, html) {
      return elem.innerHTML = html;
    };
  }
})();

attach = (function() {
  if ($) {
    return function(view) {
      var actual;
      actual = $(view.container);
      if (typeof view.containerMethod === 'function') {
        return view.containerMethod(actual, view.el);
      } else {
        return actual[view.containerMethod](view.el);
      }
    };
  } else {
    return function(view) {
      var actual;
      actual = typeof view.container === 'string' ? document.querySelector(view.container) : view.container;
      if (typeof view.containerMethod === 'function') {
        return view.containerMethod(actual, view.el);
      } else {
        return actual[view.containerMethod](view.el);
      }
    };
  }
})();

module.exports = View = (function(_super) {

  __extends(View, _super);

  _.extend(View.prototype, EventBroker);

  View.prototype.autoRender = false;

  View.prototype.autoAttach = true;

  View.prototype.container = null;

  View.prototype.containerMethod = $ ? 'append' : 'appendChild';

  View.prototype.regions = null;

  View.prototype.region = null;

  View.prototype.stale = false;

  View.prototype.noWrap = false;

  View.prototype.keepElement = false;

  View.prototype.subviews = null;

  View.prototype.subviewsByName = null;

  View.prototype.optionNames = ['autoAttach', 'autoRender', 'container', 'containerMethod', 'region', 'regions', 'noWrap'];

  function View(options) {
    var optName, optValue, region, render,
      _this = this;
    if (options) {
      for (optName in options) {
        optValue = options[optName];
        if (__indexOf.call(this.optionNames, optName) >= 0) {
          this[optName] = optValue;
        }
      }
    }
    render = this.render;
    this.render = function() {
      if (_this.disposed) {
        return false;
      }
      render.apply(_this, arguments);
      if (_this.autoAttach) {
        _this.attach.apply(_this, arguments);
      }
      return _this;
    };
    this.subviews = [];
    this.subviewsByName = {};
    if (this.noWrap) {
      if (this.region) {
        region = mediator.execute('region:find', this.region);
        if (region != null) {
          this.el = region.instance.container != null ? region.instance.region != null ? $(region.instance.container).find(region.selector) : region.instance.container : region.instance.$(region.selector);
        }
      }
      if (this.container) {
        this.el = this.container;
      }
    }
    View.__super__.constructor.apply(this, arguments);
    this.delegateListeners();
    if (this.model) {
      this.listenTo(this.model, 'dispose', this.dispose);
    }
    if (this.collection) {
      this.listenTo(this.collection, 'dispose', function(subject) {
        if (!subject || subject === _this.collection) {
          return _this.dispose();
        }
      });
    }
    if (this.regions != null) {
      mediator.execute('region:register', this);
    }
    if (this.autoRender) {
      this.render();
    }
  }

  View.prototype.delegate = function(eventName, second, third) {
    var bound, event, events, handler, list, selector;
    if (Backbone.utils) {
      return Backbone.utils.delegate(this, eventName, second, third);
    }
    if (typeof eventName !== 'string') {
      throw new TypeError('View#delegate: first argument must be a string');
    }
    if (arguments.length === 2) {
      handler = second;
    } else if (arguments.length === 3) {
      selector = second;
      if (typeof selector !== 'string') {
        throw new TypeError('View#delegate: ' + 'second argument must be a string');
      }
      handler = third;
    } else {
      throw new TypeError('View#delegate: ' + 'only two or three arguments are allowed');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('View#delegate: ' + 'handler argument must be function');
    }
    list = (function() {
      var _i, _len, _ref, _results;
      _ref = eventName.split(' ');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        event = _ref[_i];
        _results.push("" + event + ".delegate" + this.cid);
      }
      return _results;
    }).call(this);
    events = list.join(' ');
    bound = bind(handler, this);
    this.$el.on(events, selector || null, bound);
    return bound;
  };

  View.prototype._delegateEvents = function(events) {
    var bound, eventName, handler, key, match, selector, value;
    if (Backbone.View.prototype.delegateEvents.length === 2) {
      return Backbone.View.prototype.delegateEvents.call(this, events, true);
    }
    for (key in events) {
      value = events[key];
      handler = typeof value === 'function' ? value : this[value];
      if (!handler) {
        throw new Error("Method '" + value + "' does not exist");
      }
      match = key.match(/^(\S+)\s*(.*)$/);
      eventName = "" + match[1] + ".delegateEvents" + this.cid;
      selector = match[2];
      bound = bind(handler, this);
      this.$el.on(eventName, selector || null, bound);
    }
  };

  View.prototype.delegateEvents = function(events, keepOld) {
    var classEvents, _i, _len, _ref;
    if (!keepOld) {
      this.undelegateEvents();
    }
    if (events) {
      return this._delegateEvents(events);
    }
    _ref = utils.getAllPropertyVersions(this, 'events');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      classEvents = _ref[_i];
      if (typeof classEvents === 'function') {
        classEvents = classEvents.call(this);
      }
      this._delegateEvents(classEvents);
    }
  };

  View.prototype.undelegate = function(eventName, second, third) {
    var event, events, handler, list, selector;
    if (Backbone.utils) {
      return Backbone.utils.undelegate(this, eventName, second, third);
    }
    if (eventName) {
      if (typeof eventName !== 'string') {
        throw new TypeError('View#undelegate: first argument must be a string');
      }
      if (arguments.length === 2) {
        if (typeof second === 'string') {
          selector = second;
        } else {
          handler = second;
        }
      } else if (arguments.length === 3) {
        selector = second;
        if (typeof selector !== 'string') {
          throw new TypeError('View#undelegate: ' + 'second argument must be a string');
        }
        handler = third;
      }
      list = (function() {
        var _i, _len, _ref, _results;
        _ref = eventName.split(' ');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          event = _ref[_i];
          _results.push("" + event + ".delegate" + this.cid);
        }
        return _results;
      }).call(this);
      events = list.join(' ');
      return this.$el.off(events, selector || null);
    } else {
      return this.$el.off(".delegate" + this.cid);
    }
  };

  View.prototype.delegateListeners = function() {
    var eventName, key, method, target, version, _i, _len, _ref, _ref1;
    if (!this.listen) {
      return;
    }
    _ref = utils.getAllPropertyVersions(this, 'listen');
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      version = _ref[_i];
      if (typeof version === 'function') {
        version = version.call(this);
      }
      for (key in version) {
        method = version[key];
        if (typeof method !== 'function') {
          method = this[method];
        }
        if (typeof method !== 'function') {
          throw new Error('View#delegateListeners: ' + ("listener for \"" + key + "\" must be function"));
        }
        _ref1 = key.split(' '), eventName = _ref1[0], target = _ref1[1];
        this.delegateListener(eventName, target, method);
      }
    }
  };

  View.prototype.delegateListener = function(eventName, target, callback) {
    var prop;
    if (target === 'model' || target === 'collection') {
      prop = this[target];
      if (prop) {
        this.listenTo(prop, eventName, callback);
      }
    } else if (target === 'mediator') {
      this.subscribeEvent(eventName, callback);
    } else if (!target) {
      this.on(eventName, callback, this);
    }
  };

  View.prototype.registerRegion = function(name, selector) {
    return mediator.execute('region:register', this, name, selector);
  };

  View.prototype.unregisterRegion = function(name) {
    return mediator.execute('region:unregister', this, name);
  };

  View.prototype.unregisterAllRegions = function() {
    return mediator.execute({
      name: 'region:unregister',
      silent: true
    }, this);
  };

  View.prototype.subview = function(name, view) {
    var byName, subviews;
    subviews = this.subviews;
    byName = this.subviewsByName;
    if (name && view) {
      this.removeSubview(name);
      subviews.push(view);
      byName[name] = view;
      return view;
    } else if (name) {
      return byName[name];
    }
  };

  View.prototype.removeSubview = function(nameOrView) {
    var byName, index, name, otherName, otherView, subviews, view;
    if (!nameOrView) {
      return;
    }
    subviews = this.subviews;
    byName = this.subviewsByName;
    if (typeof nameOrView === 'string') {
      name = nameOrView;
      view = byName[name];
    } else {
      view = nameOrView;
      for (otherName in byName) {
        otherView = byName[otherName];
        if (!(otherView === view)) {
          continue;
        }
        name = otherName;
        break;
      }
    }
    if (!(name && view && view.dispose)) {
      return;
    }
    view.dispose();
    index = utils.indexOf(subviews, view);
    if (index !== -1) {
      subviews.splice(index, 1);
    }
    return delete byName[name];
  };

  View.prototype.getTemplateData = function() {
    var data, source;
    data = this.model ? utils.serialize(this.model) : this.collection ? {
      items: utils.serialize(this.collection),
      length: this.collection.length
    } : {};
    source = this.model || this.collection;
    if (source) {
      if (typeof source.isSynced === 'function' && !('synced' in data)) {
        data.synced = source.isSynced();
      }
    }
    return data;
  };

  View.prototype.getTemplateFunction = function() {
    throw new Error('View#getTemplateFunction must be overridden');
  };

  View.prototype.render = function() {
    var el, html, templateFunc;
    if (this.disposed) {
      return false;
    }
    templateFunc = this.getTemplateFunction();
    if (typeof templateFunc === 'function') {
      html = templateFunc(this.getTemplateData());
      if (this.noWrap) {
        el = document.createElement('div');
        el.innerHTML = html;
        if (el.children.length > 1) {
          throw new Error('There must be a single top-level element when ' + 'using `noWrap`.');
        }
        this.undelegateEvents();
        this.setElement(el.firstChild, true);
      } else {
        setHTML(($ ? this.$el : this.el), html);
      }
    }
    return this;
  };

  View.prototype.attach = function() {
    if (this.region != null) {
      mediator.execute('region:show', this.region, this);
    }
    if (this.container && !document.body.contains(this.el)) {
      attach(this);
      return this.trigger('addedToDOM');
    }
  };

  View.prototype.disposed = false;

  View.prototype.dispose = function() {
    var prop, properties, subview, _i, _j, _len, _len1, _ref;
    if (this.disposed) {
      return;
    }
    this.unregisterAllRegions();
    _ref = this.subviews;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      subview = _ref[_i];
      subview.dispose();
    }
    this.unsubscribeAllEvents();
    this.off();
    if (this.keepElement) {
      this.undelegateEvents();
      this.undelegate();
      this.stopListening();
    } else {
      this.remove();
    }
    properties = ['el', '$el', 'options', 'model', 'collection', 'subviews', 'subviewsByName', '_callbacks'];
    for (_j = 0, _len1 = properties.length; _j < _len1; _j++) {
      prop = properties[_j];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return View;

})(Backbone.View);

});;loader.register('chaplin/views/collection_view', function(e, r, module) {
'use strict';

var $, Backbone, CollectionView, View, addClass, endAnimation, filterChildren, insertView, startAnimation, toggleElement, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = loader('underscore');

Backbone = loader('backbone');

View = loader('chaplin/views/view');

utils = loader('chaplin/lib/utils');

$ = Backbone.$;

filterChildren = function(nodeList, selector) {
  var node, _i, _len, _results;
  if (!selector) {
    return nodeList;
  }
  _results = [];
  for (_i = 0, _len = nodeList.length; _i < _len; _i++) {
    node = nodeList[_i];
    if (Backbone.utils.matchesSelector(node, selector)) {
      _results.push(node);
    }
  }
  return _results;
};

toggleElement = (function() {
  if ($) {
    return function(elem, visible) {
      return elem.toggle(visible);
    };
  } else {
    return function(elem, visible) {
      return elem.style.display = (visible ? '' : 'none');
    };
  }
})();

addClass = (function() {
  if ($) {
    return function(elem, cls) {
      return elem.addClass(cls);
    };
  } else {
    return function(elem, cls) {
      return elem.classList.add(cls);
    };
  }
})();

startAnimation = (function() {
  if ($) {
    return function(elem, useCssAnimation, cls) {
      if (useCssAnimation) {
        return addClass(elem, cls);
      } else {
        return elem.css('opacity', 0);
      }
    };
  } else {
    return function(elem, useCssAnimation, cls) {
      if (useCssAnimation) {
        return addClass(elem, cls);
      } else {
        return elem.style.opacity = 0;
      }
    };
  }
})();

endAnimation = (function() {
  if ($) {
    return function(elem, duration) {
      return elem.animate({
        opacity: 1
      }, duration);
    };
  } else {
    return function(elem, duration) {
      elem.style.transition = "opacity " + (duration / 1000) + "s";
      return elem.opacity = 1;
    };
  }
})();

insertView = (function() {
  if ($) {
    return function(list, viewEl, position, length, itemSelector) {
      var children, childrenLength, insertInMiddle, isEnd, method;
      insertInMiddle = (0 < position && position < length);
      isEnd = function(length) {
        return length === 0 || position === length;
      };
      if (insertInMiddle || itemSelector) {
        children = list.children(itemSelector);
        childrenLength = children.length;
        if (children[position] !== viewEl) {
          if (isEnd(childrenLength)) {
            return list.append(viewEl);
          } else {
            if (position === 0) {
              return children.eq(position).before(viewEl);
            } else {
              return children.eq(position - 1).after(viewEl);
            }
          }
        }
      } else {
        method = isEnd(length) ? 'append' : 'prepend';
        return list[method](viewEl);
      }
    };
  } else {
    return function(list, viewEl, position, length, itemSelector) {
      var children, childrenLength, insertInMiddle, isEnd, last;
      insertInMiddle = (0 < position && position < length);
      isEnd = function(length) {
        return length === 0 || position === length;
      };
      if (insertInMiddle || itemSelector) {
        children = filterChildren(list.children, itemSelector);
        childrenLength = children.length;
        if (children[position] !== viewEl) {
          if (isEnd(childrenLength)) {
            return list.appendChild(viewEl);
          } else if (position === 0) {
            return list.insertBefore(viewEl, children[position]);
          } else {
            last = children[position - 1];
            if (list.lastChild === last) {
              return list.appendChild(viewEl);
            } else {
              return list.insertBefore(viewEl, last.nextElementSibling);
            }
          }
        }
      } else if (isEnd(length)) {
        return list.appendChild(viewEl);
      } else {
        return list.insertBefore(viewEl, list.firstChild);
      }
    };
  }
})();

module.exports = CollectionView = (function(_super) {

  __extends(CollectionView, _super);

  CollectionView.prototype.itemView = null;

  CollectionView.prototype.autoRender = true;

  CollectionView.prototype.renderItems = true;

  CollectionView.prototype.animationDuration = 500;

  CollectionView.prototype.useCssAnimation = false;

  CollectionView.prototype.animationStartClass = 'animated-item-view';

  CollectionView.prototype.animationEndClass = 'animated-item-view-end';

  CollectionView.prototype.listSelector = null;

  CollectionView.prototype.$list = null;

  CollectionView.prototype.fallbackSelector = null;

  CollectionView.prototype.$fallback = null;

  CollectionView.prototype.loadingSelector = null;

  CollectionView.prototype.$loading = null;

  CollectionView.prototype.itemSelector = null;

  CollectionView.prototype.filterer = null;

  CollectionView.prototype.filterCallback = function(view, included) {
    if ($) {
      view.$el.stop(true, true);
    }
    return toggleElement(($ ? view.$el : view.el), included);
  };

  CollectionView.prototype.visibleItems = null;

  CollectionView.prototype.optionNames = View.prototype.optionNames.concat(['renderItems', 'itemView']);

  function CollectionView(options) {
    this.renderAllItems = __bind(this.renderAllItems, this);

    this.toggleFallback = __bind(this.toggleFallback, this);

    this.itemsReset = __bind(this.itemsReset, this);

    this.itemRemoved = __bind(this.itemRemoved, this);

    this.itemAdded = __bind(this.itemAdded, this);
    this.visibleItems = [];
    CollectionView.__super__.constructor.apply(this, arguments);
  }

  CollectionView.prototype.initialize = function(options) {
    if (options == null) {
      options = {};
    }
    this.addCollectionListeners();
    if (options.filterer != null) {
      return this.filter(options.filterer);
    }
  };

  CollectionView.prototype.addCollectionListeners = function() {
    this.listenTo(this.collection, 'add', this.itemAdded);
    this.listenTo(this.collection, 'remove', this.itemRemoved);
    return this.listenTo(this.collection, 'reset sort', this.itemsReset);
  };

  CollectionView.prototype.getTemplateData = function() {
    var templateData;
    templateData = {
      length: this.collection.length
    };
    if (typeof this.collection.isSynced === 'function') {
      templateData.synced = this.collection.isSynced();
    }
    return templateData;
  };

  CollectionView.prototype.getTemplateFunction = function() {};

  CollectionView.prototype.render = function() {
    var listSelector;
    CollectionView.__super__.render.apply(this, arguments);
    listSelector = _.result(this, 'listSelector');
    if ($) {
      this.$list = listSelector ? this.$(listSelector) : this.$el;
    } else {
      this.list = listSelector ? this.find(this.listSelector) : this.el;
    }
    this.initFallback();
    this.initLoadingIndicator();
    if (this.renderItems) {
      return this.renderAllItems();
    }
  };

  CollectionView.prototype.itemAdded = function(item, collection, options) {
    return this.insertView(item, this.renderItem(item), options.at);
  };

  CollectionView.prototype.itemRemoved = function(item) {
    return this.removeViewForItem(item);
  };

  CollectionView.prototype.itemsReset = function() {
    return this.renderAllItems();
  };

  CollectionView.prototype.initFallback = function() {
    if (!this.fallbackSelector) {
      return;
    }
    if ($) {
      this.$fallback = this.$(this.fallbackSelector);
    } else {
      this.fallback = this.find(this.fallbackSelector);
    }
    this.on('visibilityChange', this.toggleFallback);
    this.listenTo(this.collection, 'syncStateChange', this.toggleFallback);
    return this.toggleFallback();
  };

  CollectionView.prototype.toggleFallback = function() {
    var visible;
    visible = this.visibleItems.length === 0 && (typeof this.collection.isSynced === 'function' ? this.collection.isSynced() : true);
    return toggleElement(($ ? this.$fallback : this.fallback), visible);
  };

  CollectionView.prototype.initLoadingIndicator = function() {
    if (!(this.loadingSelector && typeof this.collection.isSyncing === 'function')) {
      return;
    }
    if ($) {
      this.$loading = this.$(this.loadingSelector);
    } else {
      this.loading = this.find(this.loadingSelector);
    }
    this.listenTo(this.collection, 'syncStateChange', this.toggleLoadingIndicator);
    return this.toggleLoadingIndicator();
  };

  CollectionView.prototype.toggleLoadingIndicator = function() {
    var visible;
    visible = this.collection.length === 0 && this.collection.isSyncing();
    return toggleElement(($ ? this.$loading : this.loading), visible);
  };

  CollectionView.prototype.getItemViews = function() {
    var itemViews, name, view, _ref;
    itemViews = {};
    if (this.subviews.length > 0) {
      _ref = this.subviewsByName;
      for (name in _ref) {
        view = _ref[name];
        if (name.slice(0, 9) === 'itemView:') {
          itemViews[name.slice(9)] = view;
        }
      }
    }
    return itemViews;
  };

  CollectionView.prototype.filter = function(filterer, filterCallback) {
    var hasItemViews, included, index, item, view, _i, _len, _ref,
      _this = this;
    if (typeof filterer === 'function' || filterer === null) {
      this.filterer = filterer;
    }
    if (typeof filterCallback === 'function' || filterCallback === null) {
      this.filterCallback = filterCallback;
    }
    hasItemViews = (function() {
      var name;
      if (_this.subviews.length > 0) {
        for (name in _this.subviewsByName) {
          if (name.slice(0, 9) === 'itemView:') {
            return true;
          }
        }
      }
      return false;
    })();
    if (hasItemViews) {
      _ref = this.collection.models;
      for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
        item = _ref[index];
        included = typeof this.filterer === 'function' ? this.filterer(item, index) : true;
        view = this.subview("itemView:" + item.cid);
        if (!view) {
          throw new Error('CollectionView#filter: ' + ("no view found for " + item.cid));
        }
        this.filterCallback(view, included);
        this.updateVisibleItems(view.model, included, false);
      }
    }
    return this.trigger('visibilityChange', this.visibleItems);
  };

  CollectionView.prototype.renderAllItems = function() {
    var cid, index, item, items, remainingViewsByCid, view, _i, _j, _len, _len1, _ref;
    items = this.collection.models;
    this.visibleItems = [];
    remainingViewsByCid = {};
    for (_i = 0, _len = items.length; _i < _len; _i++) {
      item = items[_i];
      view = this.subview("itemView:" + item.cid);
      if (view) {
        remainingViewsByCid[item.cid] = view;
      }
    }
    _ref = this.getItemViews();
    for (cid in _ref) {
      if (!__hasProp.call(_ref, cid)) continue;
      view = _ref[cid];
      if (!(cid in remainingViewsByCid)) {
        this.removeSubview("itemView:" + cid);
      }
    }
    for (index = _j = 0, _len1 = items.length; _j < _len1; index = ++_j) {
      item = items[index];
      view = this.subview("itemView:" + item.cid);
      if (view) {
        this.insertView(item, view, index, false);
      } else {
        this.insertView(item, this.renderItem(item), index);
      }
    }
    if (items.length === 0) {
      return this.trigger('visibilityChange', this.visibleItems);
    }
  };

  CollectionView.prototype.renderItem = function(item) {
    var view;
    view = this.subview("itemView:" + item.cid);
    if (!view) {
      view = this.initItemView(item);
      this.subview("itemView:" + item.cid, view);
    }
    view.render();
    return view;
  };

  CollectionView.prototype.initItemView = function(model) {
    if (this.itemView) {
      return new this.itemView({
        autoRender: false,
        model: model
      });
    } else {
      throw new Error('The CollectionView#itemView property ' + 'must be defined or the initItemView() must be overridden.');
    }
  };

  CollectionView.prototype.insertView = function(item, view, position, enableAnimation) {
    var elem, included, length, list,
      _this = this;
    if (enableAnimation == null) {
      enableAnimation = true;
    }
    if (this.animationDuration === 0) {
      enableAnimation = false;
    }
    if (typeof position !== 'number') {
      position = this.collection.indexOf(item);
    }
    included = typeof this.filterer === 'function' ? this.filterer(item, position) : true;
    elem = $ ? view.$el : view.el;
    if (included && enableAnimation) {
      startAnimation(elem, this.useCssAnimation, this.animationStartClass);
    }
    if (this.filterer) {
      this.filterCallback(view, included);
    }
    length = this.collection.length;
    list = $ ? this.$list : this.list;
    insertView(list, elem, position, length, this.itemSelector);
    view.trigger('addedToParent');
    this.updateVisibleItems(item, included);
    if (included && enableAnimation) {
      if (this.useCssAnimation) {
        setTimeout((function() {
          return addClass(elem, _this.animationEndClass);
        }), 0);
      } else {
        endAnimation(elem, this.animationDuration);
      }
    }
    return view;
  };

  CollectionView.prototype.removeViewForItem = function(item) {
    this.updateVisibleItems(item, false);
    return this.removeSubview("itemView:" + item.cid);
  };

  CollectionView.prototype.updateVisibleItems = function(item, includedInFilter, triggerEvent) {
    var includedInVisibleItems, visibilityChanged, visibleItemsIndex;
    if (triggerEvent == null) {
      triggerEvent = true;
    }
    visibilityChanged = false;
    visibleItemsIndex = utils.indexOf(this.visibleItems, item);
    includedInVisibleItems = visibleItemsIndex !== -1;
    if (includedInFilter && !includedInVisibleItems) {
      this.visibleItems.push(item);
      visibilityChanged = true;
    } else if (!includedInFilter && includedInVisibleItems) {
      this.visibleItems.splice(visibleItemsIndex, 1);
      visibilityChanged = true;
    }
    if (visibilityChanged && triggerEvent) {
      this.trigger('visibilityChange', this.visibleItems);
    }
    return visibilityChanged;
  };

  CollectionView.prototype.dispose = function() {
    var prop, properties, _i, _len;
    if (this.disposed) {
      return;
    }
    properties = ['$list', '$fallback', '$loading', 'visibleItems'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    return CollectionView.__super__.dispose.apply(this, arguments);
  };

  return CollectionView;

})(View);

});;loader.register('chaplin/lib/route', function(e, r, module) {
'use strict';

var Backbone, Controller, EventBroker, Route, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  __hasProp = {}.hasOwnProperty;

_ = loader('underscore');

Backbone = loader('backbone');

EventBroker = loader('chaplin/lib/event_broker');

Controller = loader('chaplin/controllers/controller');

utils = loader('chaplin/lib/utils');

module.exports = Route = (function() {
  var escapeRegExp, optionalRegExp, paramRegExp, processTrailingSlash;

  Route.extend = Backbone.Model.extend;

  _.extend(Route.prototype, EventBroker);

  escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g;

  optionalRegExp = /\((.*?)\)/g;

  paramRegExp = /(?::|\*)(\w+)/g;

  processTrailingSlash = function(path, trailing) {
    switch (trailing) {
      case true:
        if (path.slice(-1) !== '/') {
          path += '/';
        }
        break;
      case false:
        if (path.slice(-1) === '/') {
          path = path.slice(0, -1);
        }
    }
    return path;
  };

  function Route(pattern, controller, action, options) {
    var _ref;
    this.pattern = pattern;
    this.controller = controller;
    this.action = action;
    this.handler = __bind(this.handler, this);

    this.replaceParams = __bind(this.replaceParams, this);

    this.parseOptionalPortion = __bind(this.parseOptionalPortion, this);

    if (typeof this.pattern !== 'string') {
      throw new Error('Route: RegExps are not supported.\
        Use strings with :names and `constraints` option of route');
    }
    this.options = options ? _.extend({}, options) : {};
    if (this.options.paramsInQS !== false) {
      this.options.paramsInQS = true;
    }
    if (this.options.name != null) {
      this.name = this.options.name;
    }
    if (this.name && this.name.indexOf('#') !== -1) {
      throw new Error('Route: "#" cannot be used in name');
    }
    if ((_ref = this.name) == null) {
      this.name = this.controller + '#' + this.action;
    }
    this.allParams = [];
    this.requiredParams = [];
    this.optionalParams = [];
    if (this.action in Controller.prototype) {
      throw new Error('Route: You should not use existing controller ' + 'properties as action names');
    }
    this.createRegExp();
    if (typeof Object.freeze === "function") {
      Object.freeze(this);
    }
  }

  Route.prototype.matches = function(criteria) {
    var invalidParamsCount, name, propertiesCount, property, _i, _len, _ref;
    if (typeof criteria === 'string') {
      return criteria === this.name;
    } else {
      propertiesCount = 0;
      _ref = ['name', 'action', 'controller'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        name = _ref[_i];
        propertiesCount++;
        property = criteria[name];
        if (property && property !== this[name]) {
          return false;
        }
      }
      invalidParamsCount = propertiesCount === 1 && (name === 'action' || name === 'controller');
      return !invalidParamsCount;
    }
  };

  Route.prototype.reverse = function(params, query) {
    var name, raw, remainingParams, url, value, _i, _j, _len, _len1, _ref, _ref1;
    params = this.normalizeParams(params);
    remainingParams = _.extend({}, params);
    if (params === false) {
      return false;
    }
    url = this.pattern;
    _ref = this.requiredParams;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      name = _ref[_i];
      value = params[name];
      url = url.replace(RegExp("[:*]" + name, "g"), value);
      delete remainingParams[name];
    }
    _ref1 = this.optionalParams;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      name = _ref1[_j];
      if (value = params[name]) {
        url = url.replace(RegExp("[:*]" + name, "g"), value);
        delete remainingParams[name];
      }
    }
    raw = url.replace(optionalRegExp, function(match, portion) {
      if (portion.match(/[:*]/g)) {
        return "";
      } else {
        return portion;
      }
    });
    url = processTrailingSlash(raw, this.options.trailing);
    if (typeof query !== 'object') {
      query = utils.queryParams.parse(query);
    }
    if (this.options.paramsInQS !== false) {
      _.extend(query, remainingParams);
    }
    if (!_.isEmpty(query)) {
      url += '?' + utils.queryParams.stringify(query);
    }
    return url;
  };

  Route.prototype.normalizeParams = function(params) {
    var paramIndex, paramName, paramsHash, _i, _len, _ref;
    if (utils.isArray(params)) {
      if (params.length < this.requiredParams.length) {
        return false;
      }
      paramsHash = {};
      _ref = this.requiredParams;
      for (paramIndex = _i = 0, _len = _ref.length; _i < _len; paramIndex = ++_i) {
        paramName = _ref[paramIndex];
        paramsHash[paramName] = params[paramIndex];
      }
      if (!this.testConstraints(paramsHash)) {
        return false;
      }
      params = paramsHash;
    } else {
      if (params == null) {
        params = {};
      }
      if (!this.testParams(params)) {
        return false;
      }
    }
    return params;
  };

  Route.prototype.testConstraints = function(params) {
    var constraint, constraints, name;
    constraints = this.options.constraints;
    if (constraints) {
      for (name in constraints) {
        if (!__hasProp.call(constraints, name)) continue;
        constraint = constraints[name];
        if (!constraint.test(params[name])) {
          return false;
        }
      }
    }
    return true;
  };

  Route.prototype.testParams = function(params) {
    var paramName, _i, _len, _ref;
    _ref = this.requiredParams;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      paramName = _ref[_i];
      if (params[paramName] === void 0) {
        return false;
      }
    }
    return this.testConstraints(params);
  };

  Route.prototype.createRegExp = function() {
    var pattern,
      _this = this;
    pattern = this.pattern;
    pattern = pattern.replace(escapeRegExp, '\\$&');
    this.replaceParams(pattern, function(match, param) {
      return _this.allParams.push(param);
    });
    pattern = pattern.replace(optionalRegExp, this.parseOptionalPortion);
    pattern = this.replaceParams(pattern, function(match, param) {
      _this.requiredParams.push(param);
      return _this.paramCapturePattern(match);
    });
    return this.regExp = RegExp("^" + pattern + "(?=\\/*(?=\\?|$))");
  };

  Route.prototype.parseOptionalPortion = function(match, optionalPortion) {
    var portion,
      _this = this;
    portion = this.replaceParams(optionalPortion, function(match, param) {
      _this.optionalParams.push(param);
      return _this.paramCapturePattern(match);
    });
    return "(?:" + portion + ")?";
  };

  Route.prototype.replaceParams = function(s, callback) {
    return s.replace(paramRegExp, callback);
  };

  Route.prototype.paramCapturePattern = function(param) {
    if (param.charAt(0) === ':') {
      return '([^\/\?]+)';
    } else {
      return '(.*?)';
    }
  };

  Route.prototype.test = function(path) {
    var constraints, matched;
    matched = this.regExp.test(path);
    if (!matched) {
      return false;
    }
    constraints = this.options.constraints;
    if (constraints) {
      return this.testConstraints(this.extractParams(path));
    }
    return true;
  };

  Route.prototype.handler = function(pathParams, options) {
    var actionParams, params, path, query, route, _ref;
    options = options ? _.extend({}, options) : {};
    if (typeof pathParams === 'object') {
      query = utils.queryParams.stringify(options.query);
      params = pathParams;
      path = this.reverse(params);
    } else {
      _ref = pathParams.split('?'), path = _ref[0], query = _ref[1];
      if (!(query != null)) {
        query = '';
      } else {
        options.query = utils.queryParams.parse(query);
      }
      params = this.extractParams(path);
      path = processTrailingSlash(path, this.options.trailing);
    }
    actionParams = _.extend({}, params, this.options.params);
    route = {
      path: path,
      action: this.action,
      controller: this.controller,
      name: this.name,
      query: query
    };
    return this.publishEvent('router:match', route, actionParams, options);
  };

  Route.prototype.extractParams = function(path) {
    var index, match, matches, paramName, params, _i, _len, _ref;
    params = {};
    matches = this.regExp.exec(path);
    _ref = matches.slice(1);
    for (index = _i = 0, _len = _ref.length; _i < _len; index = ++_i) {
      match = _ref[index];
      paramName = this.allParams.length ? this.allParams[index] : index;
      params[paramName] = match;
    }
    return params;
  };

  return Route;

})();

});;loader.register('chaplin/lib/router', function(e, r, module) {
'use strict';

var Backbone, EventBroker, History, Route, Router, mediator, utils, _,
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

_ = loader('underscore');

Backbone = loader('backbone');

mediator = loader('chaplin/mediator');

EventBroker = loader('chaplin/lib/event_broker');

History = loader('chaplin/lib/history');

Route = loader('chaplin/lib/route');

utils = loader('chaplin/lib/utils');

module.exports = Router = (function() {

  Router.extend = Backbone.Model.extend;

  _.extend(Router.prototype, EventBroker);

  function Router(options) {
    var isWebFile;
    this.options = options != null ? options : {};
    this.match = __bind(this.match, this);

    isWebFile = window.location.protocol !== 'file:';
    _.defaults(this.options, {
      pushState: isWebFile,
      root: '/',
      trailing: false
    });
    this.removeRoot = new RegExp('^' + utils.escapeRegExp(this.options.root) + '(#)?');
    this.subscribeEvent('!router:route', this.oldEventError);
    this.subscribeEvent('!router:routeByName', this.oldEventError);
    this.subscribeEvent('!router:changeURL', this.oldURLEventError);
    this.subscribeEvent('dispatcher:dispatch', this.changeURL);
    mediator.setHandler('router:route', this.route, this);
    mediator.setHandler('router:reverse', this.reverse, this);
    this.createHistory();
  }

  Router.prototype.oldEventError = function() {
    throw new Error('!router:route and !router:routeByName events were removed.\
  Use `Chaplin.utils.redirectTo`');
  };

  Router.prototype.oldURLEventError = function() {
    throw new Error('!router:changeURL event was removed.');
  };

  Router.prototype.createHistory = function() {
    return Backbone.history = new History();
  };

  Router.prototype.startHistory = function() {
    return Backbone.history.start(this.options);
  };

  Router.prototype.stopHistory = function() {
    if (Backbone.History.started) {
      return Backbone.history.stop();
    }
  };

  Router.prototype.findHandler = function(predicate) {
    var handler, _i, _len, _ref;
    _ref = Backbone.history.handlers;
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      handler = _ref[_i];
      if (predicate(handler)) {
        return handler;
      }
    }
  };

  Router.prototype.match = function(pattern, target, options) {
    var action, controller, route, _ref;
    if (options == null) {
      options = {};
    }
    if (arguments.length === 2 && typeof target === 'object') {
      options = target;
      controller = options.controller, action = options.action;
      if (!(controller && action)) {
        throw new Error('Router#match must receive either target or ' + 'options.controller & options.action');
      }
    } else {
      controller = options.controller, action = options.action;
      if (controller || action) {
        throw new Error('Router#match cannot use both target and ' + 'options.controller / options.action');
      }
      _ref = target.split('#'), controller = _ref[0], action = _ref[1];
    }
    _.defaults(options, {
      trailing: this.options.trailing
    });
    route = new Route(pattern, controller, action, options);
    Backbone.history.handlers.push({
      route: route,
      callback: route.handler
    });
    return route;
  };

  Router.prototype.route = function(pathDesc, params, options) {
    var handler, path, pathParams;
    if (typeof pathDesc === 'object') {
      path = pathDesc.url;
      if (!params && pathDesc.params) {
        params = pathDesc.params;
      }
    }
    params = params ? utils.isArray(params) ? params.slice() : _.extend({}, params) : {};
    if (path != null) {
      path = path.replace(this.removeRoot, '');
      handler = this.findHandler(function(handler) {
        return handler.route.test(path);
      });
      options = params;
      params = null;
    } else {
      options = options ? _.extend({}, options) : {};
      handler = this.findHandler(function(handler) {
        if (handler.route.matches(pathDesc)) {
          params = handler.route.normalizeParams(params);
          if (params) {
            return true;
          }
        }
        return false;
      });
    }
    if (handler) {
      _.defaults(options, {
        changeURL: true
      });
      pathParams = path != null ? path : params;
      handler.callback(pathParams, options);
      return true;
    } else {
      throw new Error('Router#route: request was not routed');
    }
  };

  Router.prototype.reverse = function(criteria, params, query) {
    var handler, handlers, reversed, root, url, _i, _len;
    root = this.options.root;
    if ((params != null) && typeof params !== 'object') {
      throw new TypeError('Router#reverse: params must be an array or an ' + 'object');
    }
    handlers = Backbone.history.handlers;
    for (_i = 0, _len = handlers.length; _i < _len; _i++) {
      handler = handlers[_i];
      if (!(handler.route.matches(criteria))) {
        continue;
      }
      reversed = handler.route.reverse(params, query);
      if (reversed !== false) {
        url = root ? root + reversed : reversed;
        return url;
      }
    }
    throw new Error("Router#reverse: invalid route criteria specified: " + (JSON.stringify(criteria)));
  };

  Router.prototype.changeURL = function(controller, params, route, options) {
    var navigateOptions, url;
    if (!((route.path != null) && options.changeURL)) {
      return;
    }
    url = route.path + (route.query ? "?" + route.query : "");
    navigateOptions = {
      trigger: options.trigger === true,
      replace: options.replace === true
    };
    return Backbone.history.navigate(url, navigateOptions);
  };

  Router.prototype.disposed = false;

  Router.prototype.dispose = function() {
    if (this.disposed) {
      return;
    }
    this.stopHistory();
    delete Backbone.history;
    this.unsubscribeAllEvents();
    mediator.removeHandlers(this);
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Router;

})();

});;loader.register('chaplin/lib/history', function(e, r, module) {
'use strict';

var Backbone, History, isExplorer, rootStripper, routeStripper, trailingSlash, _,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

_ = loader('underscore');

Backbone = loader('backbone');

routeStripper = /^[#\/]|\s+$/g;

rootStripper = /^\/+|\/+$/g;

isExplorer = /msie [\w.]+/;

trailingSlash = /\/$/;

History = (function(_super) {

  __extends(History, _super);

  function History() {
    return History.__super__.constructor.apply(this, arguments);
  }

  History.prototype.getFragment = function(fragment, forcePushState) {
    var root;
    if (!(fragment != null)) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = this.location.pathname + this.location.search;
        root = this.root.replace(trailingSlash, '');
        if (!fragment.indexOf(root)) {
          fragment = fragment.substr(root.length);
        }
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  };

  History.prototype.start = function(options) {
    var atRoot, fragment, loc, _ref, _ref1;
    if (Backbone.History.started) {
      throw new Error('Backbone.history has already been started');
    }
    Backbone.History.started = true;
    this.options = _.extend({}, {
      root: '/'
    }, this.options, options);
    this.root = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._wantsPushState = Boolean(this.options.pushState);
    this._hasPushState = Boolean(this.options.pushState && this.history && this.history.pushState);
    fragment = this.getFragment();
    routeStripper = (_ref = this.options.routeStripper) != null ? _ref : routeStripper;
    rootStripper = (_ref1 = this.options.rootStripper) != null ? _ref1 : rootStripper;
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');
    if (this._hasPushState) {
      Backbone.$(window).on('popstate', this.checkUrl);
    } else if (this._wantsHashChange && 'onhashchange' in window) {
      Backbone.$(window).on('hashchange', this.checkUrl);
    } else if (this._wantsHashChange) {
      this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
    }
    this.fragment = fragment;
    loc = this.location;
    atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;
    if (this._wantsHashChange && this._wantsPushState && !this._hasPushState && !atRoot) {
      this.fragment = this.getFragment(null, true);
      this.location.replace(this.root + '#' + this.fragment);
      return true;
    } else if (this._wantsPushState && this._hasPushState && atRoot && loc.hash) {
      this.fragment = this.getHash().replace(routeStripper, '');
      this.history.replaceState({}, document.title, this.root + this.fragment);
    }
    if (!this.options.silent) {
      return this.loadUrl();
    }
  };

  History.prototype.navigate = function(fragment, options) {
    var historyMethod, isSameFragment, url;
    if (fragment == null) {
      fragment = '';
    }
    if (!Backbone.History.started) {
      return false;
    }
    if (!options || options === true) {
      options = {
        trigger: options
      };
    }
    fragment = this.getFragment(fragment);
    url = this.root + fragment;
    if (this.fragment === fragment) {
      return false;
    }
    this.fragment = fragment;
    if (fragment.length === 0 && url !== '/' && (url !== this.root || this.options.trailing !== true)) {
      url = url.slice(0, -1);
    }
    if (this._hasPushState) {
      historyMethod = options.replace ? 'replaceState' : 'pushState';
      this.history[historyMethod]({}, document.title, url);
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
      isSameFragment = fragment !== this.getFragment(this.getHash(this.iframe));
      if ((this.iframe != null) && isSameFragment) {
        if (!options.replace) {
          this.iframe.document.open().close();
        }
        this._updateHash(this.iframe.location, fragment, options.replace);
      }
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) {
      return this.loadUrl(fragment);
    }
  };

  return History;

})(Backbone.History);

module.exports = Backbone.$ ? History : Backbone.History;

});;loader.register('chaplin/lib/event_broker', function(e, r, module) {
'use strict';

var EventBroker, mediator,
  __slice = [].slice;

mediator = loader('chaplin/mediator');

EventBroker = {
  subscribeEvent: function(type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('EventBroker#subscribeEvent: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('EventBroker#subscribeEvent: ' + 'handler argument must be a function');
    }
    mediator.unsubscribe(type, handler, this);
    return mediator.subscribe(type, handler, this);
  },
  subscribeEventOnce: function(type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('EventBroker#subscribeEventOnce: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('EventBroker#subscribeEventOnce: ' + 'handler argument must be a function');
    }
    mediator.unsubscribe(type, handler, this);
    return mediator.subscribeOnce(type, handler, this);
  },
  unsubscribeEvent: function(type, handler) {
    if (typeof type !== 'string') {
      throw new TypeError('EventBroker#unsubscribeEvent: ' + 'type argument must be a string');
    }
    if (typeof handler !== 'function') {
      throw new TypeError('EventBroker#unsubscribeEvent: ' + 'handler argument must be a function');
    }
    return mediator.unsubscribe(type, handler);
  },
  unsubscribeAllEvents: function() {
    return mediator.unsubscribe(null, null, this);
  },
  publishEvent: function() {
    var args, type;
    type = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    if (typeof type !== 'string') {
      throw new TypeError('EventBroker#publishEvent: ' + 'type argument must be a string');
    }
    return mediator.publish.apply(mediator, [type].concat(__slice.call(args)));
  }
};

if (typeof Object.freeze === "function") {
  Object.freeze(EventBroker);
}

module.exports = EventBroker;

});;loader.register('chaplin/lib/support', function(e, r, module) {
'use strict';

var support;

support = {
  propertyDescriptors: (function() {
    var o;
    if (!(typeof Object.defineProperty === 'function' && typeof Object.defineProperties === 'function')) {
      return false;
    }
    try {
      o = {};
      Object.defineProperty(o, 'foo', {
        value: 'bar'
      });
      return o.foo === 'bar';
    } catch (error) {
      return false;
    }
  })()
};

module.exports = support;

});;loader.register('chaplin/lib/composition', function(e, r, module) {
'use strict';

var Backbone, Composition, EventBroker, has, _,
  __hasProp = {}.hasOwnProperty;

_ = loader('underscore');

Backbone = loader('backbone');

EventBroker = loader('chaplin/lib/event_broker');

has = Object.prototype.hasOwnProperty;

module.exports = Composition = (function() {

  Composition.extend = Backbone.Model.extend;

  _.extend(Composition.prototype, Backbone.Events);

  _.extend(Composition.prototype, EventBroker);

  Composition.prototype.item = null;

  Composition.prototype.options = null;

  Composition.prototype._stale = false;

  function Composition(options) {
    if (options != null) {
      this.options = _.extend({}, options);
    }
    this.item = this;
    this.initialize(this.options);
  }

  Composition.prototype.initialize = function() {};

  Composition.prototype.compose = function() {};

  Composition.prototype.check = function(options) {
    return _.isEqual(this.options, options);
  };

  Composition.prototype.stale = function(value) {
    var item, name;
    if (value == null) {
      return this._stale;
    }
    this._stale = value;
    for (name in this) {
      item = this[name];
      if (item && item !== this && typeof item === 'object' && has.call(item, 'stale')) {
        item.stale = value;
      }
    }
  };

  Composition.prototype.disposed = false;

  Composition.prototype.dispose = function() {
    var obj, prop, properties, _i, _len;
    if (this.disposed) {
      return;
    }
    for (prop in this) {
      if (!__hasProp.call(this, prop)) continue;
      obj = this[prop];
      if (obj && typeof obj.dispose === 'function') {
        if (obj !== this) {
          obj.dispose();
          delete this[prop];
        }
      }
    }
    this.unsubscribeAllEvents();
    this.stopListening();
    properties = ['redirected'];
    for (_i = 0, _len = properties.length; _i < _len; _i++) {
      prop = properties[_i];
      delete this[prop];
    }
    this.disposed = true;
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  return Composition;

})();

});;loader.register('chaplin/lib/sync_machine', function(e, r, module) {
'use strict';

var STATE_CHANGE, SYNCED, SYNCING, SyncMachine, UNSYNCED, event, _fn, _i, _len, _ref;

UNSYNCED = 'unsynced';

SYNCING = 'syncing';

SYNCED = 'synced';

STATE_CHANGE = 'syncStateChange';

SyncMachine = {
  _syncState: UNSYNCED,
  _previousSyncState: null,
  syncState: function() {
    return this._syncState;
  },
  isUnsynced: function() {
    return this._syncState === UNSYNCED;
  },
  isSynced: function() {
    return this._syncState === SYNCED;
  },
  isSyncing: function() {
    return this._syncState === SYNCING;
  },
  unsync: function() {
    var _ref;
    if ((_ref = this._syncState) === SYNCING || _ref === SYNCED) {
      this._previousSync = this._syncState;
      this._syncState = UNSYNCED;
      this.trigger(this._syncState, this, this._syncState);
      this.trigger(STATE_CHANGE, this, this._syncState);
    }
  },
  beginSync: function() {
    var _ref;
    if ((_ref = this._syncState) === UNSYNCED || _ref === SYNCED) {
      this._previousSync = this._syncState;
      this._syncState = SYNCING;
      this.trigger(this._syncState, this, this._syncState);
      this.trigger(STATE_CHANGE, this, this._syncState);
    }
  },
  finishSync: function() {
    if (this._syncState === SYNCING) {
      this._previousSync = this._syncState;
      this._syncState = SYNCED;
      this.trigger(this._syncState, this, this._syncState);
      this.trigger(STATE_CHANGE, this, this._syncState);
    }
  },
  abortSync: function() {
    if (this._syncState === SYNCING) {
      this._syncState = this._previousSync;
      this._previousSync = this._syncState;
      this.trigger(this._syncState, this, this._syncState);
      this.trigger(STATE_CHANGE, this, this._syncState);
    }
  }
};

_ref = [UNSYNCED, SYNCING, SYNCED, STATE_CHANGE];
_fn = function(event) {
  return SyncMachine[event] = function(callback, context) {
    if (context == null) {
      context = this;
    }
    this.on(event, callback, context);
    if (this._syncState === event) {
      return callback.call(context);
    }
  };
};
for (_i = 0, _len = _ref.length; _i < _len; _i++) {
  event = _ref[_i];
  _fn(event);
}

if (typeof Object.freeze === "function") {
  Object.freeze(SyncMachine);
}

module.exports = SyncMachine;

});;loader.register('chaplin/lib/utils', function(e, r, module) {
'use strict';

var support, utils, _,
  __slice = [].slice,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  __hasProp = {}.hasOwnProperty;

_ = loader('underscore');

support = loader('chaplin/lib/support');

utils = {
  beget: (function() {
    var ctor;
    if (typeof Object.create === 'function') {
      return Object.create;
    } else {
      ctor = function() {};
      return function(obj) {
        ctor.prototype = obj;
        return new ctor;
      };
    }
  })(),
  indexOf: (function() {
    if (Array.prototype.indexOf) {
      return function(list, index) {
        return list.indexOf(index);
      };
    } else if (_.indexOf) {
      return _.indexOf;
    }
  })(),
  isArray: Array.isArray || _.isArray,
  serialize: function(data) {
    if (typeof data.serialize === 'function') {
      return data.serialize();
    } else if (typeof data.toJSON === 'function') {
      return data.toJSON();
    } else {
      throw new TypeError('utils.serialize: Unknown data was passed');
    }
  },
  readonly: (function() {
    var readonlyDescriptor;
    if (support.propertyDescriptors) {
      readonlyDescriptor = {
        writable: false,
        enumerable: true,
        configurable: false
      };
      return function() {
        var obj, prop, properties, _i, _len;
        obj = arguments[0], properties = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          readonlyDescriptor.value = obj[prop];
          Object.defineProperty(obj, prop, readonlyDescriptor);
        }
        return true;
      };
    } else {
      return function() {
        return false;
      };
    }
  })(),
  getPrototypeChain: function(object) {
    var chain, _ref, _ref1, _ref2, _ref3;
    chain = [object.constructor.prototype];
    while (object = (_ref = (_ref1 = object.constructor) != null ? (_ref2 = _ref1.superclass) != null ? _ref2.prototype : void 0 : void 0) != null ? _ref : (_ref3 = object.constructor) != null ? _ref3.__super__ : void 0) {
      chain.push(object);
    }
    return chain.reverse();
  },
  getAllPropertyVersions: function(object, property) {
    var proto, result, value, _i, _len, _ref;
    result = [];
    _ref = utils.getPrototypeChain(object);
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      proto = _ref[_i];
      value = proto[property];
      if (value && __indexOf.call(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  },
  upcase: function(str) {
    return str.charAt(0).toUpperCase() + str.substring(1);
  },
  escapeRegExp: function(str) {
    return String(str || '').replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
  },
  modifierKeyPressed: function(event) {
    return event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
  },
  reverse: function(criteria, params, query) {
    return loader('chaplin/mediator').execute('router:reverse', criteria, params, query);
  },
  redirectTo: function(pathDesc, params, options) {
    return loader('chaplin/mediator').execute('router:route', pathDesc, params, options);
  },
  querystring: {
    stringify: function(queryParams) {
      var arrParam, encodedKey, key, query, stringifyKeyValuePair, value, _i, _len;
      query = '';
      stringifyKeyValuePair = function(encodedKey, value) {
        if (value != null) {
          return '&' + encodedKey + '=' + encodeURIComponent(value);
        } else {
          return '';
        }
      };
      for (key in queryParams) {
        if (!__hasProp.call(queryParams, key)) continue;
        value = queryParams[key];
        encodedKey = encodeURIComponent(key);
        if (utils.isArray(value)) {
          for (_i = 0, _len = value.length; _i < _len; _i++) {
            arrParam = value[_i];
            query += stringifyKeyValuePair(encodedKey, arrParam);
          }
        } else {
          query += stringifyKeyValuePair(encodedKey, value);
        }
      }
      return query && query.substring(1);
    },
    parse: function(queryString) {
      var current, field, pair, pairs, params, value, _i, _len, _ref;
      params = {};
      if (!queryString) {
        return params;
      }
      queryString = queryString.slice(queryString.indexOf('?') + 1);
      pairs = queryString.split('&');
      for (_i = 0, _len = pairs.length; _i < _len; _i++) {
        pair = pairs[_i];
        if (!pair.length) {
          continue;
        }
        _ref = pair.split('='), field = _ref[0], value = _ref[1];
        if (!field.length) {
          continue;
        }
        field = decodeURIComponent(field);
        value = decodeURIComponent(value);
        current = params[field];
        if (current) {
          if (current.push) {
            current.push(value);
          } else {
            params[field] = [current, value];
          }
        } else {
          params[field] = value;
        }
      }
      return params;
    }
  }
};

utils.queryParams = utils.querystring;

if (typeof Object.seal === "function") {
  Object.seal(utils);
}

module.exports = utils;

});;loader.register('chaplin', function(e, r, module) {

module.exports = {
  Application: loader('chaplin/application'),
  mediator: loader('chaplin/mediator'),
  Dispatcher: loader('chaplin/dispatcher'),
  Controller: loader('chaplin/controllers/controller'),
  Composer: loader('chaplin/composer'),
  Composition: loader('chaplin/lib/composition'),
  Collection: loader('chaplin/models/collection'),
  Model: loader('chaplin/models/model'),
  Layout: loader('chaplin/views/layout'),
  View: loader('chaplin/views/view'),
  CollectionView: loader('chaplin/views/collection_view'),
  Route: loader('chaplin/lib/route'),
  Router: loader('chaplin/lib/router'),
  EventBroker: loader('chaplin/lib/event_broker'),
  support: loader('chaplin/lib/support'),
  SyncMachine: loader('chaplin/lib/sync_machine'),
  utils: loader('chaplin/lib/utils')
};

});
var regDeps = function(Backbone, _) {
  loader.register('backbone', function(exports, require, module) {
    module.exports = Backbone;
  });
  loader.register('underscore', function(exports, require, module) {
    module.exports = _;
  });
};

if (typeof define === 'function' && define.amd) {
  define(['backbone', 'underscore'], function(Backbone, _) {
    regDeps(Backbone, _);
    return loader('chaplin');
  });
} else if (typeof module === 'object' && module && module.exports) {
  regDeps(require('backbone'), require('underscore'));
  module.exports = loader('chaplin');
} else if (typeof require === 'function') {
  regDeps(window.Backbone, window._ || window.Backbone.utils);
  window.Chaplin = loader('chaplin');
} else {
  throw new Error('Chaplin requires Common.js or AMD modules');
}

})();
},{}],"chaplin":[function(require,module,exports){
module.exports=require('9U5Jgg');
},{}],"cocktail":[function(require,module,exports){
module.exports=require('qFH0SM');
},{}],"qFH0SM":[function(require,module,exports){
//     (c) 2012 Onsi Fakhouri
//     Cocktail.js may be freely distributed under the MIT license.
//     http://github.com/onsi/cocktail
(function(factory) {
    if (typeof require === 'function' && typeof module !== 'undefined' && module.exports) {
        module.exports = factory(require('underscore'));
    } else if (typeof define === 'function') {
        define(['underscore'], factory);
    } else {
        this.Cocktail = factory(_);
    }
}(function (_) {

    var Cocktail = {};

    Cocktail.mixins = {};

    Cocktail.mixin = function mixin(klass) {
        var mixins = _.chain(arguments).toArray().rest().flatten().value();
        // Allows mixing into the constructor's prototype or the dynamic instance
        var obj = klass.prototype || klass;

        var collisions = {};

        _.each(mixins, function(mixin) {
            if (_.isString(mixin)) {
                mixin = Cocktail.mixins[mixin];
            }
            _.each(mixin, function(value, key) {
                if (_.isFunction(value)) {
                    // If the mixer already has that exact function reference
                    // Note: this would occur on an accidental mixin of the same base
                    if (obj[key] === value) return;

                    if (obj[key]) {
                        // Avoid accessing built-in properties like constructor (#39)
                        collisions[key] = collisions.hasOwnProperty(key) ? collisions[key] : [obj[key]];
                        collisions[key].push(value);
                    }
                    obj[key] = value;
                } else if (_.isArray(value)) {
                    obj[key] = _.union(value, obj[key] || []);
                } else if (_.isObject(value)) {
                    obj[key] = _.extend({}, value, obj[key] || {});
                } else if (!(key in obj)) {
                    obj[key] = value;
                }
            });
        });

        _.each(collisions, function(propertyValues, propertyName) {
            obj[propertyName] = function() {
                var that = this,
                    args = arguments,
                    returnValue;

                _.each(propertyValues, function(value) {
                    var returnedValue = _.isFunction(value) ? value.apply(that, args) : value;
                    returnValue = (typeof returnedValue === 'undefined' ? returnValue : returnedValue);
                });

                return returnValue;
            };
        });

        return klass;
    };

    var originalExtend;

    Cocktail.patch = function patch(Backbone) {
        originalExtend = Backbone.Model.extend;

        var extend = function(protoProps, classProps) {
            var klass = originalExtend.call(this, protoProps, classProps);

            var mixins = klass.prototype.mixins;
            if (mixins && klass.prototype.hasOwnProperty('mixins')) {
                Cocktail.mixin(klass, mixins);
            }

            return klass;
        };

        _.each([Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View], function(klass) {
            klass.mixin = function mixin() {
                Cocktail.mixin(this, _.toArray(arguments));
            };

            klass.extend = extend;
        });
    };

    Cocktail.unpatch = function unpatch(Backbone) {
        _.each([Backbone.Model, Backbone.Collection, Backbone.Router, Backbone.View], function(klass) {
            klass.mixin = undefined;
            klass.extend = originalExtend;
        });
    };

    return Cocktail;
}));

},{}],"underscore":[function(require,module,exports){
module.exports=require('l0hNr+');
},{}],"l0hNr+":[function(require,module,exports){
//     Underscore.js 1.7.0
//     http://underscorejs.org
//     (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    concat           = ArrayProto.concat,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind;

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.7.0';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var createCallback = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  _.iteratee = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return createCallback(value, context, argCount);
    if (_.isObject(value)) return _.matches(value);
    return _.property(value);
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    if (obj == null) return obj;
    iteratee = createCallback(iteratee, context);
    var i, length = obj.length;
    if (length === +length) {
      for (i = 0; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    if (obj == null) return [];
    iteratee = _.iteratee(iteratee, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length),
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  var reduceError = 'Reduce of empty array with no initial value';

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index = 0, currentKey;
    if (arguments.length < 3) {
      if (!length) throw new TypeError(reduceError);
      memo = obj[keys ? keys[index++] : index++];
    }
    for (; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = function(obj, iteratee, memo, context) {
    if (obj == null) obj = [];
    iteratee = createCallback(iteratee, context, 4);
    var keys = obj.length !== + obj.length && _.keys(obj),
        index = (keys || obj).length,
        currentKey;
    if (arguments.length < 3) {
      if (!index) throw new TypeError(reduceError);
      memo = obj[keys ? keys[--index] : --index];
    }
    while (index--) {
      currentKey = keys ? keys[index] : index;
      memo = iteratee(memo, obj[currentKey], currentKey, obj);
    }
    return memo;
  };

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var result;
    predicate = _.iteratee(predicate, context);
    _.some(obj, function(value, index, list) {
      if (predicate(value, index, list)) {
        result = value;
        return true;
      }
    });
    return result;
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    if (obj == null) return results;
    predicate = _.iteratee(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(_.iteratee(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    if (obj == null) return true;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    if (obj == null) return false;
    predicate = _.iteratee(predicate, context);
    var keys = obj.length !== +obj.length && _.keys(obj),
        length = (keys || obj).length,
        index, currentKey;
    for (index = 0; index < length; index++) {
      currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given value (using `===`).
  // Aliased as `include`.
  _.contains = _.include = function(obj, target) {
    if (obj == null) return false;
    if (obj.length !== +obj.length) obj = _.values(obj);
    return _.indexOf(obj, target) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = function(obj, method) {
    var args = slice.call(arguments, 2);
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      return (isFunc ? method : value[method]).apply(value, args);
    });
  };

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matches(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matches(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = obj.length === +obj.length ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index, list) {
        computed = iteratee(value, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = value;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection, using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  _.shuffle = function(obj) {
    var set = obj && obj.length === +obj.length ? obj : _.values(obj);
    var length = set.length;
    var shuffled = Array(length);
    for (var index = 0, rand; index < length; index++) {
      rand = _.random(0, index);
      if (rand !== index) shuffled[index] = shuffled[rand];
      shuffled[rand] = set[index];
    }
    return shuffled;
  };

  // Sample **n** random values from a collection.
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (obj.length !== +obj.length) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    return _.shuffle(obj).slice(0, Math.max(0, n));
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior) {
    return function(obj, iteratee, context) {
      var result = {};
      iteratee = _.iteratee(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = _.iteratee(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = array.length;
    while (low < high) {
      var mid = low + high >>> 1;
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (obj.length === +obj.length) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return obj.length === +obj.length ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = function(obj, predicate, context) {
    predicate = _.iteratee(predicate, context);
    var pass = [], fail = [];
    _.each(obj, function(value, key, obj) {
      (predicate(value, key, obj) ? pass : fail).push(value);
    });
    return [pass, fail];
  };

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    if (n < 0) return [];
    return slice.call(array, 0, n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N. The **guard** check allows it to work with
  // `_.map`.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array. The **guard** check allows it to work with `_.map`.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return slice.call(array, Math.max(array.length - n, 0));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array. The **guard**
  // check allows it to work with `_.map`.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    if (shallow && _.every(input, _.isArray)) {
      return concat.apply(output, input);
    }
    for (var i = 0, length = input.length; i < length; i++) {
      var value = input[i];
      if (!_.isArray(value) && !_.isArguments(value)) {
        if (!strict) output.push(value);
      } else if (shallow) {
        push.apply(output, value);
      } else {
        flatten(value, shallow, strict, output);
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false, []);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = function(array) {
    return _.difference(array, slice.call(arguments, 1));
  };

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (array == null) return [];
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = _.iteratee(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = array.length; i < length; i++) {
      var value = array[i];
      if (isSorted) {
        if (!i || seen !== value) result.push(value);
        seen = value;
      } else if (iteratee) {
        var computed = iteratee(value, i, array);
        if (_.indexOf(seen, computed) < 0) {
          seen.push(computed);
          result.push(value);
        }
      } else if (_.indexOf(result, value) < 0) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = function() {
    return _.uniq(flatten(arguments, true, true, []));
  };

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    if (array == null) return [];
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = array.length; i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      for (var j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = function(array) {
    var rest = flatten(slice.call(arguments, 1), true, true, []);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = function(array) {
    if (array == null) return [];
    var length = _.max(arguments, 'length').length;
    var results = Array(length);
    for (var i = 0; i < length; i++) {
      results[i] = _.pluck(arguments, i);
    }
    return results;
  };

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    if (list == null) return {};
    var result = {};
    for (var i = 0, length = list.length; i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = function(array, item, isSorted) {
    if (array == null) return -1;
    var i = 0, length = array.length;
    if (isSorted) {
      if (typeof isSorted == 'number') {
        i = isSorted < 0 ? Math.max(0, length + isSorted) : isSorted;
      } else {
        i = _.sortedIndex(array, item);
        return array[i] === item ? i : -1;
      }
    }
    for (; i < length; i++) if (array[i] === item) return i;
    return -1;
  };

  _.lastIndexOf = function(array, item, from) {
    if (array == null) return -1;
    var idx = array.length;
    if (typeof from == 'number') {
      idx = from < 0 ? idx + from + 1 : Math.min(idx, from + 1);
    }
    while (--idx >= 0) if (array[idx] === item) return idx;
    return -1;
  };

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (arguments.length <= 1) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Reusable constructor function for prototype setting.
  var Ctor = function(){};

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = function(func, context) {
    var args, bound;
    if (nativeBind && func.bind === nativeBind) return nativeBind.apply(func, slice.call(arguments, 1));
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    args = slice.call(arguments, 2);
    bound = function() {
      if (!(this instanceof bound)) return func.apply(context, args.concat(slice.call(arguments)));
      Ctor.prototype = func.prototype;
      var self = new Ctor;
      Ctor.prototype = null;
      var result = func.apply(self, args.concat(slice.call(arguments)));
      if (_.isObject(result)) return result;
      return self;
    };
    return bound;
  };

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder, allowing any combination of arguments to be pre-filled.
  _.partial = function(func) {
    var boundArgs = slice.call(arguments, 1);
    return function() {
      var position = 0;
      var args = boundArgs.slice();
      for (var i = 0, length = args.length; i < length; i++) {
        if (args[i] === _) args[i] = arguments[position++];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return func.apply(this, args);
    };
  };

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = function(obj) {
    var i, length = arguments.length, key;
    if (length <= 1) throw new Error('bindAll must be passed function names');
    for (i = 1; i < length; i++) {
      key = arguments[i];
      obj[key] = _.bind(obj[key], obj);
    }
    return obj;
  };

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = hasher ? hasher.apply(this, arguments) : key;
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = function(func, wait) {
    var args = slice.call(arguments, 2);
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  };

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = function(func) {
    return _.delay.apply(_, [func, 1].concat(slice.call(arguments, 1)));
  };

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        clearTimeout(timeout);
        timeout = null;
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last > 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed after being called N times.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed before being called N times.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  // Object Functions
  // ----------------

  // Retrieve the names of an object's properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = function(obj) {
    if (!_.isObject(obj)) return obj;
    var source, prop;
    for (var i = 1, length = arguments.length; i < length; i++) {
      source = arguments[i];
      for (prop in source) {
        if (hasOwnProperty.call(source, prop)) {
            obj[prop] = source[prop];
        }
      }
    }
    return obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = function(obj, iteratee, context) {
    var result = {}, key;
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      iteratee = createCallback(iteratee, context);
      for (key in obj) {
        var value = obj[key];
        if (iteratee(value, key, obj)) result[key] = value;
      }
    } else {
      var keys = concat.apply([], slice.call(arguments, 1));
      obj = new Object(obj);
      for (var i = 0, length = keys.length; i < length; i++) {
        key = keys[i];
        if (key in obj) result[key] = obj[key];
      }
    }
    return result;
  };

   // Return a copy of the object without the blacklisted properties.
  _.omit = function(obj, iteratee, context) {
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
    } else {
      var keys = _.map(concat.apply([], slice.call(arguments, 1)), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  };

  // Fill in a given object with default properties.
  _.defaults = function(obj) {
    if (!_.isObject(obj)) return obj;
    for (var i = 1, length = arguments.length; i < length; i++) {
      var source = arguments[i];
      for (var prop in source) {
        if (obj[prop] === void 0) obj[prop] = source[prop];
      }
    }
    return obj;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Internal recursive comparison function for `isEqual`.
  var eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }
    if (typeof a != 'object' || typeof b != 'object') return false;
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }
    // Objects with different constructors are not equivalent, but `Object`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (
      aCtor !== bCtor &&
      // Handle Object.create(x) cases
      'constructor' in a && 'constructor' in b &&
      !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
        _.isFunction(bCtor) && bCtor instanceof bCtor)
    ) {
      return false;
    }
    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);
    var size, result;
    // Recursively compare objects and arrays.
    if (className === '[object Array]') {
      // Compare array lengths to determine if a deep comparison is necessary.
      size = a.length;
      result = size === b.length;
      if (result) {
        // Deep compare the contents, ignoring non-numeric properties.
        while (size--) {
          if (!(result = eq(a[size], b[size], aStack, bStack))) break;
        }
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      size = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      result = _.keys(b).length === size;
      if (result) {
        while (size--) {
          // Deep compare each member
          key = keys[size];
          if (!(result = _.has(b, key) && eq(a[key], b[key], aStack, bStack))) break;
        }
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return result;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b, [], []);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (_.isArray(obj) || _.isString(obj) || _.isArguments(obj)) return obj.length === 0;
    for (var key in obj) if (_.has(obj, key)) return false;
    return true;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around an IE 11 bug.
  if (typeof /./ !== 'function') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = function(key) {
    return function(obj) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of `key:value` pairs.
  _.matches = function(attrs) {
    var pairs = _.pairs(attrs), length = pairs.length;
    return function(obj) {
      if (obj == null) return !length;
      obj = new Object(obj);
      for (var i = 0; i < length; i++) {
        var pair = pairs[i], key = pair[0];
        if (pair[1] !== obj[key] || !(key in obj)) return false;
      }
      return true;
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = createCallback(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, property) {
    if (object == null) return void 0;
    var value = object[property];
    return _.isFunction(value) ? object[property]() : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate    : /<%([\s\S]+?)%>/g,
    interpolate : /<%=([\s\S]+?)%>/g,
    escape      : /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'":      "'",
    '\\':     '\\',
    '\r':     'r',
    '\n':     'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escaper = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escaper, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offest.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    try {
      var render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(obj) {
    return this._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result.call(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result.call(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result.call(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));

},{}],"buckets":[function(require,module,exports){
module.exports=require('2CpicB');
},{}],"2CpicB":[function(require,module,exports){
var Backbone, BucketsApp, Chaplin, Cocktail, Handlebars, Layout, User, _, mediator, routes,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Backbone = require('backbone');

Cocktail = require('cocktail');

Backbone.$ = $;

Chaplin = require('chaplin');

User = require('models/user');

Layout = require('views/layout');

Handlebars = require('hbsfy/runtime');

routes = require('routes');

mediator = require('mediator');

_ = require('underscore');

module.exports = BucketsApp = (function(superClass) {
  extend(BucketsApp, superClass);

  function BucketsApp() {
    return BucketsApp.__super__.constructor.apply(this, arguments);
  }

  BucketsApp.prototype.title = 'Buckets';

  BucketsApp.prototype.initialize = function(options) {
    this.options = options != null ? options : {};
    this.initRouter(routes, {
      root: "/" + this.options.adminSegment + "/"
    });
    this.initDispatcher({
      controllerPath: 'client/source/controllers/',
      controllerSuffix: '_controller.coffee'
    });
    mediator.options = this.options;
    if (this.options.user) {
      mediator.user = new User(this.options.user);
    }
    mediator.plugins = {};
    if (this.options.cloudinary) {
      $.cloudinary.config({
        api_key: this.options.cloudinary.api_key,
        cloud_name: this.options.cloudinary.cloud_name
      });
    }
    mediator.layout = new Layout({
      title: 'Buckets',
      titleTemplate: function(data) {
        var str;
        str = '';
        if (data.subtitle) {
          str += data.subtitle + " · ";
        }
        return str += data.title;
      }
    });
    this.initComposer();
    this.start();
    return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
  };

  BucketsApp.prototype.plugin = function(key, plugin) {
    plugin.handlebars = Handlebars;
    return mediator.plugins[key] = plugin;
  };

  BucketsApp.View = require('lib/view');

  BucketsApp._ = _;

  BucketsApp.mediator = mediator;

  return BucketsApp;

})(Chaplin.Application);



},{"backbone":"KDJVm1","chaplin":"9U5Jgg","cocktail":"qFH0SM","hbsfy/runtime":"pu95bm","lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","models/user":"client/source/models/user.coffee","routes":"client/source/routes.coffee","underscore":"l0hNr+","views/layout":"client/source/views/layout.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/auth_controller.coffee":[function(require,module,exports){
var AuthController, Controller, LoginView, PasswordReset, ResetPasswordView, User, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

LoginView = require('views/auth/login');

ResetPasswordView = require('views/auth/reset_password');

PasswordReset = require('models/password_reset');

User = require('models/user');

mediator = require('chaplin').mediator;

module.exports = AuthController = (function(superClass) {
  extend(AuthController, superClass);

  function AuthController() {
    return AuthController.__super__.constructor.apply(this, arguments);
  }

  AuthController.prototype.login = function(params) {
    var ref;
    if ((ref = mediator.user) != null ? ref.get('id') : void 0) {
      toastr.info('You’re already logged in.');
      this.redirectTo('buckets#dashboard');
    }
    return this.view = new LoginView({
      next: params.next
    });
  };

  AuthController.prototype.resetPassword = function(params) {
    this.passwordReset = new PasswordReset({
      token: params.token
    });
    return this.passwordReset.fetch().done((function(_this) {
      return function() {
        _this.listenTo(_this.passwordReset, 'sync', function(model, user) {
          mediator.user = new User(user);
          return _this.redirectTo({
            url: '/'
          });
        });
        return _this.view = new ResetPasswordView({
          model: _this.passwordReset
        });
      };
    })(this)).fail((function(_this) {
      return function() {
        toastr.error('Password reset token is invalid or has expired.');
        return _this.redirectTo('buckets#dashboard');
      };
    })(this));
  };

  return AuthController;

})(Controller);



},{"chaplin":"9U5Jgg","lib/controller":"client/source/lib/controller.coffee","models/password_reset":"client/source/models/password_reset.coffee","models/user":"client/source/models/user.coffee","views/auth/login":"client/source/views/auth/login.coffee","views/auth/reset_password":"client/source/views/auth/reset_password.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/buckets_controller.coffee":[function(require,module,exports){
var Bucket, BucketEditView, Buckets, BucketsController, Controller, DashboardView, Entries, EntriesBrowser, Entry, EntryEditView, Fields, Handlebars, Members, MissingPageView, Users, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Handlebars = require('hbsfy/runtime');

Controller = require('lib/controller');

MissingPageView = require('views/missing');

BucketEditView = require('views/buckets/edit');

DashboardView = require('views/buckets/dashboard');

EntriesBrowser = require('views/entries/browser');

EntryEditView = require('views/entries/edit');

Bucket = require('models/bucket');

Buckets = require('models/buckets');

Fields = require('models/fields');

Entry = require('models/entry');

Entries = require('models/entries');

Members = require('models/members');

Users = require('models/users');

mediator = require('chaplin').mediator;

module.exports = BucketsController = (function(superClass) {
  extend(BucketsController, superClass);

  function BucketsController() {
    return BucketsController.__super__.constructor.apply(this, arguments);
  }

  BucketsController.prototype.dashboard = function() {
    return this.view = new DashboardView;
  };

  BucketsController.prototype.add = function() {
    var newBucket;
    this.adjustTitle('New Bucket');
    newBucket = new Bucket;
    this.newFields = new Fields;
    this.listenToOnce(newBucket, 'sync', (function(_this) {
      return function() {
        toastr.success('Bucket added');
        mediator.buckets.add(newBucket);
        return _this.redirectTo({
          url: "/" + mediator.options.adminSegment + "/buckets/" + (newBucket.get('slug')) + "/settings/fields"
        });
      };
    })(this));
    return this.view = new BucketEditView({
      model: newBucket,
      fields: this.newFields
    });
  };

  BucketsController.prototype.browse = function(params) {
    var bucket, ref;
    bucket = (ref = mediator.buckets) != null ? ref.findWhere({
      slug: params.slug
    }) : void 0;
    if (!bucket) {
      return this.bucketNotFound();
    }
    if (params.add) {
      this.adjustTitle('New ' + bucket.get('singular'));
    } else if (params.entryID) {
      this.adjustTitle('Edit');
    } else {
      this.adjustTitle(bucket.get('name'));
    }
    return this.reuse('BucketBrowser', {
      compose: function(options) {
        this.entries = new Entries;
        return this.entries.fetch({
          data: {
            until: null,
            bucket: bucket.get('slug'),
            status: ''
          },
          processData: true
        }).done((function(_this) {
          return function() {
            _this.view = new EntriesBrowser({
              collection: _this.entries,
              bucket: bucket
            });
            if (options.add) {
              return _this.view.loadNewEntry();
            } else if (options.entryID) {
              return _this.view.loadEntry(options.entryID);
            }
          };
        })(this));
      },
      check: function(options) {
        if (this.view != null) {
          if (options.add) {
            this.view.loadNewEntry();
          } else if (options.entryID) {
            this.view.loadEntry(options.entryID);
          } else {
            this.view.clearEntry();
          }
        }
        return (this.view != null) && this.view.bucket.get('id') === options.bucket.get('id');
      },
      options: {
        entryID: params.entryID,
        bucket: bucket,
        add: params.add
      }
    });
  };

  BucketsController.prototype.settings = function(params) {
    var bucket, ref;
    bucket = (ref = mediator.buckets) != null ? ref.findWhere({
      slug: params.slug
    }) : void 0;
    if (!bucket) {
      return this.bucketNotFound();
    }
    this.listenToOnce(bucket, 'sync', (function(_this) {
      return function(bucket, data) {
        mediator.buckets.fetch({
          reset: true
        });
        if (data != null ? data.slug : void 0) {
          toastr.success('Bucket saved');
          return _this.redirectTo('buckets#browse', {
            slug: data.slug
          });
        } else {
          toastr.success('Bucket deleted');
          return _this.redirectTo('buckets#dashboard');
        }
      };
    })(this));
    this.adjustTitle('Edit ' + bucket.get('name'));
    return this.reuse('BucketSettings', {
      compose: function(options) {
        this.members = new Members({
          bucketId: bucket.get('id')
        });
        this.users = new Users;
        this.fields = new Fields(bucket.get('fields'));
        return $.when(this.members.fetch(), this.users.fetch()).done((function(_this) {
          return function() {
            var ref1;
            _this.view = new BucketEditView({
              model: bucket,
              fields: _this.fields,
              members: _this.members,
              users: _this.users
            });
            if (options.activeTab) {
              return (ref1 = _this.view) != null ? ref1.setActiveTab(options.activeTab) : void 0;
            }
          };
        })(this));
      },
      check: function(options) {
        var ref1;
        if (options.activeTab) {
          if ((ref1 = this.view) != null) {
            ref1.setActiveTab(options.activeTab);
          }
        }
        return this.view != null;
      },
      options: {
        activeTab: params.activeTab
      }
    });
  };

  BucketsController.prototype.bucketNotFound = function() {
    toastr.error('Could not find that bucket.');
    return this.redirectTo('buckets#dashboard');
  };

  BucketsController.prototype.missing = function() {
    return console.log('Page missing!', arguments);
  };

  return BucketsController;

})(Controller);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","lib/controller":"client/source/lib/controller.coffee","models/bucket":"client/source/models/bucket.coffee","models/buckets":"client/source/models/buckets.coffee","models/entries":"client/source/models/entries.coffee","models/entry":"client/source/models/entry.coffee","models/fields":"client/source/models/fields.coffee","models/members":"client/source/models/members.coffee","models/users":"client/source/models/users.coffee","views/buckets/dashboard":"client/source/views/buckets/dashboard.coffee","views/buckets/edit":"client/source/views/buckets/edit.coffee","views/entries/browser":"client/source/views/entries/browser.coffee","views/entries/edit":"client/source/views/entries/edit.coffee","views/missing":"client/source/views/missing.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/error_controller.coffee":[function(require,module,exports){
var Controller, ErrorController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

module.exports = ErrorController = (function(superClass) {
  extend(ErrorController, superClass);

  function ErrorController() {
    return ErrorController.__super__.constructor.apply(this, arguments);
  }

  ErrorController.prototype.general = function() {
    return console.log('there was a general error');
  };

  return ErrorController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/help_controller.coffee":[function(require,module,exports){
var Controller, HelpController, HelpDocView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

HelpDocView = require('views/help/doc');

module.exports = HelpController = (function(superClass) {
  extend(HelpController, superClass);

  function HelpController() {
    return HelpController.__super__.constructor.apply(this, arguments);
  }

  HelpController.prototype.index = function(params) {
    return this.view = new HelpDocView({
      doc: params.doc
    });
  };

  return HelpController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","views/help/doc":"client/source/views/help/doc.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/install_controller.coffee":[function(require,module,exports){
var Controller, FirstUserView, Install, InstallController, User, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

Install = require('models/install');

User = require('models/user');

FirstUserView = require('views/install/firstuser');

mediator = require('chaplin').mediator;

module.exports = InstallController = (function(superClass) {
  extend(InstallController, superClass);

  function InstallController() {
    return InstallController.__super__.constructor.apply(this, arguments);
  }

  InstallController.prototype.firstuser = function() {
    var newInstall;
    this.adjustTitle('Install');
    newInstall = new Install;
    this.view = new FirstUserView({
      model: newInstall
    });
    return newInstall.on('sync', (function(_this) {
      return function(model, user) {
        mediator.user = new User(user);
        mediator.options.needsInstall = false;
        return _this.redirectTo({
          url: '/'
        });
      };
    })(this));
  };

  return InstallController;

})(Controller);



},{"chaplin":"9U5Jgg","lib/controller":"client/source/lib/controller.coffee","models/install":"client/source/models/install.coffee","models/user":"client/source/models/user.coffee","views/install/firstuser":"client/source/views/install/firstuser.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/routes_controller.coffee":[function(require,module,exports){
var Controller, Routes, RoutesController, RoutesList, Templates,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

RoutesList = require('views/routes/list');

Routes = require('models/routes');

Templates = require('models/templates');

module.exports = RoutesController = (function(superClass) {
  extend(RoutesController, superClass);

  function RoutesController() {
    return RoutesController.__super__.constructor.apply(this, arguments);
  }

  RoutesController.prototype.list = function() {
    this.routes = new Routes;
    this.templates = new Templates;
    return $.when(this.routes.fetch(), this.templates.fetch()).done((function(_this) {
      return function() {
        return _this.view = new RoutesList({
          collection: _this.routes,
          templates: _this.templates
        });
      };
    })(this));
  };

  return RoutesController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/routes":"client/source/models/routes.coffee","models/templates":"client/source/models/templates.coffee","views/routes/list":"client/source/views/routes/list.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/settings_controller.coffee":[function(require,module,exports){
var BasicSettingsView, Controller, SettingsController, User, Users, UsersList,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

User = require('models/user');

Users = require('models/users');

BasicSettingsView = require('views/settings/basic');

UsersList = require('views/users/list');

module.exports = SettingsController = (function(superClass) {
  extend(SettingsController, superClass);

  function SettingsController() {
    return SettingsController.__super__.constructor.apply(this, arguments);
  }

  SettingsController.prototype.basic = function() {
    this.adjustTitle('Settings');
    return this.view = new BasicSettingsView;
  };

  SettingsController.prototype.users = function(params) {
    var ref;
    this.adjustTitle('Users');
    this.reuse('UsersList', {
      compose: function() {
        this.users = new Users;
        return this.users.fetch().done((function(_this) {
          return function() {
            if (params.email) {
              _this.user = _this.users.findWhere({
                email: params.email
              });
            } else {
              _this.user = null;
            }
            return _this.view = new UsersList({
              collection: _this.users,
              model: _this.user
            });
          };
        })(this));
      },
      check: function(options) {
        var ref;
        if (options.email !== ((ref = this.view.model) != null ? ref.get('id') : void 0)) {
          this.view.selectUser(this.users.findWhere({
            email: options.email
          }));
        }
        return this.view != null;
      },
      options: {
        email: params.email
      }
    });
    if ((ref = this.view) != null ? ref.model : void 0) {
      return console.log('MODEL!!!');
    }
  };

  return SettingsController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/user":"client/source/models/user.coffee","models/users":"client/source/models/users.coffee","views/settings/basic":"client/source/views/settings/basic.coffee","views/users/list":"client/source/views/users/list.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/controllers/templates_controller.coffee":[function(require,module,exports){
var BuildFile, BuildFiles, Builds, Controller, TemplateEditor, TemplatesController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

BuildFiles = require('models/buildfiles');

BuildFile = require('models/buildfile');

Builds = require('models/builds');

TemplateEditor = require('views/templates/editor');

module.exports = TemplatesController = (function(superClass) {
  extend(TemplatesController, superClass);

  function TemplatesController() {
    return TemplatesController.__super__.constructor.apply(this, arguments);
  }

  TemplatesController.prototype.edit = function(params) {
    if (!params.filename) {
      return this.redirectTo('templates#edit', {
        filename: 'index.hbs',
        env: 'staging'
      });
    }
    this.adjustTitle('Design');
    return this.reuse('TemplateEditor', {
      compose: function() {
        this.builds = new Builds;
        this.stagingFiles = new BuildFiles;
        this.liveFiles = new BuildFiles;
        this.liveFiles.build_env = 'live';
        return $.when(this.liveFiles.fetch(), this.stagingFiles.fetch(), this.builds.fetch()).done((function(_this) {
          return function() {
            _this.view = new TemplateEditor({
              stagingFiles: _this.stagingFiles,
              liveFiles: _this.liveFiles,
              builds: _this.builds,
              env: params.env,
              filename: params.filename
            });
            return _this.view.selectTemplate(params.filename, params.env);
          };
        })(this));
      },
      check: function(options) {
        if (options.filename !== this.view.filename || options.env !== this.view.env) {
          this.view.selectTemplate(options.filename, options.env);
        }
        return (this.view != null) && (this.stagingFiles != null) && (this.liveFiles != null) && (this.builds != null);
      },
      options: {
        filename: params.filename,
        env: params.env
      }
    });
  };

  return TemplatesController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/buildfile":"client/source/models/buildfile.coffee","models/buildfiles":"client/source/models/buildfiles.coffee","models/builds":"client/source/models/builds.coffee","views/templates/editor":"client/source/views/templates/editor.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/helpers.coffee":[function(require,module,exports){
var Handlebars, _, mediator, moment,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

Handlebars = require('hbsfy/runtime');

mediator = require('mediator');

_ = require('underscore');

moment = require('moment');

require('helpers/forms');

Swag.registerHelpers(Handlebars);

Handlebars.registerHelper('adminSegment', function() {
  return mediator.options.adminSegment;
});

Handlebars.registerHelper('icon', function(type) {
  return new Handlebars.SafeString("<span class=\"icon buckets-icon-" + type + "\"></span>");
});

Handlebars.registerHelper('helpIcon', function(tooltip, options) {
  var ref;
  return new Handlebars.SafeString(((ref = options.hash) != null ? ref.docsPath : void 0) ? "<a class=\"btn btn-small btn-help btn-link btn-icon btn-icon-small show-tooltip\" title=\"" + tooltip + "\" href=\"/" + mediator.options.adminSegment + "/help/" + options.hash.docsPath + "\" target=\"_blank\">" + (Handlebars.helpers.icon('question')) + "</a>" : "<span class=\"btn-icon btn-help btn-icon-small show-tooltip\" title=\"" + tooltip + "\">" + (Handlebars.helpers.icon('question')) + "</span>");
});

Handlebars.registerHelper('gravatar', function(email_hash) {
  var color, defaultColors, randomize;
  randomize = new Math.seedrandom(email_hash || 'mrbucket');
  defaultColors = ['blue', 'red', 'green', 'yellow'];
  color = defaultColors[Math.floor(defaultColors.length * randomize())];
  return new Handlebars.SafeString("<div class=\"avatar avatar-" + color + "\" style=\"background-image: url(https://www.gravatar.com/avatar/" + email_hash + "?d=404), url(/" + mediator.options.adminSegment + "/img/avatars/" + color + ".png)\"></div>");
});

Handlebars.registerHelper('renderRoute', function(keys) {
  var highlightedKeys, i, key, len, ref, ref1, url;
  url = this.urlPattern;
  highlightedKeys = [];
  ref = this.keys;
  for (i = 0, len = ref.length; i < len; i++) {
    key = ref[i];
    if (ref1 = key.name, indexOf.call(highlightedKeys, ref1) >= 0) {
      continue;
    }
    url = url.replace(RegExp(":" + key.name + "\\??\\*?\\+?(\\(.+\\))?", "g"), function(match, regex) {
      var className;
      className = 'show-tooltip bkts-wildcard';
      if (key.optional) {
        className += ' bkts-wildcard-optional';
      }
      highlightedKeys.push(key.name);
      return "<strong class=\"" + className + "\" title=\"" + match + "\">" + key.name + "</strong>";
    });
  }
  return new Handlebars.SafeString(url);
});

Handlebars.registerHelper('timeAgo', function(dateTime) {
  var expanded, m;
  m = moment(dateTime);
  expanded = Handlebars.helpers.simpleDateTime(dateTime);
  return new Handlebars.SafeString("<span title=\"" + expanded + "\" class=\"show-tooltip\">" + (moment(dateTime).fromNow()) + "</span>");
});

Handlebars.registerHelper('simpleDateTime', function(dateTime) {
  var m;
  m = moment(dateTime);
  return m.format('MMMM Do YYYY, h:mma');
});

Handlebars.registerHelper('debug', function() {
  return console.log(this, arguments);
});

Handlebars.registerHelper('logo', function() {
  return new Handlebars.SafeString("<h1 id=\"logo\">\n  <a href=\"/" + mediator.options.adminSegment + "/\"><img src=\"/" + mediator.options.adminSegment + "/img/buckets.svg\" width=\"200\"></a>\n</h1>");
});

Handlebars.registerHelper('statusColor', function(status) {
  var statusToColor;
  statusToColor = {
    live: 'primary',
    rejected: 'danger',
    pending: 'warning',
    draft: 'default'
  };
  return statusToColor[status];
});

Handlebars.registerHelper('hasRole', function() {
  var i, options, ref, role;
  role = 2 <= arguments.length ? slice.call(arguments, 0, i = arguments.length - 1) : (i = 0, []), options = arguments[i++];
  if ((ref = mediator.user) != null ? ref.hasRole.apply(ref, role) : void 0) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});

Handlebars.registerHelper('startsWith', function(string1, string2, options) {
  if ((string1 != null ? string1.indexOf(string2) : void 0) === 0) {
    return options.fn(this);
  } else {
    return options.inverse(this);
  }
});



},{"hbsfy/runtime":"pu95bm","helpers/forms":"client/source/helpers/forms.coffee","mediator":"client/source/mediator.coffee","moment":"/Users/iuriikozuliak/Projects/buckets/node_modules/moment/moment.js","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/helpers/forms.coffee":[function(require,module,exports){
var Handlebars, _, createLabel, mediator, tag, wrap;

Handlebars = require('hbsfy/runtime');

_ = require('underscore');

mediator = require('mediator');

createLabel = function(text, name, options) {
  if (options == null) {
    options = {};
  }
  _.defaults(options, {
    className: 'control-label',
    required: false
  });
  if (options.required) {
    text += "<span title=\"This field is required.\" class=\"show-tooltip text-danger\">*</span>";
  }
  return tag('label', {
    "for": "input-" + name,
    className: options.className
  }, text);
};

wrap = function(content, options) {
  if (options == null) {
    options = {};
  }
  _.defaults(options, {
    label: null,
    help: null,
    className: 'form-group',
    name: '',
    required: false
  });
  if (options.label) {
    content = createLabel(options.label, options.name, {
      required: options.required
    }) + content;
  }
  if (options.help) {
    content += tag('p', {
      className: 'help-block'
    }, options.help);
  }
  return tag('div', {
    "class": options.className
  }, content);
};

tag = function(el, attrs, content, options) {
  var html, key, val;
  if (attrs == null) {
    attrs = {};
  }
  if (content == null) {
    content = '';
  }
  if (options == null) {
    options = {};
  }
  html = "<" + el;
  for (key in attrs) {
    val = attrs[key];
    if (key === 'className') {
      key = 'class';
    }
    if ((val != null) && val !== '') {
      html += " " + key + "=\"" + val + "\"";
    }
  }
  html += ">";
  if (content) {
    html += content;
  }
  if (!options.selfClosing) {
    html += "</" + el + ">";
  }
  return new Handlebars.SafeString(html);
};

Handlebars.registerHelper('input', function(name, value, options) {
  var input, params, settings, slug;
  settings = _.defaults(options.hash, {
    className: 'form-control',
    type: 'text',
    required: false
  });
  params = {
    name: name,
    value: value,
    className: settings.className,
    id: settings.id,
    placeholder: settings.placeholder,
    tabindex: 1,
    type: settings.type,
    id: "input-" + name,
    autocomplete: 'off'
  };
  if (settings.size) {
    params.className += " input-" + settings.size;
  }
  if (settings.slugName) {
    params.className += ' has-slug';
    _.extend(params, {
      'data-sluggify': settings.slugName
    });
  }
  input = tag('input', params, false, {
    selfClosing: true
  });
  if (settings.slugName) {
    slug = tag('input', {
      className: 'form-control input-slug input-sm',
      type: 'text',
      name: settings.slugName,
      value: settings.slugValue,
      placeholder: 'slug',
      tabindex: 0
    });
    input += slug += "<a href=\"/admin/help/slugs.md\" class=\"btn btn-link btn-icon btn-icon-small\">" + (Handlebars.helpers.icon('question')) + "</a>";
  }
  return wrap(input, {
    label: settings.label,
    help: settings.help,
    required: settings.required,
    name: params.name
  });
});

Handlebars.registerHelper('textarea', function(name, value, options) {
  var settings, textarea;
  settings = _.defaults(options.hash, {
    tabindex: 1,
    className: 'form-control',
    size: null
  });
  if (settings.size === 'lg') {
    settings.rows = 20;
  }
  if (settings.size === 'sm') {
    settings.rows = 5;
  }
  textarea = tag('textarea', {
    name: name,
    className: settings.className,
    id: "input-" + name,
    placeholder: settings.placeholder,
    tabindex: settings.tabindex,
    rows: settings.rows
  }, value);
  return new Handlebars.SafeString(settings.label ? wrap(textarea, {
    label: settings.label,
    help: settings.help,
    name: name,
    required: settings.required
  }) : textarea);
});

Handlebars.registerHelper('submit', function(text, options) {
  var settings;
  settings = _.defaults(options.hash, {
    className: 'btn btn-primary ladda-button',
    tabindex: 1
  });
  return tag('button', {
    className: settings.className,
    'data-style': 'zoom-in',
    type: 'submit',
    tabindex: settings.tabindex
  }, text);
});

Handlebars.registerHelper('hidden', function(name, value) {
  return tag('input', {
    type: 'hidden',
    name: name,
    value: value
  });
});

Handlebars.registerHelper('checkbox', function(name, value, options) {
  var cb, label, params;
  label = options.hash.label;
  params = {
    type: 'checkbox',
    name: name,
    value: 1,
    tabIndex: 1
  };
  if (value) {
    params.checked = 'checked';
  }
  cb = tag('input', params);
  if (label) {
    cb = tag('label', {
      className: 'control-label'
    }, cb + (" " + label));
  }
  return wrap(cb, {
    help: options.hash.help,
    className: 'checkbox'
  });
});

Handlebars.registerHelper('select', function(name, value, selectOptions, options) {
  var i, len, opt, optionEls, settings;
  if (!((selectOptions != null ? selectOptions.length : void 0) > 0)) {
    return;
  }
  settings = _.defaults(options.hash, {
    className: 'form-control',
    valueKey: 'id',
    nameKey: 'name',
    tabIndex: 1
  });
  if (value) {
    settings.selected = 'selected';
  }
  optionEls = [];
  for (i = 0, len = selectOptions.length; i < len; i++) {
    opt = selectOptions[i];
    optionEls.push(tag('option', {
      value: opt[settings.valueKey],
      selected: opt[settings.valueKey] === value ? "selected" : ""
    }, opt[settings.nameKey]));
  }
  return wrap(tag('select', {
    className: settings.className,
    tabindex: settings.tabindex,
    name: name
  }, optionEls.join('')), {
    label: settings.label,
    help: settings.help
  });
});

Handlebars.registerHelper('cloudinaryUpload', function(name, value, options) {
  var cloudinaryConfig, img, input, preview, settings;
  if (!$.cloudinary.config().api_key) {
    return;
  }
  settings = _.defaults(options.hash, {});
  if (value == null) {
    value = '';
  }
  img = '';
  if (value) {
    preview = Handlebars.helpers.cloudinaryImage(value, {
      hash: {
        crop: 'limit',
        width: 600,
        height: 300,
        fetch_format: 'auto'
      }
    });
    if (preview) {
      img = preview;
    }
  }
  cloudinaryConfig = JSON.stringify(mediator.options.cloudinary);
  input = "<div class=\"dropzone\">\n  <div class=\"preview\">\n    <button type=\"button\" class=\"close show-tooltip\" title=\"Remove image\">\n      <span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span>\n    </button>\n    <div class=\"preview-inner\">\n      " + img + "\n    </div>\n  </div>\n  <br>\n\n  <p>Upload files by dragging &amp; dropping,\n  or <a href=\"#\" class=\"fileinput-button\">selecting one from your computer\n  <input name=\"file\" type=\"file\" multiple=\"multiple\"\n  class=\"cloudinary-fileupload\" data-cloudinary-field=\"" + name + "\"\n  data-form-data='" + cloudinaryConfig + "'></input></a>.</p>\n</div>\n<input type=\"hidden\" name=\"" + name + "\" value=\"" + value + "\">\n\n<div class=\"progress hide\">\n  <div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"0\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 0%\"></div>\n</div>";
  return new Handlebars.SafeString(wrap(input, {
    label: settings.label,
    help: settings.help,
    required: settings.required,
    name: name
  }));
});

Handlebars.registerHelper('cloudinaryImage', function(img, options) {
  var url;
  if (!($.cloudinary.config().api_key && (img != null ? img.public_id : void 0))) {
    return;
  }
  url = $.cloudinary.url(img.public_id, options.hash);
  return new Handlebars.SafeString("<img src=\"" + url + "\">");
});



},{"hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/lib/collection.coffee":[function(require,module,exports){
var Chaplin, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

module.exports = Collection = (function(superClass) {
  extend(Collection, superClass);

  function Collection() {
    return Collection.__super__.constructor.apply(this, arguments);
  }

  Collection.prototype.initialize = function() {
    this.ajaxPool = [];
    return Collection.__super__.initialize.apply(this, arguments);
  };

  Collection.prototype.fetch = function() {
    var jqPromise;
    jqPromise = Collection.__super__.fetch.apply(this, arguments);
    this.ajaxPool.push(jqPromise);
    jqPromise.fail(function(jqXHR, statusCode) {
      console.warn('Collection Ajax error:', arguments);
      if (("" + (jqXHR != null ? jqXHR.status : void 0)).charAt(0) === '5' || statusCode === 'parsererror' || statusCode === 'timeout') {
        return Chaplin.utils.redirectTo('error#general');
      }
    });
    return jqPromise.always((function(_this) {
      return function() {
        var idx;
        idx = _this.ajaxPool.indexOf(jqPromise);
        if (idx !== -1) {
          return _this.ajaxPool.splice(idx, 1);
        }
      };
    })(this));
  };

  Collection.prototype.dispose = function() {
    var i, len, ref, xhr;
    ref = this.ajaxPool;
    for (i = 0, len = ref.length; i < len; i++) {
      xhr = ref[i];
      xhr.abort();
    }
    return Collection.__super__.dispose.apply(this, arguments);
  };

  return Collection;

})(Chaplin.Collection);



},{"chaplin":"9U5Jgg"}],"/Users/iuriikozuliak/Projects/buckets/client/source/lib/collection_view.coffee":[function(require,module,exports){
var Chaplin, CollectionView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

module.exports = CollectionView = (function(superClass) {
  extend(CollectionView, superClass);

  function CollectionView() {
    return CollectionView.__super__.constructor.apply(this, arguments);
  }

  CollectionView.prototype.itemRemoved = function() {};

  CollectionView.prototype.getTemplateFunction = function() {
    return this.template;
  };

  CollectionView.prototype.fallbackSelector = '.fallback';

  return CollectionView;

})(Chaplin.CollectionView);



},{"chaplin":"9U5Jgg"}],"/Users/iuriikozuliak/Projects/buckets/client/source/lib/controller.coffee":[function(require,module,exports){
var Buckets, Chaplin, Controller, LoggedInLayout, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

LoggedInLayout = require('views/layouts/loggedin');

Buckets = require('models/buckets');

mediator = Chaplin.mediator;

module.exports = Controller = (function(superClass) {
  extend(Controller, superClass);

  function Controller() {
    return Controller.__super__.constructor.apply(this, arguments);
  }

  Controller.prototype.beforeAction = function(params, route) {
    var ref, renderDash;
    Controller.__super__.beforeAction.apply(this, arguments);
    if (mediator.options.needsInstall && route.path !== 'install') {
      return this.redirectTo({
        url: 'install'
      });
    }
    if ((mediator.user == null) && params.authRequired !== false) {
      return this.redirectTo('auth#login', {
        next: route.path
      });
    } else if ((ref = mediator.user) != null ? ref.get('id') : void 0) {
      renderDash = (function(_this) {
        return function() {
          return _this.reuse('dashboard', LoggedInLayout, {
            model: mediator.user
          });
        };
      })(this);
      if (mediator.buckets) {
        return renderDash();
      } else {
        mediator.buckets = new Buckets;
        return mediator.buckets.fetch().done(renderDash);
      }
    }
  };

  return Controller;

})(Chaplin.Controller);



},{"chaplin":"9U5Jgg","models/buckets":"client/source/models/buckets.coffee","views/layouts/loggedin":"client/source/views/layouts/loggedin.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/lib/model.coffee":[function(require,module,exports){
var Chaplin, Model, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

_ = require('underscore');

module.exports = Model = (function(superClass) {
  extend(Model, superClass);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  Model.prototype.initialize = function() {
    this.ajaxPool = [];
    return Model.__super__.initialize.apply(this, arguments);
  };

  Model.prototype.api = function(url, data, options) {
    if (options == null) {
      options = {};
    }
    return $.ajax(_.extend(options, {
      url: url,
      data: data
    }));
  };

  Model.prototype.sync = function() {
    var jqPromise;
    jqPromise = Model.__super__.sync.apply(this, arguments);
    this.ajaxPool.push(jqPromise);
    jqPromise.error(function(jqXHT, statusCode) {
      console.warn('Model AJAX error:', arguments);
      if (("" + (typeof jqXHR !== "undefined" && jqXHR !== null ? jqXHR.status : void 0)).charAt(0) === '5' || statusCode === 'parsererror' || statusCode === 'timeout') {
        return Chaplin.utils.redirectTo('error#general');
      }
    });
    return jqPromise.always((function(_this) {
      return function() {
        var idx;
        idx = _this.ajaxPool.indexOf(jqPromise);
        if (idx !== -1) {
          return _this.ajaxPool.splice(idx, 1);
        }
      };
    })(this));
  };

  Model.prototype.dispose = function() {
    var i, len, ref, xhr;
    ref = this.ajaxPool;
    for (i = 0, len = ref.length; i < len; i++) {
      xhr = ref[i];
      xhr.abort();
    }
    return Model.__super__.dispose.apply(this, arguments);
  };

  return Model;

})(Chaplin.Model);



},{"chaplin":"9U5Jgg","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/lib/view.coffee":[function(require,module,exports){
var Chaplin, Cocktail, View, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Chaplin = require('chaplin');

Cocktail = require('cocktail');

module.exports = View = (function(superClass) {
  extend(View, superClass);

  function View() {
    return View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.autoRender = true;

  View.prototype.mixins = [];

  View.prototype.getTemplateFunction = function() {
    return this.template;
  };

  View.prototype.getTemplateHTML = function() {
    return this.getTemplateFunction()(this.getTemplateData());
  };

  View.prototype.initialize = function() {
    var i, len, mixin, ref, results;
    ref = this.mixins;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      mixin = ref[i];
      results.push(Cocktail.mixin(this, mixin));
    }
    return results;
  };

  View.prototype.getSize = function() {
    var width;
    width = $(window).width();
    if (width < 768) {
      return 'xs';
    } else if ((768 <= width && width < 992)) {
      return 'sm';
    } else if ((992 <= width && width < 1200)) {
      return 'md';
    } else {
      return 'sm';
    }
  };

  View.prototype.dispose = function() {
    this.trigger('dispose');
    return View.__super__.dispose.apply(this, arguments);
  };

  return View;

})(Chaplin.View);



},{"chaplin":"9U5Jgg","cocktail":"qFH0SM","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/mediator.coffee":[function(require,module,exports){
var Chaplin, mediator;

Chaplin = require('chaplin');

module.exports = mediator = Chaplin.mediator;

mediator.loadPlugin = function(name, force) {
  var promise, ref;
  if (force == null) {
    force = false;
  }
  if (this.plugins[name] === false) {
    return;
  }
  promise = new $.Deferred;
  if (((ref = this.plugins) != null ? ref[name] : void 0) && !force) {
    return promise.resolve();
  }
  Modernizr.load({
    load: "/" + this.options.adminSegment + "/plugins/" + name + ".js",
    complete: function() {
      return promise.resolve();
    },
    fail: (function(_this) {
      return function() {
        _this.plugins[name] = false;
        return promise.reject();
      };
    })(this)
  });
  return promise;
};



},{"chaplin":"9U5Jgg"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/bucket.coffee":[function(require,module,exports){
var Bucket, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Bucket = (function(superClass) {
  extend(Bucket, superClass);

  function Bucket() {
    return Bucket.__super__.constructor.apply(this, arguments);
  }

  Bucket.prototype.urlRoot = '/api/buckets';

  Bucket.prototype.defaults = {
    fields: [],
    color: 'teal',
    icon: 'edit'
  };

  return Bucket;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/buckets.coffee":[function(require,module,exports){
var Bucket, Buckets, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Bucket = require('models/bucket');

module.exports = Buckets = (function(superClass) {
  extend(Buckets, superClass);

  function Buckets() {
    return Buckets.__super__.constructor.apply(this, arguments);
  }

  Buckets.prototype.url = '/api/buckets';

  Buckets.prototype.model = Bucket;

  Buckets.prototype.comparator = 'name';

  return Buckets;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/bucket":"client/source/models/bucket.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/build.coffee":[function(require,module,exports){
var Build, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Build = (function(superClass) {
  extend(Build, superClass);

  function Build() {
    return Build.__super__.constructor.apply(this, arguments);
  }

  Build.prototype.urlRoot = '/api/builds/';

  Build.prototype.defaults = {
    env: 'staging'
  };

  Build.prototype.checkDropbox = function() {
    return this.api('/api/builds/dropbox/check');
  };

  Build.prototype.disconnectDropbox = function() {};

  return Build;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/buildfile.coffee":[function(require,module,exports){
var Model, Template,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Template = (function(superClass) {
  extend(Template, superClass);

  function Template() {
    return Template.__super__.constructor.apply(this, arguments);
  }

  Template.prototype.urlRoot = function() {
    return "/api/buildfiles/" + (this.get('build_env')) + "/";
  };

  Template.prototype.idAttribute = 'filename';

  Template.prototype.defaults = {
    filename: '',
    contents: '',
    build_env: 'staging'
  };

  return Template;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/buildfiles.coffee":[function(require,module,exports){
var BuildFile, Collection, Templates, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Collection = require('lib/collection');

BuildFile = require('models/buildfile');

module.exports = Templates = (function(superClass) {
  extend(Templates, superClass);

  function Templates() {
    return Templates.__super__.constructor.apply(this, arguments);
  }

  Templates.prototype.build_env = 'staging';

  Templates.prototype.url = function() {
    console.log('fetching group', this.build_env);
    return "/api/buildfiles/" + this.build_env + "/";
  };

  Templates.prototype.model = BuildFile;

  Templates.prototype.comparator = 'filename';

  Templates.prototype.getTree = function() {
    var tree;
    tree = {};
    _.map(this.toJSON(), function(obj) {
      var i, j, len, node, part, parts, path, pathId, ptr, results;
      parts = obj.filename.replace(/^\/|\/$/g, "").split('/');
      ptr = tree;
      pathId = "";
      path = "";
      results = [];
      for (i = j = 0, len = parts.length; j < len; i = ++j) {
        part = parts[i];
        node = {
          name: part,
          type: 'directory',
          pathId: pathId += ("_" + part).replace(/[^A-Za-z0-9 \-\_]/, '-'),
          path: path += part + "/"
        };
        if (i === parts.length - 1 && !obj.filename.match(/\/$/)) {
          node.type = 'file';
          node.path = obj.filename;
        }
        ptr[part] = ptr[part] || node;
        ptr[part].children = ptr[part].children || {};
        results.push(ptr = ptr[part].children);
      }
      return results;
    });
    return tree;
  };

  return Templates;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/buildfile":"client/source/models/buildfile.coffee","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/builds.coffee":[function(require,module,exports){
var Build, Builds, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Build = require('models/build');

module.exports = Builds = (function(superClass) {
  extend(Builds, superClass);

  function Builds() {
    return Builds.__super__.constructor.apply(this, arguments);
  }

  Builds.prototype.url = '/api/builds';

  Builds.prototype.model = Build;

  Builds.prototype.comparator = '-timestamp';

  return Builds;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/build":"client/source/models/build.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/entries.coffee":[function(require,module,exports){
var Collection, Entries, Entry,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Entry = require('models/entry');

module.exports = Entries = (function(superClass) {
  extend(Entries, superClass);

  function Entries() {
    return Entries.__super__.constructor.apply(this, arguments);
  }

  Entries.prototype.url = '/api/entries/';

  Entries.prototype.model = Entry;

  Entries.prototype.fetchByBucket = function(bucketId) {
    this.url += "?" + ($.param({
      bucketId: bucketId
    }));
    return this.fetch();
  };

  Entries.prototype.comparator = function(entry) {
    return -new Date(entry.get('publishDate')).getTime();
  };

  return Entries;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/entry":"client/source/models/entry.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/entry.coffee":[function(require,module,exports){
var Bucket, Entry, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

Bucket = require('models/bucket');

module.exports = Entry = (function(superClass) {
  extend(Entry, superClass);

  function Entry() {
    return Entry.__super__.constructor.apply(this, arguments);
  }

  Entry.prototype.defaults = {
    title: '',
    keywords: '',
    description: '',
    status: 'draft',
    slug: '',
    content: {}
  };

  Entry.prototype.urlRoot = '/api/entries';

  return Entry;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","models/bucket":"client/source/models/bucket.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/field.coffee":[function(require,module,exports){
var Field, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Field = (function(superClass) {
  extend(Field, superClass);

  function Field() {
    return Field.__super__.constructor.apply(this, arguments);
  }

  Field.prototype.defaults = {
    name: '',
    instructions: '',
    slug: '',
    settings: {}
  };

  Field.prototype.urlRoot = '/api/fields';

  return Field;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/fields.coffee":[function(require,module,exports){
var Collection, Field, Fields,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Field = require('models/field');

Collection = require('lib/collection');

module.exports = Fields = (function(superClass) {
  extend(Fields, superClass);

  function Fields() {
    return Fields.__super__.constructor.apply(this, arguments);
  }

  Fields.prototype.url = '/api/fields/';

  Fields.prototype.model = Field;

  Fields.prototype.comparator = 'sort';

  return Fields;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/field":"client/source/models/field.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/install.coffee":[function(require,module,exports){
var Install, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Install = (function(superClass) {
  extend(Install, superClass);

  function Install() {
    return Install.__super__.constructor.apply(this, arguments);
  }

  Install.prototype.urlRoot = '/api/install';

  return Install;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/member.coffee":[function(require,module,exports){
var Member, Model, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

module.exports = Member = (function(superClass) {
  extend(Member, superClass);

  function Member() {
    return Member.__super__.constructor.apply(this, arguments);
  }

  Member.prototype.urlRoot = function() {
    return "/api/buckets/" + (this.get('bucketId')) + "/members";
  };

  return Member;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/members.coffee":[function(require,module,exports){
var Collection, Member, Members, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Collection = require('lib/collection');

Member = require('models/member');

module.exports = Members = (function(superClass) {
  extend(Members, superClass);

  function Members() {
    return Members.__super__.constructor.apply(this, arguments);
  }

  Members.prototype.initialize = function(options) {
    this.bucketId = options.bucketId;
    return Members.__super__.initialize.apply(this, arguments);
  };

  Members.prototype.url = function() {
    return "/api/buckets/" + this.bucketId + "/members";
  };

  Members.prototype.model = Member;

  return Members;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/member":"client/source/models/member.coffee","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/password_reset.coffee":[function(require,module,exports){
var Model, PasswordReset,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = PasswordReset = (function(superClass) {
  extend(PasswordReset, superClass);

  function PasswordReset() {
    return PasswordReset.__super__.constructor.apply(this, arguments);
  }

  PasswordReset.prototype.urlRoot = '/api/reset';

  PasswordReset.prototype.idAttribute = 'token';

  return PasswordReset;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/route.coffee":[function(require,module,exports){
var Model, Route,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Route = (function(superClass) {
  extend(Route, superClass);

  function Route() {
    return Route.__super__.constructor.apply(this, arguments);
  }

  Route.prototype.urlRoot = '/api/routes';

  return Route;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/routes.coffee":[function(require,module,exports){
var Collection, Route, Routes,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Route = require('models/route');

module.exports = Routes = (function(superClass) {
  extend(Routes, superClass);

  function Routes() {
    return Routes.__super__.constructor.apply(this, arguments);
  }

  Routes.prototype.url = '/api/routes/';

  Routes.prototype.model = Route;

  Routes.prototype.comparator = 'sort';

  return Routes;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/route":"client/source/models/route.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/templates.coffee":[function(require,module,exports){
var BuildFiles, Templates,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BuildFiles = require('models/buildfiles');

module.exports = Templates = (function(superClass) {
  extend(Templates, superClass);

  function Templates() {
    return Templates.__super__.constructor.apply(this, arguments);
  }

  Templates.prototype.build_env = 'live';

  Templates.prototype.url = "/api/buildfiles/live/?type=template";

  return Templates;

})(BuildFiles);



},{"models/buildfiles":"client/source/models/buildfiles.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/user.coffee":[function(require,module,exports){
var Model, User, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

module.exports = User = (function(superClass) {
  extend(User, superClass);

  function User() {
    return User.__super__.constructor.apply(this, arguments);
  }

  User.prototype.urlRoot = '/api/users';

  User.prototype.defaults = {
    roles: []
  };

  User.prototype.hasRole = function(name, id, type) {
    return _.any(this.get('roles'), function(role) {
      if (role.name === 'administrator') {
        return true;
      }
      return role.name === name && ((!id && role.resourceType === type) || (role.resourceId === id));
    });
  };

  return User;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/models/users.coffee":[function(require,module,exports){
var Collection, User, Users,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

User = require('models/user');

module.exports = Users = (function(superClass) {
  extend(Users, superClass);

  function Users() {
    return Users.__super__.constructor.apply(this, arguments);
  }

  Users.prototype.url = '/api/users/';

  Users.prototype.model = User;

  return Users;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/user":"client/source/models/user.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/routes.coffee":[function(require,module,exports){
var AuthController, BucketsController, ErrorController, HelpController, InstallController, RoutesController, SettingsController, TemplatesController;

ErrorController = require('controllers/error_controller');

SettingsController = require('controllers/settings_controller');

TemplatesController = require('controllers/templates_controller');

BucketsController = require('controllers/buckets_controller');

InstallController = require('controllers/install_controller');

RoutesController = require('controllers/routes_controller');

AuthController = require('controllers/auth_controller');

HelpController = require('controllers/help_controller');

module.exports = function(match) {
  match('install', 'install#firstuser', {
    params: {
      authRequired: false
    }
  });
  match('login', 'auth#login', {
    params: {
      authRequired: false
    }
  });
  match('reset/:token', 'auth#resetPassword', {
    params: {
      authRequired: false
    }
  });
  match('buckets/add', 'buckets#add');
  match('buckets/:slug', 'buckets#browse');
  match('buckets/:slug/add', 'buckets#browse', {
    params: {
      add: true
    }
  });
  match('buckets/:slug/fields', 'buckets#editFields');
  match('buckets/:slug/settings/members', 'buckets#settings', {
    params: {
      activeTab: 3
    }
  });
  match('buckets/:slug/settings/fields', 'buckets#settings', {
    params: {
      activeTab: 2
    }
  });
  match('buckets/:slug/settings', 'buckets#settings', {
    params: {
      activeTab: 1
    }
  });
  match('buckets/:slug/:entryID', 'buckets#browse');
  match('design(/:env)(/*filename)', 'templates#edit');
  match('routes', 'routes#list');
  match('help(/*doc)', 'help#index');
  match('settings', 'settings#basic');
  match('users(/:email)', 'settings#users');
  match('', 'buckets#dashboard');
  return match(':missing*', 'buckets#missing');
};



},{"controllers/auth_controller":"client/source/controllers/auth_controller.coffee","controllers/buckets_controller":"client/source/controllers/buckets_controller.coffee","controllers/error_controller":"client/source/controllers/error_controller.coffee","controllers/help_controller":"client/source/controllers/help_controller.coffee","controllers/install_controller":"client/source/controllers/install_controller.coffee","controllers/routes_controller":"client/source/controllers/routes_controller.coffee","controllers/settings_controller":"client/source/controllers/settings_controller.coffee","controllers/templates_controller":"client/source/controllers/templates_controller.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/login.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "next", (depth0 != null ? depth0.next : depth0), {"name":"hidden","hash":{},"data":data})))
    + "\n";
},"3":function(depth0,helpers,partials,data) {
  return " to continue";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<form class=\"container-fluid\" action=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/login\" method=\"POST\">\n  <div class=\"row\">\n    <div class=\"col-sm-4 col-sm-offset-4\">\n      <header id=\"bkts-hdr\">\n        "
    + escapeExpression(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"logo","hash":{},"data":data}) : helper)))
    + "\n      </header>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.next : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n      <fieldset>\n\n      <h3>Please log in";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.next : depth0), {"name":"if","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + ":</h3>\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "username", "", {"name":"input","hash":{
    'size': ("lg"),
    'type': ("email"),
    'placeholder': ("Email"),
    'autocomplete': ("on")
  },"data":data})))
    + "\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "password", "", {"name":"input","hash":{
    'size': ("lg"),
    'type': ("password"),
    'placeholder': ("Password"),
    'autocomplete': ("on")
  },"data":data})))
    + "\n      "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Log in", {"name":"submit","hash":{
    'className': ("btn btn-lg btn-block btn-primary ladda-button")
  },"data":data})))
    + "\n\n      <p><br><br><a href=\"#forgot\">Forget your password?</a></p>\n      </fieldset>\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/reset.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<form>\n  <div class=\"row\">\n    <div class=\"col-sm-4 col-sm-offset-4\">\n    <div class=\"center\">\n      "
    + escapeExpression(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"logo","hash":{},"data":data}) : helper)))
    + "\n      <h3>Enter a new password for "
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "</h3>\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "password", "", {"name":"input","hash":{
    'type': ("password")
  },"data":data})))
    + "\n      "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "token", (depth0 != null ? depth0.token : depth0), {"name":"hidden","hash":{},"data":data})))
    + "\n      "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save new password", {"name":"submit","hash":{},"data":data})))
    + "\n    </div>\n  </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/dashboard.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  return "<div class=\"row\">\n  <h1 class=\"page-title color-yellow\">Buckets</h1>\n\n  <div class=\"col-md-4 col-sm-6\">\n    <div class=\"panel\">\n      <div class=\"panel-body\">\n        <p class=\"lead\">Buckets is an open-source CMS, built in Node.js, which is being actively developed by <a href=\"https://assembly.com/buckets\" target=\"_blank\">the community at Assembly</a>.</p>\n      </div>\n    </div>\n  </div>\n</div>\n";
  },"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/edit.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "      <a href=\"#delete\" class=\"btn btn-link btn-icon pull-right\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n      Edit Bucket\n";
},"3":function(depth0,helpers,partials,data) {
  return "      New Bucket\n";
  },"5":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "    <ul class=\"nav nav-tabs\">\n      <li class=\"active\">\n        <a href=\"";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.program(8, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\" data-target=\"#basic\" data-toggle=\"tab\">Basic</a>\n      </li>\n      <li>\n        <a href=\"";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(10, data),"inverse":this.program(8, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\" data-target=\"#fields\" data-toggle=\"tab\">Fields</a>\n      </li>\n\n      <li>\n        <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "/settings/members\" data-target=\"#members\" data-toggle=\"tab\">Members</a>\n      </li>\n    </ul>\n";
},"6":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "/settings";
},"8":function(depth0,helpers,partials,data) {
  return "#";
  },"10":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "/settings/fields";
},"12":function(depth0,helpers,partials,data,depths) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "                <div data-value="
    + escapeExpression(lambda(depth0, depth0))
    + " ";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, depth0, (depths[1] != null ? depths[1].icon : depths[1]), {"name":"is","hash":{},"fn":this.program(13, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">\n                  "
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, depth0, {"name":"icon","hash":{},"data":data})))
    + "\n                </div>\n";
},"13":function(depth0,helpers,partials,data) {
  return "class=\"selected\"";
  },"15":function(depth0,helpers,partials,data,depths) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, buffer = "                <div data-value=\""
    + escapeExpression(lambda(depth0, depth0))
    + "\" class=\""
    + escapeExpression(lambda(depth0, depth0));
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, depth0, (depths[1] != null ? depths[1].color : depths[1]), {"name":"is","hash":{},"fn":this.program(16, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\"></div>\n";
},"16":function(depth0,helpers,partials,data) {
  return " selected";
  },"18":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "singular", (depth0 != null ? depth0.singular : depth0), {"name":"input","hash":{
    'placeholder': ("Thing"),
    'label': ("What’s the singular version?")
  },"data":data})))
    + "\n\n              "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "titlePlaceholder", (depth0 != null ? depth0.titlePlaceholder : depth0), {"name":"input","hash":{
    'placeholder': ("Use a | to provide multiple, randomized, placeholders."),
    'label': ("Title Placeholder Text")
  },"data":data})))
    + "\n";
},"20":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save Bucket", {"name":"submit","hash":{
    'size': ("lg")
  },"data":data})))
    + "\n";
},"22":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Next: Define fields", {"name":"submit","hash":{
    'size': ("lg")
  },"data":data})))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<form class=\"row\">\n  <h1 class=\"page-title\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(1, data, depths),"inverse":this.program(3, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "  </h1>\n  <div class=\"col-md-8\">\n    <!-- Nav tabs -->\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(5, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "    <div class=\"tab-content\">\n      <div class=\"tab-pane active\" id=\"basic\">\n        <div class=\"row\">\n          <div class=\"col-sm-3\">\n            <div class=\"icon-preview pull-right center\">\n              <div class=\"color-"
    + escapeExpression(((helper = (helper = helpers.color || (depth0 != null ? depth0.color : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"color","hash":{},"data":data}) : helper)))
    + "\">\n                "
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, (depth0 != null ? depth0.icon : depth0), {"name":"icon","hash":{},"data":data})))
    + "\n              </div>\n            </div>\n          </div>\n          <div class=\"col-sm-9\">\n            "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "name", (depth0 != null ? depth0.name : depth0), {"name":"input","hash":{
    'label': ("What does this bucket hold?"),
    'size': ("lg"),
    'slugValue': ((depth0 != null ? depth0.slug : depth0)),
    'slugName': ("slug"),
    'placeholder': ((depth0 != null ? depth0.randomBucketPlaceholder : depth0))
  },"data":data})))
    + "\n\n            <label>Icon</label>\n\n            <div class=\"swatches icons\">\n              "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "icon", (depth0 != null ? depth0.icon : depth0), {"name":"hidden","hash":{},"data":data})))
    + "\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.icons : depth0), {"name":"each","hash":{},"fn":this.program(12, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "            </div>\n\n            <label>Color</label>\n            "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "color", (depth0 != null ? depth0.color : depth0), {"name":"hidden","hash":{},"data":data})))
    + "\n\n            <div class=\"swatches colors\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.colors : depth0), {"name":"each","hash":{},"fn":this.program(15, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "            </div>\n\n            <br>\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(18, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(20, data, depths),"inverse":this.program(22, data, depths),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "          </div>\n        </div>\n      </div>\n      <div class=\"tab-pane\" id=\"fields\"></div>\n      <div class=\"tab-pane\" id=\"members\"></div>\n    </div>\n  </div>\n</form>\n";
},"useData":true,"useDepths":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/fields.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "    <li class=\"list-group-item field\" data-field-slug=\""
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "\">\n      <div class=\"pull-right\">\n        <a class=\"btn btn-link btn-icon btn-icon-small handle\" href=\"#\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "cursor-move", {"name":"icon","hash":{},"data":data})))
    + "</a>\n      </div>\n      <h3 class=\"list-group-item-heading\"><a href=\"#edit\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</a></h3>\n      <p class=\"list-group-item-text\">\n        <span class=\"label label-default\">"
    + escapeExpression(((helper = (helper = helpers.fieldType || (depth0 != null ? depth0.fieldType : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"fieldType","hash":{},"data":data}) : helper)))
    + "</span>\n        <code>{{"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "<span></span>}}</code>\n        <a class=\"btn btn-link btn-icon\" href=\"#remove\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n      </p>\n    </li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<p class=\"lead\">Custom fields define what your bucket holds.</p>\n\n<div class=\"row\">\n  <div class=\"col-sm-6\">\n    "
    + escapeExpression(((helpers.select || (depth0 && depth0.select) || helperMissing).call(depth0, "fieldType", "", (depth0 != null ? depth0.fieldTypes : depth0), {"name":"select","hash":{
    'valueKey': ("value")
  },"data":data})))
    + "\n  </div>\n</div>\n\n<div class=\"editField\"></div>\n\n<ul id=\"sortable-fields\" class=\"fieldsList sortable list-group\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "</ul>\n\n"
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/browser.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return "hidden";
  },"3":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "      <a title=\"Settings\" href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.slug : stack1), depth0))
    + "/settings\" class=\"btn btn-link btn-icon btn-icon-small pull-right show-tooltip\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "ellipsis", {"name":"icon","hash":{},"data":data})))
    + "</a>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, lambda=this.lambda, escapeExpression=this.escapeExpression, helperMissing=helpers.helperMissing, functionType="function", buffer = "<div class=\"row\">\n  <h1 class=\"page-title color-"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.color : stack1), depth0))
    + "\">\n    "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.name : stack1), depth0))
    + "\n    <span class=\"hasEntries pull-right ";
  stack1 = ((helpers.empty || (depth0 && depth0.empty) || helperMissing).call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"empty","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\">\n      <a class=\"btn btn-link btn-icon btn-icon-small show-tooltip\" title=\"Add "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.singular : stack1), depth0))
    + "\" href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.slug : stack1), depth0))
    + "/add\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "plus", {"name":"icon","hash":{},"data":data})))
    + "</a>\n    </span>\n";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "administrator", {"name":"hasRole","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </h1>\n  <div class=\"col-md-5 col-sm-4 sidebar\">\n    <div class=\"entries\"></div>\n  </div>\n  <div class=\"col-md-7 col-sm-8 entry-detail\">\n\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/edit.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "editor", ((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.id : stack1), {"name":"hasRole","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"2":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "            <p>Submitted by "
    + escapeExpression(((helpers.gravatar || (depth0 && depth0.gravatar) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.author : depth0)) != null ? stack1.email_hash : stack1), {"name":"gravatar","hash":{},"data":data})))
    + " "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.author : depth0)) != null ? stack1.name : stack1), depth0))
    + "</p>\n";
},"4":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <a href=\"#delete\" class=\"btn btn-icon btn-icon-small btn-link pull-right\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n";
},"6":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "live", {"name":"is","hash":{},"fn":this.program(7, data),"inverse":this.program(9, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"9":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "pending", {"name":"is","hash":{},"fn":this.program(10, data),"inverse":this.program(15, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"10":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "editor", ((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.id : stack1), {"name":"hasRole","hash":{},"fn":this.program(11, data),"inverse":this.program(13, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"11":function(depth0,helpers,partials,data) {
  return "                  <a class=\"btn btn-primary\" href=\"#publish\">Approve &amp; publish</a>\n";
  },"13":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "                  "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"15":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "                "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"17":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "editor", ((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.id : stack1), {"name":"hasRole","hash":{},"fn":this.program(18, data),"inverse":this.program(20, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"18":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Publish", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"20":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Submit to publish", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"22":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "draft", {"name":"is","hash":{},"fn":this.program(23, data),"inverse":this.program(28, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "                <li><a href=\"#date\">Publish on…</a></li>\n";
},"23":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(24, data),"inverse":this.program(26, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"24":function(depth0,helpers,partials,data) {
  return "                    <li><a href=\"#publish\">Publish now</a></li>\n";
  },"26":function(depth0,helpers,partials,data) {
  return "                    <li><a href=\"#draft\">Save as a draft</a></li>\n";
  },"28":function(depth0,helpers,partials,data) {
  return "                  <li><a href=\"#draft\">Save as a draft</a></li>\n";
  },"30":function(depth0,helpers,partials,data) {
  return "                <li><a href=\"#copy\">Copy as a new draft</a></li>\n";
  },"32":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "editor", ((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.id : stack1), {"name":"hasRole","hash":{},"fn":this.program(33, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"33":function(depth0,helpers,partials,data) {
  return "                  <li><a href=\"#reject\">Reject</a></li>\n";
  },"35":function(depth0,helpers,partials,data) {
  return "hidden";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", lambda=this.lambda, buffer = "<form>\n  "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "author", ((stack1 = (depth0 != null ? depth0.author : depth0)) != null ? stack1.id : stack1), {"name":"hidden","hash":{},"data":data})))
    + "\n  "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "bucket", ((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.id : stack1), {"name":"hidden","hash":{},"data":data})))
    + "\n\n  <div class=\"panel panel-default\">\n    <div class=\"panel-body\">\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "title", (depth0 != null ? depth0.title : depth0), {"name":"input","hash":{
    'required': (true),
    'label': ("Title"),
    'size': ("lg"),
    'slugValue': ((depth0 != null ? depth0.slug : depth0)),
    'slugName': ("slug"),
    'placeholder': ((depth0 != null ? depth0.newTitle : depth0))
  },"data":data})))
    + "\n\n      <div class=\"userFields\"></div>\n      <div class=\"clearfix\"></div>\n\n      <div class=\"entry-publish\">\n";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "pending", {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "        <div class=\"btn-group\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(6, data),"inverse":this.program(17, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "          <div class=\"btn-group\">\n            <a type=\"button\" class=\"btn btn-primary dropdown-toggle\" data-toggle=\"dropdown\" href=\"#\"><span class=\"caret\"></span></a>\n            <ul class=\"dropdown-menu\">\n";
  stack1 = ((helpers.isnt || (depth0 && depth0.isnt) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "live", {"name":"isnt","hash":{},"fn":this.program(22, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(30, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "pending", {"name":"is","hash":{},"fn":this.program(32, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "             </ul>\n          </div>\n        </div>\n        <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.slug : stack1), depth0))
    + "/\" class=\"btn btn-link\">Cancel</a>\n      </div>\n\n      <h4 data-toggle=\"collapse\" data-target=\"#meta\" class=\"collapsed\"><span class=\"caret\"></span> Meta</h4>\n      <div id=\"meta\" class=\"collapse\">\n        <div class=\"dateInput ";
  stack1 = ((helpers.isnt || (depth0 && depth0.isnt) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "live", {"name":"isnt","hash":{},"fn":this.program(35, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\">\n          <div class=\"form-group\">\n            "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "publishDate", (depth0 != null ? depth0.publishDate : depth0), {"name":"input","hash":{
    'label': ("Publish Date"),
    'placeholder': ("Tomorrow at 9am")
  },"data":data})))
    + "\n          </div>\n        </div>\n        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "keywords", (depth0 != null ? depth0.keywords : depth0), {"name":"input","hash":{
    'size': ("sm"),
    'label': ("Keywords")
  },"data":data})))
    + "\n        "
    + escapeExpression(((helpers.textarea || (depth0 && depth0.textarea) || helperMissing).call(depth0, "description", (depth0 != null ? depth0.description : depth0), {"name":"textarea","hash":{
    'size': ("sm"),
    'label': ("Description")
  },"data":data})))
    + "\n      </div>\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/list.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda;
  return "<div class=\"fallback\">\n  <p class=\"lead\">\n    This bucket doesn’t have any entries yet.\n  </p>\n  <a class=\"btn btn-primary\" href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.slug : stack1), depth0))
    + "/add\">Add your first "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.singular : stack1), depth0))
    + "</a>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/row.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function";
  return "      <span class=\"label label-"
    + escapeExpression(((helpers.statusColor || (depth0 && depth0.statusColor) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), {"name":"statusColor","hash":{},"data":data})))
    + "\">\n        "
    + escapeExpression(((helper = (helper = helpers.status || (depth0 != null ? depth0.status : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"status","hash":{},"data":data}) : helper)))
    + "\n      </span>\n    ";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, lambda=this.lambda, buffer = "<div class=\"entry\" data-entry-id=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">\n  <h3><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.slug : stack1), depth0))
    + "/"
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.title || (depth0 != null ? depth0.title : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"title","hash":{},"data":data}) : helper)))
    + "</a></h3>\n  <div class=\"text-muted ui-text\">\n    "
    + escapeExpression(((helpers.gravatar || (depth0 && depth0.gravatar) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.author : depth0)) != null ? stack1.email_hash : stack1), {"name":"gravatar","hash":{},"data":data})))
    + "\n";
  stack1 = ((helpers.isnt || (depth0 && depth0.isnt) || helperMissing).call(depth0, (depth0 != null ? depth0.status : depth0), "live", {"name":"isnt","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + " &nbsp;"
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.publishDate : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/edit.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save field", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Add field", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<form>\n  <div class=\"panel panel-default\">\n    <div class=\"panel-body\">\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "name", (depth0 != null ? depth0.name : depth0), {"name":"input","hash":{
    'size': ("lg"),
    'slugValue': ((depth0 != null ? depth0.slug : depth0)),
    'slugName': ("fieldSlug"),
    'placeholder': ("My field"),
    'label': ("Field Label")
  },"data":data})))
    + "\n\n      "
    + escapeExpression(((helpers.textarea || (depth0 && depth0.textarea) || helperMissing).call(depth0, "instructions", (depth0 != null ? depth0.instructions : depth0), {"name":"textarea","hash":{
    'label': ("User Instructions")
  },"data":data})))
    + "\n\n      <div class=\"settings\"></div>\n\n      <div class=\"pull-right\">\n        <a href=\"#cancel\" class=\"btn btn-default\">Cancel</a>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </div>\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/input.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  "
    + escapeExpression(((helpers.textarea || (depth0 && depth0.textarea) || helperMissing).call(depth0, (depth0 != null ? depth0.slug : depth0), (depth0 != null ? depth0.value : depth0), {"name":"textarea","hash":{
    'size': (((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.size : stack1)),
    'required': ((depth0 != null ? depth0.required : depth0)),
    'help': ((depth0 != null ? depth0.instructions : depth0)),
    'label': ((depth0 != null ? depth0.name : depth0))
  },"data":data})))
    + "\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  "
    + escapeExpression(((helpers.checkbox || (depth0 && depth0.checkbox) || helperMissing).call(depth0, (depth0 != null ? depth0.slug : depth0), (depth0 != null ? depth0.value : depth0), {"name":"checkbox","hash":{
    'size': (((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.size : stack1)),
    'label': ((depth0 != null ? depth0.name : depth0))
  },"data":data})))
    + "\n";
},"5":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, (depth0 != null ? depth0.slug : depth0), (depth0 != null ? depth0.value : depth0), {"name":"input","hash":{
    'size': (((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.size : stack1)),
    'required': ((depth0 != null ? depth0.required : depth0)),
    'help': ((depth0 != null ? depth0.instructions : depth0)),
    'type': ((depth0 != null ? depth0.fieldType : depth0)),
    'label': ((depth0 != null ? depth0.name : depth0))
  },"data":data})))
    + "\n";
},"7":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "  "
    + escapeExpression(((helpers.cloudinaryUpload || (depth0 && depth0.cloudinaryUpload) || helperMissing).call(depth0, (depth0 != null ? depth0.slug : depth0), (depth0 != null ? depth0.value : depth0), {"name":"cloudinaryUpload","hash":{
    'label': ((depth0 != null ? depth0.name : depth0)),
    'help': ((depth0 != null ? depth0.instructions : depth0))
  },"data":data})))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "textarea", {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "checkbox", {"name":"is","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "text", {"name":"is","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "number", {"name":"is","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "cloudinary_image", {"name":"is","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/settings.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "  "
    + escapeExpression(((helpers.checkbox || (depth0 && depth0.checkbox) || helperMissing).call(depth0, "required", ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.required : stack1), {"name":"checkbox","hash":{
    'label': ("This field is required")
  },"data":data})))
    + "\n  "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "placeholder", ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.placeholder : stack1), {"name":"input","hash":{
    'label': ("Placeholder Text")
  },"data":data})))
    + "\n  <select name=\"size\" class=\"form-control\">\n    <option value=\"\">Default</option>\n    <option value=\"lg\"";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.size : stack1), "lg", {"name":"is","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += ">Large</option>\n    <option value=\"sm\"";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, ((stack1 = (depth0 != null ? depth0.settings : depth0)) != null ? stack1.size : stack1), "sm", {"name":"is","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + ">Small</option>\n  </select>\n";
},"2":function(depth0,helpers,partials,data) {
  return " selected";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.isnt || (depth0 && depth0.isnt) || helperMissing).call(depth0, (depth0 != null ? depth0.fieldType : depth0), "checkbox", {"name":"isnt","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/install/firstuser.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<form class=\"container-fluid\">\n  <div class=\"row\">\n    <div class=\"col-md-4 col-md-offset-4\">\n      "
    + escapeExpression(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"logo","hash":{},"data":data}) : helper)))
    + "\n      <h4>Hi! First, let’s set you up as the admin:</h4>\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "name", "", {"name":"input","hash":{
    'placeholder': ("Name")
  },"data":data})))
    + "\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "email", "", {"name":"input","hash":{
    'placeholder': ("Email")
  },"data":data})))
    + "\n      "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "password", "", {"name":"input","hash":{
    'type': ("password"),
    'placeholder': ("Password")
  },"data":data})))
    + "\n\n      "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Sign Up", {"name":"submit","hash":{},"data":data})))
    + "\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/layouts/loggedin.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <li class=\"bucket color-"
    + escapeExpression(((helper = (helper = helpers.color || (depth0 != null ? depth0.color : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"color","hash":{},"data":data}) : helper)))
    + "\">\n              <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "\">\n                "
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, (depth0 != null ? depth0.icon : depth0), {"name":"icon","hash":{},"data":data})))
    + " "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n              </a>\n              <a class=\"bucket-add\" href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/"
    + escapeExpression(((helper = (helper = helpers.slug || (depth0 != null ? depth0.slug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"slug","hash":{},"data":data}) : helper)))
    + "/add\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "add", {"name":"icon","hash":{},"data":data})))
    + "</a>\n            </li>\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <li><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/buckets/add\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "add", {"name":"icon","hash":{},"data":data})))
    + " New Bucket</a></li>\n";
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <li class=\"divider\"></li>\n            <li><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/routes\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "direction-sign", {"name":"icon","hash":{},"data":data})))
    + " Routes</a></li>\n            <li><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/design/\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "html", {"name":"icon","hash":{},"data":data})))
    + " Design</a></li>\n            <li class=\"divider\"></li>\n            <li><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/users\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "user", {"name":"icon","hash":{},"data":data})))
    + " People</a></li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"container-fluid loggedInView\">\n  <div class=\"row\">\n    <nav class=\"col-xs-12\" id=\"bkts-sidebar\">\n      <div class=\"bkts-sidebar-inner\">\n        <header id=\"bkts-hdr\">\n          <span class=\"visible-xs\" data-toggle=\"nav-primary\">\n            <a href=\"#menu\" class=\"btn btn-menu\">\n              <span></span>\n              <span></span>\n              <span></span>\n            </a>\n          </span>\n          "
    + escapeExpression(((helper = (helper = helpers.logo || (depth0 != null ? depth0.logo : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"logo","hash":{},"data":data}) : helper)))
    + "\n        </header>\n\n        <ul class=\"nav nav-pills nav-stacked nav-primary hidden-xs collapse in\" id=\"nav-primary\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.buckets : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "administrator", {"name":"hasRole","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "administrator", {"name":"hasRole","hash":{},"fn":this.program(5, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + "          <li class=\"divider\"></li>\n          <li class=\"usernav dropup btn-group\">\n            <a href=\"#\" data-toggle=\"dropdown\">\n              "
    + escapeExpression(((helpers.gravatar || (depth0 && depth0.gravatar) || helperMissing).call(depth0, (depth0 != null ? depth0.email_hash : depth0), {"name":"gravatar","hash":{},"data":data})))
    + " <span class=\"caret\"></span>\n              <span class=\"sr-only\">Toggle Dropdown</span>\n\n              "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "\n            </a>\n            <ul class=\"dropdown-menu\" role=\"menu\">\n              <li class=\"logout\">\n                <a class=\"noscript\" href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/logout\">Log&nbsp;out</a>\n                <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/docs/api/\" target=\"_blank\">API Docs</a>\n                <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/users/"
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "\">Profile</a>\n                <a href=\"/\" class=\"noscript\">Return to website</a>\n              </li>\n            </ul>\n          </li>\n          <li>\n            <footer id=\"bkts-ftr\">\n              <br>\n              <a class=\"show-tooltip btn-icon btn-small btn-link pull-right\" title=\"Fork me on GitHub\" href=\"https://github.com/asm-products/buckets\" target=\"_blank\"><span class=\"icon buckets-icon-github\"></span></a>\n\n              <strong>Buckets <small>"
    + escapeExpression(((helper = (helper = helpers.version || (depth0 != null ? depth0.version : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"version","hash":{},"data":data}) : helper)))
    + "</small></strong>\n            </footer>\n          </li>\n        </ul>\n      </div>\n    </nav>\n\n    <div class=\"clearfix visible-xs\"></div>\n    <div class=\"page col-xs-12\"></div>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/members/list.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.users : depth0), {"name":"if","hash":{},"fn":this.program(2, data),"inverse":this.program(5, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  <hr>\n";
},"2":function(depth0,helpers,partials,data) {
  var stack1, buffer = "    <form role=\"form\" class=\"well add-member\">\n      <div class=\"form-group\">\n        <select name=\"user\" class=\"form-control\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.users : depth0), {"name":"each","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "        </select>\n      </div>\n      <div class=\"form-group\">\n        <div class=\"radio\">\n          <label>\n            <input type=\"radio\" name=\"role\" id=\"role-contributor\" value=\"contributor\" checked> <strong>Contributor</strong><br> Can add items to this Bucket, but can not publish them directly or edit entry slugs.\n          </label>\n        </div>\n        <div class=\"radio\">\n          <label>\n            <input type=\"radio\" name=\"role\" id=\"role-editor\" value=\"editor\"> <strong>Editor</strong><br> Can publish directly and edit slugs.\n          </label>\n        </div>\n      </div>\n      <div class=\"form-group\">\n        <button type=\"submit\" class=\"btn btn-primary\">Add member</button>\n      </div>\n    </form>\n";
},"3":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "            <option value=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</option>\n";
},"5":function(depth0,helpers,partials,data) {
  var stack1, lambda=this.lambda, escapeExpression=this.escapeExpression;
  return "    <div class=\"lead\">\n      All users are members of "
    + escapeExpression(lambda(((stack1 = (depth0 != null ? depth0.bucket : depth0)) != null ? stack1.name : stack1), depth0))
    + ".\n    </div>\n";
},"7":function(depth0,helpers,partials,data) {
  var stack1, buffer = "      <ul class=\"nav nav-stacked nav-pills members\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"each","hash":{},"fn":this.program(8, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </ul>\n";
},"8":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <li class=\"member clearfix\" data-member-id=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">\n          <a href=\"#\" class=\"btn btn-link delete-member pull-right\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n          <div>\n            <strong>"
    + escapeExpression(((helpers.gravatar || (depth0 && depth0.gravatar) || helperMissing).call(depth0, (depth0 != null ? depth0.email_hash : depth0), {"name":"gravatar","hash":{},"data":data})))
    + " "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</strong>\n            <small>"
    + escapeExpression(((helper = (helper = helpers.role || (depth0 != null ? depth0.role : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"role","hash":{},"data":data}) : helper)))
    + "</small>\n          </div>\n        </li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "administrator", {"name":"hasRole","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n<div class=\"row\">\n  <div class=\"col-md-12\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"if","hash":{},"fn":this.program(7, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/edit.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save route", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"3":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Add route", {"name":"submit","hash":{},"data":data})))
    + "\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<form class=\"well\">\n  <div class=\"row\">\n    <div class=\"col-sm-12\">\n      <div class=\"form-group\">\n        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "urlPattern", (depth0 != null ? depth0.urlPattern : depth0), {"name":"input","hash":{
    'label': ("Route"),
    'size': ("lg"),
    'placeholder': ("/myroute/:param")
  },"data":data})))
    + "\n      </div>\n      <div class=\"form-group\">\n        "
    + escapeExpression(((helpers.select || (depth0 && depth0.select) || helperMissing).call(depth0, "template", (depth0 != null ? depth0.template : depth0), (depth0 != null ? depth0.templates : depth0), {"name":"select","hash":{
    'label': ("Template"),
    'nameKey': ("filename"),
    'valueKey': ("filename")
  },"data":data})))
    + "\n      </div>\n\n      <div class=\"pull-right\">\n        <a href=\"#cancel\" class=\"btn btn-default\">Cancel</a>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </div>\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/list.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <li>\n          <div class=\"route\" data-route-id=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">\n            <h2>\n              <div class=\"pull-right\">\n                <a href=\"#delete\" class=\"btn btn-link btn-icon btn-icon-small\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a> <a class=\"btn btn-link btn-icon btn-icon-small handle\" href=\"#\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "cursor-move", {"name":"icon","hash":{},"data":data})))
    + "</a>\n\n                <span class=\"text-muted\"><span class=\"arrow\">&#8677;</span> <code><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/templates/"
    + escapeExpression(((helper = (helper = helpers.template || (depth0 != null ? depth0.template : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"template","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.template || (depth0 != null ? depth0.template : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"template","hash":{},"data":data}) : helper)))
    + "</a></code></span>\n              </div>\n\n              <a href=\"#edit\">"
    + escapeExpression(((helper = (helper = helpers.renderRoute || (depth0 != null ? depth0.renderRoute : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"renderRoute","hash":{},"data":data}) : helper)))
    + "</a>\n\n            </h2>\n          </div>\n        </li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"row\">\n  <h1 class=\"page-title color-yellow\">\n    Routes\n    <div class=\"pull-right\">\n      "
    + escapeExpression(((helpers.helpIcon || (depth0 && depth0.helpIcon) || helperMissing).call(depth0, "More about URL patterns", {"name":"helpIcon","hash":{
    'docsPath': ("routes.md")
  },"data":data})))
    + "\n      <a class=\"btn btn-link btn-icon btn-icon-small\" href=\"#new\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "plus", {"name":"icon","hash":{},"data":data})))
    + "</a>\n    </div>\n  </h1>\n</div>\n\n<div class=\"editRoute\"></div>\n\n<div class=\"row\">\n\n  <div class=\"col-md-8\">\n    <ul id=\"sortable-routes\" class=\"sortable\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"each","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "    </ul>\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/settings/basic.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "<h3>Basic Settings</h3>\n\n"
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "text", "Website name", {"name":"input","hash":{},"data":data})))
    + "\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/directory.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data,depths) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.type : depth0), "file", {"name":"is","hash":{},"fn":this.program(2, data, depths),"inverse":this.program(5, data, depths),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"2":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, helperMissing=helpers.helperMissing, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", buffer = "\n    <li";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.path : depth0), (depths[2] != null ? depths[2].active : depths[2]), {"name":"is","hash":{},"fn":this.program(3, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer + " data-env=\""
    + escapeExpression(lambda((depths[2] != null ? depths[2].env : depths[2]), depth0))
    + "\" data-path=\""
    + escapeExpression(((helper = (helper = helpers.path || (depth0 != null ? depth0.path : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"path","hash":{},"data":data}) : helper)))
    + "\">\n      <a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/design/"
    + escapeExpression(lambda((depths[2] != null ? depths[2].env : depths[2]), depth0))
    + "/"
    + escapeExpression(((helper = (helper = helpers.path || (depth0 != null ? depth0.path : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"path","hash":{},"data":data}) : helper)))
    + "\">"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</a>\n      <div class=\"input-group-btn\">"
    + escapeExpression(lambda((depths[2] != null ? depths[2].env : depths[2]), depth0))
    + "\n        <a href=\"#deleteFile\" class=\"btn btn-link btn-icon btn-icon-small\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n      </div>\n    </li>\n";
},"3":function(depth0,helpers,partials,data) {
  return " class=\"active\"";
  },"5":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, lambda=this.lambda, escapeExpression=this.escapeExpression, functionType="function", helperMissing=helpers.helperMissing, buffer = "\n    <li>\n      <h4 data-toggle=\"collapse\" data-target=\"#collapse-"
    + escapeExpression(lambda((depths[2] != null ? depths[2].env : depths[2]), depth0))
    + escapeExpression(((helper = (helper = helpers.pathId || (depth0 != null ? depth0.pathId : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"pathId","hash":{},"data":data}) : helper)))
    + "\"";
  stack1 = ((helpers.startsWith || (depth0 && depth0.startsWith) || helperMissing).call(depth0, (depths[2] != null ? depths[2].active : depths[2]), (depth0 != null ? depth0.path : depth0), {"name":"startsWith","hash":{},"fn":this.program(6, data, depths),"inverse":this.program(8, data, depths),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "><span class=\"caret\"></span> "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</h4>\n      <ul class=\"collapse";
  stack1 = ((helpers.startsWith || (depth0 && depth0.startsWith) || helperMissing).call(depth0, (depths[2] != null ? depths[2].active : depths[2]), (depth0 != null ? depth0.path : depth0), {"name":"startsWith","hash":{},"fn":this.program(10, data, depths),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\" id=\"collapse-"
    + escapeExpression(lambda((depths[2] != null ? depths[2].env : depths[2]), depth0))
    + escapeExpression(((helper = (helper = helpers.pathId || (depth0 != null ? depth0.pathId : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"pathId","hash":{},"data":data}) : helper)))
    + "\">\n";
  stack1 = this.invokePartial(partials.directory, '        ', 'directory', depth0, {
    'active': ((depths[2] != null ? depths[2].active : depths[2])),
    'env': ((depths[2] != null ? depths[2].env : depths[2])),
    'children': ((depth0 != null ? depth0.children : depth0))
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </ul>\n    </li>\n";
},"6":function(depth0,helpers,partials,data) {
  return "";
},"8":function(depth0,helpers,partials,data) {
  return " class=\"collapsed\"";
  },"10":function(depth0,helpers,partials,data) {
  return " in";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data,depths) {
  var stack1, helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = escapeExpression(((helper = (helper = helpers.debug || (depth0 != null ? depth0.debug : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"debug","hash":{},"data":data}) : helper)))
    + "\n\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.children : depth0), {"name":"each","hash":{},"fn":this.program(1, data, depths),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"usePartial":true,"useData":true,"useDepths":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/editor.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  return " class=\"active\"";
  },"3":function(depth0,helpers,partials,data) {
  return " active";
  },"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <div class=\"build "
    + escapeExpression(((helper = (helper = helpers.env || (depth0 != null ? depth0.env : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"env","hash":{},"data":data}) : helper)))
    + "\" data-id=\""
    + escapeExpression(((helper = (helper = helpers.id || (depth0 != null ? depth0.id : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"id","hash":{},"data":data}) : helper)))
    + "\">\n            <p class=\"text-muted\">\n              <strong>"
    + escapeExpression(((helper = (helper = helpers.message || (depth0 != null ? depth0.message : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"message","hash":{},"data":data}) : helper)))
    + "</strong> · "
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.timestamp : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + "\n              <br>\n              <a href=\"#stage\" class=\"btn btn-default btn-sm\">Copy to Staging</a>\n              <a href=\"#delete\" class=\"btn btn-icon btn-link btn-icon-small\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "trash", {"name":"icon","hash":{},"data":data})))
    + "</a>\n              <hr>\n            </p>\n          </div>\n";
},"7":function(depth0,helpers,partials,data) {
  return "          <h5>No Archives created yet.</h5><p>Archives are automatically generated when a build is pushed to live, or a new staging environment is detected.</p>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helper, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, functionType="function", buffer = "<form class=\"row\">\n  <h1 class=\"page-title\">\n    Design\n\n    <div class=\"pull-right\">\n      "
    + escapeExpression(((helpers.helpIcon || (depth0 && depth0.helpIcon) || helperMissing).call(depth0, "View Template documentation", {"name":"helpIcon","hash":{
    'docsPath': ("templates.md")
  },"data":data})))
    + "\n      <a href=\"#new\" class=\"btn btn-link btn-icon\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "plus", {"name":"icon","hash":{},"data":data})))
    + "</a>\n    </div>\n  </h1>\n\n  <div class=\"col-md-3\">\n    <ul class=\"nav nav-tabs\" role=\"tablist\">\n      <li";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.env : depth0), "staging", {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "><a href=\"#env-staging\" role=\"tab\" data-toggle=\"tab\">Staging</a></li>\n      <li";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.env : depth0), "live", {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "><a href=\"#env-live\" role=\"tab\" data-toggle=\"tab\">Live</a></li>\n      <li><a href=\"#env-archives\" role=\"tab\" data-toggle=\"tab\">Archives</a></li>\n    </ul>\n\n    <div class=\"tab-content\">\n      <div class=\"tab-pane fade in";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.env : depth0), "staging", {"name":"is","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\" id=\"env-staging\">\n\n        <ul class=\"nav nav-pills nav-stacked\">\n";
  stack1 = this.invokePartial(partials.directory, '          ', 'directory', depth0, {
    'active': ((depth0 != null ? depth0.filename : depth0)),
    'env': ("staging"),
    'children': ((depth0 != null ? depth0.stagingFiles : depth0))
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </ul>\n\n        <br>\n        <p>\n          <a href=\"//"
    + escapeExpression(((helper = (helper = helpers.stagingUrl || (depth0 != null ? depth0.stagingUrl : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"stagingUrl","hash":{},"data":data}) : helper)))
    + "\" class=\"btn btn-block btn-default\" target=\"_blank\">View Staging</a>\n          <a href=\"/api/builds/staging/download\" class=\"btn btn-block btn-default\">Download Staging</a>\n          <a href=\"#publish\" class=\"btn btn-block btn-success button-ladda\" data-style=\"zoom-in\">Copy Staging to Live</a>\n        </p>\n      </div>\n\n      <div class=\"tab-pane fade in";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.env : depth0), "live", {"name":"is","hash":{},"fn":this.program(3, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\" id=\"env-live\">\n        <ul class=\"nav nav-pills nav-stacked\">\n";
  stack1 = this.invokePartial(partials.directory, '          ', 'directory', depth0, {
    'active': ((depth0 != null ? depth0.filename : depth0)),
    'env': ("live"),
    'children': ((depth0 != null ? depth0.liveFiles : depth0))
  }, helpers, partials, data);
  if (stack1 != null) { buffer += stack1; }
  buffer += "        </ul>\n        <a href=\"/api/builds/live/download\" class=\"btn btn-block btn-default noscript\">Download Live</a>\n        <a href=\"/\" class=\"btn btn-block btn-default noscript\" target=\"_blank\">View Live</a>\n      </div>\n\n      <div class=\"tab-pane fade in\" id=\"env-archives\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.archives : depth0), {"name":"each","hash":{},"fn":this.program(5, data),"inverse":this.program(7, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </div>\n    </div>\n  </div>\n  <div class=\"col-md-9\">\n    <div class=\"panel\">\n      <div class=\"panel-body\">\n        "
    + escapeExpression(((helpers.textarea || (depth0 && depth0.textarea) || helperMissing).call(depth0, "contents", (depth0 != null ? depth0.contents : depth0), {"name":"textarea","hash":{
    'size': ("lg"),
    'className': ("form-control code")
  },"data":data})))
    + "\n        <div class=\"form-group\">\n          <div class=\"input-group\">\n            <input name=\"filename\" value=\""
    + escapeExpression(((helper = (helper = helpers.filename || (depth0 != null ? depth0.filename : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"filename","hash":{},"data":data}) : helper)))
    + "\" placeholder=\"Filename\" class=\"form-control\">\n            <div class=\"input-group-btn\">\n              "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save file", {"name":"submit","hash":{},"data":data})))
    + "\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n</form>\n";
},"usePartial":true,"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/edit.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "      <h4 data-toggle=\"collapse\" data-target=\"#changePassword\" class=\"collapsed\"><span class=\"caret\"></span> Update your password</h4>\n      <div id=\"changePassword\" class=\"collapse\">\n        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "oldpassword", "", {"name":"input","hash":{
    'type': ("password"),
    'placeholder': ("Old password")
  },"data":data})))
    + "\n        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "password", "", {"name":"input","hash":{
    'type': ("password"),
    'placeholder': ("New password")
  },"data":data})))
    + "\n        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "passwordconfirm", "", {"name":"input","hash":{
    'type': ("password"),
    'placeholder': ("Confirm new password")
  },"data":data})))
    + "\n      </div>\n      "
    + escapeExpression(((helpers.hidden || (depth0 && depth0.hidden) || helperMissing).call(depth0, "admin", (depth0 != null ? depth0.isAdmin : depth0), {"name":"hidden","hash":{},"data":data})))
    + "\n";
},"3":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(4, data),"inverse":this.program(9, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  stack1 = ((helpers.hasRole || (depth0 && depth0.hasRole) || helperMissing).call(depth0, "administrator", {"name":"hasRole","hash":{},"fn":this.program(11, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"4":function(depth0,helpers,partials,data) {
  var stack1, buffer = "";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.last_active : depth0), {"name":"if","hash":{},"fn":this.program(5, data),"inverse":this.program(7, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"5":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <p>"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + " was last active "
    + escapeExpression(((helpers.timeAgo || (depth0 && depth0.timeAgo) || helperMissing).call(depth0, (depth0 != null ? depth0.last_active : depth0), {"name":"timeAgo","hash":{},"data":data})))
    + ".</p>\n";
},"7":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "          <p>"
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + " has not logged in yet.</p>\n";
},"9":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "password", "", {"name":"input","hash":{
    'type': ("password"),
    'placeholder': ("Password")
  },"data":data})))
    + "\n";
},"11":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <h4>Permissions</h4>\n        "
    + escapeExpression(((helpers.checkbox || (depth0 && depth0.checkbox) || helperMissing).call(depth0, "admin", (depth0 != null ? depth0.isAdmin : depth0), {"name":"checkbox","hash":{
    'label': ("User is an administrator")
  },"data":data})))
    + "\n";
},"13":function(depth0,helpers,partials,data) {
  var stack1, buffer = "\n      <h5>Dropbox</h5>\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.dropbox : depth0), {"name":"if","hash":{},"fn":this.program(14, data),"inverse":this.program(16, data),"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "\n";
},"14":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a href=\"#importDropbox\" class=\"btn btn-default\">Import</a>\n        <a href=\"#deploy\" class=\"btn btn-primary\">Deploy your preview site</a>\n        <a href=\"/api/disconnect/dropbox\" class=\"btn btn-xs btn-link btn-icon btn-icon-small\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "dropbox", {"name":"icon","hash":{},"data":data})))
    + " Disconnect</a>\n";
},"16":function(depth0,helpers,partials,data) {
  var helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <a href=\"/api/connect/dropbox\" class=\"btn btn-link btn-large btn-icon noscript\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "dropbox", {"name":"icon","hash":{},"data":data})))
    + " Connect to Dropbox</a>\n        <p>Deploy design updates with one click or stage changes and preview them.</p>\n";
},"18":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, buffer = "";
  stack1 = ((helpers.isnt || (depth0 && depth0.isnt) || helperMissing).call(depth0, (depth0 != null ? depth0.id : depth0), ((stack1 = (depth0 != null ? depth0.currentUser : depth0)) != null ? stack1.id : stack1), {"name":"isnt","hash":{},"fn":this.program(19, data),"inverse":this.noop,"data":data}));
  if (stack1 != null) { buffer += stack1; }
  return buffer;
},"19":function(depth0,helpers,partials,data) {
  return "          <a class=\"btn btn-danger\" href=\"#remove\">Remove this user</a>\n";
  },"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<form class=\"panel panel-default\" autocomplete=\"off\">\n  <div class=\"panel-body\">\n    "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "name", (depth0 != null ? depth0.name : depth0), {"name":"input","hash":{
    'label': ("Name"),
    'placeholder': ("Full name")
  },"data":data})))
    + "\n    "
    + escapeExpression(((helpers.input || (depth0 && depth0.input) || helperMissing).call(depth0, "email", (depth0 != null ? depth0.email : depth0), {"name":"input","hash":{
    'label': ("Email"),
    'placeholder': ("Email")
  },"data":data})))
    + "\n\n";
  stack1 = ((helpers.is || (depth0 && depth0.is) || helperMissing).call(depth0, (depth0 != null ? depth0.id : depth0), ((stack1 = (depth0 != null ? depth0.currentUser : depth0)) != null ? stack1.id : stack1), {"name":"is","hash":{},"fn":this.program(1, data),"inverse":this.program(3, data),"data":data}));
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.dropboxEnabled : depth0), {"name":"if","hash":{},"fn":this.program(13, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  buffer += "\n    <div class=\"pull-right\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.id : depth0), {"name":"if","hash":{},"fn":this.program(18, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      "
    + escapeExpression(((helpers.submit || (depth0 && depth0.submit) || helperMissing).call(depth0, "Save", {"name":"submit","hash":{},"data":data})))
    + "\n    </div>\n  </div>\n</form>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/list.hbs":[function(require,module,exports){
// hbsfy compiled Handlebars template
var HandlebarsCompiler = require('hbsfy/runtime');
module.exports = HandlebarsCompiler.template({"1":function(depth0,helpers,partials,data) {
  var stack1, buffer = "      <ul class=\"nav nav-stacked nav-pills users\">\n";
  stack1 = helpers.each.call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"each","hash":{},"fn":this.program(2, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "      </ul>\n";
},"2":function(depth0,helpers,partials,data) {
  var helper, functionType="function", helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression;
  return "        <li><a href=\"/"
    + escapeExpression(((helper = (helper = helpers.adminSegment || (depth0 != null ? depth0.adminSegment : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"adminSegment","hash":{},"data":data}) : helper)))
    + "/users/"
    + escapeExpression(((helper = (helper = helpers.email || (depth0 != null ? depth0.email : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"email","hash":{},"data":data}) : helper)))
    + "\"><strong>"
    + escapeExpression(((helpers.gravatar || (depth0 && depth0.gravatar) || helperMissing).call(depth0, (depth0 != null ? depth0.email_hash : depth0), {"name":"gravatar","hash":{},"data":data})))
    + " "
    + escapeExpression(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : helperMissing),(typeof helper === functionType ? helper.call(depth0, {"name":"name","hash":{},"data":data}) : helper)))
    + "</strong></a></li>\n";
},"compiler":[6,">= 2.0.0-beta.1"],"main":function(depth0,helpers,partials,data) {
  var stack1, helperMissing=helpers.helperMissing, escapeExpression=this.escapeExpression, buffer = "<div class=\"row\">\n  <h1 class=\"page-title\">Users <a href=\"#add\" class=\"btn btn-link btn-icon pull-right\">"
    + escapeExpression(((helpers.icon || (depth0 && depth0.icon) || helperMissing).call(depth0, "plus", {"name":"icon","hash":{},"data":data})))
    + "</a></h1>\n\n  <div class=\"col-md-3 col-sm-4\">\n";
  stack1 = helpers['if'].call(depth0, (depth0 != null ? depth0.items : depth0), {"name":"if","hash":{},"fn":this.program(1, data),"inverse":this.noop,"data":data});
  if (stack1 != null) { buffer += stack1; }
  return buffer + "  </div>\n  <hr class=\"visible-xs\">\n  <div class=\"col-sm-8 detail\">\n  </div>\n</div>\n";
},"useData":true});

},{"hbsfy/runtime":"pu95bm"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/auth/login.coffee":[function(require,module,exports){
var FormMixin, LoginView, View, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/auth/login');

FormMixin = require('views/base/mixins/form');

mediator = require('chaplin').mediator;

module.exports = LoginView = (function(superClass) {
  extend(LoginView, superClass);

  function LoginView() {
    return LoginView.__super__.constructor.apply(this, arguments);
  }

  LoginView.prototype.template = tpl;

  LoginView.prototype.container = '#bkts-content';

  LoginView.prototype.className = 'loginView';

  LoginView.prototype.optionNames = View.prototype.optionNames.concat(['next']);

  LoginView.prototype.mixins = [FormMixin];

  LoginView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#forgot"]': 'clickForgot',
    'click [href="#cancel"]': 'clickCancel'
  };

  LoginView.prototype.render = function() {
    LoginView.__super__.render.apply(this, arguments);
    this.$logo = this.$('#logo');
    TweenLite.from(this.$logo, .4, {
      scale: .3,
      ease: Back.easeOut
    });
    TweenLite.from(this.$logo, .4, {
      y: '150px',
      ease: Back.easeOut,
      delay: .2
    });
    return TweenLite.from(this.$('fieldset'), .2, {
      opacity: 0,
      scale: .9,
      ease: Sine.easeOut,
      delay: .3
    });
  };

  LoginView.prototype.submitForm = function(e) {
    var $form, email, ref;
    if (!e.originalEvent) {
      return;
    }
    e.preventDefault();
    $form = $(e.currentTarget);
    if ($form.hasClass('forgot')) {
      email = (ref = this.formParams()) != null ? ref.username : void 0;
      return this.submit($.post('/api/forgot', {
        email: email
      })).error((function(_this) {
        return function() {
          _this.$('input:visible').eq(0).focus();
          return toastr.error('Could not find a user with that email address.');
        };
      })(this)).done((function(_this) {
        return function() {
          toastr.success("A password reset email has been sent to " + email + ".");
          return _this.render();
        };
      })(this));
    } else {
      return this.submit($.post("/" + mediator.options.adminSegment + "/checkLogin", this.formParams())).done(function() {
        return $form.submit();
      }).error((function(_this) {
        return function() {
          TweenLite.to(_this.$logo, 0.15, {
            transformOrigin: 'middle bottom 25',
            rotationY: 20,
            ease: Expo.easeInOut
          });
          TweenLite.to(_this.$logo, 0.15, {
            delay: .1,
            rotationY: -20,
            ease: Expo.easeInOut
          });
          TweenLite.to(_this.$logo, 0.15, {
            delay: .25,
            rotationY: 20,
            ease: Expo.easeInOut
          });
          return TweenLite.to(_this.$logo, .8, {
            delay: .4,
            rotationY: 0,
            ease: Elastic.easeOut
          });
        };
      })(this));
    }
  };

  LoginView.prototype.clickForgot = function(e) {
    e.preventDefault();
    this.$('input[name="password"]').slideUp(100);
    this.$('h3').text('Enter your account email:');
    this.$('.btn-primary').text('Reset your password');
    this.$('input:visible').eq(0).focus();
    this.$('form').addClass('forgot');
    return this.$(e.currentTarget).attr('href', '#cancel').text('Cancel');
  };

  LoginView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.render();
  };

  LoginView.prototype.getTemplateData = function() {
    if (this.next) {
      return {
        next: "/" + mediator.options.adminSegment + "/" + this.next
      };
    }
  };

  return LoginView;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/auth/login":"client/source/templates/auth/login.hbs","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/auth/reset_password.coffee":[function(require,module,exports){
var FormMixin, ResetPasswordView, View, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/auth/reset');

FormMixin = require('views/base/mixins/form');

module.exports = ResetPasswordView = (function(superClass) {
  extend(ResetPasswordView, superClass);

  function ResetPasswordView() {
    return ResetPasswordView.__super__.constructor.apply(this, arguments);
  }

  ResetPasswordView.prototype.template = tpl;

  ResetPasswordView.prototype.container = '#bkts-content';

  ResetPasswordView.prototype.className = 'loginView';

  ResetPasswordView.prototype.mixins = [FormMixin];

  ResetPasswordView.prototype.events = {
    'submit form': 'submitForm'
  };

  ResetPasswordView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams()));
  };

  return ResetPasswordView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/auth/reset":"client/source/templates/auth/reset.hbs","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/base/mixins/form.coffee":[function(require,module,exports){
var _, getSlug;

_ = require('underscore');

getSlug = require('speakingurl');

module.exports = {
  render: function() {
    this.delegate('keyup', 'input[data-sluggify]', this.keyUpSluggify);
    return _.defer((function(_this) {
      return function() {
        var $firstField;
        if (_this.disposed) {
          return;
        }
        $firstField = _this.$('.form-control').eq(0);
        if (!Modernizr.touch) {
          $firstField.focus();
        }
        return _this.$('.input-slug').each(function(i, el) {
          var $slug, ref;
          $slug = $(el);
          return $slug.data('has-value', ((ref = $slug.val()) != null ? ref.length : void 0) > 0);
        });
      };
    })(this));
  },
  formParams: function() {
    return this.$el.formParams(false);
  },
  submit: function(promise) {
    var $btn;
    $btn = this.$('.ladda-button').ladda();
    $btn.ladda('start');
    return promise.always(function() {
      if ($btn != null ? $btn.data('ladda') : void 0) {
        return $btn.ladda('stop');
      }
    }).fail(_.bind(this.renderServerErrors, this));
  },
  renderServerErrors: function(res) {
    var errors, ref;
    this.clearFormErrors();
    if (errors = res != null ? (ref = res.responseJSON) != null ? ref.errors : void 0 : void 0) {
      _.each(errors, (function(_this) {
        return function(error) {
          var message;
          if (error.type === 'required' || error.message === 'required') {
            message = '<span class="label label-danger">Required</span>';
          } else {
            message = error.message;
          }
          return _this.$("[name=\"" + error.path + "\"]").closest('.form-group').find('.help-block').remove().end().addClass('has-error').append("<span class=\"help-block\">" + message + "</span>");
        };
      })(this));
      return this.$('.has-error').eq(0).find('[name]').eq(0).focus();
    }
  },
  clearFormErrors: function() {
    this.$('.help-block').remove();
    return this.$('.has-error').removeClass('has-error');
  },
  keyUpSluggify: function(e) {
    var $el, $target, val;
    $el = this.$(e.currentTarget);
    val = $el.val();
    $target = this.$("input[name=\"" + ($el.data('sluggify')) + "\"]");
    if ($target.data('has-value')) {
      return;
    }
    return $target.val(getSlug(val));
  }
};



},{"speakingurl":"/Users/iuriikozuliak/Projects/buckets/node_modules/speakingurl/index.js","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/base/page.coffee":[function(require,module,exports){
var PageView, View,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

module.exports = PageView = (function(superClass) {
  extend(PageView, superClass);

  function PageView() {
    return PageView.__super__.constructor.apply(this, arguments);
  }

  PageView.prototype.region = 'content';

  return PageView;

})(View);



},{"lib/view":"client/source/lib/view.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/dashboard.coffee":[function(require,module,exports){
var DashboardView, PageView, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

tpl = require('templates/buckets/dashboard');

module.exports = DashboardView = (function(superClass) {
  extend(DashboardView, superClass);

  function DashboardView() {
    return DashboardView.__super__.constructor.apply(this, arguments);
  }

  DashboardView.prototype.template = tpl;

  return DashboardView;

})(PageView);



},{"templates/buckets/dashboard":"client/source/templates/buckets/dashboard.hbs","views/base/page":"client/source/views/base/page.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/edit.coffee":[function(require,module,exports){
var BucketEditView, BucketFieldsView, FormMixin, MembersList, PageView, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

PageView = require('views/base/page');

BucketFieldsView = require('views/buckets/fields');

MembersList = require('views/members/list');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/buckets/edit');

module.exports = BucketEditView = (function(superClass) {
  extend(BucketEditView, superClass);

  function BucketEditView() {
    return BucketEditView.__super__.constructor.apply(this, arguments);
  }

  BucketEditView.prototype.template = tpl;

  BucketEditView.prototype.optionNames = PageView.prototype.optionNames.concat(['fields', 'members', 'users']);

  BucketEditView.prototype.mixins = [FormMixin];

  BucketEditView.prototype.regions = {
    'fields': '#fields',
    'members': '#members'
  };

  BucketEditView.prototype.events = {
    'submit form': 'submitForm',
    'click .swatches div': 'selectSwatch',
    'click [href="#delete"]': 'clickDelete'
  };

  BucketEditView.prototype.getTemplateData = function() {
    return _.extend(BucketEditView.__super__.getTemplateData.apply(this, arguments), {
      randomBucketPlaceholder: _.sample(['Articles', 'Songs', 'Videos', 'Events']),
      colors: ['green', 'teal', 'blue', 'purple', 'red', 'orange', 'yellow', 'gray'],
      icons: ['edit', 'camera-front', 'calendar', 'video-camera', 'headphone', 'map', 'chat-bubble', 'shopping-bag', 'user', 'goal', 'megaphone', 'star', 'bookmark', 'toolbox']
    });
  };

  BucketEditView.prototype.render = function() {
    BucketEditView.__super__.render.apply(this, arguments);
    this.subview('bucketFields', new BucketFieldsView({
      collection: this.fields,
      region: 'fields'
    }));
    if (this.members && this.users) {
      return this.subview('bucketMembers', new MembersList({
        collection: this.members,
        bucket: this.model,
        users: this.users,
        region: 'members'
      }));
    }
  };

  BucketEditView.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    data = this.formParams();
    data.color = this.$('.colors div.selected').data('value');
    data.icon = this.$('.icons div.selected').data('value');
    data.fields = this.fields.toJSON();
    return this.submit(this.model.save(data, {
      wait: true
    }));
  };

  BucketEditView.prototype.selectSwatch = function(e) {
    var $el;
    e.preventDefault();
    $el = this.$(e.currentTarget);
    $el.addClass('selected').siblings().removeClass('selected');
    return this.updateIconPreview();
  };

  BucketEditView.prototype.updateIconPreview = function() {
    var $color;
    $color = this.$('.icon-preview > div').removeClass().addClass('color-' + this.$('.colors div.selected').data('value'));
    return $color.find('> span').removeClass().addClass('icon buckets-icon-' + this.$('.icons div.selected').data('value'));
  };

  BucketEditView.prototype.clickDelete = function(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      return this.model.destroy({
        wait: true
      });
    }
  };

  BucketEditView.prototype.setActiveTab = function(idx) {
    return this.$('.nav-tabs li').eq(idx - 1).find('a').click();
  };

  return BucketEditView;

})(PageView);



},{"templates/buckets/edit":"client/source/templates/buckets/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee","views/buckets/fields":"client/source/views/buckets/fields.coffee","views/members/list":"client/source/views/members/list.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/fields.coffee":[function(require,module,exports){
var BucketFieldsView, Field, FieldEditView, Model, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

Model = require('lib/model');

FieldEditView = require('views/fields/edit');

Field = require('models/field');

tpl = require('templates/buckets/fields');

mediator = require('mediator');

module.exports = BucketFieldsView = (function(superClass) {
  extend(BucketFieldsView, superClass);

  function BucketFieldsView() {
    this.updateSort = bind(this.updateSort, this);
    return BucketFieldsView.__super__.constructor.apply(this, arguments);
  }

  BucketFieldsView.prototype.template = tpl;

  BucketFieldsView.prototype.events = {
    'change [name="fieldType"]': 'addField',
    'click [href="#edit"]': 'clickEdit',
    'click [href="#remove"]': 'clickRemove'
  };

  BucketFieldsView.prototype.listen = {
    'add collection': 'render',
    'remove collection': 'render'
  };

  BucketFieldsView.prototype.attach = function() {
    var $sortable;
    BucketFieldsView.__super__.attach.apply(this, arguments);
    $sortable = this.$('#sortable-fields');
    if ($sortable.length) {
      return new Sortable($sortable.get(0), {
        handle: '.handle',
        onUpdate: this.updateSort
      });
    }
  };

  BucketFieldsView.prototype.updateSort = function() {
    var $sortable;
    $sortable = this.$el.find('#sortable-fields');
    return $sortable.children().each((function(_this) {
      return function(i, li) {
        var model;
        model = _this.collection.findWhere({
          slug: $(li).data('field-slug')
        });
        if (model) {
          return model.set({
            sort: i
          });
        }
      };
    })(this));
  };

  BucketFieldsView.prototype.getTemplateData = function() {
    var fieldTypes, plugin, pluginSlug, ref;
    fieldTypes = [
      {
        name: 'Add a field…'
      }, {
        name: 'Text',
        value: 'text'
      }, {
        name: 'Number',
        value: 'number'
      }, {
        name: 'Checkbox',
        value: 'checkbox'
      }, {
        name: 'Textarea',
        value: 'textarea'
      }, {
        name: 'Image',
        value: 'cloudinary_image'
      }
    ];
    ref = mediator.plugins;
    for (pluginSlug in ref) {
      plugin = ref[pluginSlug];
      if (plugin != null ? plugin.name : void 0) {
        fieldTypes.push({
          name: plugin.name,
          value: pluginSlug
        });
      }
    }
    return _.extend(BucketFieldsView.__super__.getTemplateData.apply(this, arguments), {
      fieldTypes: fieldTypes
    });
  };

  BucketFieldsView.prototype.addField = function(e) {
    var $el, field, fieldType;
    $el = this.$(e.currentTarget);
    fieldType = $el.val();
    field = new Field({
      fieldType: fieldType
    });
    return this.renderEditField(field);
  };

  BucketFieldsView.prototype.clickEdit = function(e) {
    var field, idx;
    e.preventDefault();
    idx = $(e.currentTarget).closest('li').index();
    field = this.collection.at(idx);
    return this.renderEditField(field);
  };

  BucketFieldsView.prototype.renderEditField = function(field) {
    var editField;
    editField = this.subview('editField', new FieldEditView({
      container: this.$('.editField'),
      model: field
    }));
    return this.listenToOnce(field, 'change', function(field) {
      this.subview('editField').dispose();
      this.collection.add(field, {
        at: 0
      });
      this.updateSort();
      return this.render();
    });
  };

  BucketFieldsView.prototype.clickRemove = function(e) {
    var field, fieldType, idx, name, ref;
    e.preventDefault();
    idx = $(e.currentTarget).closest('li').index();
    field = this.collection.at(idx);
    ref = field.toJSON(), name = ref.name, fieldType = ref.fieldType;
    if (field && confirm("Are you sure you want to remove the “" + name + "” " + fieldType + " field?")) {
      return this.collection.remove(field);
    }
  };

  return BucketFieldsView;

})(View);



},{"lib/model":"client/source/lib/model.coffee","lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","models/field":"client/source/models/field.coffee","templates/buckets/fields":"client/source/templates/buckets/fields.hbs","underscore":"l0hNr+","views/fields/edit":"client/source/views/fields/edit.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/browser.coffee":[function(require,module,exports){
var Chaplin, EntriesBrowser, EntriesList, Entry, EntryEditView, Handlebars, PageView, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Handlebars = require('hbsfy/runtime');

Chaplin = require('chaplin');

PageView = require('views/base/page');

EntriesList = require('views/entries/list');

Entry = require('models/entry');

EntryEditView = require('views/entries/edit');

tpl = require('templates/entries/browser');

mediator = require('mediator');

module.exports = EntriesBrowser = (function(superClass) {
  extend(EntriesBrowser, superClass);

  function EntriesBrowser() {
    this.modelSaved = bind(this.modelSaved, this);
    return EntriesBrowser.__super__.constructor.apply(this, arguments);
  }

  EntriesBrowser.prototype.template = tpl;

  EntriesBrowser.prototype.optionNames = PageView.prototype.optionNames.concat(['bucket']);

  EntriesBrowser.prototype.regions = {
    'detail': '.entry-detail',
    'list': '.entries'
  };

  EntriesBrowser.prototype.listen = {
    'all collection': 'checkLength'
  };

  EntriesBrowser.prototype.getTemplateData = function() {
    var ref;
    return _.extend(EntriesBrowser.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      items: (ref = this.collection) != null ? ref.toJSON() : void 0
    });
  };

  EntriesBrowser.prototype.render = function() {
    EntriesBrowser.__super__.render.apply(this, arguments);
    return this.subview('EntryList', new EntriesList({
      collection: this.collection,
      bucket: this.bucket
    }));
  };

  EntriesBrowser.prototype.loadEntry = function(entryID) {
    this.model = this.collection.findWhere({
      id: entryID
    }) || new Entry({
      id: entryID
    });
    return this.model.fetch().done((function(_this) {
      return function() {
        _this.$('.entry').removeClass('active').filter("[data-entry-id=" + (_this.model.get('id')) + "]").addClass('active');
        _this.model.set({
          publishDate: Handlebars.helpers.simpleDateTime(_this.model.get('publishDate'))
        }, {
          silent: true
        });
        _this.model.on('sync', _this.modelSaved);
        return _this.renderDetailView();
      };
    })(this));
  };

  EntriesBrowser.prototype.loadNewEntry = function() {
    this.$('.entry.active').removeClass('active');
    this.model = new Entry({
      author: mediator.user.toJSON()
    });
    this.model.on('sync', this.modelSaved);
    return this.renderDetailView();
  };

  EntriesBrowser.prototype.clearEntry = function() {
    var subview;
    subview = this.subview('editEntry');
    if (!(subview != null ? subview.$el : void 0)) {
      return;
    }
    subview.$el.fadeOut(100, function() {
      return subview != null ? subview.dispose() : void 0;
    });
    return this.$('.entry').removeClass('active');
  };

  EntriesBrowser.prototype.modelSaved = function(entry, newData) {
    var notificationMessage;
    if (newData != null ? newData.id : void 0) {
      notificationMessage = "You saved “" + (entry.get('title')) + "”";
      if (newData.publishDate != null) {
        if (new Date(newData.publishDate).getTime() > new Date().getTime()) {
          notificationMessage = "You scheduled “" + (entry.get('title')) + "”";
        } else if (newData.status === "live") {
          notificationMessage = "You published “" + (entry.get('title')) + "”";
        }
      } else if (newData.status === "draft") {
        if (entry.previousAttributes().lastModified !== newData.lastModified) {
          notificationMessage = "You updated “" + (entry.get('title')) + "”";
        } else {
          notificationMessage = "You saved “" + (entry.get('title')) + "” draft";
        }
      }
      toastr.success(notificationMessage);
      this.model.set(newData);
      this.collection.add(this.model);
    } else {
      toastr.success("You deleted “" + (entry.get('title')) + "”");
    }
    return Chaplin.utils.redirectTo('buckets#browse', {
      slug: this.bucket.get('slug')
    });
  };

  EntriesBrowser.prototype.renderDetailView = function() {
    var model, sv;
    sv = this.subview('editEntry', new EntryEditView({
      model: this.model,
      bucket: this.bucket,
      author: this.model.get('author') || mediator.user.toJSON()
    }));
    model = this.model;
    return this.listenToOnce(sv, 'dispose', (function(_this) {
      return function() {
        return model.off('sync', _this.modelSaved);
      };
    })(this));
  };

  EntriesBrowser.prototype.checkLength = function() {
    if (!this.disposed) {
      return this.$('.hasEntries').toggleClass('hidden', this.collection.length === 0);
    }
  };

  return EntriesBrowser;

})(PageView);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","models/entry":"client/source/models/entry.coffee","templates/entries/browser":"client/source/templates/entries/browser.hbs","underscore":"l0hNr+","views/base/page":"client/source/views/base/page.coffee","views/entries/edit":"client/source/views/entries/edit.coffee","views/entries/list":"client/source/views/entries/list.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/edit.coffee":[function(require,module,exports){
var Chaplin, EntryEditView, FieldTypeInputView, FormMixin, Model, PageView, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

PageView = require('views/base/page');

FormMixin = require('views/base/mixins/form');

FieldTypeInputView = require('views/fields/input');

Chaplin = require('chaplin');

tpl = require('templates/entries/edit');

mediator = require('mediator');

module.exports = EntryEditView = (function(superClass) {
  extend(EntryEditView, superClass);

  function EntryEditView() {
    return EntryEditView.__super__.constructor.apply(this, arguments);
  }

  EntryEditView.prototype.className = 'EntryEditView';

  EntryEditView.prototype.template = tpl;

  EntryEditView.prototype.optionNames = PageView.prototype.optionNames.concat(['bucket']);

  EntryEditView.prototype.region = 'detail';

  EntryEditView.prototype.regions = {
    'user-fields': '.userFields'
  };

  EntryEditView.prototype.mixins = [FormMixin];

  EntryEditView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#delete"]': 'clickDelete',
    'click [href="#draft"]': 'clickDraft',
    'click [href="#date"]': 'clickDate',
    'click [href="#publish"]': 'clickPublish',
    'click [href="#copy"]': 'clickCopy',
    'click [href="#reject"]': 'clickReject',
    'keydown textarea, [type=text], [type=number]': 'keyDown',
    'keyup textarea, [type=text], [type=number]': 'keyUp'
  };

  EntryEditView.prototype.keyUp = function(e) {
    if (this.cmdActive && e.which === 91) {
      this.cmdActive = false;
      return e;
    }
  };

  EntryEditView.prototype.keyDown = function(e) {
    if (this.cmdActive && e.which === 13) {
      this.$('form').submit();
    }
    this.cmdActive = e.metaKey;
    return e;
  };

  EntryEditView.prototype.getTemplateData = function() {
    var fields;
    fields = this.bucket.get('fields');
    _.map(fields, (function(_this) {
      return function(field) {
        field.value = _this.model.get(field.slug);
        return field;
      };
    })(this));
    return _.extend(EntryEditView.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      user: this.user,
      fields: fields,
      newTitle: this.bucket.get('titlePlaceholder') ? _.sample(this.bucket.get('titlePlaceholder').split('|')) : "New " + (this.bucket.get('singular'))
    });
  };

  EntryEditView.prototype.render = function() {
    var $keywords, content, popularKeywords;
    EntryEditView.__super__.render.apply(this, arguments);
    content = this.model.get('content');
    _.each(this.bucket.get('fields'), (function(_this) {
      return function(field) {
        var fieldModel, fieldValue, ref;
        fieldValue = content[field.slug];
        fieldModel = new Model(_.extend(field, {
          value: fieldValue
        }));
        _this.subview('field_' + field.slug, new FieldTypeInputView({
          model: fieldModel
        }));
        if ((ref = field.fieldType) === 'text' || ref === 'textarea' || ref === 'checkbox' || ref === 'number' || ref === 'cloudinary_image') {
          return;
        }
        return mediator.loadPlugin(field.fieldType).done(function() {
          var plugin;
          plugin = mediator.plugins[field.fieldType];
          if (plugin != null) {
            if (_.isFunction(plugin.inputView)) {
              return _this.subview('field_' + field.slug, new plugin.inputView({
                model: fieldModel,
                region: 'user-fields'
              }));
            } else if (_.isString(plugin.inputView)) {
              return _this.subview('field_' + field.slug, new FieldTypeInputView({
                template: plugin.inputView,
                model: fieldModel
              }));
            }
          }
          return _this.subview("field_" + field.slug).$el.html("<label class=\"text-danger\">" + field.name + "</label>\n<div class=\"alert alert-danger\">\n  <p>\n    <strong>Warning:</strong>\n    There was an error loading the input code for the <code>" + field.fieldType + "</code> FieldType.<br>\n  </p>\n</div>");
        });
      };
    })(this));
    popularKeywords = new Bloodhound({
      name: 'keywords',
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('keyword'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: {
        url: '/api/entries/keywords',
        ttl: 0
      }
    });
    popularKeywords.clearPrefetchCache();
    popularKeywords.initialize();
    $keywords = this.$('[name="keywords"]');
    $keywords.tagsinput({
      typeaheadjs: {
        name: 'keywords',
        displayKey: 'keyword',
        valueKey: 'keyword',
        source: popularKeywords.ttAdapter()
      }
    });
    return this.$('.bootstrap-tagsinput').addClass('form-control');
  };

  EntryEditView.prototype.submitForm = function(e) {
    var base, content, data, field, i, len, ref, simpleValue, status;
    e.preventDefault();
    content = {};
    ref = this.bucket.get('fields');
    for (i = 0, len = ref.length; i < len; i++) {
      field = ref[i];
      content[field.slug] = typeof (base = this.subview("field_" + field.slug)).getValue === "function" ? base.getValue() : void 0;
      if (content[field.slug]) {
        continue;
      }
      data = this.subview("field_" + field.slug).$el.formParams(false);
      simpleValue = data[field.slug];
      content[field.slug] = simpleValue != null ? simpleValue : data;
    }
    this.model.set({
      content: content
    });
    status = this.model.get('status');
    if (!this.model.get('id')) {
      this.model.set({
        status: 'live'
      });
    }
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickDelete = function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete " + (this.model.get('title')) + "?")) {
      return this.model.destroy({
        wait: true
      });
    }
  };

  EntryEditView.prototype.clickDraft = function(e) {
    e.preventDefault();
    this.model.set({
      status: 'draft'
    });
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickDate = function(e) {
    e.preventDefault();
    this.$('.dateInput').removeClass('hidden');
    $(e.currentTarget).parent().remove();
    this.$('button.btn-primary').text('Schedule');
    return this.$('.dateInput input').focus();
  };

  EntryEditView.prototype.clickPublish = function(e) {
    e.preventDefault();
    this.model.set(_.extend(this.formParams(), {
      publishDate: 'Now',
      status: 'live'
    }));
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickReject = function(e) {
    e.preventDefault();
    this.model.set(_.extend(this.formParams(), {
      publishDate: 'Now',
      status: 'rejected'
    }));
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickCopy = function(e) {
    var collection, newModel;
    e.preventDefault();
    newModel = this.model.clone();
    newModel.set(_.extend(this.formParams(), {
      id: null,
      publishDate: 'Now',
      status: 'draft'
    }));
    collection = this.model.collection;
    this.model = newModel;
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    })).done((function(_this) {
      return function(newEntry) {
        collection.add(newModel);
        newModel = null;
        collection = null;
        return Chaplin.utils.redirectTo('buckets#browse', {
          slug: _this.bucket.get('slug'),
          entryID: newEntry.id
        });
      };
    })(this));
  };

  EntryEditView.prototype.dispose = function() {
    if (!this.disposed) {
      this.$('.panel').css({
        opacity: 0
      });
      this.$('[name="keywords"]').tagsinput('destroy');
    }
    return EntryEditView.__super__.dispose.apply(this, arguments);
  };

  return EntryEditView;

})(PageView);



},{"chaplin":"9U5Jgg","lib/model":"client/source/lib/model.coffee","mediator":"client/source/mediator.coffee","templates/entries/edit":"client/source/templates/entries/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee","views/fields/input":"client/source/views/fields/input.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/list.coffee":[function(require,module,exports){
var CollectionView, EntriesList, EntryRowView, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

CollectionView = require('lib/collection_view');

EntryRowView = require('views/entries/row');

tpl = require('templates/entries/list');

module.exports = EntriesList = (function(superClass) {
  extend(EntriesList, superClass);

  function EntriesList() {
    return EntriesList.__super__.constructor.apply(this, arguments);
  }

  EntriesList.prototype.template = tpl;

  EntriesList.prototype.itemView = EntryRowView;

  EntriesList.prototype.useCssAnimation = true;

  EntriesList.prototype.region = 'list';

  EntriesList.prototype.optionNames = CollectionView.prototype.optionNames.concat(['bucket']);

  EntriesList.prototype.getTemplateData = function() {
    return _.extend(EntriesList.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON()
    });
  };

  EntriesList.prototype.itemRemoved = function(entry) {
    var id;
    if (id = entry != null ? entry.get('id') : void 0) {
      this.$("[data-entry-id=\"" + id + "\"]").slideUp({
        duration: 200,
        easing: 'easeInExpo',
        complete: function() {
          return $(this).parent().remove();
        }
      });
    }
    if (this.collection.length === 0) {
      return this.$fallback.show();
    }
  };

  EntriesList.prototype.itemAdded = function(entry) {
    var $el, id, thing;
    thing = EntriesList.__super__.itemAdded.apply(this, arguments);
    if (id = entry != null ? entry.get('id') : void 0) {
      $el = this.$("[data-entry-id=\"" + id + "\"]").hide();
      return _.defer((function(_this) {
        return function() {
          return $el.slideDown({
            duration: 200,
            easing: 'easeOutExpo'
          });
        };
      })(this));
    }
  };

  return EntriesList;

})(CollectionView);



},{"lib/collection_view":"client/source/lib/collection_view.coffee","templates/entries/list":"client/source/templates/entries/list.hbs","underscore":"l0hNr+","views/entries/row":"client/source/views/entries/row.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/row.coffee":[function(require,module,exports){
var EntryRow, View, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/entries/row');

module.exports = EntryRow = (function(superClass) {
  extend(EntryRow, superClass);

  function EntryRow() {
    return EntryRow.__super__.constructor.apply(this, arguments);
  }

  EntryRow.prototype.template = tpl;

  EntryRow.prototype.listen = {
    'change model': 'render'
  };

  return EntryRow;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/entries/row":"client/source/templates/entries/row.hbs"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/edit.coffee":[function(require,module,exports){
var FieldEditView, FieldTypeSettingsView, FormMixin, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

FieldTypeSettingsView = require('views/fields/settings');

mediator = require('mediator');

tpl = require('templates/fields/edit');

module.exports = FieldEditView = (function(superClass) {
  extend(FieldEditView, superClass);

  function FieldEditView() {
    this.renderSettings = bind(this.renderSettings, this);
    return FieldEditView.__super__.constructor.apply(this, arguments);
  }

  FieldEditView.prototype.template = tpl;

  FieldEditView.prototype.mixins = [FormMixin];

  FieldEditView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#cancel"]': 'clickCancel'
  };

  FieldEditView.prototype.regions = {
    'settings': '.settings'
  };

  FieldEditView.prototype.render = function() {
    var ref;
    FieldEditView.__super__.render.apply(this, arguments);
    if ((ref = this.model.get('fieldType')) === 'text' || ref === 'textarea' || ref === 'checkbox' || ref === 'number' || ref === 'cloudinary_image') {
      return this.renderSettings();
    } else {
      return mediator.loadPlugin(this.model.get('fieldType')).done(this.renderSettings);
    }
  };

  FieldEditView.prototype.renderSettings = function() {
    var SettingsView, configOptions, plugin;
    configOptions = {
      region: 'settings',
      model: this.model
    };
    plugin = mediator.plugins[this.model.get('fieldType')];
    if (plugin) {
      if (_.isFunction(plugin.settingsView)) {
        SettingsView = plugin.settingsView;
      } else if (_.isString(plugin.settingsView)) {
        configOptions.template = plugin.settingsView;
        SettingsView = FieldTypeSettingsView;
      }
    } else {
      SettingsView = FieldTypeSettingsView;
    }
    return this.subview("settings_" + (this.model.get('slug')), new FieldTypeSettingsView(configOptions));
  };

  FieldEditView.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    data = this.formParams();
    data.fieldType = this.model.get('fieldType');
    data.slug = data.fieldSlug;
    delete data.fieldSlug;
    data.settings = this.$('.settings').formParams();
    return this.model.set(data);
  };

  FieldEditView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.dispose();
  };

  return FieldEditView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","templates/fields/edit":"client/source/templates/fields/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/fields/settings":"client/source/views/fields/settings.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/input.coffee":[function(require,module,exports){
var FieldTypeInputView, View, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/fields/input');

mediator = require('mediator');

module.exports = FieldTypeInputView = (function(superClass) {
  extend(FieldTypeInputView, superClass);

  function FieldTypeInputView() {
    return FieldTypeInputView.__super__.constructor.apply(this, arguments);
  }

  FieldTypeInputView.prototype.template = tpl;

  FieldTypeInputView.prototype.region = 'user-fields';

  FieldTypeInputView.prototype.className = 'form-group';

  FieldTypeInputView.prototype.events = {
    'dragover': 'hoverDropzone',
    'click .close': 'clickRemove'
  };

  FieldTypeInputView.prototype.getTemplateFunction = function() {
    if (_.isString(this.template)) {
      return this.cachedTplFn != null ? this.cachedTplFn : this.cachedTplFn = _.template(this.template).source;
    } else {
      return this.template;
    }
  };

  FieldTypeInputView.prototype.render = function() {
    var $input, $preview, $progress, $progressBar, value;
    FieldTypeInputView.__super__.render.apply(this, arguments);
    if (this.model.get('fieldType') !== 'cloudinary_image') {
      return;
    }
    $preview = this.$('.preview');
    $progress = this.$('.progress');
    $progressBar = this.$('.progress-bar');
    value = this.model.get('value');
    this.$input = $input = this.$("input[type=file]");
    if (value) {
      $input.data('value-object', value);
    }
    return this.$input.cloudinary_fileupload({
      dropzone: this.$('.dropzone')
    }).bind('fileuploadstart', function(e) {
      return $progress.removeClass('hide');
    }).bind('fileuploadprogress', function(e, data) {
      var percent;
      percent = data.loaded / data.total * 100;
      $progressBar.css({
        width: percent + "%"
      }).attr('aria-valuenow', percent);
      if (percent === 100) {
        return $progressBar.addClass('progress-bar-success').removeClass('active progress-bar-striped').text('Processing image…');
      }
    }).bind('cloudinarydone', function(e, data) {
      $progressBar.text('Fetching image…');
      $preview.css({
        height: 0
      }).show().find('.preview-inner').html("<img src=\"" + data.result.url + "\">");
      return imagesLoaded($preview, function() {
        $progress.addClass('hide');
        $progressBar.removeClass('progress-bar-success').addClass('progress-bar-striped active').css({
          width: 0
        }).text('').attr('aria-valuenow', 0);
        $preview.find('img').height();
        $input.data('value-object', data.result);
        return TweenLite.to($preview, .5, {
          height: $preview.find('img').height(),
          ease: Sine.easeOut
        });
      });
    });
  };

  FieldTypeInputView.prototype.getValue = function() {
    if (!this.$input) {
      return;
    }
    return this.$input.data('value-object') || this.$input.val();
  };

  FieldTypeInputView.prototype.hoverDropzone = function() {
    var $dz;
    if (this.dropzoneTimeout) {
      clearTimeout(this.dropzoneTimeout);
    }
    $dz = this.$('.dropzone').addClass('hover');
    return this.dropzoneTimeout = setTimeout(function() {
      return $dz.removeClass('hover');
    }, 200);
  };

  FieldTypeInputView.prototype.clickRemove = function(e) {
    e.preventDefault();
    this.$('.dropzone').slideDown();
    this.$('.preview').slideUp();
    return this.$('input[type="hidden"]').val(null);
  };

  return FieldTypeInputView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","templates/fields/input":"client/source/templates/fields/input.hbs","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/settings.coffee":[function(require,module,exports){
var FieldTypeSettingsView, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/fields/settings');

module.exports = FieldTypeSettingsView = (function(superClass) {
  extend(FieldTypeSettingsView, superClass);

  function FieldTypeSettingsView() {
    return FieldTypeSettingsView.__super__.constructor.apply(this, arguments);
  }

  FieldTypeSettingsView.prototype.optionNames = View.prototype.optionNames.concat(['template']);

  FieldTypeSettingsView.prototype.template = tpl;

  FieldTypeSettingsView.prototype.getTemplateFunction = function() {
    if (_.isString(this.template)) {
      return this.cachedTplFn != null ? this.cachedTplFn : this.cachedTplFn = _.template(this.template);
    } else {
      return this.template;
    }
  };

  return FieldTypeSettingsView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/fields/settings":"client/source/templates/fields/settings.hbs","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/help/doc.coffee":[function(require,module,exports){
var HelpDocView, PageView, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

mediator = require('mediator');

module.exports = HelpDocView = (function(superClass) {
  extend(HelpDocView, superClass);

  function HelpDocView() {
    return HelpDocView.__super__.constructor.apply(this, arguments);
  }

  HelpDocView.prototype.optionNames = PageView.prototype.optionNames.concat(['doc']);

  HelpDocView.prototype.className = 'col-md-8';

  HelpDocView.prototype.render = function() {
    HelpDocView.__super__.render.apply(this, arguments);
    return this.$el.load("/" + mediator.options.adminSegment + "/help-html/" + this.doc, function() {
      return console.log('done loading', arguments);
    });
  };

  return HelpDocView;

})(PageView);



},{"mediator":"client/source/mediator.coffee","views/base/page":"client/source/views/base/page.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/install/firstuser.coffee":[function(require,module,exports){
var FirstUserView, FormMixin, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/install/firstuser');

module.exports = FirstUserView = (function(superClass) {
  extend(FirstUserView, superClass);

  function FirstUserView() {
    return FirstUserView.__super__.constructor.apply(this, arguments);
  }

  FirstUserView.prototype.mixins = [FormMixin];

  FirstUserView.prototype.template = tpl;

  FirstUserView.prototype.container = '#bkts-content';

  FirstUserView.prototype.autoRender = true;

  FirstUserView.prototype.className = 'firstUser';

  FirstUserView.prototype.events = {
    'submit form': 'submitForm'
  };

  FirstUserView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams()));
  };

  return FirstUserView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/install/firstuser":"client/source/templates/install/firstuser.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/layout.coffee":[function(require,module,exports){
var Chaplin, Layout, _, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

_ = require('underscore');

mediator = Chaplin.mediator;

module.exports = Layout = (function(superClass) {
  extend(Layout, superClass);

  function Layout() {
    return Layout.__super__.constructor.apply(this, arguments);
  }

  Layout.prototype.regions = {
    'header': '#bkts-header'
  };

  Layout.prototype.events = {
    'click [href="#menu"]': 'clickMenu',
    'click #logo a': 'clickLogo',
    'click .nav-primary a': 'clickMenuNav',
    'click .logout a': 'fadeAwayFadeAway'
  };

  Layout.prototype.initialize = function() {
    Layout.__super__.initialize.apply(this, arguments);
    toastr.options = {
      debug: false,
      positionClass: "toast-bottom-right",
      showDuration: 100,
      hideDuration: 100,
      timeOut: 2100,
      extendedTimeOut: 1000,
      showEasing: 'swing',
      hideEasing: 'swing',
      showMethod: 'slideDown',
      hideMethod: 'slideUp'
    };
    Modernizr.load({
      test: Modernizr.touch,
      yep: "/" + mediator.options.adminSegment + "/vendor/fastclick/fastclick.js",
      complete: function() {
        return typeof FastClick !== "undefined" && FastClick !== null ? FastClick.attach(document.body) : void 0;
      }
    });
    return this.$el.tooltip({
      selector: '.show-tooltip',
      align: 'bottom',
      delay: {
        show: 800,
        hide: 50
      }
    });
  };

  Layout.prototype.clickMenu = function(e) {
    if (this.$nav == null) {
      this.$nav = this.$('.nav-primary');
    }
    if (this.$btnMenu == null) {
      this.$btnMenu = this.$('.btn-menu');
    }
    e.preventDefault();
    this.$nav.toggleClass('hidden-xs').toggle().slideToggle(200);
    return this.$btnMenu.toggleClass('active');
  };

  Layout.prototype.clickMenuNav = function() {
    if (this.$nav == null) {
      this.$nav = this.$('.nav-primary');
    }
    if (this.$btnMenu == null) {
      this.$btnMenu = this.$('.btn-menu');
    }
    this.$btnMenu.removeClass('active');
    if ($(window).width() <= 768) {
      return this.$nav.css({
        display: 'block'
      }).slideToggle(150, (function(_this) {
        return function() {
          return _this.$nav.toggleClass('hidden-xs').toggle();
        };
      })(this));
    }
  };

  Layout.prototype.fadeAwayFadeAway = function() {
    return $('body').css({
      opacity: .85
    });
  };

  Layout.prototype.clickLogo = function(e) {
    e.preventDefault();
    if (this.$logoImg == null) {
      this.$logoImg = $('#logo img');
    }
    TweenLite.killTweensOf(this.$logoImg);
    TweenLite.fromTo(this.$logoImg, .6, {
      scaleX: .75
    }, {
      scaleX: 1,
      ease: Elastic.easeOut
    });
    TweenLite.fromTo(this.$logoImg, .6, {
      scaleY: .75
    }, {
      scaleY: 1,
      delay: .03,
      ease: Elastic.easeOut
    });
    return Chaplin.utils.redirectTo('buckets#dashboard');
  };

  return Layout;

})(Chaplin.Layout);



},{"chaplin":"9U5Jgg","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/layouts/loggedin.coffee":[function(require,module,exports){
var LoggedInLayout, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/layouts/loggedin');

mediator = require('chaplin').mediator;

module.exports = LoggedInLayout = (function(superClass) {
  extend(LoggedInLayout, superClass);

  function LoggedInLayout() {
    this.checkSize = bind(this.checkSize, this);
    this.openNav = bind(this.openNav, this);
    this.collapseNav = bind(this.collapseNav, this);
    return LoggedInLayout.__super__.constructor.apply(this, arguments);
  }

  LoggedInLayout.prototype.template = tpl;

  LoggedInLayout.prototype.autoRender = true;

  LoggedInLayout.prototype.container = '#bkts-content';

  LoggedInLayout.prototype.regions = {
    content: '.page'
  };

  LoggedInLayout.prototype.getTemplateData = function() {
    var ref, ref1;
    return _.extend(LoggedInLayout.__super__.getTemplateData.apply(this, arguments), {
      buckets: (ref = mediator.buckets) != null ? ref.toJSON() : void 0,
      version: (ref1 = mediator.options) != null ? ref1.version : void 0
    });
  };

  LoggedInLayout.prototype.initialize = function() {
    LoggedInLayout.__super__.initialize.apply(this, arguments);
    this.subscribeEvent('dispatcher:dispatch', this.checkNav);
    this.listenTo(mediator.buckets, 'sync add', (function(_this) {
      return function() {
        return _this.render();
      };
    })(this));
    this.throttledCheckSize = _.throttle(this.checkSize, 1000, {
      trailing: true
    });
    return $(window).on('resize', this.throttledCheckSize);
  };

  LoggedInLayout.prototype.render = function() {
    LoggedInLayout.__super__.render.apply(this, arguments);
    this.$('#bkts-sidebar li').each(function(i, el) {
      return TweenLite.from(el, .2, {
        y: '30px',
        opacity: 0,
        ease: Sine.easeOut,
        delay: i * .01
      });
    });
    this.openTimeout = null;
    return this.$('#bkts-sidebar').hover((function(_this) {
      return function() {
        if (_this.openTimeout) {
          clearTimeout(_this.openTimeout);
        }
        return _this.openTimeout = setTimeout(_this.openNav, 50);
      };
    })(this), (function(_this) {
      return function() {
        if (_this.openTimeout) {
          clearTimeout(_this.openTimeout);
        }
        return _this.openTimeout = setTimeout(_this.collapseNav, 50);
      };
    })(this));
  };

  LoggedInLayout.prototype.checkNav = function(controller, params, route) {
    var $link, href, j, len, link, newURL, ref, results;
    this.$('.nav-primary li').removeClass('active');
    if (!(route != null ? route.path : void 0)) {
      return;
    }
    if (this.$navLinks == null) {
      this.$navLinks = this.$('.nav-primary a');
    }
    ref = this.$navLinks;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      link = ref[j];
      $link = $(link);
      href = $link.attr('href');
      newURL = "/" + mediator.options.adminSegment + "/" + route.path;
      if (newURL.substr(0, href.length) === href) {
        $link.parent().addClass('active');
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  LoggedInLayout.prototype.collapseNav = function() {
    var $logo, $menuBtn, $view;
    if (!($(window).width() > 768)) {
      return;
    }
    $logo = this.$('#logo');
    $view = $('.loggedInView');
    $menuBtn = this.$('.btn-menu').css({
      display: 'block'
    });
    this.$('.usernav.open').trigger('click.bs.dropdown');
    this.killTweens();
    TweenLite.to($logo, .5, {
      scale: .6,
      x: -9,
      ease: Back.easeOut,
      delay: .1
    });
    TweenLite.to(this.$('#bkts-ftr'), .15, {
      opacity: 0,
      ease: Sine.easeIn
    });
    TweenLite.to(this.$('#bkts-sidebar'), .25, {
      width: 60,
      ease: Sine.easeIn,
      overflow: 'hidden',
      delay: .1
    });
    TweenLite.to($view, .25, {
      marginLeft: 60,
      ease: Sine.easeIn,
      delay: .1
    });
    return TweenLite.to(this.$('#bkts-sidebar li'), .25, {
      opacity: .5,
      x: -200,
      y: 0,
      opacity: 0,
      delay: .1,
      ease: Sine.easeIn
    });
  };

  LoggedInLayout.prototype.openNav = function() {
    var $link, $logo, $view, i, j, len, ref;
    if (!($(window).width() > 768)) {
      return;
    }
    this.killTweens();
    $view = $('.loggedInView');
    $logo = this.$('#logo');
    TweenLite.to(this.$('#bkts-sidebar'), .3, {
      width: 240,
      ease: Sine.easeOut,
      overflow: 'scroll'
    });
    TweenLite.to($view, .3, {
      marginLeft: 240,
      ease: Sine.easeOut
    });
    ref = this.$('#bkts-sidebar li');
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      $link = ref[i];
      TweenLite.to($link, .18 - .01 * i, {
        opacity: 1,
        x: 0,
        y: 0,
        delay: .04 * i - i * .008,
        ease: Sine.easeOut
      });
    }
    TweenLite.to($logo, .5, {
      scale: 1,
      x: 0,
      ease: Back.easeOut
    });
    return TweenLite.to(this.$('#bkts-ftr'), .15, {
      opacity: 1,
      ease: Sine.easeOut,
      delay: .4
    });
  };

  LoggedInLayout.prototype.killTweens = function() {
    return TweenLite.killTweensOf($('.loggedInView, #logo, #bkts-sidebar, #bkts-sidebar li, #bkts-ftr'));
  };

  LoggedInLayout.prototype.checkSize = function() {
    if ($(window).width() <= 768) {
      this.killTweens();
      return TweenLite.set($('.loggedInView, #logo, #bkts-sidebar, #bkts-sidebar li, #bkts-ftr'), {
        clearProps: 'all'
      });
    } else {
      this.killTweens();
      return this.collapseNav();
    }
  };

  LoggedInLayout.prototype.dispose = function() {
    $(window).off('resize', this.throttledCheckSize);
    return LoggedInLayout.__super__.dispose.apply(this, arguments);
  };

  return LoggedInLayout;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/layouts/loggedin":"client/source/templates/layouts/loggedin.hbs","underscore":"l0hNr+"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/members/list.coffee":[function(require,module,exports){
var FormMixin, MembersList, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/members/list');

module.exports = MembersList = (function(superClass) {
  extend(MembersList, superClass);

  function MembersList() {
    return MembersList.__super__.constructor.apply(this, arguments);
  }

  MembersList.prototype.template = tpl;

  MembersList.prototype.mixins = [FormMixin];

  MembersList.prototype.optionNames = View.prototype.optionNames.concat(['bucket', 'users']);

  MembersList.prototype.listen = {
    'destroy collection': 'render',
    'add collection': 'render'
  };

  MembersList.prototype.events = {
    'submit .add-member': 'submitAddMember',
    'click .delete-member': 'clickDeleteMember'
  };

  MembersList.prototype.submitAddMember = function(e) {
    var data, u;
    e.preventDefault();
    data = this.$el.formParams(false);
    u = this.users.get(data.user).toJSON();
    u.bucketId = this.bucket.id;
    u.role = data.role;
    return this.collection.create(u);
  };

  MembersList.prototype.clickDeleteMember = function(e) {
    var model;
    e.preventDefault();
    if (confirm('Are you sure?')) {
      model = this.collection.findWhere({
        id: this.$(e.currentTarget).closest('.member').data('memberId')
      });
      return model.destroy().done((function(_this) {
        return function() {
          return toastr.success((model.get('name')) + " has been removed from " + _this.bucket.name);
        };
      })(this));
    }
  };

  MembersList.prototype.getTemplateData = function() {
    return _.extend(MembersList.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      users: _.compact(this.users.map((function(_this) {
        return function(user) {
          if (!((_this.collection.get(user.get('id')) != null) || user.hasRole('administrator'))) {
            return user.toJSON();
          }
        };
      })(this)))
    });
  };

  return MembersList;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/members/list":"client/source/templates/members/list.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/missing.coffee":[function(require,module,exports){
var MissingView, PageView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

module.exports = MissingView = (function(superClass) {
  extend(MissingView, superClass);

  function MissingView() {
    return MissingView.__super__.constructor.apply(this, arguments);
  }

  return MissingView;

})(PageView);



},{"views/base/page":"client/source/views/base/page.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/routes/edit.coffee":[function(require,module,exports){
var EditRouteView, FormMixin, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/routes/edit');

module.exports = EditRouteView = (function(superClass) {
  extend(EditRouteView, superClass);

  function EditRouteView() {
    return EditRouteView.__super__.constructor.apply(this, arguments);
  }

  EditRouteView.prototype.template = tpl;

  EditRouteView.prototype.className = 'routeEdit';

  EditRouteView.prototype.optionNames = View.prototype.optionNames.concat(['templates']);

  EditRouteView.prototype.mixins = [FormMixin];

  EditRouteView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#cancel"]': 'clickCancel'
  };

  EditRouteView.prototype.getTemplateData = function() {
    var ref;
    return _.extend(EditRouteView.__super__.getTemplateData.apply(this, arguments), {
      templates: (ref = this.templates) != null ? ref.toJSON() : void 0
    });
  };

  EditRouteView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EditRouteView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.dispose();
  };

  return EditRouteView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/routes/edit":"client/source/templates/routes/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/routes/list.coffee":[function(require,module,exports){
var EditRouteView, PageView, Route, RoutesList, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

EditRouteView = require('views/routes/edit');

Route = require('models/route');

tpl = require('templates/routes/list');

module.exports = RoutesList = (function(superClass) {
  extend(RoutesList, superClass);

  function RoutesList() {
    return RoutesList.__super__.constructor.apply(this, arguments);
  }

  RoutesList.prototype.template = tpl;

  RoutesList.prototype.optionNames = PageView.prototype.optionNames.concat(['templates']);

  RoutesList.prototype.listen = {
    'destroy collection': 'render',
    'add collection': 'render'
  };

  RoutesList.prototype.events = {
    'click [href="#new"]': 'clickNew',
    'click [href="#delete"]': 'clickDelete',
    'click [href="#edit"]': 'clickEdit'
  };

  RoutesList.prototype.attach = function() {
    var $sortable;
    RoutesList.__super__.attach.apply(this, arguments);
    $sortable = $('#sortable-routes');
    return new Sortable($sortable.get(0), {
      handle: '.handle',
      onUpdate: (function(_this) {
        return function(e) {
          console.log('update', arguments);
          return $sortable.children().each(function(i, li) {
            var model;
            model = _this.collection.findWhere({
              id: $(li).children('.route').data('route-id')
            });
            if (model) {
              return model.save({
                sort: i
              });
            }
          });
        };
      })(this)
    });
  };

  RoutesList.prototype.clickNew = function(e) {
    var newRoute;
    e.preventDefault();
    newRoute = new Route;
    this.listenToOnce(newRoute, 'sync', (function(_this) {
      return function() {
        _this.collection.add(newRoute);
        _this.subview('editRoute').dispose();
        return _this.render();
      };
    })(this));
    return this.subview('editRoute', new EditRouteView({
      model: newRoute,
      container: this.$('.editRoute'),
      templates: this.templates
    }));
  };

  RoutesList.prototype.clickDelete = function(e) {
    var model;
    e.preventDefault();
    model = this.collection.findWhere({
      id: this.$(e.currentTarget).closest('.route').data('route-id')
    });
    if (model && confirm("Are you sure you want to delete “" + (model.get('urlPattern')) + "”?")) {
      return model.destroy({
        wait: true
      }).done(function() {
        return toastr.success('Route deleted');
      });
    }
  };

  RoutesList.prototype.clickEdit = function(e) {
    var $route, route, subview;
    e.preventDefault();
    $route = this.$(e.currentTarget).closest('.route');
    route = this.collection.findWhere({
      id: $route.data('route-id')
    });
    if (route) {
      this.listenToOnce(route, 'sync', (function(_this) {
        return function() {
          _this.subview('editRoute').dispose();
          return _this.render();
        };
      })(this));
      subview = this.subview('editRoute', new EditRouteView({
        model: route,
        container: $route,
        containerMethod: 'after',
        templates: this.templates
      }));
      $route.hide();
      return this.listenTo(subview, 'dispose', function() {
        return $route.show();
      });
    }
  };

  return RoutesList;

})(PageView);



},{"models/route":"client/source/models/route.coffee","templates/routes/list":"client/source/templates/routes/list.hbs","views/base/page":"client/source/views/base/page.coffee","views/routes/edit":"client/source/views/routes/edit.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/settings/basic.coffee":[function(require,module,exports){
var BasicSettingsView, PageView, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

tpl = require('templates/settings/basic');

module.exports = BasicSettingsView = (function(superClass) {
  extend(BasicSettingsView, superClass);

  function BasicSettingsView() {
    return BasicSettingsView.__super__.constructor.apply(this, arguments);
  }

  BasicSettingsView.prototype.templates = tpl;

  return BasicSettingsView;

})(PageView);



},{"templates/settings/basic":"client/source/templates/settings/basic.hbs","views/base/page":"client/source/views/base/page.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/templates/editor.coffee":[function(require,module,exports){
var BuildFile, Chaplin, FormMixin, PageView, TemplateEditor, _, handlebars, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Chaplin = require('chaplin');

PageView = require('views/base/page');

BuildFile = require('models/buildfile');

mediator = require('mediator');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/templates/editor');

handlebars = require('hbsfy/runtime');

handlebars.registerPartial('directory', require('templates/templates/directory'));

module.exports = TemplateEditor = (function(superClass) {
  extend(TemplateEditor, superClass);

  function TemplateEditor() {
    this.updateTemplateDisplay = bind(this.updateTemplateDisplay, this);
    this.bindAceEditor = bind(this.bindAceEditor, this);
    return TemplateEditor.__super__.constructor.apply(this, arguments);
  }

  TemplateEditor.prototype.template = tpl;

  TemplateEditor.prototype.mixins = [FormMixin];

  TemplateEditor.prototype.listen = {
    'add collection': 'render'
  };

  TemplateEditor.prototype.optionNames = PageView.prototype.optionNames.concat(['builds', 'liveFiles', 'stagingFiles', 'env', 'filename']);

  TemplateEditor.prototype.className = 'templateEditor';

  TemplateEditor.prototype.events = {
    'click [href="#new"]': 'clickNew',
    'click [href="#deleteFile"]': 'clickDeleteFile',
    'submit form': 'submitForm',
    'click [href="#delete"]': 'clickDeleteBuild',
    'click [href="#stage"]': 'clickStage',
    'click [href="#publish"]': 'clickPublish',
    'keydown textarea, [type=text], [type=number]': 'keyDown',
    'keyup textarea, [type=text], [type=number]': 'keyUp'
  };

  TemplateEditor.prototype.keyUp = function(e) {
    if (this.cmdActive && e.which === 91) {
      this.cmdActive = false;
    }
    return e;
  };

  TemplateEditor.prototype.keyDown = function(e) {
    if (this.cmdActive && e.which === 13) {
      this.$('form').submit();
    }
    this.cmdActive = e.metaKey;
    return e;
  };

  TemplateEditor.prototype.getTemplateData = function() {
    var archives;
    archives = _.where(this.builds.toJSON(), {
      env: 'archive'
    });
    return _.extend(TemplateEditor.__super__.getTemplateData.apply(this, arguments), {
      liveFiles: this.liveFiles.getTree(),
      stagingFiles: this.stagingFiles.getTree(),
      archives: archives,
      env: this.env,
      stagingUrl: mediator.options.stagingUrl
    });
  };

  TemplateEditor.prototype.render = function() {
    TemplateEditor.__super__.render.apply(this, arguments);
    this.$code = this.$('textarea.code');
    this.$code.after("<pre class=\"code editor hidden\"></pre>");
    this.aceReady = new $.Deferred;
    if (!(Modernizr.touch && !this.editor)) {
      this.$code.addClass('loading');
      return Modernizr.load({
        test: typeof ace !== "undefined" && ace !== null,
        nope: ["/" + mediator.options.adminSegment + "/js/ace/ace.js", "/" + mediator.options.adminSegment + "/js/ace/ext-modelist.js"],
        complete: this.bindAceEditor
      });
    } else {
      if (!this.editor) {
        this.aceReady.reject();
      }
      return this.selectTemplate(this.filename, this.env);
    }
  };

  TemplateEditor.prototype.bindAceEditor = function() {
    if (this.disposed) {
      return;
    }
    ace.config.set('basePath', "/" + mediator.options.adminSegment + "/js/ace/");
    this.editor = ace.edit(this.$('.code.editor')[0]);
    this.editor.setTheme('ace/theme/tomorrow');
    this.editor.renderer.setShowGutter(false);
    this.editorSession = this.editor.getSession();
    this.editorSession.setTabSize(2);
    this.$('pre.code, textarea.code').toggleClass('hidden');
    return this.aceReady.resolve();
  };

  TemplateEditor.prototype.selectTemplate = function(filename, env) {
    if (env == null) {
      env = 'staging';
    }
    this.clearFormErrors();
    this.env = env;
    this.collection = env === 'live' ? this.liveFiles : this.stagingFiles;
    this.model = this.collection.findWhere({
      filename: filename,
      build_env: env
    });
    if (!this.model) {
      if (filename) {
        toastr.warning("File doesn’t exist. Starting a new draft.");
      }
      this.model = new BuildFile({
        filename: filename || ''
      });
      this.updateTemplateDisplay();
    } else {
      this.model.fetch().done(this.updateTemplateDisplay);
    }
    this.$('.nav-stacked li').removeClass('active');
    return this.$("#env-" + env + " .nav-stacked li[data-path=\"" + filename + "\"]").addClass('active');
  };

  TemplateEditor.prototype.updateTemplateDisplay = function() {
    var contents, filename, ref;
    if (this.disposed) {
      return;
    }
    ref = this.model.toJSON(), contents = ref.contents, filename = ref.filename;
    this.$code.val(contents);
    this.$('[name="filename"]').val(filename);
    this.filename = filename;
    return this.aceReady.done((function(_this) {
      return function() {
        var mode, ref1;
        if (_this.modelist == null) {
          _this.modelist = ace.require('ace/ext/modelist');
        }
        mode = (ref1 = _this.modelist) != null ? ref1.getModeForPath(filename).mode : void 0;
        if (mode) {
          _this.editorSession.setMode(mode);
        }
        window.$session = _this.editorSession;
        return _this.editorSession.setValue(contents);
      };
    })(this));
  };

  TemplateEditor.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    if (this.editorSession != null) {
      this.$code.val(this.editorSession.getValue());
    }
    data = this.formParams();
    return this.submit(this.model.save(data)).done((function(_this) {
      return function() {
        toastr.success("Saved Template “" + (_this.model.get('filename')) + "”");
        return _this.collection.add(_this.model);
      };
    })(this)).error((function(_this) {
      return function(res) {
        var compileErr, ref, ref1;
        if (compileErr = res != null ? (ref = res.responseJSON) != null ? (ref1 = ref.errors) != null ? ref1.contents : void 0 : void 0 : void 0) {
          if (compileErr.line) {
            _this.editor.renderer.setShowGutter(true);
            return _this.editor.getSession().setAnnotations([
              {
                row: compileErr.line - 1,
                text: compileErr.message,
                type: 'error'
              }
            ]);
          }
        }
      };
    })(this));
  };

  TemplateEditor.prototype.clickNew = function(e) {
    var env;
    e.preventDefault();
    env = this.$("ul.nav-tabs li.active").text() === 'Live' ? 'live' : 'staging';
    this.selectTemplate(null, env);
    return this.$('input').focus();
  };

  TemplateEditor.prototype.clickDeleteFile = function(e) {
    var $li, collection, index, model, nextTemplate;
    e.preventDefault();
    $li = $(e.currentTarget).closest('li');
    collection = $li.data('env') === 'staging' ? this.stagingFiles : this.liveFiles;
    model = collection.findWhere({
      filename: $li.data('path')
    });
    if (confirm('Are you sure?')) {
      index = collection.indexOf(model);
      nextTemplate = collection.at(index + 1 === collection.length ? index - 1 : index + 1);
      return model.destroy({
        wait: true
      }).done((function(_this) {
        return function() {
          _this.model = nextTemplate;
          return $li.slideUp(100, function() {
            return _this.render();
          });
        };
      })(this));
    }
  };

  TemplateEditor.prototype.clickDeleteBuild = function(e) {
    var $build, build, id;
    e.preventDefault();
    if (confirm('Are you sure you want to delete this archive?')) {
      $build = this.$(e.currentTarget).closest('.build');
      id = $build.data('id');
      build = this.builds.findWhere({
        id: id
      });
      return build.destroy({
        wait: true
      }).done(function() {
        return $build.slideUp(150);
      });
    }
  };

  TemplateEditor.prototype.clickStage = function(e) {
    var build, buildId;
    e.preventDefault();
    buildId = this.$(e.currentTarget).closest('.build').data('id');
    build = this.builds.findWhere({
      id: buildId
    });
    if (build) {
      build.set({
        env: 'staging'
      });
      return build.save({}, {
        wait: true
      }).done((function(_this) {
        return function() {
          return $.when(_this.builds.fetch(), _this.stagingFiles.fetch()).done(function() {
            toastr.success("Restored build " + (build.get('id')) + " to staging.");
            _this.render();
            return _this.selectTemplate(_this.filename, _this.env);
          });
        };
      })(this)).error(function() {
        return toastr.error("There was a problem restoring that build.");
      });
    }
  };

  TemplateEditor.prototype.clickPublish = function(e) {
    var $btn, build;
    e.preventDefault();
    build = this.builds.findWhere({
      env: 'staging'
    });
    if (!build) {
      return toastr.error('Error finding the build');
    }
    build.set({
      env: 'live'
    });
    $btn = $(e.currentTarget).ladda();
    $btn.ladda('start');
    return build.save({
      wait: true
    }).done((function(_this) {
      return function() {
        return $.when(_this.builds.fetch(), _this.liveFiles.fetch()).done(function() {
          toastr.success('Published staging!');
          return _.defer(function() {
            _this.render();
            return _this.selectTemplate(_this.filename, _this.env);
          });
        }).always(function() {
          return $btn.ladda('stop');
        });
      };
    })(this)).error(function() {
      return toastr.error('Couldn’t publish staging to live');
    });
  };

  TemplateEditor.prototype.dispose = function() {
    var ref;
    if ((ref = this.editor) != null) {
      ref.destroy();
    }
    return TemplateEditor.__super__.dispose.apply(this, arguments);
  };

  return TemplateEditor;

})(PageView);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","models/buildfile":"client/source/models/buildfile.coffee","templates/templates/directory":"client/source/templates/templates/directory.hbs","templates/templates/editor":"client/source/templates/templates/editor.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/users/edit.coffee":[function(require,module,exports){
var EditUserView, FormMixin, View, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/users/edit');

FormMixin = require('views/base/mixins/form');

mediator = require('chaplin').mediator;

module.exports = EditUserView = (function(superClass) {
  extend(EditUserView, superClass);

  function EditUserView() {
    return EditUserView.__super__.constructor.apply(this, arguments);
  }

  EditUserView.prototype.mixins = [FormMixin];

  EditUserView.prototype.template = tpl;

  EditUserView.prototype.autoRender = true;

  EditUserView.prototype.region = 'contactCard';

  EditUserView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#remove"]': 'clickRemove',
    'click [href="#importDropbox"]': 'clickImportDropbox',
    'click [href="#deploy"]': 'clickDeploy',
    'click [href="#disconnectDropbox"]': 'disconnectDropbox'
  };

  EditUserView.prototype.getTemplateData = function() {
    var ref, ref1;
    return _.extend(EditUserView.__super__.getTemplateData.apply(this, arguments), {
      currentUser: (ref = mediator.user) != null ? ref.toJSON() : void 0,
      isAdmin: this.model.hasRole('administrator'),
      dropboxEnabled: (ref1 = mediator.options) != null ? ref1.dropboxEnabled : void 0
    });
  };

  EditUserView.prototype.submitForm = function(e) {
    var data, name;
    e.preventDefault();
    data = this.formParams();
    data.roles = this.model.get('roles');
    if (data.admin) {
      if (!this.model.hasRole('administrator')) {
        data.roles.push({
          name: 'administrator'
        });
      }
    } else {
      data.roles = _.reject(data.roles, function(r) {
        return r.name === 'administrator';
      });
    }
    data.previewMode = data.previewMode != null;
    name = data.name;
    return this.submit(this.model.save(data, {
      wait: true
    })).done(function() {
      return toastr.success("Saved " + name + ".");
    });
  };

  EditUserView.prototype.clickRemove = function(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      return this.model.destroy({
        wait: true
      }).done((function(_this) {
        return function() {
          toastr.success('User has been removed.');
          return _this.dispose();
        };
      })(this));
    }
  };

  EditUserView.prototype.disconnectDropbox = function() {
    return e.preventDefault();
  };

  EditUserView.prototype.clickImportDropbox = function(e) {
    e.preventDefault();
    return $.post('/api/dropbox/import').done(function() {
      return toastr.success('Your personal preview environment has been updated.');
    });
  };

  EditUserView.prototype.clickDeploy = function(e) {
    e.preventDefault();
    return $.post('/api/builds').done(function() {
      return toastr.success('The website has been updated.');
    });
  };

  return EditUserView;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/users/edit":"client/source/templates/users/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"/Users/iuriikozuliak/Projects/buckets/client/source/views/users/list.coffee":[function(require,module,exports){
var EditUserView, PageView, User, UsersList, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

PageView = require('views/base/page');

EditUserView = require('views/users/edit');

User = require('models/user');

tpl = require('templates/users/list');

module.exports = UsersList = (function(superClass) {
  extend(UsersList, superClass);

  function UsersList() {
    return UsersList.__super__.constructor.apply(this, arguments);
  }

  UsersList.prototype.template = tpl;

  UsersList.prototype.listen = {
    'sync collection': 'render'
  };

  UsersList.prototype.events = {
    'click [href="#add"]': 'clickAdd',
    'click .users a': 'clickEdit'
  };

  UsersList.prototype.regions = {
    'contactCard': '.detail'
  };

  UsersList.prototype.getTemplateData = function() {
    return _.extend(UsersList.__super__.getTemplateData.apply(this, arguments), {
      items: this.collection.toJSON()
    });
  };

  UsersList.prototype.render = function() {
    UsersList.__super__.render.apply(this, arguments);
    if (this.model) {
      return this.selectUser(this.model);
    }
  };

  UsersList.prototype.clickAdd = function(e) {
    var newUser;
    e.preventDefault();
    newUser = new User;
    this.$('.nav li').removeClass('active');
    this.listenToOnce(newUser, 'sync', (function(_this) {
      return function() {
        _this.collection.add(newUser);
        return _this.render();
      };
    })(this));
    return this.selectUser(newUser);
  };

  UsersList.prototype.selectUser = function(user) {
    var idx;
    this.model = user;
    idx = this.collection.indexOf(this.model);
    if (this.model) {
      if (idx >= 0) {
        this.$('.nav li').eq(idx).addClass('active').siblings().removeClass('active');
      }
      return this.subview('editUser', new EditUserView({
        model: this.model
      }));
    }
  };

  UsersList.prototype.clickEdit = function(e) {
    var $el, idx;
    e.preventDefault();
    $el = this.$(e.currentTarget);
    idx = $el.parent('li').index();
    return this.selectUser(this.collection.at(idx));
  };

  return UsersList;

})(PageView);



},{"models/user":"client/source/models/user.coffee","templates/users/list":"client/source/templates/users/list.hbs","underscore":"l0hNr+","views/base/page":"client/source/views/base/page.coffee","views/users/edit":"client/source/views/users/edit.coffee"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars.runtime.js":[function(require,module,exports){
"use strict";
/*globals Handlebars: true */
var base = require("./handlebars/base");

// Each of these augment the Handlebars object. No need to setup here.
// (This is done to easily share code between commonjs and browse envs)
var SafeString = require("./handlebars/safe-string")["default"];
var Exception = require("./handlebars/exception")["default"];
var Utils = require("./handlebars/utils");
var runtime = require("./handlebars/runtime");

// For compatibility and usage outside of module systems, make the Handlebars object a namespace
var create = function() {
  var hb = new base.HandlebarsEnvironment();

  Utils.extend(hb, base);
  hb.SafeString = SafeString;
  hb.Exception = Exception;
  hb.Utils = Utils;
  hb.escapeExpression = Utils.escapeExpression;

  hb.VM = runtime;
  hb.template = function(spec) {
    return runtime.template(spec, hb);
  };

  return hb;
};

var Handlebars = create();
Handlebars.create = create;

Handlebars['default'] = Handlebars;

exports["default"] = Handlebars;
},{"./handlebars/base":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/base.js","./handlebars/exception":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/exception.js","./handlebars/runtime":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/runtime.js","./handlebars/safe-string":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/safe-string.js","./handlebars/utils":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/utils.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/base.js":[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];

var VERSION = "2.0.0";
exports.VERSION = VERSION;var COMPILER_REVISION = 6;
exports.COMPILER_REVISION = COMPILER_REVISION;
var REVISION_CHANGES = {
  1: '<= 1.0.rc.2', // 1.0.rc.2 is actually rev2 but doesn't report it
  2: '== 1.0.0-rc.3',
  3: '== 1.0.0-rc.4',
  4: '== 1.x.x',
  5: '== 2.0.0-alpha.x',
  6: '>= 2.0.0-beta.1'
};
exports.REVISION_CHANGES = REVISION_CHANGES;
var isArray = Utils.isArray,
    isFunction = Utils.isFunction,
    toString = Utils.toString,
    objectType = '[object Object]';

function HandlebarsEnvironment(helpers, partials) {
  this.helpers = helpers || {};
  this.partials = partials || {};

  registerDefaultHelpers(this);
}

exports.HandlebarsEnvironment = HandlebarsEnvironment;HandlebarsEnvironment.prototype = {
  constructor: HandlebarsEnvironment,

  logger: logger,
  log: log,

  registerHelper: function(name, fn) {
    if (toString.call(name) === objectType) {
      if (fn) { throw new Exception('Arg not supported with multiple helpers'); }
      Utils.extend(this.helpers, name);
    } else {
      this.helpers[name] = fn;
    }
  },
  unregisterHelper: function(name) {
    delete this.helpers[name];
  },

  registerPartial: function(name, partial) {
    if (toString.call(name) === objectType) {
      Utils.extend(this.partials,  name);
    } else {
      this.partials[name] = partial;
    }
  },
  unregisterPartial: function(name) {
    delete this.partials[name];
  }
};

function registerDefaultHelpers(instance) {
  instance.registerHelper('helperMissing', function(/* [args, ]options */) {
    if(arguments.length === 1) {
      // A missing field in a {{foo}} constuct.
      return undefined;
    } else {
      // Someone is actually trying to call something, blow up.
      throw new Exception("Missing helper: '" + arguments[arguments.length-1].name + "'");
    }
  });

  instance.registerHelper('blockHelperMissing', function(context, options) {
    var inverse = options.inverse,
        fn = options.fn;

    if(context === true) {
      return fn(this);
    } else if(context === false || context == null) {
      return inverse(this);
    } else if (isArray(context)) {
      if(context.length > 0) {
        if (options.ids) {
          options.ids = [options.name];
        }

        return instance.helpers.each(context, options);
      } else {
        return inverse(this);
      }
    } else {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.name);
        options = {data: data};
      }

      return fn(context, options);
    }
  });

  instance.registerHelper('each', function(context, options) {
    if (!options) {
      throw new Exception('Must pass iterator to #each');
    }

    var fn = options.fn, inverse = options.inverse;
    var i = 0, ret = "", data;

    var contextPath;
    if (options.data && options.ids) {
      contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]) + '.';
    }

    if (isFunction(context)) { context = context.call(this); }

    if (options.data) {
      data = createFrame(options.data);
    }

    if(context && typeof context === 'object') {
      if (isArray(context)) {
        for(var j = context.length; i<j; i++) {
          if (data) {
            data.index = i;
            data.first = (i === 0);
            data.last  = (i === (context.length-1));

            if (contextPath) {
              data.contextPath = contextPath + i;
            }
          }
          ret = ret + fn(context[i], { data: data });
        }
      } else {
        for(var key in context) {
          if(context.hasOwnProperty(key)) {
            if(data) {
              data.key = key;
              data.index = i;
              data.first = (i === 0);

              if (contextPath) {
                data.contextPath = contextPath + key;
              }
            }
            ret = ret + fn(context[key], {data: data});
            i++;
          }
        }
      }
    }

    if(i === 0){
      ret = inverse(this);
    }

    return ret;
  });

  instance.registerHelper('if', function(conditional, options) {
    if (isFunction(conditional)) { conditional = conditional.call(this); }

    // Default behavior is to render the positive path if the value is truthy and not empty.
    // The `includeZero` option may be set to treat the condtional as purely not empty based on the
    // behavior of isEmpty. Effectively this determines if 0 is handled by the positive path or negative.
    if ((!options.hash.includeZero && !conditional) || Utils.isEmpty(conditional)) {
      return options.inverse(this);
    } else {
      return options.fn(this);
    }
  });

  instance.registerHelper('unless', function(conditional, options) {
    return instance.helpers['if'].call(this, conditional, {fn: options.inverse, inverse: options.fn, hash: options.hash});
  });

  instance.registerHelper('with', function(context, options) {
    if (isFunction(context)) { context = context.call(this); }

    var fn = options.fn;

    if (!Utils.isEmpty(context)) {
      if (options.data && options.ids) {
        var data = createFrame(options.data);
        data.contextPath = Utils.appendContextPath(options.data.contextPath, options.ids[0]);
        options = {data:data};
      }

      return fn(context, options);
    } else {
      return options.inverse(this);
    }
  });

  instance.registerHelper('log', function(message, options) {
    var level = options.data && options.data.level != null ? parseInt(options.data.level, 10) : 1;
    instance.log(level, message);
  });

  instance.registerHelper('lookup', function(obj, field) {
    return obj && obj[field];
  });
}

var logger = {
  methodMap: { 0: 'debug', 1: 'info', 2: 'warn', 3: 'error' },

  // State enum
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  level: 3,

  // can be overridden in the host environment
  log: function(level, message) {
    if (logger.level <= level) {
      var method = logger.methodMap[level];
      if (typeof console !== 'undefined' && console[method]) {
        console[method].call(console, message);
      }
    }
  }
};
exports.logger = logger;
var log = logger.log;
exports.log = log;
var createFrame = function(object) {
  var frame = Utils.extend({}, object);
  frame._parent = object;
  return frame;
};
exports.createFrame = createFrame;
},{"./exception":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/exception.js","./utils":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/utils.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/exception.js":[function(require,module,exports){
"use strict";

var errorProps = ['description', 'fileName', 'lineNumber', 'message', 'name', 'number', 'stack'];

function Exception(message, node) {
  var line;
  if (node && node.firstLine) {
    line = node.firstLine;

    message += ' - ' + line + ':' + node.firstColumn;
  }

  var tmp = Error.prototype.constructor.call(this, message);

  // Unfortunately errors are not enumerable in Chrome (at least), so `for prop in tmp` doesn't work.
  for (var idx = 0; idx < errorProps.length; idx++) {
    this[errorProps[idx]] = tmp[errorProps[idx]];
  }

  if (line) {
    this.lineNumber = line;
    this.column = node.firstColumn;
  }
}

Exception.prototype = new Error();

exports["default"] = Exception;
},{}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/runtime.js":[function(require,module,exports){
"use strict";
var Utils = require("./utils");
var Exception = require("./exception")["default"];
var COMPILER_REVISION = require("./base").COMPILER_REVISION;
var REVISION_CHANGES = require("./base").REVISION_CHANGES;
var createFrame = require("./base").createFrame;

function checkRevision(compilerInfo) {
  var compilerRevision = compilerInfo && compilerInfo[0] || 1,
      currentRevision = COMPILER_REVISION;

  if (compilerRevision !== currentRevision) {
    if (compilerRevision < currentRevision) {
      var runtimeVersions = REVISION_CHANGES[currentRevision],
          compilerVersions = REVISION_CHANGES[compilerRevision];
      throw new Exception("Template was precompiled with an older version of Handlebars than the current runtime. "+
            "Please update your precompiler to a newer version ("+runtimeVersions+") or downgrade your runtime to an older version ("+compilerVersions+").");
    } else {
      // Use the embedded version info since the runtime doesn't know about this revision yet
      throw new Exception("Template was precompiled with a newer version of Handlebars than the current runtime. "+
            "Please update your runtime to a newer version ("+compilerInfo[1]+").");
    }
  }
}

exports.checkRevision = checkRevision;// TODO: Remove this line and break up compilePartial

function template(templateSpec, env) {
  /* istanbul ignore next */
  if (!env) {
    throw new Exception("No environment passed to template");
  }
  if (!templateSpec || !templateSpec.main) {
    throw new Exception('Unknown template object: ' + typeof templateSpec);
  }

  // Note: Using env.VM references rather than local var references throughout this section to allow
  // for external users to override these as psuedo-supported APIs.
  env.VM.checkRevision(templateSpec.compiler);

  var invokePartialWrapper = function(partial, indent, name, context, hash, helpers, partials, data, depths) {
    if (hash) {
      context = Utils.extend({}, context, hash);
    }

    var result = env.VM.invokePartial.call(this, partial, name, context, helpers, partials, data, depths);

    if (result == null && env.compile) {
      var options = { helpers: helpers, partials: partials, data: data, depths: depths };
      partials[name] = env.compile(partial, { data: data !== undefined, compat: templateSpec.compat }, env);
      result = partials[name](context, options);
    }
    if (result != null) {
      if (indent) {
        var lines = result.split('\n');
        for (var i = 0, l = lines.length; i < l; i++) {
          if (!lines[i] && i + 1 === l) {
            break;
          }

          lines[i] = indent + lines[i];
        }
        result = lines.join('\n');
      }
      return result;
    } else {
      throw new Exception("The partial " + name + " could not be compiled when running in runtime-only mode");
    }
  };

  // Just add water
  var container = {
    lookup: function(depths, name) {
      var len = depths.length;
      for (var i = 0; i < len; i++) {
        if (depths[i] && depths[i][name] != null) {
          return depths[i][name];
        }
      }
    },
    lambda: function(current, context) {
      return typeof current === 'function' ? current.call(context) : current;
    },

    escapeExpression: Utils.escapeExpression,
    invokePartial: invokePartialWrapper,

    fn: function(i) {
      return templateSpec[i];
    },

    programs: [],
    program: function(i, data, depths) {
      var programWrapper = this.programs[i],
          fn = this.fn(i);
      if (data || depths) {
        programWrapper = program(this, i, fn, data, depths);
      } else if (!programWrapper) {
        programWrapper = this.programs[i] = program(this, i, fn);
      }
      return programWrapper;
    },

    data: function(data, depth) {
      while (data && depth--) {
        data = data._parent;
      }
      return data;
    },
    merge: function(param, common) {
      var ret = param || common;

      if (param && common && (param !== common)) {
        ret = Utils.extend({}, common, param);
      }

      return ret;
    },

    noop: env.VM.noop,
    compilerInfo: templateSpec.compiler
  };

  var ret = function(context, options) {
    options = options || {};
    var data = options.data;

    ret._setup(options);
    if (!options.partial && templateSpec.useData) {
      data = initData(context, data);
    }
    var depths;
    if (templateSpec.useDepths) {
      depths = options.depths ? [context].concat(options.depths) : [context];
    }

    return templateSpec.main.call(container, context, container.helpers, container.partials, data, depths);
  };
  ret.isTop = true;

  ret._setup = function(options) {
    if (!options.partial) {
      container.helpers = container.merge(options.helpers, env.helpers);

      if (templateSpec.usePartial) {
        container.partials = container.merge(options.partials, env.partials);
      }
    } else {
      container.helpers = options.helpers;
      container.partials = options.partials;
    }
  };

  ret._child = function(i, data, depths) {
    if (templateSpec.useDepths && !depths) {
      throw new Exception('must pass parent depths');
    }

    return program(container, i, templateSpec[i], data, depths);
  };
  return ret;
}

exports.template = template;function program(container, i, fn, data, depths) {
  var prog = function(context, options) {
    options = options || {};

    return fn.call(container, context, container.helpers, container.partials, options.data || data, depths && [context].concat(depths));
  };
  prog.program = i;
  prog.depth = depths ? depths.length : 0;
  return prog;
}

exports.program = program;function invokePartial(partial, name, context, helpers, partials, data, depths) {
  var options = { partial: true, helpers: helpers, partials: partials, data: data, depths: depths };

  if(partial === undefined) {
    throw new Exception("The partial " + name + " could not be found");
  } else if(partial instanceof Function) {
    return partial(context, options);
  }
}

exports.invokePartial = invokePartial;function noop() { return ""; }

exports.noop = noop;function initData(context, data) {
  if (!data || !('root' in data)) {
    data = data ? createFrame(data) : {};
    data.root = context;
  }
  return data;
}
},{"./base":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/base.js","./exception":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/exception.js","./utils":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/utils.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/safe-string.js":[function(require,module,exports){
"use strict";
// Build out our basic SafeString type
function SafeString(string) {
  this.string = string;
}

SafeString.prototype.toString = function() {
  return "" + this.string;
};

exports["default"] = SafeString;
},{}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/utils.js":[function(require,module,exports){
"use strict";
/*jshint -W004 */
var SafeString = require("./safe-string")["default"];

var escape = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "`": "&#x60;"
};

var badChars = /[&<>"'`]/g;
var possible = /[&<>"'`]/;

function escapeChar(chr) {
  return escape[chr];
}

function extend(obj /* , ...source */) {
  for (var i = 1; i < arguments.length; i++) {
    for (var key in arguments[i]) {
      if (Object.prototype.hasOwnProperty.call(arguments[i], key)) {
        obj[key] = arguments[i][key];
      }
    }
  }

  return obj;
}

exports.extend = extend;var toString = Object.prototype.toString;
exports.toString = toString;
// Sourced from lodash
// https://github.com/bestiejs/lodash/blob/master/LICENSE.txt
var isFunction = function(value) {
  return typeof value === 'function';
};
// fallback for older versions of Chrome and Safari
/* istanbul ignore next */
if (isFunction(/x/)) {
  isFunction = function(value) {
    return typeof value === 'function' && toString.call(value) === '[object Function]';
  };
}
var isFunction;
exports.isFunction = isFunction;
/* istanbul ignore next */
var isArray = Array.isArray || function(value) {
  return (value && typeof value === 'object') ? toString.call(value) === '[object Array]' : false;
};
exports.isArray = isArray;

function escapeExpression(string) {
  // don't escape SafeStrings, since they're already safe
  if (string instanceof SafeString) {
    return string.toString();
  } else if (string == null) {
    return "";
  } else if (!string) {
    return string + '';
  }

  // Force a string conversion as this will be done by the append regardless and
  // the regex test will do this transparently behind the scenes, causing issues if
  // an object's to string has escaped characters in it.
  string = "" + string;

  if(!possible.test(string)) { return string; }
  return string.replace(badChars, escapeChar);
}

exports.escapeExpression = escapeExpression;function isEmpty(value) {
  if (!value && value !== 0) {
    return true;
  } else if (isArray(value) && value.length === 0) {
    return true;
  } else {
    return false;
  }
}

exports.isEmpty = isEmpty;function appendContextPath(contextPath, id) {
  return (contextPath ? contextPath + '.' : '') + id;
}

exports.appendContextPath = appendContextPath;
},{"./safe-string":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars/safe-string.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/runtime.js":[function(require,module,exports){
// Create a simple path alias to allow browserify to resolve
// the runtime on a supported path.
module.exports = require('./dist/cjs/handlebars.runtime');

},{"./dist/cjs/handlebars.runtime":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/dist/cjs/handlebars.runtime.js"}],"hbsfy/runtime":[function(require,module,exports){
module.exports=require('pu95bm');
},{}],"pu95bm":[function(require,module,exports){
module.exports = require("handlebars/runtime")["default"];

},{"handlebars/runtime":"/Users/iuriikozuliak/Projects/buckets/node_modules/handlebars/runtime.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/moment/moment.js":[function(require,module,exports){
//! moment.js
//! version : 2.10.6
//! authors : Tim Wood, Iskren Chernev, Moment.js contributors
//! license : MIT
//! momentjs.com

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    global.moment = factory()
}(this, function () { 'use strict';

    var hookCallback;

    function utils_hooks__hooks () {
        return hookCallback.apply(null, arguments);
    }

    // This is done to register the method called with moment()
    // without creating circular dependencies.
    function setHookCallback (callback) {
        hookCallback = callback;
    }

    function isArray(input) {
        return Object.prototype.toString.call(input) === '[object Array]';
    }

    function isDate(input) {
        return input instanceof Date || Object.prototype.toString.call(input) === '[object Date]';
    }

    function map(arr, fn) {
        var res = [], i;
        for (i = 0; i < arr.length; ++i) {
            res.push(fn(arr[i], i));
        }
        return res;
    }

    function hasOwnProp(a, b) {
        return Object.prototype.hasOwnProperty.call(a, b);
    }

    function extend(a, b) {
        for (var i in b) {
            if (hasOwnProp(b, i)) {
                a[i] = b[i];
            }
        }

        if (hasOwnProp(b, 'toString')) {
            a.toString = b.toString;
        }

        if (hasOwnProp(b, 'valueOf')) {
            a.valueOf = b.valueOf;
        }

        return a;
    }

    function create_utc__createUTC (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, true).utc();
    }

    function defaultParsingFlags() {
        // We need to deep clone this object.
        return {
            empty           : false,
            unusedTokens    : [],
            unusedInput     : [],
            overflow        : -2,
            charsLeftOver   : 0,
            nullInput       : false,
            invalidMonth    : null,
            invalidFormat   : false,
            userInvalidated : false,
            iso             : false
        };
    }

    function getParsingFlags(m) {
        if (m._pf == null) {
            m._pf = defaultParsingFlags();
        }
        return m._pf;
    }

    function valid__isValid(m) {
        if (m._isValid == null) {
            var flags = getParsingFlags(m);
            m._isValid = !isNaN(m._d.getTime()) &&
                flags.overflow < 0 &&
                !flags.empty &&
                !flags.invalidMonth &&
                !flags.invalidWeekday &&
                !flags.nullInput &&
                !flags.invalidFormat &&
                !flags.userInvalidated;

            if (m._strict) {
                m._isValid = m._isValid &&
                    flags.charsLeftOver === 0 &&
                    flags.unusedTokens.length === 0 &&
                    flags.bigHour === undefined;
            }
        }
        return m._isValid;
    }

    function valid__createInvalid (flags) {
        var m = create_utc__createUTC(NaN);
        if (flags != null) {
            extend(getParsingFlags(m), flags);
        }
        else {
            getParsingFlags(m).userInvalidated = true;
        }

        return m;
    }

    var momentProperties = utils_hooks__hooks.momentProperties = [];

    function copyConfig(to, from) {
        var i, prop, val;

        if (typeof from._isAMomentObject !== 'undefined') {
            to._isAMomentObject = from._isAMomentObject;
        }
        if (typeof from._i !== 'undefined') {
            to._i = from._i;
        }
        if (typeof from._f !== 'undefined') {
            to._f = from._f;
        }
        if (typeof from._l !== 'undefined') {
            to._l = from._l;
        }
        if (typeof from._strict !== 'undefined') {
            to._strict = from._strict;
        }
        if (typeof from._tzm !== 'undefined') {
            to._tzm = from._tzm;
        }
        if (typeof from._isUTC !== 'undefined') {
            to._isUTC = from._isUTC;
        }
        if (typeof from._offset !== 'undefined') {
            to._offset = from._offset;
        }
        if (typeof from._pf !== 'undefined') {
            to._pf = getParsingFlags(from);
        }
        if (typeof from._locale !== 'undefined') {
            to._locale = from._locale;
        }

        if (momentProperties.length > 0) {
            for (i in momentProperties) {
                prop = momentProperties[i];
                val = from[prop];
                if (typeof val !== 'undefined') {
                    to[prop] = val;
                }
            }
        }

        return to;
    }

    var updateInProgress = false;

    // Moment prototype object
    function Moment(config) {
        copyConfig(this, config);
        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
        // Prevent infinite loop in case updateOffset creates new moment
        // objects.
        if (updateInProgress === false) {
            updateInProgress = true;
            utils_hooks__hooks.updateOffset(this);
            updateInProgress = false;
        }
    }

    function isMoment (obj) {
        return obj instanceof Moment || (obj != null && obj._isAMomentObject != null);
    }

    function absFloor (number) {
        if (number < 0) {
            return Math.ceil(number);
        } else {
            return Math.floor(number);
        }
    }

    function toInt(argumentForCoercion) {
        var coercedNumber = +argumentForCoercion,
            value = 0;

        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
            value = absFloor(coercedNumber);
        }

        return value;
    }

    function compareArrays(array1, array2, dontConvert) {
        var len = Math.min(array1.length, array2.length),
            lengthDiff = Math.abs(array1.length - array2.length),
            diffs = 0,
            i;
        for (i = 0; i < len; i++) {
            if ((dontConvert && array1[i] !== array2[i]) ||
                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))) {
                diffs++;
            }
        }
        return diffs + lengthDiff;
    }

    function Locale() {
    }

    var locales = {};
    var globalLocale;

    function normalizeLocale(key) {
        return key ? key.toLowerCase().replace('_', '-') : key;
    }

    // pick the locale from the array
    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
    function chooseLocale(names) {
        var i = 0, j, next, locale, split;

        while (i < names.length) {
            split = normalizeLocale(names[i]).split('-');
            j = split.length;
            next = normalizeLocale(names[i + 1]);
            next = next ? next.split('-') : null;
            while (j > 0) {
                locale = loadLocale(split.slice(0, j).join('-'));
                if (locale) {
                    return locale;
                }
                if (next && next.length >= j && compareArrays(split, next, true) >= j - 1) {
                    //the next array item is better than a shallower substring of this one
                    break;
                }
                j--;
            }
            i++;
        }
        return null;
    }

    function loadLocale(name) {
        var oldLocale = null;
        // TODO: Find a better way to register and load all the locales in Node
        if (!locales[name] && typeof module !== 'undefined' &&
                module && module.exports) {
            try {
                oldLocale = globalLocale._abbr;
                require('./locale/' + name);
                // because defineLocale currently also sets the global locale, we
                // want to undo that for lazy loaded locales
                locale_locales__getSetGlobalLocale(oldLocale);
            } catch (e) { }
        }
        return locales[name];
    }

    // This function will load locale and then set the global locale.  If
    // no arguments are passed in, it will simply return the current global
    // locale key.
    function locale_locales__getSetGlobalLocale (key, values) {
        var data;
        if (key) {
            if (typeof values === 'undefined') {
                data = locale_locales__getLocale(key);
            }
            else {
                data = defineLocale(key, values);
            }

            if (data) {
                // moment.duration._locale = moment._locale = data;
                globalLocale = data;
            }
        }

        return globalLocale._abbr;
    }

    function defineLocale (name, values) {
        if (values !== null) {
            values.abbr = name;
            locales[name] = locales[name] || new Locale();
            locales[name].set(values);

            // backwards compat for now: also set the locale
            locale_locales__getSetGlobalLocale(name);

            return locales[name];
        } else {
            // useful for testing
            delete locales[name];
            return null;
        }
    }

    // returns locale data
    function locale_locales__getLocale (key) {
        var locale;

        if (key && key._locale && key._locale._abbr) {
            key = key._locale._abbr;
        }

        if (!key) {
            return globalLocale;
        }

        if (!isArray(key)) {
            //short-circuit everything else
            locale = loadLocale(key);
            if (locale) {
                return locale;
            }
            key = [key];
        }

        return chooseLocale(key);
    }

    var aliases = {};

    function addUnitAlias (unit, shorthand) {
        var lowerCase = unit.toLowerCase();
        aliases[lowerCase] = aliases[lowerCase + 's'] = aliases[shorthand] = unit;
    }

    function normalizeUnits(units) {
        return typeof units === 'string' ? aliases[units] || aliases[units.toLowerCase()] : undefined;
    }

    function normalizeObjectUnits(inputObject) {
        var normalizedInput = {},
            normalizedProp,
            prop;

        for (prop in inputObject) {
            if (hasOwnProp(inputObject, prop)) {
                normalizedProp = normalizeUnits(prop);
                if (normalizedProp) {
                    normalizedInput[normalizedProp] = inputObject[prop];
                }
            }
        }

        return normalizedInput;
    }

    function makeGetSet (unit, keepTime) {
        return function (value) {
            if (value != null) {
                get_set__set(this, unit, value);
                utils_hooks__hooks.updateOffset(this, keepTime);
                return this;
            } else {
                return get_set__get(this, unit);
            }
        };
    }

    function get_set__get (mom, unit) {
        return mom._d['get' + (mom._isUTC ? 'UTC' : '') + unit]();
    }

    function get_set__set (mom, unit, value) {
        return mom._d['set' + (mom._isUTC ? 'UTC' : '') + unit](value);
    }

    // MOMENTS

    function getSet (units, value) {
        var unit;
        if (typeof units === 'object') {
            for (unit in units) {
                this.set(unit, units[unit]);
            }
        } else {
            units = normalizeUnits(units);
            if (typeof this[units] === 'function') {
                return this[units](value);
            }
        }
        return this;
    }

    function zeroFill(number, targetLength, forceSign) {
        var absNumber = '' + Math.abs(number),
            zerosToFill = targetLength - absNumber.length,
            sign = number >= 0;
        return (sign ? (forceSign ? '+' : '') : '-') +
            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) + absNumber;
    }

    var formattingTokens = /(\[[^\[]*\])|(\\)?(Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Q|YYYYYY|YYYYY|YYYY|YY|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g;

    var localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g;

    var formatFunctions = {};

    var formatTokenFunctions = {};

    // token:    'M'
    // padded:   ['MM', 2]
    // ordinal:  'Mo'
    // callback: function () { this.month() + 1 }
    function addFormatToken (token, padded, ordinal, callback) {
        var func = callback;
        if (typeof callback === 'string') {
            func = function () {
                return this[callback]();
            };
        }
        if (token) {
            formatTokenFunctions[token] = func;
        }
        if (padded) {
            formatTokenFunctions[padded[0]] = function () {
                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
            };
        }
        if (ordinal) {
            formatTokenFunctions[ordinal] = function () {
                return this.localeData().ordinal(func.apply(this, arguments), token);
            };
        }
    }

    function removeFormattingTokens(input) {
        if (input.match(/\[[\s\S]/)) {
            return input.replace(/^\[|\]$/g, '');
        }
        return input.replace(/\\/g, '');
    }

    function makeFormatFunction(format) {
        var array = format.match(formattingTokens), i, length;

        for (i = 0, length = array.length; i < length; i++) {
            if (formatTokenFunctions[array[i]]) {
                array[i] = formatTokenFunctions[array[i]];
            } else {
                array[i] = removeFormattingTokens(array[i]);
            }
        }

        return function (mom) {
            var output = '';
            for (i = 0; i < length; i++) {
                output += array[i] instanceof Function ? array[i].call(mom, format) : array[i];
            }
            return output;
        };
    }

    // format date using native date object
    function formatMoment(m, format) {
        if (!m.isValid()) {
            return m.localeData().invalidDate();
        }

        format = expandFormat(format, m.localeData());
        formatFunctions[format] = formatFunctions[format] || makeFormatFunction(format);

        return formatFunctions[format](m);
    }

    function expandFormat(format, locale) {
        var i = 5;

        function replaceLongDateFormatTokens(input) {
            return locale.longDateFormat(input) || input;
        }

        localFormattingTokens.lastIndex = 0;
        while (i >= 0 && localFormattingTokens.test(format)) {
            format = format.replace(localFormattingTokens, replaceLongDateFormatTokens);
            localFormattingTokens.lastIndex = 0;
            i -= 1;
        }

        return format;
    }

    var match1         = /\d/;            //       0 - 9
    var match2         = /\d\d/;          //      00 - 99
    var match3         = /\d{3}/;         //     000 - 999
    var match4         = /\d{4}/;         //    0000 - 9999
    var match6         = /[+-]?\d{6}/;    // -999999 - 999999
    var match1to2      = /\d\d?/;         //       0 - 99
    var match1to3      = /\d{1,3}/;       //       0 - 999
    var match1to4      = /\d{1,4}/;       //       0 - 9999
    var match1to6      = /[+-]?\d{1,6}/;  // -999999 - 999999

    var matchUnsigned  = /\d+/;           //       0 - inf
    var matchSigned    = /[+-]?\d+/;      //    -inf - inf

    var matchOffset    = /Z|[+-]\d\d:?\d\d/gi; // +00:00 -00:00 +0000 -0000 or Z

    var matchTimestamp = /[+-]?\d+(\.\d{1,3})?/; // 123456789 123456789.123

    // any word (or two) characters or numbers including two/three word month in arabic.
    var matchWord = /[0-9]*['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+|[\u0600-\u06FF\/]+(\s*?[\u0600-\u06FF]+){1,2}/i;

    var regexes = {};

    function isFunction (sth) {
        // https://github.com/moment/moment/issues/2325
        return typeof sth === 'function' &&
            Object.prototype.toString.call(sth) === '[object Function]';
    }


    function addRegexToken (token, regex, strictRegex) {
        regexes[token] = isFunction(regex) ? regex : function (isStrict) {
            return (isStrict && strictRegex) ? strictRegex : regex;
        };
    }

    function getParseRegexForToken (token, config) {
        if (!hasOwnProp(regexes, token)) {
            return new RegExp(unescapeFormat(token));
        }

        return regexes[token](config._strict, config._locale);
    }

    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
    function unescapeFormat(s) {
        return s.replace('\\', '').replace(/\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g, function (matched, p1, p2, p3, p4) {
            return p1 || p2 || p3 || p4;
        }).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    }

    var tokens = {};

    function addParseToken (token, callback) {
        var i, func = callback;
        if (typeof token === 'string') {
            token = [token];
        }
        if (typeof callback === 'number') {
            func = function (input, array) {
                array[callback] = toInt(input);
            };
        }
        for (i = 0; i < token.length; i++) {
            tokens[token[i]] = func;
        }
    }

    function addWeekParseToken (token, callback) {
        addParseToken(token, function (input, array, config, token) {
            config._w = config._w || {};
            callback(input, config._w, config, token);
        });
    }

    function addTimeToArrayFromToken(token, input, config) {
        if (input != null && hasOwnProp(tokens, token)) {
            tokens[token](input, config._a, config, token);
        }
    }

    var YEAR = 0;
    var MONTH = 1;
    var DATE = 2;
    var HOUR = 3;
    var MINUTE = 4;
    var SECOND = 5;
    var MILLISECOND = 6;

    function daysInMonth(year, month) {
        return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    }

    // FORMATTING

    addFormatToken('M', ['MM', 2], 'Mo', function () {
        return this.month() + 1;
    });

    addFormatToken('MMM', 0, 0, function (format) {
        return this.localeData().monthsShort(this, format);
    });

    addFormatToken('MMMM', 0, 0, function (format) {
        return this.localeData().months(this, format);
    });

    // ALIASES

    addUnitAlias('month', 'M');

    // PARSING

    addRegexToken('M',    match1to2);
    addRegexToken('MM',   match1to2, match2);
    addRegexToken('MMM',  matchWord);
    addRegexToken('MMMM', matchWord);

    addParseToken(['M', 'MM'], function (input, array) {
        array[MONTH] = toInt(input) - 1;
    });

    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
        var month = config._locale.monthsParse(input, token, config._strict);
        // if we didn't find a month name, mark the date as invalid.
        if (month != null) {
            array[MONTH] = month;
        } else {
            getParsingFlags(config).invalidMonth = input;
        }
    });

    // LOCALES

    var defaultLocaleMonths = 'January_February_March_April_May_June_July_August_September_October_November_December'.split('_');
    function localeMonths (m) {
        return this._months[m.month()];
    }

    var defaultLocaleMonthsShort = 'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_');
    function localeMonthsShort (m) {
        return this._monthsShort[m.month()];
    }

    function localeMonthsParse (monthName, format, strict) {
        var i, mom, regex;

        if (!this._monthsParse) {
            this._monthsParse = [];
            this._longMonthsParse = [];
            this._shortMonthsParse = [];
        }

        for (i = 0; i < 12; i++) {
            // make the regex if we don't have it already
            mom = create_utc__createUTC([2000, i]);
            if (strict && !this._longMonthsParse[i]) {
                this._longMonthsParse[i] = new RegExp('^' + this.months(mom, '').replace('.', '') + '$', 'i');
                this._shortMonthsParse[i] = new RegExp('^' + this.monthsShort(mom, '').replace('.', '') + '$', 'i');
            }
            if (!strict && !this._monthsParse[i]) {
                regex = '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (strict && format === 'MMMM' && this._longMonthsParse[i].test(monthName)) {
                return i;
            } else if (strict && format === 'MMM' && this._shortMonthsParse[i].test(monthName)) {
                return i;
            } else if (!strict && this._monthsParse[i].test(monthName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function setMonth (mom, value) {
        var dayOfMonth;

        // TODO: Move this out of here!
        if (typeof value === 'string') {
            value = mom.localeData().monthsParse(value);
            // TODO: Another silent failure?
            if (typeof value !== 'number') {
                return mom;
            }
        }

        dayOfMonth = Math.min(mom.date(), daysInMonth(mom.year(), value));
        mom._d['set' + (mom._isUTC ? 'UTC' : '') + 'Month'](value, dayOfMonth);
        return mom;
    }

    function getSetMonth (value) {
        if (value != null) {
            setMonth(this, value);
            utils_hooks__hooks.updateOffset(this, true);
            return this;
        } else {
            return get_set__get(this, 'Month');
        }
    }

    function getDaysInMonth () {
        return daysInMonth(this.year(), this.month());
    }

    function checkOverflow (m) {
        var overflow;
        var a = m._a;

        if (a && getParsingFlags(m).overflow === -2) {
            overflow =
                a[MONTH]       < 0 || a[MONTH]       > 11  ? MONTH :
                a[DATE]        < 1 || a[DATE]        > daysInMonth(a[YEAR], a[MONTH]) ? DATE :
                a[HOUR]        < 0 || a[HOUR]        > 24 || (a[HOUR] === 24 && (a[MINUTE] !== 0 || a[SECOND] !== 0 || a[MILLISECOND] !== 0)) ? HOUR :
                a[MINUTE]      < 0 || a[MINUTE]      > 59  ? MINUTE :
                a[SECOND]      < 0 || a[SECOND]      > 59  ? SECOND :
                a[MILLISECOND] < 0 || a[MILLISECOND] > 999 ? MILLISECOND :
                -1;

            if (getParsingFlags(m)._overflowDayOfYear && (overflow < YEAR || overflow > DATE)) {
                overflow = DATE;
            }

            getParsingFlags(m).overflow = overflow;
        }

        return m;
    }

    function warn(msg) {
        if (utils_hooks__hooks.suppressDeprecationWarnings === false && typeof console !== 'undefined' && console.warn) {
            console.warn('Deprecation warning: ' + msg);
        }
    }

    function deprecate(msg, fn) {
        var firstTime = true;

        return extend(function () {
            if (firstTime) {
                warn(msg + '\n' + (new Error()).stack);
                firstTime = false;
            }
            return fn.apply(this, arguments);
        }, fn);
    }

    var deprecations = {};

    function deprecateSimple(name, msg) {
        if (!deprecations[name]) {
            warn(msg);
            deprecations[name] = true;
        }
    }

    utils_hooks__hooks.suppressDeprecationWarnings = false;

    var from_string__isoRegex = /^\s*(?:[+-]\d{6}|\d{4})-(?:(\d\d-\d\d)|(W\d\d$)|(W\d\d-\d)|(\d\d\d))((T| )(\d\d(:\d\d(:\d\d(\.\d+)?)?)?)?([\+\-]\d\d(?::?\d\d)?|\s*Z)?)?$/;

    var isoDates = [
        ['YYYYYY-MM-DD', /[+-]\d{6}-\d{2}-\d{2}/],
        ['YYYY-MM-DD', /\d{4}-\d{2}-\d{2}/],
        ['GGGG-[W]WW-E', /\d{4}-W\d{2}-\d/],
        ['GGGG-[W]WW', /\d{4}-W\d{2}/],
        ['YYYY-DDD', /\d{4}-\d{3}/]
    ];

    // iso time formats and regexes
    var isoTimes = [
        ['HH:mm:ss.SSSS', /(T| )\d\d:\d\d:\d\d\.\d+/],
        ['HH:mm:ss', /(T| )\d\d:\d\d:\d\d/],
        ['HH:mm', /(T| )\d\d:\d\d/],
        ['HH', /(T| )\d\d/]
    ];

    var aspNetJsonRegex = /^\/?Date\((\-?\d+)/i;

    // date from iso format
    function configFromISO(config) {
        var i, l,
            string = config._i,
            match = from_string__isoRegex.exec(string);

        if (match) {
            getParsingFlags(config).iso = true;
            for (i = 0, l = isoDates.length; i < l; i++) {
                if (isoDates[i][1].exec(string)) {
                    config._f = isoDates[i][0];
                    break;
                }
            }
            for (i = 0, l = isoTimes.length; i < l; i++) {
                if (isoTimes[i][1].exec(string)) {
                    // match[6] should be 'T' or space
                    config._f += (match[6] || ' ') + isoTimes[i][0];
                    break;
                }
            }
            if (string.match(matchOffset)) {
                config._f += 'Z';
            }
            configFromStringAndFormat(config);
        } else {
            config._isValid = false;
        }
    }

    // date from iso format or fallback
    function configFromString(config) {
        var matched = aspNetJsonRegex.exec(config._i);

        if (matched !== null) {
            config._d = new Date(+matched[1]);
            return;
        }

        configFromISO(config);
        if (config._isValid === false) {
            delete config._isValid;
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    utils_hooks__hooks.createFromInputFallback = deprecate(
        'moment construction falls back to js Date. This is ' +
        'discouraged and will be removed in upcoming major ' +
        'release. Please refer to ' +
        'https://github.com/moment/moment/issues/1407 for more info.',
        function (config) {
            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
        }
    );

    function createDate (y, m, d, h, M, s, ms) {
        //can't just apply() to create a date:
        //http://stackoverflow.com/questions/181348/instantiating-a-javascript-object-by-calling-prototype-constructor-apply
        var date = new Date(y, m, d, h, M, s, ms);

        //the date constructor doesn't accept years < 1970
        if (y < 1970) {
            date.setFullYear(y);
        }
        return date;
    }

    function createUTCDate (y) {
        var date = new Date(Date.UTC.apply(null, arguments));
        if (y < 1970) {
            date.setUTCFullYear(y);
        }
        return date;
    }

    addFormatToken(0, ['YY', 2], 0, function () {
        return this.year() % 100;
    });

    addFormatToken(0, ['YYYY',   4],       0, 'year');
    addFormatToken(0, ['YYYYY',  5],       0, 'year');
    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

    // ALIASES

    addUnitAlias('year', 'y');

    // PARSING

    addRegexToken('Y',      matchSigned);
    addRegexToken('YY',     match1to2, match2);
    addRegexToken('YYYY',   match1to4, match4);
    addRegexToken('YYYYY',  match1to6, match6);
    addRegexToken('YYYYYY', match1to6, match6);

    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
    addParseToken('YYYY', function (input, array) {
        array[YEAR] = input.length === 2 ? utils_hooks__hooks.parseTwoDigitYear(input) : toInt(input);
    });
    addParseToken('YY', function (input, array) {
        array[YEAR] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function daysInYear(year) {
        return isLeapYear(year) ? 366 : 365;
    }

    function isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
    }

    // HOOKS

    utils_hooks__hooks.parseTwoDigitYear = function (input) {
        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
    };

    // MOMENTS

    var getSetYear = makeGetSet('FullYear', false);

    function getIsLeapYear () {
        return isLeapYear(this.year());
    }

    addFormatToken('w', ['ww', 2], 'wo', 'week');
    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

    // ALIASES

    addUnitAlias('week', 'w');
    addUnitAlias('isoWeek', 'W');

    // PARSING

    addRegexToken('w',  match1to2);
    addRegexToken('ww', match1to2, match2);
    addRegexToken('W',  match1to2);
    addRegexToken('WW', match1to2, match2);

    addWeekParseToken(['w', 'ww', 'W', 'WW'], function (input, week, config, token) {
        week[token.substr(0, 1)] = toInt(input);
    });

    // HELPERS

    // firstDayOfWeek       0 = sun, 6 = sat
    //                      the day of the week that starts the week
    //                      (usually sunday or monday)
    // firstDayOfWeekOfYear 0 = sun, 6 = sat
    //                      the first week is the week that contains the first
    //                      of this day of the week
    //                      (eg. ISO weeks use thursday (4))
    function weekOfYear(mom, firstDayOfWeek, firstDayOfWeekOfYear) {
        var end = firstDayOfWeekOfYear - firstDayOfWeek,
            daysToDayOfWeek = firstDayOfWeekOfYear - mom.day(),
            adjustedMoment;


        if (daysToDayOfWeek > end) {
            daysToDayOfWeek -= 7;
        }

        if (daysToDayOfWeek < end - 7) {
            daysToDayOfWeek += 7;
        }

        adjustedMoment = local__createLocal(mom).add(daysToDayOfWeek, 'd');
        return {
            week: Math.ceil(adjustedMoment.dayOfYear() / 7),
            year: adjustedMoment.year()
        };
    }

    // LOCALES

    function localeWeek (mom) {
        return weekOfYear(mom, this._week.dow, this._week.doy).week;
    }

    var defaultLocaleWeek = {
        dow : 0, // Sunday is the first day of the week.
        doy : 6  // The week that contains Jan 1st is the first week of the year.
    };

    function localeFirstDayOfWeek () {
        return this._week.dow;
    }

    function localeFirstDayOfYear () {
        return this._week.doy;
    }

    // MOMENTS

    function getSetWeek (input) {
        var week = this.localeData().week(this);
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    function getSetISOWeek (input) {
        var week = weekOfYear(this, 1, 4).week;
        return input == null ? week : this.add((input - week) * 7, 'd');
    }

    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

    // ALIASES

    addUnitAlias('dayOfYear', 'DDD');

    // PARSING

    addRegexToken('DDD',  match1to3);
    addRegexToken('DDDD', match3);
    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
        config._dayOfYear = toInt(input);
    });

    // HELPERS

    //http://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
    function dayOfYearFromWeeks(year, week, weekday, firstDayOfWeekOfYear, firstDayOfWeek) {
        var week1Jan = 6 + firstDayOfWeek - firstDayOfWeekOfYear, janX = createUTCDate(year, 0, 1 + week1Jan), d = janX.getUTCDay(), dayOfYear;
        if (d < firstDayOfWeek) {
            d += 7;
        }

        weekday = weekday != null ? 1 * weekday : firstDayOfWeek;

        dayOfYear = 1 + week1Jan + 7 * (week - 1) - d + weekday;

        return {
            year: dayOfYear > 0 ? year : year - 1,
            dayOfYear: dayOfYear > 0 ?  dayOfYear : daysInYear(year - 1) + dayOfYear
        };
    }

    // MOMENTS

    function getSetDayOfYear (input) {
        var dayOfYear = Math.round((this.clone().startOf('day') - this.clone().startOf('year')) / 864e5) + 1;
        return input == null ? dayOfYear : this.add((input - dayOfYear), 'd');
    }

    // Pick the first defined of two or three arguments.
    function defaults(a, b, c) {
        if (a != null) {
            return a;
        }
        if (b != null) {
            return b;
        }
        return c;
    }

    function currentDateArray(config) {
        var now = new Date();
        if (config._useUTC) {
            return [now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()];
        }
        return [now.getFullYear(), now.getMonth(), now.getDate()];
    }

    // convert an array to a date.
    // the array should mirror the parameters below
    // note: all values past the year are optional and will default to the lowest possible value.
    // [year, month, day , hour, minute, second, millisecond]
    function configFromArray (config) {
        var i, date, input = [], currentDate, yearToUse;

        if (config._d) {
            return;
        }

        currentDate = currentDateArray(config);

        //compute day of the year from weeks and weekdays
        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
            dayOfYearFromWeekInfo(config);
        }

        //if the day of the year is set, figure out what it is
        if (config._dayOfYear) {
            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

            if (config._dayOfYear > daysInYear(yearToUse)) {
                getParsingFlags(config)._overflowDayOfYear = true;
            }

            date = createUTCDate(yearToUse, 0, config._dayOfYear);
            config._a[MONTH] = date.getUTCMonth();
            config._a[DATE] = date.getUTCDate();
        }

        // Default to current date.
        // * if no year, month, day of month are given, default to today
        // * if day of month is given, default month and year
        // * if month is given, default only year
        // * if year is given, don't default anything
        for (i = 0; i < 3 && config._a[i] == null; ++i) {
            config._a[i] = input[i] = currentDate[i];
        }

        // Zero out whatever was not defaulted, including time
        for (; i < 7; i++) {
            config._a[i] = input[i] = (config._a[i] == null) ? (i === 2 ? 1 : 0) : config._a[i];
        }

        // Check for 24:00:00.000
        if (config._a[HOUR] === 24 &&
                config._a[MINUTE] === 0 &&
                config._a[SECOND] === 0 &&
                config._a[MILLISECOND] === 0) {
            config._nextDay = true;
            config._a[HOUR] = 0;
        }

        config._d = (config._useUTC ? createUTCDate : createDate).apply(null, input);
        // Apply timezone offset from input. The actual utcOffset can be changed
        // with parseZone.
        if (config._tzm != null) {
            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
        }

        if (config._nextDay) {
            config._a[HOUR] = 24;
        }
    }

    function dayOfYearFromWeekInfo(config) {
        var w, weekYear, week, weekday, dow, doy, temp;

        w = config._w;
        if (w.GG != null || w.W != null || w.E != null) {
            dow = 1;
            doy = 4;

            // TODO: We need to take the current isoWeekYear, but that depends on
            // how we interpret now (local, utc, fixed offset). So create
            // a now version of current config (take local/utc/offset flags, and
            // create now).
            weekYear = defaults(w.GG, config._a[YEAR], weekOfYear(local__createLocal(), 1, 4).year);
            week = defaults(w.W, 1);
            weekday = defaults(w.E, 1);
        } else {
            dow = config._locale._week.dow;
            doy = config._locale._week.doy;

            weekYear = defaults(w.gg, config._a[YEAR], weekOfYear(local__createLocal(), dow, doy).year);
            week = defaults(w.w, 1);

            if (w.d != null) {
                // weekday -- low day numbers are considered next week
                weekday = w.d;
                if (weekday < dow) {
                    ++week;
                }
            } else if (w.e != null) {
                // local weekday -- counting starts from begining of week
                weekday = w.e + dow;
            } else {
                // default to begining of week
                weekday = dow;
            }
        }
        temp = dayOfYearFromWeeks(weekYear, week, weekday, doy, dow);

        config._a[YEAR] = temp.year;
        config._dayOfYear = temp.dayOfYear;
    }

    utils_hooks__hooks.ISO_8601 = function () {};

    // date from string and format string
    function configFromStringAndFormat(config) {
        // TODO: Move this to another part of the creation flow to prevent circular deps
        if (config._f === utils_hooks__hooks.ISO_8601) {
            configFromISO(config);
            return;
        }

        config._a = [];
        getParsingFlags(config).empty = true;

        // This array is used to make a Date, either with `new Date` or `Date.UTC`
        var string = '' + config._i,
            i, parsedInput, tokens, token, skipped,
            stringLength = string.length,
            totalParsedInputLength = 0;

        tokens = expandFormat(config._f, config._locale).match(formattingTokens) || [];

        for (i = 0; i < tokens.length; i++) {
            token = tokens[i];
            parsedInput = (string.match(getParseRegexForToken(token, config)) || [])[0];
            if (parsedInput) {
                skipped = string.substr(0, string.indexOf(parsedInput));
                if (skipped.length > 0) {
                    getParsingFlags(config).unusedInput.push(skipped);
                }
                string = string.slice(string.indexOf(parsedInput) + parsedInput.length);
                totalParsedInputLength += parsedInput.length;
            }
            // don't parse if it's not a known token
            if (formatTokenFunctions[token]) {
                if (parsedInput) {
                    getParsingFlags(config).empty = false;
                }
                else {
                    getParsingFlags(config).unusedTokens.push(token);
                }
                addTimeToArrayFromToken(token, parsedInput, config);
            }
            else if (config._strict && !parsedInput) {
                getParsingFlags(config).unusedTokens.push(token);
            }
        }

        // add remaining unparsed input length to the string
        getParsingFlags(config).charsLeftOver = stringLength - totalParsedInputLength;
        if (string.length > 0) {
            getParsingFlags(config).unusedInput.push(string);
        }

        // clear _12h flag if hour is <= 12
        if (getParsingFlags(config).bigHour === true &&
                config._a[HOUR] <= 12 &&
                config._a[HOUR] > 0) {
            getParsingFlags(config).bigHour = undefined;
        }
        // handle meridiem
        config._a[HOUR] = meridiemFixWrap(config._locale, config._a[HOUR], config._meridiem);

        configFromArray(config);
        checkOverflow(config);
    }


    function meridiemFixWrap (locale, hour, meridiem) {
        var isPm;

        if (meridiem == null) {
            // nothing to do
            return hour;
        }
        if (locale.meridiemHour != null) {
            return locale.meridiemHour(hour, meridiem);
        } else if (locale.isPM != null) {
            // Fallback
            isPm = locale.isPM(meridiem);
            if (isPm && hour < 12) {
                hour += 12;
            }
            if (!isPm && hour === 12) {
                hour = 0;
            }
            return hour;
        } else {
            // this is not supposed to happen
            return hour;
        }
    }

    function configFromStringAndArray(config) {
        var tempConfig,
            bestMoment,

            scoreToBeat,
            i,
            currentScore;

        if (config._f.length === 0) {
            getParsingFlags(config).invalidFormat = true;
            config._d = new Date(NaN);
            return;
        }

        for (i = 0; i < config._f.length; i++) {
            currentScore = 0;
            tempConfig = copyConfig({}, config);
            if (config._useUTC != null) {
                tempConfig._useUTC = config._useUTC;
            }
            tempConfig._f = config._f[i];
            configFromStringAndFormat(tempConfig);

            if (!valid__isValid(tempConfig)) {
                continue;
            }

            // if there is any input that was not parsed add a penalty for that format
            currentScore += getParsingFlags(tempConfig).charsLeftOver;

            //or tokens
            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

            getParsingFlags(tempConfig).score = currentScore;

            if (scoreToBeat == null || currentScore < scoreToBeat) {
                scoreToBeat = currentScore;
                bestMoment = tempConfig;
            }
        }

        extend(config, bestMoment || tempConfig);
    }

    function configFromObject(config) {
        if (config._d) {
            return;
        }

        var i = normalizeObjectUnits(config._i);
        config._a = [i.year, i.month, i.day || i.date, i.hour, i.minute, i.second, i.millisecond];

        configFromArray(config);
    }

    function createFromConfig (config) {
        var res = new Moment(checkOverflow(prepareConfig(config)));
        if (res._nextDay) {
            // Adding is smart enough around DST
            res.add(1, 'd');
            res._nextDay = undefined;
        }

        return res;
    }

    function prepareConfig (config) {
        var input = config._i,
            format = config._f;

        config._locale = config._locale || locale_locales__getLocale(config._l);

        if (input === null || (format === undefined && input === '')) {
            return valid__createInvalid({nullInput: true});
        }

        if (typeof input === 'string') {
            config._i = input = config._locale.preparse(input);
        }

        if (isMoment(input)) {
            return new Moment(checkOverflow(input));
        } else if (isArray(format)) {
            configFromStringAndArray(config);
        } else if (format) {
            configFromStringAndFormat(config);
        } else if (isDate(input)) {
            config._d = input;
        } else {
            configFromInput(config);
        }

        return config;
    }

    function configFromInput(config) {
        var input = config._i;
        if (input === undefined) {
            config._d = new Date();
        } else if (isDate(input)) {
            config._d = new Date(+input);
        } else if (typeof input === 'string') {
            configFromString(config);
        } else if (isArray(input)) {
            config._a = map(input.slice(0), function (obj) {
                return parseInt(obj, 10);
            });
            configFromArray(config);
        } else if (typeof(input) === 'object') {
            configFromObject(config);
        } else if (typeof(input) === 'number') {
            // from milliseconds
            config._d = new Date(input);
        } else {
            utils_hooks__hooks.createFromInputFallback(config);
        }
    }

    function createLocalOrUTC (input, format, locale, strict, isUTC) {
        var c = {};

        if (typeof(locale) === 'boolean') {
            strict = locale;
            locale = undefined;
        }
        // object construction must be done this way.
        // https://github.com/moment/moment/issues/1423
        c._isAMomentObject = true;
        c._useUTC = c._isUTC = isUTC;
        c._l = locale;
        c._i = input;
        c._f = format;
        c._strict = strict;

        return createFromConfig(c);
    }

    function local__createLocal (input, format, locale, strict) {
        return createLocalOrUTC(input, format, locale, strict, false);
    }

    var prototypeMin = deprecate(
         'moment().min is deprecated, use moment.min instead. https://github.com/moment/moment/issues/1548',
         function () {
             var other = local__createLocal.apply(null, arguments);
             return other < this ? this : other;
         }
     );

    var prototypeMax = deprecate(
        'moment().max is deprecated, use moment.max instead. https://github.com/moment/moment/issues/1548',
        function () {
            var other = local__createLocal.apply(null, arguments);
            return other > this ? this : other;
        }
    );

    // Pick a moment m from moments so that m[fn](other) is true for all
    // other. This relies on the function fn to be transitive.
    //
    // moments should either be an array of moment objects or an array, whose
    // first element is an array of moment objects.
    function pickBy(fn, moments) {
        var res, i;
        if (moments.length === 1 && isArray(moments[0])) {
            moments = moments[0];
        }
        if (!moments.length) {
            return local__createLocal();
        }
        res = moments[0];
        for (i = 1; i < moments.length; ++i) {
            if (!moments[i].isValid() || moments[i][fn](res)) {
                res = moments[i];
            }
        }
        return res;
    }

    // TODO: Use [].sort instead?
    function min () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isBefore', args);
    }

    function max () {
        var args = [].slice.call(arguments, 0);

        return pickBy('isAfter', args);
    }

    function Duration (duration) {
        var normalizedInput = normalizeObjectUnits(duration),
            years = normalizedInput.year || 0,
            quarters = normalizedInput.quarter || 0,
            months = normalizedInput.month || 0,
            weeks = normalizedInput.week || 0,
            days = normalizedInput.day || 0,
            hours = normalizedInput.hour || 0,
            minutes = normalizedInput.minute || 0,
            seconds = normalizedInput.second || 0,
            milliseconds = normalizedInput.millisecond || 0;

        // representation for dateAddRemove
        this._milliseconds = +milliseconds +
            seconds * 1e3 + // 1000
            minutes * 6e4 + // 1000 * 60
            hours * 36e5; // 1000 * 60 * 60
        // Because of dateAddRemove treats 24 hours as different from a
        // day when working around DST, we need to store them separately
        this._days = +days +
            weeks * 7;
        // It is impossible translate months into days without knowing
        // which months you are are talking about, so we have to store
        // it separately.
        this._months = +months +
            quarters * 3 +
            years * 12;

        this._data = {};

        this._locale = locale_locales__getLocale();

        this._bubble();
    }

    function isDuration (obj) {
        return obj instanceof Duration;
    }

    function offset (token, separator) {
        addFormatToken(token, 0, 0, function () {
            var offset = this.utcOffset();
            var sign = '+';
            if (offset < 0) {
                offset = -offset;
                sign = '-';
            }
            return sign + zeroFill(~~(offset / 60), 2) + separator + zeroFill(~~(offset) % 60, 2);
        });
    }

    offset('Z', ':');
    offset('ZZ', '');

    // PARSING

    addRegexToken('Z',  matchOffset);
    addRegexToken('ZZ', matchOffset);
    addParseToken(['Z', 'ZZ'], function (input, array, config) {
        config._useUTC = true;
        config._tzm = offsetFromString(input);
    });

    // HELPERS

    // timezone chunker
    // '+10:00' > ['10',  '00']
    // '-1530'  > ['-15', '30']
    var chunkOffset = /([\+\-]|\d\d)/gi;

    function offsetFromString(string) {
        var matches = ((string || '').match(matchOffset) || []);
        var chunk   = matches[matches.length - 1] || [];
        var parts   = (chunk + '').match(chunkOffset) || ['-', 0, 0];
        var minutes = +(parts[1] * 60) + toInt(parts[2]);

        return parts[0] === '+' ? minutes : -minutes;
    }

    // Return a moment from input, that is local/utc/zone equivalent to model.
    function cloneWithOffset(input, model) {
        var res, diff;
        if (model._isUTC) {
            res = model.clone();
            diff = (isMoment(input) || isDate(input) ? +input : +local__createLocal(input)) - (+res);
            // Use low-level api, because this fn is low-level api.
            res._d.setTime(+res._d + diff);
            utils_hooks__hooks.updateOffset(res, false);
            return res;
        } else {
            return local__createLocal(input).local();
        }
    }

    function getDateOffset (m) {
        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
        // https://github.com/moment/moment/pull/1871
        return -Math.round(m._d.getTimezoneOffset() / 15) * 15;
    }

    // HOOKS

    // This function will be called whenever a moment is mutated.
    // It is intended to keep the offset in sync with the timezone.
    utils_hooks__hooks.updateOffset = function () {};

    // MOMENTS

    // keepLocalTime = true means only change the timezone, without
    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
    // +0200, so we adjust the time as needed, to be valid.
    //
    // Keeping the time actually adds/subtracts (one hour)
    // from the actual represented time. That is why we call updateOffset
    // a second time. In case it wants us to change the offset again
    // _changeInProgress == true case, then we have to adjust, because
    // there is no such time in the given timezone.
    function getSetOffset (input, keepLocalTime) {
        var offset = this._offset || 0,
            localAdjust;
        if (input != null) {
            if (typeof input === 'string') {
                input = offsetFromString(input);
            }
            if (Math.abs(input) < 16) {
                input = input * 60;
            }
            if (!this._isUTC && keepLocalTime) {
                localAdjust = getDateOffset(this);
            }
            this._offset = input;
            this._isUTC = true;
            if (localAdjust != null) {
                this.add(localAdjust, 'm');
            }
            if (offset !== input) {
                if (!keepLocalTime || this._changeInProgress) {
                    add_subtract__addSubtract(this, create__createDuration(input - offset, 'm'), 1, false);
                } else if (!this._changeInProgress) {
                    this._changeInProgress = true;
                    utils_hooks__hooks.updateOffset(this, true);
                    this._changeInProgress = null;
                }
            }
            return this;
        } else {
            return this._isUTC ? offset : getDateOffset(this);
        }
    }

    function getSetZone (input, keepLocalTime) {
        if (input != null) {
            if (typeof input !== 'string') {
                input = -input;
            }

            this.utcOffset(input, keepLocalTime);

            return this;
        } else {
            return -this.utcOffset();
        }
    }

    function setOffsetToUTC (keepLocalTime) {
        return this.utcOffset(0, keepLocalTime);
    }

    function setOffsetToLocal (keepLocalTime) {
        if (this._isUTC) {
            this.utcOffset(0, keepLocalTime);
            this._isUTC = false;

            if (keepLocalTime) {
                this.subtract(getDateOffset(this), 'm');
            }
        }
        return this;
    }

    function setOffsetToParsedOffset () {
        if (this._tzm) {
            this.utcOffset(this._tzm);
        } else if (typeof this._i === 'string') {
            this.utcOffset(offsetFromString(this._i));
        }
        return this;
    }

    function hasAlignedHourOffset (input) {
        input = input ? local__createLocal(input).utcOffset() : 0;

        return (this.utcOffset() - input) % 60 === 0;
    }

    function isDaylightSavingTime () {
        return (
            this.utcOffset() > this.clone().month(0).utcOffset() ||
            this.utcOffset() > this.clone().month(5).utcOffset()
        );
    }

    function isDaylightSavingTimeShifted () {
        if (typeof this._isDSTShifted !== 'undefined') {
            return this._isDSTShifted;
        }

        var c = {};

        copyConfig(c, this);
        c = prepareConfig(c);

        if (c._a) {
            var other = c._isUTC ? create_utc__createUTC(c._a) : local__createLocal(c._a);
            this._isDSTShifted = this.isValid() &&
                compareArrays(c._a, other.toArray()) > 0;
        } else {
            this._isDSTShifted = false;
        }

        return this._isDSTShifted;
    }

    function isLocal () {
        return !this._isUTC;
    }

    function isUtcOffset () {
        return this._isUTC;
    }

    function isUtc () {
        return this._isUTC && this._offset === 0;
    }

    var aspNetRegex = /(\-)?(?:(\d*)\.)?(\d+)\:(\d+)(?:\:(\d+)\.?(\d{3})?)?/;

    // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
    // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
    var create__isoRegex = /^(-)?P(?:(?:([0-9,.]*)Y)?(?:([0-9,.]*)M)?(?:([0-9,.]*)D)?(?:T(?:([0-9,.]*)H)?(?:([0-9,.]*)M)?(?:([0-9,.]*)S)?)?|([0-9,.]*)W)$/;

    function create__createDuration (input, key) {
        var duration = input,
            // matching against regexp is expensive, do it on demand
            match = null,
            sign,
            ret,
            diffRes;

        if (isDuration(input)) {
            duration = {
                ms : input._milliseconds,
                d  : input._days,
                M  : input._months
            };
        } else if (typeof input === 'number') {
            duration = {};
            if (key) {
                duration[key] = input;
            } else {
                duration.milliseconds = input;
            }
        } else if (!!(match = aspNetRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y  : 0,
                d  : toInt(match[DATE])        * sign,
                h  : toInt(match[HOUR])        * sign,
                m  : toInt(match[MINUTE])      * sign,
                s  : toInt(match[SECOND])      * sign,
                ms : toInt(match[MILLISECOND]) * sign
            };
        } else if (!!(match = create__isoRegex.exec(input))) {
            sign = (match[1] === '-') ? -1 : 1;
            duration = {
                y : parseIso(match[2], sign),
                M : parseIso(match[3], sign),
                d : parseIso(match[4], sign),
                h : parseIso(match[5], sign),
                m : parseIso(match[6], sign),
                s : parseIso(match[7], sign),
                w : parseIso(match[8], sign)
            };
        } else if (duration == null) {// checks for null or undefined
            duration = {};
        } else if (typeof duration === 'object' && ('from' in duration || 'to' in duration)) {
            diffRes = momentsDifference(local__createLocal(duration.from), local__createLocal(duration.to));

            duration = {};
            duration.ms = diffRes.milliseconds;
            duration.M = diffRes.months;
        }

        ret = new Duration(duration);

        if (isDuration(input) && hasOwnProp(input, '_locale')) {
            ret._locale = input._locale;
        }

        return ret;
    }

    create__createDuration.fn = Duration.prototype;

    function parseIso (inp, sign) {
        // We'd normally use ~~inp for this, but unfortunately it also
        // converts floats to ints.
        // inp may be undefined, so careful calling replace on it.
        var res = inp && parseFloat(inp.replace(',', '.'));
        // apply sign while we're at it
        return (isNaN(res) ? 0 : res) * sign;
    }

    function positiveMomentsDifference(base, other) {
        var res = {milliseconds: 0, months: 0};

        res.months = other.month() - base.month() +
            (other.year() - base.year()) * 12;
        if (base.clone().add(res.months, 'M').isAfter(other)) {
            --res.months;
        }

        res.milliseconds = +other - +(base.clone().add(res.months, 'M'));

        return res;
    }

    function momentsDifference(base, other) {
        var res;
        other = cloneWithOffset(other, base);
        if (base.isBefore(other)) {
            res = positiveMomentsDifference(base, other);
        } else {
            res = positiveMomentsDifference(other, base);
            res.milliseconds = -res.milliseconds;
            res.months = -res.months;
        }

        return res;
    }

    function createAdder(direction, name) {
        return function (val, period) {
            var dur, tmp;
            //invert the arguments, but complain about it
            if (period !== null && !isNaN(+period)) {
                deprecateSimple(name, 'moment().' + name  + '(period, number) is deprecated. Please use moment().' + name + '(number, period).');
                tmp = val; val = period; period = tmp;
            }

            val = typeof val === 'string' ? +val : val;
            dur = create__createDuration(val, period);
            add_subtract__addSubtract(this, dur, direction);
            return this;
        };
    }

    function add_subtract__addSubtract (mom, duration, isAdding, updateOffset) {
        var milliseconds = duration._milliseconds,
            days = duration._days,
            months = duration._months;
        updateOffset = updateOffset == null ? true : updateOffset;

        if (milliseconds) {
            mom._d.setTime(+mom._d + milliseconds * isAdding);
        }
        if (days) {
            get_set__set(mom, 'Date', get_set__get(mom, 'Date') + days * isAdding);
        }
        if (months) {
            setMonth(mom, get_set__get(mom, 'Month') + months * isAdding);
        }
        if (updateOffset) {
            utils_hooks__hooks.updateOffset(mom, days || months);
        }
    }

    var add_subtract__add      = createAdder(1, 'add');
    var add_subtract__subtract = createAdder(-1, 'subtract');

    function moment_calendar__calendar (time, formats) {
        // We want to compare the start of today, vs this.
        // Getting start-of-today depends on whether we're local/utc/offset or not.
        var now = time || local__createLocal(),
            sod = cloneWithOffset(now, this).startOf('day'),
            diff = this.diff(sod, 'days', true),
            format = diff < -6 ? 'sameElse' :
                diff < -1 ? 'lastWeek' :
                diff < 0 ? 'lastDay' :
                diff < 1 ? 'sameDay' :
                diff < 2 ? 'nextDay' :
                diff < 7 ? 'nextWeek' : 'sameElse';
        return this.format(formats && formats[format] || this.localeData().calendar(format, this, local__createLocal(now)));
    }

    function clone () {
        return new Moment(this);
    }

    function isAfter (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this > +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return inputMs < +this.clone().startOf(units);
        }
    }

    function isBefore (input, units) {
        var inputMs;
        units = normalizeUnits(typeof units !== 'undefined' ? units : 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this < +input;
        } else {
            inputMs = isMoment(input) ? +input : +local__createLocal(input);
            return +this.clone().endOf(units) < inputMs;
        }
    }

    function isBetween (from, to, units) {
        return this.isAfter(from, units) && this.isBefore(to, units);
    }

    function isSame (input, units) {
        var inputMs;
        units = normalizeUnits(units || 'millisecond');
        if (units === 'millisecond') {
            input = isMoment(input) ? input : local__createLocal(input);
            return +this === +input;
        } else {
            inputMs = +local__createLocal(input);
            return +(this.clone().startOf(units)) <= inputMs && inputMs <= +(this.clone().endOf(units));
        }
    }

    function diff (input, units, asFloat) {
        var that = cloneWithOffset(input, this),
            zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4,
            delta, output;

        units = normalizeUnits(units);

        if (units === 'year' || units === 'month' || units === 'quarter') {
            output = monthDiff(this, that);
            if (units === 'quarter') {
                output = output / 3;
            } else if (units === 'year') {
                output = output / 12;
            }
        } else {
            delta = this - that;
            output = units === 'second' ? delta / 1e3 : // 1000
                units === 'minute' ? delta / 6e4 : // 1000 * 60
                units === 'hour' ? delta / 36e5 : // 1000 * 60 * 60
                units === 'day' ? (delta - zoneDelta) / 864e5 : // 1000 * 60 * 60 * 24, negate dst
                units === 'week' ? (delta - zoneDelta) / 6048e5 : // 1000 * 60 * 60 * 24 * 7, negate dst
                delta;
        }
        return asFloat ? output : absFloor(output);
    }

    function monthDiff (a, b) {
        // difference in months
        var wholeMonthDiff = ((b.year() - a.year()) * 12) + (b.month() - a.month()),
            // b is in (anchor - 1 month, anchor + 1 month)
            anchor = a.clone().add(wholeMonthDiff, 'months'),
            anchor2, adjust;

        if (b - anchor < 0) {
            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor - anchor2);
        } else {
            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
            // linear across the month
            adjust = (b - anchor) / (anchor2 - anchor);
        }

        return -(wholeMonthDiff + adjust);
    }

    utils_hooks__hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';

    function toString () {
        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
    }

    function moment_format__toISOString () {
        var m = this.clone().utc();
        if (0 < m.year() && m.year() <= 9999) {
            if ('function' === typeof Date.prototype.toISOString) {
                // native implementation is ~50x faster, use it when we can
                return this.toDate().toISOString();
            } else {
                return formatMoment(m, 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
            }
        } else {
            return formatMoment(m, 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]');
        }
    }

    function format (inputString) {
        var output = formatMoment(this, inputString || utils_hooks__hooks.defaultFormat);
        return this.localeData().postformat(output);
    }

    function from (time, withoutSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }
        return create__createDuration({to: this, from: time}).locale(this.locale()).humanize(!withoutSuffix);
    }

    function fromNow (withoutSuffix) {
        return this.from(local__createLocal(), withoutSuffix);
    }

    function to (time, withoutSuffix) {
        if (!this.isValid()) {
            return this.localeData().invalidDate();
        }
        return create__createDuration({from: this, to: time}).locale(this.locale()).humanize(!withoutSuffix);
    }

    function toNow (withoutSuffix) {
        return this.to(local__createLocal(), withoutSuffix);
    }

    function locale (key) {
        var newLocaleData;

        if (key === undefined) {
            return this._locale._abbr;
        } else {
            newLocaleData = locale_locales__getLocale(key);
            if (newLocaleData != null) {
                this._locale = newLocaleData;
            }
            return this;
        }
    }

    var lang = deprecate(
        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
        function (key) {
            if (key === undefined) {
                return this.localeData();
            } else {
                return this.locale(key);
            }
        }
    );

    function localeData () {
        return this._locale;
    }

    function startOf (units) {
        units = normalizeUnits(units);
        // the following switch intentionally omits break keywords
        // to utilize falling through the cases.
        switch (units) {
        case 'year':
            this.month(0);
            /* falls through */
        case 'quarter':
        case 'month':
            this.date(1);
            /* falls through */
        case 'week':
        case 'isoWeek':
        case 'day':
            this.hours(0);
            /* falls through */
        case 'hour':
            this.minutes(0);
            /* falls through */
        case 'minute':
            this.seconds(0);
            /* falls through */
        case 'second':
            this.milliseconds(0);
        }

        // weeks are a special case
        if (units === 'week') {
            this.weekday(0);
        }
        if (units === 'isoWeek') {
            this.isoWeekday(1);
        }

        // quarters are also special
        if (units === 'quarter') {
            this.month(Math.floor(this.month() / 3) * 3);
        }

        return this;
    }

    function endOf (units) {
        units = normalizeUnits(units);
        if (units === undefined || units === 'millisecond') {
            return this;
        }
        return this.startOf(units).add(1, (units === 'isoWeek' ? 'week' : units)).subtract(1, 'ms');
    }

    function to_type__valueOf () {
        return +this._d - ((this._offset || 0) * 60000);
    }

    function unix () {
        return Math.floor(+this / 1000);
    }

    function toDate () {
        return this._offset ? new Date(+this) : this._d;
    }

    function toArray () {
        var m = this;
        return [m.year(), m.month(), m.date(), m.hour(), m.minute(), m.second(), m.millisecond()];
    }

    function toObject () {
        var m = this;
        return {
            years: m.year(),
            months: m.month(),
            date: m.date(),
            hours: m.hours(),
            minutes: m.minutes(),
            seconds: m.seconds(),
            milliseconds: m.milliseconds()
        };
    }

    function moment_valid__isValid () {
        return valid__isValid(this);
    }

    function parsingFlags () {
        return extend({}, getParsingFlags(this));
    }

    function invalidAt () {
        return getParsingFlags(this).overflow;
    }

    addFormatToken(0, ['gg', 2], 0, function () {
        return this.weekYear() % 100;
    });

    addFormatToken(0, ['GG', 2], 0, function () {
        return this.isoWeekYear() % 100;
    });

    function addWeekYearFormatToken (token, getter) {
        addFormatToken(0, [token, token.length], 0, getter);
    }

    addWeekYearFormatToken('gggg',     'weekYear');
    addWeekYearFormatToken('ggggg',    'weekYear');
    addWeekYearFormatToken('GGGG',  'isoWeekYear');
    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

    // ALIASES

    addUnitAlias('weekYear', 'gg');
    addUnitAlias('isoWeekYear', 'GG');

    // PARSING

    addRegexToken('G',      matchSigned);
    addRegexToken('g',      matchSigned);
    addRegexToken('GG',     match1to2, match2);
    addRegexToken('gg',     match1to2, match2);
    addRegexToken('GGGG',   match1to4, match4);
    addRegexToken('gggg',   match1to4, match4);
    addRegexToken('GGGGG',  match1to6, match6);
    addRegexToken('ggggg',  match1to6, match6);

    addWeekParseToken(['gggg', 'ggggg', 'GGGG', 'GGGGG'], function (input, week, config, token) {
        week[token.substr(0, 2)] = toInt(input);
    });

    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
        week[token] = utils_hooks__hooks.parseTwoDigitYear(input);
    });

    // HELPERS

    function weeksInYear(year, dow, doy) {
        return weekOfYear(local__createLocal([year, 11, 31 + dow - doy]), dow, doy).week;
    }

    // MOMENTS

    function getSetWeekYear (input) {
        var year = weekOfYear(this, this.localeData()._week.dow, this.localeData()._week.doy).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getSetISOWeekYear (input) {
        var year = weekOfYear(this, 1, 4).year;
        return input == null ? year : this.add((input - year), 'y');
    }

    function getISOWeeksInYear () {
        return weeksInYear(this.year(), 1, 4);
    }

    function getWeeksInYear () {
        var weekInfo = this.localeData()._week;
        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
    }

    addFormatToken('Q', 0, 0, 'quarter');

    // ALIASES

    addUnitAlias('quarter', 'Q');

    // PARSING

    addRegexToken('Q', match1);
    addParseToken('Q', function (input, array) {
        array[MONTH] = (toInt(input) - 1) * 3;
    });

    // MOMENTS

    function getSetQuarter (input) {
        return input == null ? Math.ceil((this.month() + 1) / 3) : this.month((input - 1) * 3 + this.month() % 3);
    }

    addFormatToken('D', ['DD', 2], 'Do', 'date');

    // ALIASES

    addUnitAlias('date', 'D');

    // PARSING

    addRegexToken('D',  match1to2);
    addRegexToken('DD', match1to2, match2);
    addRegexToken('Do', function (isStrict, locale) {
        return isStrict ? locale._ordinalParse : locale._ordinalParseLenient;
    });

    addParseToken(['D', 'DD'], DATE);
    addParseToken('Do', function (input, array) {
        array[DATE] = toInt(input.match(match1to2)[0], 10);
    });

    // MOMENTS

    var getSetDayOfMonth = makeGetSet('Date', true);

    addFormatToken('d', 0, 'do', 'day');

    addFormatToken('dd', 0, 0, function (format) {
        return this.localeData().weekdaysMin(this, format);
    });

    addFormatToken('ddd', 0, 0, function (format) {
        return this.localeData().weekdaysShort(this, format);
    });

    addFormatToken('dddd', 0, 0, function (format) {
        return this.localeData().weekdays(this, format);
    });

    addFormatToken('e', 0, 0, 'weekday');
    addFormatToken('E', 0, 0, 'isoWeekday');

    // ALIASES

    addUnitAlias('day', 'd');
    addUnitAlias('weekday', 'e');
    addUnitAlias('isoWeekday', 'E');

    // PARSING

    addRegexToken('d',    match1to2);
    addRegexToken('e',    match1to2);
    addRegexToken('E',    match1to2);
    addRegexToken('dd',   matchWord);
    addRegexToken('ddd',  matchWord);
    addRegexToken('dddd', matchWord);

    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config) {
        var weekday = config._locale.weekdaysParse(input);
        // if we didn't get a weekday name, mark the date as invalid
        if (weekday != null) {
            week.d = weekday;
        } else {
            getParsingFlags(config).invalidWeekday = input;
        }
    });

    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
        week[token] = toInt(input);
    });

    // HELPERS

    function parseWeekday(input, locale) {
        if (typeof input !== 'string') {
            return input;
        }

        if (!isNaN(input)) {
            return parseInt(input, 10);
        }

        input = locale.weekdaysParse(input);
        if (typeof input === 'number') {
            return input;
        }

        return null;
    }

    // LOCALES

    var defaultLocaleWeekdays = 'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_');
    function localeWeekdays (m) {
        return this._weekdays[m.day()];
    }

    var defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_');
    function localeWeekdaysShort (m) {
        return this._weekdaysShort[m.day()];
    }

    var defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_');
    function localeWeekdaysMin (m) {
        return this._weekdaysMin[m.day()];
    }

    function localeWeekdaysParse (weekdayName) {
        var i, mom, regex;

        this._weekdaysParse = this._weekdaysParse || [];

        for (i = 0; i < 7; i++) {
            // make the regex if we don't have it already
            if (!this._weekdaysParse[i]) {
                mom = local__createLocal([2000, 1]).day(i);
                regex = '^' + this.weekdays(mom, '') + '|^' + this.weekdaysShort(mom, '') + '|^' + this.weekdaysMin(mom, '');
                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
            }
            // test the regex
            if (this._weekdaysParse[i].test(weekdayName)) {
                return i;
            }
        }
    }

    // MOMENTS

    function getSetDayOfWeek (input) {
        var day = this._isUTC ? this._d.getUTCDay() : this._d.getDay();
        if (input != null) {
            input = parseWeekday(input, this.localeData());
            return this.add(input - day, 'd');
        } else {
            return day;
        }
    }

    function getSetLocaleDayOfWeek (input) {
        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
        return input == null ? weekday : this.add(input - weekday, 'd');
    }

    function getSetISODayOfWeek (input) {
        // behaves the same as moment#day except
        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
        // as a setter, sunday should belong to the previous week.
        return input == null ? this.day() || 7 : this.day(this.day() % 7 ? input : input - 7);
    }

    addFormatToken('H', ['HH', 2], 0, 'hour');
    addFormatToken('h', ['hh', 2], 0, function () {
        return this.hours() % 12 || 12;
    });

    function meridiem (token, lowercase) {
        addFormatToken(token, 0, 0, function () {
            return this.localeData().meridiem(this.hours(), this.minutes(), lowercase);
        });
    }

    meridiem('a', true);
    meridiem('A', false);

    // ALIASES

    addUnitAlias('hour', 'h');

    // PARSING

    function matchMeridiem (isStrict, locale) {
        return locale._meridiemParse;
    }

    addRegexToken('a',  matchMeridiem);
    addRegexToken('A',  matchMeridiem);
    addRegexToken('H',  match1to2);
    addRegexToken('h',  match1to2);
    addRegexToken('HH', match1to2, match2);
    addRegexToken('hh', match1to2, match2);

    addParseToken(['H', 'HH'], HOUR);
    addParseToken(['a', 'A'], function (input, array, config) {
        config._isPm = config._locale.isPM(input);
        config._meridiem = input;
    });
    addParseToken(['h', 'hh'], function (input, array, config) {
        array[HOUR] = toInt(input);
        getParsingFlags(config).bigHour = true;
    });

    // LOCALES

    function localeIsPM (input) {
        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
        // Using charAt should be more compatible.
        return ((input + '').toLowerCase().charAt(0) === 'p');
    }

    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i;
    function localeMeridiem (hours, minutes, isLower) {
        if (hours > 11) {
            return isLower ? 'pm' : 'PM';
        } else {
            return isLower ? 'am' : 'AM';
        }
    }


    // MOMENTS

    // Setting the hour should keep the time, because the user explicitly
    // specified which hour he wants. So trying to maintain the same hour (in
    // a new timezone) makes sense. Adding/subtracting hours does not follow
    // this rule.
    var getSetHour = makeGetSet('Hours', true);

    addFormatToken('m', ['mm', 2], 0, 'minute');

    // ALIASES

    addUnitAlias('minute', 'm');

    // PARSING

    addRegexToken('m',  match1to2);
    addRegexToken('mm', match1to2, match2);
    addParseToken(['m', 'mm'], MINUTE);

    // MOMENTS

    var getSetMinute = makeGetSet('Minutes', false);

    addFormatToken('s', ['ss', 2], 0, 'second');

    // ALIASES

    addUnitAlias('second', 's');

    // PARSING

    addRegexToken('s',  match1to2);
    addRegexToken('ss', match1to2, match2);
    addParseToken(['s', 'ss'], SECOND);

    // MOMENTS

    var getSetSecond = makeGetSet('Seconds', false);

    addFormatToken('S', 0, 0, function () {
        return ~~(this.millisecond() / 100);
    });

    addFormatToken(0, ['SS', 2], 0, function () {
        return ~~(this.millisecond() / 10);
    });

    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
    addFormatToken(0, ['SSSS', 4], 0, function () {
        return this.millisecond() * 10;
    });
    addFormatToken(0, ['SSSSS', 5], 0, function () {
        return this.millisecond() * 100;
    });
    addFormatToken(0, ['SSSSSS', 6], 0, function () {
        return this.millisecond() * 1000;
    });
    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
        return this.millisecond() * 10000;
    });
    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
        return this.millisecond() * 100000;
    });
    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
        return this.millisecond() * 1000000;
    });


    // ALIASES

    addUnitAlias('millisecond', 'ms');

    // PARSING

    addRegexToken('S',    match1to3, match1);
    addRegexToken('SS',   match1to3, match2);
    addRegexToken('SSS',  match1to3, match3);

    var token;
    for (token = 'SSSS'; token.length <= 9; token += 'S') {
        addRegexToken(token, matchUnsigned);
    }

    function parseMs(input, array) {
        array[MILLISECOND] = toInt(('0.' + input) * 1000);
    }

    for (token = 'S'; token.length <= 9; token += 'S') {
        addParseToken(token, parseMs);
    }
    // MOMENTS

    var getSetMillisecond = makeGetSet('Milliseconds', false);

    addFormatToken('z',  0, 0, 'zoneAbbr');
    addFormatToken('zz', 0, 0, 'zoneName');

    // MOMENTS

    function getZoneAbbr () {
        return this._isUTC ? 'UTC' : '';
    }

    function getZoneName () {
        return this._isUTC ? 'Coordinated Universal Time' : '';
    }

    var momentPrototype__proto = Moment.prototype;

    momentPrototype__proto.add          = add_subtract__add;
    momentPrototype__proto.calendar     = moment_calendar__calendar;
    momentPrototype__proto.clone        = clone;
    momentPrototype__proto.diff         = diff;
    momentPrototype__proto.endOf        = endOf;
    momentPrototype__proto.format       = format;
    momentPrototype__proto.from         = from;
    momentPrototype__proto.fromNow      = fromNow;
    momentPrototype__proto.to           = to;
    momentPrototype__proto.toNow        = toNow;
    momentPrototype__proto.get          = getSet;
    momentPrototype__proto.invalidAt    = invalidAt;
    momentPrototype__proto.isAfter      = isAfter;
    momentPrototype__proto.isBefore     = isBefore;
    momentPrototype__proto.isBetween    = isBetween;
    momentPrototype__proto.isSame       = isSame;
    momentPrototype__proto.isValid      = moment_valid__isValid;
    momentPrototype__proto.lang         = lang;
    momentPrototype__proto.locale       = locale;
    momentPrototype__proto.localeData   = localeData;
    momentPrototype__proto.max          = prototypeMax;
    momentPrototype__proto.min          = prototypeMin;
    momentPrototype__proto.parsingFlags = parsingFlags;
    momentPrototype__proto.set          = getSet;
    momentPrototype__proto.startOf      = startOf;
    momentPrototype__proto.subtract     = add_subtract__subtract;
    momentPrototype__proto.toArray      = toArray;
    momentPrototype__proto.toObject     = toObject;
    momentPrototype__proto.toDate       = toDate;
    momentPrototype__proto.toISOString  = moment_format__toISOString;
    momentPrototype__proto.toJSON       = moment_format__toISOString;
    momentPrototype__proto.toString     = toString;
    momentPrototype__proto.unix         = unix;
    momentPrototype__proto.valueOf      = to_type__valueOf;

    // Year
    momentPrototype__proto.year       = getSetYear;
    momentPrototype__proto.isLeapYear = getIsLeapYear;

    // Week Year
    momentPrototype__proto.weekYear    = getSetWeekYear;
    momentPrototype__proto.isoWeekYear = getSetISOWeekYear;

    // Quarter
    momentPrototype__proto.quarter = momentPrototype__proto.quarters = getSetQuarter;

    // Month
    momentPrototype__proto.month       = getSetMonth;
    momentPrototype__proto.daysInMonth = getDaysInMonth;

    // Week
    momentPrototype__proto.week           = momentPrototype__proto.weeks        = getSetWeek;
    momentPrototype__proto.isoWeek        = momentPrototype__proto.isoWeeks     = getSetISOWeek;
    momentPrototype__proto.weeksInYear    = getWeeksInYear;
    momentPrototype__proto.isoWeeksInYear = getISOWeeksInYear;

    // Day
    momentPrototype__proto.date       = getSetDayOfMonth;
    momentPrototype__proto.day        = momentPrototype__proto.days             = getSetDayOfWeek;
    momentPrototype__proto.weekday    = getSetLocaleDayOfWeek;
    momentPrototype__proto.isoWeekday = getSetISODayOfWeek;
    momentPrototype__proto.dayOfYear  = getSetDayOfYear;

    // Hour
    momentPrototype__proto.hour = momentPrototype__proto.hours = getSetHour;

    // Minute
    momentPrototype__proto.minute = momentPrototype__proto.minutes = getSetMinute;

    // Second
    momentPrototype__proto.second = momentPrototype__proto.seconds = getSetSecond;

    // Millisecond
    momentPrototype__proto.millisecond = momentPrototype__proto.milliseconds = getSetMillisecond;

    // Offset
    momentPrototype__proto.utcOffset            = getSetOffset;
    momentPrototype__proto.utc                  = setOffsetToUTC;
    momentPrototype__proto.local                = setOffsetToLocal;
    momentPrototype__proto.parseZone            = setOffsetToParsedOffset;
    momentPrototype__proto.hasAlignedHourOffset = hasAlignedHourOffset;
    momentPrototype__proto.isDST                = isDaylightSavingTime;
    momentPrototype__proto.isDSTShifted         = isDaylightSavingTimeShifted;
    momentPrototype__proto.isLocal              = isLocal;
    momentPrototype__proto.isUtcOffset          = isUtcOffset;
    momentPrototype__proto.isUtc                = isUtc;
    momentPrototype__proto.isUTC                = isUtc;

    // Timezone
    momentPrototype__proto.zoneAbbr = getZoneAbbr;
    momentPrototype__proto.zoneName = getZoneName;

    // Deprecations
    momentPrototype__proto.dates  = deprecate('dates accessor is deprecated. Use date instead.', getSetDayOfMonth);
    momentPrototype__proto.months = deprecate('months accessor is deprecated. Use month instead', getSetMonth);
    momentPrototype__proto.years  = deprecate('years accessor is deprecated. Use year instead', getSetYear);
    momentPrototype__proto.zone   = deprecate('moment().zone is deprecated, use moment().utcOffset instead. https://github.com/moment/moment/issues/1779', getSetZone);

    var momentPrototype = momentPrototype__proto;

    function moment__createUnix (input) {
        return local__createLocal(input * 1000);
    }

    function moment__createInZone () {
        return local__createLocal.apply(null, arguments).parseZone();
    }

    var defaultCalendar = {
        sameDay : '[Today at] LT',
        nextDay : '[Tomorrow at] LT',
        nextWeek : 'dddd [at] LT',
        lastDay : '[Yesterday at] LT',
        lastWeek : '[Last] dddd [at] LT',
        sameElse : 'L'
    };

    function locale_calendar__calendar (key, mom, now) {
        var output = this._calendar[key];
        return typeof output === 'function' ? output.call(mom, now) : output;
    }

    var defaultLongDateFormat = {
        LTS  : 'h:mm:ss A',
        LT   : 'h:mm A',
        L    : 'MM/DD/YYYY',
        LL   : 'MMMM D, YYYY',
        LLL  : 'MMMM D, YYYY h:mm A',
        LLLL : 'dddd, MMMM D, YYYY h:mm A'
    };

    function longDateFormat (key) {
        var format = this._longDateFormat[key],
            formatUpper = this._longDateFormat[key.toUpperCase()];

        if (format || !formatUpper) {
            return format;
        }

        this._longDateFormat[key] = formatUpper.replace(/MMMM|MM|DD|dddd/g, function (val) {
            return val.slice(1);
        });

        return this._longDateFormat[key];
    }

    var defaultInvalidDate = 'Invalid date';

    function invalidDate () {
        return this._invalidDate;
    }

    var defaultOrdinal = '%d';
    var defaultOrdinalParse = /\d{1,2}/;

    function ordinal (number) {
        return this._ordinal.replace('%d', number);
    }

    function preParsePostFormat (string) {
        return string;
    }

    var defaultRelativeTime = {
        future : 'in %s',
        past   : '%s ago',
        s  : 'a few seconds',
        m  : 'a minute',
        mm : '%d minutes',
        h  : 'an hour',
        hh : '%d hours',
        d  : 'a day',
        dd : '%d days',
        M  : 'a month',
        MM : '%d months',
        y  : 'a year',
        yy : '%d years'
    };

    function relative__relativeTime (number, withoutSuffix, string, isFuture) {
        var output = this._relativeTime[string];
        return (typeof output === 'function') ?
            output(number, withoutSuffix, string, isFuture) :
            output.replace(/%d/i, number);
    }

    function pastFuture (diff, output) {
        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
        return typeof format === 'function' ? format(output) : format.replace(/%s/i, output);
    }

    function locale_set__set (config) {
        var prop, i;
        for (i in config) {
            prop = config[i];
            if (typeof prop === 'function') {
                this[i] = prop;
            } else {
                this['_' + i] = prop;
            }
        }
        // Lenient ordinal parsing accepts just a number in addition to
        // number + (possibly) stuff coming from _ordinalParseLenient.
        this._ordinalParseLenient = new RegExp(this._ordinalParse.source + '|' + (/\d{1,2}/).source);
    }

    var prototype__proto = Locale.prototype;

    prototype__proto._calendar       = defaultCalendar;
    prototype__proto.calendar        = locale_calendar__calendar;
    prototype__proto._longDateFormat = defaultLongDateFormat;
    prototype__proto.longDateFormat  = longDateFormat;
    prototype__proto._invalidDate    = defaultInvalidDate;
    prototype__proto.invalidDate     = invalidDate;
    prototype__proto._ordinal        = defaultOrdinal;
    prototype__proto.ordinal         = ordinal;
    prototype__proto._ordinalParse   = defaultOrdinalParse;
    prototype__proto.preparse        = preParsePostFormat;
    prototype__proto.postformat      = preParsePostFormat;
    prototype__proto._relativeTime   = defaultRelativeTime;
    prototype__proto.relativeTime    = relative__relativeTime;
    prototype__proto.pastFuture      = pastFuture;
    prototype__proto.set             = locale_set__set;

    // Month
    prototype__proto.months       =        localeMonths;
    prototype__proto._months      = defaultLocaleMonths;
    prototype__proto.monthsShort  =        localeMonthsShort;
    prototype__proto._monthsShort = defaultLocaleMonthsShort;
    prototype__proto.monthsParse  =        localeMonthsParse;

    // Week
    prototype__proto.week = localeWeek;
    prototype__proto._week = defaultLocaleWeek;
    prototype__proto.firstDayOfYear = localeFirstDayOfYear;
    prototype__proto.firstDayOfWeek = localeFirstDayOfWeek;

    // Day of Week
    prototype__proto.weekdays       =        localeWeekdays;
    prototype__proto._weekdays      = defaultLocaleWeekdays;
    prototype__proto.weekdaysMin    =        localeWeekdaysMin;
    prototype__proto._weekdaysMin   = defaultLocaleWeekdaysMin;
    prototype__proto.weekdaysShort  =        localeWeekdaysShort;
    prototype__proto._weekdaysShort = defaultLocaleWeekdaysShort;
    prototype__proto.weekdaysParse  =        localeWeekdaysParse;

    // Hours
    prototype__proto.isPM = localeIsPM;
    prototype__proto._meridiemParse = defaultLocaleMeridiemParse;
    prototype__proto.meridiem = localeMeridiem;

    function lists__get (format, index, field, setter) {
        var locale = locale_locales__getLocale();
        var utc = create_utc__createUTC().set(setter, index);
        return locale[field](utc, format);
    }

    function list (format, index, field, count, setter) {
        if (typeof format === 'number') {
            index = format;
            format = undefined;
        }

        format = format || '';

        if (index != null) {
            return lists__get(format, index, field, setter);
        }

        var i;
        var out = [];
        for (i = 0; i < count; i++) {
            out[i] = lists__get(format, i, field, setter);
        }
        return out;
    }

    function lists__listMonths (format, index) {
        return list(format, index, 'months', 12, 'month');
    }

    function lists__listMonthsShort (format, index) {
        return list(format, index, 'monthsShort', 12, 'month');
    }

    function lists__listWeekdays (format, index) {
        return list(format, index, 'weekdays', 7, 'day');
    }

    function lists__listWeekdaysShort (format, index) {
        return list(format, index, 'weekdaysShort', 7, 'day');
    }

    function lists__listWeekdaysMin (format, index) {
        return list(format, index, 'weekdaysMin', 7, 'day');
    }

    locale_locales__getSetGlobalLocale('en', {
        ordinalParse: /\d{1,2}(th|st|nd|rd)/,
        ordinal : function (number) {
            var b = number % 10,
                output = (toInt(number % 100 / 10) === 1) ? 'th' :
                (b === 1) ? 'st' :
                (b === 2) ? 'nd' :
                (b === 3) ? 'rd' : 'th';
            return number + output;
        }
    });

    // Side effect imports
    utils_hooks__hooks.lang = deprecate('moment.lang is deprecated. Use moment.locale instead.', locale_locales__getSetGlobalLocale);
    utils_hooks__hooks.langData = deprecate('moment.langData is deprecated. Use moment.localeData instead.', locale_locales__getLocale);

    var mathAbs = Math.abs;

    function duration_abs__abs () {
        var data           = this._data;

        this._milliseconds = mathAbs(this._milliseconds);
        this._days         = mathAbs(this._days);
        this._months       = mathAbs(this._months);

        data.milliseconds  = mathAbs(data.milliseconds);
        data.seconds       = mathAbs(data.seconds);
        data.minutes       = mathAbs(data.minutes);
        data.hours         = mathAbs(data.hours);
        data.months        = mathAbs(data.months);
        data.years         = mathAbs(data.years);

        return this;
    }

    function duration_add_subtract__addSubtract (duration, input, value, direction) {
        var other = create__createDuration(input, value);

        duration._milliseconds += direction * other._milliseconds;
        duration._days         += direction * other._days;
        duration._months       += direction * other._months;

        return duration._bubble();
    }

    // supports only 2.0-style add(1, 's') or add(duration)
    function duration_add_subtract__add (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, 1);
    }

    // supports only 2.0-style subtract(1, 's') or subtract(duration)
    function duration_add_subtract__subtract (input, value) {
        return duration_add_subtract__addSubtract(this, input, value, -1);
    }

    function absCeil (number) {
        if (number < 0) {
            return Math.floor(number);
        } else {
            return Math.ceil(number);
        }
    }

    function bubble () {
        var milliseconds = this._milliseconds;
        var days         = this._days;
        var months       = this._months;
        var data         = this._data;
        var seconds, minutes, hours, years, monthsFromDays;

        // if we have a mix of positive and negative values, bubble down first
        // check: https://github.com/moment/moment/issues/2166
        if (!((milliseconds >= 0 && days >= 0 && months >= 0) ||
                (milliseconds <= 0 && days <= 0 && months <= 0))) {
            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
            days = 0;
            months = 0;
        }

        // The following code bubbles up values, see the tests for
        // examples of what that means.
        data.milliseconds = milliseconds % 1000;

        seconds           = absFloor(milliseconds / 1000);
        data.seconds      = seconds % 60;

        minutes           = absFloor(seconds / 60);
        data.minutes      = minutes % 60;

        hours             = absFloor(minutes / 60);
        data.hours        = hours % 24;

        days += absFloor(hours / 24);

        // convert days to months
        monthsFromDays = absFloor(daysToMonths(days));
        months += monthsFromDays;
        days -= absCeil(monthsToDays(monthsFromDays));

        // 12 months -> 1 year
        years = absFloor(months / 12);
        months %= 12;

        data.days   = days;
        data.months = months;
        data.years  = years;

        return this;
    }

    function daysToMonths (days) {
        // 400 years have 146097 days (taking into account leap year rules)
        // 400 years have 12 months === 4800
        return days * 4800 / 146097;
    }

    function monthsToDays (months) {
        // the reverse of daysToMonths
        return months * 146097 / 4800;
    }

    function as (units) {
        var days;
        var months;
        var milliseconds = this._milliseconds;

        units = normalizeUnits(units);

        if (units === 'month' || units === 'year') {
            days   = this._days   + milliseconds / 864e5;
            months = this._months + daysToMonths(days);
            return units === 'month' ? months : months / 12;
        } else {
            // handle milliseconds separately because of floating point math errors (issue #1867)
            days = this._days + Math.round(monthsToDays(this._months));
            switch (units) {
                case 'week'   : return days / 7     + milliseconds / 6048e5;
                case 'day'    : return days         + milliseconds / 864e5;
                case 'hour'   : return days * 24    + milliseconds / 36e5;
                case 'minute' : return days * 1440  + milliseconds / 6e4;
                case 'second' : return days * 86400 + milliseconds / 1000;
                // Math.floor prevents floating point math errors here
                case 'millisecond': return Math.floor(days * 864e5) + milliseconds;
                default: throw new Error('Unknown unit ' + units);
            }
        }
    }

    // TODO: Use this.as('ms')?
    function duration_as__valueOf () {
        return (
            this._milliseconds +
            this._days * 864e5 +
            (this._months % 12) * 2592e6 +
            toInt(this._months / 12) * 31536e6
        );
    }

    function makeAs (alias) {
        return function () {
            return this.as(alias);
        };
    }

    var asMilliseconds = makeAs('ms');
    var asSeconds      = makeAs('s');
    var asMinutes      = makeAs('m');
    var asHours        = makeAs('h');
    var asDays         = makeAs('d');
    var asWeeks        = makeAs('w');
    var asMonths       = makeAs('M');
    var asYears        = makeAs('y');

    function duration_get__get (units) {
        units = normalizeUnits(units);
        return this[units + 's']();
    }

    function makeGetter(name) {
        return function () {
            return this._data[name];
        };
    }

    var milliseconds = makeGetter('milliseconds');
    var seconds      = makeGetter('seconds');
    var minutes      = makeGetter('minutes');
    var hours        = makeGetter('hours');
    var days         = makeGetter('days');
    var months       = makeGetter('months');
    var years        = makeGetter('years');

    function weeks () {
        return absFloor(this.days() / 7);
    }

    var round = Math.round;
    var thresholds = {
        s: 45,  // seconds to minute
        m: 45,  // minutes to hour
        h: 22,  // hours to day
        d: 26,  // days to month
        M: 11   // months to year
    };

    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
    }

    function duration_humanize__relativeTime (posNegDuration, withoutSuffix, locale) {
        var duration = create__createDuration(posNegDuration).abs();
        var seconds  = round(duration.as('s'));
        var minutes  = round(duration.as('m'));
        var hours    = round(duration.as('h'));
        var days     = round(duration.as('d'));
        var months   = round(duration.as('M'));
        var years    = round(duration.as('y'));

        var a = seconds < thresholds.s && ['s', seconds]  ||
                minutes === 1          && ['m']           ||
                minutes < thresholds.m && ['mm', minutes] ||
                hours   === 1          && ['h']           ||
                hours   < thresholds.h && ['hh', hours]   ||
                days    === 1          && ['d']           ||
                days    < thresholds.d && ['dd', days]    ||
                months  === 1          && ['M']           ||
                months  < thresholds.M && ['MM', months]  ||
                years   === 1          && ['y']           || ['yy', years];

        a[2] = withoutSuffix;
        a[3] = +posNegDuration > 0;
        a[4] = locale;
        return substituteTimeAgo.apply(null, a);
    }

    // This function allows you to set a threshold for relative time strings
    function duration_humanize__getSetRelativeTimeThreshold (threshold, limit) {
        if (thresholds[threshold] === undefined) {
            return false;
        }
        if (limit === undefined) {
            return thresholds[threshold];
        }
        thresholds[threshold] = limit;
        return true;
    }

    function humanize (withSuffix) {
        var locale = this.localeData();
        var output = duration_humanize__relativeTime(this, !withSuffix, locale);

        if (withSuffix) {
            output = locale.pastFuture(+this, output);
        }

        return locale.postformat(output);
    }

    var iso_string__abs = Math.abs;

    function iso_string__toISOString() {
        // for ISO strings we do not use the normal bubbling rules:
        //  * milliseconds bubble up until they become hours
        //  * days do not bubble at all
        //  * months bubble up until they become years
        // This is because there is no context-free conversion between hours and days
        // (think of clock changes)
        // and also not between days and months (28-31 days per month)
        var seconds = iso_string__abs(this._milliseconds) / 1000;
        var days         = iso_string__abs(this._days);
        var months       = iso_string__abs(this._months);
        var minutes, hours, years;

        // 3600 seconds -> 60 minutes -> 1 hour
        minutes           = absFloor(seconds / 60);
        hours             = absFloor(minutes / 60);
        seconds %= 60;
        minutes %= 60;

        // 12 months -> 1 year
        years  = absFloor(months / 12);
        months %= 12;


        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
        var Y = years;
        var M = months;
        var D = days;
        var h = hours;
        var m = minutes;
        var s = seconds;
        var total = this.asSeconds();

        if (!total) {
            // this is the same as C#'s (Noda) and python (isodate)...
            // but not other JS (goog.date)
            return 'P0D';
        }

        return (total < 0 ? '-' : '') +
            'P' +
            (Y ? Y + 'Y' : '') +
            (M ? M + 'M' : '') +
            (D ? D + 'D' : '') +
            ((h || m || s) ? 'T' : '') +
            (h ? h + 'H' : '') +
            (m ? m + 'M' : '') +
            (s ? s + 'S' : '');
    }

    var duration_prototype__proto = Duration.prototype;

    duration_prototype__proto.abs            = duration_abs__abs;
    duration_prototype__proto.add            = duration_add_subtract__add;
    duration_prototype__proto.subtract       = duration_add_subtract__subtract;
    duration_prototype__proto.as             = as;
    duration_prototype__proto.asMilliseconds = asMilliseconds;
    duration_prototype__proto.asSeconds      = asSeconds;
    duration_prototype__proto.asMinutes      = asMinutes;
    duration_prototype__proto.asHours        = asHours;
    duration_prototype__proto.asDays         = asDays;
    duration_prototype__proto.asWeeks        = asWeeks;
    duration_prototype__proto.asMonths       = asMonths;
    duration_prototype__proto.asYears        = asYears;
    duration_prototype__proto.valueOf        = duration_as__valueOf;
    duration_prototype__proto._bubble        = bubble;
    duration_prototype__proto.get            = duration_get__get;
    duration_prototype__proto.milliseconds   = milliseconds;
    duration_prototype__proto.seconds        = seconds;
    duration_prototype__proto.minutes        = minutes;
    duration_prototype__proto.hours          = hours;
    duration_prototype__proto.days           = days;
    duration_prototype__proto.weeks          = weeks;
    duration_prototype__proto.months         = months;
    duration_prototype__proto.years          = years;
    duration_prototype__proto.humanize       = humanize;
    duration_prototype__proto.toISOString    = iso_string__toISOString;
    duration_prototype__proto.toString       = iso_string__toISOString;
    duration_prototype__proto.toJSON         = iso_string__toISOString;
    duration_prototype__proto.locale         = locale;
    duration_prototype__proto.localeData     = localeData;

    // Deprecations
    duration_prototype__proto.toIsoString = deprecate('toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)', iso_string__toISOString);
    duration_prototype__proto.lang = lang;

    // Side effect imports

    addFormatToken('X', 0, 0, 'unix');
    addFormatToken('x', 0, 0, 'valueOf');

    // PARSING

    addRegexToken('x', matchSigned);
    addRegexToken('X', matchTimestamp);
    addParseToken('X', function (input, array, config) {
        config._d = new Date(parseFloat(input, 10) * 1000);
    });
    addParseToken('x', function (input, array, config) {
        config._d = new Date(toInt(input));
    });

    // Side effect imports


    utils_hooks__hooks.version = '2.10.6';

    setHookCallback(local__createLocal);

    utils_hooks__hooks.fn                    = momentPrototype;
    utils_hooks__hooks.min                   = min;
    utils_hooks__hooks.max                   = max;
    utils_hooks__hooks.utc                   = create_utc__createUTC;
    utils_hooks__hooks.unix                  = moment__createUnix;
    utils_hooks__hooks.months                = lists__listMonths;
    utils_hooks__hooks.isDate                = isDate;
    utils_hooks__hooks.locale                = locale_locales__getSetGlobalLocale;
    utils_hooks__hooks.invalid               = valid__createInvalid;
    utils_hooks__hooks.duration              = create__createDuration;
    utils_hooks__hooks.isMoment              = isMoment;
    utils_hooks__hooks.weekdays              = lists__listWeekdays;
    utils_hooks__hooks.parseZone             = moment__createInZone;
    utils_hooks__hooks.localeData            = locale_locales__getLocale;
    utils_hooks__hooks.isDuration            = isDuration;
    utils_hooks__hooks.monthsShort           = lists__listMonthsShort;
    utils_hooks__hooks.weekdaysMin           = lists__listWeekdaysMin;
    utils_hooks__hooks.defineLocale          = defineLocale;
    utils_hooks__hooks.weekdaysShort         = lists__listWeekdaysShort;
    utils_hooks__hooks.normalizeUnits        = normalizeUnits;
    utils_hooks__hooks.relativeTimeThreshold = duration_humanize__getSetRelativeTimeThreshold;

    var _moment = utils_hooks__hooks;

    return _moment;

}));
},{}],"/Users/iuriikozuliak/Projects/buckets/node_modules/speakingurl/index.js":[function(require,module,exports){
module.exports = require('./lib/');

},{"./lib/":"/Users/iuriikozuliak/Projects/buckets/node_modules/speakingurl/lib/index.js"}],"/Users/iuriikozuliak/Projects/buckets/node_modules/speakingurl/lib/index.js":[function(require,module,exports){
(function() {
    'use strict';

    /**
     * getSlug
     * @param   {string} input input string
     * @param   {object|string} opts config object or separator string/char
     * @api     public
     * @return  {string}  sluggified string
     */
    var getSlug = function getSlug(input, opts) {

        var maintainCase = (typeof opts === 'object' && opts.maintainCase) || false;
        var titleCase = (typeof opts === 'object' && opts.titleCase) ? opts.titleCase : false;
        var customReplacements = (typeof opts === 'object' && typeof opts.custom === 'object' && opts.custom) ? opts.custom : {};
        var separator = (typeof opts === 'object' && opts.separator) || '-';
        var truncate = (typeof opts === 'object' && +opts.truncate > 1 && opts.truncate) || false;
        var uricFlag = (typeof opts === 'object' && opts.uric) || false;
        var uricNoSlashFlag = (typeof opts === 'object' && opts.uricNoSlash) || false;
        var markFlag = (typeof opts === 'object' && opts.mark) || false;
        var symbol = (typeof opts === 'object' && opts.lang && symbolMap[opts.lang]) ?
            symbolMap[opts.lang] :
            (typeof opts === 'object' && (opts.lang === false || opts.lang === true) ? {} : symbolMap.en);
        var langChar = (typeof opts === 'object' && opts.lang && langCharMap[opts.lang]) ?
            langCharMap[opts.lang] :
            (typeof opts === 'object' && (opts.lang === false || opts.lang === true) ? {} : langCharMap.en);
        var uricChars = [';', '?', ':', '@', '&', '=', '+', '$', ',', '/'];
        var uricNoSlashChars = [';', '?', ':', '@', '&', '=', '+', '$', ','];
        var markChars = ['.', '!', '~', '*', '\'', '(', ')'];
        var result = '';
        var lucky;
        var allowedChars = separator;
        var i;
        var ch;
        var l;
        var lastCharWasSymbol;

        if (titleCase && typeof titleCase.length === "number" && Array.prototype.toString.call(titleCase)) {

            // custom config is an Array, rewrite to object format
            titleCase.forEach(function(v) {
                customReplacements[v + ""] = v + "";
            });
        }

        if (typeof input !== 'string') {
            return '';
        }

        if (typeof opts === 'string') {
            separator = opts;
        } else if (typeof opts === 'object') {

            if (uricFlag) {
                allowedChars += uricChars.join('');
            }

            if (uricNoSlashFlag) {
                allowedChars += uricNoSlashChars.join('');
            }

            if (markFlag) {
                allowedChars += markChars.join('');
            }
        }

        // custom replacements
        Object.keys(customReplacements).forEach(function(v) {

            var r;

            if (v.length > 1) {
                r = new RegExp('\\b' + escapeChars(v) + '\\b', 'gi');
            } else {
                r = new RegExp(escapeChars(v), 'gi');
            }

            input = input.replace(r, customReplacements[v]);
        });

        if (titleCase) {

            input = input.replace(/(\w)(\S*)/g, function(_, i, r) {
                var j = i.toUpperCase() + (r !== null ? r : "");
                return (Object.keys(customReplacements).indexOf(j.toLowerCase()) < 0) ? j : j.toLowerCase();
            });
        }

        // escape all necessary chars
        allowedChars = escapeChars(allowedChars);

        // trim whitespaces
        input = input.replace(/(^\s+|\s+$)/g, '');

        lastCharWasSymbol = false;
        for (i = 0, l = input.length; i < l; i++) {

            ch = input[i];

            if (langChar[ch]) {

                // process language specific diactrics chars conversion
                ch = lastCharWasSymbol && langChar[ch].match(/[A-Za-z0-9]/) ? ' ' + langChar[ch] : langChar[ch];

                lastCharWasSymbol = false;
            } else if (ch in charMap) {
                // process diactrics chars
                ch = lastCharWasSymbol && charMap[ch].match(/[A-Za-z0-9]/) ? ' ' + charMap[ch] : charMap[ch];

                lastCharWasSymbol = false;
            } else if (

                // process symbol chars
                symbol[ch] && !(uricFlag && uricChars.join('')
                    .indexOf(ch) !== -1) && !(uricNoSlashFlag && uricNoSlashChars.join('')
                    .indexOf(ch) !== -1) && !(markFlag && markChars.join('')
                    .indexOf(ch) !== -1)) {

                ch = lastCharWasSymbol || result.substr(-1).match(/[A-Za-z0-9]/) ? separator + symbol[ch] : symbol[ch];
                ch += input[i + 1] !== void 0 && input[i + 1].match(/[A-Za-z0-9]/) ? separator : '';

                lastCharWasSymbol = true;
            } else {

                // process latin chars
                if (lastCharWasSymbol && (/[A-Za-z0-9]/.test(ch) || result.substr(-1).match(/A-Za-z0-9]/))) {

                    ch = ' ' + ch;
                }
                lastCharWasSymbol = false;
            }

            // add allowed chars
            result += ch.replace(new RegExp('[^\\w\\s' + allowedChars + '_-]', 'g'), separator);
        }

        // eliminate duplicate separators
        // add separator
        // trim separators from start and end
        result = result.replace(/\s+/g, separator)
            .replace(new RegExp('\\' + separator + '+', 'g'), separator)
            .replace(new RegExp('(^\\' + separator + '+|\\' + separator + '+$)', 'g'), '');

        if (truncate && result.length > truncate) {

            lucky = result.charAt(truncate) === separator;
            result = result.slice(0, truncate);

            if (!lucky) {
                result = result.slice(0, result.lastIndexOf(separator));
            }
        }

        if (!maintainCase && !titleCase && !titleCase.length) {
            result = result.toLowerCase();
        }

        return result;
    };

    /**
     * createSlug curried(opts)(input)
     * @param   {object|string} opts config object or input string
     * @return  {Function} function getSlugWithConfig()
     **/
    var createSlug = function createSlug(opts) {

        /**
         * getSlugWithConfig
         * @param   {string} input string
         * @return  {string} slug string
         */
        return function getSlugWithConfig(input) {
            return getSlug(input, opts);
        };
    };

    var escapeChars = function escapeChars(input) {
        return input.replace(/[-\\^$*+?.()|[\]{}\/]/g, '\\$&');
    };

    /**
     * charMap
     * @type {Object}
     */
    var charMap = {

        // latin
        'À': 'A',
        'Á': 'A',
        'Â': 'A',
        'Ã': 'A',
        'Ä': 'Ae',
        'Å': 'A',
        'Æ': 'AE',
        'Ç': 'C',
        'È': 'E',
        'É': 'E',
        'Ê': 'E',
        'Ë': 'E',
        'Ì': 'I',
        'Í': 'I',
        'Î': 'I',
        'Ï': 'I',
        'Ð': 'D',
        'Ñ': 'N',
        'Ò': 'O',
        'Ó': 'O',
        'Ô': 'O',
        'Õ': 'O',
        'Ö': 'Oe',
        'Ő': 'O',
        'Ø': 'O',
        'Ù': 'U',
        'Ú': 'U',
        'Û': 'U',
        'Ü': 'Ue',
        'Ű': 'U',
        'Ý': 'Y',
        'Þ': 'TH',
        'ß': 'ss',
        'à': 'a',
        'á': 'a',
        'â': 'a',
        'ã': 'a',
        'ä': 'ae',
        'å': 'a',
        'æ': 'ae',
        'ç': 'c',
        'è': 'e',
        'é': 'e',
        'ê': 'e',
        'ë': 'e',
        'ì': 'i',
        'í': 'i',
        'î': 'i',
        'ï': 'i',
        'ð': 'd',
        'ñ': 'n',
        'ò': 'o',
        'ó': 'o',
        'ô': 'o',
        'õ': 'o',
        'ö': 'oe',
        'ő': 'o',
        'ø': 'o',
        'ù': 'u',
        'ú': 'u',
        'û': 'u',
        'ü': 'ue',
        'ű': 'u',
        'ý': 'y',
        'þ': 'th',
        'ÿ': 'y',
        'ẞ': 'SS',

        // greek
        'α': 'a',
        'β': 'v',
        'γ': 'g',
        'δ': 'd',
        'ε': 'e',
        'ζ': 'z',
        'η': 'i',
        'θ': 'th',
        'ι': 'i',
        'κ': 'k',
        'λ': 'l',
        'μ': 'm',
        'ν': 'n',
        'ξ': 'ks',
        'ο': 'o',
        'π': 'p',
        'ρ': 'r',
        'σ': 's',
        'τ': 't',
        'υ': 'y',
        'φ': 'f',
        'χ': 'x',
        'ψ': 'ps',
        'ω': 'o',
        'ά': 'a',
        'έ': 'e',
        'ί': 'i',
        'ό': 'o',
        'ύ': 'y',
        'ή': 'i',
        'ώ': 'o',
        'ς': 's',
        'ϊ': 'i',
        'ΰ': 'y',
        'ϋ': 'y',
        'ΐ': 'i',
        'Α': 'A',
        'Β': 'B',
        'Γ': 'G',
        'Δ': 'D',
        'Ε': 'E',
        'Ζ': 'Z',
        'Η': 'I',
        'Θ': 'TH',
        'Ι': 'I',
        'Κ': 'K',
        'Λ': 'L',
        'Μ': 'M',
        'Ν': 'N',
        'Ξ': 'KS',
        'Ο': 'O',
        'Π': 'P',
        'Ρ': 'R',
        'Σ': 'S',
        'Τ': 'T',
        'Υ': 'Y',
        'Φ': 'F',
        'Χ': 'X',
        'Ψ': 'PS',
        'Ω': 'W',
        'Ά': 'A',
        'Έ': 'E',
        'Ί': 'I',
        'Ό': 'O',
        'Ύ': 'Y',
        'Ή': 'I',
        'Ώ': 'O',
        'Ϊ': 'I',
        'Ϋ': 'Y',

        // turkish
        'ş': 's',
        'Ş': 'S',
        'ı': 'i',
        'İ': 'I',
        // 'ç': 'c', // duplicate
        // 'Ç': 'C', // duplicate
        // 'ü': 'ue', // duplicate
        // 'Ü': 'Ue', // duplicate
        // 'ö': 'oe', // duplicate
        // 'Ö': 'Oe', // duplicate
        'ğ': 'g',
        'Ğ': 'G',

        // macedonian
        'Ќ': 'Kj',
        'ќ': 'kj',
        'Љ': 'Lj',
        'љ': 'lj',
        'Њ': 'Nj',
        'њ': 'nj',
        'Тс': 'Ts',
        'тс': 'ts',

        // russian
        'а': 'a',
        'б': 'b',
        'в': 'v',
        'г': 'g',
        'д': 'd',
        'е': 'e',
        'ё': 'yo',
        'ж': 'zh',
        'з': 'z',
        'и': 'i',
        'й': 'j',
        'к': 'k',
        'л': 'l',
        'м': 'm',
        'н': 'n',
        'о': 'o',
        'п': 'p',
        'р': 'r',
        'с': 's',
        'т': 't',
        'у': 'u',
        'ф': 'f',
        'х': 'h',
        'ц': 'c',
        'ч': 'ch',
        'ш': 'sh',
        'щ': 'sh',
        'ъ': '',
        'ы': 'y',
        'ь': '',
        'э': 'e',
        'ю': 'yu',
        'я': 'ya',
        'А': 'A',
        'Б': 'B',
        'В': 'V',
        'Г': 'G',
        'Д': 'D',
        'Е': 'E',
        'Ё': 'Yo',
        'Ж': 'Zh',
        'З': 'Z',
        'И': 'I',
        'Й': 'J',
        'К': 'K',
        'Л': 'L',
        'М': 'M',
        'Н': 'N',
        'О': 'O',
        'П': 'P',
        'Р': 'R',
        'С': 'S',
        'Т': 'T',
        'У': 'U',
        'Ф': 'F',
        'Х': 'H',
        'Ц': 'C',
        'Ч': 'Ch',
        'Ш': 'Sh',
        'Щ': 'Sh',
        'Ъ': '',
        'Ы': 'Y',
        'Ь': '',
        'Э': 'E',
        'Ю': 'Yu',
        'Я': 'Ya',

        // ukranian
        'Є': 'Ye',
        'І': 'I',
        'Ї': 'Yi',
        'Ґ': 'G',
        'є': 'ye',
        'і': 'i',
        'ї': 'yi',
        'ґ': 'g',

        // czech
        'č': 'c',
        'ď': 'd',
        'ě': 'e',
        'ň': 'n',
        'ř': 'r',
        'š': 's',
        'ť': 't',
        'ů': 'u',
        'ž': 'z',
        'Č': 'C',
        'Ď': 'D',
        'Ě': 'E',
        'Ň': 'N',
        'Ř': 'R',
        'Š': 'S',
        'Ť': 'T',
        'Ů': 'U',
        'Ž': 'Z',

        // slovak
        'ľ': 'l',
        'ĺ': 'l',
        'ŕ': 'r',
        'Ľ': 'L',
        'Ĺ': 'L',
        'Ŕ': 'R',

        // polish
        'ą': 'a',
        'ć': 'c',
        'ę': 'e',
        'ł': 'l',
        'ń': 'n',
        // 'ó': 'o', // duplicate
        'ś': 's',
        'ź': 'z',
        'ż': 'z',
        'Ą': 'A',
        'Ć': 'C',
        'Ę': 'E',
        'Ł': 'L',
        'Ń': 'N',
        'Ś': 'S',
        'Ź': 'Z',
        'Ż': 'Z',

        // latvian
        'ā': 'a',
        // 'č': 'c', // duplicate
        'ē': 'e',
        'ģ': 'g',
        'ī': 'i',
        'ķ': 'k',
        'ļ': 'l',
        'ņ': 'n',
        // 'š': 's', // duplicate
        'ū': 'u',
        // 'ž': 'z', // duplicate
        'Ā': 'A',
        // 'Č': 'C', // duplicate
        'Ē': 'E',
        'Ģ': 'G',
        'Ī': 'I',
        'Ķ': 'k',
        'Ļ': 'L',
        'Ņ': 'N',
        // 'Š': 'S', // duplicate
        'Ū': 'U',
        // 'Ž': 'Z', // duplicate

        // Arabic
        'ا': 'a',
        'أ': 'a',
        'إ': 'i',
        'آ': 'aa',
        'ؤ': 'u',
        'ئ': 'e',
        'ء': 'a',
        'ب': 'b',
        'ت': 't',
        'ث': 'th',
        'ج': 'j',
        'ح': 'h',
        'خ': 'kh',
        'د': 'd',
        'ذ': 'th',
        'ر': 'r',
        'ز': 'z',
        'س': 's',
        'ش': 'sh',
        'ص': 's',
        'ض': 'dh',
        'ط': 't',
        'ظ': 'z',
        'ع': 'a',
        'غ': 'gh',
        'ف': 'f',
        'ق': 'q',
        'ك': 'k',
        'ل': 'l',
        'م': 'm',
        'ن': 'n',
        'ه': 'h',
        'و': 'w',
        'ي': 'y',
        'ى': 'a',
        'ة': 'h',
        'ﻻ': 'la',
        'ﻷ': 'laa',
        'ﻹ': 'lai',
        'ﻵ': 'laa',

        // Arabic diactrics
        'َ': 'a',
        'ً': 'an',
        'ِ': 'e',
        'ٍ': 'en',
        'ُ': 'u',
        'ٌ': 'on',
        'ْ': '',

        // Arabic numbers
        '٠': '0',
        '١': '1',
        '٢': '2',
        '٣': '3',
        '٤': '4',
        '٥': '5',
        '٦': '6',
        '٧': '7',
        '٨': '8',
        '٩': '9',

        // symbols
        '“': '"',
        '”': '"',
        '‘': '\'',
        '’': '\'',
        '∂': 'd',
        'ƒ': 'f',
        '™': '(TM)',
        '©': '(C)',
        'œ': 'oe',
        'Œ': 'OE',
        '®': '(R)',
        '†': '+',
        '℠': '(SM)',
        '…': '...',
        '˚': 'o',
        'º': 'o',
        'ª': 'a',
        '•': '*',
        // currency
        '$': 'USD',
        '€': 'EUR',
        '₢': 'BRN',
        '₣': 'FRF',
        '£': 'GBP',
        '₤': 'ITL',
        '₦': 'NGN',
        '₧': 'ESP',
        '₩': 'KRW',
        '₪': 'ILS',
        '₫': 'VND',
        '₭': 'LAK',
        '₮': 'MNT',
        '₯': 'GRD',
        '₱': 'ARS',
        '₲': 'PYG',
        '₳': 'ARA',
        '₴': 'UAH',
        '₵': 'GHS',
        '¢': 'cent',
        '¥': 'CNY',
        '元': 'CNY',
        '円': 'YEN',
        '﷼': 'IRR',
        '₠': 'EWE',
        '฿': 'THB',
        '₨': 'INR',
        '₹': 'INR',
        '₰': 'PF',

        // Vietnamese
        'đ': 'd',
        'Đ': 'D',
        'ẹ': 'e',
        'Ẹ': 'E',
        'ẽ': 'e',
        'Ẽ': 'E',
        'ế': 'e',
        'Ế': 'E',
        'ề': 'e',
        'Ề': 'E',
        'ệ': 'e',
        'Ệ': 'E',
        'ễ': 'e',
        'Ễ': 'E',
        'ọ': 'o',
        'Ọ': 'o',
        'ố': 'o',
        'Ố': 'O',
        'ồ': 'o',
        'Ồ': 'O',
        'ộ': 'o',
        'Ộ': 'O',
        'ỗ': 'o',
        'Ỗ': 'O',
        'ơ': 'o',
        'Ơ': 'O',
        'ớ': 'o',
        'Ớ': 'O',
        'ờ': 'o',
        'Ờ': 'O',
        'ợ': 'o',
        'Ợ': 'O',
        'ỡ': 'o',
        'Ỡ': 'O',
        'ị': 'i',
        'Ị': 'I',
        'ĩ': 'i',
        'Ĩ': 'I',
        'ụ': 'u',
        'Ụ': 'U',
        'ũ': 'u',
        'Ũ': 'U',
        'ư': 'u',
        'Ư': 'U',
        'ứ': 'u',
        'Ứ': 'U',
        'ừ': 'u',
        'Ừ': 'U',
        'ự': 'u',
        'Ự': 'U',
        'ữ': 'u',
        'Ữ': 'U',
        'ỳ': 'y',
        'Ỳ': 'Y',
        'ỵ': 'y',
        'Ỵ': 'Y',
        'ỹ': 'y',
        'Ỹ': 'Y',
        'ạ': 'a',
        'Ạ': 'A',
        'ấ': 'a',
        'Ấ': 'A',
        'ầ': 'a',
        'Ầ': 'A',
        'ậ': 'a',
        'Ậ': 'A',
        'ẫ': 'a',
        'Ẫ': 'A',
        'ă': 'a',
        'Ă': 'A',
        'ắ': 'a',
        'Ắ': 'A',
        'ằ': 'a',
        'Ằ': 'A',
        'ặ': 'a',
        'Ặ': 'A',
        'ẵ': 'a',
        'Ẵ': 'A'
    };

    /**
     * langCharMap language specific characters translations
     * @type   {Object}
     */
    var langCharMap = {
        'en': {}, // default language
        'sk': {
            'ä': 'a',
            'Ä': 'A'
        }
    };

    /**
     * symbolMap language specific symbol translations
     * @type   {Object}
     */
    var symbolMap = {

        'ar': {
            '∆': 'delta',
            '∞': 'la-nihaya',
            '♥': 'hob',
            '&': 'wa',
            '|': 'aw',
            '<': 'aqal-men',
            '>': 'akbar-men',
            '∑': 'majmou',
            '¤': 'omla'
        },

        'cz': {
            '∆': 'delta',
            '∞': 'nekonecno',
            '♥': 'laska',
            '&': 'a',
            '|': 'nebo',
            '<': 'mene jako',
            '>': 'vice jako',
            '∑': 'soucet',
            '¤': 'mena'
        },

        'de': {
            '∆': 'delta',
            '∞': 'unendlich',
            '♥': 'Liebe',
            '&': 'und',
            '|': 'oder',
            '<': 'kleiner als',
            '>': 'groesser als',
            '∑': 'Summe von',
            '¤': 'Waehrung'
        },

        'en': {
            '∆': 'delta',
            '∞': 'infinity',
            '♥': 'love',
            '&': 'and',
            '|': 'or',
            '<': 'less than',
            '>': 'greater than',
            '∑': 'sum',
            '¤': 'currency'
        },

        'es': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amor',
            '&': 'y',
            '|': 'u',
            '<': 'menos que',
            '>': 'mas que',
            '∑': 'suma de los',
            '¤': 'moneda'
        },

        'fr': {
            '∆': 'delta',
            '∞': 'infiniment',
            '♥': 'Amour',
            '&': 'et',
            '|': 'ou',
            '<': 'moins que',
            '>': 'superieure a',
            '∑': 'somme des',
            '¤': 'monnaie'
        },

        'nl': {
            '∆': 'delta',
            '∞': 'oneindig',
            '♥': 'liefde',
            '&': 'en',
            '|': 'of',
            '<': 'kleiner dan',
            '>': 'groter dan',
            '∑': 'som',
            '¤': 'valuta'
        },

        'it': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amore',
            '&': 'e',
            '|': 'o',
            '<': 'minore di',
            '>': 'maggiore di',
            '∑': 'somma',
            '¤': 'moneta'
        },

        'pt': {
            '∆': 'delta',
            '∞': 'infinito',
            '♥': 'amor',
            '&': 'e',
            '|': 'ou',
            '<': 'menor que',
            '>': 'maior que',
            '∑': 'soma',
            '¤': 'moeda'
        },

        'ru': {
            '∆': 'delta',
            '∞': 'beskonechno',
            '♥': 'lubov',
            '&': 'i',
            '|': 'ili',
            '<': 'menshe',
            '>': 'bolshe',
            '∑': 'summa',
            '¤': 'valjuta'
        },

        'sk': {
            '∆': 'delta',
            '∞': 'nekonecno',
            '♥': 'laska',
            '&': 'a',
            '|': 'alebo',
            '<': 'menej ako',
            '>': 'viac ako',
            '∑': 'sucet',
            '¤': 'mena'
        },

        'tr': {
            '∆': 'delta',
            '∞': 'sonsuzluk',
            '♥': 'ask',
            '&': 've',
            '|': 'veya',
            '<': 'kucuktur',
            '>': 'buyuktur',
            '∑': 'toplam',
            '¤': 'para birimi'
        },

        'vn': {
            '∆': 'delta',
            '∞': 'vo cuc',
            '♥': 'yeu',
            '&': 'va',
            '|': 'hoac',
            '<': 'nho hon',
            '>': 'lon hon',
            '∑': 'tong',
            '¤': 'tien te'
        }
    };

    if (typeof module !== 'undefined' && module.exports) {

        // export functions for use in Node
        module.exports = getSlug;
        module.exports.createSlug = createSlug;

    } else if (typeof define !== 'undefined' && define.amd) {

        // export function for use in AMD
        define([], function() {
            return getSlug;
        });

    } else {

        // don't overwrite global if exists
        try {
            if (window.getSlug || window.createSlug) {
                throw 'speakingurl: globals exists /(getSlug|createSlug)/';
            } else {
                window.getSlug = getSlug;
                window.createSlug = createSlug;
            }
        } catch (e) {}

    }
})();

},{}],"client/source/controllers/auth_controller.coffee":[function(require,module,exports){
var AuthController, Controller, LoginView, PasswordReset, ResetPasswordView, User, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

LoginView = require('views/auth/login');

ResetPasswordView = require('views/auth/reset_password');

PasswordReset = require('models/password_reset');

User = require('models/user');

mediator = require('chaplin').mediator;

module.exports = AuthController = (function(superClass) {
  extend(AuthController, superClass);

  function AuthController() {
    return AuthController.__super__.constructor.apply(this, arguments);
  }

  AuthController.prototype.login = function(params) {
    var ref;
    if ((ref = mediator.user) != null ? ref.get('id') : void 0) {
      toastr.info('You’re already logged in.');
      this.redirectTo('buckets#dashboard');
    }
    return this.view = new LoginView({
      next: params.next
    });
  };

  AuthController.prototype.resetPassword = function(params) {
    this.passwordReset = new PasswordReset({
      token: params.token
    });
    return this.passwordReset.fetch().done((function(_this) {
      return function() {
        _this.listenTo(_this.passwordReset, 'sync', function(model, user) {
          mediator.user = new User(user);
          return _this.redirectTo({
            url: '/'
          });
        });
        return _this.view = new ResetPasswordView({
          model: _this.passwordReset
        });
      };
    })(this)).fail((function(_this) {
      return function() {
        toastr.error('Password reset token is invalid or has expired.');
        return _this.redirectTo('buckets#dashboard');
      };
    })(this));
  };

  return AuthController;

})(Controller);



},{"chaplin":"9U5Jgg","lib/controller":"client/source/lib/controller.coffee","models/password_reset":"client/source/models/password_reset.coffee","models/user":"client/source/models/user.coffee","views/auth/login":"client/source/views/auth/login.coffee","views/auth/reset_password":"client/source/views/auth/reset_password.coffee"}],"client/source/controllers/buckets_controller.coffee":[function(require,module,exports){
var Bucket, BucketEditView, Buckets, BucketsController, Controller, DashboardView, Entries, EntriesBrowser, Entry, EntryEditView, Fields, Handlebars, Members, MissingPageView, Users, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Handlebars = require('hbsfy/runtime');

Controller = require('lib/controller');

MissingPageView = require('views/missing');

BucketEditView = require('views/buckets/edit');

DashboardView = require('views/buckets/dashboard');

EntriesBrowser = require('views/entries/browser');

EntryEditView = require('views/entries/edit');

Bucket = require('models/bucket');

Buckets = require('models/buckets');

Fields = require('models/fields');

Entry = require('models/entry');

Entries = require('models/entries');

Members = require('models/members');

Users = require('models/users');

mediator = require('chaplin').mediator;

module.exports = BucketsController = (function(superClass) {
  extend(BucketsController, superClass);

  function BucketsController() {
    return BucketsController.__super__.constructor.apply(this, arguments);
  }

  BucketsController.prototype.dashboard = function() {
    return this.view = new DashboardView;
  };

  BucketsController.prototype.add = function() {
    var newBucket;
    this.adjustTitle('New Bucket');
    newBucket = new Bucket;
    this.newFields = new Fields;
    this.listenToOnce(newBucket, 'sync', (function(_this) {
      return function() {
        toastr.success('Bucket added');
        mediator.buckets.add(newBucket);
        return _this.redirectTo({
          url: "/" + mediator.options.adminSegment + "/buckets/" + (newBucket.get('slug')) + "/settings/fields"
        });
      };
    })(this));
    return this.view = new BucketEditView({
      model: newBucket,
      fields: this.newFields
    });
  };

  BucketsController.prototype.browse = function(params) {
    var bucket, ref;
    bucket = (ref = mediator.buckets) != null ? ref.findWhere({
      slug: params.slug
    }) : void 0;
    if (!bucket) {
      return this.bucketNotFound();
    }
    if (params.add) {
      this.adjustTitle('New ' + bucket.get('singular'));
    } else if (params.entryID) {
      this.adjustTitle('Edit');
    } else {
      this.adjustTitle(bucket.get('name'));
    }
    return this.reuse('BucketBrowser', {
      compose: function(options) {
        this.entries = new Entries;
        return this.entries.fetch({
          data: {
            until: null,
            bucket: bucket.get('slug'),
            status: ''
          },
          processData: true
        }).done((function(_this) {
          return function() {
            _this.view = new EntriesBrowser({
              collection: _this.entries,
              bucket: bucket
            });
            if (options.add) {
              return _this.view.loadNewEntry();
            } else if (options.entryID) {
              return _this.view.loadEntry(options.entryID);
            }
          };
        })(this));
      },
      check: function(options) {
        if (this.view != null) {
          if (options.add) {
            this.view.loadNewEntry();
          } else if (options.entryID) {
            this.view.loadEntry(options.entryID);
          } else {
            this.view.clearEntry();
          }
        }
        return (this.view != null) && this.view.bucket.get('id') === options.bucket.get('id');
      },
      options: {
        entryID: params.entryID,
        bucket: bucket,
        add: params.add
      }
    });
  };

  BucketsController.prototype.settings = function(params) {
    var bucket, ref;
    bucket = (ref = mediator.buckets) != null ? ref.findWhere({
      slug: params.slug
    }) : void 0;
    if (!bucket) {
      return this.bucketNotFound();
    }
    this.listenToOnce(bucket, 'sync', (function(_this) {
      return function(bucket, data) {
        mediator.buckets.fetch({
          reset: true
        });
        if (data != null ? data.slug : void 0) {
          toastr.success('Bucket saved');
          return _this.redirectTo('buckets#browse', {
            slug: data.slug
          });
        } else {
          toastr.success('Bucket deleted');
          return _this.redirectTo('buckets#dashboard');
        }
      };
    })(this));
    this.adjustTitle('Edit ' + bucket.get('name'));
    return this.reuse('BucketSettings', {
      compose: function(options) {
        this.members = new Members({
          bucketId: bucket.get('id')
        });
        this.users = new Users;
        this.fields = new Fields(bucket.get('fields'));
        return $.when(this.members.fetch(), this.users.fetch()).done((function(_this) {
          return function() {
            var ref1;
            _this.view = new BucketEditView({
              model: bucket,
              fields: _this.fields,
              members: _this.members,
              users: _this.users
            });
            if (options.activeTab) {
              return (ref1 = _this.view) != null ? ref1.setActiveTab(options.activeTab) : void 0;
            }
          };
        })(this));
      },
      check: function(options) {
        var ref1;
        if (options.activeTab) {
          if ((ref1 = this.view) != null) {
            ref1.setActiveTab(options.activeTab);
          }
        }
        return this.view != null;
      },
      options: {
        activeTab: params.activeTab
      }
    });
  };

  BucketsController.prototype.bucketNotFound = function() {
    toastr.error('Could not find that bucket.');
    return this.redirectTo('buckets#dashboard');
  };

  BucketsController.prototype.missing = function() {
    return console.log('Page missing!', arguments);
  };

  return BucketsController;

})(Controller);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","lib/controller":"client/source/lib/controller.coffee","models/bucket":"client/source/models/bucket.coffee","models/buckets":"client/source/models/buckets.coffee","models/entries":"client/source/models/entries.coffee","models/entry":"client/source/models/entry.coffee","models/fields":"client/source/models/fields.coffee","models/members":"client/source/models/members.coffee","models/users":"client/source/models/users.coffee","views/buckets/dashboard":"client/source/views/buckets/dashboard.coffee","views/buckets/edit":"client/source/views/buckets/edit.coffee","views/entries/browser":"client/source/views/entries/browser.coffee","views/entries/edit":"client/source/views/entries/edit.coffee","views/missing":"client/source/views/missing.coffee"}],"client/source/controllers/error_controller.coffee":[function(require,module,exports){
var Controller, ErrorController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

module.exports = ErrorController = (function(superClass) {
  extend(ErrorController, superClass);

  function ErrorController() {
    return ErrorController.__super__.constructor.apply(this, arguments);
  }

  ErrorController.prototype.general = function() {
    return console.log('there was a general error');
  };

  return ErrorController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee"}],"client/source/controllers/help_controller.coffee":[function(require,module,exports){
var Controller, HelpController, HelpDocView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

HelpDocView = require('views/help/doc');

module.exports = HelpController = (function(superClass) {
  extend(HelpController, superClass);

  function HelpController() {
    return HelpController.__super__.constructor.apply(this, arguments);
  }

  HelpController.prototype.index = function(params) {
    return this.view = new HelpDocView({
      doc: params.doc
    });
  };

  return HelpController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","views/help/doc":"client/source/views/help/doc.coffee"}],"client/source/controllers/install_controller.coffee":[function(require,module,exports){
var Controller, FirstUserView, Install, InstallController, User, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

Install = require('models/install');

User = require('models/user');

FirstUserView = require('views/install/firstuser');

mediator = require('chaplin').mediator;

module.exports = InstallController = (function(superClass) {
  extend(InstallController, superClass);

  function InstallController() {
    return InstallController.__super__.constructor.apply(this, arguments);
  }

  InstallController.prototype.firstuser = function() {
    var newInstall;
    this.adjustTitle('Install');
    newInstall = new Install;
    this.view = new FirstUserView({
      model: newInstall
    });
    return newInstall.on('sync', (function(_this) {
      return function(model, user) {
        mediator.user = new User(user);
        mediator.options.needsInstall = false;
        return _this.redirectTo({
          url: '/'
        });
      };
    })(this));
  };

  return InstallController;

})(Controller);



},{"chaplin":"9U5Jgg","lib/controller":"client/source/lib/controller.coffee","models/install":"client/source/models/install.coffee","models/user":"client/source/models/user.coffee","views/install/firstuser":"client/source/views/install/firstuser.coffee"}],"client/source/controllers/routes_controller.coffee":[function(require,module,exports){
var Controller, Routes, RoutesController, RoutesList, Templates,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

RoutesList = require('views/routes/list');

Routes = require('models/routes');

Templates = require('models/templates');

module.exports = RoutesController = (function(superClass) {
  extend(RoutesController, superClass);

  function RoutesController() {
    return RoutesController.__super__.constructor.apply(this, arguments);
  }

  RoutesController.prototype.list = function() {
    this.routes = new Routes;
    this.templates = new Templates;
    return $.when(this.routes.fetch(), this.templates.fetch()).done((function(_this) {
      return function() {
        return _this.view = new RoutesList({
          collection: _this.routes,
          templates: _this.templates
        });
      };
    })(this));
  };

  return RoutesController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/routes":"client/source/models/routes.coffee","models/templates":"client/source/models/templates.coffee","views/routes/list":"client/source/views/routes/list.coffee"}],"client/source/controllers/settings_controller.coffee":[function(require,module,exports){
var BasicSettingsView, Controller, SettingsController, User, Users, UsersList,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

User = require('models/user');

Users = require('models/users');

BasicSettingsView = require('views/settings/basic');

UsersList = require('views/users/list');

module.exports = SettingsController = (function(superClass) {
  extend(SettingsController, superClass);

  function SettingsController() {
    return SettingsController.__super__.constructor.apply(this, arguments);
  }

  SettingsController.prototype.basic = function() {
    this.adjustTitle('Settings');
    return this.view = new BasicSettingsView;
  };

  SettingsController.prototype.users = function(params) {
    var ref;
    this.adjustTitle('Users');
    this.reuse('UsersList', {
      compose: function() {
        this.users = new Users;
        return this.users.fetch().done((function(_this) {
          return function() {
            if (params.email) {
              _this.user = _this.users.findWhere({
                email: params.email
              });
            } else {
              _this.user = null;
            }
            return _this.view = new UsersList({
              collection: _this.users,
              model: _this.user
            });
          };
        })(this));
      },
      check: function(options) {
        var ref;
        if (options.email !== ((ref = this.view.model) != null ? ref.get('id') : void 0)) {
          this.view.selectUser(this.users.findWhere({
            email: options.email
          }));
        }
        return this.view != null;
      },
      options: {
        email: params.email
      }
    });
    if ((ref = this.view) != null ? ref.model : void 0) {
      return console.log('MODEL!!!');
    }
  };

  return SettingsController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/user":"client/source/models/user.coffee","models/users":"client/source/models/users.coffee","views/settings/basic":"client/source/views/settings/basic.coffee","views/users/list":"client/source/views/users/list.coffee"}],"client/source/controllers/templates_controller.coffee":[function(require,module,exports){
var BuildFile, BuildFiles, Builds, Controller, TemplateEditor, TemplatesController,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Controller = require('lib/controller');

BuildFiles = require('models/buildfiles');

BuildFile = require('models/buildfile');

Builds = require('models/builds');

TemplateEditor = require('views/templates/editor');

module.exports = TemplatesController = (function(superClass) {
  extend(TemplatesController, superClass);

  function TemplatesController() {
    return TemplatesController.__super__.constructor.apply(this, arguments);
  }

  TemplatesController.prototype.edit = function(params) {
    if (!params.filename) {
      return this.redirectTo('templates#edit', {
        filename: 'index.hbs',
        env: 'staging'
      });
    }
    this.adjustTitle('Design');
    return this.reuse('TemplateEditor', {
      compose: function() {
        this.builds = new Builds;
        this.stagingFiles = new BuildFiles;
        this.liveFiles = new BuildFiles;
        this.liveFiles.build_env = 'live';
        return $.when(this.liveFiles.fetch(), this.stagingFiles.fetch(), this.builds.fetch()).done((function(_this) {
          return function() {
            _this.view = new TemplateEditor({
              stagingFiles: _this.stagingFiles,
              liveFiles: _this.liveFiles,
              builds: _this.builds,
              env: params.env,
              filename: params.filename
            });
            return _this.view.selectTemplate(params.filename, params.env);
          };
        })(this));
      },
      check: function(options) {
        if (options.filename !== this.view.filename || options.env !== this.view.env) {
          this.view.selectTemplate(options.filename, options.env);
        }
        return (this.view != null) && (this.stagingFiles != null) && (this.liveFiles != null) && (this.builds != null);
      },
      options: {
        filename: params.filename,
        env: params.env
      }
    });
  };

  return TemplatesController;

})(Controller);



},{"lib/controller":"client/source/lib/controller.coffee","models/buildfile":"client/source/models/buildfile.coffee","models/buildfiles":"client/source/models/buildfiles.coffee","models/builds":"client/source/models/builds.coffee","views/templates/editor":"client/source/views/templates/editor.coffee"}],"client/source/helpers/forms.coffee":[function(require,module,exports){
var Handlebars, _, createLabel, mediator, tag, wrap;

Handlebars = require('hbsfy/runtime');

_ = require('underscore');

mediator = require('mediator');

createLabel = function(text, name, options) {
  if (options == null) {
    options = {};
  }
  _.defaults(options, {
    className: 'control-label',
    required: false
  });
  if (options.required) {
    text += "<span title=\"This field is required.\" class=\"show-tooltip text-danger\">*</span>";
  }
  return tag('label', {
    "for": "input-" + name,
    className: options.className
  }, text);
};

wrap = function(content, options) {
  if (options == null) {
    options = {};
  }
  _.defaults(options, {
    label: null,
    help: null,
    className: 'form-group',
    name: '',
    required: false
  });
  if (options.label) {
    content = createLabel(options.label, options.name, {
      required: options.required
    }) + content;
  }
  if (options.help) {
    content += tag('p', {
      className: 'help-block'
    }, options.help);
  }
  return tag('div', {
    "class": options.className
  }, content);
};

tag = function(el, attrs, content, options) {
  var html, key, val;
  if (attrs == null) {
    attrs = {};
  }
  if (content == null) {
    content = '';
  }
  if (options == null) {
    options = {};
  }
  html = "<" + el;
  for (key in attrs) {
    val = attrs[key];
    if (key === 'className') {
      key = 'class';
    }
    if ((val != null) && val !== '') {
      html += " " + key + "=\"" + val + "\"";
    }
  }
  html += ">";
  if (content) {
    html += content;
  }
  if (!options.selfClosing) {
    html += "</" + el + ">";
  }
  return new Handlebars.SafeString(html);
};

Handlebars.registerHelper('input', function(name, value, options) {
  var input, params, settings, slug;
  settings = _.defaults(options.hash, {
    className: 'form-control',
    type: 'text',
    required: false
  });
  params = {
    name: name,
    value: value,
    className: settings.className,
    id: settings.id,
    placeholder: settings.placeholder,
    tabindex: 1,
    type: settings.type,
    id: "input-" + name,
    autocomplete: 'off'
  };
  if (settings.size) {
    params.className += " input-" + settings.size;
  }
  if (settings.slugName) {
    params.className += ' has-slug';
    _.extend(params, {
      'data-sluggify': settings.slugName
    });
  }
  input = tag('input', params, false, {
    selfClosing: true
  });
  if (settings.slugName) {
    slug = tag('input', {
      className: 'form-control input-slug input-sm',
      type: 'text',
      name: settings.slugName,
      value: settings.slugValue,
      placeholder: 'slug',
      tabindex: 0
    });
    input += slug += "<a href=\"/admin/help/slugs.md\" class=\"btn btn-link btn-icon btn-icon-small\">" + (Handlebars.helpers.icon('question')) + "</a>";
  }
  return wrap(input, {
    label: settings.label,
    help: settings.help,
    required: settings.required,
    name: params.name
  });
});

Handlebars.registerHelper('textarea', function(name, value, options) {
  var settings, textarea;
  settings = _.defaults(options.hash, {
    tabindex: 1,
    className: 'form-control',
    size: null
  });
  if (settings.size === 'lg') {
    settings.rows = 20;
  }
  if (settings.size === 'sm') {
    settings.rows = 5;
  }
  textarea = tag('textarea', {
    name: name,
    className: settings.className,
    id: "input-" + name,
    placeholder: settings.placeholder,
    tabindex: settings.tabindex,
    rows: settings.rows
  }, value);
  return new Handlebars.SafeString(settings.label ? wrap(textarea, {
    label: settings.label,
    help: settings.help,
    name: name,
    required: settings.required
  }) : textarea);
});

Handlebars.registerHelper('submit', function(text, options) {
  var settings;
  settings = _.defaults(options.hash, {
    className: 'btn btn-primary ladda-button',
    tabindex: 1
  });
  return tag('button', {
    className: settings.className,
    'data-style': 'zoom-in',
    type: 'submit',
    tabindex: settings.tabindex
  }, text);
});

Handlebars.registerHelper('hidden', function(name, value) {
  return tag('input', {
    type: 'hidden',
    name: name,
    value: value
  });
});

Handlebars.registerHelper('checkbox', function(name, value, options) {
  var cb, label, params;
  label = options.hash.label;
  params = {
    type: 'checkbox',
    name: name,
    value: 1,
    tabIndex: 1
  };
  if (value) {
    params.checked = 'checked';
  }
  cb = tag('input', params);
  if (label) {
    cb = tag('label', {
      className: 'control-label'
    }, cb + (" " + label));
  }
  return wrap(cb, {
    help: options.hash.help,
    className: 'checkbox'
  });
});

Handlebars.registerHelper('select', function(name, value, selectOptions, options) {
  var i, len, opt, optionEls, settings;
  if (!((selectOptions != null ? selectOptions.length : void 0) > 0)) {
    return;
  }
  settings = _.defaults(options.hash, {
    className: 'form-control',
    valueKey: 'id',
    nameKey: 'name',
    tabIndex: 1
  });
  if (value) {
    settings.selected = 'selected';
  }
  optionEls = [];
  for (i = 0, len = selectOptions.length; i < len; i++) {
    opt = selectOptions[i];
    optionEls.push(tag('option', {
      value: opt[settings.valueKey],
      selected: opt[settings.valueKey] === value ? "selected" : ""
    }, opt[settings.nameKey]));
  }
  return wrap(tag('select', {
    className: settings.className,
    tabindex: settings.tabindex,
    name: name
  }, optionEls.join('')), {
    label: settings.label,
    help: settings.help
  });
});

Handlebars.registerHelper('cloudinaryUpload', function(name, value, options) {
  var cloudinaryConfig, img, input, preview, settings;
  if (!$.cloudinary.config().api_key) {
    return;
  }
  settings = _.defaults(options.hash, {});
  if (value == null) {
    value = '';
  }
  img = '';
  if (value) {
    preview = Handlebars.helpers.cloudinaryImage(value, {
      hash: {
        crop: 'limit',
        width: 600,
        height: 300,
        fetch_format: 'auto'
      }
    });
    if (preview) {
      img = preview;
    }
  }
  cloudinaryConfig = JSON.stringify(mediator.options.cloudinary);
  input = "<div class=\"dropzone\">\n  <div class=\"preview\">\n    <button type=\"button\" class=\"close show-tooltip\" title=\"Remove image\">\n      <span aria-hidden=\"true\">&times;</span><span class=\"sr-only\">Close</span>\n    </button>\n    <div class=\"preview-inner\">\n      " + img + "\n    </div>\n  </div>\n  <br>\n\n  <p>Upload files by dragging &amp; dropping,\n  or <a href=\"#\" class=\"fileinput-button\">selecting one from your computer\n  <input name=\"file\" type=\"file\" multiple=\"multiple\"\n  class=\"cloudinary-fileupload\" data-cloudinary-field=\"" + name + "\"\n  data-form-data='" + cloudinaryConfig + "'></input></a>.</p>\n</div>\n<input type=\"hidden\" name=\"" + name + "\" value=\"" + value + "\">\n\n<div class=\"progress hide\">\n  <div class=\"progress-bar progress-bar-striped active\" role=\"progressbar\" aria-valuenow=\"0\" aria-valuemin=\"0\" aria-valuemax=\"100\" style=\"width: 0%\"></div>\n</div>";
  return new Handlebars.SafeString(wrap(input, {
    label: settings.label,
    help: settings.help,
    required: settings.required,
    name: name
  }));
});

Handlebars.registerHelper('cloudinaryImage', function(img, options) {
  var url;
  if (!($.cloudinary.config().api_key && (img != null ? img.public_id : void 0))) {
    return;
  }
  url = $.cloudinary.url(img.public_id, options.hash);
  return new Handlebars.SafeString("<img src=\"" + url + "\">");
});



},{"hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","underscore":"l0hNr+"}],"client/source/lib/collection.coffee":[function(require,module,exports){
var Chaplin, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

module.exports = Collection = (function(superClass) {
  extend(Collection, superClass);

  function Collection() {
    return Collection.__super__.constructor.apply(this, arguments);
  }

  Collection.prototype.initialize = function() {
    this.ajaxPool = [];
    return Collection.__super__.initialize.apply(this, arguments);
  };

  Collection.prototype.fetch = function() {
    var jqPromise;
    jqPromise = Collection.__super__.fetch.apply(this, arguments);
    this.ajaxPool.push(jqPromise);
    jqPromise.fail(function(jqXHR, statusCode) {
      console.warn('Collection Ajax error:', arguments);
      if (("" + (jqXHR != null ? jqXHR.status : void 0)).charAt(0) === '5' || statusCode === 'parsererror' || statusCode === 'timeout') {
        return Chaplin.utils.redirectTo('error#general');
      }
    });
    return jqPromise.always((function(_this) {
      return function() {
        var idx;
        idx = _this.ajaxPool.indexOf(jqPromise);
        if (idx !== -1) {
          return _this.ajaxPool.splice(idx, 1);
        }
      };
    })(this));
  };

  Collection.prototype.dispose = function() {
    var i, len, ref, xhr;
    ref = this.ajaxPool;
    for (i = 0, len = ref.length; i < len; i++) {
      xhr = ref[i];
      xhr.abort();
    }
    return Collection.__super__.dispose.apply(this, arguments);
  };

  return Collection;

})(Chaplin.Collection);



},{"chaplin":"9U5Jgg"}],"client/source/lib/collection_view.coffee":[function(require,module,exports){
var Chaplin, CollectionView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

module.exports = CollectionView = (function(superClass) {
  extend(CollectionView, superClass);

  function CollectionView() {
    return CollectionView.__super__.constructor.apply(this, arguments);
  }

  CollectionView.prototype.itemRemoved = function() {};

  CollectionView.prototype.getTemplateFunction = function() {
    return this.template;
  };

  CollectionView.prototype.fallbackSelector = '.fallback';

  return CollectionView;

})(Chaplin.CollectionView);



},{"chaplin":"9U5Jgg"}],"client/source/lib/controller.coffee":[function(require,module,exports){
var Buckets, Chaplin, Controller, LoggedInLayout, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

LoggedInLayout = require('views/layouts/loggedin');

Buckets = require('models/buckets');

mediator = Chaplin.mediator;

module.exports = Controller = (function(superClass) {
  extend(Controller, superClass);

  function Controller() {
    return Controller.__super__.constructor.apply(this, arguments);
  }

  Controller.prototype.beforeAction = function(params, route) {
    var ref, renderDash;
    Controller.__super__.beforeAction.apply(this, arguments);
    if (mediator.options.needsInstall && route.path !== 'install') {
      return this.redirectTo({
        url: 'install'
      });
    }
    if ((mediator.user == null) && params.authRequired !== false) {
      return this.redirectTo('auth#login', {
        next: route.path
      });
    } else if ((ref = mediator.user) != null ? ref.get('id') : void 0) {
      renderDash = (function(_this) {
        return function() {
          return _this.reuse('dashboard', LoggedInLayout, {
            model: mediator.user
          });
        };
      })(this);
      if (mediator.buckets) {
        return renderDash();
      } else {
        mediator.buckets = new Buckets;
        return mediator.buckets.fetch().done(renderDash);
      }
    }
  };

  return Controller;

})(Chaplin.Controller);



},{"chaplin":"9U5Jgg","models/buckets":"client/source/models/buckets.coffee","views/layouts/loggedin":"client/source/views/layouts/loggedin.coffee"}],"client/source/lib/model.coffee":[function(require,module,exports){
var Chaplin, Model, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

_ = require('underscore');

module.exports = Model = (function(superClass) {
  extend(Model, superClass);

  function Model() {
    return Model.__super__.constructor.apply(this, arguments);
  }

  Model.prototype.initialize = function() {
    this.ajaxPool = [];
    return Model.__super__.initialize.apply(this, arguments);
  };

  Model.prototype.api = function(url, data, options) {
    if (options == null) {
      options = {};
    }
    return $.ajax(_.extend(options, {
      url: url,
      data: data
    }));
  };

  Model.prototype.sync = function() {
    var jqPromise;
    jqPromise = Model.__super__.sync.apply(this, arguments);
    this.ajaxPool.push(jqPromise);
    jqPromise.error(function(jqXHT, statusCode) {
      console.warn('Model AJAX error:', arguments);
      if (("" + (typeof jqXHR !== "undefined" && jqXHR !== null ? jqXHR.status : void 0)).charAt(0) === '5' || statusCode === 'parsererror' || statusCode === 'timeout') {
        return Chaplin.utils.redirectTo('error#general');
      }
    });
    return jqPromise.always((function(_this) {
      return function() {
        var idx;
        idx = _this.ajaxPool.indexOf(jqPromise);
        if (idx !== -1) {
          return _this.ajaxPool.splice(idx, 1);
        }
      };
    })(this));
  };

  Model.prototype.dispose = function() {
    var i, len, ref, xhr;
    ref = this.ajaxPool;
    for (i = 0, len = ref.length; i < len; i++) {
      xhr = ref[i];
      xhr.abort();
    }
    return Model.__super__.dispose.apply(this, arguments);
  };

  return Model;

})(Chaplin.Model);



},{"chaplin":"9U5Jgg","underscore":"l0hNr+"}],"client/source/lib/view.coffee":[function(require,module,exports){
var Chaplin, Cocktail, View, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Chaplin = require('chaplin');

Cocktail = require('cocktail');

module.exports = View = (function(superClass) {
  extend(View, superClass);

  function View() {
    return View.__super__.constructor.apply(this, arguments);
  }

  View.prototype.autoRender = true;

  View.prototype.mixins = [];

  View.prototype.getTemplateFunction = function() {
    return this.template;
  };

  View.prototype.getTemplateHTML = function() {
    return this.getTemplateFunction()(this.getTemplateData());
  };

  View.prototype.initialize = function() {
    var i, len, mixin, ref, results;
    ref = this.mixins;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      mixin = ref[i];
      results.push(Cocktail.mixin(this, mixin));
    }
    return results;
  };

  View.prototype.getSize = function() {
    var width;
    width = $(window).width();
    if (width < 768) {
      return 'xs';
    } else if ((768 <= width && width < 992)) {
      return 'sm';
    } else if ((992 <= width && width < 1200)) {
      return 'md';
    } else {
      return 'sm';
    }
  };

  View.prototype.dispose = function() {
    this.trigger('dispose');
    return View.__super__.dispose.apply(this, arguments);
  };

  return View;

})(Chaplin.View);



},{"chaplin":"9U5Jgg","cocktail":"qFH0SM","underscore":"l0hNr+"}],"client/source/mediator.coffee":[function(require,module,exports){
var Chaplin, mediator;

Chaplin = require('chaplin');

module.exports = mediator = Chaplin.mediator;

mediator.loadPlugin = function(name, force) {
  var promise, ref;
  if (force == null) {
    force = false;
  }
  if (this.plugins[name] === false) {
    return;
  }
  promise = new $.Deferred;
  if (((ref = this.plugins) != null ? ref[name] : void 0) && !force) {
    return promise.resolve();
  }
  Modernizr.load({
    load: "/" + this.options.adminSegment + "/plugins/" + name + ".js",
    complete: function() {
      return promise.resolve();
    },
    fail: (function(_this) {
      return function() {
        _this.plugins[name] = false;
        return promise.reject();
      };
    })(this)
  });
  return promise;
};



},{"chaplin":"9U5Jgg"}],"client/source/models/bucket.coffee":[function(require,module,exports){
var Bucket, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Bucket = (function(superClass) {
  extend(Bucket, superClass);

  function Bucket() {
    return Bucket.__super__.constructor.apply(this, arguments);
  }

  Bucket.prototype.urlRoot = '/api/buckets';

  Bucket.prototype.defaults = {
    fields: [],
    color: 'teal',
    icon: 'edit'
  };

  return Bucket;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/buckets.coffee":[function(require,module,exports){
var Bucket, Buckets, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Bucket = require('models/bucket');

module.exports = Buckets = (function(superClass) {
  extend(Buckets, superClass);

  function Buckets() {
    return Buckets.__super__.constructor.apply(this, arguments);
  }

  Buckets.prototype.url = '/api/buckets';

  Buckets.prototype.model = Bucket;

  Buckets.prototype.comparator = 'name';

  return Buckets;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/bucket":"client/source/models/bucket.coffee"}],"client/source/models/build.coffee":[function(require,module,exports){
var Build, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Build = (function(superClass) {
  extend(Build, superClass);

  function Build() {
    return Build.__super__.constructor.apply(this, arguments);
  }

  Build.prototype.urlRoot = '/api/builds/';

  Build.prototype.defaults = {
    env: 'staging'
  };

  Build.prototype.checkDropbox = function() {
    return this.api('/api/builds/dropbox/check');
  };

  Build.prototype.disconnectDropbox = function() {};

  return Build;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/buildfile.coffee":[function(require,module,exports){
var Model, Template,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Template = (function(superClass) {
  extend(Template, superClass);

  function Template() {
    return Template.__super__.constructor.apply(this, arguments);
  }

  Template.prototype.urlRoot = function() {
    return "/api/buildfiles/" + (this.get('build_env')) + "/";
  };

  Template.prototype.idAttribute = 'filename';

  Template.prototype.defaults = {
    filename: '',
    contents: '',
    build_env: 'staging'
  };

  return Template;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/buildfiles.coffee":[function(require,module,exports){
var BuildFile, Collection, Templates, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Collection = require('lib/collection');

BuildFile = require('models/buildfile');

module.exports = Templates = (function(superClass) {
  extend(Templates, superClass);

  function Templates() {
    return Templates.__super__.constructor.apply(this, arguments);
  }

  Templates.prototype.build_env = 'staging';

  Templates.prototype.url = function() {
    console.log('fetching group', this.build_env);
    return "/api/buildfiles/" + this.build_env + "/";
  };

  Templates.prototype.model = BuildFile;

  Templates.prototype.comparator = 'filename';

  Templates.prototype.getTree = function() {
    var tree;
    tree = {};
    _.map(this.toJSON(), function(obj) {
      var i, j, len, node, part, parts, path, pathId, ptr, results;
      parts = obj.filename.replace(/^\/|\/$/g, "").split('/');
      ptr = tree;
      pathId = "";
      path = "";
      results = [];
      for (i = j = 0, len = parts.length; j < len; i = ++j) {
        part = parts[i];
        node = {
          name: part,
          type: 'directory',
          pathId: pathId += ("_" + part).replace(/[^A-Za-z0-9 \-\_]/, '-'),
          path: path += part + "/"
        };
        if (i === parts.length - 1 && !obj.filename.match(/\/$/)) {
          node.type = 'file';
          node.path = obj.filename;
        }
        ptr[part] = ptr[part] || node;
        ptr[part].children = ptr[part].children || {};
        results.push(ptr = ptr[part].children);
      }
      return results;
    });
    return tree;
  };

  return Templates;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/buildfile":"client/source/models/buildfile.coffee","underscore":"l0hNr+"}],"client/source/models/builds.coffee":[function(require,module,exports){
var Build, Builds, Collection,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Build = require('models/build');

module.exports = Builds = (function(superClass) {
  extend(Builds, superClass);

  function Builds() {
    return Builds.__super__.constructor.apply(this, arguments);
  }

  Builds.prototype.url = '/api/builds';

  Builds.prototype.model = Build;

  Builds.prototype.comparator = '-timestamp';

  return Builds;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/build":"client/source/models/build.coffee"}],"client/source/models/entries.coffee":[function(require,module,exports){
var Collection, Entries, Entry,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Entry = require('models/entry');

module.exports = Entries = (function(superClass) {
  extend(Entries, superClass);

  function Entries() {
    return Entries.__super__.constructor.apply(this, arguments);
  }

  Entries.prototype.url = '/api/entries/';

  Entries.prototype.model = Entry;

  Entries.prototype.fetchByBucket = function(bucketId) {
    this.url += "?" + ($.param({
      bucketId: bucketId
    }));
    return this.fetch();
  };

  Entries.prototype.comparator = function(entry) {
    return -new Date(entry.get('publishDate')).getTime();
  };

  return Entries;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/entry":"client/source/models/entry.coffee"}],"client/source/models/entry.coffee":[function(require,module,exports){
var Bucket, Entry, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

Bucket = require('models/bucket');

module.exports = Entry = (function(superClass) {
  extend(Entry, superClass);

  function Entry() {
    return Entry.__super__.constructor.apply(this, arguments);
  }

  Entry.prototype.defaults = {
    title: '',
    keywords: '',
    description: '',
    status: 'draft',
    slug: '',
    content: {}
  };

  Entry.prototype.urlRoot = '/api/entries';

  return Entry;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","models/bucket":"client/source/models/bucket.coffee"}],"client/source/models/field.coffee":[function(require,module,exports){
var Field, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Field = (function(superClass) {
  extend(Field, superClass);

  function Field() {
    return Field.__super__.constructor.apply(this, arguments);
  }

  Field.prototype.defaults = {
    name: '',
    instructions: '',
    slug: '',
    settings: {}
  };

  Field.prototype.urlRoot = '/api/fields';

  return Field;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/fields.coffee":[function(require,module,exports){
var Collection, Field, Fields,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Field = require('models/field');

Collection = require('lib/collection');

module.exports = Fields = (function(superClass) {
  extend(Fields, superClass);

  function Fields() {
    return Fields.__super__.constructor.apply(this, arguments);
  }

  Fields.prototype.url = '/api/fields/';

  Fields.prototype.model = Field;

  Fields.prototype.comparator = 'sort';

  return Fields;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/field":"client/source/models/field.coffee"}],"client/source/models/install.coffee":[function(require,module,exports){
var Install, Model,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Install = (function(superClass) {
  extend(Install, superClass);

  function Install() {
    return Install.__super__.constructor.apply(this, arguments);
  }

  Install.prototype.urlRoot = '/api/install';

  return Install;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/member.coffee":[function(require,module,exports){
var Member, Model, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

module.exports = Member = (function(superClass) {
  extend(Member, superClass);

  function Member() {
    return Member.__super__.constructor.apply(this, arguments);
  }

  Member.prototype.urlRoot = function() {
    return "/api/buckets/" + (this.get('bucketId')) + "/members";
  };

  return Member;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","underscore":"l0hNr+"}],"client/source/models/members.coffee":[function(require,module,exports){
var Collection, Member, Members, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Collection = require('lib/collection');

Member = require('models/member');

module.exports = Members = (function(superClass) {
  extend(Members, superClass);

  function Members() {
    return Members.__super__.constructor.apply(this, arguments);
  }

  Members.prototype.initialize = function(options) {
    this.bucketId = options.bucketId;
    return Members.__super__.initialize.apply(this, arguments);
  };

  Members.prototype.url = function() {
    return "/api/buckets/" + this.bucketId + "/members";
  };

  Members.prototype.model = Member;

  return Members;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/member":"client/source/models/member.coffee","underscore":"l0hNr+"}],"client/source/models/password_reset.coffee":[function(require,module,exports){
var Model, PasswordReset,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = PasswordReset = (function(superClass) {
  extend(PasswordReset, superClass);

  function PasswordReset() {
    return PasswordReset.__super__.constructor.apply(this, arguments);
  }

  PasswordReset.prototype.urlRoot = '/api/reset';

  PasswordReset.prototype.idAttribute = 'token';

  return PasswordReset;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/route.coffee":[function(require,module,exports){
var Model, Route,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Model = require('lib/model');

module.exports = Route = (function(superClass) {
  extend(Route, superClass);

  function Route() {
    return Route.__super__.constructor.apply(this, arguments);
  }

  Route.prototype.urlRoot = '/api/routes';

  return Route;

})(Model);



},{"lib/model":"client/source/lib/model.coffee"}],"client/source/models/routes.coffee":[function(require,module,exports){
var Collection, Route, Routes,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

Route = require('models/route');

module.exports = Routes = (function(superClass) {
  extend(Routes, superClass);

  function Routes() {
    return Routes.__super__.constructor.apply(this, arguments);
  }

  Routes.prototype.url = '/api/routes/';

  Routes.prototype.model = Route;

  Routes.prototype.comparator = 'sort';

  return Routes;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/route":"client/source/models/route.coffee"}],"client/source/models/templates.coffee":[function(require,module,exports){
var BuildFiles, Templates,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

BuildFiles = require('models/buildfiles');

module.exports = Templates = (function(superClass) {
  extend(Templates, superClass);

  function Templates() {
    return Templates.__super__.constructor.apply(this, arguments);
  }

  Templates.prototype.build_env = 'live';

  Templates.prototype.url = "/api/buildfiles/live/?type=template";

  return Templates;

})(BuildFiles);



},{"models/buildfiles":"client/source/models/buildfiles.coffee"}],"client/source/models/user.coffee":[function(require,module,exports){
var Model, User, _,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

module.exports = User = (function(superClass) {
  extend(User, superClass);

  function User() {
    return User.__super__.constructor.apply(this, arguments);
  }

  User.prototype.urlRoot = '/api/users';

  User.prototype.defaults = {
    roles: []
  };

  User.prototype.hasRole = function(name, id, type) {
    return _.any(this.get('roles'), function(role) {
      if (role.name === 'administrator') {
        return true;
      }
      return role.name === name && ((!id && role.resourceType === type) || (role.resourceId === id));
    });
  };

  return User;

})(Model);



},{"lib/model":"client/source/lib/model.coffee","underscore":"l0hNr+"}],"client/source/models/users.coffee":[function(require,module,exports){
var Collection, User, Users,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Collection = require('lib/collection');

User = require('models/user');

module.exports = Users = (function(superClass) {
  extend(Users, superClass);

  function Users() {
    return Users.__super__.constructor.apply(this, arguments);
  }

  Users.prototype.url = '/api/users/';

  Users.prototype.model = User;

  return Users;

})(Collection);



},{"lib/collection":"client/source/lib/collection.coffee","models/user":"client/source/models/user.coffee"}],"client/source/routes.coffee":[function(require,module,exports){
var AuthController, BucketsController, ErrorController, HelpController, InstallController, RoutesController, SettingsController, TemplatesController;

ErrorController = require('controllers/error_controller');

SettingsController = require('controllers/settings_controller');

TemplatesController = require('controllers/templates_controller');

BucketsController = require('controllers/buckets_controller');

InstallController = require('controllers/install_controller');

RoutesController = require('controllers/routes_controller');

AuthController = require('controllers/auth_controller');

HelpController = require('controllers/help_controller');

module.exports = function(match) {
  match('install', 'install#firstuser', {
    params: {
      authRequired: false
    }
  });
  match('login', 'auth#login', {
    params: {
      authRequired: false
    }
  });
  match('reset/:token', 'auth#resetPassword', {
    params: {
      authRequired: false
    }
  });
  match('buckets/add', 'buckets#add');
  match('buckets/:slug', 'buckets#browse');
  match('buckets/:slug/add', 'buckets#browse', {
    params: {
      add: true
    }
  });
  match('buckets/:slug/fields', 'buckets#editFields');
  match('buckets/:slug/settings/members', 'buckets#settings', {
    params: {
      activeTab: 3
    }
  });
  match('buckets/:slug/settings/fields', 'buckets#settings', {
    params: {
      activeTab: 2
    }
  });
  match('buckets/:slug/settings', 'buckets#settings', {
    params: {
      activeTab: 1
    }
  });
  match('buckets/:slug/:entryID', 'buckets#browse');
  match('design(/:env)(/*filename)', 'templates#edit');
  match('routes', 'routes#list');
  match('help(/*doc)', 'help#index');
  match('settings', 'settings#basic');
  match('users(/:email)', 'settings#users');
  match('', 'buckets#dashboard');
  return match(':missing*', 'buckets#missing');
};



},{"controllers/auth_controller":"client/source/controllers/auth_controller.coffee","controllers/buckets_controller":"client/source/controllers/buckets_controller.coffee","controllers/error_controller":"client/source/controllers/error_controller.coffee","controllers/help_controller":"client/source/controllers/help_controller.coffee","controllers/install_controller":"client/source/controllers/install_controller.coffee","controllers/routes_controller":"client/source/controllers/routes_controller.coffee","controllers/settings_controller":"client/source/controllers/settings_controller.coffee","controllers/templates_controller":"client/source/controllers/templates_controller.coffee"}],"client/source/templates/auth/login.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/login.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/auth/reset.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/reset.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/buckets/dashboard.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/dashboard.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/buckets/edit.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/edit.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/buckets/fields.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/fields.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/entries/browser.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/browser.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/entries/edit.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/edit.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/entries/list.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/list.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/entries/row.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/row.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/fields/edit.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/edit.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/fields/input.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/input.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/fields/settings.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/settings.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/install/firstuser.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/install/firstuser.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/layouts/loggedin.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/layouts/loggedin.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/members/list.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/members/list.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/routes/edit.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/edit.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/routes/list.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/list.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/settings/basic.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/settings/basic.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/templates/directory.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/directory.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/templates/editor.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/editor.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/users/edit.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/edit.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/templates/users/list.hbs":[function(require,module,exports){
module.exports=require("/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/list.hbs")
},{"hbsfy/runtime":"pu95bm"}],"client/source/views/auth/login.coffee":[function(require,module,exports){
var FormMixin, LoginView, View, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/auth/login');

FormMixin = require('views/base/mixins/form');

mediator = require('chaplin').mediator;

module.exports = LoginView = (function(superClass) {
  extend(LoginView, superClass);

  function LoginView() {
    return LoginView.__super__.constructor.apply(this, arguments);
  }

  LoginView.prototype.template = tpl;

  LoginView.prototype.container = '#bkts-content';

  LoginView.prototype.className = 'loginView';

  LoginView.prototype.optionNames = View.prototype.optionNames.concat(['next']);

  LoginView.prototype.mixins = [FormMixin];

  LoginView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#forgot"]': 'clickForgot',
    'click [href="#cancel"]': 'clickCancel'
  };

  LoginView.prototype.render = function() {
    LoginView.__super__.render.apply(this, arguments);
    this.$logo = this.$('#logo');
    TweenLite.from(this.$logo, .4, {
      scale: .3,
      ease: Back.easeOut
    });
    TweenLite.from(this.$logo, .4, {
      y: '150px',
      ease: Back.easeOut,
      delay: .2
    });
    return TweenLite.from(this.$('fieldset'), .2, {
      opacity: 0,
      scale: .9,
      ease: Sine.easeOut,
      delay: .3
    });
  };

  LoginView.prototype.submitForm = function(e) {
    var $form, email, ref;
    if (!e.originalEvent) {
      return;
    }
    e.preventDefault();
    $form = $(e.currentTarget);
    if ($form.hasClass('forgot')) {
      email = (ref = this.formParams()) != null ? ref.username : void 0;
      return this.submit($.post('/api/forgot', {
        email: email
      })).error((function(_this) {
        return function() {
          _this.$('input:visible').eq(0).focus();
          return toastr.error('Could not find a user with that email address.');
        };
      })(this)).done((function(_this) {
        return function() {
          toastr.success("A password reset email has been sent to " + email + ".");
          return _this.render();
        };
      })(this));
    } else {
      return this.submit($.post("/" + mediator.options.adminSegment + "/checkLogin", this.formParams())).done(function() {
        return $form.submit();
      }).error((function(_this) {
        return function() {
          TweenLite.to(_this.$logo, 0.15, {
            transformOrigin: 'middle bottom 25',
            rotationY: 20,
            ease: Expo.easeInOut
          });
          TweenLite.to(_this.$logo, 0.15, {
            delay: .1,
            rotationY: -20,
            ease: Expo.easeInOut
          });
          TweenLite.to(_this.$logo, 0.15, {
            delay: .25,
            rotationY: 20,
            ease: Expo.easeInOut
          });
          return TweenLite.to(_this.$logo, .8, {
            delay: .4,
            rotationY: 0,
            ease: Elastic.easeOut
          });
        };
      })(this));
    }
  };

  LoginView.prototype.clickForgot = function(e) {
    e.preventDefault();
    this.$('input[name="password"]').slideUp(100);
    this.$('h3').text('Enter your account email:');
    this.$('.btn-primary').text('Reset your password');
    this.$('input:visible').eq(0).focus();
    this.$('form').addClass('forgot');
    return this.$(e.currentTarget).attr('href', '#cancel').text('Cancel');
  };

  LoginView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.render();
  };

  LoginView.prototype.getTemplateData = function() {
    if (this.next) {
      return {
        next: "/" + mediator.options.adminSegment + "/" + this.next
      };
    }
  };

  return LoginView;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/auth/login":"client/source/templates/auth/login.hbs","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/auth/reset_password.coffee":[function(require,module,exports){
var FormMixin, ResetPasswordView, View, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/auth/reset');

FormMixin = require('views/base/mixins/form');

module.exports = ResetPasswordView = (function(superClass) {
  extend(ResetPasswordView, superClass);

  function ResetPasswordView() {
    return ResetPasswordView.__super__.constructor.apply(this, arguments);
  }

  ResetPasswordView.prototype.template = tpl;

  ResetPasswordView.prototype.container = '#bkts-content';

  ResetPasswordView.prototype.className = 'loginView';

  ResetPasswordView.prototype.mixins = [FormMixin];

  ResetPasswordView.prototype.events = {
    'submit form': 'submitForm'
  };

  ResetPasswordView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams()));
  };

  return ResetPasswordView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/auth/reset":"client/source/templates/auth/reset.hbs","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/base/mixins/form.coffee":[function(require,module,exports){
var _, getSlug;

_ = require('underscore');

getSlug = require('speakingurl');

module.exports = {
  render: function() {
    this.delegate('keyup', 'input[data-sluggify]', this.keyUpSluggify);
    return _.defer((function(_this) {
      return function() {
        var $firstField;
        if (_this.disposed) {
          return;
        }
        $firstField = _this.$('.form-control').eq(0);
        if (!Modernizr.touch) {
          $firstField.focus();
        }
        return _this.$('.input-slug').each(function(i, el) {
          var $slug, ref;
          $slug = $(el);
          return $slug.data('has-value', ((ref = $slug.val()) != null ? ref.length : void 0) > 0);
        });
      };
    })(this));
  },
  formParams: function() {
    return this.$el.formParams(false);
  },
  submit: function(promise) {
    var $btn;
    $btn = this.$('.ladda-button').ladda();
    $btn.ladda('start');
    return promise.always(function() {
      if ($btn != null ? $btn.data('ladda') : void 0) {
        return $btn.ladda('stop');
      }
    }).fail(_.bind(this.renderServerErrors, this));
  },
  renderServerErrors: function(res) {
    var errors, ref;
    this.clearFormErrors();
    if (errors = res != null ? (ref = res.responseJSON) != null ? ref.errors : void 0 : void 0) {
      _.each(errors, (function(_this) {
        return function(error) {
          var message;
          if (error.type === 'required' || error.message === 'required') {
            message = '<span class="label label-danger">Required</span>';
          } else {
            message = error.message;
          }
          return _this.$("[name=\"" + error.path + "\"]").closest('.form-group').find('.help-block').remove().end().addClass('has-error').append("<span class=\"help-block\">" + message + "</span>");
        };
      })(this));
      return this.$('.has-error').eq(0).find('[name]').eq(0).focus();
    }
  },
  clearFormErrors: function() {
    this.$('.help-block').remove();
    return this.$('.has-error').removeClass('has-error');
  },
  keyUpSluggify: function(e) {
    var $el, $target, val;
    $el = this.$(e.currentTarget);
    val = $el.val();
    $target = this.$("input[name=\"" + ($el.data('sluggify')) + "\"]");
    if ($target.data('has-value')) {
      return;
    }
    return $target.val(getSlug(val));
  }
};



},{"speakingurl":"/Users/iuriikozuliak/Projects/buckets/node_modules/speakingurl/index.js","underscore":"l0hNr+"}],"client/source/views/base/page.coffee":[function(require,module,exports){
var PageView, View,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

module.exports = PageView = (function(superClass) {
  extend(PageView, superClass);

  function PageView() {
    return PageView.__super__.constructor.apply(this, arguments);
  }

  PageView.prototype.region = 'content';

  return PageView;

})(View);



},{"lib/view":"client/source/lib/view.coffee"}],"client/source/views/buckets/dashboard.coffee":[function(require,module,exports){
var DashboardView, PageView, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

tpl = require('templates/buckets/dashboard');

module.exports = DashboardView = (function(superClass) {
  extend(DashboardView, superClass);

  function DashboardView() {
    return DashboardView.__super__.constructor.apply(this, arguments);
  }

  DashboardView.prototype.template = tpl;

  return DashboardView;

})(PageView);



},{"templates/buckets/dashboard":"client/source/templates/buckets/dashboard.hbs","views/base/page":"client/source/views/base/page.coffee"}],"client/source/views/buckets/edit.coffee":[function(require,module,exports){
var BucketEditView, BucketFieldsView, FormMixin, MembersList, PageView, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

PageView = require('views/base/page');

BucketFieldsView = require('views/buckets/fields');

MembersList = require('views/members/list');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/buckets/edit');

module.exports = BucketEditView = (function(superClass) {
  extend(BucketEditView, superClass);

  function BucketEditView() {
    return BucketEditView.__super__.constructor.apply(this, arguments);
  }

  BucketEditView.prototype.template = tpl;

  BucketEditView.prototype.optionNames = PageView.prototype.optionNames.concat(['fields', 'members', 'users']);

  BucketEditView.prototype.mixins = [FormMixin];

  BucketEditView.prototype.regions = {
    'fields': '#fields',
    'members': '#members'
  };

  BucketEditView.prototype.events = {
    'submit form': 'submitForm',
    'click .swatches div': 'selectSwatch',
    'click [href="#delete"]': 'clickDelete'
  };

  BucketEditView.prototype.getTemplateData = function() {
    return _.extend(BucketEditView.__super__.getTemplateData.apply(this, arguments), {
      randomBucketPlaceholder: _.sample(['Articles', 'Songs', 'Videos', 'Events']),
      colors: ['green', 'teal', 'blue', 'purple', 'red', 'orange', 'yellow', 'gray'],
      icons: ['edit', 'camera-front', 'calendar', 'video-camera', 'headphone', 'map', 'chat-bubble', 'shopping-bag', 'user', 'goal', 'megaphone', 'star', 'bookmark', 'toolbox']
    });
  };

  BucketEditView.prototype.render = function() {
    BucketEditView.__super__.render.apply(this, arguments);
    this.subview('bucketFields', new BucketFieldsView({
      collection: this.fields,
      region: 'fields'
    }));
    if (this.members && this.users) {
      return this.subview('bucketMembers', new MembersList({
        collection: this.members,
        bucket: this.model,
        users: this.users,
        region: 'members'
      }));
    }
  };

  BucketEditView.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    data = this.formParams();
    data.color = this.$('.colors div.selected').data('value');
    data.icon = this.$('.icons div.selected').data('value');
    data.fields = this.fields.toJSON();
    return this.submit(this.model.save(data, {
      wait: true
    }));
  };

  BucketEditView.prototype.selectSwatch = function(e) {
    var $el;
    e.preventDefault();
    $el = this.$(e.currentTarget);
    $el.addClass('selected').siblings().removeClass('selected');
    return this.updateIconPreview();
  };

  BucketEditView.prototype.updateIconPreview = function() {
    var $color;
    $color = this.$('.icon-preview > div').removeClass().addClass('color-' + this.$('.colors div.selected').data('value'));
    return $color.find('> span').removeClass().addClass('icon buckets-icon-' + this.$('.icons div.selected').data('value'));
  };

  BucketEditView.prototype.clickDelete = function(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      return this.model.destroy({
        wait: true
      });
    }
  };

  BucketEditView.prototype.setActiveTab = function(idx) {
    return this.$('.nav-tabs li').eq(idx - 1).find('a').click();
  };

  return BucketEditView;

})(PageView);



},{"templates/buckets/edit":"client/source/templates/buckets/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee","views/buckets/fields":"client/source/views/buckets/fields.coffee","views/members/list":"client/source/views/members/list.coffee"}],"client/source/views/buckets/fields.coffee":[function(require,module,exports){
var BucketFieldsView, Field, FieldEditView, Model, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

Model = require('lib/model');

FieldEditView = require('views/fields/edit');

Field = require('models/field');

tpl = require('templates/buckets/fields');

mediator = require('mediator');

module.exports = BucketFieldsView = (function(superClass) {
  extend(BucketFieldsView, superClass);

  function BucketFieldsView() {
    this.updateSort = bind(this.updateSort, this);
    return BucketFieldsView.__super__.constructor.apply(this, arguments);
  }

  BucketFieldsView.prototype.template = tpl;

  BucketFieldsView.prototype.events = {
    'change [name="fieldType"]': 'addField',
    'click [href="#edit"]': 'clickEdit',
    'click [href="#remove"]': 'clickRemove'
  };

  BucketFieldsView.prototype.listen = {
    'add collection': 'render',
    'remove collection': 'render'
  };

  BucketFieldsView.prototype.attach = function() {
    var $sortable;
    BucketFieldsView.__super__.attach.apply(this, arguments);
    $sortable = this.$('#sortable-fields');
    if ($sortable.length) {
      return new Sortable($sortable.get(0), {
        handle: '.handle',
        onUpdate: this.updateSort
      });
    }
  };

  BucketFieldsView.prototype.updateSort = function() {
    var $sortable;
    $sortable = this.$el.find('#sortable-fields');
    return $sortable.children().each((function(_this) {
      return function(i, li) {
        var model;
        model = _this.collection.findWhere({
          slug: $(li).data('field-slug')
        });
        if (model) {
          return model.set({
            sort: i
          });
        }
      };
    })(this));
  };

  BucketFieldsView.prototype.getTemplateData = function() {
    var fieldTypes, plugin, pluginSlug, ref;
    fieldTypes = [
      {
        name: 'Add a field…'
      }, {
        name: 'Text',
        value: 'text'
      }, {
        name: 'Number',
        value: 'number'
      }, {
        name: 'Checkbox',
        value: 'checkbox'
      }, {
        name: 'Textarea',
        value: 'textarea'
      }, {
        name: 'Image',
        value: 'cloudinary_image'
      }
    ];
    ref = mediator.plugins;
    for (pluginSlug in ref) {
      plugin = ref[pluginSlug];
      if (plugin != null ? plugin.name : void 0) {
        fieldTypes.push({
          name: plugin.name,
          value: pluginSlug
        });
      }
    }
    return _.extend(BucketFieldsView.__super__.getTemplateData.apply(this, arguments), {
      fieldTypes: fieldTypes
    });
  };

  BucketFieldsView.prototype.addField = function(e) {
    var $el, field, fieldType;
    $el = this.$(e.currentTarget);
    fieldType = $el.val();
    field = new Field({
      fieldType: fieldType
    });
    return this.renderEditField(field);
  };

  BucketFieldsView.prototype.clickEdit = function(e) {
    var field, idx;
    e.preventDefault();
    idx = $(e.currentTarget).closest('li').index();
    field = this.collection.at(idx);
    return this.renderEditField(field);
  };

  BucketFieldsView.prototype.renderEditField = function(field) {
    var editField;
    editField = this.subview('editField', new FieldEditView({
      container: this.$('.editField'),
      model: field
    }));
    return this.listenToOnce(field, 'change', function(field) {
      this.subview('editField').dispose();
      this.collection.add(field, {
        at: 0
      });
      this.updateSort();
      return this.render();
    });
  };

  BucketFieldsView.prototype.clickRemove = function(e) {
    var field, fieldType, idx, name, ref;
    e.preventDefault();
    idx = $(e.currentTarget).closest('li').index();
    field = this.collection.at(idx);
    ref = field.toJSON(), name = ref.name, fieldType = ref.fieldType;
    if (field && confirm("Are you sure you want to remove the “" + name + "” " + fieldType + " field?")) {
      return this.collection.remove(field);
    }
  };

  return BucketFieldsView;

})(View);



},{"lib/model":"client/source/lib/model.coffee","lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","models/field":"client/source/models/field.coffee","templates/buckets/fields":"client/source/templates/buckets/fields.hbs","underscore":"l0hNr+","views/fields/edit":"client/source/views/fields/edit.coffee"}],"client/source/views/entries/browser.coffee":[function(require,module,exports){
var Chaplin, EntriesBrowser, EntriesList, Entry, EntryEditView, Handlebars, PageView, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Handlebars = require('hbsfy/runtime');

Chaplin = require('chaplin');

PageView = require('views/base/page');

EntriesList = require('views/entries/list');

Entry = require('models/entry');

EntryEditView = require('views/entries/edit');

tpl = require('templates/entries/browser');

mediator = require('mediator');

module.exports = EntriesBrowser = (function(superClass) {
  extend(EntriesBrowser, superClass);

  function EntriesBrowser() {
    this.modelSaved = bind(this.modelSaved, this);
    return EntriesBrowser.__super__.constructor.apply(this, arguments);
  }

  EntriesBrowser.prototype.template = tpl;

  EntriesBrowser.prototype.optionNames = PageView.prototype.optionNames.concat(['bucket']);

  EntriesBrowser.prototype.regions = {
    'detail': '.entry-detail',
    'list': '.entries'
  };

  EntriesBrowser.prototype.listen = {
    'all collection': 'checkLength'
  };

  EntriesBrowser.prototype.getTemplateData = function() {
    var ref;
    return _.extend(EntriesBrowser.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      items: (ref = this.collection) != null ? ref.toJSON() : void 0
    });
  };

  EntriesBrowser.prototype.render = function() {
    EntriesBrowser.__super__.render.apply(this, arguments);
    return this.subview('EntryList', new EntriesList({
      collection: this.collection,
      bucket: this.bucket
    }));
  };

  EntriesBrowser.prototype.loadEntry = function(entryID) {
    this.model = this.collection.findWhere({
      id: entryID
    }) || new Entry({
      id: entryID
    });
    return this.model.fetch().done((function(_this) {
      return function() {
        _this.$('.entry').removeClass('active').filter("[data-entry-id=" + (_this.model.get('id')) + "]").addClass('active');
        _this.model.set({
          publishDate: Handlebars.helpers.simpleDateTime(_this.model.get('publishDate'))
        }, {
          silent: true
        });
        _this.model.on('sync', _this.modelSaved);
        return _this.renderDetailView();
      };
    })(this));
  };

  EntriesBrowser.prototype.loadNewEntry = function() {
    this.$('.entry.active').removeClass('active');
    this.model = new Entry({
      author: mediator.user.toJSON()
    });
    this.model.on('sync', this.modelSaved);
    return this.renderDetailView();
  };

  EntriesBrowser.prototype.clearEntry = function() {
    var subview;
    subview = this.subview('editEntry');
    if (!(subview != null ? subview.$el : void 0)) {
      return;
    }
    subview.$el.fadeOut(100, function() {
      return subview != null ? subview.dispose() : void 0;
    });
    return this.$('.entry').removeClass('active');
  };

  EntriesBrowser.prototype.modelSaved = function(entry, newData) {
    var notificationMessage;
    if (newData != null ? newData.id : void 0) {
      notificationMessage = "You saved “" + (entry.get('title')) + "”";
      if (newData.publishDate != null) {
        if (new Date(newData.publishDate).getTime() > new Date().getTime()) {
          notificationMessage = "You scheduled “" + (entry.get('title')) + "”";
        } else if (newData.status === "live") {
          notificationMessage = "You published “" + (entry.get('title')) + "”";
        }
      } else if (newData.status === "draft") {
        if (entry.previousAttributes().lastModified !== newData.lastModified) {
          notificationMessage = "You updated “" + (entry.get('title')) + "”";
        } else {
          notificationMessage = "You saved “" + (entry.get('title')) + "” draft";
        }
      }
      toastr.success(notificationMessage);
      this.model.set(newData);
      this.collection.add(this.model);
    } else {
      toastr.success("You deleted “" + (entry.get('title')) + "”");
    }
    return Chaplin.utils.redirectTo('buckets#browse', {
      slug: this.bucket.get('slug')
    });
  };

  EntriesBrowser.prototype.renderDetailView = function() {
    var model, sv;
    sv = this.subview('editEntry', new EntryEditView({
      model: this.model,
      bucket: this.bucket,
      author: this.model.get('author') || mediator.user.toJSON()
    }));
    model = this.model;
    return this.listenToOnce(sv, 'dispose', (function(_this) {
      return function() {
        return model.off('sync', _this.modelSaved);
      };
    })(this));
  };

  EntriesBrowser.prototype.checkLength = function() {
    if (!this.disposed) {
      return this.$('.hasEntries').toggleClass('hidden', this.collection.length === 0);
    }
  };

  return EntriesBrowser;

})(PageView);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","models/entry":"client/source/models/entry.coffee","templates/entries/browser":"client/source/templates/entries/browser.hbs","underscore":"l0hNr+","views/base/page":"client/source/views/base/page.coffee","views/entries/edit":"client/source/views/entries/edit.coffee","views/entries/list":"client/source/views/entries/list.coffee"}],"client/source/views/entries/edit.coffee":[function(require,module,exports){
var Chaplin, EntryEditView, FieldTypeInputView, FormMixin, Model, PageView, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Model = require('lib/model');

PageView = require('views/base/page');

FormMixin = require('views/base/mixins/form');

FieldTypeInputView = require('views/fields/input');

Chaplin = require('chaplin');

tpl = require('templates/entries/edit');

mediator = require('mediator');

module.exports = EntryEditView = (function(superClass) {
  extend(EntryEditView, superClass);

  function EntryEditView() {
    return EntryEditView.__super__.constructor.apply(this, arguments);
  }

  EntryEditView.prototype.className = 'EntryEditView';

  EntryEditView.prototype.template = tpl;

  EntryEditView.prototype.optionNames = PageView.prototype.optionNames.concat(['bucket']);

  EntryEditView.prototype.region = 'detail';

  EntryEditView.prototype.regions = {
    'user-fields': '.userFields'
  };

  EntryEditView.prototype.mixins = [FormMixin];

  EntryEditView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#delete"]': 'clickDelete',
    'click [href="#draft"]': 'clickDraft',
    'click [href="#date"]': 'clickDate',
    'click [href="#publish"]': 'clickPublish',
    'click [href="#copy"]': 'clickCopy',
    'click [href="#reject"]': 'clickReject',
    'keydown textarea, [type=text], [type=number]': 'keyDown',
    'keyup textarea, [type=text], [type=number]': 'keyUp'
  };

  EntryEditView.prototype.keyUp = function(e) {
    if (this.cmdActive && e.which === 91) {
      this.cmdActive = false;
      return e;
    }
  };

  EntryEditView.prototype.keyDown = function(e) {
    if (this.cmdActive && e.which === 13) {
      this.$('form').submit();
    }
    this.cmdActive = e.metaKey;
    return e;
  };

  EntryEditView.prototype.getTemplateData = function() {
    var fields;
    fields = this.bucket.get('fields');
    _.map(fields, (function(_this) {
      return function(field) {
        field.value = _this.model.get(field.slug);
        return field;
      };
    })(this));
    return _.extend(EntryEditView.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      user: this.user,
      fields: fields,
      newTitle: this.bucket.get('titlePlaceholder') ? _.sample(this.bucket.get('titlePlaceholder').split('|')) : "New " + (this.bucket.get('singular'))
    });
  };

  EntryEditView.prototype.render = function() {
    var $keywords, content, popularKeywords;
    EntryEditView.__super__.render.apply(this, arguments);
    content = this.model.get('content');
    _.each(this.bucket.get('fields'), (function(_this) {
      return function(field) {
        var fieldModel, fieldValue, ref;
        fieldValue = content[field.slug];
        fieldModel = new Model(_.extend(field, {
          value: fieldValue
        }));
        _this.subview('field_' + field.slug, new FieldTypeInputView({
          model: fieldModel
        }));
        if ((ref = field.fieldType) === 'text' || ref === 'textarea' || ref === 'checkbox' || ref === 'number' || ref === 'cloudinary_image') {
          return;
        }
        return mediator.loadPlugin(field.fieldType).done(function() {
          var plugin;
          plugin = mediator.plugins[field.fieldType];
          if (plugin != null) {
            if (_.isFunction(plugin.inputView)) {
              return _this.subview('field_' + field.slug, new plugin.inputView({
                model: fieldModel,
                region: 'user-fields'
              }));
            } else if (_.isString(plugin.inputView)) {
              return _this.subview('field_' + field.slug, new FieldTypeInputView({
                template: plugin.inputView,
                model: fieldModel
              }));
            }
          }
          return _this.subview("field_" + field.slug).$el.html("<label class=\"text-danger\">" + field.name + "</label>\n<div class=\"alert alert-danger\">\n  <p>\n    <strong>Warning:</strong>\n    There was an error loading the input code for the <code>" + field.fieldType + "</code> FieldType.<br>\n  </p>\n</div>");
        });
      };
    })(this));
    popularKeywords = new Bloodhound({
      name: 'keywords',
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace('keyword'),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: {
        url: '/api/entries/keywords',
        ttl: 0
      }
    });
    popularKeywords.clearPrefetchCache();
    popularKeywords.initialize();
    $keywords = this.$('[name="keywords"]');
    $keywords.tagsinput({
      typeaheadjs: {
        name: 'keywords',
        displayKey: 'keyword',
        valueKey: 'keyword',
        source: popularKeywords.ttAdapter()
      }
    });
    return this.$('.bootstrap-tagsinput').addClass('form-control');
  };

  EntryEditView.prototype.submitForm = function(e) {
    var base, content, data, field, i, len, ref, simpleValue, status;
    e.preventDefault();
    content = {};
    ref = this.bucket.get('fields');
    for (i = 0, len = ref.length; i < len; i++) {
      field = ref[i];
      content[field.slug] = typeof (base = this.subview("field_" + field.slug)).getValue === "function" ? base.getValue() : void 0;
      if (content[field.slug]) {
        continue;
      }
      data = this.subview("field_" + field.slug).$el.formParams(false);
      simpleValue = data[field.slug];
      content[field.slug] = simpleValue != null ? simpleValue : data;
    }
    this.model.set({
      content: content
    });
    status = this.model.get('status');
    if (!this.model.get('id')) {
      this.model.set({
        status: 'live'
      });
    }
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickDelete = function(e) {
    e.preventDefault();
    if (confirm("Are you sure you want to delete " + (this.model.get('title')) + "?")) {
      return this.model.destroy({
        wait: true
      });
    }
  };

  EntryEditView.prototype.clickDraft = function(e) {
    e.preventDefault();
    this.model.set({
      status: 'draft'
    });
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickDate = function(e) {
    e.preventDefault();
    this.$('.dateInput').removeClass('hidden');
    $(e.currentTarget).parent().remove();
    this.$('button.btn-primary').text('Schedule');
    return this.$('.dateInput input').focus();
  };

  EntryEditView.prototype.clickPublish = function(e) {
    e.preventDefault();
    this.model.set(_.extend(this.formParams(), {
      publishDate: 'Now',
      status: 'live'
    }));
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickReject = function(e) {
    e.preventDefault();
    this.model.set(_.extend(this.formParams(), {
      publishDate: 'Now',
      status: 'rejected'
    }));
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    }));
  };

  EntryEditView.prototype.clickCopy = function(e) {
    var collection, newModel;
    e.preventDefault();
    newModel = this.model.clone();
    newModel.set(_.extend(this.formParams(), {
      id: null,
      publishDate: 'Now',
      status: 'draft'
    }));
    collection = this.model.collection;
    this.model = newModel;
    return this.submit(this.model.save(this.model.toJSON(), {
      wait: true
    })).done((function(_this) {
      return function(newEntry) {
        collection.add(newModel);
        newModel = null;
        collection = null;
        return Chaplin.utils.redirectTo('buckets#browse', {
          slug: _this.bucket.get('slug'),
          entryID: newEntry.id
        });
      };
    })(this));
  };

  EntryEditView.prototype.dispose = function() {
    if (!this.disposed) {
      this.$('.panel').css({
        opacity: 0
      });
      this.$('[name="keywords"]').tagsinput('destroy');
    }
    return EntryEditView.__super__.dispose.apply(this, arguments);
  };

  return EntryEditView;

})(PageView);



},{"chaplin":"9U5Jgg","lib/model":"client/source/lib/model.coffee","mediator":"client/source/mediator.coffee","templates/entries/edit":"client/source/templates/entries/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee","views/fields/input":"client/source/views/fields/input.coffee"}],"client/source/views/entries/list.coffee":[function(require,module,exports){
var CollectionView, EntriesList, EntryRowView, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

CollectionView = require('lib/collection_view');

EntryRowView = require('views/entries/row');

tpl = require('templates/entries/list');

module.exports = EntriesList = (function(superClass) {
  extend(EntriesList, superClass);

  function EntriesList() {
    return EntriesList.__super__.constructor.apply(this, arguments);
  }

  EntriesList.prototype.template = tpl;

  EntriesList.prototype.itemView = EntryRowView;

  EntriesList.prototype.useCssAnimation = true;

  EntriesList.prototype.region = 'list';

  EntriesList.prototype.optionNames = CollectionView.prototype.optionNames.concat(['bucket']);

  EntriesList.prototype.getTemplateData = function() {
    return _.extend(EntriesList.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON()
    });
  };

  EntriesList.prototype.itemRemoved = function(entry) {
    var id;
    if (id = entry != null ? entry.get('id') : void 0) {
      this.$("[data-entry-id=\"" + id + "\"]").slideUp({
        duration: 200,
        easing: 'easeInExpo',
        complete: function() {
          return $(this).parent().remove();
        }
      });
    }
    if (this.collection.length === 0) {
      return this.$fallback.show();
    }
  };

  EntriesList.prototype.itemAdded = function(entry) {
    var $el, id, thing;
    thing = EntriesList.__super__.itemAdded.apply(this, arguments);
    if (id = entry != null ? entry.get('id') : void 0) {
      $el = this.$("[data-entry-id=\"" + id + "\"]").hide();
      return _.defer((function(_this) {
        return function() {
          return $el.slideDown({
            duration: 200,
            easing: 'easeOutExpo'
          });
        };
      })(this));
    }
  };

  return EntriesList;

})(CollectionView);



},{"lib/collection_view":"client/source/lib/collection_view.coffee","templates/entries/list":"client/source/templates/entries/list.hbs","underscore":"l0hNr+","views/entries/row":"client/source/views/entries/row.coffee"}],"client/source/views/entries/row.coffee":[function(require,module,exports){
var EntryRow, View, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

View = require('lib/view');

tpl = require('templates/entries/row');

module.exports = EntryRow = (function(superClass) {
  extend(EntryRow, superClass);

  function EntryRow() {
    return EntryRow.__super__.constructor.apply(this, arguments);
  }

  EntryRow.prototype.template = tpl;

  EntryRow.prototype.listen = {
    'change model': 'render'
  };

  return EntryRow;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/entries/row":"client/source/templates/entries/row.hbs"}],"client/source/views/fields/edit.coffee":[function(require,module,exports){
var FieldEditView, FieldTypeSettingsView, FormMixin, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

FieldTypeSettingsView = require('views/fields/settings');

mediator = require('mediator');

tpl = require('templates/fields/edit');

module.exports = FieldEditView = (function(superClass) {
  extend(FieldEditView, superClass);

  function FieldEditView() {
    this.renderSettings = bind(this.renderSettings, this);
    return FieldEditView.__super__.constructor.apply(this, arguments);
  }

  FieldEditView.prototype.template = tpl;

  FieldEditView.prototype.mixins = [FormMixin];

  FieldEditView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#cancel"]': 'clickCancel'
  };

  FieldEditView.prototype.regions = {
    'settings': '.settings'
  };

  FieldEditView.prototype.render = function() {
    var ref;
    FieldEditView.__super__.render.apply(this, arguments);
    if ((ref = this.model.get('fieldType')) === 'text' || ref === 'textarea' || ref === 'checkbox' || ref === 'number' || ref === 'cloudinary_image') {
      return this.renderSettings();
    } else {
      return mediator.loadPlugin(this.model.get('fieldType')).done(this.renderSettings);
    }
  };

  FieldEditView.prototype.renderSettings = function() {
    var SettingsView, configOptions, plugin;
    configOptions = {
      region: 'settings',
      model: this.model
    };
    plugin = mediator.plugins[this.model.get('fieldType')];
    if (plugin) {
      if (_.isFunction(plugin.settingsView)) {
        SettingsView = plugin.settingsView;
      } else if (_.isString(plugin.settingsView)) {
        configOptions.template = plugin.settingsView;
        SettingsView = FieldTypeSettingsView;
      }
    } else {
      SettingsView = FieldTypeSettingsView;
    }
    return this.subview("settings_" + (this.model.get('slug')), new FieldTypeSettingsView(configOptions));
  };

  FieldEditView.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    data = this.formParams();
    data.fieldType = this.model.get('fieldType');
    data.slug = data.fieldSlug;
    delete data.fieldSlug;
    data.settings = this.$('.settings').formParams();
    return this.model.set(data);
  };

  FieldEditView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.dispose();
  };

  return FieldEditView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","templates/fields/edit":"client/source/templates/fields/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/fields/settings":"client/source/views/fields/settings.coffee"}],"client/source/views/fields/input.coffee":[function(require,module,exports){
var FieldTypeInputView, View, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/fields/input');

mediator = require('mediator');

module.exports = FieldTypeInputView = (function(superClass) {
  extend(FieldTypeInputView, superClass);

  function FieldTypeInputView() {
    return FieldTypeInputView.__super__.constructor.apply(this, arguments);
  }

  FieldTypeInputView.prototype.template = tpl;

  FieldTypeInputView.prototype.region = 'user-fields';

  FieldTypeInputView.prototype.className = 'form-group';

  FieldTypeInputView.prototype.events = {
    'dragover': 'hoverDropzone',
    'click .close': 'clickRemove'
  };

  FieldTypeInputView.prototype.getTemplateFunction = function() {
    if (_.isString(this.template)) {
      return this.cachedTplFn != null ? this.cachedTplFn : this.cachedTplFn = _.template(this.template).source;
    } else {
      return this.template;
    }
  };

  FieldTypeInputView.prototype.render = function() {
    var $input, $preview, $progress, $progressBar, value;
    FieldTypeInputView.__super__.render.apply(this, arguments);
    if (this.model.get('fieldType') !== 'cloudinary_image') {
      return;
    }
    $preview = this.$('.preview');
    $progress = this.$('.progress');
    $progressBar = this.$('.progress-bar');
    value = this.model.get('value');
    this.$input = $input = this.$("input[type=file]");
    if (value) {
      $input.data('value-object', value);
    }
    return this.$input.cloudinary_fileupload({
      dropzone: this.$('.dropzone')
    }).bind('fileuploadstart', function(e) {
      return $progress.removeClass('hide');
    }).bind('fileuploadprogress', function(e, data) {
      var percent;
      percent = data.loaded / data.total * 100;
      $progressBar.css({
        width: percent + "%"
      }).attr('aria-valuenow', percent);
      if (percent === 100) {
        return $progressBar.addClass('progress-bar-success').removeClass('active progress-bar-striped').text('Processing image…');
      }
    }).bind('cloudinarydone', function(e, data) {
      $progressBar.text('Fetching image…');
      $preview.css({
        height: 0
      }).show().find('.preview-inner').html("<img src=\"" + data.result.url + "\">");
      return imagesLoaded($preview, function() {
        $progress.addClass('hide');
        $progressBar.removeClass('progress-bar-success').addClass('progress-bar-striped active').css({
          width: 0
        }).text('').attr('aria-valuenow', 0);
        $preview.find('img').height();
        $input.data('value-object', data.result);
        return TweenLite.to($preview, .5, {
          height: $preview.find('img').height(),
          ease: Sine.easeOut
        });
      });
    });
  };

  FieldTypeInputView.prototype.getValue = function() {
    if (!this.$input) {
      return;
    }
    return this.$input.data('value-object') || this.$input.val();
  };

  FieldTypeInputView.prototype.hoverDropzone = function() {
    var $dz;
    if (this.dropzoneTimeout) {
      clearTimeout(this.dropzoneTimeout);
    }
    $dz = this.$('.dropzone').addClass('hover');
    return this.dropzoneTimeout = setTimeout(function() {
      return $dz.removeClass('hover');
    }, 200);
  };

  FieldTypeInputView.prototype.clickRemove = function(e) {
    e.preventDefault();
    this.$('.dropzone').slideDown();
    this.$('.preview').slideUp();
    return this.$('input[type="hidden"]').val(null);
  };

  return FieldTypeInputView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","mediator":"client/source/mediator.coffee","templates/fields/input":"client/source/templates/fields/input.hbs","underscore":"l0hNr+"}],"client/source/views/fields/settings.coffee":[function(require,module,exports){
var FieldTypeSettingsView, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/fields/settings');

module.exports = FieldTypeSettingsView = (function(superClass) {
  extend(FieldTypeSettingsView, superClass);

  function FieldTypeSettingsView() {
    return FieldTypeSettingsView.__super__.constructor.apply(this, arguments);
  }

  FieldTypeSettingsView.prototype.optionNames = View.prototype.optionNames.concat(['template']);

  FieldTypeSettingsView.prototype.template = tpl;

  FieldTypeSettingsView.prototype.getTemplateFunction = function() {
    if (_.isString(this.template)) {
      return this.cachedTplFn != null ? this.cachedTplFn : this.cachedTplFn = _.template(this.template);
    } else {
      return this.template;
    }
  };

  return FieldTypeSettingsView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/fields/settings":"client/source/templates/fields/settings.hbs","underscore":"l0hNr+"}],"client/source/views/help/doc.coffee":[function(require,module,exports){
var HelpDocView, PageView, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

mediator = require('mediator');

module.exports = HelpDocView = (function(superClass) {
  extend(HelpDocView, superClass);

  function HelpDocView() {
    return HelpDocView.__super__.constructor.apply(this, arguments);
  }

  HelpDocView.prototype.optionNames = PageView.prototype.optionNames.concat(['doc']);

  HelpDocView.prototype.className = 'col-md-8';

  HelpDocView.prototype.render = function() {
    HelpDocView.__super__.render.apply(this, arguments);
    return this.$el.load("/" + mediator.options.adminSegment + "/help-html/" + this.doc, function() {
      return console.log('done loading', arguments);
    });
  };

  return HelpDocView;

})(PageView);



},{"mediator":"client/source/mediator.coffee","views/base/page":"client/source/views/base/page.coffee"}],"client/source/views/install/firstuser.coffee":[function(require,module,exports){
var FirstUserView, FormMixin, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/install/firstuser');

module.exports = FirstUserView = (function(superClass) {
  extend(FirstUserView, superClass);

  function FirstUserView() {
    return FirstUserView.__super__.constructor.apply(this, arguments);
  }

  FirstUserView.prototype.mixins = [FormMixin];

  FirstUserView.prototype.template = tpl;

  FirstUserView.prototype.container = '#bkts-content';

  FirstUserView.prototype.autoRender = true;

  FirstUserView.prototype.className = 'firstUser';

  FirstUserView.prototype.events = {
    'submit form': 'submitForm'
  };

  FirstUserView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams()));
  };

  return FirstUserView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/install/firstuser":"client/source/templates/install/firstuser.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/layout.coffee":[function(require,module,exports){
var Chaplin, Layout, _, mediator,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

Chaplin = require('chaplin');

_ = require('underscore');

mediator = Chaplin.mediator;

module.exports = Layout = (function(superClass) {
  extend(Layout, superClass);

  function Layout() {
    return Layout.__super__.constructor.apply(this, arguments);
  }

  Layout.prototype.regions = {
    'header': '#bkts-header'
  };

  Layout.prototype.events = {
    'click [href="#menu"]': 'clickMenu',
    'click #logo a': 'clickLogo',
    'click .nav-primary a': 'clickMenuNav',
    'click .logout a': 'fadeAwayFadeAway'
  };

  Layout.prototype.initialize = function() {
    Layout.__super__.initialize.apply(this, arguments);
    toastr.options = {
      debug: false,
      positionClass: "toast-bottom-right",
      showDuration: 100,
      hideDuration: 100,
      timeOut: 2100,
      extendedTimeOut: 1000,
      showEasing: 'swing',
      hideEasing: 'swing',
      showMethod: 'slideDown',
      hideMethod: 'slideUp'
    };
    Modernizr.load({
      test: Modernizr.touch,
      yep: "/" + mediator.options.adminSegment + "/vendor/fastclick/fastclick.js",
      complete: function() {
        return typeof FastClick !== "undefined" && FastClick !== null ? FastClick.attach(document.body) : void 0;
      }
    });
    return this.$el.tooltip({
      selector: '.show-tooltip',
      align: 'bottom',
      delay: {
        show: 800,
        hide: 50
      }
    });
  };

  Layout.prototype.clickMenu = function(e) {
    if (this.$nav == null) {
      this.$nav = this.$('.nav-primary');
    }
    if (this.$btnMenu == null) {
      this.$btnMenu = this.$('.btn-menu');
    }
    e.preventDefault();
    this.$nav.toggleClass('hidden-xs').toggle().slideToggle(200);
    return this.$btnMenu.toggleClass('active');
  };

  Layout.prototype.clickMenuNav = function() {
    if (this.$nav == null) {
      this.$nav = this.$('.nav-primary');
    }
    if (this.$btnMenu == null) {
      this.$btnMenu = this.$('.btn-menu');
    }
    this.$btnMenu.removeClass('active');
    if ($(window).width() <= 768) {
      return this.$nav.css({
        display: 'block'
      }).slideToggle(150, (function(_this) {
        return function() {
          return _this.$nav.toggleClass('hidden-xs').toggle();
        };
      })(this));
    }
  };

  Layout.prototype.fadeAwayFadeAway = function() {
    return $('body').css({
      opacity: .85
    });
  };

  Layout.prototype.clickLogo = function(e) {
    e.preventDefault();
    if (this.$logoImg == null) {
      this.$logoImg = $('#logo img');
    }
    TweenLite.killTweensOf(this.$logoImg);
    TweenLite.fromTo(this.$logoImg, .6, {
      scaleX: .75
    }, {
      scaleX: 1,
      ease: Elastic.easeOut
    });
    TweenLite.fromTo(this.$logoImg, .6, {
      scaleY: .75
    }, {
      scaleY: 1,
      delay: .03,
      ease: Elastic.easeOut
    });
    return Chaplin.utils.redirectTo('buckets#dashboard');
  };

  return Layout;

})(Chaplin.Layout);



},{"chaplin":"9U5Jgg","underscore":"l0hNr+"}],"client/source/views/layouts/loggedin.coffee":[function(require,module,exports){
var LoggedInLayout, View, _, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/layouts/loggedin');

mediator = require('chaplin').mediator;

module.exports = LoggedInLayout = (function(superClass) {
  extend(LoggedInLayout, superClass);

  function LoggedInLayout() {
    this.checkSize = bind(this.checkSize, this);
    this.openNav = bind(this.openNav, this);
    this.collapseNav = bind(this.collapseNav, this);
    return LoggedInLayout.__super__.constructor.apply(this, arguments);
  }

  LoggedInLayout.prototype.template = tpl;

  LoggedInLayout.prototype.autoRender = true;

  LoggedInLayout.prototype.container = '#bkts-content';

  LoggedInLayout.prototype.regions = {
    content: '.page'
  };

  LoggedInLayout.prototype.getTemplateData = function() {
    var ref, ref1;
    return _.extend(LoggedInLayout.__super__.getTemplateData.apply(this, arguments), {
      buckets: (ref = mediator.buckets) != null ? ref.toJSON() : void 0,
      version: (ref1 = mediator.options) != null ? ref1.version : void 0
    });
  };

  LoggedInLayout.prototype.initialize = function() {
    LoggedInLayout.__super__.initialize.apply(this, arguments);
    this.subscribeEvent('dispatcher:dispatch', this.checkNav);
    this.listenTo(mediator.buckets, 'sync add', (function(_this) {
      return function() {
        return _this.render();
      };
    })(this));
    this.throttledCheckSize = _.throttle(this.checkSize, 1000, {
      trailing: true
    });
    return $(window).on('resize', this.throttledCheckSize);
  };

  LoggedInLayout.prototype.render = function() {
    LoggedInLayout.__super__.render.apply(this, arguments);
    this.$('#bkts-sidebar li').each(function(i, el) {
      return TweenLite.from(el, .2, {
        y: '30px',
        opacity: 0,
        ease: Sine.easeOut,
        delay: i * .01
      });
    });
    this.openTimeout = null;
    return this.$('#bkts-sidebar').hover((function(_this) {
      return function() {
        if (_this.openTimeout) {
          clearTimeout(_this.openTimeout);
        }
        return _this.openTimeout = setTimeout(_this.openNav, 50);
      };
    })(this), (function(_this) {
      return function() {
        if (_this.openTimeout) {
          clearTimeout(_this.openTimeout);
        }
        return _this.openTimeout = setTimeout(_this.collapseNav, 50);
      };
    })(this));
  };

  LoggedInLayout.prototype.checkNav = function(controller, params, route) {
    var $link, href, j, len, link, newURL, ref, results;
    this.$('.nav-primary li').removeClass('active');
    if (!(route != null ? route.path : void 0)) {
      return;
    }
    if (this.$navLinks == null) {
      this.$navLinks = this.$('.nav-primary a');
    }
    ref = this.$navLinks;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      link = ref[j];
      $link = $(link);
      href = $link.attr('href');
      newURL = "/" + mediator.options.adminSegment + "/" + route.path;
      if (newURL.substr(0, href.length) === href) {
        $link.parent().addClass('active');
        break;
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  LoggedInLayout.prototype.collapseNav = function() {
    var $logo, $menuBtn, $view;
    if (!($(window).width() > 768)) {
      return;
    }
    $logo = this.$('#logo');
    $view = $('.loggedInView');
    $menuBtn = this.$('.btn-menu').css({
      display: 'block'
    });
    this.$('.usernav.open').trigger('click.bs.dropdown');
    this.killTweens();
    TweenLite.to($logo, .5, {
      scale: .6,
      x: -9,
      ease: Back.easeOut,
      delay: .1
    });
    TweenLite.to(this.$('#bkts-ftr'), .15, {
      opacity: 0,
      ease: Sine.easeIn
    });
    TweenLite.to(this.$('#bkts-sidebar'), .25, {
      width: 60,
      ease: Sine.easeIn,
      overflow: 'hidden',
      delay: .1
    });
    TweenLite.to($view, .25, {
      marginLeft: 60,
      ease: Sine.easeIn,
      delay: .1
    });
    return TweenLite.to(this.$('#bkts-sidebar li'), .25, {
      opacity: .5,
      x: -200,
      y: 0,
      opacity: 0,
      delay: .1,
      ease: Sine.easeIn
    });
  };

  LoggedInLayout.prototype.openNav = function() {
    var $link, $logo, $view, i, j, len, ref;
    if (!($(window).width() > 768)) {
      return;
    }
    this.killTweens();
    $view = $('.loggedInView');
    $logo = this.$('#logo');
    TweenLite.to(this.$('#bkts-sidebar'), .3, {
      width: 240,
      ease: Sine.easeOut,
      overflow: 'scroll'
    });
    TweenLite.to($view, .3, {
      marginLeft: 240,
      ease: Sine.easeOut
    });
    ref = this.$('#bkts-sidebar li');
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      $link = ref[i];
      TweenLite.to($link, .18 - .01 * i, {
        opacity: 1,
        x: 0,
        y: 0,
        delay: .04 * i - i * .008,
        ease: Sine.easeOut
      });
    }
    TweenLite.to($logo, .5, {
      scale: 1,
      x: 0,
      ease: Back.easeOut
    });
    return TweenLite.to(this.$('#bkts-ftr'), .15, {
      opacity: 1,
      ease: Sine.easeOut,
      delay: .4
    });
  };

  LoggedInLayout.prototype.killTweens = function() {
    return TweenLite.killTweensOf($('.loggedInView, #logo, #bkts-sidebar, #bkts-sidebar li, #bkts-ftr'));
  };

  LoggedInLayout.prototype.checkSize = function() {
    if ($(window).width() <= 768) {
      this.killTweens();
      return TweenLite.set($('.loggedInView, #logo, #bkts-sidebar, #bkts-sidebar li, #bkts-ftr'), {
        clearProps: 'all'
      });
    } else {
      this.killTweens();
      return this.collapseNav();
    }
  };

  LoggedInLayout.prototype.dispose = function() {
    $(window).off('resize', this.throttledCheckSize);
    return LoggedInLayout.__super__.dispose.apply(this, arguments);
  };

  return LoggedInLayout;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/layouts/loggedin":"client/source/templates/layouts/loggedin.hbs","underscore":"l0hNr+"}],"client/source/views/members/list.coffee":[function(require,module,exports){
var FormMixin, MembersList, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/members/list');

module.exports = MembersList = (function(superClass) {
  extend(MembersList, superClass);

  function MembersList() {
    return MembersList.__super__.constructor.apply(this, arguments);
  }

  MembersList.prototype.template = tpl;

  MembersList.prototype.mixins = [FormMixin];

  MembersList.prototype.optionNames = View.prototype.optionNames.concat(['bucket', 'users']);

  MembersList.prototype.listen = {
    'destroy collection': 'render',
    'add collection': 'render'
  };

  MembersList.prototype.events = {
    'submit .add-member': 'submitAddMember',
    'click .delete-member': 'clickDeleteMember'
  };

  MembersList.prototype.submitAddMember = function(e) {
    var data, u;
    e.preventDefault();
    data = this.$el.formParams(false);
    u = this.users.get(data.user).toJSON();
    u.bucketId = this.bucket.id;
    u.role = data.role;
    return this.collection.create(u);
  };

  MembersList.prototype.clickDeleteMember = function(e) {
    var model;
    e.preventDefault();
    if (confirm('Are you sure?')) {
      model = this.collection.findWhere({
        id: this.$(e.currentTarget).closest('.member').data('memberId')
      });
      return model.destroy().done((function(_this) {
        return function() {
          return toastr.success((model.get('name')) + " has been removed from " + _this.bucket.name);
        };
      })(this));
    }
  };

  MembersList.prototype.getTemplateData = function() {
    return _.extend(MembersList.__super__.getTemplateData.apply(this, arguments), {
      bucket: this.bucket.toJSON(),
      users: _.compact(this.users.map((function(_this) {
        return function(user) {
          if (!((_this.collection.get(user.get('id')) != null) || user.hasRole('administrator'))) {
            return user.toJSON();
          }
        };
      })(this)))
    });
  };

  return MembersList;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/members/list":"client/source/templates/members/list.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/missing.coffee":[function(require,module,exports){
var MissingView, PageView,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

module.exports = MissingView = (function(superClass) {
  extend(MissingView, superClass);

  function MissingView() {
    return MissingView.__super__.constructor.apply(this, arguments);
  }

  return MissingView;

})(PageView);



},{"views/base/page":"client/source/views/base/page.coffee"}],"client/source/views/routes/edit.coffee":[function(require,module,exports){
var EditRouteView, FormMixin, View, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/routes/edit');

module.exports = EditRouteView = (function(superClass) {
  extend(EditRouteView, superClass);

  function EditRouteView() {
    return EditRouteView.__super__.constructor.apply(this, arguments);
  }

  EditRouteView.prototype.template = tpl;

  EditRouteView.prototype.className = 'routeEdit';

  EditRouteView.prototype.optionNames = View.prototype.optionNames.concat(['templates']);

  EditRouteView.prototype.mixins = [FormMixin];

  EditRouteView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#cancel"]': 'clickCancel'
  };

  EditRouteView.prototype.getTemplateData = function() {
    var ref;
    return _.extend(EditRouteView.__super__.getTemplateData.apply(this, arguments), {
      templates: (ref = this.templates) != null ? ref.toJSON() : void 0
    });
  };

  EditRouteView.prototype.submitForm = function(e) {
    e.preventDefault();
    return this.submit(this.model.save(this.formParams(), {
      wait: true
    }));
  };

  EditRouteView.prototype.clickCancel = function(e) {
    e.preventDefault();
    return this.dispose();
  };

  return EditRouteView;

})(View);



},{"lib/view":"client/source/lib/view.coffee","templates/routes/edit":"client/source/templates/routes/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/routes/list.coffee":[function(require,module,exports){
var EditRouteView, PageView, Route, RoutesList, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

EditRouteView = require('views/routes/edit');

Route = require('models/route');

tpl = require('templates/routes/list');

module.exports = RoutesList = (function(superClass) {
  extend(RoutesList, superClass);

  function RoutesList() {
    return RoutesList.__super__.constructor.apply(this, arguments);
  }

  RoutesList.prototype.template = tpl;

  RoutesList.prototype.optionNames = PageView.prototype.optionNames.concat(['templates']);

  RoutesList.prototype.listen = {
    'destroy collection': 'render',
    'add collection': 'render'
  };

  RoutesList.prototype.events = {
    'click [href="#new"]': 'clickNew',
    'click [href="#delete"]': 'clickDelete',
    'click [href="#edit"]': 'clickEdit'
  };

  RoutesList.prototype.attach = function() {
    var $sortable;
    RoutesList.__super__.attach.apply(this, arguments);
    $sortable = $('#sortable-routes');
    return new Sortable($sortable.get(0), {
      handle: '.handle',
      onUpdate: (function(_this) {
        return function(e) {
          console.log('update', arguments);
          return $sortable.children().each(function(i, li) {
            var model;
            model = _this.collection.findWhere({
              id: $(li).children('.route').data('route-id')
            });
            if (model) {
              return model.save({
                sort: i
              });
            }
          });
        };
      })(this)
    });
  };

  RoutesList.prototype.clickNew = function(e) {
    var newRoute;
    e.preventDefault();
    newRoute = new Route;
    this.listenToOnce(newRoute, 'sync', (function(_this) {
      return function() {
        _this.collection.add(newRoute);
        _this.subview('editRoute').dispose();
        return _this.render();
      };
    })(this));
    return this.subview('editRoute', new EditRouteView({
      model: newRoute,
      container: this.$('.editRoute'),
      templates: this.templates
    }));
  };

  RoutesList.prototype.clickDelete = function(e) {
    var model;
    e.preventDefault();
    model = this.collection.findWhere({
      id: this.$(e.currentTarget).closest('.route').data('route-id')
    });
    if (model && confirm("Are you sure you want to delete “" + (model.get('urlPattern')) + "”?")) {
      return model.destroy({
        wait: true
      }).done(function() {
        return toastr.success('Route deleted');
      });
    }
  };

  RoutesList.prototype.clickEdit = function(e) {
    var $route, route, subview;
    e.preventDefault();
    $route = this.$(e.currentTarget).closest('.route');
    route = this.collection.findWhere({
      id: $route.data('route-id')
    });
    if (route) {
      this.listenToOnce(route, 'sync', (function(_this) {
        return function() {
          _this.subview('editRoute').dispose();
          return _this.render();
        };
      })(this));
      subview = this.subview('editRoute', new EditRouteView({
        model: route,
        container: $route,
        containerMethod: 'after',
        templates: this.templates
      }));
      $route.hide();
      return this.listenTo(subview, 'dispose', function() {
        return $route.show();
      });
    }
  };

  return RoutesList;

})(PageView);



},{"models/route":"client/source/models/route.coffee","templates/routes/list":"client/source/templates/routes/list.hbs","views/base/page":"client/source/views/base/page.coffee","views/routes/edit":"client/source/views/routes/edit.coffee"}],"client/source/views/settings/basic.coffee":[function(require,module,exports){
var BasicSettingsView, PageView, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

PageView = require('views/base/page');

tpl = require('templates/settings/basic');

module.exports = BasicSettingsView = (function(superClass) {
  extend(BasicSettingsView, superClass);

  function BasicSettingsView() {
    return BasicSettingsView.__super__.constructor.apply(this, arguments);
  }

  BasicSettingsView.prototype.templates = tpl;

  return BasicSettingsView;

})(PageView);



},{"templates/settings/basic":"client/source/templates/settings/basic.hbs","views/base/page":"client/source/views/base/page.coffee"}],"client/source/views/templates/editor.coffee":[function(require,module,exports){
var BuildFile, Chaplin, FormMixin, PageView, TemplateEditor, _, handlebars, mediator, tpl,
  bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

Chaplin = require('chaplin');

PageView = require('views/base/page');

BuildFile = require('models/buildfile');

mediator = require('mediator');

FormMixin = require('views/base/mixins/form');

tpl = require('templates/templates/editor');

handlebars = require('hbsfy/runtime');

handlebars.registerPartial('directory', require('templates/templates/directory'));

module.exports = TemplateEditor = (function(superClass) {
  extend(TemplateEditor, superClass);

  function TemplateEditor() {
    this.updateTemplateDisplay = bind(this.updateTemplateDisplay, this);
    this.bindAceEditor = bind(this.bindAceEditor, this);
    return TemplateEditor.__super__.constructor.apply(this, arguments);
  }

  TemplateEditor.prototype.template = tpl;

  TemplateEditor.prototype.mixins = [FormMixin];

  TemplateEditor.prototype.listen = {
    'add collection': 'render'
  };

  TemplateEditor.prototype.optionNames = PageView.prototype.optionNames.concat(['builds', 'liveFiles', 'stagingFiles', 'env', 'filename']);

  TemplateEditor.prototype.className = 'templateEditor';

  TemplateEditor.prototype.events = {
    'click [href="#new"]': 'clickNew',
    'click [href="#deleteFile"]': 'clickDeleteFile',
    'submit form': 'submitForm',
    'click [href="#delete"]': 'clickDeleteBuild',
    'click [href="#stage"]': 'clickStage',
    'click [href="#publish"]': 'clickPublish',
    'keydown textarea, [type=text], [type=number]': 'keyDown',
    'keyup textarea, [type=text], [type=number]': 'keyUp'
  };

  TemplateEditor.prototype.keyUp = function(e) {
    if (this.cmdActive && e.which === 91) {
      this.cmdActive = false;
    }
    return e;
  };

  TemplateEditor.prototype.keyDown = function(e) {
    if (this.cmdActive && e.which === 13) {
      this.$('form').submit();
    }
    this.cmdActive = e.metaKey;
    return e;
  };

  TemplateEditor.prototype.getTemplateData = function() {
    var archives;
    archives = _.where(this.builds.toJSON(), {
      env: 'archive'
    });
    return _.extend(TemplateEditor.__super__.getTemplateData.apply(this, arguments), {
      liveFiles: this.liveFiles.getTree(),
      stagingFiles: this.stagingFiles.getTree(),
      archives: archives,
      env: this.env,
      stagingUrl: mediator.options.stagingUrl
    });
  };

  TemplateEditor.prototype.render = function() {
    TemplateEditor.__super__.render.apply(this, arguments);
    this.$code = this.$('textarea.code');
    this.$code.after("<pre class=\"code editor hidden\"></pre>");
    this.aceReady = new $.Deferred;
    if (!(Modernizr.touch && !this.editor)) {
      this.$code.addClass('loading');
      return Modernizr.load({
        test: typeof ace !== "undefined" && ace !== null,
        nope: ["/" + mediator.options.adminSegment + "/js/ace/ace.js", "/" + mediator.options.adminSegment + "/js/ace/ext-modelist.js"],
        complete: this.bindAceEditor
      });
    } else {
      if (!this.editor) {
        this.aceReady.reject();
      }
      return this.selectTemplate(this.filename, this.env);
    }
  };

  TemplateEditor.prototype.bindAceEditor = function() {
    if (this.disposed) {
      return;
    }
    ace.config.set('basePath', "/" + mediator.options.adminSegment + "/js/ace/");
    this.editor = ace.edit(this.$('.code.editor')[0]);
    this.editor.setTheme('ace/theme/tomorrow');
    this.editor.renderer.setShowGutter(false);
    this.editorSession = this.editor.getSession();
    this.editorSession.setTabSize(2);
    this.$('pre.code, textarea.code').toggleClass('hidden');
    return this.aceReady.resolve();
  };

  TemplateEditor.prototype.selectTemplate = function(filename, env) {
    if (env == null) {
      env = 'staging';
    }
    this.clearFormErrors();
    this.env = env;
    this.collection = env === 'live' ? this.liveFiles : this.stagingFiles;
    this.model = this.collection.findWhere({
      filename: filename,
      build_env: env
    });
    if (!this.model) {
      if (filename) {
        toastr.warning("File doesn’t exist. Starting a new draft.");
      }
      this.model = new BuildFile({
        filename: filename || ''
      });
      this.updateTemplateDisplay();
    } else {
      this.model.fetch().done(this.updateTemplateDisplay);
    }
    this.$('.nav-stacked li').removeClass('active');
    return this.$("#env-" + env + " .nav-stacked li[data-path=\"" + filename + "\"]").addClass('active');
  };

  TemplateEditor.prototype.updateTemplateDisplay = function() {
    var contents, filename, ref;
    if (this.disposed) {
      return;
    }
    ref = this.model.toJSON(), contents = ref.contents, filename = ref.filename;
    this.$code.val(contents);
    this.$('[name="filename"]').val(filename);
    this.filename = filename;
    return this.aceReady.done((function(_this) {
      return function() {
        var mode, ref1;
        if (_this.modelist == null) {
          _this.modelist = ace.require('ace/ext/modelist');
        }
        mode = (ref1 = _this.modelist) != null ? ref1.getModeForPath(filename).mode : void 0;
        if (mode) {
          _this.editorSession.setMode(mode);
        }
        window.$session = _this.editorSession;
        return _this.editorSession.setValue(contents);
      };
    })(this));
  };

  TemplateEditor.prototype.submitForm = function(e) {
    var data;
    e.preventDefault();
    if (this.editorSession != null) {
      this.$code.val(this.editorSession.getValue());
    }
    data = this.formParams();
    return this.submit(this.model.save(data)).done((function(_this) {
      return function() {
        toastr.success("Saved Template “" + (_this.model.get('filename')) + "”");
        return _this.collection.add(_this.model);
      };
    })(this)).error((function(_this) {
      return function(res) {
        var compileErr, ref, ref1;
        if (compileErr = res != null ? (ref = res.responseJSON) != null ? (ref1 = ref.errors) != null ? ref1.contents : void 0 : void 0 : void 0) {
          if (compileErr.line) {
            _this.editor.renderer.setShowGutter(true);
            return _this.editor.getSession().setAnnotations([
              {
                row: compileErr.line - 1,
                text: compileErr.message,
                type: 'error'
              }
            ]);
          }
        }
      };
    })(this));
  };

  TemplateEditor.prototype.clickNew = function(e) {
    var env;
    e.preventDefault();
    env = this.$("ul.nav-tabs li.active").text() === 'Live' ? 'live' : 'staging';
    this.selectTemplate(null, env);
    return this.$('input').focus();
  };

  TemplateEditor.prototype.clickDeleteFile = function(e) {
    var $li, collection, index, model, nextTemplate;
    e.preventDefault();
    $li = $(e.currentTarget).closest('li');
    collection = $li.data('env') === 'staging' ? this.stagingFiles : this.liveFiles;
    model = collection.findWhere({
      filename: $li.data('path')
    });
    if (confirm('Are you sure?')) {
      index = collection.indexOf(model);
      nextTemplate = collection.at(index + 1 === collection.length ? index - 1 : index + 1);
      return model.destroy({
        wait: true
      }).done((function(_this) {
        return function() {
          _this.model = nextTemplate;
          return $li.slideUp(100, function() {
            return _this.render();
          });
        };
      })(this));
    }
  };

  TemplateEditor.prototype.clickDeleteBuild = function(e) {
    var $build, build, id;
    e.preventDefault();
    if (confirm('Are you sure you want to delete this archive?')) {
      $build = this.$(e.currentTarget).closest('.build');
      id = $build.data('id');
      build = this.builds.findWhere({
        id: id
      });
      return build.destroy({
        wait: true
      }).done(function() {
        return $build.slideUp(150);
      });
    }
  };

  TemplateEditor.prototype.clickStage = function(e) {
    var build, buildId;
    e.preventDefault();
    buildId = this.$(e.currentTarget).closest('.build').data('id');
    build = this.builds.findWhere({
      id: buildId
    });
    if (build) {
      build.set({
        env: 'staging'
      });
      return build.save({}, {
        wait: true
      }).done((function(_this) {
        return function() {
          return $.when(_this.builds.fetch(), _this.stagingFiles.fetch()).done(function() {
            toastr.success("Restored build " + (build.get('id')) + " to staging.");
            _this.render();
            return _this.selectTemplate(_this.filename, _this.env);
          });
        };
      })(this)).error(function() {
        return toastr.error("There was a problem restoring that build.");
      });
    }
  };

  TemplateEditor.prototype.clickPublish = function(e) {
    var $btn, build;
    e.preventDefault();
    build = this.builds.findWhere({
      env: 'staging'
    });
    if (!build) {
      return toastr.error('Error finding the build');
    }
    build.set({
      env: 'live'
    });
    $btn = $(e.currentTarget).ladda();
    $btn.ladda('start');
    return build.save({
      wait: true
    }).done((function(_this) {
      return function() {
        return $.when(_this.builds.fetch(), _this.liveFiles.fetch()).done(function() {
          toastr.success('Published staging!');
          return _.defer(function() {
            _this.render();
            return _this.selectTemplate(_this.filename, _this.env);
          });
        }).always(function() {
          return $btn.ladda('stop');
        });
      };
    })(this)).error(function() {
      return toastr.error('Couldn’t publish staging to live');
    });
  };

  TemplateEditor.prototype.dispose = function() {
    var ref;
    if ((ref = this.editor) != null) {
      ref.destroy();
    }
    return TemplateEditor.__super__.dispose.apply(this, arguments);
  };

  return TemplateEditor;

})(PageView);



},{"chaplin":"9U5Jgg","hbsfy/runtime":"pu95bm","mediator":"client/source/mediator.coffee","models/buildfile":"client/source/models/buildfile.coffee","templates/templates/directory":"client/source/templates/templates/directory.hbs","templates/templates/editor":"client/source/templates/templates/editor.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee","views/base/page":"client/source/views/base/page.coffee"}],"client/source/views/users/edit.coffee":[function(require,module,exports){
var EditUserView, FormMixin, View, _, mediator, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

View = require('lib/view');

tpl = require('templates/users/edit');

FormMixin = require('views/base/mixins/form');

mediator = require('chaplin').mediator;

module.exports = EditUserView = (function(superClass) {
  extend(EditUserView, superClass);

  function EditUserView() {
    return EditUserView.__super__.constructor.apply(this, arguments);
  }

  EditUserView.prototype.mixins = [FormMixin];

  EditUserView.prototype.template = tpl;

  EditUserView.prototype.autoRender = true;

  EditUserView.prototype.region = 'contactCard';

  EditUserView.prototype.events = {
    'submit form': 'submitForm',
    'click [href="#remove"]': 'clickRemove',
    'click [href="#importDropbox"]': 'clickImportDropbox',
    'click [href="#deploy"]': 'clickDeploy',
    'click [href="#disconnectDropbox"]': 'disconnectDropbox'
  };

  EditUserView.prototype.getTemplateData = function() {
    var ref, ref1;
    return _.extend(EditUserView.__super__.getTemplateData.apply(this, arguments), {
      currentUser: (ref = mediator.user) != null ? ref.toJSON() : void 0,
      isAdmin: this.model.hasRole('administrator'),
      dropboxEnabled: (ref1 = mediator.options) != null ? ref1.dropboxEnabled : void 0
    });
  };

  EditUserView.prototype.submitForm = function(e) {
    var data, name;
    e.preventDefault();
    data = this.formParams();
    data.roles = this.model.get('roles');
    if (data.admin) {
      if (!this.model.hasRole('administrator')) {
        data.roles.push({
          name: 'administrator'
        });
      }
    } else {
      data.roles = _.reject(data.roles, function(r) {
        return r.name === 'administrator';
      });
    }
    data.previewMode = data.previewMode != null;
    name = data.name;
    return this.submit(this.model.save(data, {
      wait: true
    })).done(function() {
      return toastr.success("Saved " + name + ".");
    });
  };

  EditUserView.prototype.clickRemove = function(e) {
    e.preventDefault();
    if (confirm('Are you sure?')) {
      return this.model.destroy({
        wait: true
      }).done((function(_this) {
        return function() {
          toastr.success('User has been removed.');
          return _this.dispose();
        };
      })(this));
    }
  };

  EditUserView.prototype.disconnectDropbox = function() {
    return e.preventDefault();
  };

  EditUserView.prototype.clickImportDropbox = function(e) {
    e.preventDefault();
    return $.post('/api/dropbox/import').done(function() {
      return toastr.success('Your personal preview environment has been updated.');
    });
  };

  EditUserView.prototype.clickDeploy = function(e) {
    e.preventDefault();
    return $.post('/api/builds').done(function() {
      return toastr.success('The website has been updated.');
    });
  };

  return EditUserView;

})(View);



},{"chaplin":"9U5Jgg","lib/view":"client/source/lib/view.coffee","templates/users/edit":"client/source/templates/users/edit.hbs","underscore":"l0hNr+","views/base/mixins/form":"client/source/views/base/mixins/form.coffee"}],"client/source/views/users/list.coffee":[function(require,module,exports){
var EditUserView, PageView, User, UsersList, _, tpl,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty;

_ = require('underscore');

PageView = require('views/base/page');

EditUserView = require('views/users/edit');

User = require('models/user');

tpl = require('templates/users/list');

module.exports = UsersList = (function(superClass) {
  extend(UsersList, superClass);

  function UsersList() {
    return UsersList.__super__.constructor.apply(this, arguments);
  }

  UsersList.prototype.template = tpl;

  UsersList.prototype.listen = {
    'sync collection': 'render'
  };

  UsersList.prototype.events = {
    'click [href="#add"]': 'clickAdd',
    'click .users a': 'clickEdit'
  };

  UsersList.prototype.regions = {
    'contactCard': '.detail'
  };

  UsersList.prototype.getTemplateData = function() {
    return _.extend(UsersList.__super__.getTemplateData.apply(this, arguments), {
      items: this.collection.toJSON()
    });
  };

  UsersList.prototype.render = function() {
    UsersList.__super__.render.apply(this, arguments);
    if (this.model) {
      return this.selectUser(this.model);
    }
  };

  UsersList.prototype.clickAdd = function(e) {
    var newUser;
    e.preventDefault();
    newUser = new User;
    this.$('.nav li').removeClass('active');
    this.listenToOnce(newUser, 'sync', (function(_this) {
      return function() {
        _this.collection.add(newUser);
        return _this.render();
      };
    })(this));
    return this.selectUser(newUser);
  };

  UsersList.prototype.selectUser = function(user) {
    var idx;
    this.model = user;
    idx = this.collection.indexOf(this.model);
    if (this.model) {
      if (idx >= 0) {
        this.$('.nav li').eq(idx).addClass('active').siblings().removeClass('active');
      }
      return this.subview('editUser', new EditUserView({
        model: this.model
      }));
    }
  };

  UsersList.prototype.clickEdit = function(e) {
    var $el, idx;
    e.preventDefault();
    $el = this.$(e.currentTarget);
    idx = $el.parent('li').index();
    return this.selectUser(this.collection.at(idx));
  };

  return UsersList;

})(PageView);



},{"models/user":"client/source/models/user.coffee","templates/users/list":"client/source/templates/users/list.hbs","underscore":"l0hNr+","views/base/page":"client/source/views/base/page.coffee","views/users/edit":"client/source/views/users/edit.coffee"}]},{},["2CpicB","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/auth_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/buckets_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/error_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/help_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/install_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/routes_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/settings_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/controllers/templates_controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/helpers.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/helpers/forms.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/lib/collection.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/lib/collection_view.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/lib/controller.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/lib/model.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/lib/view.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/mediator.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/bucket.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/buckets.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/build.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/buildfile.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/buildfiles.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/builds.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/entries.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/entry.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/field.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/fields.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/install.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/member.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/members.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/password_reset.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/route.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/routes.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/templates.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/user.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/models/users.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/routes.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/login.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/auth/reset.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/dashboard.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/edit.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/buckets/fields.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/browser.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/edit.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/list.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/entries/row.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/edit.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/input.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/fields/settings.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/install/firstuser.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/layouts/loggedin.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/members/list.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/edit.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/routes/list.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/settings/basic.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/directory.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/templates/editor.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/edit.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/templates/users/list.hbs","/Users/iuriikozuliak/Projects/buckets/client/source/views/auth/login.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/auth/reset_password.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/base/mixins/form.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/base/page.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/dashboard.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/edit.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/buckets/fields.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/browser.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/edit.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/list.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/entries/row.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/edit.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/input.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/fields/settings.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/help/doc.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/install/firstuser.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/layout.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/layouts/loggedin.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/members/list.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/missing.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/routes/edit.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/routes/list.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/settings/basic.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/templates/editor.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/users/edit.coffee","/Users/iuriikozuliak/Projects/buckets/client/source/views/users/list.coffee"]);