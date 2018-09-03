<template>
	<div>
		<crud-index
			ref="crud"
			baseUrl="/"
			api="transfers"
			:columns="columns"
			:paginate="true"
			:no-action-buttons="true">
			<div slot="header" class="header">
				<div class="header__menu">
					<!-- Account has a private key -->
					<template v-if="user.has_private_key">
						<ui-button @click="send_money_open = true" color="primary">Send money</ui-button>
						<ui-button title="Download my private key" @click="download_key_open = true"><span class="icon icon-download"></span></ui-button>
						<ui-button title="Replace my private key" @click="upload_key_open = true"><span class="icon icon-upload"></span></ui-button>
					</template>
					<template v-else>
						<ui-button @click="upload_key_open = true" color="warning"><span class="icon icon-upload"></span> Upload your private key to make online transactions</ui-button>
					</template>
					
					<auth-logout></auth-logout>
				</div>
				
				<div class="header__profile">
					<logo style="height: 32px;width: 32px;margin-right: 10px"></logo>
					<div>
						<div>{{ user.balance_eth | erc20 }} ETH</div>
						<div>{{ user.balance_erc20 | erc20 }} {{ erc20_symbol }}</div>
					</div>
					<div>
						<div v-if="eth_value">around ${{ user.balance_eth * eth_value | usd }}</div>
						<div v-else></div>
						<div v-if="erc20_value">around ${{ user.balance_erc20 * erc20_value | usd }}</div>
						<div v-else></div>
					</div>
					<div>
						<div>Public address: {{ user.public_key }}</div>
					</div>
				</div>
			</div>
		</crud-index>

		<!-- Modals -->
		<modal-send-money v-if="send_money_open" @close="success => { send_money_open = false; success_open = success }"></modal-send-money>
		<modal-upload-key v-if="upload_key_open" @close="upload_key_open = false"></modal-upload-key>
		<modal-success v-if="success_open" @close="success_open = false"></modal-success>
		<modal-download-key v-if="download_key_open" @close="download_key_open = false"></modal-download-key>
	</div>
</template>

<script>
export default {
	data: () => ({
		send_money_open: false,
		upload_key_open: false,
		success_open: false,
		download_key_open: false,
		refresh_interval: 0,
		token_values: [],
	}),
	computed: {
		columns() {
			let my_public_key = this.$store.state.auth.user.public_key
			return [{
				title: 'Date',
				value: t => {
					let d = new Date(t.created_at)
					return d.toLocaleDateString('en-EN') + ' ' + d.toLocaleTimeString('en-EN')
				},
			}, {
				title: 'Action',
				value: t => t.from === my_public_key ? 'sent' : 'received',
			}, {
				title: 'Amount',
				value: t => this.$options.filters.erc20(t.amount) + ' ' + t.symbol,
			}, {
				title: 'Address',
				value: t => t.from === my_public_key ? t.to : t.from,
				size: 2,
			}]
		},
		user() {
			return this.$store.state.auth.user
		},
		erc20_symbol() {
			return this.$store.state.boot.config.erc20.symbol
		},
		eth_value() {
			let res = this.token_values.find(v => v.symbol === 'ETH')
			return res ? res.price_usd : false
		},
		erc20_value() {
			let res = this.token_values.find(v => v.symbol === this.erc20_symbol)
			return res ? res.price_usd : false
		},
	},
	created() {
		this.refresh_interval = setInterval(this.reload, 20 * 60 * 1000) // Every 20min
		this.reloadTokenValues()
	},
	destroyed() {
		clearInterval(this.refresh_interval)
	},
	methods: {
		reload() {
			this.$refs.crud.load(this.$route.query.page || 1)
			this.reloadTokenValues()
		},
		reloadTokenValues() {
			this.$http.get('token_values').then(
				res => this.token_values = res.data,
				err => console.error(err)
			)
		},
	},
	watch: {
		// Public key changed, reload
		'$store.state.auth.user.public_key'() {
			this.$refs.crud.load(1)
		},
	},
	components: {
		crudIndex: require('@/ui/crud/index').default,
		authLogout: require('@/auth/ui/logout').default,
		modalSendMoney: require('@/ui/modals/send-money').default,
		modalUploadKey: require('@/ui/modals/upload-key').default,
		modalSuccess: require('@/ui/modals/success').default,
		modalDownloadKey: require('@/ui/modals/download-key').default,
		uiButton: require('@/ui/button').default,
		logo: require('@/assets/logo.svg'),
	},
}
</script>

<style lang="scss">
@import "~@/sass/variables";

.header {
	margin: $spacer;

	&__profile {
		> div {
			vertical-align: top;
			display: inline-block;

			&:last-child {
				padding-left: $spacer;
			}
			&:first-child {
				text-align: right;
			}
		}
	}
	&__menu {
		float: right;
	}
}

// Fix scroll
html, body, body > div:nth-child(2), body > div:nth-child(2) > div {
	overflow: hidden;
    height: 100%;
}
</style>