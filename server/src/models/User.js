const { Model } = require('objection')
const Transfer = require('./Transfer')
const bcrypt = require('bcrypt-nodejs')

module.exports = class User extends Model {
	static tableName = 'users'

	/** Json data return when authed */
	toJsonAuth() {
		return {
			id: this.id,
			public_key: this.public_key,
			has_private_key: !!this.private_key,
			balance_eth: this.balance_eth || 0,
			balance_erc20: this.balance_erc20 || 0,
		}
	}

	async $beforeInsert(context) {
		await super.$beforeInsert(context)

		this.created_at = new Date()
		
		// Password hash
		await this.generateHash()

		//TODO: encrypt private key
	}

	async $beforeUpdate(queryOptions, context) {
		await super.$beforeUpdate(queryOptions, context)

		this.updated_at = new Date()
		
		// Password not to update
		if (queryOptions.patch && this.password === undefined) {
			return
		}

		// Hash the password
		await this.generateHash()

		//TODO: decrypt private key, re-encrypt
	}

	/**
	 * Compares a password to it's hash
	 * @param  {String}             password  the password...
	 * @return {Promise.<Boolean>}            whether or not the password was verified
	 */
	verifyPassword(password) {
		return new Promise((resolve, reject) => {
			bcrypt.compare(password + '', this.password + '', (err, res) => {
				if (err) reject(err)
				resolve(res)
			})
		})
	}

	/**
	 * Hash password field
	 * @return {Promise.<(String|void)>}  returns the hash or null
	 */
	generateHash() {
		// Aweful bcrypt
		return new Promise((resolve, reject) => {
			if (!this.password) return resolve()
			bcrypt.genSalt(12, (err, salt) => {
				if (err) return reject(err)
				bcrypt.hash(this.password + '', salt, null, (err, hash) => {
					if (err) return reject(err)
					this.password = hash
					resolve()
				})
			})
		})
	}

	static relationMappings = {
		lastSentTransfer: {
			relation: Model.HasOneRelation,
			modelClass: Transfer,
			join: {
				from: 'users.public_key',
				to: 'transfers.from',
			},
		},
		lastReceivedTransfer: {
			relation: Model.HasOneRelation,
			modelClass: Transfer,
			join: {
				from: 'users.public_key',
				to: 'transfers.to',
			},
		},
	}
}
