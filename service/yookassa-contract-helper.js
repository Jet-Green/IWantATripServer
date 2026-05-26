function yookassaAccountId(contractOrEmbedded) {
  if (!contractOrEmbedded) return ''
  const y = contractOrEmbedded.yookassa
  if (y?.account_id) return String(y.account_id).trim()
  if (y?.accountId) return String(y.accountId).trim()
  if (y?.shopId) return String(y.shopId).trim()
  if (contractOrEmbedded.yookassaAccountId) {
    return String(contractOrEmbedded.yookassaAccountId).trim()
  }
  return ''
}

module.exports = { yookassaAccountId }
