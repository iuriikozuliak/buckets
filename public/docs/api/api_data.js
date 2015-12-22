define({ api: [
  {
    "type": "delete",
    "url": "/buckets/:id",
    "title": "Remove a Bucket",
    "version": "0.0.4",
    "description": "<p>Removes a Bucket and all of its Entries.</p>",
    "group": "Buckets",
    "name": "DeleteBucket",
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 204\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "delete",
    "url": "/buckets/:id/members/:userID",
    "title": "Remove a Member",
    "description": "<p>Remove a member&#39;s access to a Bucket.</p>",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "DeleteMember",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>ID of the Bucket.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "userID",
            "optional": false,
            "description": "<p>ID of the User/member.</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"name\": \"Deandra Reynolds\",\n    \"email\": \"sweetdee@buckets.io\",\n    \"roles\": [\n      {\n        \"name\": \"contributor\",\n        \"resourceType\": \"Bucket\",\n        \"resourceId\": \"53f8de974bbbbded1dd21e66\",\n        \"id\": \"53f9057c50c7a4b233330a4e\"\n      }\n    ],\n    \"date_created\": \"2014-08-23T21:16:33.919Z\",\n    \"last_active\": \"2014-08-23T21:16:33.919Z\",\n    \"email_hash\": \"b7c1344f136d04570abbb1fe3c2d88ff\",\n    \"id\": \"53f904b113341f75338bfe1a\",\n    \"role\": \"contributor\",\n    \"bucketId\": \"53f8de974bbbbded1dd21e66\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "get",
    "url": "/buckets",
    "title": "Get Buckets",
    "description": "<p>List Buckets you have access to.</p>",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "GetBuckets",
    "permission": "contributor/editor/administrator",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "field": "results",
            "optional": false,
            "description": "<p>List of buckets. <em>Currently, this endpoint simply returns an the results array directly — we will switch to always using an Object with &quot;results&quot; keys soon.</em></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"singular\": \"Article\",\n    \"name\": \"Articles\",\n    \"slug\": \"articles\",\n    \"fields\": [\n      {\n        \"name\": \"Body\",\n        \"slug\": \"body\",\n        \"fieldType\": \"markdown\",\n        \"settings\": {\n          \"size\": \"lg\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e67\"\n      }\n    ],\n    \"color\": \"teal\",\n    \"icon\": \"edit\",\n    \"titleLabel\": \"Title\",\n    \"id\": \"53f8de974bbbbded1dd21e66\"\n  },\n  {\n    \"singular\": \"Meetup\",\n    \"name\": \"Meetups\",\n    \"slug\": \"meetups\",\n    \"fields\": [\n      {\n        \"name\": \"Body\",\n        \"slug\": \"body\",\n        \"fieldType\": \"markdown\",\n        \"settings\": {\n          \"size\": \"lg\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e6a\"\n      },\n      {\n        \"name\": \"Location\",\n        \"slug\": \"location\",\n        \"fieldType\": \"location\",\n        \"settings\": {\n          \"placeholder\": \"Address\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e69\"\n      }\n    ],\n    \"color\": \"red\",\n    \"icon\": \"calendar\",\n    \"titleLabel\": \"Title\",\n    \"id\": \"53f8de974bbbbded1dd21e68\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "get",
    "url": "/buckets/:id/members",
    "title": "Get Members",
    "description": "<p>Get current members of a Bucket (ie. editors and contributors)</p>",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "GetMembers",
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"name\": \"Deandra Reynolds\",\n    \"email\": \"sweetdee@buckets.io\",\n    \"roles\": [\n      {\n        \"name\": \"contributor\",\n        \"resourceType\": \"Bucket\",\n        \"resourceId\": \"53f8de974bbbbded1dd21e66\",\n        \"id\": \"53f9057c50c7a4b233330a4e\"\n      }\n    ],\n    \"date_created\": \"2014-08-23T21:16:33.919Z\",\n    \"last_active\": \"2014-08-23T21:16:33.919Z\",\n    \"email_hash\": \"b7c1344f136d04570abbb1fe3c2d88ff\",\n    \"id\": \"53f904b113341f75338bfe1a\",\n    \"role\": \"contributor\",\n    \"bucketId\": \"53f8de974bbbbded1dd21e66\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "post",
    "url": "/buckets",
    "title": "Create a Bucket",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "PostBucket",
    "permission": "administrator",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "name",
            "optional": false,
            "description": "<p>Name of the Bucket. Typically in plural form, eg. &quot;Articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "slug",
            "optional": false,
            "description": "<p>Slug for the bucket, a string without spaces, for use in template tags and API calls, eg. &quot;articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "titlePlaceholder",
            "defaultValue": "New {{singular}}",
            "optional": true,
            "description": "<p>The placeholder text used when a user is adding a new Entry into this Bucket.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "field": "fields",
            "optional": true,
            "description": "<p>Array of Fields for this Bucket. Fields define the structure of a Bucket’s content.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.name",
            "optional": false,
            "description": "<p>Name of the field (used for UI labels).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.slug",
            "optional": false,
            "description": "<p>Slug for the field, used in templates as the field’s key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.fieldType",
            "optional": false,
            "description": "<p>The type of Field, which defines how its input form is rendered, how it is validated, and how it saves data to the database. The fieldType value <strong>must</strong> match a FieldType provided by Buckets by default (<code>text</code>, <code>textarea</code>, <code>checkbox</code>, <code>number</code>), or an installed Buckets plugin (<code>location</code> and <code>markdown</code> are currently built-in by default).</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "field": "fields.required",
            "optional": true,
            "description": "<p>Set to true if you want this field to be required.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.instructions",
            "optional": true,
            "description": "<p>Optional instructions to show in the UI with the field.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "field": "fields.settings",
            "optional": true,
            "description": "<p>Optional key-value storage for a Field&#39;s settings.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "color",
            "defaultValue": "teal",
            "optional": true,
            "description": "<p>Color for the Bucket, with options of &#39;teal&#39;, &#39;purple&#39;, &#39;red&#39;, &#39;yellow&#39;, &#39;blue&#39;, &#39;orange&#39;, and &#39;green&#39;.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "icon",
            "defaultValue": "edit",
            "optional": true,
            "description": "<p>Icon for the Bucket, one of &#39;edit&#39;, &#39;photos&#39;, &#39;calendar&#39;, &#39;movie&#39;, &#39;music-note&#39;, &#39;map-pin&#39;, &#39;quote&#39;, &#39;artboard&#39;, or &#39;contacts-1&#39; (subject to change...)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "singular",
            "optional": true,
            "description": "<p>The name of one &quot;Entry&quot; within this Bucket, eg. &quot;Article.&quot; Will automatically be created using an inflection library.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n{\n  color: \"red\"\n  fields: []\n  icon: \"calendar\"\n  id: \"53f7a4ccfae2c95b086e6815\"\n  name: \"Meetups\"\n  singular: \"Meetup\"\n  slug: \"meetups\"\n  titleLabel: \"Title\"\n}\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "put",
    "url": "/buckets/:id/members/:userID",
    "title": "Add a Member",
    "description": "<p>Add a member (contributor or editor) to a Bucket.</p>",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "PostMember",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>ID of the Bucket.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "userID",
            "optional": false,
            "description": "<p>ID of the User/member.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "role",
            "optional": false,
            "description": "<p>Either &#39;contributor&#39; or &#39;editor&#39;.</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"name\": \"Deandra Reynolds\",\n    \"email\": \"sweetdee@buckets.io\",\n    \"roles\": [\n      {\n        \"name\": \"contributor\",\n        \"resourceType\": \"Bucket\",\n        \"resourceId\": \"53f8de974bbbbded1dd21e66\",\n        \"id\": \"53f9057c50c7a4b233330a4e\"\n      }\n    ],\n    \"date_created\": \"2014-08-23T21:16:33.919Z\",\n    \"last_active\": \"2014-08-23T21:16:33.919Z\",\n    \"email_hash\": \"b7c1344f136d04570abbb1fe3c2d88ff\",\n    \"id\": \"53f904b113341f75338bfe1a\",\n    \"role\": \"contributor\",\n    \"bucketId\": \"53f8de974bbbbded1dd21e66\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "put",
    "url": "/buckets/:id",
    "title": "Update a Bucket",
    "version": "0.0.4",
    "group": "Buckets",
    "name": "PutBucket",
    "permission": "administrator",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "name",
            "optional": false,
            "description": "<p>Name of the Bucket. Typically in plural form, eg. &quot;Articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "slug",
            "optional": false,
            "description": "<p>Slug for the bucket, a string without spaces, for use in template tags and API calls, eg. &quot;articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "titlePlaceholder",
            "defaultValue": "New {{singular}}",
            "optional": true,
            "description": "<p>The placeholder text used when a user is adding a new Entry into this Bucket.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "field": "fields",
            "optional": true,
            "description": "<p>Array of Fields for this Bucket. Fields define the structure of a Bucket’s content.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.name",
            "optional": false,
            "description": "<p>Name of the field (used for UI labels).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.slug",
            "optional": false,
            "description": "<p>Slug for the field, used in templates as the field’s key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.fieldType",
            "optional": false,
            "description": "<p>The type of Field, which defines how its input form is rendered, how it is validated, and how it saves data to the database. The fieldType value <strong>must</strong> match a FieldType provided by Buckets by default (<code>text</code>, <code>textarea</code>, <code>checkbox</code>, <code>number</code>), or an installed Buckets plugin (<code>location</code> and <code>markdown</code> are currently built-in by default).</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "field": "fields.required",
            "optional": true,
            "description": "<p>Set to true if you want this field to be required.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.instructions",
            "optional": true,
            "description": "<p>Optional instructions to show in the UI with the field.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "field": "fields.settings",
            "optional": true,
            "description": "<p>Optional key-value storage for a Field&#39;s settings.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "color",
            "defaultValue": "teal",
            "optional": true,
            "description": "<p>Color for the Bucket, with options of &#39;teal&#39;, &#39;purple&#39;, &#39;red&#39;, &#39;yellow&#39;, &#39;blue&#39;, &#39;orange&#39;, and &#39;green&#39;.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "icon",
            "defaultValue": "edit",
            "optional": true,
            "description": "<p>Icon for the Bucket, one of &#39;edit&#39;, &#39;photos&#39;, &#39;calendar&#39;, &#39;movie&#39;, &#39;music-note&#39;, &#39;map-pin&#39;, &#39;quote&#39;, &#39;artboard&#39;, or &#39;contacts-1&#39; (subject to change...)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "singular",
            "optional": true,
            "description": "<p>The name of one &quot;Entry&quot; within this Bucket, eg. &quot;Article.&quot; Will automatically be created using an inflection library.</p>"
          }
        ]
      }
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n{\n  color: \"red\"\n  fields: []\n  icon: \"calendar\"\n  id: \"53f7a4ccfae2c95b086e6815\"\n  name: \"Meetups\"\n  singular: \"Meetup\"\n  slug: \"meetups\"\n  titleLabel: \"Title\"\n}\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "type": "delete",
    "url": "/entries/:id",
    "title": "Remove an Entry",
    "version": "0.0.4",
    "group": "Entries",
    "name": "DeleteEntry",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>Entry&#39;s unique ID.</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "get",
    "url": "/entries",
    "title": "Get Entries",
    "description": "<p>This is the primary endpoint for retrieving a list of entries, regardless of Bucket. By default, it will respond with an RSS-style list of entries, ie. Only entries which are live, and dated in the past. It&#39;s easy to customize what types of entries are retrieved, though, with a variety of flexible, optional parameters.</p>",
    "version": "0.0.4",
    "group": "Entries",
    "name": "GetEntries",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "bucket",
            "optional": true,
            "description": "<p>A single, or pipeline-separated, list of Bucket slugs with which to filter entries, eg. &#39;articles|videos&#39;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "since",
            "optional": true,
            "description": "<p>A string representing an bottom limit on the publishDate of an Entry. Can be any standard DateTime format, or a relative date, like &quot;Yesterday&quot;.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "until",
            "defaultValue": "Now",
            "optional": true,
            "description": "<p>A string representing an upper limit on the publishDate of an Entry. Can be any standard DateTime format, or a relative date, like &quot;Yesterday&quot;.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "field": "limit",
            "defaultValue": "10",
            "optional": true,
            "description": "<p>The maximum number of Entries to return. Useful for pagination.</p>"
          },
          {
            "group": "Parameter",
            "type": "Number",
            "field": "skip",
            "optional": true,
            "description": "<p>The number of Entries to skip. Useful for pagination.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "status",
            "defaultValue": "live",
            "optional": true,
            "description": "<p>The status of items to return. Can pass an empty string for all types. Available options are &#39;live&#39;, &#39;draft&#39;, &#39;submitted&#39;, and &#39;rejected&#39;.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "sort",
            "defaultValue": "-publishDate",
            "optional": true,
            "description": "<p>How items are sorted. Uses a <a href=\"#\">mongoose style sort string</a>.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "slug",
            "optional": true,
            "description": "<p>A slug for a specific Entry to retrieve.</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "get",
    "url": "/entries/:id",
    "title": "Get Entry",
    "version": "0.0.4",
    "group": "Entries",
    "name": "GetEntry",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>Entry&#39;s unique ID (sent with the URL).</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "get",
    "url": "/entries/keywords",
    "title": "Get keywords",
    "group": "Entries",
    "name": "GetKeywords",
    "version": "0.0.5",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "field": "keywords",
            "optional": false,
            "description": "<p>Array of unique keywords.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "field": "keywords.keyword",
            "optional": false,
            "description": "<p>Array of unique keywords.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "field": "keywords.count",
            "optional": false,
            "description": "<p>Number of times this keyword has been used.</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "get",
    "url": "/entries/keywords",
    "title": "Get keywords",
    "description": "<p>Show distinct keywords used across all entries.</p>",
    "version": "0.0.4",
    "group": "Entries",
    "name": "GetKeywords",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Array",
            "field": "keywords",
            "optional": false,
            "description": "<p>Array of unique keywords.</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "post",
    "url": "/entries",
    "title": "Create an entry",
    "version": "0.0.5",
    "group": "Entries",
    "name": "PostEntry",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "bucket",
            "optional": false,
            "description": "<p>Bucket ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "author",
            "optional": false,
            "description": "<p>Author ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "status",
            "defaultValue": "live",
            "optional": true,
            "description": "<p>One of &#39;draft&#39;, &#39;live&#39;, &#39;pending&#39;, or &#39;rejected&#39;. <em>See below for differences for contributors.</em></p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "publishDate",
            "defaultValue": "Now",
            "optional": true,
            "description": "<p>Can accept a DateTime or a relative date (eg. &quot;Tomorrow at 9am&quot;).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "keywords",
            "optional": true,
            "description": "<p>String of comma-separated keywords used for tagging and/or search results.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "description",
            "optional": true,
            "description": "<p>Description used for search results.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "field": "content",
            "optional": false,
            "description": "<p>An special field for an object with custom field data. The accepted custom fields for an Entry depend on it’s which Bucket is it assigned to.</p>"
          }
        ],
        "Contributors": [
          {
            "group": "Contributors",
            "type": "String",
            "field": "status",
            "defaultValue": "submitted",
            "optional": true,
            "description": "<p>Available options are &#39;draft&#39; and &#39;submitted&#39; (using <code>live</code> will automatically switch to <code>submitted</code>).</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "post",
    "url": "/entries",
    "title": "Create an entry",
    "version": "0.0.4",
    "group": "Entries",
    "name": "PostEntry",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "bucket",
            "optional": false,
            "description": "<p>Bucket ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "author",
            "optional": false,
            "description": "<p>Author ID</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "status",
            "defaultValue": "live",
            "optional": true,
            "description": "<p>One of &#39;draft&#39;, &#39;live&#39;, &#39;pending&#39;, or &#39;rejected&#39;. <em>See below for differences for contributors.</em></p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "publishDate",
            "defaultValue": "Now",
            "optional": true,
            "description": "<p>Can accept a DateTime or a relative date (eg. &quot;Tomorrow at 9am&quot;).</p>"
          },
          {
            "group": "Parameter",
            "type": "Array",
            "field": "keywords",
            "optional": true,
            "description": "<p>Array of keywords (or comma-separated String) used for tagging and/or search results.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "description",
            "optional": true,
            "description": "<p>Description used for search results.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "field": "content",
            "optional": false,
            "description": "<p>An special field for an object with custom field data. The accepted custom fields for an Entry depend on it’s which Bucket is it assigned to.</p>"
          }
        ],
        "Contributors": [
          {
            "group": "Contributors",
            "type": "String",
            "field": "status",
            "defaultValue": "submitted",
            "optional": true,
            "description": "<p>Available options are &#39;draft&#39; and &#39;submitted&#39; (using <code>live</code> will automatically switch to <code>submitted</code>).</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "put",
    "url": "/entries/:id",
    "title": "Update an Entry",
    "version": "0.0.4",
    "group": "Entries",
    "name": "PutEntry",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>Entry&#39;s unique ID.</p>"
          }
        ]
      }
    },
    "filename": "server/routes/api/entries.coffee"
  },
  {
    "type": "get",
    "url": "/routes",
    "title": "Get Routes",
    "version": "0.0.4",
    "group": "Routes",
    "groupDescription": "<p>Routes can be saved by Users and are a way to match frontend URL patterns to templates.</p>",
    "name": "GetRoutes",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "template",
            "optional": false,
            "description": "<p>=index Currently, this is file-based, though it may be tracked in the database soon.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "urlPattern",
            "defaultValue": "/",
            "optional": true,
            "description": "<p>An <a href=\"https://github.com/component/path-to-regexp\">Express-style URL pattern</a> (which captures named parameters).</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n{\n  \"urlPatternRegex\":{},\n  \"urlPattern\":\"/\",\n  \"template\":\"index\",\n  \"createdDate\":\"2014-08-16T05:26:40.367Z\",\n  \"keys\":[],\n  \"id\":\"53eeeb90605b111826ddd57c\"\n},\n{\n  \"urlPatternRegex\":{},\n  \"urlPattern\":\"/:slug\",\n  \"template\":\"index\",\n  \"createdDate\":\"2014-08-16T05:26:40.369Z\",\n  \"keys\":[\n    {\n      \"name\":\"slug\",\n      \"delimiter\":\"/\",\n      \"optional\":false,\n      \"repeat\":false\n    }\n  ],\n  \"id\":\"53eeeb90605b111826ddd57d\"\n}\n]\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/routes.coffee"
  },
  {
    "type": "post",
    "url": "/routes",
    "title": "Create a Route",
    "version": "0.0.4",
    "group": "Routes",
    "name": "GetRoutes",
    "permission": "administrator",
    "filename": "server/routes/api/routes.coffee"
  },
  {
    "type": "post",
    "url": "/routes/:id",
    "title": "Remove a Route",
    "version": "0.0.4",
    "group": "Routes",
    "name": "GetRoutes",
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 204 No Content\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/routes.coffee"
  },
  {
    "type": "post",
    "url": "/routes",
    "title": "Update a Route",
    "version": "0.0.4",
    "group": "Routes",
    "name": "PutRoute",
    "permission": "administrator",
    "filename": "server/routes/api/routes.coffee"
  },
  {
    "type": "delete",
    "url": "/users/:id",
    "title": "Delete a User",
    "version": "0.0.4",
    "group": "Users",
    "name": "DeleteUser",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>User ID (sent in URL)</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n  HTTP/1.1 204\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/users.coffee"
  },
  {
    "type": "get",
    "url": "/users/:id",
    "title": "Request a User",
    "version": "0.0.4",
    "group": "Users",
    "name": "GetUser",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>User ID (sent in URL)</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200\n{\n  \"name\": \"David Kaneda\",\n  \"email\": \"dave@buckets.io\",\n  \"roles\": [\n    {\n      \"name\": \"administrator\"\n    }\n  ],\n  \"date_created\": \"2014-08-16T05:26:40.285Z\",\n  \"last_active\": \"2014-08-16T05:26:40.285Z\",\n  \"email_hash\": \"4f731655f6de1f6728c716448e0ba634\",\n  \"id\": \"53eeeb90605b111826ddd57a\"\n}\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/users.coffee"
  },
  {
    "type": "get",
    "url": "/users",
    "title": "Request Users",
    "version": "0.0.4",
    "group": "Users",
    "name": "GetUsers",
    "permission": "administrator",
    "filename": "server/routes/api/users.coffee"
  },
  {
    "type": "post",
    "url": "/users",
    "title": "Add a User",
    "version": "0.0.4",
    "group": "Users",
    "name": "PostUser",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "name",
            "optional": false,
            "description": "<p>Full name of the user.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "email",
            "optional": false,
            "description": "<p>Email address of the user.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "password",
            "optional": false,
            "description": "<p>Password for the user. Must be between 6-20 characters and include a number.</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "filename": "server/routes/api/users.coffee"
  },
  {
    "type": "put",
    "url": "/users/:id",
    "title": "Edit a User",
    "version": "0.0.4",
    "group": "Users",
    "name": "PutUser",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "id",
            "optional": false,
            "description": "<p>User ID (sent in URL)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "name",
            "optional": true,
            "description": "<p>The full name of the user.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "email",
            "optional": true,
            "description": "<p>The user’s email address.</p>"
          }
        ],
        "Changing password": [
          {
            "group": "Changing password",
            "type": "String",
            "field": "password",
            "optional": true,
            "description": "<p>The new password you would like to use.</p>"
          },
          {
            "group": "Changing password",
            "type": "String",
            "field": "passwordconfirm",
            "optional": true,
            "description": "<p>The new password you would like to use.</p>"
          },
          {
            "group": "Changing password",
            "type": "String",
            "field": "oldpassword",
            "optional": true,
            "description": "<p>Your current password.</p>"
          }
        ]
      }
    },
    "permission": "administrator",
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\n  HTTP/1.1 200 OK\n",
          "type": "json"
        },
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200\n{\n  \"name\": \"David Kaneda\",\n  \"email\": \"dave@buckets.io\",\n  \"roles\": [\n    {\n      \"name\": \"administrator\"\n    }\n  ],\n  \"date_created\": \"2014-08-16T05:26:40.285Z\",\n  \"last_active\": \"2014-08-16T05:26:40.285Z\",\n  \"email_hash\": \"4f731655f6de1f6728c716448e0ba634\",\n  \"id\": \"53eeeb90605b111826ddd57a\"\n}\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/users.coffee"
  },
  {
    "type": "post",
    "url": "/forgot",
    "title": "Request a Password Reset",
    "description": "<p>Will look for the provided email, generate a reset token, and send a password reset email to the matching user.</p>",
    "version": "0.0.4",
    "group": "Users",
    "name": "ResetPassword",
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "email",
            "optional": false,
            "description": "<p>User’s email address</p>"
          }
        ]
      }
    },
    "error": {
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\n  HTTP/1.1 400\n",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "Error-Response:\nHTTP/1.1 404 Not Found\n{\n  \"error\": \"UserNotFound\"\n}\n",
          "type": "json"
        }
      ]
    },
    "filename": "server/routes/api/users.coffee"
  },
  {
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"name\": \"Deandra Reynolds\",\n    \"email\": \"sweetdee@buckets.io\",\n    \"roles\": [\n      {\n        \"name\": \"contributor\",\n        \"resourceType\": \"Bucket\",\n        \"resourceId\": \"53f8de974bbbbded1dd21e66\",\n        \"id\": \"53f9057c50c7a4b233330a4e\"\n      }\n    ],\n    \"date_created\": \"2014-08-23T21:16:33.919Z\",\n    \"last_active\": \"2014-08-23T21:16:33.919Z\",\n    \"email_hash\": \"b7c1344f136d04570abbb1fe3c2d88ff\",\n    \"id\": \"53f904b113341f75338bfe1a\",\n    \"role\": \"contributor\",\n    \"bucketId\": \"53f8de974bbbbded1dd21e66\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "group": "buckets_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "Object[]",
            "field": "results",
            "optional": false,
            "description": "<p>List of buckets. <em>Currently, this endpoint simply returns an the results array directly — we will switch to always using an Object with &quot;results&quot; keys soon.</em></p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n[\n  {\n    \"singular\": \"Article\",\n    \"name\": \"Articles\",\n    \"slug\": \"articles\",\n    \"fields\": [\n      {\n        \"name\": \"Body\",\n        \"slug\": \"body\",\n        \"fieldType\": \"markdown\",\n        \"settings\": {\n          \"size\": \"lg\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e67\"\n      }\n    ],\n    \"color\": \"teal\",\n    \"icon\": \"edit\",\n    \"titleLabel\": \"Title\",\n    \"id\": \"53f8de974bbbbded1dd21e66\"\n  },\n  {\n    \"singular\": \"Meetup\",\n    \"name\": \"Meetups\",\n    \"slug\": \"meetups\",\n    \"fields\": [\n      {\n        \"name\": \"Body\",\n        \"slug\": \"body\",\n        \"fieldType\": \"markdown\",\n        \"settings\": {\n          \"size\": \"lg\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e6a\"\n      },\n      {\n        \"name\": \"Location\",\n        \"slug\": \"location\",\n        \"fieldType\": \"location\",\n        \"settings\": {\n          \"placeholder\": \"Address\"\n        },\n        \"dateCreated\": \"2014-08-23T18:33:40.813Z\",\n        \"id\": \"53f8de974bbbbded1dd21e69\"\n      }\n    ],\n    \"color\": \"red\",\n    \"icon\": \"calendar\",\n    \"titleLabel\": \"Title\",\n    \"id\": \"53f8de974bbbbded1dd21e68\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "group": "buckets_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200 OK\n{\n  color: \"red\"\n  fields: []\n  icon: \"calendar\"\n  id: \"53f7a4ccfae2c95b086e6815\"\n  name: \"Meetups\"\n  singular: \"Meetup\"\n  slug: \"meetups\"\n  titleLabel: \"Title\"\n}\n",
          "type": "json"
        }
      ]
    },
    "group": "buckets_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "String",
            "field": "name",
            "optional": false,
            "description": "<p>Name of the Bucket. Typically in plural form, eg. &quot;Articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "slug",
            "optional": false,
            "description": "<p>Slug for the bucket, a string without spaces, for use in template tags and API calls, eg. &quot;articles&quot;</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "titlePlaceholder",
            "defaultValue": "New {{singular}}",
            "optional": true,
            "description": "<p>The placeholder text used when a user is adding a new Entry into this Bucket.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object[]",
            "field": "fields",
            "optional": true,
            "description": "<p>Array of Fields for this Bucket. Fields define the structure of a Bucket’s content.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.name",
            "optional": false,
            "description": "<p>Name of the field (used for UI labels).</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.slug",
            "optional": false,
            "description": "<p>Slug for the field, used in templates as the field’s key.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.fieldType",
            "optional": false,
            "description": "<p>The type of Field, which defines how its input form is rendered, how it is validated, and how it saves data to the database. The fieldType value <strong>must</strong> match a FieldType provided by Buckets by default (<code>text</code>, <code>textarea</code>, <code>checkbox</code>, <code>number</code>), or an installed Buckets plugin (<code>location</code> and <code>markdown</code> are currently built-in by default).</p>"
          },
          {
            "group": "Parameter",
            "type": "Boolean",
            "field": "fields.required",
            "optional": true,
            "description": "<p>Set to true if you want this field to be required.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "fields.instructions",
            "optional": true,
            "description": "<p>Optional instructions to show in the UI with the field.</p>"
          },
          {
            "group": "Parameter",
            "type": "Object",
            "field": "fields.settings",
            "optional": true,
            "description": "<p>Optional key-value storage for a Field&#39;s settings.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "color",
            "defaultValue": "teal",
            "optional": true,
            "description": "<p>Color for the Bucket, with options of &#39;teal&#39;, &#39;purple&#39;, &#39;red&#39;, &#39;yellow&#39;, &#39;blue&#39;, &#39;orange&#39;, and &#39;green&#39;.</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "icon",
            "defaultValue": "edit",
            "optional": true,
            "description": "<p>Icon for the Bucket, one of &#39;edit&#39;, &#39;photos&#39;, &#39;calendar&#39;, &#39;movie&#39;, &#39;music-note&#39;, &#39;map-pin&#39;, &#39;quote&#39;, &#39;artboard&#39;, or &#39;contacts-1&#39; (subject to change...)</p>"
          },
          {
            "group": "Parameter",
            "type": "String",
            "field": "singular",
            "optional": true,
            "description": "<p>The name of one &quot;Entry&quot; within this Bucket, eg. &quot;Article.&quot; Will automatically be created using an inflection library.</p>"
          }
        ]
      }
    },
    "group": "buckets_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/buckets.coffee"
  },
  {
    "success": {
      "examples": [
        {
          "title": "Success-Reponse:",
          "content": "Success-Reponse:\nHTTP/1.1 200\n[\n  {\n    \"name\": \"John Doe\",\n    \"email\": \"dk+jd@morfunk.com\",\n    \"activated\": false,\n    \"roles\": [],\n    \"date_created\": \"2014-08-17T09:45:34.230Z\",\n    \"last_active\": \"2014-08-17T09:45:34.230Z\",\n    \"email_hash\": \"64283570c25b53351129add2aba830fb\",\n    \"id\": \"53f079bebabd1e1c98b718b9\"\n  },\n  {\n    \"name\": \"Jane Doe\",\n    \"email\": \"dk+jane@morfunk.com\",\n    \"activated\": false,\n    \"roles\": [],\n    \"date_created\": \"2014-08-17T09:45:49.163Z\",\n    \"last_active\": \"2014-08-17T09:45:49.163Z\",\n    \"email_hash\": \"3161ceeed1a05982dd3a69e39b22320e\",\n    \"id\": \"53f079cdbabd1e1c98b718bb\"\n  }\n]\n",
          "type": "json"
        }
      ]
    },
    "group": "users_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/users.coffee"
  },
  {
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "Success-Response:\nHTTP/1.1 200\n{\n  \"name\": \"David Kaneda\",\n  \"email\": \"dave@buckets.io\",\n  \"roles\": [\n    {\n      \"name\": \"administrator\"\n    }\n  ],\n  \"date_created\": \"2014-08-16T05:26:40.285Z\",\n  \"last_active\": \"2014-08-16T05:26:40.285Z\",\n  \"email_hash\": \"4f731655f6de1f6728c716448e0ba634\",\n  \"id\": \"53eeeb90605b111826ddd57a\"\n}\n",
          "type": "json"
        }
      ]
    },
    "group": "users_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/users.coffee"
  },
  {
    "error": {
      "examples": [
        {
          "title": "Error-Response:",
          "content": "Error-Response:\nHTTP/1.1 404 Not Found\n{\n  \"error\": \"UserNotFound\"\n}\n",
          "type": "json"
        }
      ]
    },
    "group": "users_coffee",
    "type": "",
    "url": "",
    "version": "0.0.0",
    "filename": "server/routes/api/users.coffee"
  }
] });