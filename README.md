# Yamlinc
Create a composed YAML file using $include tag.

[![NPM](https://nodei.co/npm/yamlinc.png?compact=true)](https://nodei.co/npm/yamlinc/)

[![Build Status](https://travis-ci.org/javanile-bot/yamlinc.svg?branch=master)](https://travis-ci.org/javanile-bot/yamlinc)
[![Test Coverage](https://api.codeclimate.com/v1/badges/43662de1f27dc3629953/test_coverage)](https://codeclimate.com/github/javanile-bot/yamlinc/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/43662de1f27dc3629953/maintainability)](https://codeclimate.com/github/javanile-bot/yamlinc/maintainability)

## Simple usage

**STEP #1** - Install global yamlinc command-line utility
```bash
$ npm install -g yamlinc
```

**STEP #2** - Create "my_swagger_doc.yml" and split it into multiple file  
```yaml
## file: my_swagger_doc.yml
version: '2.0'
$include: ./tags.yml
$include: ./paths.yml
```
```yaml
## file: tags.yml
tags:
- FirstTag
- SecondTag
```
```yaml
## file: paths.yml
paths:
  /api/me:
    get: ...      
  /api/you:
    post: ...
  $include: others-paths.yml
```
```yaml
## file: others-paths.yml
/api/other/one:
  get: ...      
/api/other/two:
  post: ...
```

**STEP #3** - Simply compile the entry point 'my_swagger_doc.yml'
```bash
$ yamlinc my_swagger_doc.yml
```

**STEP #4** - Get your compiled file 'my_swagger_doc.inc.yml'
> **NOTICE:** Yamlinc appends '*.inc.yml' extension to compiled file.

## Development watcher
During development you need constantily updated compiled file by watching changes of dependencies

```bash
$ yamlinc --watch spectacle -d my_swagger_doc.yml
```

This example generates documentation with [spectacle](https://github.com/sourcey/spectacle)

## Feed your .inc.yml file
If your application needs a compiled file as parameter you can simply compound and feed

```bash
$ yamlinc --exec docker-compose -f docker-compose.yml
```

## Redirect output to another command
If your application needs send output to another command or chaining using pipe follow this example

```bash
$ yamlinc --output - input.yml | nc seashells.io 1337
```

## Parse files to find syntax errors
If your application needs stop after a syntax error or missing file inclusion use strict mode

```bash
$ yamlinc --strict settings.yml
```

### Use an external schema
If you have your own or a third party schema you can pass it to yamlinc like this

```bash
$ yamlinc --schema ../node_modules/cloudformation-schema-js-yaml
```

## Create your scenario
If you have custom scenario with YAML file please place issues on the following page

https://github.com/javanile/yamlinc/issues/new
