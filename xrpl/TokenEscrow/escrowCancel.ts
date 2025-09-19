import { Client, Wallet, Transaction } from "xrpl"
import path from "path"
import dotenv from "dotenv"
dotenv.config({ path: path.join(process.cwd(), ".env") })

export async function escrowCancel() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()

  // 연결 후 지갑 로드
  const USER_SEED  = process.env.USER_SEED!   // Escrow 소스(User)

  const ownerWallet    = Wallet.fromSeed(USER_SEED)   // Escrow 소스이자 Cancel 실행 주체

  try {
    // EscrowCreate 스크립트 실행 후 콘솔에 출력된 Sequence 값
    const OFFER_SEQUENCE = 

    const tx: Transaction = {
      TransactionType: "EscrowCancel",
      Account: ownerWallet.address, // Cancel 실행자 (Escrow 소스, 타겟, 제3자 모두 가능)
      Owner: ownerWallet.address,       // Escrow 소스 주소
      OfferSequence: OFFER_SEQUENCE
    }

    const prepared = await client.autofill(tx)
    const signed = ownerWallet.sign(prepared) // Cancel 실행자가 서명
    const result = await client.submitAndWait(signed.tx_blob)

    console.log(JSON.stringify(result, null, 2))
    return result
  } finally {
    await client.disconnect()
  }
}

if (require.main === module) {
  escrowCancel().catch(e => { console.error(e); process.exit(1) })
}
