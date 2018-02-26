# yamlinc
Create a composed YAML file using $include tag. 

[![NPM](https://nodei.co/npm/yamlinc.png?compact=true)](https://nodei.co/npm/yamlinc/)

[![Build Status](https://travis-ci.org/javanile-bot/yamlinc.svg?branch=master)](https://travis-ci.org/javanile-bot/yamlinc)
[![Test Coverage](https://api.codeclimate.com/v1/badges/43662de1f27dc3629953/test_coverage)](https://codeclimate.com/github/javanile-bot/yamlinc/test_coverage)
[![Maintainability](https://api.codeclimate.com/v1/badges/43662de1f27dc3629953/maintainability)](https://codeclimate.com/github/javanile-bot/yamlinc/maintainability)

## Simple usage

**STEP 1** - Install global yamlinc command-line utility
```bash
$ npm install -g yamlinc
```

**STEP 2** - Create "my_swagger_doc.yml" and split it into multiple file  
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

**STEP 3** - Simply compile the entry point 'my_swagger_doc.yml'
```
$ yamlinc my_swagger_doc.yml
```

**STEP 4** - Get your compiled file 'my_swagger_doc.inc.yml'
> **NOTICE:** Ymalinc append '*.inc.yml' extension to compiled file.

## Development watcher
During development you need costantily updated compiled file by watching changes of dependences

```
$ yamlinc --watch spectacle -d my_swagger_doc.yml
```

## Feed your .inc.yml file
If your application need a copiled file as parameter you simple compound and feed 

```
$ yamlinc --exec docker-compose -f docker-compose.yml
```

## Create your scenario
If you have custom scenario with YAML file please place an issues on the follow page

https://github.com/javanile/yamlinc/issues





