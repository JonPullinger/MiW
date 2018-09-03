const route = require('koa-route')
const Wallet = require('@/models/User')
const TokenValue = require('@/models/TokenValue')
const axios = require('axios')
const querystring = require('querystring')
const config = require('@/configs/app')
const stream = require('stream')

// Array to csv text
const toCsv = data => {
    let res = ''
    data.forEach((d, i) => {
        if (i !== 0) res += ','
        if (d === null || d === undefined) d = ''
        res += '"' + (d + '').replace(/"/g, '""') + '"'
    })
    res += '\n'
    return res
}

module.exports = [
    // App
    route.get('/', async (ctx) => {
        await ctx.render('index', { config })
    }),

    /** List wallets */
    route.get('/wallets', async (ctx) => {
        let wallets = await Wallet.query().eager(`[
            lastSentTransfer(ETH) as lastETHSentTransfer,
            lastSentTransfer(ERC20) as lastERC20SentTransfer,
            lastReceivedTransfer(ETH) as lastETHReceivedTransfer,
            lastReceivedTransfer(ERC20) as lastERC20ReceivedTransfer
        ]`)
        let token_values = await TokenValue.query()
        token_values = token_values.reduce((res, v) => {
            res[v.symbol] = v
            return res
        }, {})

        await ctx.render('wallets', {
            title: 'wallets',
            config,
            wallets,
            token_values,
        })
    }),

    // Temp page to test refresh
    route.get('/refresh', async (ctx) => {
        const { reload } = require('@/app/ether')
        await reload(false)
        ctx.body = '<title>' + config.title + ' - refresh all</title><div style="font-size:40px; padding:14px 18px;">✅</div>'
    }),

    /** CSV export */
    route.get('/export/csv', async (ctx) => {
        let output = ctx.body = new stream.PassThrough()
        ctx.attachment('wallets.csv')
        ctx.flushHeaders()

        // Load models
        Promise.all([
            Wallet.query().eager(`[
                lastSentTransfer(ETH) as lastETHSentTransfer,
                lastSentTransfer(ERC20) as lastERC20SentTransfer,
                lastReceivedTransfer(ETH) as lastETHReceivedTransfer,
                lastReceivedTransfer(ERC20) as lastERC20ReceivedTransfer
            ]`),
            TokenValue.query()
        ]).then(models => {
            let wallets = models[0]

            // Convert to currency => model
            let token_values = models[1].reduce((res, v) => {
                res[v.symbol] = v
                return res
            }, {})
            let erc20 = config.erc20.symbol

            // Header
            output.write(toCsv([
                'created at', 'address', 'ETH', 'ETH (USD)', erc20, `${erc20} (USD)`,
                `last ${erc20} transfer sent address`, `last ${erc20} transfer sent amount`,
                `last ${erc20} transfer received address`, `last ${erc20} transfer received amount`,
                'last ETH transfer sent address', 'last ETH transfer sent amount',
                'last ETH transfer received address', 'last ETH transfer received amount',
                'ip', 'email',
            ]))

            // Write csv
            for (let wallet of wallets) {
                let txs1 = wallet.lastERC20SentTransfer
                let txr1 = wallet.lastERC20ReceivedTransfer
                let txs2 = wallet.lastETHSentTransfer
                let txr2 = wallet.lastETHReceivedTransfer

                output.write(toCsv([
                    wallet.created_at,
                    wallet.public_key,
                    wallet.balance_eth,
                    token_values.ETH ? (wallet.balance_eth * token_values.ETH.price_usd).toFixed(2) : '',
                    wallet.balance_erc20,
                    token_values[erc20] ? (wallet.balance_erc20 * token_values[erc20].price_usd).toFixed(2) : '',
                    txs1 && txs1.id ? txs1.to : '',
                    txs1 && txs1.id ? txs1.amount : '',
                    txr1 && txr1.id ? txr1.to : '',
                    txr1 && txr1.id ? txr1.amount : '',
                    txs2 && txs2.id ? txs2.to : '',
                    txs2 && txs2.id ? txs2.amount : '',
                    txr2 && txr2.id ? txr2.to : '',
                    txr2 && txr2.id ? txr2.amount : '',
                    wallet.ip,
                    wallet.username,
                ]))
            }
            output.end()
        }).catch(err => {
            output.destroy(err + '')
        })
    }),
]
