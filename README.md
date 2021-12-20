![npm](https://img.shields.io/npm/v/eloquify)

## Eloquify
This small library is Eloquent-like orm for node which is inspired by laravel's [eloquent](https://laravel.com/docs/8.x/eloquent) orm. If you switch from laravel project to node project, you will lose all of the eloquent's features. You can use this library as an alternative to query your database in an eloquent way. Like any other node orm, eloquify uses `promise`.

### Installation
```
$ npm install eloquify
```

### Getting Started
First thing you need to do is to set the database configuration using `dbConfig` function before executing any query: 
```
const {dbConfig} = require('eloquify')

dbConfig({
    driver: 'pg',
    user: 'postgres',
    host: 'localhost',
    database: 'database',
    password: 'postgres',
    port: 5432,
})
```

At this time, eloquify only supports PostgreSql and MySql. Set `driver` configuration to `pg` to use PostgreSql and `my-sql` to use MySql. You can omit the `port` configuration when using `my-sql` driver.

### Features
* Query Builder
* Soft Delete
* Relationship

### Example
```
const posts = await Post
    .as('p')
    .select('p.id, p.content, p.created_at, c.name as category_name')
    .join(Category.as('c'), 'c.id = p.category_id')
    .with('member', { comments: q => q.desc() })
    .has('comments', '>', 10)
    .where('p.created_at', '>', '2021-06-06')
    .where(q => {
        q.where('p.is_public', true).orWhere('m.status', '>', 2)
    })
    .desc()
    .limit(20)
    .get()
    
const post = await Post.create({
    content: 'Hello Bro',
    category_id: 3
})
```

For full documentation, please visit https://eloquify.ib-ganz.dev/docs/v2

If you find a bug, please report it on github.

### TODO
* whereDate, year, month
* set primary key
* aggregate
