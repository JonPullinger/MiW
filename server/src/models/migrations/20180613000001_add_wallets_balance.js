exports.up = function(knex, Promise) {
    return knex.schema.table('wallets', t => {
        t.decimal('balance', 50, 18).notNull().defaultTo(0)
    })
}

exports.down = function(knex, Promise) {
    return knex.schema.table('wallets', t => {
        t.dropColumn('balance')
    })
}
