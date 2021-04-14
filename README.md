## Eloquify
This small library is Eloquent-like orm for node which is inspired by laravel's [eloquent](https://laravel.com/docs/8.x/eloquent) orm. If you switch from laravel project to node project, you will lose all of the eloquent's features. You can use this library as an alternative to query your database in an eloquent way. Like any other node orm, eloquify uses `promise`.

### Setup
Just copy paste the whole code to your project and you're good to go.

### Getting Started

#### Creating Model
Model class is just an advanced query builder, so you can perform some sql operations on it. To create a model, you can accomplish this by creating a `class` that extends `Model`. 
```
class Post extends Model {

}
```
This class will be automatically associated with table named `post` in your database. 
> This behaviour is different from what eloquent does. Eloquent considers "snake case", plural name of the class as the table name if not specified explicitly.

If you want to change the name of the associated table, you may call `setTable` method inside `init` method.
```
class Post extends Model {
    init {
        this.setTable('posts')
    }
}
```
At this time, all tables in your database should have primary key named `id`. This is for generating next id when you create a new row in your table. Changing the name of the primary key has not supported yet. Eloquify has not yet supported of changing primary key.

#### Getting some data
The following will get records from `post` table:
```
const posts = await Post.all()
```
This is the equivalent of writing `SELECT * FROM post`. You can also chain all other method to make it more complex:
```
const posts = await Post
    .orderBy('created_at', 'DESC')
    .limit(20)
    .get()
```

Both `all()` and `get()` methods return an array of the model. If you want to retrieve one single model, you can call `first()`:
```
const post = await Post.orderBy('created_at', 'DESC').first()
```
or you can call `find(id)` to get a model by its id:
```
const post = await Post.find(1)
```
All records automatically converted to an instance of the model. So if you execute `post instanceof Post`, this will return `true`.
There is no collection api in this library since `all()` and `get()` return native javascript array that you can map or do any other operations.

#### Selecting Column
To retrieve only some columns:
```
const posts = await Post.select('id, content, member_id').get()
// or
const posts = await Post.select('id', 'content', 'member_id').get()
// or
const posts = await Post
    .select('id', 'content')
    .select('member_id')
    .get()
```

#### Hiding Column By Default
If you want to hide some columns by default when querying select, you can accomplish by specifying what columns to hide in `setHidden` method:
```
class Post extends Model {
    init {
        this.setHidden('updated_at, deleted_at')
    }
}
```
That will hide updated_at and deleted_at columns from the result.

#### Where
At this time, eloquify can do the following:
```
const posts = await Post.where({ member_id: 10 }).get()
// Equivalent of `SELECT * FROM post WHERE member_id = 10`.
```
```
const posts = await Post.whereNot({ member_id: 10, is_public: 1 }).get()
// Equivalent of `SELECT * FROM post WHERE member_id != 10 AND is_public != 1`.
```
```
const posts = await Post.whereIn('id', [1, 2, 3]).get()
// Equivalent of `SELECT * FROM post WHERE id IN(1,2,3)`.
```
```
const posts = await Post.whereLike('content', '%world%').get()
// or
const posts = await Post.whereLike({ content: '%world%' }).get()
// Equivalent of `SELECT * FROM post WHERE content LIKE '%world%'`.
```
```
const posts = await Post.whereNull('member_id').get()
// Equivalent of `SELECT * FROM post WHERE member_id IS NULL`.
```
```
const posts = await Post.whereNotNull('member_id').get()
// Equivalent of `SELECT * FROM post WHERE member_id IS NOT NULL`.
```
```
const posts = await Post.whereRaw('created_at >= 2021-01-01').get()
// Equivalent of `SELECT * FROM post WHERE created_at >= 2021-01-01`.
```

#### Join
There are multiple ways to join a table with other table:
```
const posts = await Post.join('member on member.id = post.member_id').get()
const posts = await Post.join('member', 'member.id = post.member_id').get()
const posts = await Post.join('member', 'member.id', 'post.member_id').get()
const posts = await Post.join('member', 'member.id', '=', 'post.member_id').get()
```
You can also call the joined class instead of its table name:
```
const posts = await Post.join(Member, 'member.id = post.member_id').get()
const posts = await Post.join(Member, 'member.id', 'post.member_id').get()
const posts = await Post.join(Member, 'member.id', '=', 'post.member_id').get()
```
You can also use alias for the table:
```
const posts = await Post.join(Member.as('m'), 'm.id = post.member_id').get()
const posts = await Post.as('p').join(Member.as('m'), 'm.id', 'p.member_id').get()
```
If you use alias, all the table calls should also use the alias:
```
const posts = await Post
    .as('p')
    .select('m.id as member_id, m.name as member_name, p.content, p.created_at')
    .join(Member.as('m'), 'm.id = post.member_id')
    .where({ 'm.is_active': 1, 'p.is_public': 1 })
    .get()
```

#### Aggregate function
If you want to use any aggregate function, you have to do the following:
```
const p = await Post.select(DB.count('*')).first()
const p = await Post.select(DB.sum('viewer')).first()
const p = await Post.select(DB.min('viewer')).first()
const p = await Post.select(DB.max('viewer')).first()
const p = await Post.select(DB.avg('viewer')).first()
```
If you write `.select('count(*)')`, it will return an empty result.

#### Conditional
Eloquify supports conditional query using `when` method:
```
const p = await Post
    .when(req.body.member_id, q => {
        q.where({ member_id: member_id })
    })
    .get()
```
The function (second argument of `when` method) will be called only if the first argument is `true`. The `q` variable is an instance of QueryBuilder class that you can do sql opertaion on it. You can name it whatever you want. If you add a funtion as third argument, it will be called if the first argument is `false`.
```
const p = await Post
    .when(req.body.limit, q => q.limit(limit), q => q.limit(100))
    .get()
```

#### Other Methods
```
const p = await Post
    .select('id, content, member_id, created_at')
    .groupBy('member_id')
    .when(random, q => q.randomize(), q => q.orderBy('id', 'DESC'))
    .when(offset, q => q.limit(10, offset), q => q.limit(100))
    .get()
```

### Relationship
At this time, eloquify supports only one-to-one and one-to-many relationships. To define a relationship, call `setRelation` method inside `init` method. Inside `setRelation` method, you can call `hasOne` to create a one-to-one relationship and `hasMany` to create a one-to-many relationship. There is no inverse relationship yet.
```
class Post extends Model {
    init() {
        this.setRelation([
            { 'member': this.hasOne(Member, 'id', 'member_id') },
            { 'comments': this.hasMany(Comment, 'post_id', 'id') },
        ])
    }
}
```
`hasOne` and `hasMany` have three paramaters. The first is the model you want to relate. The second is foreign key and the last is local key. To make it clearer, take a look at the example above. On `member` relationship, the first argument is `Member` class. The second is member's primary key: `id` (key that is belongs to member table). And the third is post's foreign key: `member_id` (key that is belongs to post table). Now on `comments` relationship, the first argument is `Comment` class. The second is comment's foreign key: `post_id` (key that is belongs to comment table). And the last is post's primary key: `id` (key that is belongs to post table).
> Unlike eloquent, you have to provide all three arguments.


#### Loading Relation
By default, all related models are lazy loaded. To load a model's relation, access its property using the name of the relation:
```
const post = await Post.find(10)

// when you access relation, it returns a promise
const comments = await post.comments // hasMany returns array of models
const member = await post.member // hasOne returns a model
```
If you want to eager load relation, you may use `with` method:
```
const posts = await Post.with('comments', 'member').get()
```
To eager load relation by default, you specify it on the model:
```
class Post extends Model {
    init() {
        this.setRelation([
            { 'member': this.hasOne(Member, 'id', 'member_id') },
            { 'comments': this.hasMany(Comment, 'post_id', 'id') },
        ])
        this.with('comments', 'member')
    }
}
```
If you want to select some columns instead of all columns, you may use the following syntax:
```
const posts = await Post
    .with('comments:id,content,created_at', 'member:id,name,profile_picture')
    .get()
// comment models will only have id, content, created_at columns
// member model will only has id, name, profile_picture columns
```
To eager load a relationship's relationships, you may use `.` syntax:
```
class Post extends Model {
    init() {
        this.setRelation([
            { 'member': this.hasOne(Member, 'id', 'member_id') },
            { 'comments': this.hasMany(Comment, 'post_id', 'id') },
        ])
    }
}
class Comment extends Model {
    init() {
        this.setRelation([
            { 'member': this.hasOne(Member, 'id', 'member_id') },
        ])
    }
}
const posts = await Post
    .with('comments.member')
    .get()
// this will retrieve all posts with the comments and comment's member 
```
To specify additional query conditions for the eager loading query, pass an object to `with` function:
```
const posts = await Post
    .with({ 'comments': q => q.whereLike('content', '%world%') })
    .get()
// this will retrieve all posts with the comments containing words like %world%
```
> When using eager loading instead of lazy loading in eloquent, there is a query optimization. In eloquify, there is no query optimization yet.


#### Has And WhereHas
If you want to limit model records based on the existence of a relationship, you can use `has` method:
```
const posts = await Post.has('comments').get()
```
This will retrieve all posts that have at least one comment. You can also specify the number of the relationship:
```
const posts = await Post.has('comments', '<=', 10).get()
```
This will retrieve all posts that have zero to ten posts.
If you want to define additional query constraints on your relations, you may use `whereHas`:
```
const posts = await Post
    .whereHas('comments', q => {
        q.where({ member_id: 10 })
    })
    .get()
```
This will retrieve all posts where have at least one comment and at least one comment having member_id of 10.
```
const posts = await Post
    .whereHas('comments', q => q.whereLike('content', '%world%'), '>', 10)
    .get()
```
This will retrieve all posts where have at least ten comments and at least one comment containing words like %world%.

### Storing Data
There are two ways to store a data into the database. The first way is by calling `create` method:
```
const post = await Post.create({
    content: 'Hello world',
    member_id: 10,
    is_public: 1
})
```
`create` method returns the stored data. The second way is by creating an instance of the model and calling `save` method:
```
const post = new Post()

post.content = 'Hello world'
post.member_id = 10
post.is_public = 1

await post.save()
```

### Updating Data
To update data, you can call `update` method:
```
const post = await Post.update({ content: 'Hello bro' }, 1) 
// updates only one rows (second argument is id) => returns a model

// or
const posts = await Post.update({ content: 'Hello bro' }, { member_id: 10 }) 
// updates one or many rows (2nd argument is object of where) => returns array of models

// or
const posts = await Post.where({ member_id: 10 }).update({ content: 'Hello bro' }) 
// updates one or many rows => returns array of models

// or
const post = await Post.find(1)
await post.update({ content: 'Hello bro' }) // updates only one rows

// the following is wrong ❌ :
const posts = await Post.where({ member_id: 10 }).get()
await posts.update({ content: 'Hello bro' }) // cannot update. posts is an array

// the following is true ✅ :
const posts = await Post.where({ member_id: 10 }).get()
for (const post of posts) { // iterate over posts
    await post.update({ content: 'Hello bro' }) // updates only one rows
}
```

### Deleting Data
To delete data, you can call `delete` method:
```
await Post.delete({ id: 1 }) // deletes one or many rows
// or
await Post.whereRaw('created_at < 2021-01-01').delete() // deletes one or many rows
// or
const post = await Post.find(1)
await post.delete() // deletes only one rows

// the following is wrong ❌ :
const posts = await Post.where({ member_id: 10 }).get()
await posts.delete() // cannot delete. posts is an array

// the following is true ✅ :
const posts = await Post.where({ member_id: 10 }).get()
for (const post of posts) { // iterate over posts
    await post.delete() // deletes only one rows
}
```

You can also soft delete data. To accomplish this, your table must have a nullable, timestamp `deleted_at` column. Then in your model, call `softDelete` method:
```
class Post extends Model {
    init() {
        this.softDelete()
    }
}
```
When a model is set to use soft delete, the data is not actually removed from database when you call delete method on it. Instead, eloquify updates the `deleted_at` column to `current_timestap` on that record.

## TODO
* create connection option midleware
* whereDate, year, month
* or (orWhere, orHas, etc)
* nested has
* set primary key
* aggregate
* soft delete
* exception
