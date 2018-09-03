// Key generator: http://www.allkeysgenerator.com/Random/Security-Encryption-Key-Generator.aspx

module.exports = {
    key: 'data', // Cookie's name
    maxAge: 0, // Browser's session
    renew: 3600, // 1 hour
    maxLength: 1024, // Max data length inside the cookie
    secret: 'VmYq3t6w9y$B&E)H@McQfTjWnZr4u7x!A%C*F-JaNdRgUkXp2s5v8y/B?E(G+KbPeShVmYq3t6w9z$C&', // At least 32 char long, the most important key here
    encrypt: { // false to disable
        algo: 'aes-256-cbc',
        password: 'eThWmZq4t7w!z%C*F-JaNcRfUjXn2r5u', // 128 bits
    },
}
