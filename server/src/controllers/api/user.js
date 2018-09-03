const route = require('koa-route')
const auth = require('@/app/auth')

const { validate } = require('@client/validator')
const validatorPrivateKey = require('@client/validator/user/private-key').default
const validatorDownloadKey = require('@client/validator/user/download-key').default

module.exports = [
    /** Upload a new private key */
    route.post('/api/user/private_key', async (ctx) => {
        const user = await auth.required(ctx)

        // Validated body
		let data = await validate(ctx.request.body, validatorPrivateKey)
        
        // Check password
        let valid = await user.verifyPassword(data.password)
        if (!valid) ctx.throw(400, 'Wrong password', { field: 'password' })

        // Set private + public key
        await user.patch({
            private_key: data.private_key,
            public_key: data.public_key,
            balance_eth: 0,
            balance_erc20: 0,
        })
        ctx.body = user.toJsonAuth()
    }),

    /** Download the private key */
    route.post('/api/user/dl_key', async (ctx) => {
        const user = await auth.required(ctx)

        // Validated body
		let data = await validate(ctx.request.body, validatorDownloadKey)
        
        // Check password
        let valid = await user.verifyPassword(data.password)
        if (!valid) ctx.throw(400, 'Wrong password', { field: 'password' })

        ctx.body = { private_key: user.private_key }
    }),
]
