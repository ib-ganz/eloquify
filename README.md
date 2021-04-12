## Eloquify
This small library is Eloquent-like orm for node which is inspired by laravel's [eloquent](https://laravel.com/docs/8.x/eloquent) orm. If you switch from laravel project to node project, you will lose all of the eloquent's features. You can use this library as an alternative to query your database in an eloquent way. Like any other node orm, eloquify uses `promise`.

### Setup
Just copy paste the whole code and you're good to go.

### Getting Started

#### Creating Model
Model class is just an advanced query builder, so you can perform some sql operations on it. To create a model, you can create a `class` that extends `Model`. 
```
class Post extends Model {

}
```
This class will be automatically associated with table named `post` in your database. 
> Note: this behaviour is different from what eloquent does. Eloquent considers "snake case", plural name of the class will be used as the table name if not specified explicitly.

If you want to change the name of the associated table, you can call `setTable` method inside `init` method.
```
class Post extends Model {
    init {
        this.setTable('posts')
    }
}
```
At this time, all tables in your database should have primary key named `id`. This is for generating next id when you create a new row in your table. Changing the name of the primary key has not supported yet.

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

#### Selecting column
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

#### Where
At this time, eloquify can do the following:
```
const posts = await Post.where({ member_id: 10 }).get()
```
Equivalent of `SELECT * FROM post WHERE member_id = 10`.
```
const posts = await Post.whereNot({ member_id: 10 }).get()
```
Equivalent of `SELECT * FROM post WHERE member_id != 10`.
```
const posts = await Post.whereIn('id', [1, 2, 3]).get()
```
Equivalent of `SELECT * FROM post WHERE id IN(1,2,3)`.
```
const posts = await Post.whereLike('content', '%world%').get()
// or
const posts = await Post.whereLike({ content: '%world%' }).get()
```
Equivalent of `SELECT * FROM post WHERE content LIKE '%world%'`.

### Join
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
    .where({ 'm.is_active': 1 })
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
If you write `.select('count(*)')`, that will result an empty result

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
