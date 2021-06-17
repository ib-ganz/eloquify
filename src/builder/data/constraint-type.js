const Model = {
    TABLE_NAME: 'table_name',
    PRIMARY_KEY: 'primary_key',
    COLUMNS: 'columns',
    HIDDEN: 'hidden',
    SOFT_DELETE: 'soft_delete',
}

const Query = {
    AS: 'as',
    SELECT: 'select',
    JOIN: 'join',
    WHERE: 'where',
    GROUP_BY: 'group_by',
    ORDER_BY: 'order_by',
    LIMIT: 'limit',
    WITH: 'with',
    WITH_TRASHED: 'with_trashed',
    ONLY_TRASHED: 'only_trashed',
}

const Relation = {
    CHILDREN: 'children',
    PARENT: 'parent',
}

const Execution = {
    COMPILER: 'compiler',
    QUERY_EXECUTOR: 'query_executor',

    QUERY: 'query',
    SELECTION: 'selection',
    SHOW_QUERY: 'show_query',
    SHOW_QUERY_THREAD: 'show_query_thread',

    CREATE: 'create',
    CREATE_NEXT_ID: 'create_next_id',
    UPDATE: 'update'
}

const Selection = {
    SINGLE: 'single',
    MULTIPLE: 'multiple'
}

module.exports = {
    Model,
    Query,
    Relation,
    Execution,
    Selection
}