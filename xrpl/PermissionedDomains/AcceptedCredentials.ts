import { Client } from "xrpl"

async function inspectDomain() {
  const client = new Client("wss://s.devnet.rippletest.net:51233")
  await client.connect()
  const DOMAIN_ID = "" //이곳에 확인하려는 Domain ID 넣기
  const r = await client.request({ command: "ledger_entry", index: DOMAIN_ID })
  console.log(JSON.stringify(r, null, 2))
  await client.disconnect()
}
inspectDomain().catch(console.error)
