# Yamlinc
Crate a composed YAML file using $include tag. 

## Simple usage

1. Install global yamlinc command-line utility
```
npm install yamlinc -g
```

2. Create "my_swagger_doc.yml" and split it into multiple file  
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
w  get: ...      
/api/other/two:
  post: ...
```

3. Simply compile the entry point 'my_swagger_doc.yml'
```
$ yamlinc my_swagger_doc.yml
```

4. Get your compiled file 'my_swagger_doc.inc.yml'
> **NOTICE:** Ymalinc append '*.inc.yml' extension to compiled file.

## Develompment watcher
During development you need costantily updated compiled file by watching changes of dependences

```
$ yamlinc --watch spectacle -d my_swagger_doc.yml
```






